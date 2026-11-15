#!/usr/bin/env node
/**
 * ratelimit-engine CLI
 * Setup wizard — generates ratelimit.config.js for your project.
 * Usage: npx ratelimit-engine
 */

import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'

// ── ANSI colours ──────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
}

const bold    = (s) => `${C.bold}${s}${C.reset}`
const dim     = (s) => `${C.dim}${s}${C.reset}`
const green   = (s) => `${C.green}${s}${C.reset}`
const cyan    = (s) => `${C.cyan}${s}${C.reset}`
const yellow  = (s) => `${C.yellow}${s}${C.reset}`
const magenta = (s) => `${C.magenta}${s}${C.reset}`
const blue    = (s) => `${C.blue}${s}${C.reset}`

// ── Readline helpers ──────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()))
  })
}

async function askNumber(label, defaultVal) {
  const raw = await ask(`  ${label} ${dim(`[${defaultVal}]`)}: `)
  const num = parseInt(raw, 10)
  return isNaN(num) || num <= 0 ? defaultVal : num
}

async function askChoice(choices) {
  choices.forEach((c, i) => {
    console.log(`  ${bold(cyan(String(i + 1)))}. ${bold(c.label.padEnd(18))} ${dim(c.desc)}`)
  })
  const raw = await ask(`\n  Pick [1-${choices.length}]: `)
  const idx = parseInt(raw, 10) - 1
  if (isNaN(idx) || idx < 0 || idx >= choices.length) return choices[0]
  return choices[idx]
}

// ── Algorithm definitions ─────────────────────────────────────────
const ALGORITHMS = [
  { key: 'TokenBucket',   label: 'Token Bucket',   desc: 'Burst-friendly — refills tokens over time' },
  { key: 'FixedWindow',   label: 'Fixed Window',   desc: 'Simple counter per time window' },
  { key: 'SlidingWindow', label: 'Sliding Window', desc: 'Smooth rolling window, no boundary spikes' },
  { key: 'LeakyBucket',   label: 'Leaky Bucket',   desc: 'Strict output rate, drops excess' },
  { key: 'Composite',     label: 'Composite',      desc: 'Combine two algorithms (ALL / ANY)' },
]

const STORES = [
  { key: 'MemoryStore', label: 'Memory',  desc: 'In-process store — single instance' },
  { key: 'RedisStore',  label: 'Redis',   desc: 'Distributed store — multi-instance / clustered' },
]

const FRAMEWORKS = [
  { key: 'express',  label: 'Express',  desc: 'app.use(limiter.express())' },
  { key: 'fastify',  label: 'Fastify',  desc: 'fastify.addHook("onRequest", limiter.fastify())' },
  { key: 'manual',   label: 'Manual',   desc: 'limiter.check(ctx) — any framework' },
]

const KEY_STRATEGIES = [
  { key: 'byIP',               label: 'By IP',         desc: 'One counter per client IP (default)' },
  { key: 'byUser',             label: 'By User',        desc: 'One counter per authenticated user' },
  { key: 'byRoute',            label: 'By Route',       desc: 'One counter per URL path' },
  { key: 'compositeResolver',  label: 'IP + Route',     desc: 'Separate counter per IP+route combination' },
]

