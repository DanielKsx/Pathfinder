export function initAOS() {
  AOS.init({
    duration: 700,
    easing: 'ease-out',
    once: true,
    offset: 150
  });

  window.addEventListener('load', () => {
    AOS.refresh();
  });
}