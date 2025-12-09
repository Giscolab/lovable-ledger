import { CategoryRule, CategoryType } from './types';

export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  // Incompressible expenses
  {
    category: 'rent',
    keywords: ['habitat', 'logement', 'loyer', 'apl', 'hlm'],
    isIncompressible: true,
  },
  {
    category: 'utilities',
    keywords: ['edf', 'gdf', 'sowee', 'engie', 'électricité', 'gaz', 'eau'],
    isIncompressible: true,
  },
  {
    category: 'insurance',
    keywords: ['bpce', 'gav', 'assurance', 'habitation', 'pj', 'mutuelle', 'maif', 'axa', 'macif'],
    isIncompressible: true,
  },
  {
    category: 'internet',
    keywords: ['sfr', 'box', 'mobile', 'orange', 'free', 'bouygues', 'sosh'],
    isIncompressible: true,
  },
  {
    category: 'transport',
    keywords: ['navigo', 'transport', 'ratp', 'sncf', 'metro', 'bus', 'tram', 'velib'],
    isIncompressible: true,
  },
  {
    category: 'investments',
    keywords: ['per', 'retraite', 'immobilier', 'versement volontaire', 'épargne', 'livret', 'bourse'],
    isIncompressible: true,
  },
  // Variable expenses
  {
    category: 'groceries',
    keywords: ['carrefour', 'auchan', 'city', 'supermarché', 'leclerc', 'lidl', 'monoprix', 'franprix', 'intermarché'],
    isIncompressible: false,
  },
  {
    category: 'food',
    keywords: ['deliveroo', 'restaurant', 'café', 'bar', 'sandwich', 'uber eats', 'just eat', 'pizza', 'sushi', 'boulangerie'],
    isIncompressible: false,
  },
  {
    category: 'shopping',
    keywords: ['ldlc', 'fnac', 'c&a', 'lovable', 'maillot', 'amazon', 'zalando', 'asos', 'decathlon', 'ikea'],
    isIncompressible: false,
  },
  {
    category: 'smoking',
    keywords: ['tabac', 'cigarettes', 'la tabatière', 'bureau de tabac'],
    isIncompressible: false,
  },
  {
    category: 'entertainment',
    keywords: ['google play', 'netflix', 'billetreduc', 'le napoleon', 'spotify', 'disney', 'cinema', 'concert', 'théâtre'],
    isIncompressible: false,
  },
  {
    category: 'health',
    keywords: ['pharmacie', 'healthcare', 'médecin', 'docteur', 'hopital', 'clinique', 'dentiste', 'ophtalmo'],
    isIncompressible: false,
  },
];

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  rent: 'Loyer',
  utilities: 'Énergie',
  insurance: 'Assurances',
  internet: 'Internet/Mobile',
  transport: 'Transport',
  investments: 'Investissements',
  groceries: 'Courses',
  food: 'Restauration',
  shopping: 'Shopping',
  smoking: 'Tabac',
  entertainment: 'Loisirs',
  health: 'Santé',
  other: 'Divers',
};

export const CATEGORY_ICONS: Record<CategoryType, string> = {
  rent: '🏠',
  utilities: '⚡',
  insurance: '🛡️',
  internet: '📱',
  transport: '🚇',
  investments: '📈',
  groceries: '🛒',
  food: '🍽️',
  shopping: '🛍️',
  smoking: '🚬',
  entertainment: '🎬',
  health: '💊',
  other: '📦',
};

export const INCOMPRESSIBLE_CATEGORIES: CategoryType[] = [
  'rent',
  'utilities',
  'insurance',
  'internet',
  'transport',
  'investments',
];
