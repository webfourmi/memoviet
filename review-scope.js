(() => {
  'use strict';

  const ACTIVE_KEY = 'memoviet_active_adventure_v2';
  const byId = id => document.getElementById(id);
  const uniq = list => {
    const seen = new Set();
    return list.filter(card => card && !seen.has(card.id) && seen.add(card.id));
  };

  function adventureIds() {
    try { return adventureCollections().map(item => item.id); } catch {}
    try { return collections.filter(item => item.kind === 'aventure').map(item => item.id); } catch {}
    return [];
  }

  function activeId() {
    const ids = adventureIds();
    const saved = localStorage.getItem(ACTIVE_KEY);
    const selected = byId('lessonAdventureSelect')?.value;
    return ids.includes(saved) ? saved : ids.includes(selected) ? selected : ids[0] || 'av01';
  }

  function stateFor(card) {
    try { return normalizedMemoryState(card.id); } catch {}
    try { return cardState(card.id); } catch {}
    return {seen:0, due:0, lastGrade:null, status:'new', intervalDays:0, wrong:0, lapses:0};
  }

  function cardsOf(collectionId) {
    return cards.filter(card => (card.collection || 'base') === collectionId);
  }

  function played(collectionId) {
    try {
      const lesson = lessonState(collectionId);
      if (Array.isArray(lesson.completed) && lesson.completed.length) return true;
    } catch {}
    return cardsOf(collectionId).some(card => Number(stateFor(card).seen || 0) > 0);
  }

  function queued(card) {
    try { return Array.isArray(progress.mistakeQueue) && progress.mistakeQueue.includes(card.id); }
    catch { return false; }
  }

  function due(card) {
    try { return isDue(card); }
    catch {
      const state = stateFor(card);
      return Number(state.seen || 0) > 0 && Number(state.due || 0) <= Date.now();
    }
  }

  function marked(card) {
    const state = stateFor(card);
    return Number(state.seen || 0) > 0 && (
      queued(card) || due(card) || state.lastGrade === 0 || state.lastGrade === 1 ||
      state.status === 'relearning' || Number(state.lapses || 0) >= 2
    );
  }

  function carryCards() {
    const active = activeId();
    const allowed = new Set(adventureIds().filter(id => id !== active && played(id)));
    return cards.filter(card => allowed.has(card.collection || 'base') && marked(card));
  }

  function reviewPool() {
    return uniq([...cardsOf(activeId()), ...carryCards()]);
  }

  function filtered(pool, dueOnly=false) {
    const category = byId('categoryFilter')?.value || 'all';
    const type = byId('typeFilter')?.value || 'all';
    return pool.filter(card =>
      (!dueOnly || marked(card)) &&
      (category === 'all' || card.category === category) &&
      (type === 'all' || card.type === type)
    );
  }

  function difficult() {
    return reviewPool().filter(card => {
      const state = stateFor(card);
      let score = 0;
      try { score = troubleScore(card); } catch {}
      return queued(card) || state.lastGrade === 0 || state.lastGrade === 1 ||
        state.status === 'relearning' || score >= 5 || Number(state.wrong || 0) >= 2;
    }).sort((a,b) => {
      try { return troubleScore(b) - troubleScore(a); } catch { return 0; }
    });
  }

  function priority(limit=20) {
    const active = activeId();
    const current = cardsOf(active);
    const currentDue = current.filter(marked);
    const fragile = difficult().filter(card => (card.collection || 'base') === active);
    const fresh = shuffle(current.filter(card => Number(stateFor(card).seen || 0) === 0));
    const seen = shuffle(current.filter(card => Number(stateFor(card).seen || 0) > 0));
    return uniq([...carryCards(), ...currentDue, ...fragile, ...fresh, ...seen]).slice(0, limit);
  }

  function counts() {
    const pool = reviewPool();
    const current = cardsOf(activeId());
    const start = new Date();
    start.setHours(0,0,0,0);
    const tomorrowEnd = start.getTime() + 2 * 86400000;
    return {
      due: pool.filter(marked).length,
      fresh: current.filter(card => Number(stateFor(card).seen || 0) === 0).length,
      tomorrow: pool.filter(card => {
        const state = stateFor(card);
        return Number(state.seen || 0) > 0 && Number(state.due || 0) > Date.now() && Number(state.due || 0) < tomorrowEnd;
      }).length,
      mastered: pool.filter(card => Number(stateFor(card).intervalDays || 0) >= 21).length,
      fragile: difficult().length
    };
  }

  function forecast() {
    const start = new Date();
    start.setHours(0,0,0,0);
    return Array.from({length:7}, (_, index) => {
      const min = start.getTime() + index * 86400000;
      const max = min + 86400000;
      const count = reviewPool().filter(card => {
        const state = stateFor(card);
        if (!Number(state.seen || 0)) return false;
        if (index === 0 && Number(state.due || 0) < min) return true;
        return Number(state.due || 0) >= min && Number(state.due || 0) < max;
      }).length;
      return {label:index === 0 ? 'Auj.' : new Intl.DateTimeFormat('fr-FR',{weekday:'short'}).format(new Date(min)), count};
    });
  }

  function installOverrides() {
    filteredCards = ({dueOnly=false}={}) => filtered(reviewPool(), dueOnly);
    difficultCards = () => difficult();
    priorityReviewCards = (limit=20) => priority(limit);
    memoryCounts = () => counts();
    forecastCounts = () => forecast();

    buildChoicePool = function(card, count=3, preferSameCollection=false) {
      let pool = reviewPool().filter(candidate => candidate.id !== card.id && candidate.type === card.type);
      if (preferSameCollection) {
        const same = pool.filter(candidate => (candidate.collection || 'base') === (card.collection || 'base'));
        if (same.length >= count) pool = same;
      }
      return shuffle(pool).slice(0, count);
    };

    buildImageChoices = function(card) {
      let pool = reviewPool().filter(candidate => candidate.id !== card.id && getVisualForCard(candidate));
      const same = pool.filter(candidate => (candidate.collection || 'base') === (card.collection || 'base'));
      if (same.length >= 3) pool = same;
      return shuffle([card, ...shuffle(pool).slice(0,3)]);
    };

    launchNewMemoryCards = function() {
      const pool = shuffle(cardsOf(activeId()).filter(card => Number(stateFor(card).seen || 0) === 0)).slice(0,10);
      if (!pool.length) return toast('Toutes les fiches de cette aventure ont déjà été rencontrées.');
      session = {mode:'flash', cards:pool, index:0, score:0, answered:false, reviewed:0, memory:null, specialLabel:'Nouveaux mots', mistakes:[]};
      studyDialog.showModal();
      renderStudyCard();
    };
  }

  function updateBadge() {
    const hub = byId('mvReviewHub');
    if (!hub) return;
    let badge = byId('mvReviewScopeBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'mvReviewScopeBadge';
      badge.className = 'mv-review-scope-badge';
      hub.querySelector('.mv-mode-strip')?.insertAdjacentElement('beforebegin', badge);
    }
    if (badge) badge.innerHTML = `<span><strong>${cardsOf(activeId()).length}</strong> fiches de l’aventure</span><span><strong>${carryCards().length}</strong> à revoir des aventures précédentes</span>`;
  }

  function refresh() {
    installOverrides();
    updateBadge();
    try { updateStats(); } catch {}
    try { updateEnhancedDashboard(); } catch {}
  }

  function bindAdventure() {
    const select = byId('lessonAdventureSelect');
    if (!select || select.dataset.mvReviewScopeBound) return;
    select.dataset.mvReviewScopeBound = 'true';
    select.addEventListener('change', () => setTimeout(refresh, 0));
  }

  function init() {
    refresh();
    bindAdventure();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvReviewTimer);
      observer._mvReviewTimer = setTimeout(() => { bindAdventure(); updateBadge(); }, 220);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();