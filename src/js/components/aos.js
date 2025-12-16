/* global AOS */

let isAOSReady = false;

export function initAOS() {
  if (isAOSReady) return;

  AOS.init({
    duration: 700,
    easing: 'ease-out',
    once: false,
    offset: 150,
  });

  isAOSReady = true;
}

export function refreshAOS() {
  if (!isAOSReady) return;

 
  requestAnimationFrame(() => {
    AOS.refreshHard();
  });
}