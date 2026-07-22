(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';
  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  function cleanMobileInterface() {
    if (!isMobile()) return;

    document.getElementById('mvMobileBrand')?.remove();

    document.querySelectorAll('.mv-shared-caption').forEach(element => element.remove());
    document.querySelectorAll('#mvSharedAdventurePicker > label').forEach(element => element.remove());

    const select = document.getElementById('mvSharedAdventureSelect');
    if (select) select.setAttribute('aria-label', 'Choisir une aventure');
  }

  function init() {
    cleanMobileInterface();

    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvCleanupTimer);
      observer._mvCleanupTimer = setTimeout(cleanMobileInterface, 80);
    });
    observer.observe(document.body, {childList: true, subtree: true});

    window.matchMedia(MOBILE_QUERY).addEventListener?.('change', cleanMobileInterface);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();