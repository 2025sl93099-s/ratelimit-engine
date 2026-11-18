/* blog.js — meme interactions */

// Two-buttons meme: press either button to trigger animation
document.querySelectorAll('[data-meme-btn]').forEach((btn) => {
  btn.addEventListener('click', () => {
    btn.classList.remove('pressed')
    void btn.offsetWidth // reflow to restart animation
    btn.classList.add('pressed')
  })
})

// Scroll reveal (reuse main.js observer — already initialised)
// Blog-specific: stagger post cards after they enter view
document.querySelectorAll('.post-card').forEach((card, i) => {
  card.style.setProperty('--delay', `${i * 60}ms`)
})
