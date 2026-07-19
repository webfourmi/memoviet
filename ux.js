(() => {
  'use strict';

  const KEY = 'memoviet_ux_state_v1';
  const PAGE_SIZE = matchMedia('(max-width:700px)').matches ? 6 : 12;
  const views = [
    {id:'home', icon:'🏠', label:'Accueil', words:['accueil','tableau','progression','aujourd','objectif','sur place','voyage','démarrer']},
    {id:'learn', icon:'🌱', label:'Apprendre', words:['parcours','leçon','apprendre','bibliothèque','carte','vocabulaire','aventure','collection']},
    {id:'review', icon:'🧠', label:'Réviser', words:['réviser','révision','mémo','paires','quiz','qcm','mémoire','difficile','fragile']},
    {id:'speak', icon:'🗣️', label:'Parler', words:['dialogue','prononciation','microphone','enregistrement','écouter','audio','conversation']},
    {id:'more', icon:'⚙️', label:'Plus', words:['réglage','sauvegarde','éditeur','export','import','statistique','aide']}
  ];

  let state = loadState();
  let sections = [];

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {view: parsed.view || 'home', showAll: Boolean(parsed.showAll)};
    } catch {
      return {view:'home', showAll:false};
    }
  }

  function saveState() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function normalize(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function classify(section, index) {
    const text = normalize(`${section.id} ${section.className} ${section.querySelector('h1,h2,h3,.section-title,.eyebrow')?.textContent || ''}`);
    let best = 'more';
    let score = 0;
    views.forEach(view => {
      const hits = view.words.reduce((sum, word) => sum + (text.includes(normalize(word)) ? 1 : 0), 0);
      if (hits > score) { score = hits; best = view.id; }
    });
    if (!score && index < 2) best = 'home';
    return best;
  }

  function discoverSections() {
    const main = document.querySelector('main') || document.body;
    const candidates = [...main.children].filter(el => {
      if (!el.matches('section,article,.panel,.card,.section,.screen,.view')) return false;
      if (el.id?.startsWith('mv')) return false;
      return el.textContent.trim().length > 20;
    });

    sections = candidates.map((el, index) => {
      const view = classify(el, index);
      el.dataset.mvUxView = view;
      el.classList.add('mv-ux-section');
      compactLongLists(el);
      makeSecondaryBlocksCollapsible(el);
      return el;
    });
  }

  function compactLongLists(root) {
    const containers = [...root.querySelectorAll('.grid,.cards,.card-grid,.library-grid,.memo-grid,.pair-grid,.quiz-grid,[class*="grid"],[class*="list"]')];
    containers.forEach(container => {
      const items = [...container.children].filter(el => !el.matches('script,style,template'));
      if (items.length <= PAGE_SIZE || container.dataset.mvPaged) return;
      container.dataset.mvPaged = 'true';
      items.forEach((item, index) => item.classList.toggle('mv-ux-hidden', index >= PAGE_SIZE));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mv-ux-more-button';
      button.textContent = `Voir la suite (${items.length - PAGE_SIZE})`;
      button.addEventListener('click', () => {
        const hidden = items.filter(item => item.classList.contains('mv-ux-hidden'));
        if (hidden.length) {
          hidden.slice(0, PAGE_SIZE).forEach(item => item.classList.remove('mv-ux-hidden'));
          const remaining = items.filter(item => item.classList.contains('mv-ux-hidden')).length;
          button.textContent = remaining ? `Voir la suite (${remaining})` : 'Réduire la liste';
        } else {
          items.forEach((item, index) => item.classList.toggle('mv-ux-hidden', index >= PAGE_SIZE));
          button.textContent = `Voir la suite (${Math.max(0, items.length - PAGE_SIZE)})`;
          container.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
      container.insertAdjacentElement('afterend', button);
    });
  }

  function makeSecondaryBlocksCollapsible(root) {
    const blocks = [...root.querySelectorAll('details')];
    blocks.forEach((details, index) => {
      if (index > 0) details.open = false;
    });
  }

  function installToolbar() {
    if (document.getElementById('mvUxToolbar')) return;
    const toolbar = document.createElement('div');
    toolbar.id = 'mvUxToolbar';
    toolbar.className = 'mv-ux-toolbar';
    toolbar.innerHTML = `
      <strong>MemoViet</strong>
      <span id="mvUxTitle">Accueil</span>
      <button type="button" id="mvUxShowAll">Tout afficher</button>`;
    document.body.prepend(toolbar);

    const nav = document.createElement('nav');
    nav.id = 'mvUxNav';
    nav.className = 'mv-ux-nav';
    nav.setAttribute('aria-label', 'Navigation principale');
    nav.innerHTML = views.map(view => `
      <button type="button" data-mv-view="${view.id}" aria-label="${view.label}">
        <span>${view.icon}</span><small>${view.label}</small>
      </button>`).join('');
    document.body.append(nav);

    nav.addEventListener('click', event => {
      const button = event.target.closest('[data-mv-view]');
      if (!button) return;
      state.view = button.dataset.mvView;
      state.showAll = false;
      saveState();
      applyView(true);
    });

    document.getElementById('mvUxShowAll').addEventListener('click', () => {
      state.showAll = !state.showAll;
      saveState();
      applyView(false);
    });
  }

  function applyView(scrollTop) {
    const active = views.find(view => view.id === state.view) || views[0];
    document.getElementById('mvUxTitle').textContent = state.showAll ? 'Toutes les rubriques' : active.label;
    const showAllButton = document.getElementById('mvUxShowAll');
    showAllButton.textContent = state.showAll ? 'Vue compacte' : 'Tout afficher';

    sections.forEach(section => {
      section.classList.toggle('mv-ux-hidden', !state.showAll && section.dataset.mvUxView !== active.id);
    });

    document.querySelectorAll('[data-mv-view]').forEach(button => {
      const isActive = !state.showAll && button.dataset.mvView === active.id;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    if (scrollTop) window.scrollTo({top:0, behavior:'smooth'});
  }

  function installBackToTop() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mv-ux-top';
    button.textContent = '↑';
    button.setAttribute('aria-label', 'Revenir en haut');
    button.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    document.body.append(button);
    addEventListener('scroll', () => button.classList.toggle('visible', scrollY > 700), {passive:true});
  }

  function refresh() {
    discoverSections();
    applyView(false);
  }

  function init() {
    installToolbar();
    discoverSections();
    installBackToTop();
    applyView(false);

    const observer = new MutationObserver(() => {
      clearTimeout(observer.timer);
      observer.timer = setTimeout(refresh, 180);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();