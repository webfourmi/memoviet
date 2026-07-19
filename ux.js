(() => {
  'use strict';

  const KEY = 'memoviet_ux_state_v2';
  const PAGE_SIZE = matchMedia('(max-width:700px)').matches ? 6 : 12;
  const views = [
    {id:'home', icon:'🏠', label:'Accueil'},
    {id:'learn', icon:'🌱', label:'Apprendre'},
    {id:'review', icon:'🧠', label:'Réviser'},
    {id:'speak', icon:'🗣️', label:'Parler'},
    {id:'more', icon:'⚙️', label:'Plus'}
  ];

  let state = loadState();
  let sections = [];
  let refreshing = false;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        view: views.some(view => view.id === parsed.view) ? parsed.view : 'home',
        showAll: Boolean(parsed.showAll),
        collapsed: parsed.collapsed && typeof parsed.collapsed === 'object' ? parsed.collapsed : {}
      };
    } catch {
      return {view:'home', showAll:false, collapsed:{}};
    }
  }

  function saveState() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  const el = id => document.getElementById(id);
  const click = id => {
    const target = el(id);
    if (target) target.click();
    return Boolean(target);
  };

  function mainElement() {
    return document.querySelector('main') || document.body;
  }

  function hubMarkup() {
    return `
      <section id="mvHomeHub" class="panel mv-page-hub mv-home-hub" data-mv-ux-view="home">
        <div class="mv-page-head"><div><p class="eyebrow">Aujourd’hui</p><h2>Quelques minutes de vietnamien</h2><p>Choisis une seule action. MemoViet s’occupe du reste.</p></div><span class="mv-page-symbol">🪷</span></div>
        <div class="mv-action-grid">
          <button type="button" data-mv-action="continue"><span>▶️</span><strong>Continuer</strong><small>Reprendre la leçon en cours</small></button>
          <button type="button" data-mv-action="review"><span>🧠</span><strong>Réviser</strong><small>Les mots qui reviennent aujourd’hui</small></button>
          <button type="button" data-mv-action="dialogue-picker"><span>💬</span><strong>Parler</strong><small>Choisir un dialogue et un rôle</small></button>
          <button type="button" data-mv-action="field"><span>🧭</span><strong>Sur place</strong><small>Trouver une phrase immédiatement</small></button>
        </div>
      </section>

      <section id="mvLearnHub" class="panel mv-page-hub" data-mv-ux-view="learn">
        <div class="mv-page-head"><div><p class="eyebrow">Apprendre</p><h2>Une aventure à la fois</h2><p>Leçon guidée, cartes illustrées et bibliothèque, sans mélanger les situations.</p></div><span class="mv-page-symbol">🌱</span></div>
        <div class="mv-action-grid mv-action-grid-3">
          <button type="button" data-mv-action="continue"><span>🪷</span><strong>Parcours guidé</strong><small>Reprendre à la prochaine étape</small></button>
          <button type="button" data-mv-action="library"><span>🗂️</span><strong>Bibliothèque</strong><small>Retrouver les cartes par aventure</small></button>
          <button type="button" data-mv-action="editor"><span>✏️</span><strong>Éditeur</strong><small>Corriger scènes et répliques</small></button>
        </div>
      </section>

      <section id="mvReviewHub" class="panel mv-page-hub" data-mv-ux-view="review">
        <div class="mv-page-head"><div><p class="eyebrow">Réviser</p><h2>Choisis ton entraînement</h2><p>Les modes sont regroupés ici. Les réglages détaillés restent repliés plus bas.</p></div><span class="mv-page-symbol">🧠</span></div>
        <div class="mv-mode-strip">
          <button type="button" data-mv-mode="flash">🃏<span>Cartes</span></button>
          <button type="button" data-mv-mode="mcq">✅<span>QCM</span></button>
          <button type="button" data-mv-mode="typing">⌨️<span>Écriture</span></button>
          <button type="button" data-mv-mode="listening">🎧<span>Écoute</span></button>
          <button type="button" data-mv-mode="scramble">🧩<span>Phrase</span></button>
          <button type="button" data-mv-mode="image">🎨<span>Images</span></button>
          <button type="button" data-mv-mode="memory">🪷<span>Paires</span></button>
        </div>
      </section>

      <section id="mvSpeakHub" class="panel mv-page-hub mv-speak-hub" data-mv-ux-view="speak">
        <div class="mv-page-head"><div><p class="eyebrow">Parler</p><h2>Dialogue et prononciation</h2><p>Choisis l’aventure, puis joue la voyageuse ou la personne vietnamienne.</p></div><span class="mv-page-symbol">🗣️</span></div>
        <label class="mv-speak-select"><span>Aventure</span><select id="mvSpeakAdventure"></select></label>
        <div class="mv-role-grid">
          <button type="button" data-mv-action="dialogue-traveler"><span>👒</span><strong>Je suis la voyageuse</strong><small>Poser les questions et commander</small></button>
          <button type="button" data-mv-action="dialogue-local"><span>🏡</span><strong>Je suis le PNJ</strong><small>Répondre comme une personne vietnamienne</small></button>
        </div>
        <div class="mv-speak-tools">
          <button type="button" data-mv-action="dialogue-picker">💬 Choisir le mode guidé ou libre</button>
          <button type="button" data-mv-action="pronunciation">🎙️ Écouter, répéter et m’enregistrer</button>
          <button type="button" data-mv-action="field">🧭 Ouvrir le mode Sur place</button>
          <button type="button" data-mv-action="audio-test">🔊 Tester la voix vietnamienne</button>
        </div>
        <div id="mvSpeakAudioSlot" class="mv-speak-audio-slot"></div>
      </section>

      <section id="mvMoreHub" class="panel mv-page-hub" data-mv-ux-view="more">
        <div class="mv-page-head"><div><p class="eyebrow">Plus</p><h2>Outils et sécurité</h2><p>Les fonctions occasionnelles sont rangées ici pour ne plus encombrer les leçons.</p></div><span class="mv-page-symbol">⚙️</span></div>
        <div class="mv-action-grid">
          <button type="button" data-mv-action="backup"><span>💾</span><strong>Sauvegarde</strong><small>Exporter ou restaurer toutes les données</small></button>
          <button type="button" data-mv-action="editor"><span>✏️</span><strong>Éditeur</strong><small>Modifier les leçons et dialogues</small></button>
          <button type="button" data-mv-action="install"><span>📲</span><strong>Installer</strong><small>Ajouter MemoViet à l’écran d’accueil</small></button>
          <button type="button" data-mv-action="show-all"><span>🧰</span><strong>Vue complète</strong><small>Afficher toutes les rubriques ensemble</small></button>
        </div>
      </section>`;
  }

  function installHubs() {
    if (el('mvHomeHub')) return;
    mainElement().insertAdjacentHTML('afterbegin', hubMarkup());
    document.addEventListener('click', handleActionClick);
    el('mvSpeakAdventure')?.addEventListener('change', event => {
      const original = el('lessonAdventureSelect');
      if (original) {
        original.value = event.target.value;
        original.dispatchEvent(new Event('change', {bubbles:true}));
      }
    });
  }

  function syncAdventureOptions() {
    const select = el('mvSpeakAdventure');
    if (!select) return;
    const original = el('lessonAdventureSelect');
    let options = original ? [...original.options].map(option => ({value:option.value, label:option.textContent})) : [];
    if (!options.length && Array.isArray(window.collections)) {
      options = window.collections.filter(item => item.kind === 'aventure').map(item => ({value:item.id, label:item.label}));
    }
    if (!options.length) return;
    const previous = select.value;
    select.innerHTML = options.map(option => `<option value="${String(option.value).replaceAll('"','&quot;')}">${option.label}</option>`).join('');
    select.value = options.some(option => option.value === previous) ? previous : (original?.value || options[0].value);
  }

  function moveAudioSettings() {
    const slot = el('mvSpeakAudioSlot');
    const audio = document.querySelector('.audio-settings');
    if (slot && audio && audio.parentElement !== slot) {
      slot.append(audio);
      audio.classList.add('mv-audio-compact');
    }
  }

  function selectedAdventure() {
    return el('mvSpeakAdventure')?.value || el('lessonAdventureSelect')?.value || 'av01';
  }

  function launchMode(mode) {
    if (typeof window.startSession === 'function') return window.startSession(mode);
    document.querySelector(`[data-mode="${mode}"]`)?.click();
  }

  function launchDialogue(role) {
    const collectionId = selectedAdventure();
    if (typeof window.startAdventureDialogue === 'function') return window.startAdventureDialogue(collectionId, role);
    if (click('quickDialogueBtn')) return;
    if (typeof window.showDialoguePicker === 'function') window.showDialoguePicker();
  }

  function handleActionClick(event) {
    const modeButton = event.target.closest('[data-mv-mode]');
    if (modeButton) return launchMode(modeButton.dataset.mvMode);

    const button = event.target.closest('[data-mv-action]');
    if (!button) return;
    const action = button.dataset.mvAction;
    if (action === 'continue') click('continueLessonBtn');
    if (action === 'review') click('memoryReviewNowBtn') || click('quickDueBtn');
    if (action === 'dialogue-picker') {
      if (typeof window.showDialoguePicker === 'function') window.showDialoguePicker();
      else click('quickDialogueBtn');
    }
    if (action === 'dialogue-traveler') launchDialogue('traveler');
    if (action === 'dialogue-local') launchDialogue('local');
    if (action === 'field') click('quickFieldModeBtn');
    if (action === 'pronunciation') launchMode('listening');
    if (action === 'audio-test') click('audioTestBtn');
    if (action === 'editor') click('mvOpenLessonEditor');
    if (action === 'backup') click('mvOpenBackup');
    if (action === 'install') click('installBtn');
    if (action === 'library') openSection('library-panel', 'learn');
    if (action === 'show-all') {
      state.showAll = true;
      saveState();
      applyView(true);
    }
  }

  function sectionView(section, index) {
    if (section.dataset.mvUxView) return section.dataset.mvUxView;
    if (section.id === 'guidedLessonPanel' || section.id === 'collectionSpotlight') return 'learn';
    if (section.id === 'memoryDashboard') return 'review';
    if (section.classList.contains('hero') || section.classList.contains('stats-grid')) return 'home';
    if (section.classList.contains('controls-panel')) return 'review';
    if (section.classList.contains('library-panel')) return 'learn';
    return index < 2 ? 'home' : 'more';
  }

  function sectionKey(section, index) {
    if (section.id) return section.id;
    const known = ['hero','stats-grid','controls-panel','library-panel'].find(name => section.classList.contains(name));
    return known || `section-${index}`;
  }

  function sectionTitle(section) {
    if (section.id === 'guidedLessonPanel') return 'Parcours guidé';
    if (section.id === 'collectionSpotlight') return 'Fiche illustrée';
    if (section.id === 'memoryDashboard') return 'Mémoire intelligente';
    if (section.classList.contains('hero')) return 'Bienvenue';
    if (section.classList.contains('stats-grid')) return 'Progression';
    if (section.classList.contains('controls-panel')) return 'Réglages et modes détaillés';
    if (section.classList.contains('library-panel')) return 'Bibliothèque';
    return section.querySelector('h1,h2,h3')?.textContent?.trim() || 'Rubrique';
  }

  function defaultCollapsed(key) {
    return ['collectionSpotlight','controls-panel','library-panel'].includes(key);
  }

  function installSectionBar(section, index) {
    if (section.classList.contains('mv-page-hub') || section.querySelector(':scope > .mv-section-bar')) return;
    const key = sectionKey(section, index);
    section.dataset.mvSectionKey = key;
    const collapsed = Object.prototype.hasOwnProperty.call(state.collapsed, key) ? Boolean(state.collapsed[key]) : defaultCollapsed(key);
    section.classList.toggle('mv-collapsed', collapsed);
    const bar = document.createElement('div');
    bar.className = 'mv-section-bar';
    bar.innerHTML = `<strong>${sectionTitle(section)}</strong><button type="button" aria-expanded="${collapsed ? 'false' : 'true'}">${collapsed ? 'Afficher' : 'Replier'}</button>`;
    bar.querySelector('button').addEventListener('click', () => {
      const next = !section.classList.contains('mv-collapsed');
      section.classList.toggle('mv-collapsed', next);
      state.collapsed[key] = next;
      saveState();
      bar.querySelector('button').textContent = next ? 'Afficher' : 'Replier';
      bar.querySelector('button').setAttribute('aria-expanded', next ? 'false' : 'true');
    });
    section.prepend(bar);
  }

  function setupPager(container) {
    if (container.closest('.mv-page-hub')) return;
    const items = [...container.children].filter(item => !item.classList.contains('mv-pager'));
    if (items.length <= PAGE_SIZE) {
      items.forEach(item => delete item.dataset.mvPageHidden);
      container._mvPager?.remove();
      container._mvPager = null;
      return;
    }

    let page = Math.min(Number(container.dataset.mvPage || 0), Math.ceil(items.length / PAGE_SIZE) - 1);
    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const render = () => {
      page = Math.max(0, Math.min(page, totalPages - 1));
      container.dataset.mvPage = String(page);
      items.forEach((item, index) => {
        item.dataset.mvPageHidden = index < page * PAGE_SIZE || index >= (page + 1) * PAGE_SIZE ? 'true' : 'false';
      });
      if (container._mvPager) {
        container._mvPager.querySelector('[data-prev]').disabled = page === 0;
        container._mvPager.querySelector('[data-next]').disabled = page === totalPages - 1;
        container._mvPager.querySelector('.mv-pager-status').textContent = `${page + 1} / ${totalPages}`;
      }
    };

    if (!container._mvPager?.isConnected) {
      const pager = document.createElement('div');
      pager.className = 'mv-pager';
      pager.innerHTML = '<button type="button" data-prev>‹ Précédent</button><span class="mv-pager-status"></span><button type="button" data-next>Suivant ›</button>';
      pager.addEventListener('click', event => {
        if (event.target.closest('[data-prev]')) page--;
        if (event.target.closest('[data-next]')) page++;
        render();
        container.scrollIntoView({behavior:'smooth', block:'start'});
      });
      container.insertAdjacentElement('afterend', pager);
      container._mvPager = pager;
    }
    render();
  }

  function compactLongLists(root) {
    const selectors = [
      '.library-list','.library-grid','.card-grid','.memo-grid','.pair-grid','.quiz-grid',
      '.dialogue-picker-grid','.mode-grid','.image-grid-quiz'
    ];
    root.querySelectorAll(selectors.join(',')).forEach(setupPager);
  }

  function discoverSections() {
    const candidates = [...mainElement().children].filter(node => node.matches?.('section,article,.panel'));
    sections = candidates.map((section, index) => {
      section.dataset.mvUxView = sectionView(section, index);
      section.classList.add('mv-ux-section');
      installSectionBar(section, index);
      compactLongLists(section);
      return section;
    });
  }

  function installToolbar() {
    if (el('mvUxToolbar')) return;
    const toolbar = document.createElement('div');
    toolbar.id = 'mvUxToolbar';
    toolbar.className = 'mv-ux-toolbar';
    toolbar.innerHTML = '<strong>MemoViet</strong><span id="mvUxTitle">Accueil</span><button type="button" id="mvUxShowAll">Tout afficher</button>';
    document.body.prepend(toolbar);

    const nav = document.createElement('nav');
    nav.id = 'mvUxNav';
    nav.className = 'mv-ux-nav';
    nav.setAttribute('aria-label', 'Navigation principale');
    nav.innerHTML = views.map(view => `<button type="button" data-mv-view="${view.id}" aria-label="${view.label}"><span>${view.icon}</span><small>${view.label}</small></button>`).join('');
    document.body.append(nav);

    nav.addEventListener('click', event => {
      const button = event.target.closest('[data-mv-view]');
      if (!button) return;
      state.view = button.dataset.mvView;
      state.showAll = false;
      saveState();
      applyView(true);
    });

    el('mvUxShowAll').addEventListener('click', () => {
      state.showAll = !state.showAll;
      saveState();
      applyView(false);
    });
  }

  function openSection(key, view) {
    state.view = view;
    state.showAll = false;
    state.collapsed[key] = false;
    saveState();
    applyView(false);
    const section = sections.find(item => item.dataset.mvSectionKey === key || item.classList.contains(key));
    if (section) {
      section.classList.remove('mv-collapsed');
      const button = section.querySelector(':scope > .mv-section-bar button');
      if (button) { button.textContent = 'Replier'; button.setAttribute('aria-expanded', 'true'); }
      setTimeout(() => section.scrollIntoView({behavior:'smooth', block:'start'}), 60);
    }
  }

  function applyView(scrollTop) {
    const active = views.find(view => view.id === state.view) || views[0];
    if (el('mvUxTitle')) el('mvUxTitle').textContent = state.showAll ? 'Toutes les rubriques' : active.label;
    if (el('mvUxShowAll')) el('mvUxShowAll').textContent = state.showAll ? 'Vue compacte' : 'Tout afficher';

    sections.forEach(section => section.classList.toggle('mv-ux-hidden', !state.showAll && section.dataset.mvUxView !== active.id));
    document.querySelectorAll('[data-mv-view]').forEach(button => {
      const isActive = !state.showAll && button.dataset.mvView === active.id;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    if (scrollTop) window.scrollTo({top:0, behavior:'smooth'});
  }

  function installBackToTop() {
    if (document.querySelector('.mv-ux-top')) return;
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
    if (refreshing) return;
    refreshing = true;
    try {
      installHubs();
      syncAdventureOptions();
      moveAudioSettings();
      discoverSections();
      applyView(false);
    } finally {
      refreshing = false;
    }
  }

  function init() {
    installToolbar();
    installHubs();
    installBackToTop();
    refresh();

    const observer = new MutationObserver(() => {
      clearTimeout(observer.timer);
      observer.timer = setTimeout(refresh, 220);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();