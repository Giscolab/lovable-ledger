import { CategoryRule, CategoryType } from './types';

export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  // INCOMPRESSIBLE - Charges fixes
  {
    category: 'rent',
    keywords: [
      'loyer', 'habitat', 'hlm', 'office', 'logement', 'apl', 'caf',
      'bail', 'propriétaire', 'agence immobilière', 'syndic', 'charges locatives'
    ],
    isIncompressible: true,
  },
  {
    category: 'utilities',
    keywords: [
      'edf', 'gdf', 'sowee', 'engie', 'eau', 'électricité', 'power',
      'veolia', 'suez', 'total energie', 'eni', 'direct energie',
      'chauffage', 'gaz', 'kwh', 'compteur'
    ],
    isIncompressible: true,
  },
  {
    category: 'insurance',
    keywords: [
      'bpce', 'assurance', 'habitation', 'gav', 'pj', 'mutuelle',
      'maif', 'axa', 'macif', 'groupama', 'allianz', 'generali',
      'mma', 'matmut', 'maaf', 'gmf', 'swiss life', 'agipi',
      'responsabilité civile', 'prévoyance', 'santé'
    ],
    isIncompressible: true,
  },
  {
    category: 'internet',
    keywords: [
      'sfr', 'box', 'mobile', 'forfait', 'fibre', 'orange', 'free',
      'bouygues', 'sosh', 'red by sfr', 'b&you', 'nrj mobile',
      'prixtel', 'coriolis', 'la poste mobile', 'internet', 'adsl'
    ],
    isIncompressible: true,
  },
  {
    category: 'transport',
    keywords: [
      'navigo', 'ratp', 'sncf', 'transport', 'bus', 'metro', 'tram',
      'velib', 'autolib', 'taxi', 'uber', 'bolt', 'kapten', 'heetch',
      'blablacar', 'ouigo', 'tgv', 'ter', 'rer', 'transilien',
      'péage', 'autoroute', 'essence', 'gasoil', 'carburant', 'total', 'shell', 'bp'
    ],
    isIncompressible: true,
  },
  {
    category: 'investments',
    keywords: [
      'per', 'immobilier', 'retraite', 'plan', 'placement', 'épargne',
      'livret a', 'ldds', 'pel', 'cea', 'pea', 'assurance vie',
      'bourse', 'action', 'obligation', 'sicav', 'fcp', 'etf',
      'crypto', 'bitcoin', 'ethereum', 'trading', 'boursorama', 'degiro'
    ],
    isIncompressible: true,
  },

  // VARIABLE - Dépenses variables
  {
    category: 'groceries',
    keywords: [
      'carrefour', 'auchan', 'market', 'supermarché', 'leclerc', 'lidl',
      'monoprix', 'franprix', 'intermarché', 'super u', 'casino',
      'simply', 'match', 'cora', 'géant', 'hyper u', 'picard',
      'primeur', 'boucherie', 'poissonnerie', 'épicerie', 'bio c bon',
      'naturalia', 'biocoop', 'la vie claire'
    ],
    isIncompressible: false,
  },
  {
    category: 'food',
    keywords: [
      'deliveroo', 'restaurant', 'mcd', 'kfc', 'burger', 'sandwich',
      'uber eats', 'just eat', 'pizza', 'sushi', 'boulangerie',
      'café', 'bar', 'brasserie', 'bistrot', 'kebab', 'tacos',
      'dominos', 'pizza hut', 'mcdonalds', 'quick', 'subway',
      'starbucks', 'paul', 'brioche dorée', 'class croute',
      'foodora', 'frichti', 'getir', 'gorillas'
    ],
    isIncompressible: false,
  },
  {
    category: 'shopping',
    keywords: [
      'ldlc', 'fnac', 'decathlon', 'c&a', 'go sport', 'amazon',
      'zalando', 'asos', 'h&m', 'zara', 'uniqlo', 'kiabi',
      'celio', 'jules', 'promod', 'mango', 'ikea', 'but',
      'conforama', 'leroy merlin', 'castorama', 'brico depot',
      'darty', 'boulanger', 'electro depot', 'cdiscount',
      'aliexpress', 'wish', 'shein', 'vinted', 'leboncoin'
    ],
    isIncompressible: false,
  },
  {
    category: 'smoking',
    keywords: [
      'tabac', 'cigarette', 'fumeur', 'bureau de tabac', 'la tabatière',
      'vape', 'vapotage', 'e-cigarette', 'pmu', 'fdj', 'loto'
    ],
    isIncompressible: false,
  },
  {
    category: 'entertainment',
    keywords: [
      'google play', 'cinéma', 'netflix', 'billet', 'spectacle',
      'spotify', 'deezer', 'apple music', 'amazon prime', 'disney',
      'canal+', 'ocs', 'hbo', 'paramount', 'crunchyroll',
      'playstation', 'xbox', 'nintendo', 'steam', 'epic games',
      'théâtre', 'concert', 'festival', 'expo', 'musée',
      'parc attraction', 'bowling', 'laser game', 'escape game',
      'billetreduc', 'ticketmaster', 'fnac spectacles'
    ],
    isIncompressible: false,
  },
  {
    category: 'health',
    keywords: [
      'pharmacie', 'doctolib', 'médical', 'médecin', 'docteur',
      'hopital', 'clinique', 'dentiste', 'ophtalmo', 'dermato',
      'kiné', 'ostéo', 'psy', 'psychologue', 'psychiatre',
      'laboratoire', 'analyse', 'radio', 'scanner', 'irm',
      'optique', 'lunettes', 'lentilles', 'audition', 'prothèse'
    ],
    isIncompressible: false,
  },
];

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  rent: 'Loyer',
  utilities: 'Énergie',
  electricity: 'Électricité',
  water: 'Eau',
  insurance: 'Assurances',
  home_insurance: 'Assurance Habitation',
  internet: 'Internet',
  mobile: 'Mobile',
  transport: 'Transport',
  investments: 'Investissements',
  groceries: 'Courses',
  food: 'Restauration',
  shopping: 'Shopping',
  smoking: 'Tabac',
  entertainment: 'Loisirs',
  health: 'Santé',
  household: 'Maison',
  internal_transfer: 'Virement interne',
  streaming: 'Streaming',
  subscriptions: 'Abonnements',
  clothing: 'Vêtements',
  beauty: 'Beauté',
  gifts: 'Cadeaux',
  hobbies: 'Hobbies',
  travel: 'Voyages',
  bank_fees: 'Frais Bancaires',
  taxes: 'Impôts',
  donations: 'Dons',
  unexpected: 'Imprévus',
  other: 'Divers',
};