// ── Config collectors ─────────────────────────────────────────────
async function collectAlgoConfig(key) {
  switch (key) {
    case 'TokenBucket': {
      const capacity   = await askNumber('Token bucket capacity (burst size)', 100)
      const refillRate = await askNumber('Refill rate (tokens/sec)', 10)
      return { capacity, refillRate }
    }
    case 'FixedWindow':
    case 'SlidingWindow': {
      const limit    = await askNumber('Max requests per window', 100)
      const windowMs = (await askNumber('Window size (seconds)', 60)) * 1000
      return { limit, windowMs }
    }
    case 'LeakyBucket': {
      const capacity = await askNumber('Queue capacity (max queued requests)', 100)
      const leakRate = await askNumber('Leak rate (requests/sec)', 10)
      return { capacity, leakRate }
    }
    case 'Composite': {
      console.log(`\n  ${bold('Primary algorithm:')}\n`)
      const primary = await askChoice(ALGORITHMS.filter((a) => a.key !== 'Composite'))
      const primaryConfig = await collectAlgoConfig(primary.key)

      console.log(`\n  ${bold('Secondary algorithm:')}\n`)
      const secondary = await askChoice(ALGORITHMS.filter((a) => a.key !== 'Composite'))
      const secondaryConfig = await collectAlgoConfig(secondary.key)

      console.log(`\n  ${bold('Composite mode:')}\n`)
      const mode = await askChoice([
        { key: 'ALL', label: 'ALL', desc: 'Both algorithms must allow the request' },
        { key: 'ANY', label: 'ANY', desc: 'At least one algorithm must allow the request' },
      ])

      return { primary: { key: primary.key, config: primaryConfig }, secondary: { key: secondary.key, config: secondaryConfig }, mode: mode.key }
    }
    default:
      return {}
  }
}

// ── Code generators ───────────────────────────────────────────────
function algoArgs(key, config) {
  switch (key) {
    case 'TokenBucket':
      return `{ capacity: ${config.capacity}, refillRate: ${config.refillRate} }`
    case 'FixedWindow':
    case 'SlidingWindow':
      return `{ limit: ${config.limit}, windowMs: ${config.windowMs} }`
    case 'LeakyBucket':
      return `{ capacity: ${config.capacity}, leakRate: ${config.leakRate} }`
    default:
      return '{}'
  }
}

