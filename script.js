// Smooth scroll for in-page links
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        e.preventDefault();
        document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  // Set current year in footer
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Lazy-load all non-brand images by default
  document.querySelectorAll('img:not(.brand-mark)').forEach(img => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
  });
  