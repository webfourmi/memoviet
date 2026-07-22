(() => {
  'use strict';

  const POSITIONS = [
    [46.24,17.43],[45.95,21.97],[56.82,17.68],[30.27,8.63],[42.08,6.56],[46.98,9.20],
    [38.56,19.44],[55.65,42.53],[61.52,44.87],[60.53,44.11],[59.71,45.72],[45.16,37.09],
    [62.21,65.45],[68.40,62.62],[68.27,54.65],[58.58,62.25],[46.81,73.52],[45.08,72.00],
    [39.22,79.29],[39.37,78.28],[44.87,76.77],[32.61,75.15],[21.31,77.85],[48.38,84.51],
    [61.37,70.88],[41.66,71.39],[45.32,21.97],[53.19,7.81],[35.01,7.80],[34.70,18.19]
  ];

  function installWatercolorMap() {
    const map = document.querySelector('#mvJourneyMap .mv-vietnam-map');
    if (!map) return;

    let image = map.querySelector('.mv-watercolor-map-image');
    if (!image) {
      image = document.createElement('img');
      image.className = 'mv-watercolor-map-image';
      image.src = 'assets/vietnam-map-watercolor.svg';
      image.alt = 'Carte aquarelle du Vietnam';
      image.decoding = 'async';
      map.prepend(image);
    }

    map.querySelector('svg')?.classList.add('mv-old-map-hidden');

    map.querySelectorAll('.mv-map-pin[data-place-index]').forEach(pin => {
      const index = Number(pin.dataset.placeIndex);
      const position = POSITIONS[index];
      if (!position) return;
      pin.style.setProperty('--pin-x', `${position[0]}%`);
      pin.style.setProperty('--pin-y', `${position[1]}%`);
    });
  }

  function init() {
    installWatercolorMap();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvWatercolorTimer);
      observer._mvWatercolorTimer = setTimeout(installWatercolorMap, 80);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();