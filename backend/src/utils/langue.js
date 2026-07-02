// Détection heuristique de la langue d'une musique/vidéo gospel —
// utilisée par l'agent IA pour assigner automatiquement le tag "langue".

// Correspondance directe avec les catégories de découverte multi-sources
export const CATEGORIE_LANGUE_MAP = {
  'gospel-haitien': 'CREOLE',
  'gospel-americain': 'ANGLAIS',
  'gospel-latino': 'ESPAGNOL',
  'gospel-africain': 'FRANCAIS',
  'worship-international': 'ANGLAIS',
};

const KEYWORDS = {
  CREOLE: [
    'stanley georges', 'bélo', 'belo', 'delly benson', 'neguswed', 'joël lorquet', 'joel lorquet',
    'frère gama', 'frere gama', 'pastor gregory', 'mikael', 'réveil', 'kesner duperval', 'james cadet',
    'bunel charles', 'guyto', 'haïtien', 'haitien', 'haïti', 'haiti', 'kreyòl', 'kreyol',
  ],
  FRANCAIS: [
    'gloire à dieu', 'gloire a dieu', 'franco-africain', 'louange française', 'louange francaise',
    'jésus', 'seigneur', 'français', 'francais',
  ],
  ANGLAIS: [
    'kirk franklin', 'maverick city', 'hillsong', 'elevation worship', 'bethel', 'jesus culture',
    'tasha cobbs', 'travis greene', 'chris tomlin', 'lauren daigle', 'sinach', 'nathaniel bassey',
    'michael w. smith', 'michael w smith',
  ],
  ESPAGNOL: ['musica cristiana', 'música cristiana', 'cristiana latina', 'evangelica', 'evangélica'],
};

export function detectLangue({ titre = '', artiste = '', categorie = '' } = {}) {
  if (categorie && CATEGORIE_LANGUE_MAP[categorie]) return CATEGORIE_LANGUE_MAP[categorie];

  const haystack = `${titre} ${artiste}`.toLowerCase();
  for (const [langue, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => haystack.includes(w))) return langue;
  }
  // "ò" est quasi-exclusif à l'orthographe créole haïtienne (absent du français standard)
  if (/ò/.test(haystack)) return 'CREOLE';
  return 'AUTRE';
}
