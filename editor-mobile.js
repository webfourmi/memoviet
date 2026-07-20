(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';
  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  function replaceTextNode(element, text) {
    if (!element) return;
    const node = [...element.childNodes].find(item => item.nodeType === Node.TEXT_NODE);
    if (node) node.nodeValue = text;
  }

  function compactEditor() {
    if (!isMobile()) return;
    const dialog = document.getElementById('mvLessonEditor');
    if (!dialog) return;

    const select = document.getElementById('mvEditorAdventureSelect');
    select?.setAttribute('aria-label', 'Choisir une aventure');

    const exportButton = document.getElementById('mvEditorExport');
    if (exportButton) exportButton.textContent = 'Export';

    const importLabel = dialog.querySelector('.mv-editor-file');
    replaceTextNode(importLabel, 'Import');

    const resetButton = document.getElementById('mvEditorReset');
    if (resetButton) resetButton.textContent = 'Rétablir';

    const travelerButton = document.getElementById('mvEditorPreviewTraveler');
    if (travelerButton) travelerButton.textContent = 'Voyageuse';

    const localButton = document.getElementById('mvEditorPreviewLocal');
    if (localButton) localButton.textContent = 'PNJ';
  }

  function init() {
    compactEditor();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvEditorMobileTimer);
      observer._mvEditorMobileTimer = setTimeout(compactEditor, 80);
    });
    observer.observe(document.body, {childList: true, subtree: true});
    window.matchMedia(MOBILE_QUERY).addEventListener?.('change', compactEditor);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
