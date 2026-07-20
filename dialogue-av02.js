(() => {
  'use strict';

  const order = [
    'av02-01',
    'av02-02',
    'av02-05',
    'av02-06',
    'av02-03',
    'av02-04',
    'av02-07',
    'av02-08',
    'av02-09'
  ];

  const scenes = [
    {
      title: 'Je choisis mon plat',
      context: 'Tu consultes le menu, demandes ce qu’est un plat puis choisis du poisson.',
      count: 3
    },
    {
      title: 'Je précise la préparation',
      context: 'Tu vérifies qu’il n’y a pas de porc, précises le niveau de piment et demandes davantage de légumes.',
      count: 4
    },
    {
      title: 'Je termine le repas',
      context: 'Le repas t’a plu. Tu complimentes le restaurant puis demandes l’addition.',
      count: 2
    }
  ];

  const replies = {
    'av02-01': {
      vi: 'Dạ, đây là thực đơn. Hôm nay có cá kho tộ và cá nướng ạ.',
      fr: 'Bien sûr, voici le menu. Aujourd’hui, nous avons du poisson mijoté et du poisson grillé.'
    },
    'av02-02': {
      vi: 'Đây là cá kho tộ, ăn với cơm và rau ạ.',
      fr: 'C’est du poisson mijoté en marmite, servi avec du riz et des légumes.'
    },
    'av02-05': {
      vi: 'Dạ, vậy chị dùng món cá kho nhé?',
      fr: 'Très bien, vous prenez donc le poisson mijoté ?'
    },
    'av02-06': {
      vi: 'Dạ, món cá này không có thịt heo ạ.',
      fr: 'Oui, ce plat de poisson ne contient pas de porc.'
    },
    'av02-03': {
      vi: 'Dạ, chị muốn không cay hoàn toàn phải không ạ?',
      fr: 'Vous le souhaitez entièrement sans piment, c’est bien cela ?'
    },
    'av02-04': {
      vi: 'Vâng, tôi hiểu rồi: chỉ một chút cay thôi ạ.',
      fr: 'D’accord, j’ai compris : seulement un tout petit peu épicé.'
    },
    'av02-07': {
      vi: 'Được ạ, tôi sẽ thêm rau cho chị.',
      fr: 'Bien sûr, je vais ajouter des légumes.'
    },
    'av02-08': {
      vi: 'Cảm ơn chị! Chị dùng có vừa miệng không ạ?',
      fr: 'Merci beaucoup ! Le plat était-il à votre goût ?'
    },
    'av02-09': {
      vi: 'Dạ, tổng cộng một trăm hai mươi nghìn đồng ạ.',
      fr: 'Bien sûr, le total est de 120 000 đồng.'
    }
  };

  try {
    if (typeof DIALOGUE_ORDER_OVERRIDES !== 'undefined') {
      DIALOGUE_ORDER_OVERRIDES.av02 = [...order];
    }
    if (typeof DIALOGUE_SCENE_CONFIG !== 'undefined') {
      DIALOGUE_SCENE_CONFIG.av02 = scenes.map(scene => ({...scene}));
    }
    if (typeof DIALOGUE_REPLY_OVERRIDES !== 'undefined') {
      Object.assign(DIALOGUE_REPLY_OVERRIDES, replies);
    }
  } catch (error) {
    console.warn('MemoViet : le dialogue de l’aventure 2 n’a pas pu être actualisé.', error);
  }
})();
