(() => {
  'use strict';

  const KEY = 'memoviet_ux_state_v1';
  const PAGE_SIZE = matchMedia('(max-width:700px)').matches ? 6 : 12;
  const views = [
    {id:'home', icon:'🏠', label:'Accueil', words:['accueil','tableau','progression','aujourd','objectif','sur place','voyage','démarrer']},
    {id:'learn', icon:'🌱', label:'Apprendre', words:['parcours','leçon','apprendre','bibliothèque','carte','vocabulaire','aventure','collection']},
    {id:'review', icon:'🧠', label:'Réviser', words:['ré