export const CATEGORY_ICONS: Record<CategoryType, string> = {
  rent: '🏠',
  utilities: '⚡',
  electricity: '💡',
  water: '💧',
  insurance: '🛡️',
  home_insurance: '🏡',
  internet: '🌐',
  mobile: '📱',
  transport: '🚇',
  investments: '📈',
  groceries: '🛒',
  food: '🍽️',
  shopping: '🛍️',
  smoking: '🚬',
  entertainment: '🎬',
  health: '💊',
  household: '🧹',
  internal_transfer: '🔁',
  streaming: '📺',
  subscriptions: '📋',
  clothing: '👕',
  beauty: '💄',
  gifts: '🎁',
  hobbies: '🎨',
  travel: '✈️',
  bank_fees: '🏦',
  taxes: '📑',
  donations: '❤️',
  unexpected: '⚠️',
  other: '📦',
};

export const INCOMPRESSIBLE_CATEGORIES: CategoryType[] = [
  'rent',
  'utilities',
  'electricity',
  'water',
  'insurance',
  'home_insurance',
  'internet',
  'mobile',
  'transport',
  'investments',
];

// Helper to get category color class
export const getCategoryColorClass = (category: CategoryType): string => {
  const colorMap: Record<CategoryType, string> = {
    rent: 'bg-category-rent',
    utilities: 'bg-category-utilities',
    electricity: 'bg-category-utilities',
    water: 'bg-category-utilities',
    insurance: 'bg-category-insurance',
    home_insurance: 'bg-category-insurance',
    internet: 'bg-category-internet',
    mobile: 'bg-category-internet',
    transport: 'bg-category-transport',
    investments: 'bg-category-investments',
    groceries: 'bg-category-groceries',
    food: 'bg-category-food',
    shopping: 'bg-category-shopping',
    smoking: 'bg-category-smoking',
    entertainment: 'bg-category-entertainment',
    health: 'bg-category-health',
    household: 'bg-category-other',
    internal_transfer: 'bg-category-other',
    streaming: 'bg-category-entertainment',
    subscriptions: 'bg-category-other',
    clothing: 'bg-category-shopping',
    beauty: 'bg-category-health',
    gifts: 'bg-category-other',
    hobbies: 'bg-category-entertainment',
    travel: 'bg-category-transport',
    bank_fees: 'bg-category-other',
    taxes: 'bg-category-other',
    donations: 'bg-category-other',
    unexpected: 'bg-category-other',
    other: 'bg-category-other',
  };
  return colorMap[category] || colorMap.other;
};