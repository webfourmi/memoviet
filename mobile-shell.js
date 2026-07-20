(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';
  const UX_KEY = 'memoviet_ux_state_v2';
  const ALLOWED_VIEWS = new Set(['home', 'learn', 'review', 'more']);
  const $ = id => document.getElementById(id);
  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  function readState() {
    try {
      const state = JSON.parse(localStorage.getItem(UX_KEY) || '{}');
      const view = state.view === 'speak' ? 'learn' : state.view;
      return {
        ...state,
        view: ALLOWED_VIEWS.has(view) ? view : 'home',
        showAll: false
      };
    } catch {
      return {view: 'home', showAll: false, collapsed: {}};
    }
  }

  function writeState(view) {
    const state = readState();
    state.view = ALLOWED_VIEWS.has(view) ? view : 'home';
    state.showAll = false;
    localStorage.setItem(UX_KEY, JSON.stringify(state));
    return state.view;
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
    } else if (main && brand.nextElementSibling !== main) {
      main.insertAdjacentElement('beforebegin', brand);
    }
  }

  function setActiveView(view, scrollTop = true) {
    if (!isMobile()) return;
    const targetView = writeState(view === 'speak' ? 'learn' : view);

    document.querySelectorAll('[data-mv-ux-view]').forEach(section => {
      if (section.closest('#mvUxNav')) return;
      const sectionView = section.dataset.mvUxView === 'speak' ? 'learn' : section.dataset.mvUxView;
      section.classList.toggle('mv-ux-hidden', sectionView !== targetView);
    });

    const nav = $('mvUxNav');
    nav?.querySelectorAll('[data-mv-view]').forEach(button => {
      const buttonView = button.dataset.mvView === 'speak' ? 'learn' : button.dataset.mvView;
      const active = buttonView === targetView;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });

    if (scrollTop) window.scrollTo({top: 0, behavior: 'smooth'});
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

    if (!nav.dataset.mvMobileNavigationBound) {
      nav.dataset.mvMobileNavigationBound = 'true';
      nav.addEventListener('click', event => {
        const button = event.target.closest('[data-mv-view]');
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        setActiveView(button.dataset.mvView, true);
      }, true);
    }
  }

  function showDefaultMap() {
    const panel = $('mvJourneyPanel');
    if (!panel || panel.dataset.mvMobileDefaultTab) return;
    panel.dataset.mvMobileDefaultTab = 'map';

    const mapTab = panel.querySelector('[data-journey-tab="map"]');
    const progressTab = panel.querySelector('[data-journey-tab="progress"]');
    const mapView = $('mvJourneyMap');
    const progressView = $('mvJourneyProgress');

    if (mapTab && progressTab && mapView && progressView) {
      progressTab.classList.remove('active');
      progressTab.setAttribute('aria-selected', 'false');
      mapTab.classList.add('active');
      mapTab.setAttribute('aria-selected', 'true');
      progressView.hidden = true;
      mapView.hidden = false;
    }
  }

  function simplifyHome() {
    if (!isMobile()) return;
    document.body.classList.add('mv-mobile-app');
    $('mvHomeHub')?.classList.add('mv-mobile-home-actions');
    document.querySelectorAll('.hero').forEach(hero => hero.classList.add('mv-mobile-original-hero'));
    showDefaultMap();
  }

  function refresh() {
    if (!isMobile()) return;
    installBrand();
    configureNavigation();
    simplifyHome();
    setActiveView(readState().view, false);
  }

  function init() {
    refresh();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvMobileTimer);
      observer._mvMobileTimer = setTimeout(refresh, 100);
    });
    observer.observe(document.body, {childList: true, subtree: true});
    window.matchMedia(MOBILE_QUERY).addEventListener?.('change', refresh);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();