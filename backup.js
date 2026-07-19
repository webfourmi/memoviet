(() => {
  'use strict';

  const FORMAT = 'memoviet-full-backup';
  const VERSION = 1;
  const SNAPSHOT_KEY = 'memoviet_restore_snapshot_v1';
  const PREFIXES = ['vietmemo', 'memoviet'];
  let pendingBackup = null;

  const storageKeys = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && PREFIXES.some(prefix => key.toLowerCase().startsWith(prefix))) keys.push(key);
    }
    return keys.sort();
  };

  const makeBackup = () => ({
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    app: 'MemoViet',
    origin: location.origin,
    localStorage: Object.fromEntries(storageKeys().map(key => [key, localStorage.getItem(key)]))
  });

  const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const notify = message => {
    try { toast(message); }
    catch { window.alert(message); }
  };

  const exportAll = () => {
    const data = makeBackup();
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(data, `memoviet-sauvegarde-${date}.json`);
    notify(`${Object.keys(data.localStorage).length} éléments sauvegardés.`);
  };

  const validateBackup = data => {
    if (!data || data.format !== FORMAT || !data.localStorage || typeof data.localStorage !== 'object') {
      throw new Error('Ce fichier n’est pas une sauvegarde complète MemoViet valide.');
    }
    return data;
  };

  const applyBackup = data => {
    const current = makeBackup();
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(current));
    storageKeys().forEach(key => localStorage.removeItem(key));
    Object.entries(data.localStorage).forEach(([key, value]) => {
      if (typeof key === 'string' && typeof value === 'string') localStorage.setItem(key, value);
    });
    location.reload();
  };

  const restoreSnapshot = () => {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return;
    try {
      const snapshot = validateBackup(JSON.parse(raw));
      if (confirm('Rétablir les données présentes avant la dernière restauration ?')) applyBackup(snapshot);
    } catch {
      sessionStorage.removeItem(SNAPSHOT_KEY);
    }
  };

  const markup = `
    <dialog id="mvBackupDialog" class="mv-backup-dialog">
      <form method="dialog" class="mv-backup-shell">
        <header><div><p class="eyebrow">Coffre de voyage</p><h2>Sauvegarde complète</h2></div><button type="button" id="mvBackupClose" class="ghost">✕</button></header>
        <p>Transfère la progression, les favoris, les réglages audio et les leçons modifiées vers un autre appareil.</p>
        <div class="mv-backup-grid">
          <button type="button" id="mvBackupExport" class="primary"><strong>Exporter</strong><span>Créer un fichier de sauvegarde</span></button>
          <label class="secondary mv-backup-import"><strong>Importer</strong><span>Choisir un fichier MemoViet</span><input id="mvBackupFile" type="file" accept="application/json,.json" hidden></label>
        </div>
        <section id="mvBackupPreview" class="mv-backup-preview" hidden></section>
        <footer><button type="button" id="mvBackupUndo" class="ghost">Annuler la dernière restauration</button><button type="button" id="mvBackupApply" class="primary" disabled>Restaurer et redémarrer</button></footer>
      </form>
    </dialog>`;

  const install = () => {
    document.body.insertAdjacentHTML('beforeend', markup);
    const dialog = document.getElementById('mvBackupDialog');
    const fileInput = document.getElementById('mvBackupFile');
    const preview = document.getElementById('mvBackupPreview');
    const apply = document.getElementById('mvBackupApply');

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'mvOpenBackup';
    button.className = 'secondary mv-open-backup';
    button.textContent = '💾 Sauvegarde complète';
    const target = document.querySelector('.guided-lesson-head') || document.querySelector('header') || document.body;
    target.append(button);

    button.addEventListener('click', () => dialog.showModal());
    document.getElementById('mvBackupClose').addEventListener('click', () => dialog.close());
    document.getElementById('mvBackupExport').addEventListener('click', exportAll);
    document.getElementById('mvBackupUndo').addEventListener('click', restoreSnapshot);
    apply.addEventListener('click', () => pendingBackup && applyBackup(pendingBackup));

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        pendingBackup = validateBackup(JSON.parse(await file.text()));
        const count = Object.keys(pendingBackup.localStorage).length;
        preview.hidden = false;
        preview.innerHTML = `<strong>${count} éléments trouvés</strong><p>Sauvegarde du ${new Date(pendingBackup.exportedAt).toLocaleString('fr-FR')}.</p><p>La restauration remplacera les données MemoViet présentes sur cet appareil.</p>`;
        apply.disabled = false;
      } catch (error) {
        pendingBackup = null;
        preview.hidden = false;
        preview.textContent = error.message;
        apply.disabled = true;
      }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();