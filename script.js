document.addEventListener('DOMContentLoaded', () => {

  // =============================================
  // Scroll-reveal for sections
  // =============================================
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.section').forEach(s => observer.observe(s));

  // =============================================
  // Typewriter effect
  // =============================================
  const textToType = "Data Scientist / AI Engineer | Computer Vision, Chatbots & Automation";
  const typeWriterElement = document.getElementById('typewriter');
  let typeIndex = 0;

  function typeWriter() {
    if (typeIndex < textToType.length) {
      typeWriterElement.innerHTML += textToType.charAt(typeIndex);
      typeIndex++;
      setTimeout(typeWriter, 50);
    }
  }

  if (typeWriterElement) {
    setTimeout(typeWriter, 800);
  }

  // =============================================
  // Testimonials Carousel
  // =============================================
  const track    = document.getElementById('testimonialsTrack');
  const dotsWrap = document.getElementById('testimonialDots');

  if (track && dotsWrap) {
    const slides  = track.querySelectorAll('.testimonial-slide');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    let current   = 0;
    let autoTimer = null;

    // Build dots dynamically
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('testimonial-dot');
      dot.setAttribute('aria-label', `Go to review ${i + 1}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => { goTo(i); resetTimer(); });
      dotsWrap.appendChild(dot);
    });

    function getDots() { return dotsWrap.querySelectorAll('.testimonial-dot'); }

    function goTo(index) {
      const dots = getDots();
      dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots[current].classList.add('active');
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    nextBtn.addEventListener('click', () => { next(); resetTimer(); });
    prevBtn.addEventListener('click', () => { prev(); resetTimer(); });

    function startTimer() { autoTimer = setInterval(next, 4000); }
    function resetTimer()  { clearInterval(autoTimer); startTimer(); }

    // Pause auto-play on hover
    const wrapper = document.querySelector('.testimonials-wrapper');
    wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
    wrapper.addEventListener('mouseleave', startTimer);

    startTimer();
  }

  // =============================================
  // Contact Form
  // =============================================
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('formSubmitBtn');
  const feedback   = document.getElementById('formFeedback');

  if (form) {
    // Shake animation on invalid fields
    function shakeField(el) {
      el.style.animation = 'none';
      el.offsetHeight; // reflow
      el.style.animation = 'inputShake 0.4s ease';
      el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
    }

    function showFeedback(msg, type) {
      feedback.textContent = msg;
      feedback.className   = `form-feedback ${type}`;
    }

    function validate() {
      const name    = form.contactName;
      const email   = form.contactEmail;
      const reason  = form.contactReason;
      const message = form.contactMessage;
      let valid = true;

      [name, email, reason, message].forEach(f => f.style.borderColor = '');

      if (!name.value.trim()) {
        shakeField(name); name.style.borderColor = '#f87171'; valid = false;
      }
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(email.value.trim())) {
        shakeField(email); email.style.borderColor = '#f87171'; valid = false;
      }
      if (!reason.value) {
        shakeField(reason.closest('.select-wrapper'));
        reason.style.borderColor = '#f87171'; valid = false;
      }
      if (!message.value.trim()) {
        shakeField(message); message.style.borderColor = '#f87171'; valid = false;
      }

      return valid;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showFeedback('', '');

      if (!validate()) {
        showFeedback('⚠️ Please fill in all required fields correctly.', 'error');
        return;
      }

      const name    = form.contactName.value.trim();
      const email   = form.contactEmail.value.trim();
      const reason  = form.contactReason.options[form.contactReason.selectedIndex].text;
      const message = form.contactMessage.value.trim();

      // Loading state
      submitBtn.classList.add('sending');
      submitBtn.querySelector('span').textContent = 'Sending…';

      // Build mailto — works on any static site, no backend needed
      const subject = encodeURIComponent(`[Portfolio] ${reason} — from ${name}`);
      const body    = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nReason: ${reason}\n\nMessage:\n${message}`
      );
      const mailto  = `mailto:developwithzohaib@gmail.com?subject=${subject}&body=${body}`;

      // Small delay so the user sees the loading state, then open email client
      setTimeout(() => {
        window.location.href = mailto;

        // Reset button & show success
        submitBtn.classList.remove('sending');
        submitBtn.querySelector('span').textContent = 'Send Message';
        form.reset();
        showFeedback('✅ Your email client has opened — just hit send!', 'success');

        // Clear feedback after 6s
        setTimeout(() => showFeedback('', ''), 6000);
      }, 900);
    });
  }

});
