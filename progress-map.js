(() => {
  'use strict';

  const ACTIVE_KEY = 'memoviet_active_adventure_v2';
  const PAGE_SIZE = 8;
  let page = 0;
  let wrappedCompletion = false;

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  const PLACES = [
    {name:'Hà Nội', x:170, y:180, icon:'🏮', palette:['#d96d5f','#f5d7b4'], text:'Autour du lac Hoàn Kiếm, ruelles, temples et maisons étroites racontent plusieurs siècles d’histoire urbaine.'},
    {name:'Ninh Bình', x:165, y:230, icon:'🚣', palette:['#6f9f78','#d8e4b8'], text:'Rivières calmes et pitons calcaires composent un paysage souvent surnommé la baie d’Along terrestre.'},
    {name:'Baie d’Hạ Long', x:245, y:190, icon:'⛵', palette:['#5b9fb0','#d7eef0'], text:'Des milliers d’îlots calcaires émergent du golfe du Tonkin dans une brume presque irréelle.'},
    {name:'Sa Pa', x:95, y:90, icon:'🌾', palette:['#7aa36a','#e5d7a8'], text:'Les rizières en terrasses épousent les montagnes du nord, près de villages hmong et dao.'},
    {name:'Hà Giang', x:145, y:60, icon:'⛰️', palette:['#7c8b76','#d9c7a1'], text:'Routes en lacets, cols vertigineux et plateaux de pierre font de cette province un grand voyage montagneux.'},
    {name:'Lac Ba Bể', x:190, y:120, icon:'🛶', palette:['#4e8f89','#cde6d8'], text:'Un vaste lac naturel serpente entre falaises boisées, grottes et villages sur pilotis.'},
    {name:'Mai Châu', x:125, y:220, icon:'🏡', palette:['#86a768','#ead9ae'], text:'Une vallée de rizières et de maisons sur pilotis, connue pour l’accueil des communautés thaïes blanches.'},
    {name:'Huế', x:220, y:450, icon:'🏯', palette:['#8f6a91','#ead8c6'], text:'L’ancienne capitale impériale conserve sa citadelle, ses tombeaux royaux et la rivière des Parfums.'},
    {name:'Hội An', x:235, y:510, icon:'🏮', palette:['#d9854f','#f3df9f'], text:'Le vieux port s’illumine de lanternes au bord de la rivière Thu Bồn, entre maisons jaunes et anciens comptoirs.'},
    {name:'Đà Nẵng', x:240, y:490, icon:'🌉', palette:['#4c9aac','#d7e6df'], text:'Une grande ville côtière entre plages, montagnes de Marbre et péninsule verdoyante de Sơn Trà.'},
    {name:'Sanctuaire de Mỹ Sơn', x:210, y:525, icon:'🛕', palette:['#a45d43','#e5c59f'], text:'Au cœur d’une vallée, les tours de brique témoignent de l’ancienne civilisation cham.'},
    {name:'Phong Nha', x:180, y:390, icon:'🪨', palette:['#557f70','#cadbc9'], text:'Un monde de grottes, rivières souterraines et forêts calcaires s’étend dans le centre du pays.'},
    {name:'Đà Lạt', x:215, y:680, icon:'🌸', palette:['#a06f91','#dce6c5'], text:'Sur les hauts plateaux, le climat frais nourrit jardins, serres, pins et villas anciennes.'},
    {name:'Nha Trang', x:260, y:650, icon:'🐚', palette:['#469eb3','#f2dfb1'], text:'Une baie lumineuse, des îles proches et les tours cham de Po Nagar donnent son caractère à la ville.'},
    {name:'Quy Nhơn', x:245, y:590, icon:'🌊', palette:['#4a96a9','#e7d7ad'], text:'Plages tranquilles, caps rocheux et vestiges cham ponctuent cette côte encore paisible.'},
    {name:'Buôn Ma Thuột', x:190, y:620, icon:'☕', palette:['#795844','#d9b58f'], text:'Au cœur des hauts plateaux, la ville est étroitement liée à la culture du café vietnamien.'},
    {name:'Hô Chi Minh-Ville', x:185, y:755, icon:'🏙️', palette:['#d26355','#f3d5a4'], text:'Une métropole vive où marchés, cafés, immeubles modernes et bâtiments coloniaux se côtoient.'},
    {name:'Tunnels de Củ Chi', x:165, y:745, icon:'🕯️', palette:['#7d6f4f','#d7c79e'], text:'Ce vaste réseau souterrain rappelle les conditions de vie et de combat pendant la guerre du Vietnam.'},
    {name:'Delta du Mékong', x:190, y:830, icon:'🌴', palette:['#4d9477','#dce0a8'], text:'Canaux, vergers et villages s’organisent autour d’un fleuve qui se divise avant de rejoindre la mer.'},
    {name:'Cần Thơ', x:175, y:810, icon:'🛶', palette:['#579a8d','#efdca7'], text:'La grande ville du delta est connue pour ses marchés fluviaux et ses quais animés.'},
    {name:'Bến Tre', x:210, y:790, icon:'🥥', palette:['#6c9a66','#e5d49c'], text:'Cocotiers, petits canaux et ateliers familiaux dessinent un paysage emblématique du delta.'},
    {name:'Châu Đốc', x:120, y:795, icon:'🕌', palette:['#8a789a','#eed7aa'], text:'Près de la frontière cambodgienne, la ville mêle cultures khmère, cham et kinh autour du mont Sam.'},
    {name:'Phú Quốc', x:70, y:820, icon:'🏝️', palette:['#4f9ca1','#f3dca5'], text:'Forêts tropicales, villages de pêcheurs et plages entourent cette grande île du golfe de Thaïlande.'},
    {name:'Côn Đảo', x:250, y:850, icon:'🐢', palette:['#4d8996','#d8e4c7'], text:'Un archipel isolé, marqué par son histoire carcérale et aujourd’hui protégé pour sa nature marine.'},
    {name:'Mũi Né', x:265, y:720, icon:'🏜️', palette:['#cf8e52','#f3d7a6'], text:'Dunes rouges et blanches rencontrent la mer près d’un ancien village de pêcheurs.'},
    {name:'Tây Ninh', x:140, y:730, icon:'🛕', palette:['#d48b58','#e8d5bd'], text:'La région abrite le grand temple du caodaïsme, religion née dans le sud du Vietnam.'},
    {name:'Tràng An', x:178, y:245, icon:'🪷', palette:['#63937a','#d9e4bd'], text:'Des barques glissent entre montagnes, rizières et temples dans un vaste paysage karstique.'},
    {name:'Cao Bằng', x:220, y:80, icon:'💧', palette:['#489b94','#dce8cf'], text:'La province du nord-est est célèbre pour ses vallées et la spectaculaire cascade de Bản Giốc.'},
    {name:'Bắc Hà', x:110, y:115, icon:'🧺', palette:['#bd6c75','#e6d4a8'], text:'Ses marchés de montagne rassemblent vêtements brodés, produits locaux et communautés des environs.'},
    {name:'Mộc Châu', x:90, y:260, icon:'🍃', palette:['#6f9d63','#e1e6b9'], text:'Collines de thé, vergers et plateaux frais s’étendent sur la route des montagnes du nord-ouest.'}
  ];

  function adventures() {
    try { return adventureCollections().map(item => ({id:item.id, label:item.label})); } catch {}
    try { return collections.filter(item => item.kind === 'aventure').map(item => ({id:item.id, label:item.label})); } catch {}
    const select = $('lessonAdventureSelect');
    return select ? [...select.options].map(option => ({id:option.value, label:option.textContent || option.value})) : [];
  }

  function totalStages() {
    try { return LESSON_STAGES.length; } catch { return 6; }
  }

  function progressFor(id) {
    try {
      const state = lessonState(id);
      const completed = Array.isArray(state.completed) ? [...new Set(state.completed.map(Number))] : [];
      return {completed, done:completed.length, total:totalStages()};
    } catch {
      return {completed:[], done:0, total:totalStages()};
    }
  }

  function memoryState(card) {
    try { return normalizedMemoryState(card.id); } catch {}
    try { return cardState(card.id); } catch {}
    return {seen:0, due:0, lastGrade:null, status:'new', lapses:0};
  }

  function needsReview(card) {
    const state = memoryState(card);
    let queued = false;
    try { queued = Array.isArray(progress.mistakeQueue) && progress.mistakeQueue.includes(card.id); } catch {}
    const seen = Number(state.seen || 0) > 0;
    const due = seen && Number(state.due || 0) <= Date.now();
    return seen && (queued || due || state.lastGrade === 0 || state.lastGrade === 1 || state.status === 'relearning' || Number(state.lapses || 0) >= 2);
  }

  function reviewCount(id) {
    try { return cards.filter(card => (card.collection || 'base') === id && needsReview(card)).length; }
    catch { return 0; }
  }

  function activeId() {
    const list = adventures();
    const ids = list.map(item => item.id);
    const saved = localStorage.getItem(ACTIVE_KEY);
    const selected = $('lessonAdventureSelect')?.value;
    return ids.includes(saved) ? saved : ids.includes(selected) ? selected : ids[0] || 'av01';
  }

  function selectAdventure(id) {
    if (!id) return;
    localStorage.setItem(ACTIVE_KEY, id);
    const shared = $('mvSharedAdventureSelect');
    if (shared && shared.value !== id) {
      shared.value = id;
      shared.dispatchEvent(new Event('change', {bubbles:true}));
      return;
    }
    const original = $('lessonAdventureSelect');
    if (original && original.value !== id) {
      original.value = id;
      original.dispatchEvent(new Event('change', {bubbles:true}));
    }
  }

  function placeFor(index) {
    return PLACES[index % PLACES.length];
  }

  function installPanel() {
    if ($('mvJourneyPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'mvJourneyPanel';
    panel.className = 'panel mv-page-hub mv-journey-panel';
    panel.dataset.mvUxView = 'home';
    panel.innerHTML = `
      <div class="mv-journey-head">
        <div><p class="eyebrow">Carnet de voyage</p><h2>Progression et découvertes</h2></div>
        <div id="mvJourneySummary" class="mv-journey-summary"></div>
      </div>
      <div class="mv-journey-tabs" role="tablist" aria-label="Carnet de progression">
        <button type="button" class="active" data-journey-tab="progress" role="tab" aria-selected="true">Progression</button>
        <button type="button" data-journey-tab="map" role="tab" aria-selected="false">Carte du Vietnam</button>
      </div>
      <div id="mvJourneyProgress" class="mv-journey-view"></div>
      <div id="mvJourneyMap" class="mv-journey-view" hidden></div>
      <dialog id="mvPlaceDialog" class="mv-place-dialog"><form method="dialog"><button class="mv-place-close" aria-label="Fermer">×</button><div id="mvPlaceContent"></div></form></dialog>`;
    const anchor = $('mvHomeHub');
    if (anchor) anchor.insertAdjacentElement('afterend', panel);
    else (document.querySelector('main') || document.body).prepend(panel);

    panel.querySelector('.mv-journey-tabs').addEventListener('click', event => {
      const button = event.target.closest('[data-journey-tab]');
      if (!button) return;
      panel.querySelectorAll('[data-journey-tab]').forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      $('mvJourneyProgress').hidden = button.dataset.journeyTab !== 'progress';
      $('mvJourneyMap').hidden = button.dataset.journeyTab !== 'map';
    });
  }

  function stageDots(progress) {
    return Array.from({length:progress.total}, (_, index) => `<span class="${progress.completed.includes(index) ? 'done' : ''}" title="Étape ${index + 1}"></span>`).join('');
  }

  function renderProgress() {
    const root = $('mvJourneyProgress');
    if (!root) return;
    const list = adventures();
    const active = activeId();
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.max(0, Math.min(page, totalPages - 1));
    const visible = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    root.innerHTML = `
      <div class="mv-progress-table-wrap">
        <table class="mv-progress-table">
          <thead><tr><th>Aventure</th><th>Étapes</th><th>À revoir</th><th>État</th></tr></thead>
          <tbody>${visible.map((item, localIndex) => {
            const index = page * PAGE_SIZE + localIndex;
            const progress = progressFor(item.id);
            const finished = progress.done >= progress.total;
            const started = progress.done > 0;
            const status = finished ? 'Terminée' : started ? 'En cours' : 'À découvrir';
            return `<tr data-adventure-id="${esc(item.id)}" class="${item.id === active ? 'active' : ''}">
              <td><button type="button" class="mv-progress-adventure"><span class="mv-progress-number">${index + 1}</span><strong>${esc(item.label)}</strong></button></td>
              <td><div class="mv-stage-dots" aria-label="${progress.done} étapes sur ${progress.total}">${stageDots(progress)}</div><small>${progress.done}/${progress.total}</small></td>
              <td><strong>${reviewCount(item.id)}</strong></td>
              <td><span class="mv-progress-status ${finished ? 'done' : started ? 'current' : 'locked'}">${status}</span></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
      <div class="mv-progress-pager">
        <button type="button" data-page-prev ${page === 0 ? 'disabled' : ''}>‹</button>
        <span>${page + 1} / ${totalPages}</span>
        <button type="button" data-page-next ${page >= totalPages - 1 ? 'disabled' : ''}>›</button>
      </div>`;

    root.querySelectorAll('[data-adventure-id]').forEach(row => row.addEventListener('click', () => selectAdventure(row.dataset.adventureId)));
    root.querySelector('[data-page-prev]')?.addEventListener('click', () => { page--; renderProgress(); });
    root.querySelector('[data-page-next]')?.addEventListener('click', () => { page++; renderProgress(); });
  }

  function mapPath() {
    return 'M170 38 C205 52 230 82 222 120 C216 148 238 172 224 207 C211 240 187 261 191 301 C195 346 219 370 220 414 C222 466 255 511 248 558 C242 597 218 626 228 665 C238 704 225 735 208 765 C195 787 202 815 184 848 C166 827 147 817 139 788 C132 760 147 731 136 704 C124 674 138 640 154 614 C170 587 171 551 161 521 C150 486 172 455 162 423 C152 389 137 363 145 331 C155 292 137 267 141 231 C146 191 130 162 139 126 C146 96 150 64 170 38 Z';
  }

  function renderMap() {
    const root = $('mvJourneyMap');
    if (!root) return;
    const list = adventures();
    const completedCount = list.filter(item => {
      const progress = progressFor(item.id);
      return progress.done >= progress.total;
    }).length;
    const unlocked = list.slice(0, completedCount);

    root.innerHTML = `
      <div class="mv-map-layout">
        <div class="mv-vietnam-map" aria-label="Carte des lieux débloqués au Vietnam">
          <svg viewBox="0 0 360 900" role="img" aria-label="Silhouette du Vietnam">
            <defs>
              <filter id="mvPaper"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="3" seed="8"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter>
              <linearGradient id="mvLand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dce8c8"/><stop offset=".55" stop-color="#b9d2ad"/><stop offset="1" stop-color="#e7d7ae"/></linearGradient>
            </defs>
            <path class="mv-map-shadow" d="${mapPath()}" transform="translate(5 7)"/>
            <path class="mv-map-land" d="${mapPath()}" filter="url(#mvPaper)"/>
            <path class="mv-map-river" d="M177 155 C164 232 190 298 173 368 C159 438 201 510 183 586 C171 640 204 701 184 792"/>
          </svg>
          <div class="mv-map-pins">${unlocked.map((item, index) => {
            const place = placeFor(index);
            return `<button type="button" class="mv-map-pin" data-place-index="${index}" style="--pin-x:${place.x / 3.6}%;--pin-y:${place.y / 9}%" aria-label="Ouvrir ${esc(place.name)}"><span>📍</span><small>${index + 1}</small></button>`;
          }).join('')}</div>
          ${unlocked.length ? '' : '<div class="mv-map-empty">Termine une aventure pour gagner ta première épingle.</div>'}
        </div>
        <aside class="mv-map-legend">
          <strong>${completedCount} épingle${completedCount > 1 ? 's' : ''} gagnée${completedCount > 1 ? 's' : ''}</strong>
          <p>Chaque aventure terminée révèle un nouveau lieu.</p>
          <div class="mv-unlocked-list">${unlocked.slice(-5).reverse().map((item, reverseIndex) => {
            const index = unlocked.length - 1 - reverseIndex;
            const place = placeFor(index);
            return `<button type="button" data-place-index="${index}"><span>${place.icon}</span><span><strong>${esc(place.name)}</strong><small>Aventure ${index + 1}</small></span></button>`;
          }).join('')}</div>
        </aside>
      </div>`;

    root.querySelectorAll('[data-place-index]').forEach(button => button.addEventListener('click', () => openPlace(Number(button.dataset.placeIndex))));
  }

  function openPlace(index) {
    const place = placeFor(index);
    const adventure = adventures()[index];
    const content = $('mvPlaceContent');
    if (!content) return;
    content.innerHTML = `
      <div class="mv-place-watercolor" style="--wash-a:${place.palette[0]};--wash-b:${place.palette[1]}"><span>${place.icon}</span></div>
      <p class="eyebrow">Épingle ${index + 1} · ${esc(adventure?.label || `Aventure ${index + 1}`)}</p>
      <h2>${esc(place.name)}</h2>
      <p>${esc(place.text)}</p>
      <button type="button" class="primary" id="mvPlaceAdventure">Revoir l’aventure associée</button>`;
    $('mvPlaceAdventure')?.addEventListener('click', () => {
      selectAdventure(adventure?.id);
      $('mvPlaceDialog').close();
    });
    $('mvPlaceDialog').showModal();
  }

  function renderSummary() {
    const root = $('mvJourneySummary');
    if (!root) return;
    const list = adventures();
    const finished = list.filter(item => {
      const progress = progressFor(item.id);
      return progress.done >= progress.total;
    }).length;
    root.innerHTML = `<strong>${finished}/${list.length}</strong><span>aventures terminées</span>`;
  }

  function render() {
    installPanel();
    renderSummary();
    renderProgress();
    renderMap();
  }

  function wrapCompletion() {
    if (wrappedCompletion || typeof markLessonStageComplete !== 'function') return;
    const original = markLessonStageComplete;
    markLessonStageComplete = function(...args) {
      const result = original.apply(this, args);
      setTimeout(render, 80);
      return result;
    };
    wrappedCompletion = true;
  }

  function bindAdventure() {
    const select = $('lessonAdventureSelect');
    if (!select || select.dataset.mvJourneyBound) return;
    select.dataset.mvJourneyBound = 'true';
    select.addEventListener('change', () => setTimeout(render, 0));
  }

  function init() {
    installPanel();
    wrapCompletion();
    bindAdventure();
    render();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mvJourneyTimer);
      observer._mvJourneyTimer = setTimeout(() => { bindAdventure(); wrapCompletion(); render(); }, 260);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
