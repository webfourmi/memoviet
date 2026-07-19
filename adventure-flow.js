(() => {
  'use strict';

  const ACTIVE_KEY = 'memoviet_active_adventure_v2';
  const FINAL_STAGE = 5;
  let syncing = false;
  let lastCompleted = new Set();

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function adventures() {
    const original = $('lessonAdventureSelect');
    if (original?.options?.length) return [...original.options].map(o => ({id:o.value, label:o.textContent || o.value}));
    try { return adventureCollections().map(a => ({id:a.id, label:a.label})); } catch {}
    try { return collections.filter(a => a.kind === 'aventure').map(a => ({id:a.id, label:a.label})); } catch {}
    return [];
  }

  function currentId() {
    const ids = adventures().map(a => a.id);
    const saved = localStorage.getItem(ACTIVE_KEY);
    const original = $('lessonAdventureSelect')?.value;
    return ids.includes(saved) ? saved : ids.includes(original) ? original : ids[0] || 'av01';
  }

  function labelFor(id) {
    return adventures().find(a => a.id === id)?.label || id;
  }

  function completed(id) {
    try { return lessonState(id).completed.length >= LESSON_STAGES.length; } catch { return false; }
  }

  function progressText(id) {
    try {
      const done = lessonState(id).completed.length;
      const total = LESSON_STAGES.length;
      return done >= total ? 'Aventure terminée' : `${done}/${total} étapes validées`;
    } catch { return '' ; }
  }

  function setAdventure(id, dispatch = true) {
    if (!id || syncing) return;
    const ids = adventures().map(a => a.id);
    if (!ids.includes(id)) return;
    syncing = true;
    localStorage.setItem(ACTIVE_KEY, id);
    const original = $('lessonAdventureSelect');
    if (original && original.value !== id) {
      original.value = id;
      if (dispatch) original.dispatchEvent(new Event('change', {bubbles:true}));
    }
    ['mvSpeakAdventure','mvHomeAdventure'].forEach(selectId => {
      const select = $(selectId);
      if (select && [...select.options].some(o => o.value === id)) select.value = id;
    });
    const shared = $('mvSharedAdventureSelect');
    if (shared && shared.value !== id) shared.value = id;
    syncing = false;
    renderShared();
    try { updateEnhancedDashboard(); } catch {}
  }

  function nextAdventure(id) {
    const list = adventures();
    const index = list.findIndex(a => a.id === id);
    if (index < 0) return null;
    for (let step = 1; step < list.length; step++) {
      const candidate = list[(index + step) % list.length];
      if (!completed(candidate.id)) return candidate.id;
    }
    return list[(index + 1) % list.length]?.id || null;
  }

  function installSharedSelector() {
    if ($('mvSharedAdventureBar')) return;
    document.querySelector('.mv-home-adventure-chooser')?.remove();
    const bar = document.createElement('section');
    bar.id = 'mvSharedAdventureBar';
    bar.className = 'mv-shared-adventure';
    bar.innerHTML = `
      <button type="button" id="mvSharedAdventureButton" aria-expanded="false">
        <span class="mv-shared-caption">Aventure sélectionnée</span>
        <strong id="mvSharedAdventureLabel"></strong>
        <small id="mvSharedAdventureProgress"></small>
        <span class="mv-shared-chevron">⌄</span>
      </button>
      <div id="mvSharedAdventurePicker" hidden>
        <label for="mvSharedAdventureSelect">Choisir une aventure</label>
        <select id="mvSharedAdventureSelect"></select>
      </div>`;
    const toolbar = $('mvUxToolbar');
    if (toolbar) toolbar.insertAdjacentElement('afterend', bar);
    else document.body.prepend(bar);

    $('mvSharedAdventureButton').addEventListener('click', () => {
      const picker = $('mvSharedAdventurePicker');
      picker.hidden = !picker.hidden;
      $('mvSharedAdventureButton').setAttribute('aria-expanded', String(!picker.hidden));
      if (!picker.hidden) $('mvSharedAdventureSelect').focus();
    });
    $('mvSharedAdventureSelect').addEventListener('change', e => {
      setAdventure(e.target.value, true);
      $('mvSharedAdventurePicker').hidden = true;
      $('mvSharedAdventureButton').setAttribute('aria-expanded','false');
    });
  }

  function renderShared() {
    installSharedSelector();
    const list = adventures();
    if (!list.length) return;
    const select = $('mvSharedAdventureSelect');
    const signature = list.map(a => `${a.id}:${a.label}`).join('|');
    if (select.dataset.signature !== signature) {
      select.innerHTML = list.map(a => `<option value="${esc(a.id)}">${esc(a.label)}</option>`).join('');
      select.dataset.signature = signature;
    }
    const id = currentId();
    select.value = id;
    $('mvSharedAdventureLabel').textContent = labelFor(id);
    $('mvSharedAdventureProgress').textContent = progressText(id);
  }

  function removeRedundantText() {
    document.querySelectorAll('.mv-page-head p:not(.eyebrow), .guided-lesson-head p, .section-head p').forEach(p => {
      const t = p.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if (['choisis une seule','parcours guide','lecon guidee','les modes sont regroupes','choisis l aventure',"choisis l'aventure",'les fonctions occasionnelles'].some(x => t.includes(x))) p.remove();
    });
    document.querySelector('.mv-home-adventure-chooser')?.remove();
  }

  function autoAdvanceIfNeeded() {
    const id = currentId();
    const now = completed(id);
    if (now && !lastCompleted.has(id)) {
      lastCompleted.add(id);
      const next = nextAdventure(id);
      if (next && next !== id) {
        setAdventure(next, true);
        try { toast(`Aventure terminée. Prochaine aventure : ${labelFor(next)}`); } catch {}
      }
    }
    adventures().forEach(a => { if (completed(a.id)) lastCompleted.add(a.id); });
  }

  function wrapCompletion() {
    if (typeof markLessonStageComplete !== 'function' || markLessonStageComplete.__mvAutoNext) return;
    const original = markLessonStageComplete;
    const wrapped = function(collectionId, stageIndex, ...rest) {
      const result = original.call(this, collectionId, stageIndex, ...rest);
      setTimeout(() => {
        renderShared();
        if (Number(stageIndex) === FINAL_STAGE && completed(collectionId)) {
          const next = nextAdventure(collectionId);
          if (next && next !== collectionId) {
            setAdventure(next, true);
            try { toast(`Aventure terminée. Prochaine aventure : ${labelFor(next)}`); } catch {}
          }
        }
      }, 40);
      return result;
    };
    wrapped.__mvAutoNext = true;
    markLessonStageComplete = wrapped;
  }

  function bindOriginal() {
    const original = $('lessonAdventureSelect');
    if (!original || original.dataset.mvSharedBound) return;
    original.dataset.mvSharedBound = 'true';
    original.addEventListener('change', () => {
      if (!syncing) {
        localStorage.setItem(ACTIVE_KEY, original.value);
        renderShared();
      }
    });
  }

  function refresh() {
    removeRedundantText();
    installSharedSelector();
    bindOriginal();
    wrapCompletion();
    setAdventure(currentId(), false);
    renderShared();
    autoAdvanceIfNeeded();
  }

  function init() {
    adventures().forEach(a => { if (completed(a.id)) lastCompleted.add(a.id); });
    refresh();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._timer);
      observer._timer = setTimeout(refresh, 180);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
