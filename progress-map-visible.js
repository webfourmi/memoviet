(() => {
  'use strict';

  function attachJourneyToHome() {
    const home = document.getElementById('mvHomeHub');
    const panel = document.getElementById('mvJourneyPanel');
    if (!home || !panel) return;

    if (panel.parentElement !== home) home.append(panel);
    panel.dataset.mvUxView = 'home';
    panel.classList.remove('mv-ux-hidden', 'mv-ux-section', 'mv-page-hub');
    panel.hidden = false;
  }

  function refresh() {
    attachJourneyToHome();
    setTimeout(attachJourneyToHome, 120);
  }

  function init() {
    refresh();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvVisibleTimer);
      observer._mvVisibleTimer = setTimeout(refresh, 120);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
