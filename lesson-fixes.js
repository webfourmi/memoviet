(() => {
  'use strict';

  const DIALOGUE_STAGE_INDEX = 4;
  const escape = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const byId = id => document.getElementById(id);

  function adventureOptions() {
    const source = byId('lessonAdventureSelect');
    if (source?.options?.length) {
      return [...source.options].map(option => ({value: option.value, label: option.textContent || option.value}));
    }
    try {
      return adventureCollections().map(item => ({value:item.id, label:item.label}));
    } catch {
      return [];
    }
  }

  function currentAdventureId() {
    return byId('lessonAdventureSelect')?.value
      || byId('mvHomeAdventure')?.value
      || byId('mvSpeakAdventure')?.value
      || 'av01';
  }

  function setAdventureEverywhere(collectionId, dispatchOriginal=true) {
    if (!collectionId) return;
    const original = byId('lessonAdventureSelect');
    if (original && original.value !== collectionId) {
      original.value = collectionId;
      if (dispatchOriginal) original.dispatchEvent(new Event('change', {bubbles:true}));
    } else if (original && dispatchOriginal) {
      try { updateEnhancedDashboard(); } catch {}
    }

    ['mvHomeAdventure', 'mvSpeakAdventure'].forEach(id => {
      const select = byId(id);
      if (select && [...select.options].some(option => option.value === collectionId)) select.value = collectionId;
    });
    updateHomeAdventureStatus();
  }

  function updateHomeAdventureStatus() {
    const collectionId = currentAdventureId();
    const status = byId('mvHomeAdventureStatus');
    const button = byId('mvHomeAdventureContinue');
    if (!status || !button) return;

    try {
      const progress = lessonState(collectionId);
      const completed = progress.completed.length;
      const nextIndex = nextIncompleteStage(collectionId);
      const total = LESSON_STAGES.length;
      status.innerHTML = `<strong>${completed}/${total} étapes validées</strong><span>${completed === total ? 'Le parcours est terminé et peut être rejoué.' : `Prochaine étape : ${escape(LESSON_STAGES[nextIndex].label)}`}</span>`;
      button.textContent = completed === total ? '↻ Rejouer cette aventure' : `▶ ${LESSON_STAGES[nextIndex].label}`;
    } catch {
      status.innerHTML = '<strong>Aventure sélectionnée</strong><span>Prête à commencer.</span>';
      button.textContent = '▶ Commencer cette aventure';
    }
  }

  function fillHomeAdventureSelect() {
    const select = byId('mvHomeAdventure');
    if (!select) return;
    const options = adventureOptions();
    if (!options.length) return;
    const selected = currentAdventureId();
    select.innerHTML = options.map(item => `<option value="${escape(item.value)}">${escape(item.label)}</option>`).join('');
    select.value = options.some(item => item.value === selected) ? selected : options[0].value;
    setAdventureEverywhere(select.value, false);
  }

  function installHomeAdventureChooser() {
    const hub = byId('mvHomeHub');
    if (!hub || byId('mvHomeAdventureChooser')) return false;
    const head = hub.querySelector('.mv-page-head');
    const chooser = document.createElement('section');
    chooser.id = 'mvHomeAdventureChooser';
    chooser.className = 'mv-home-adventure-chooser';
    chooser.innerHTML = `
      <label class="mv-home-adventure-select">
        <span>Mon aventure</span>
        <select id="mvHomeAdventure" aria-label="Choisir une aventure depuis l’accueil"></select>
      </label>
      <div id="mvHomeAdventureStatus" class="mv-home-adventure-status"></div>
      <button type="button" id="mvHomeAdventureContinue" class="primary">▶ Commencer cette aventure</button>`;
    head?.insertAdjacentElement('afterend', chooser);

    byId('mvHomeAdventure')?.addEventListener('change', event => setAdventureEverywhere(event.target.value));
    byId('mvHomeAdventureContinue')?.addEventListener('click', () => {
      setAdventureEverywhere(byId('mvHomeAdventure')?.value || currentAdventureId());
      const continueButton = byId('continueLessonBtn');
      if (continueButton) continueButton.click();
      else {
        try { beginGuidedStage(currentAdventureId(), nextIncompleteStage(currentAdventureId())); }
        catch {}
      }
    });
    fillHomeAdventureSelect();
    return true;
  }

  function dialogueValidated() {
    return session?.role === 'traveler'
      && Array.isArray(session.cards)
      && session.cards.length > 0
      && session.score === session.cards.length;
  }

  function installDialogueCompletionFix() {
    if (typeof renderDialogueComplete !== 'function' || renderDialogueComplete.__mvValidationFix) return;

    const fixedRenderDialogueComplete = function() {
      const collectionId = session?.collectionId || currentAdventureId();
      const isTraveler = session?.role === 'traveler';
      const perfect = dialogueValidated();
      const alreadyValidated = (() => {
        try { return stageCompleted(collectionId, DIALOGUE_STAGE_INDEX); }
        catch { return false; }
      })();

      if (perfect && !alreadyValidated) {
        try { markLessonStageComplete(collectionId, DIALOGUE_STAGE_INDEX); }
        catch {}
      }

      const validated = perfect || alreadyValidated;
      try { updateEnhancedDashboard(); } catch {}
      setAdventureEverywhere(collectionId, false);

      byId('sessionProgress').textContent = validated ? 'Dialogue validé' : 'Dialogue à reprendre';
      byId('skipBtn')?.classList.add('hidden');
      byId('nextBtn')?.classList.add('hidden');

      const otherRole = isTraveler ? 'local' : 'traveler';
      const otherRoleLabel = otherRole === 'traveler' ? 'Voyageuse' : 'PNJ vietnamien';
      let practiceLabel = 'choix guidé';
      try { practiceLabel = dialoguePracticeMode === 'free' ? 'réponse libre' : 'choix guidé'; } catch {}

      const score = Number(session?.score || 0);
      const total = Array.isArray(session?.cards) ? session.cards.length : 0;
      const message = perfect
        ? 'Toutes les réponses de la voyageuse sont correctes. L’étape Dialogue est maintenant validée.'
        : alreadyValidated
          ? 'Cette étape avait déjà été validée. Cette nouvelle tentative ne retire pas ta réussite.'
          : isTraveler
            ? `Il reste ${Math.max(0, total - score)} réponse${Math.max(0, total - score) > 1 ? 's' : ''} à corriger pour valider l’étape.`
            : 'Le rôle PNJ sert à s’entraîner. Pour valider l’étape, termine le dialogue sans erreur en rôle Voyageuse.';

      byId('studyArea').innerHTML = `
        <div class="dialogue-complete ${validated ? 'mv-dialogue-validated' : 'mv-dialogue-retry'}">
          <p class="eyebrow">${escape(collectionLabel(collectionId))}</p>
          <div class="mv-dialogue-result-icon">${validated ? '✓' : '↻'}</div>
          <h2>${validated ? 'Dialogue validé' : 'Dialogue terminé'}</h2>
          <div class="result-score">${score}/${total}</div>
          <p>${escape(message)}</p>
          <p class="muted">Rôle : ${isTraveler ? 'voyageuse' : 'PNJ vietnamien'} · Mode : ${practiceLabel}.</p>
          <div class="dialogue-complete-actions">
            ${validated ? '<button type="button" class="primary" id="mvDialogueFinalTest">Étape suivante · Test final</button>' : `<button type="button" class="primary" id="mvDialogueRetryTraveler">${isTraveler ? 'Rejouer pour valider' : 'Jouer la Voyageuse pour valider'}</button>`}
            <button type="button" class="ghost" id="mvDialogueOtherRole">Rejouer en ${otherRoleLabel}</button>
            <button type="button" class="ghost" id="mvDialogueChooseAdventure">Choisir une autre aventure</button>
            <button type="button" class="ghost" id="mvDialogueHome">Retour à l’accueil</button>
          </div>
        </div>`;

      byId('mvDialogueFinalTest')?.addEventListener('click', () => beginGuidedStage(collectionId, 5));
      byId('mvDialogueRetryTraveler')?.addEventListener('click', () => startAdventureDialogue(collectionId, 'traveler'));
      byId('mvDialogueOtherRole')?.addEventListener('click', () => startAdventureDialogue(collectionId, otherRole));
      byId('mvDialogueChooseAdventure')?.addEventListener('click', showDialoguePicker);
      byId('mvDialogueHome')?.addEventListener('click', () => {
        studyDialog.close();
        try { updateEnhancedDashboard(); } catch {}
        document.querySelector('[data-mv-view="home"]')?.click();
      });
    };

    fixedRenderDialogueComplete.__mvValidationFix = true;
    renderDialogueComplete = fixedRenderDialogueComplete;
  }

  function syncFromOriginal() {
    const original = byId('lessonAdventureSelect');
    if (!original || original.dataset.mvHomeSync) return;
    original.dataset.mvHomeSync = 'true';
    original.addEventListener('change', () => {
      setAdventureEverywhere(original.value, false);
      fillHomeAdventureSelect();
    });
  }

  function refresh() {
    installHomeAdventureChooser();
    syncFromOriginal();
    fillHomeAdventureSelect();
    installDialogueCompletionFix();
  }

  function init() {
    refresh();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvTimer);
      observer._mvTimer = setTimeout(refresh, 180);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
