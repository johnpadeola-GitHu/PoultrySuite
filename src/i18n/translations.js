// ─────────────────────────────────────────────────────────────────────────
// Translation dictionary — English (default) and French.
//
// Scope (Stage 3 of the multi-language rollout): navigation labels, common
// UI actions used throughout the app, and Command Center screens for all
// three modules (PoultryOS, HatcheryOS, FeedMillOS). Deep translation of
// every individual form field, Help doc, and legal document is a larger,
// separate follow-up — see i18n/README.md.
//
// Keys are grouped by area. Add new keys here, then reference them via
// t('area.key') from any component using useLanguage().
// ─────────────────────────────────────────────────────────────────────────

export const LANGUAGES = {
  en: { code: 'en', label: 'English', nativeLabel: 'English' },
  fr: { code: 'fr', label: 'French', nativeLabel: 'Français' },
};

export const DEFAULT_LANGUAGE = 'en';

export const translations = {
  en: {
    // ── Common UI (used across all modules) ──
    common: {
      save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete',
      add: 'Add', close: 'Close', back: 'Back', next: 'Next',
      search: 'Search', filter: 'Filter', export: 'Export', import: 'Import',
      loading: 'Loading…', noData: 'No data', notes: 'Notes',
      date: 'Date', status: 'Status', actions: 'Actions', confirm: 'Confirm',
      yes: 'Yes', no: 'No', all: 'All', today: 'Today',
      viewAll: 'View All', seeMore: 'See More', total: 'Total',
      active: 'Active', inactive: 'Inactive', pending: 'Pending',
      completed: 'Completed', name: 'Name', quantity: 'Quantity',
      price: 'Price', amount: 'Amount', supplier: 'Supplier',
      customer: 'Customer', category: 'Category', settings: 'Settings',
    },
    // ── Navigation — PoultryOS ──
    navPoultry: {
      cmd: 'Command Center', daily: 'Daily Log', house: 'Houses & Batches',
      vax: 'Vaccinations', feed: 'Feed Tracking', health: 'Health & Mortality',
      vet: 'Veterinary & Medical', bio: 'Quarantine & Biosecurity',
      orders: 'Sales & Procurement', finance: 'Financials', audit: 'Audit Log',
      settings: 'Settings & Backup', help: 'Help & Docs',
    },
    // ── Navigation — HatcheryOS ──
    navHatchery: {
      cmd: 'Command Center', intake: 'Egg Intake', incubation: 'Incubation',
      candling: 'Candling', hatch: 'Hatch Output', breeder: 'Breeder Flocks',
      grading: 'Chick Grading', vaccine: 'Vaccination & Processing',
      inventory: 'Inventory', orders: 'Sales & Procurement',
      finance: 'Financials', audit: 'Audit Log', settings: 'Settings & Backup',
      help: 'Help & Docs',
    },
    // ── Navigation — FeedMillOS ──
    navFeedmill: {
      cmd: 'Command Center', recipe: 'Formulation & Recipe',
      intake: 'Raw Materials', rmqc: 'Raw Material QC', batch: 'Production Batch',
      lots: 'Lot Traceability', equipment: 'Equipment & Maintenance',
      qc: 'Quality Control', cert: 'Certificates', stock: 'Finished Inventory',
      distrib: 'Distribution', orders: 'Sales & Procurement',
      finance: 'Financials', audit: 'Audit Log', settings: 'Settings & Backup',
      help: 'Help & Docs',
    },
    // ── Command Center — PoultryOS ──
    cmdPoultry: {
      title: 'Command Center', activeBatches: 'Active Batches',
      liveBirds: 'Live Birds', mortalityRate: 'Mortality Rate',
      totalFeed: 'Total Feed (kg)', netPL: 'Net P&L', eggCrates: 'Egg Crates',
      profit: 'Profit', loss: 'Loss', allTime: 'all time',
      demoMode: 'Demo Mode — sample data displayed',
      quarantineActive: 'Quarantine Active',
    },
    // ── Command Center — HatcheryOS ──
    cmdHatchery: {
      title: 'Command Center', activeCycles: 'Active Cycles',
      eggsInSystem: 'Eggs in System', fertilityRate: 'Fertility Rate',
      hatchability: 'Hatchability', docOutput: 'DOC Output', netPL: 'Net P&L',
      totalBatches: 'total batches',
    },
    // ── Command Center — FeedMillOS ──
    cmdFeedmill: {
      title: 'Command Center', totalBatches: 'Total Batches',
      totalProduced: 'Total Produced', avgEfficiency: 'Avg Efficiency',
      finishedStock: 'Finished Stock', netPL: 'Net P&L', running: 'running',
    },
  },
  fr: {
    common: {
      save: 'Enregistrer', cancel: 'Annuler', edit: 'Modifier', delete: 'Supprimer',
      add: 'Ajouter', close: 'Fermer', back: 'Retour', next: 'Suivant',
      search: 'Rechercher', filter: 'Filtrer', export: 'Exporter', import: 'Importer',
      loading: 'Chargement…', noData: 'Aucune donnée', notes: 'Notes',
      date: 'Date', status: 'Statut', actions: 'Actions', confirm: 'Confirmer',
      yes: 'Oui', no: 'Non', all: 'Tout', today: "Aujourd'hui",
      viewAll: 'Tout voir', seeMore: 'Voir plus', total: 'Total',
      active: 'Actif', inactive: 'Inactif', pending: 'En attente',
      completed: 'Terminé', name: 'Nom', quantity: 'Quantité',
      price: 'Prix', amount: 'Montant', supplier: 'Fournisseur',
      customer: 'Client', category: 'Catégorie', settings: 'Paramètres',
    },
    navPoultry: {
      cmd: 'Centre de Commande', daily: 'Journal Quotidien', house: 'Bâtiments & Lots',
      vax: 'Vaccinations', feed: 'Suivi de l\u2019Alimentation', health: 'Santé & Mortalité',
      vet: 'Vétérinaire & Médical', bio: 'Quarantaine & Biosécurité',
      orders: 'Ventes & Approvisionnement', finance: 'Finances', audit: 'Journal d\u2019Audit',
      settings: 'Paramètres & Sauvegarde', help: 'Aide & Documentation',
    },
    navHatchery: {
      cmd: 'Centre de Commande', intake: 'Réception des Œufs', incubation: 'Incubation',
      candling: 'Mirage', hatch: "Résultats d'Éclosion", breeder: 'Troupeaux Reproducteurs',
      grading: 'Sexage & Classement', vaccine: 'Vaccination & Traitement',
      inventory: 'Inventaire', orders: 'Ventes & Approvisionnement',
      finance: 'Finances', audit: 'Journal d\u2019Audit', settings: 'Paramètres & Sauvegarde',
      help: 'Aide & Documentation',
    },
    navFeedmill: {
      cmd: 'Centre de Commande', recipe: 'Formulation & Recette',
      intake: 'Matières Premières', rmqc: 'Contrôle Qualité Matières', batch: 'Lot de Production',
      lots: 'Traçabilité des Lots', equipment: 'Équipement & Maintenance',
      qc: 'Contrôle Qualité', cert: 'Certificats', stock: 'Stock de Produits Finis',
      distrib: 'Distribution', orders: 'Ventes & Approvisionnement',
      finance: 'Finances', audit: 'Journal d\u2019Audit', settings: 'Paramètres & Sauvegarde',
      help: 'Aide & Documentation',
    },
    cmdPoultry: {
      title: 'Centre de Commande', activeBatches: 'Lots Actifs',
      liveBirds: "Oiseaux Vivants", mortalityRate: 'Taux de Mortalité',
      totalFeed: 'Aliment Total (kg)', netPL: 'Résultat Net', eggCrates: "Caisses d'Œufs",
      profit: 'Bénéfice', loss: 'Perte', allTime: 'depuis le début',
      demoMode: 'Mode Démo — données d\u2019exemple affichées',
      quarantineActive: 'Quarantaine Active',
    },
    cmdHatchery: {
      title: 'Centre de Commande', activeCycles: "Cycles Actifs",
      eggsInSystem: 'Œufs dans le Système', fertilityRate: 'Taux de Fertilité',
      hatchability: "Taux d'Éclosion", docOutput: 'Poussins Produits', netPL: 'Résultat Net',
      totalBatches: 'lots au total',
    },
    cmdFeedmill: {
      title: 'Centre de Commande', totalBatches: 'Total des Lots',
      totalProduced: 'Total Produit', avgEfficiency: 'Efficacité Moyenne',
      finishedStock: 'Stock de Produits Finis', netPL: 'Résultat Net', running: 'en cours',
    },
  },
};

// Safe getter: t('navPoultry.cmd') -> 'Command Center' / 'Centre de Commande'.
// Falls back to English, then to the key itself, so a missing translation
// never crashes the UI or shows blank text.
export function translate(lang, path) {
  const parts = path.split('.');
  let node = translations[lang] || translations[DEFAULT_LANGUAGE];
  for (const p of parts) {
    node = node && node[p];
    if (node === undefined) break;
  }
  if (node !== undefined) return node;
  // fallback to English
  let enNode = translations[DEFAULT_LANGUAGE];
  for (const p of parts) {
    enNode = enNode && enNode[p];
    if (enNode === undefined) break;
  }
  return enNode !== undefined ? enNode : path;
}