function generateConfig({ algoKey, algoConfig, storeKey, frameworkKey, keyStrategyKey, failOpen = true, customOnBlocked = null }) {
  const isRedis     = storeKey === 'RedisStore'
  const isComposite = algoKey === 'Composite'

  const imports = isComposite
    ? [algoKey, algoConfig.primary.key, algoConfig.secondary.key]
    : [algoKey]

  const allImports = [...new Set(['createLimiter', ...imports, storeKey, keyStrategyKey])]

  const redisImport  = isRedis ? `\nimport Redis from 'ioredis'` : ''
  const redisClient  = isRedis ? `\nconst redis = new Redis() // configure your Redis connection\n` : ''
  const storeInit    = isRedis
    ? `new RedisStore({ client: redis })`
    : `new MemoryStore()`

  let algoInit
  if (isComposite) {
    const { primary, secondary, mode } = algoConfig
    algoInit = `new Composite({
  algorithms: [
    new ${primary.key}(${algoArgs(primary.key, primary.config)}),
    new ${secondary.key}(${algoArgs(secondary.key, secondary.config)}),
  ],
  mode: COMPOSITE_MODES.${mode},
})`
  } else {
    algoInit = `new ${algoKey}(${algoArgs(algoKey, algoConfig)})`
  }

  const compositeImport = isComposite ? `, COMPOSITE_MODES` : ''

  let frameworkUsage
  switch (frameworkKey) {
    case 'express':
      frameworkUsage = `// Express — apply globally
app.use(limiter.express())

// or per-route
app.get('/api/resource', limiter.express(), handler)`
      break
    case 'fastify':
      frameworkUsage = `// Fastify — apply globally
fastify.addHook('onRequest', limiter.fastify())

// or per-route
fastify.get('/api/resource', { onRequest: limiter.fastify() }, handler)`
      break
    case 'manual':
      frameworkUsage = `// Manual — any framework
const result = await limiter.check({
  ip:   req.ip,
  path: req.path,
  user: req.user?.id, // optional
})

if (!result.allowed) {
  return res.status(429).json({
    error:      'Too Many Requests',
    retryAfter: result.retryAfter,
  })
}`
      break
  }

  const onBlockedMsg = customOnBlocked
    ? `console.warn(\`${customOnBlocked}\`)`
    : `console.warn(\`[RATE LIMIT] \${ctx.ip} blocked — retry in \${result.retryAfter}s\`)`

  return `import { ${allImports.join(', ')}${compositeImport} } from 'ratelimit-engine'${redisImport}
${redisClient}
const limiter = createLimiter({
  algorithm: ${algoInit},
  store:     ${storeInit},
  keyBy:     ${keyStrategyKey},
  failOpen:  ${failOpen},
  onBlocked: (ctx, result) => {
    ${onBlockedMsg}
  },
})

${frameworkUsage}

export { limiter }
`
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.clear()
  console.log(`
  ${bold(cyan('⚡ ratelimit-engine'))} ${dim('— Setup Wizard')}
  ${dim('─────────────────────────────────────────────')}
  ${dim('Generates a ready-to-use ratelimit.config.js')}
  ${dim('for your project in the current directory.')}
  `)

  // Step 1 — Algorithm
  console.log(`  ${bold('Step 1 — Choose an algorithm:')}\n`)
  const algo = await askChoice(ALGORITHMS)
  console.log()
  const algoConfig = await collectAlgoConfig(algo.key)

  // Step 2 — Store
  console.log(`\n  ${bold('Step 2 — Choose a store:')}\n`)
  const store = await askChoice(STORES)
  if (store.key === 'RedisStore') {
    console.log(`\n  ${yellow('Note:')} Make sure ${bold('ioredis')} is installed: ${dim('npm install ioredis')}`)
  }

  // Step 3 — Framework
  console.log(`\n  ${bold('Step 3 — Choose your framework:')}\n`)
  const framework = await askChoice(FRAMEWORKS)

  // Step 4 — Key strategy
  console.log(`\n  ${bold('Step 4 — How should requests be keyed?')}\n`)
  const keyStrategy = await askChoice(KEY_STRATEGIES)

  // Step 5 — Custom overrides
  console.log(`\n  ${bold('Step 5 — Custom options')} ${dim('(press Enter to skip each)')}`)
  console.log(`  ${dim('Override any value before the file is written.\n')}`)

  const outputFile = await ask(`  Output filename ${dim('[ratelimit.config.js]')}: `)
  const fileName   = outputFile || 'ratelimit.config.js'

  const customOnBlocked = await ask(`  onBlocked message ${dim('[Rate limit exceeded, retry in {n}s]')}: `)
  const failOpenRaw     = await ask(`  failOpen — allow requests when store is down? ${dim('[yes]')}: `)
  const failOpen        = failOpenRaw.toLowerCase() === 'no' ? false : true

  // Generate
  const code = generateConfig({
    algoKey:        algo.key,
    algoConfig,
    storeKey:       store.key,
    frameworkKey:   framework.key,
    keyStrategyKey: keyStrategy.key,
    failOpen,
    customOnBlocked: customOnBlocked || null,
  })

  // Write file
  const outPath = path.join(process.cwd(), fileName)
  fs.writeFileSync(outPath, code, 'utf8')

  // Output
  console.log(`\n  ${dim('─────────────────────────────────────────────')}`)
  console.log(`  ${green(bold('✅ Done!'))} Generated ${bold(fileName)}\n`)
  console.log(`  ${dim('─────────────────────────────────────────────')}`)
  console.log(`\n${code}`)
  console.log(`  ${dim('─────────────────────────────────────────────')}`)
  console.log(`\n  ${bold('Next steps:')}\n`)
  console.log(`  ${cyan('1.')} Import the config into your app:`)
  console.log(`     ${dim(`import { limiter } from './${fileName}'`)}`)
  console.log(`\n  ${cyan('2.')} Wire it up — the usage snippet is inside the generated file.`)
  if (store.key === 'RedisStore') {
    console.log(`\n  ${cyan('3.')} Install ioredis if not already:`)
    console.log(`     ${dim('npm install ioredis')}`)
  }
  console.log()

  rl.close()
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`)
  rl.close()
  process.exit(1)
})
