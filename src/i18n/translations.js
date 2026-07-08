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
    // ── License & Payment screens ──
    license: {
      title: 'License & Activation', deviceId: 'Device ID',
      annualSubscription: 'Annual subscription · 365 days', perYear: 'per year',
      demoActive: 'Demo Active — {days} days remaining',
      demoAvailable: '7-Day Free Demo Available',
      demoTagline: 'Try the full system free for 7 days. No credit card required.',
      demoExpired: 'Your 7-day demo has expired. Activate a paid license to continue.',
      payViaPaystack: 'Pay {price} / year via Paystack',
      startDemo: 'Start 7-Day Free Demo',
      continueDemo: 'Continue Demo ({days} days left)',
      hideKeyEntry: 'Hide License Key Entry', haveKey: 'I have a license key',
      licenseKey: 'License Key', activating: 'Activating…', activateLicense: 'Activate License',
      cancel: 'Cancel', backToSetup: 'Back to setup',
      invalidKey: 'Invalid license key. The key may be malformed, or it does not match the tier, modules, capacity, or client name entered. Verify each field matches what was provided at purchase.',
      keyExpired: 'This license key has expired. Please contact AgoroX for renewal.',
      paymentNotConfigured: 'Payment not configured. Enter your license key manually.',
      paymentSucceededButFailed: 'Payment succeeded (Ref: {ref}) but activation failed automatically. Please contact AgoroX support with this reference.',
      paystackNotLoaded: 'Paystack not loaded. Enter license key manually.',
      demoExpiresIn: 'Demo expires in {days} day{plural}',
      demoRemaining: 'Demo — {days} day{plural} remaining',
      upgradeFullLicense: 'Upgrade to Full License',
      choosePlan: 'Choose your plan',
      annualBilling: 'Annual subscription, billed once a year. Upgrade anytime as your farm grows.',
      close: 'Close', loadingPlans: 'Loading plans…', mostPopular: 'Most popular',
      perYearShort: '/year', pleaseWait: 'Please wait…', choosePlanBtn: 'Choose {name}',
      ownerOnly: 'Only the farm owner can purchase or change the subscription.',
      securePayment: 'Secure payment by Paystack · cards, bank transfer & USSD',
      billingNotConfigured: 'Billing is not configured yet. Please try again later.',
      ownerOnlyPurchase: 'Only the farm owner can purchase a subscription.',
      activatingPlan: 'Payment received — activating your plan…',
      planActive: 'Your plan is now active. Thank you!',
      paymentReceivedDelay: 'Payment received. Your plan will activate shortly — you can refresh in a moment.',
      checkoutCancelled: 'Checkout cancelled. No payment was made.',
      starterFeatures: ['Up to 2 devices','Core PoultryOS','Houses, batches & mortality','Feed & vaccination tracking','Offline-capable, cloud-synced'],
      professionalFeatures: ['Up to 5 devices','Everything in Starter','HatcheryOS module','Advanced analytics','Priority email support'],
      enterpriseFeatures: ['Up to 15 devices','Everything in Professional','FeedMillOS module','Multi-branch ready','Dedicated support'],
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
    license: {
      title: 'Licence et Activation', deviceId: 'ID de l\'appareil',
      annualSubscription: 'Abonnement annuel · 365 jours', perYear: 'par an',
      demoActive: 'Démo Active — {days} jours restants',
      demoAvailable: 'Démo Gratuite de 7 Jours Disponible',
      demoTagline: 'Essayez le système complet gratuitement pendant 7 jours. Aucune carte bancaire requise.',
      demoExpired: 'Votre démo de 7 jours a expiré. Activez une licence payante pour continuer.',
      payViaPaystack: 'Payer {price} / an via Paystack',
      startDemo: 'Démarrer la Démo Gratuite de 7 Jours',
      continueDemo: 'Continuer la Démo ({days} jours restants)',
      hideKeyEntry: 'Masquer la Saisie de Clé', haveKey: 'J\'ai une clé de licence',
      licenseKey: 'Clé de Licence', activating: 'Activation…', activateLicense: 'Activer la Licence',
      cancel: 'Annuler', backToSetup: 'Retour à la configuration',
      invalidKey: 'Clé de licence invalide. La clé peut être mal formée, ou ne correspond pas au niveau, aux modules, à la capacité ou au nom du client saisis. Vérifiez que chaque champ correspond à ce qui a été fourni à l\'achat.',
      keyExpired: 'Cette clé de licence a expiré. Veuillez contacter AgoroX pour le renouvellement.',
      paymentNotConfigured: 'Paiement non configuré. Entrez votre clé de licence manuellement.',
      paymentSucceededButFailed: 'Paiement réussi (Réf : {ref}) mais l\'activation automatique a échoué. Veuillez contacter le support AgoroX avec cette référence.',
      paystackNotLoaded: 'Paystack non chargé. Entrez la clé de licence manuellement.',
      demoExpiresIn: 'La démo expire dans {days} jour{plural}',
      demoRemaining: 'Démo — {days} jour{plural} restant{plural}',
      upgradeFullLicense: 'Passer à la Licence Complète',
      choosePlan: 'Choisissez votre forfait',
      annualBilling: 'Abonnement annuel, facturé une fois par an. Passez à un forfait supérieur à tout moment.',
      close: 'Fermer', loadingPlans: 'Chargement des forfaits…', mostPopular: 'Le plus populaire',
      perYearShort: '/an', pleaseWait: 'Veuillez patienter…', choosePlanBtn: 'Choisir {name}',
      ownerOnly: 'Seul le propriétaire de la ferme peut acheter ou modifier l\'abonnement.',
      securePayment: 'Paiement sécurisé par Paystack · cartes, virement bancaire et USSD',
      billingNotConfigured: 'La facturation n\'est pas encore configurée. Veuillez réessayer plus tard.',
      ownerOnlyPurchase: 'Seul le propriétaire de la ferme peut acheter un abonnement.',
      activatingPlan: 'Paiement reçu — activation de votre forfait…',
      planActive: 'Votre forfait est maintenant actif. Merci !',
      paymentReceivedDelay: 'Paiement reçu. Votre forfait sera activé sous peu — vous pouvez actualiser dans un instant.',
      checkoutCancelled: 'Paiement annulé. Aucun montant n\'a été débité.',
      starterFeatures: ['Jusqu\'à 2 appareils','PoultryOS de base','Bâtiments, lots et mortalité','Suivi alimentation et vaccination','Fonctionne hors ligne, synchronisé au cloud'],
      professionalFeatures: ['Jusqu\'à 5 appareils','Tout ce qui est inclus dans Starter','Module HatcheryOS','Analyses avancées','Support par e-mail prioritaire'],
      enterpriseFeatures: ['Jusqu\'à 15 appareils','Tout ce qui est inclus dans Professional','Module FeedMillOS','Prêt pour le multi-sites','Support dédié'],
    },
  },
};

// Safe getter: t('navPoultry.cmd') -> 'Command Center' / 'Centre de Commande'.
// Falls back to English, then to the key itself, so a missing translation
// never crashes the UI or shows blank text.
//
// Supports simple {placeholder} interpolation for dynamic values, e.g.:
//   translate('en', 'license.demoActive', { days: 5 })
//   -> 'Demo Active — 5 days remaining'
function lookup(lang, path) {
  const parts = path.split('.');
  let node = translations[lang] || translations[DEFAULT_LANGUAGE];
  for (const p of parts) {
    node = node && node[p];
    if (node === undefined) break;
  }
  return node;
}

export function translate(lang, path, vars) {
  let str = lookup(lang, path);
  if (str === undefined) str = lookup(DEFAULT_LANGUAGE, path);
  if (str === undefined) return path;
  if (vars) {
    for (const key of Object.keys(vars)) {
      str = str.split('{' + key + '}').join(String(vars[key]));
    }
  }
  return str;
}
