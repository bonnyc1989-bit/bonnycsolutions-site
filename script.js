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
  
  // Netlify Forms progressive enhancement (AJAX)
  const enquiryForm = document.querySelector('form[name="enquiry"]');
  const statusEl = document.getElementById('enquiryStatus');
  
  function encode(data) {
    return Object.keys(data)
      .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
      .join("&");
  }
  
  if (enquiryForm && statusEl) {
    enquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(enquiryForm);
      try {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode(Object.fromEntries(formData))
        });
        statusEl.textContent = "Thanks — your enquiry was sent.";
        enquiryForm.reset();
      } catch (err) {
        statusEl.textContent = "Couldn’t send just now. Please try again.";
      }
    });
  }
  