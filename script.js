document.addEventListener('DOMContentLoaded', () => {
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Select all sections to animate
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    observer.observe(section);
  });

  // Smooth scroll logic is handled by standard html{scroll-behavior: smooth}
  // But we can add a simple active state for nav if needed

  // Typewriter effect
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
    setTimeout(typeWriter, 800); // 800ms offset ensures it starts right after the fade-in runs
  }
});
