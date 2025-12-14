# Finance Pro - Gestionnaire de Finances Personnelles

Application de gestion de finances personnelles 100% locale et respectueuse de la vie privée. Conçue pour les relevés bancaires français, elle offre une expérience comparable aux applications bancaires commerciales.

![Finance Pro](https://img.shields.io/badge/Version-6.1-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## 🎯 Philosophie

**Local-First & Privacy-First** : Toutes les données restent sur votre appareil. Aucune API externe, aucune transmission de données. Vos informations financières ne quittent jamais votre navigateur.

**Manual-First Workflow** : Entrez vos transactions quotidiennement. Importez vos relevés bancaires mensuellement comme sauvegarde/synchronisation, sans risque de perdre vos entrées manuelles.

## ✨ Fonctionnalités Principales

### 📊 Tableau de Bord
- Statistiques mensuelles (revenus, dépenses, épargne, reste à vivre)
- Graphique donut des dépenses par catégorie
- Graphique de cashflow quotidien avec évolution cumulative
- Alertes budgétaires en temps réel
- Widget d'objectifs d'épargne
- Détection automatique des transactions récurrentes

### 💳 Gestion Multi-Comptes (V6)
- Comptes courants, épargne, espèces, investissement
- Filtrage des données par compte sélectionné
- IBAN et informations bancaires personnalisables

### 📥 Import de Données
- **CSV** : Format français (Date; Libellé; Montant) avec support multi-colonnes (Débit/Crédit)
- **PDF** : Relevés Caisse d'Épargne (parsing local via pdfjs-dist)
- Prévisualisation avant import avec validation
- Détection des doublons par ID déterministe
- Correction des signes (revenus/dépenses) avant import

### 🏷️ Catégorisation Automatique
- 30+ catégories prédéfinies (Loyer, Énergie, Transport, Courses, etc.)
- 100+ mots-clés de reconnaissance automatique
- Règles personnalisables par l'utilisateur
- Distinction charges fixes (incompressibles) vs variables
- Tags personnalisés pour classification secondaire

### 📈 Projection Financière
- Prévisions multi-années (2022-2042)
- Paramètres annuels configurables
- Objectif d'épargne avec suivi de progression
- Calcul du "reste à vivre" mensuel

### 🎯 Objectifs d'Épargne
- Création d'objectifs avec montant cible et deadline
- Suivi de progression avec barres de progression
- Widget compact sur la page d'accueil
- Alertes de délais imminents

### 💰 Gestion des Budgets
- Budgets mensuels par catégorie
- Alertes de dépassement en temps réel
- Historique de consommation

### 🔄 Transactions Récurrentes
- Détection automatique (mensuel, trimestriel, annuel)
- Sparklines d'historique des montants
- Activation/désactivation du suivi
- Estimation des coûts fixes mensuels

### 📱 PWA & Mode Hors-Ligne
- Installation sur mobile et desktop
- Fonctionnement complet hors-ligne
- Service Worker avec cache network-first

### 🔧 Fonctionnalités Avancées
- **Undo/Redo** : Historique des modifications
- **Raccourcis clavier** : Ctrl+N (nouveau), Ctrl+Z (annuler), etc.
- **Backup/Restore** : Export/import JSON complet
- **Thème clair/sombre** : Design Mercury Premium
- **Bouton flottant** : Ajout rapide de transactions
- **Indicateur hors-ligne** : Notification de connectivité

## 🛠️ Stack Technique

| Technologie | Usage |
|-------------|-------|
| **React 18** | Framework UI avec hooks |
| **TypeScript** | Typage statique |
| **Vite** | Build tool ultra-rapide |
| **Tailwind CSS** | Styles utilitaires |
| **shadcn/ui** | Composants UI accessibles |
| **Recharts** | Graphiques interactifs |
| **pdfjs-dist** | Parsing PDF local |
| **Zod** | Validation de schémas |
| **date-fns** | Manipulation de dates |
| **localStorage** | Persistance des données |

## 📁 Structure du Projet

```
src/
├── components/          # Composants React réutilisables
│   ├── ui/             # Composants shadcn/ui
│   └── ...             # Composants métier
├── hooks/              # Hooks personnalisés
│   ├── useKeyboardShortcuts.ts
│   ├── useUndoRedo.ts
│   └── use-toast.ts
├── pages/              # Pages de l'application
│   ├── Index.tsx       # Page d'accueil
│   ├── Dashboard.tsx   # Tableau de bord avancé
│   ├── Accounts.tsx    # Gestion des comptes
│   ├── History.tsx     # Archives et recherche
│   ├── Categories.tsx  # Gestion des règles
│   ├── Budgets.tsx     # Budgets mensuels
│   ├── Goals.tsx       # Objectifs d'épargne
│   ├── Projection.tsx  # Projections financières
│   ├── Recurring.tsx   # Transactions récurrentes
│   └── Settings.tsx    # Paramètres
├── utils/              # Utilitaires et logique métier
│   ├── parseCSV.ts     # Parser CSV multi-format
│   ├── parsePDF.ts     # Parser PDF Caisse d'Épargne
│   ├── categorize.ts   # Moteur de catégorisation
│   ├── computeStats.ts # Calcul des statistiques
│   ├── localStore.ts   # Abstraction localStorage
│   ├── validation.ts   # Schémas Zod
│   └── types.ts        # Types TypeScript
└── index.css           # Design system Mercury
```

## 🚀 Installation

```bash
# Cloner le repository
git clone <YOUR_GIT_URL>

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build production
npm run build
```

## 📋 Formats CSV Supportés

### Format 3 colonnes (standard)
```csv
Date;Libellé;Montant
15/01/2024;CARREFOUR MARKET;-45,30
16/01/2024;VIREMENT SALAIRE;2500,00
```

### Format 4 colonnes (Débit/Crédit séparés)
```csv
Date;Libellé;Débit;Crédit
15/01/2024;CARREFOUR MARKET;45,30;
16/01/2024;VIREMENT SALAIRE;;2500,00
```

### Formats de montants reconnus
- Montants signés : `-45,30` ou `+2500,00`
- Signe à droite : `45,30-`
- Indicateurs DR/CR : `45,30 DR` ou `2500,00 CR`
- Séparateurs : `,` ou `.` comme décimale
- Symbole euro : `45,30 €`

## 🎨 Design System "Mercury Premium"

- **Police** : Inter avec letter-spacing serré
- **Thème clair** : Fond beige/blanc minimal
- **Thème sombre** : Fond navy/noir premium
- **Accent** : Bleu électrique (#1e88ff)
- **Effets** : Glassmorphism, micro-animations, glow

## 🔒 Sécurité & Confidentialité

- ✅ 100% local - aucune donnée transmise
- ✅ Validation Zod sur tous les formulaires
- ✅ Validation profonde des imports JSON
- ✅ Confirmation avant suppressions
- ✅ IDs déterministes anti-doublons
- ✅ Prêt pour chiffrement PBKDF2 futur

## 📱 Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+N` | Nouvelle transaction |
| `Ctrl+Shift+I` | Importer fichier |
| `Ctrl+F` | Rechercher |
| `Ctrl+Z` | Annuler |
| `Ctrl+Shift+Z` | Rétablir |
| `Shift+?` | Aide raccourcis |
| `H` | Accueil |
| `D` | Dashboard |

## 📊 Catégories Disponibles

### Charges Fixes (Incompressibles)
- 🏠 Loyer
- ⚡ Énergie (EDF, Engie, etc.)
- 🛡️ Assurances
- 🌐 Internet
- 📱 Mobile
- 🚇 Transport
- 📈 Investissements

### Dépenses Variables
- 🛒 Courses
- 🍽️ Restauration
- 🛍️ Shopping
- 🚬 Tabac
- 🎬 Loisirs
- 💊 Santé
- 🔁 Virements internes
- 📦 Divers

## 🤝 Contribution

Ce projet est développé avec [Lovable](https://lovable.dev). Les modifications peuvent être faites :
- Directement dans l'éditeur Lovable
- Via GitHub après connexion du repository
- Localement puis push vers GitHub

## 📄 Licence

Projet personnel - Tous droits réservés.

---

*Développé avec ❤️ pour une gestion financière simple, locale et respectueuse de votre vie privée.*
