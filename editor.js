(() => {
  'use strict';

  const EDITOR_KEY = 'memoviet_lesson_editor_v1';
  const EDITOR_VERSION = 1;

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const clone = value => JSON.parse(JSON.stringify(value));

  const adventureList = () => collections.filter(item => item.kind === 'aventure');
  const phraseList = collectionId => cards.filter(card => card.collection === collectionId && card.type === 'phrase');

  const originals = {
    labels: Object.fromEntries(adventureList().map(item => [item.id, item.label])),
    cards: Object.fromEntries(cards.map(card => [card.id, clone(card)])),
    scenes: clone(DIALOGUE_SCENE_CONFIG || {}),
    orders: clone(DIALOGUE_ORDER_OVERRIDES || {}),
    replies: clone(DIALOGUE_REPLY_OVERRIDES || {})
  };

  let store = loadStore();
  let draft = null;
  let activeCollectionId = store.lastCollection || lessonProgress?.currentCollection || adventureList()[0]?.id || 'av01';

  function loadStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(EDITOR_KEY) || '{}');
      return {
        version: EDITOR_VERSION,
        lessons: parsed.lessons && typeof parsed.lessons === 'object' ? parsed.lessons : {},
        lastCollection: parsed.lastCollection || null
      };
    } catch {
      return {version: EDITOR_VERSION, lessons: {}, lastCollection: null};
    }
  }

  function saveStore() {
    store.version = EDITOR_VERSION;
    store.lastCollection = activeCollectionId;
    localStorage.setItem(EDITOR_KEY, JSON.stringify(store));
  }

  function defaultObjective(collectionId) {
    const label = originals.labels[collectionId] || collectionLabel(collectionId);
    return `Savoir utiliser les phrases essentielles de « ${label.replace(/^Aventure\s*\d+\s*·\s*/i, '')} » dans une situation réelle.`;
  }

  function defaultDraft(collectionId) {
    const basePhrases = phraseList(collectionId);
    const order = originals.orders[collectionId]?.length
      ? originals.orders[collectionId].filter(id => basePhrases.some(card => card.id === id))
      : basePhrases.map(card => card.id);
    basePhrases.forEach(card => { if (!order.includes(card.id)) order.push(card.id); });

    const phraseData = {};
    order.forEach(id => {
      const card = originals.cards[id] || cards.find(item => item.id === id);
      if (!card) return;
      const reply = originals.replies[id] || localReplyForDialogue(card, order.indexOf(id));
      phraseData[id] = {
        vi: card.vi || '',
        pron: card.pron || '',
        fr: card.fr || '',
        replyVi: reply?.vi || '',
        replyFr: reply?.fr || ''
      };
    });

    return {
      collectionId,
      label: originals.labels[collectionId] || collectionLabel(collectionId),
      objective: defaultObjective(collectionId),
      scenes: clone(originals.scenes[collectionId] || [{title:'La situation', context:'Décris ici le lieu et ce qui se passe.', count:Math.max(1, order.length)}]),
      order,
      phrases: phraseData
    };
  }

  function buildDraft(collectionId) {
    const defaults = defaultDraft(collectionId);
    const saved = store.lessons[collectionId];
    if (!saved) return defaults;

    const merged = {
      ...defaults,
      ...clone(saved),
      collectionId,
      scenes: Array.isArray(saved.scenes) && saved.scenes.length ? clone(saved.scenes) : defaults.scenes,
      order: Array.isArray(saved.order) && saved.order.length ? [...saved.order] : defaults.order,
      phrases: {...defaults.phrases, ...(clone(saved.phrases || {}))}
    };

    defaults.order.forEach(id => {
      if (!merged.order.includes(id)) merged.order.push(id);
      merged.phrases[id] = {...defaults.phrases[id], ...(merged.phrases[id] || {})};
    });
    merged.order = merged.order.filter(id => merged.phrases[id]);
    return merged;
  }

  function applyLessonData(collectionId, data) {
    const collection = collections.find(item => item.id === collectionId);
    if (collection && data.label) collection.label = data.label.trim();

    (data.order || []).forEach(id => {
      const card = cards.find(item => item.id === id);
      const values = data.phrases?.[id];
      if (!card || !values) return;
      card.vi = values.vi.trim();
      card.pron = values.pron.trim();
      card.fr = values.fr.trim();
    });

    DIALOGUE_SCENE_CONFIG[collectionId] = clone(data.scenes || []);
    DIALOGUE_ORDER_OVERRIDES[collectionId] = [...(data.order || [])];

    (data.order || []).forEach(id => {
      const values = data.phrases?.[id];
      if (!values) return;
      DIALOGUE_REPLY_OVERRIDES[id] = {
        vi: values.replyVi.trim(),
        fr: values.replyFr.trim()
      };
    });
  }

  function applyAllSavedLessons() {
    Object.entries(store.lessons).forEach(([collectionId, data]) => applyLessonData(collectionId, data));
  }

  applyAllSavedLessons();

  function refreshApplication() {
    try { populateCollections(); } catch {}
    try { populateLessonAdventureSelect(); } catch {}
    try {
      const select = document.getElementById('lessonAdventureSelect');
      if (select && adventureList().some(item => item.id === activeCollectionId)) select.value = activeCollectionId;
    } catch {}
    try { renderCollectionSpotlight(); } catch {}
    try { renderLibrary(); } catch {}
    try { updateEnhancedDashboard(); } catch {}
    updateObjectivePreview();
  }

  function notify(message) {
    try { toast(message); }
    catch { window.alert(message); }
  }

  function editorMarkup() {
    return `
      <dialog id="mvLessonEditor" class="mv-editor-dialog">
        <form method="dialog" class="mv-editor-shell" id="mvEditorForm">
          <header class="mv-editor-header">
            <div>
              <p class="eyebrow">Atelier de contenu</p>
              <h2>Éditeur de leçons et dialogues</h2>
            </div>
            <button type="button" class="ghost mv-editor-close" aria-label="Fermer">✕</button>
          </header>

          <div class="mv-editor-toolbar">
            <label>
              <span>Aventure</span>
              <select id="mvEditorAdventureSelect"></select>
            </label>
            <div class="mv-editor-toolbar-actions">
              <button type="button" class="ghost" id="mvEditorExport">Exporter</button>
              <label class="ghost mv-editor-file">Importer<input type="file" id="mvEditorImport" accept="application/json,.json" hidden></label>
            </div>
          </div>

          <nav class="mv-editor-tabs" aria-label="Rubriques de l’éditeur">
            <button type="button" data-editor-tab="overview" class="active">Leçon</button>
            <button type="button" data-editor-tab="scenes">Scènes</button>
            <button type="button" data-editor-tab="lines">Répliques</button>
            <button type="button" data-editor-tab="check">Contrôle</button>
          </nav>

          <main id="mvEditorContent" class="mv-editor-content"></main>

          <footer class="mv-editor-footer">
            <button type="button" class="danger-ghost" id="mvEditorReset">Rétablir cette aventure</button>
            <div>
              <button type="button" class="ghost" id="mvEditorPreviewTraveler">Aperçu voyageuse</button>
              <button type="button" class="ghost" id="mvEditorPreviewLocal">Aperçu PNJ</button>
              <button type="button" class="primary" id="mvEditorSave">Enregistrer</button>
            </div>
          </footer>
        </form>
      </dialog>`;
  }

  function installEditorUi() {
    document.body.insertAdjacentHTML('beforeend', editorMarkup());

    const guidedHead = document.querySelector('.guided-lesson-head');
    if (guidedHead && !document.getElementById('mvOpenLessonEditor')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'mvOpenLessonEditor';
      button.className = 'secondary mv-open-editor';
      button.innerHTML = '✏️ Éditer la leçon';
      guidedHead.append(button);
    }

    const lessonTitle = document.getElementById('lessonAdventureTitle');
    if (lessonTitle && !document.getElementById('mvLessonObjectivePreview')) {
      const preview = document.createElement('p');
      preview.id = 'mvLessonObjectivePreview';
      preview.className = 'mv-lesson-objective-preview';
      lessonTitle.insertAdjacentElement('afterend', preview);
    }

    bindEditorEvents();
    updateObjectivePreview();
  }

  function openEditor(collectionId = null) {
    activeCollectionId = collectionId || document.getElementById('lessonAdventureSelect')?.value || activeCollectionId;
    if (!adventureList().some(item => item.id === activeCollectionId)) activeCollectionId = adventureList()[0]?.id || 'av01';
    draft = buildDraft(activeCollectionId);
    renderAdventureOptions();
    setEditorTab('overview');
    document.getElementById('mvLessonEditor')?.showModal();
  }

  function closeEditor() {
    document.getElementById('mvLessonEditor')?.close();
  }

  function renderAdventureOptions() {
    const select = document.getElementById('mvEditorAdventureSelect');
    if (!select) return;
    select.innerHTML = adventureList().map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('');
    select.value = activeCollectionId;
  }

  function setEditorTab(tab) {
    document.querySelectorAll('[data-editor-tab]').forEach(button => button.classList.toggle('active', button.dataset.editorTab === tab));
    const content = document.getElementById('mvEditorContent');
    if (!content || !draft) return;
    if (tab === 'overview') renderOverview(content);
    if (tab === 'scenes') renderScenes(content);
    if (tab === 'lines') renderLines(content);
    if (tab === 'check') renderChecks(content);
    content.dataset.activeTab = tab;
  }

  function renderOverview(content) {
    const count = draft.order.length;
    content.innerHTML = `
      <section class="mv-editor-section">
        <h3>Identité de la leçon</h3>
        <label class="mv-editor-field">
          <span>Titre affiché</span>
          <input type="text" data-draft-field="label" value="${esc(draft.label)}" />
        </label>
        <label class="mv-editor-field">
          <span>Objectif pratique</span>
          <textarea rows="4" data-draft-field="objective">${esc(draft.objective)}</textarea>
        </label>
        <div class="mv-editor-summary-grid">
          <div><strong>${draft.scenes.length}</strong><span>scènes</span></div>
          <div><strong>${count}</strong><span>répliques voyageuse</span></div>
          <div><strong>${count}</strong><span>réponses PNJ</span></div>
        </div>
        <div class="mv-editor-tip">
          <strong>Principe du dialogue</strong>
          <p>Chaque ligne contient ce que dit la voyageuse et la réponse du PNJ vietnamien. Le bouton de rôle utilise le même échange, vu depuis l’autre côté.</p>
        </div>
      </section>`;
  }

  function sceneAssignmentMap() {
    const map = {};
    let cursor = 0;
    draft.scenes.forEach((scene, sceneIndex) => {
      const count = Math.max(0, Number(scene.count || 0));
      for (let i = 0; i < count && cursor < draft.order.length; i++, cursor++) map[draft.order[cursor]] = sceneIndex;
    });
    while (cursor < draft.order.length) {
      map[draft.order[cursor]] = Math.max(0, draft.scenes.length - 1);
      cursor++;
    }
    return map;
  }

  function renderScenes(content) {
    const assigned = draft.scenes.reduce((sum, scene) => sum + Math.max(0, Number(scene.count || 0)), 0);
    content.innerHTML = `
      <section class="mv-editor-section">
        <div class="mv-editor-section-head">
          <div><h3>Découpage du dialogue</h3><p>${assigned} emplacement${assigned > 1 ? 's' : ''} pour ${draft.order.length} réplique${draft.order.length > 1 ? 's' : ''}.</p></div>
          <button type="button" class="secondary" id="mvAddScene">+ Ajouter une scène</button>
        </div>
        <div class="mv-scene-list">
          ${draft.scenes.map((scene, index) => `
            <article class="mv-scene-card" data-scene-index="${index}">
              <div class="mv-scene-number">${index + 1}</div>
              <div class="mv-scene-fields">
                <label><span>Titre</span><input type="text" data-scene-field="title" value="${esc(scene.title)}" /></label>
                <label><span>Contexte</span><textarea rows="3" data-scene-field="context">${esc(scene.context)}</textarea></label>
                <label class="mv-count-field"><span>Nombre de répliques</span><input type="number" min="1" max="99" data-scene-field="count" value="${Math.max(1, Number(scene.count || 1))}" /></label>
              </div>
              <div class="mv-scene-actions">
                <button type="button" class="ghost" data-scene-move="up" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button type="button" class="ghost" data-scene-move="down" ${index === draft.scenes.length - 1 ? 'disabled' : ''}>↓</button>
                <button type="button" class="danger-ghost" data-scene-delete ${draft.scenes.length === 1 ? 'disabled' : ''}>Supprimer</button>
              </div>
            </article>`).join('')}
        </div>
      </section>`;
  }

  function renderLines(content) {
    const assignment = sceneAssignmentMap();
    content.innerHTML = `
      <section class="mv-editor-section">
        <div class="mv-editor-section-head">
          <div><h3>Répliques dans l’ordre</h3><p>Déplace une ligne avec les flèches. Les scènes sont attribuées selon les nombres définis dans l’onglet Scènes.</p></div>
        </div>
        <div class="mv-line-list">
          ${draft.order.map((id, index) => {
            const line = draft.phrases[id];
            const sceneIndex = assignment[id] ?? 0;
            return `
              <article class="mv-line-card" data-line-id="${esc(id)}">
                <header>
                  <div><span class="mv-line-index">${index + 1}</span><strong>Scène ${sceneIndex + 1} · ${esc(draft.scenes[sceneIndex]?.title || 'Sans titre')}</strong></div>
                  <div>
                    <button type="button" class="ghost" data-line-move="up" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button type="button" class="ghost" data-line-move="down" ${index === draft.order.length - 1 ? 'disabled' : ''}>↓</button>
                  </div>
                </header>
                <div class="mv-role-block traveler">
                  <h4>👒 Voyageuse</h4>
                  <label><span>Vietnamien</span><textarea rows="2" data-line-field="vi">${esc(line.vi)}</textarea></label>
                  <label><span>Prononciation</span><input type="text" data-line-field="pron" value="${esc(line.pron)}" /></label>
                  <label><span>Traduction</span><textarea rows="2" data-line-field="fr">${esc(line.fr)}</textarea></label>
                </div>
                <div class="mv-role-block local">
                  <h4>🏡 PNJ vietnamien</h4>
                  <label><span>Réponse vietnamienne</span><textarea rows="2" data-line-field="replyVi">${esc(line.replyVi)}</textarea></label>
                  <label><span>Traduction de la réponse</span><textarea rows="2" data-line-field="replyFr">${esc(line.replyFr)}</textarea></label>
                </div>
              </article>`;
          }).join('')}
        </div>
      </section>`;
  }

  function validateDraft() {
    const issues = [];
    if (!draft.label.trim()) issues.push({level:'error', text:'Le titre de la leçon est vide.'});
    if (!draft.objective.trim()) issues.push({level:'warning', text:'L’objectif pratique n’est pas renseigné.'});

    draft.scenes.forEach((scene, index) => {
      if (!scene.title.trim()) issues.push({level:'error', text:`La scène ${index + 1} n’a pas de titre.`});
      if (!scene.context.trim()) issues.push({level:'warning', text:`La scène ${index + 1} n’a pas de contexte.`});
      if (Number(scene.count || 0) < 1) issues.push({level:'error', text:`La scène ${index + 1} doit contenir au moins une réplique.`});
    });

    const slots = draft.scenes.reduce((sum, scene) => sum + Math.max(0, Number(scene.count || 0)), 0);
    if (slots !== draft.order.length) issues.push({level:'error', text:`Le total des scènes prévoit ${slots} répliques, mais le dialogue en contient ${draft.order.length}.`});

    const seenVietnamese = new Map();
    draft.order.forEach((id, index) => {
      const line = draft.phrases[id];
      if (!line) {
        issues.push({level:'error', text:`La réplique ${index + 1} est introuvable.`});
        return;
      }
      if (!line.vi.trim()) issues.push({level:'error', text:`La réplique voyageuse ${index + 1} est vide.`});
      if (!line.fr.trim()) issues.push({level:'error', text:`La traduction voyageuse ${index + 1} est vide.`});
      if (!line.pron.trim()) issues.push({level:'warning', text:`La prononciation de la réplique ${index + 1} est vide.`});
      if (!line.replyVi.trim()) issues.push({level:'error', text:`La réponse PNJ ${index + 1} est vide.`});
      if (!line.replyFr.trim()) issues.push({level:'error', text:`La traduction PNJ ${index + 1} est vide.`});
      const key = normalize(line.vi.trim());
      if (key && seenVietnamese.has(key)) issues.push({level:'warning', text:`Les répliques ${seenVietnamese.get(key) + 1} et ${index + 1} sont identiques.`});
      else if (key) seenVietnamese.set(key, index);
    });

    return issues;
  }

  function renderChecks(content) {
    const issues = validateDraft();
    const errors = issues.filter(item => item.level === 'error').length;
    const warnings = issues.filter(item => item.level === 'warning').length;
    content.innerHTML = `
      <section class="mv-editor-section">
        <h3>Contrôle automatique</h3>
        <div class="mv-check-summary ${errors ? 'has-errors' : 'is-good'}">
          <strong>${errors ? `${errors} erreur${errors > 1 ? 's' : ''}` : 'Structure valide'}</strong>
          <span>${warnings} avertissement${warnings > 1 ? 's' : ''}</span>
        </div>
        <div class="mv-check-list">
          ${issues.length ? issues.map(item => `<div class="mv-check-item ${item.level}"><span>${item.level === 'error' ? '⛔' : '⚠️'}</span><p>${esc(item.text)}</p></div>`).join('') : '<div class="mv-check-item good"><span>✓</span><p>Aucune anomalie détectée. Le dialogue peut être testé dans les deux rôles.</p></div>'}
        </div>
      </section>`;
  }

  function updateDraftFromInput(target) {
    if (target.dataset.draftField) {
      draft[target.dataset.draftField] = target.value;
      return;
    }
    const sceneCard = target.closest('[data-scene-index]');
    if (sceneCard && target.dataset.sceneField) {
      const index = Number(sceneCard.dataset.sceneIndex);
      draft.scenes[index][target.dataset.sceneField] = target.dataset.sceneField === 'count' ? Math.max(1, Number(target.value || 1)) : target.value;
      return;
    }
    const lineCard = target.closest('[data-line-id]');
    if (lineCard && target.dataset.lineField) {
      const id = lineCard.dataset.lineId;
      draft.phrases[id][target.dataset.lineField] = target.value;
    }
  }

  function moveItem(array, index, direction) {
    const next = direction === 'up' ? index - 1 : index + 1;
    if (next < 0 || next >= array.length) return;
    [array[index], array[next]] = [array[next], array[index]];
  }

  function persistDraft({close=false, quiet=false} = {}) {
    const issues = validateDraft();
    const errors = issues.filter(item => item.level === 'error');
    if (errors.length) {
      setEditorTab('check');
      notify(`Enregistrement bloqué : ${errors.length} erreur${errors.length > 1 ? 's' : ''} à corriger.`);
      return false;
    }
    store.lessons[activeCollectionId] = clone(draft);
    saveStore();
    applyLessonData(activeCollectionId, draft);
    refreshApplication();
    if (!quiet) notify('Leçon enregistrée sur cet appareil.');
    if (close) closeEditor();
    return true;
  }

  function resetAdventure() {
    const collection = adventureList().find(item => item.id === activeCollectionId);
    const accepted = window.confirm(`Rétablir le contenu d’origine de « ${collection?.label || activeCollectionId} » ? Les autres aventures ne seront pas modifiées.`);
    if (!accepted) return;
    delete store.lessons[activeCollectionId];
    saveStore();

    const originalCollection = collections.find(item => item.id === activeCollectionId);
    if (originalCollection) originalCollection.label = originals.labels[activeCollectionId];
    Object.entries(originals.cards).forEach(([id, data]) => {
      const card = cards.find(item => item.id === id);
      if (card && card.collection === activeCollectionId) Object.assign(card, clone(data));
    });
    DIALOGUE_SCENE_CONFIG[activeCollectionId] = clone(originals.scenes[activeCollectionId] || []);
    if (originals.orders[activeCollectionId]) DIALOGUE_ORDER_OVERRIDES[activeCollectionId] = clone(originals.orders[activeCollectionId]);
    else delete DIALOGUE_ORDER_OVERRIDES[activeCollectionId];
    Object.keys(DIALOGUE_REPLY_OVERRIDES).forEach(id => {
      if (cards.find(card => card.id === id)?.collection === activeCollectionId && !originals.replies[id]) delete DIALOGUE_REPLY_OVERRIDES[id];
    });
    Object.entries(originals.replies).forEach(([id, reply]) => {
      if (cards.find(card => card.id === id)?.collection === activeCollectionId) DIALOGUE_REPLY_OVERRIDES[id] = clone(reply);
    });

    draft = defaultDraft(activeCollectionId);
    refreshApplication();
    setEditorTab('overview');
    notify('Cette aventure a retrouvé son contenu d’origine.');
  }

  function exportEditorData() {
    if (draft) {
      store.lessons[activeCollectionId] = clone(draft);
      saveStore();
    }
    const payload = {
      app: 'MemoViet',
      type: 'lesson-editor-backup',
      version: EDITOR_VERSION,
      exportedAt: new Date().toISOString(),
      lessons: store.lessons
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `memoviet-lecons-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function importEditorData(file) {
    try {
      const parsed = JSON.parse(await file.text());
      const lessons = parsed.lessons || parsed;
      if (!lessons || typeof lessons !== 'object' || Array.isArray(lessons)) throw new Error('Format incorrect');
      Object.entries(lessons).forEach(([id, data]) => {
        if (adventureList().some(item => item.id === id)) store.lessons[id] = clone(data);
      });
      saveStore();
      applyAllSavedLessons();
      draft = buildDraft(activeCollectionId);
      refreshApplication();
      setEditorTab('overview');
      notify('Leçons importées avec succès.');
    } catch (error) {
      notify(`Import impossible : ${error.message}`);
    }
  }

  function preview(role) {
    if (!persistDraft({quiet:true})) return;
    closeEditor();
    window.setTimeout(() => startAdventureDialogue(activeCollectionId, role), 80);
  }

  function bindEditorEvents() {
    document.getElementById('mvOpenLessonEditor')?.addEventListener('click', () => openEditor());
    document.querySelector('.mv-editor-close')?.addEventListener('click', closeEditor);

    document.getElementById('mvEditorAdventureSelect')?.addEventListener('change', event => {
      activeCollectionId = event.target.value;
      store.lastCollection = activeCollectionId;
      draft = buildDraft(activeCollectionId);
      const tab = document.getElementById('mvEditorContent')?.dataset.activeTab || 'overview';
      setEditorTab(tab);
    });

    document.querySelector('.mv-editor-tabs')?.addEventListener('click', event => {
      const button = event.target.closest('[data-editor-tab]');
      if (button) setEditorTab(button.dataset.editorTab);
    });

    document.getElementById('mvEditorContent')?.addEventListener('input', event => updateDraftFromInput(event.target));
    document.getElementById('mvEditorContent')?.addEventListener('change', event => updateDraftFromInput(event.target));

    document.getElementById('mvEditorContent')?.addEventListener('click', event => {
      const addScene = event.target.closest('#mvAddScene');
      if (addScene) {
        draft.scenes.push({title:`Nouvelle scène`, context:'Décris le lieu et ce qui se passe.', count:1});
        return setEditorTab('scenes');
      }

      const sceneCard = event.target.closest('[data-scene-index]');
      if (sceneCard) {
        const index = Number(sceneCard.dataset.sceneIndex);
        const move = event.target.closest('[data-scene-move]');
        if (move) {
          moveItem(draft.scenes, index, move.dataset.sceneMove);
          return setEditorTab('scenes');
        }
        if (event.target.closest('[data-scene-delete]') && draft.scenes.length > 1) {
          draft.scenes.splice(index, 1);
          return setEditorTab('scenes');
        }
      }

      const lineCard = event.target.closest('[data-line-id]');
      const moveLine = event.target.closest('[data-line-move]');
      if (lineCard && moveLine) {
        const index = draft.order.indexOf(lineCard.dataset.lineId);
        moveItem(draft.order, index, moveLine.dataset.lineMove);
        return setEditorTab('lines');
      }
    });

    document.getElementById('mvEditorSave')?.addEventListener('click', () => persistDraft());
    document.getElementById('mvEditorReset')?.addEventListener('click', resetAdventure);
    document.getElementById('mvEditorPreviewTraveler')?.addEventListener('click', () => preview('traveler'));
    document.getElementById('mvEditorPreviewLocal')?.addEventListener('click', () => preview('local'));
    document.getElementById('mvEditorExport')?.addEventListener('click', exportEditorData);
    document.getElementById('mvEditorImport')?.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) importEditorData(file);
      event.target.value = '';
    });

    document.getElementById('lessonAdventureSelect')?.addEventListener('change', event => {
      activeCollectionId = event.target.value;
      updateObjectivePreview();
    });
  }

  function updateObjectivePreview() {
    const preview = document.getElementById('mvLessonObjectivePreview');
    if (!preview) return;
    const collectionId = document.getElementById('lessonAdventureSelect')?.value || activeCollectionId;
    const data = store.lessons[collectionId] || defaultDraft(collectionId);
    preview.textContent = data.objective || '';
  }

  const baseRenderLessonIntroduction = renderLessonIntroduction;
  renderLessonIntroduction = function(collectionId) {
    baseRenderLessonIntroduction(collectionId);
    const objective = store.lessons[collectionId]?.objective || defaultObjective(collectionId);
    const copy = document.querySelector('.lesson-intro-copy');
    if (copy && objective && !copy.querySelector('.mv-intro-objective')) {
      const block = document.createElement('div');
      block.className = 'mv-intro-objective';
      block.innerHTML = `<strong>Objectif</strong><p>${esc(objective)}</p>`;
      const heading = copy.querySelector('h2');
      heading?.insertAdjacentElement('afterend', block);
    }
  };

  const baseUpdateEnhancedDashboardEditor = updateEnhancedDashboard;
  updateEnhancedDashboard = function() {
    baseUpdateEnhancedDashboardEditor();
    updateObjectivePreview();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { installEditorUi(); refreshApplication(); });
  else { installEditorUi(); refreshApplication(); }
})();
