(() => {
  'use strict';

  const PIN_POSITIONS = [
    [46.28,17.44],[45.99,21.97],[56.45,17.93],[30.30,8.65],[42.07,6.54],[46.90,9.23],
    [38.51,19.45],[55.66,42.51],[61.59,44.86],[60.55,44.09],[59.75,45.68],[45.19,37.07],
    [62.37,65.42],[68.38,62.64],[68.26,54.64],[58.57,62.27],[46.81,73.50],[45.10,71.99],
    [39.22,79.29],[39.42,78.25],[44.83,76.75],[32.57,75.14],[21.52,77.53],[48.37,84.53],
    [61.43,70.85],[41.64,71.38],[45.29,21.96],[53.16,7.83],[35.04,7.81],[34.77,18.13]
  ];

  function applyWatercolorMap() {
    const map = document.querySelector('.mv-vietnam-map');
    if (!map) return;

    let image = map.querySelector('.mv-watercolor-map-image');
    if (!image) {
      image = document.createElement('img');
      image.className = 'mv-watercolor-map-image';
      image.src = 'assets/vietnam-map-watercolor.svg';
      image.alt = 'Carte aquarelle fidèle du Vietnam, avec ses côtes et ses principales îles';
      image.decoding = 'async';
      map.prepend(image);
    }

    map.querySelector('svg')?.setAttribute('hidden', '');

    map.querySelectorAll('.mv-map-pin').forEach((pin, index) => {
      const position = PIN_POSITIONS[index];
      if (!position) return;
      pin.style.setProperty('--pin-x', `${position[0]}%`);
      pin.style.setProperty('--pin-y', `${position[1]}%`);
    });
  }

  function init() {
    applyWatercolorMap();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvWatercolorTimer);
      observer._mvWatercolorTimer = setTimeout(applyWatercolorMap, 100);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();