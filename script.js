console.log("Observer script loaded successfully.");

// Hardware-accelerated scroll reveal observer
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1 // Triggers when 10% of the element is visible
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Add active class to trigger the CSS transition
      entry.target.classList.add('active');
      // Unobserve to prevent unnecessary calculations once revealed
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all elements with the .scroll-reveal class
document.querySelectorAll('.scroll-reveal').forEach(element => {
  observer.observe(element);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      // Offset for the sticky nav so it doesn't overlap section titles
      const headerOffset = 60;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});