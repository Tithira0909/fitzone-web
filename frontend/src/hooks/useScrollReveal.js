import { useEffect, useRef } from 'react';

export default function useScrollReveal() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target); // Trigger only once
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    if (containerRef.current) {
      // Find all elements marked for reveal in this container
      const elements = containerRef.current.querySelectorAll('.reveal-item');
      elements.forEach((el) => {
        el.classList.add('reveal-hidden');
        observer.observe(el);
      });

      return () => {
        elements.forEach((el) => observer.unobserve(el));
      };
    }
  }, []);

  return containerRef;
}
