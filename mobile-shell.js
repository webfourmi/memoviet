(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';
  const UX_KEY = 'memoviet_ux_state_v2';
  const $ = id => document.getElementById(id);
  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  function normalizeSavedView() {
    try {
      const state = JSON.parse(localStorage.getItem(UX_KEY) || '{}');
      if (state.view === 'speak') {
        state.view = 'learn';
        localStorage.setItem(UX_KEY, JSON.stringify(state));
      }
    } catch {}
  }

  function installBrand() {
    if (!isMobile()) return;
    let brand = $('mvMobileBrand');
    if (!brand) {
      brand = document.createElement('header');
      brand.id = 'mvMobileBrand';
      brand.className = 'mv-mobile-brand';
      brand.innerHTML = '<strong>VietMemo</strong>';
    }

    const shared = $('mvSharedAdventureBar');
    const main = document.querySelector('main');
    if (shared) {
      if (brand.nextElementSibling !== shared) shared.insertAdjacentElement('beforebegin', brand);
    } else if (main && brand.parentElement !== document.body) {
      main.insertAdjacentElement('beforebegin', brand);
    } else if (!brand.isConnected) {
      document.body.prepend(brand);
    }
  }

  function configureNavigation() {
    if (!isMobile()) return;
    const nav = $('mvUxNav');
    if (!nav) return;

    nav.querySelector('[data-mv-view="speak"]')?.remove();

    const config = nav.querySelector('[data-mv-view="more"]');
    if (config) {
      config.setAttribute('aria-label', 'Configuration');
      const icon = config.querySelector('span');
      const label = config.querySelector('small');
      if (icon) icon.textContent = '⚙️';
      if (label) label.textContent = 'Configuration';
    }

    const speakHub = $('mvSpeakHub');
    if (speakHub) speakHub.dataset.mvUxView = 'learn';

    const activeSpeak = nav.querySelector('[data-mv-view="speak"].active');
    if (activeSpeak) nav.querySelector('[data-mv-view="learn"]')?.click();
  }

  function simplifyHome() {
    if (!isMobile()) return;
    document.body.classList.add('mv-mobile-app');

    const home = $('mvHomeHub');
    if (home) home.classList.add('mv-mobile-home-actions');

    document.querySelectorAll('.hero').forEach(hero => hero.classList.add('mv-mobile-original-hero'));

    const panel = $('mvJourneyPanel');
    if (panel && !panel.dataset.mvMobileDefaultTab) {
      panel.dataset.mvMobileDefaultTab = 'map';
      const mapTab = panel.querySelector('[data-journey-tab="map"]');
      if (mapTab) setTimeout(() => mapTab.click(), 0);
    }
  }

  function refresh() {
    if (!isMobile()) return;
    normalizeSavedView();
    installBrand();
    configureNavigation();
    simplifyHome();
  }

  function init() {
    refresh();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvMobileTimer);
      observer._mvMobileTimer = setTimeout(refresh, 100);
    });
    observer.observe(document.body, {childList:true, subtree:true});

    window.matchMedia(MOBILE_QUERY).addEventListener?.('change', refresh);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
