(() => {
  'use strict';

  const MAP_ASSET = 'assets/vietnam-map-watercolor.svg?v=31';
  const POSITIONS = [
    [46.24,17.43],[45.95,21.97],[56.82,17.68],[30.27,8.63],[42.08,6.56],[46.98,9.20],
    [38.56,19.44],[55.65,42.53],[61.52,44.87],[60.53,44.11],[59.71,45.72],[45.16,37.09],
    [62.21,65.45],[68.40,62.62],[68.27,54.65],[58.58,62.25],[46.81,73.52],[45.08,72.00],
    [39.22,79.29],[39.37,78.28],[44.87,76.77],[32.61,75.15],[21.31,77.85],[48.38,84.51],
    [61.37,70.88],[41.66,71.39],[45.32,21.97],[53.19,7.81],[35.01,7.80],[34.70,18.19]
  ];

  let directImagePromise = null;

  function readEmbeddedImage() {
    if (directImagePromise) return directImagePromise;
    directImagePromise = fetch(MAP_ASSET, {cache: 'reload'})
      .then(response => {
        if (!response.ok) throw new Error(`Carte introuvable (${response.status})`);
        return response.text();
      })
      .then(svgText => {
        const match = svgText.match(/href=["'](data:image\/(?:webp|jpeg|jpg|png);base64,[^"']+)["']/i);
        if (!match) throw new Error('Image aquarelle absente du fichier SVG');
        return match[1];
      });
    return directImagePromise;
  }

  function setTab(tabName) {
    const panel = document.getElementById('mvJourneyPanel');
    if (!panel) return;

    const progressButton = panel.querySelector('[data-journey-tab="progress"]');
    const mapButton = panel.querySelector('[data-journey-tab="map"]');
    const progressView = document.getElementById('mvJourneyProgress');
    const mapView = document.getElementById('mvJourneyMap');
    if (!progressButton || !mapButton || !progressView || !mapView) return;

    const showMap = tabName === 'map';
    progressButton.hidden = false;
    mapButton.hidden = false;
    progressButton.classList.toggle('active', !showMap);
    progressButton.setAttribute('aria-selected', String(!showMap));
    mapButton.classList.toggle('active', showMap);
    mapButton.setAttribute('aria-selected', String(showMap));
    progressView.hidden = showMap;
    mapView.hidden = !showMap;
  }

  function repairTabs() {
    const tabs = document.querySelector('#mvJourneyPanel .mv-journey-tabs');
    if (!tabs) return;

    const progressButton = tabs.querySelector('[data-journey-tab="progress"]');
    const mapButton = tabs.querySelector('[data-journey-tab="map"]');
    if (!progressButton || !mapButton) return;

    progressButton.hidden = false;
    mapButton.hidden = false;
    progressButton.style.removeProperty('display');
    mapButton.style.removeProperty('display');

    if (!tabs.dataset.mvReliableTabs) {
      tabs.dataset.mvReliableTabs = 'true';
      tabs.addEventListener('click', event => {
        const button = event.target.closest('[data-journey-tab]');
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        setTab(button.dataset.journeyTab);
      }, true);
    }
  }

  function positionPins(map) {
    map.querySelectorAll('.mv-map-pin[data-place-index]').forEach(pin => {
      const index = Number(pin.dataset.placeIndex);
      const position = POSITIONS[index];
      if (!position) return;
      pin.style.setProperty('--pin-x', `${position[0]}%`);
      pin.style.setProperty('--pin-y', `${position[1]}%`);
    });
  }

  function installWatercolorMap() {
    repairTabs();

    const map = document.querySelector('#mvJourneyMap .mv-vietnam-map');
    if (!map) return;

    let image = map.querySelector('.mv-watercolor-map-image');
    if (!image) {
      image = document.createElement('img');
      image.className = 'mv-watercolor-map-image';
      image.alt = 'Carte aquarelle du Vietnam';
      image.decoding = 'async';
      image.loading = 'eager';
      image.draggable = false;
      map.prepend(image);
    }

    if (!image.dataset.mvDirectSourceLoading && !image.dataset.mvDirectSourceReady) {
      image.dataset.mvDirectSourceLoading = 'true';
      readEmbeddedImage()
        .then(source => {
          image.onload = () => {
            image.dataset.mvDirectSourceReady = 'true';
            delete image.dataset.mvDirectSourceLoading;
            map.querySelector('svg')?.classList.add('mv-old-map-hidden');
          };
          image.onerror = () => {
            delete image.dataset.mvDirectSourceLoading;
            image.src = MAP_ASSET;
          };
          image.src = source;
        })
        .catch(() => {
          delete image.dataset.mvDirectSourceLoading;
          image.src = MAP_ASSET;
        });
    }

    positionPins(map);
  }

  function refresh() {
    repairTabs();
    installWatercolorMap();
  }

  function init() {
    refresh();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvWatercolorTimer);
      observer._mvWatercolorTimer = setTimeout(refresh, 80);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();