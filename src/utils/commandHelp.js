// Documentation détaillée des commandes pour le système help

export const commandHelp = {
  // Commandes de configuration
  prefix: {
    description: 'Gérer le préfixe des commandes',
    usage: [
      '`prefix view` - Voir le préfixe actuel (serveur et personnel)',
      '`prefix set <préfixe>` - Définir le préfixe du serveur (Admin)',
      '`prefix remove` - Réinitialiser le préfixe du serveur (Admin)',
      '`prefix self <préfixe>` - Définir votre préfixe personnel',
    ],
    examples: [
      '`prefix view`',
      '`prefix set !`',
      '`prefix self $`',
      '`prefix remove`',
    ],
    permissions: 'Gérer le serveur (pour set/remove)',
  },

  settings: {
    description: 'Configuration du serveur',
    usage: [
      '`settings config` - Voir la configuration actuelle',
      '`settings modlog <canal>` - Définir le canal de modération',
      '`settings muted <rôle>` - Définir le rôle muet',
      '`settings staff <rôle>` - Ajouter/retirer un rôle staff',
      '`settings reset` - Réinitialiser toute la configuration (Admin)',
    ],
    examples: [
      '`settings config`',
      '`settings modlog #logs`',
      '`settings muted @Muted`',
      '`settings staff @Modérateur`',
    ],
    permissions: 'Gérer le serveur',
  },

  customize: {
    description: 'Modifier le profil complet du bot (PP, bannière, activité, bio, etc.)',
    arguments: 'avatar, banner, activity, bio, username, nickname',
    syntax: 'set avatar <url> banner <url> activity <type> <nom> [description] [url]',
    example: 'activity listening Blanka par PNL',
    module: 'Configuration',
    aliases: ['profile', 'setprofile'],
    usage: [
      '`customize set avatar <url> banner <url> activity <type> <nom> [description] [url]` - Tout en une fois',
      '`customize activity <type> <nom> [description] [url]` - Activité uniquement',
      'Types: playing, streaming, listening, watching, competing, custom',
      '`customize avatar <url>` - PP uniquement',
      '`customize banner <url>` - Bannière uniquement',
      '`customize view` - Voir la config',
    ],
    examples: [
      '`customize activity playing Minecraft`',
      '`customize activity streaming Ma chaîne https://twitch.tv/user`',
      '`customize activity listening Blanka par PNL`',
      '`customize activity watching Netflix`',
      '`customize activity competing League of Legends`',
    ],
    permissions: 'Propriétaire du bot / Gérer le serveur',
  },

  // Commandes de modération (style vile)
  ban: {
    description: 'Bannit un membre du serveur',
    arguments: 'membre, raison',
    syntax: '(membre) [raison]',
    example: '@User Spam',
    module: 'Modération',
    aliases: ['b'],
    usage: ['`ban <membre> [raison]` - Bannir un membre'],
    examples: ['`ban @Utilisateur`', '`ban @Utilisateur Spam`'],
    permissions: 'Bannir des membres',
  },

  kick: {
    description: 'Expulse un membre du serveur',
    arguments: 'membre, raison',
    syntax: '(membre) [raison]',
    example: '@User Comportement inapproprié',
    module: 'Modération',
    aliases: ['k'],
    usage: ['`kick <membre> [raison]` - Expulser un membre'],
    examples: ['`kick @Utilisateur`', '`kick @Utilisateur Comportement inapproprié`'],
    permissions: 'Expulser des membres',
  },

  timeout: {
    description: 'Mute temporairement un membre',
    arguments: 'membre, minutes, raison',
    syntax: '(membre) <minutes> [raison]',
    example: '@User 60 Spam',
    module: 'Modération',
    aliases: ['mute', 'tm'],
    usage: ['`timeout <membre> <minutes> [raison]` - Muter un membre'],
    examples: ['`timeout @Utilisateur 60`', '`timeout @Utilisateur 30 Spam`'],
    permissions: 'Modérer les membres',
  },

  warn: {
    description: 'Avertit un membre',
    arguments: 'membre, raison',
    syntax: '(membre) [raison]',
    example: '@User Comportement inapproprié',
    module: 'Modération',
    aliases: ['w'],
    usage: ['`warn <membre> [raison]` - Avertir un membre'],
    examples: ['`warn @Utilisateur`', '`warn @Utilisateur Comportement inapproprié`'],
    permissions: 'Gérer les messages',
  },

  unban: {
    description: 'Débannit un utilisateur par son ID',
    arguments: 'id_utilisateur',
    syntax: '<id>',
    example: '123456789012345678',
    module: 'Modération',
    aliases: ['ub'],
    usage: ['`unban <id_utilisateur>` - Débannir un utilisateur'],
    examples: ['`unban 123456789012345678`'],
    permissions: 'Bannir des membres',
  },

  clear: {
    description: 'Supprime un nombre de messages (max 100)',
    arguments: 'nombre',
    syntax: '<nombre>',
    example: '50',
    module: 'Modération',
    aliases: ['purge', 'prune'],
    usage: ['`clear <nombre>` - Supprimer des messages (max 100)'],
    examples: ['`clear 10`', '`clear 50`'],
    permissions: 'Gérer les messages',
  },

  // Commandes d'information
  help: {
    description: 'Affiche l\'aide et les commandes disponibles',
    usage: [
      '`help` - Liste toutes les commandes',
      '`help <commande>` - Informations détaillées sur une commande',
    ],
    examples: [
      '`help`',
      '`help ban`',
      '`help prefix`',
    ],
    permissions: 'Aucune',
  },

  snipe: {
    description: 'Affiche le dernier message supprimé dans ce salon',
    arguments: 'aucun',
    syntax: '',
    example: '',
    module: 'Informations',
    aliases: ['s'],
    usage: ['`snipe` - Afficher le dernier message supprimé'],
    examples: ['`snipe`'],
    permissions: 'Aucune',
  },

  botinfo: {
    description: 'Affiche les informations sur le bot',
    usage: [
      '`botinfo` - Informations complètes sur le bot',
    ],
    examples: [
      '`botinfo`',
    ],
    permissions: 'Aucune',
  },

  userinfo: {
    description: 'Affiche des informations détaillées sur un utilisateur',
    usage: [
      '`userinfo [utilisateur]` - Informations sur un utilisateur (vous si aucun)',
    ],
    examples: [
      '`userinfo`',
      '`userinfo @Utilisateur`',
    ],
    permissions: 'Aucune',
  },

  serverinfo: {
    description: 'Affiche les informations sur le serveur',
    usage: [
      '`serverinfo` - Informations complètes sur le serveur',
    ],
    examples: [
      '`serverinfo`',
    ],
    permissions: 'Aucune',
  },

  // Commandes fun (style vile)
  '8ball': {
    description: 'Pose une question à la boule magique',
    arguments: 'question',
    syntax: '<question>',
    example: 'Est-ce que je vais gagner à la loterie ?',
    module: 'Fun',
    aliases: ['8b', 'ball'],
    usage: ['`8ball <question>` - Poser une question'],
    examples: ['`8ball Est-ce que je vais gagner à la loterie?`'],
    permissions: 'Aucune',
  },

  coinflip: {
    description: 'Lance une pièce (pile ou face)',
    usage: [
      '`coinflip` - Lancer une pièce',
    ],
    examples: [
      '`coinflip`',
    ],
    permissions: 'Aucune',
  },

  ping: {
    description: 'Affiche la latence du bot et de l\'API Discord',
    arguments: 'aucun',
    syntax: '',
    example: '',
    module: 'Utilitaires',
    aliases: ['p', 'latency'],
    usage: ['`ping` - Voir la latence'],
    examples: ['`ping`'],
    permissions: 'Aucune',
  },

  // Commandes utilitaires
  avatar: {
    description: 'Affiche l\'avatar d\'un utilisateur',
    arguments: 'utilisateur',
    syntax: '[utilisateur]',
    example: '@User',
    module: 'Utilitaires',
    aliases: ['av', 'pdp'],
    usage: ['`avatar [utilisateur]` - Avatar d\'un utilisateur (vous si aucun)'],
    examples: ['`avatar`', '`avatar @Utilisateur`'],
    permissions: 'Aucune',
  },

  calc: {
    description: 'Effectue un calcul mathématique',
    arguments: 'expression',
    syntax: '<expression>',
    example: '2 + 2 * 5',
    module: 'Utilitaires',
    aliases: ['math', 'calcul'],
    usage: ['`calc <expression>` - Calculer une expression'],
    examples: ['`calc 2 + 2`', '`calc 10 * 5`'],
    permissions: 'Aucune',
  },

  emoji: {
    description: 'Copier les emojis/stickers spécifiés ou lister les siens',
    usage: [
      '`emoji list` - Lister emojis et stickers du serveur',
      '`emoji export` - Exporter les emojis au format config (pour personnalisation)',
      '`emoji <emoji1> [emoji2] ...` - Copier les emojis collés',
      '`emoji` + autocollants - Copier les stickers du message',
    ],
    examples: [
      '`emoji list`',
      '`emoji :custom: :autre:`',
      'Ajoutez des autocollants au message avec `emoji`',
    ],
    permissions: 'Gérer les emojis et stickers (sauf list)',
  },

  // Autres commandes (à compléter au fur et à mesure)
  filter: {
    description: 'Gérer les filtres de chat',
    usage: [
      '`filter add <mot>` - Ajouter un mot filtré',
      '`filter remove <mot>` - Retirer un mot filtré',
      '`filter list` - Liste des mots filtrés',
      '`filter reset` - Réinitialiser les filtres',
      '`filter exempt <rôle>` - Ajouter un rôle exempt',
      '`filter exempt list` - Liste des rôles exempts',
    ],
    examples: [
      '`filter add spam`',
      '`filter exempt @Modérateur`',
    ],
    permissions: 'Gérer le serveur',
  },

  welcome: {
    description: 'Gérer les messages de bienvenue',
    usage: [
      '`welcome add <canal> <message>` - Ajouter un message de bienvenue',
      '`welcome remove <canal>` - Retirer un message',
      '`welcome view <canal>` - Voir un message',
      '`welcome list` - Liste des messages',
      '`welcome variables` - Variables disponibles',
    ],
    examples: [
      '`welcome add #bienvenue Bienvenue {user} !`',
    ],
    permissions: 'Gérer le serveur',
  },

  goodbye: {
    description: 'Gérer les messages d\'au revoir',
    usage: [
      '`goodbye add <canal> <message>` - Ajouter un message d\'au revoir',
      '`goodbye remove <canal>` - Retirer un message',
      '`goodbye view <canal>` - Voir un message',
      '`goodbye list` - Liste des messages',
      '`goodbye variables` - Variables disponibles',
    ],
    examples: [
      '`goodbye add #au-revoir Au revoir {user} !`',
    ],
    permissions: 'Gérer le serveur',
  },

  logs: {
    description: 'Configurer les logs du serveur',
    usage: [
      '`logs setup <id_catégorie>` - Configurer automatiquement tous les logs dans une catégorie',
      '`logs set <type> <canal>` - Définir un canal de log',
      '`logs remove <type>` - Retirer un canal de log',
      '`logs view <type>` - Voir un canal de log',
      '`logs list` - Liste des logs configurés',
    ],
    examples: [
      '`logs setup 123456789012345678` - Configurer tous les logs dans la catégorie (ID)',
      '`logs set join #join-logging`',
      '`logs set mod #mod-logging`',
    ],
    permissions: 'Gérer le serveur',
  },

  boosterrole: {
    description: 'Gérer les rôles de booster personnalisés',
    usage: [
      '`boosterrole list` - Liste des rôles booster',
      '`boosterrole create <nom> <couleur>` - Créer un rôle',
      '`boosterrole color <couleur>` - Changer la couleur',
      '`boosterrole remove` - Supprimer votre rôle',
      '`boosterrole random` - Couleur aléatoire',
    ],
    examples: [
      '`boosterrole create Mon Rôle #FF0000`',
      '`boosterrole color #00FF00`',
    ],
    permissions: 'Booster le serveur',
  },

  invite: {
    description: 'Obtenir le lien d\'invitation du bot',
    usage: [
      '`invite` - Afficher le lien d\'invitation',
    ],
    examples: [
      '`invite`',
    ],
    permissions: 'Aucune',
  },

  renew: {
    description: 'Supprime et recrée un canal au même endroit avec les mêmes permissions',
    usage: [
      '`renew [canal]` - Renouveler le canal mentionné (ou le canal actuel si aucun)',
    ],
    examples: [
      '`renew` - Renouveler le canal actuel',
      '`renew #général` - Renouveler le canal #général',
    ],
    permissions: 'Gérer les canaux',
  },

  roleall: {
    description: 'Ajouter un rôle à tous les membres du serveur',
    usage: [
      '`roleall <rôle>` - Ajouter un rôle à tous les membres',
    ],
    examples: [
      '`roleall @Membre` - Ajouter le rôle @Membre à tout le monde',
      '`roleall 123456789012345678` - Ajouter un rôle par son ID',
    ],
    permissions: 'Administrateur',
  },

  hide: {
    description: 'Cache un salon (textuel ou vocal)',
    usage: [
      '`hide [canal]` - Cacher le canal mentionné (ou le canal actuel si aucun)',
    ],
    examples: [
      '`hide` - Cacher le canal actuel',
      '`hide #général` - Cacher le canal #général',
    ],
    permissions: 'Gérer les canaux',
  },

  unhide: {
    description: 'Affiche un salon caché (textuel ou vocal)',
    usage: [
      '`unhide [canal]` - Afficher le canal mentionné (ou le canal actuel si aucun)',
    ],
    examples: [
      '`unhide` - Afficher le canal actuel',
      '`unhide #général` - Afficher le canal #général',
    ],
    permissions: 'Gérer les canaux',
  },

  lock: {
    description: 'Verrouille un salon (textuel ou vocal)',
    usage: [
      '`lock [canal]` - Verrouiller le canal mentionné (ou le canal actuel si aucun)',
    ],
    examples: [
      '`lock` - Verrouiller le canal actuel',
      '`lock #général` - Verrouiller le canal #général',
    ],
    permissions: 'Gérer les canaux',
  },

  unlock: {
    description: 'Déverrouille un salon (textuel ou vocal)',
    usage: [
      '`unlock [canal]` - Déverrouiller le canal mentionné (ou le canal actuel si aucun)',
    ],
    examples: [
      '`unlock` - Déverrouiller le canal actuel',
      '`unlock #général` - Déverrouiller le canal #général',
    ],
    permissions: 'Gérer les canaux',
  },

  hideall: {
    description: 'Cache tous les salons d\'une catégorie',
    usage: [
      '`hideall [canal]` - Cacher tous les salons de la catégorie du canal mentionné (ou du canal actuel)',
    ],
    examples: [
      '`hideall` - Cacher tous les salons de la catégorie du canal actuel',
      '`hideall #général` - Cacher tous les salons de la catégorie contenant #général',
    ],
    permissions: 'Gérer les canaux',
  },

  wl: {
    description: 'Gérer la whitelist (propriétaire uniquement)',
    usage: [
      '`wl add <@utilisateur|id>` - Ajouter un utilisateur à la whitelist',
      '`wl remove <@utilisateur|id>` - Retirer un utilisateur de la whitelist',
      '`wl list` - Voir tous les utilisateurs whitelistés',
      '`wl view <@utilisateur|id>` - Vérifier si un utilisateur est whitelisté',
    ],
    examples: [
      '`wl add @Utilisateur`',
      '`wl add 123456789012345678`',
      '`wl list`',
    ],
    permissions: 'Propriétaire uniquement',
  },

  alias: {
    description: 'Gérer les alias de commandes',
    usage: [
      '`alias add <alias> <commande>` - Créer un alias pour une commande',
      '`alias remove <alias>` - Supprimer un alias',
      '`alias list` - Voir tous les alias',
    ],
    examples: [
      '`alias add b ban`',
      '`alias list`',
    ],
    permissions: 'Gérer le serveur',
  },

  sticky: {
    description: 'Gérer les messages collants (sticky messages)',
    usage: [
      '`sticky set <message>` - Définir un message collant pour ce salon',
      '`sticky remove` - Retirer le message collant',
      '`sticky view` - Voir le message collant actuel',
    ],
    examples: [
      '`sticky set Bienvenue dans ce salon !`',
      '`sticky view`',
    ],
    permissions: 'Gérer les messages',
  },

  autoresponder: {
    description: 'Gérer les réponses automatiques',
    usage: [
      '`autoresponder add <trigger> <réponse>` - Ajouter une réponse automatique',
      '`autoresponder remove <trigger>` - Supprimer une réponse automatique',
      '`autoresponder list` - Voir toutes les réponses automatiques',
    ],
    examples: [
      '`autoresponder add bonjour Salut !`',
      '`autoresponder list`',
    ],
    permissions: 'Gérer le serveur',
  },

  imageonly: {
    description: 'Gérer les salons image-only',
    usage: [
      '`imageonly enable` - Activer le mode image-only pour ce salon',
      '`imageonly disable` - Désactiver le mode image-only',
      '`imageonly status` - Voir le statut du mode image-only',
    ],
    examples: [
      '`imageonly enable`',
      '`imageonly status`',
    ],
    permissions: 'Gérer les canaux',
  },

  pin: {
    description: 'Épingler un message',
    usage: [
      '`pin` - Épingler le message auquel vous répondez',
      '`pin <id_message>` - Épingler un message par son ID',
    ],
    examples: [
      'Répondez à un message avec `pin`',
      '`pin 123456789012345678`',
    ],
    permissions: 'Gérer les messages',
  },

  unpin: {
    description: 'Désépingler un message',
    usage: [
      '`unpin` - Désépingler le message auquel vous répondez',
      '`unpin <id_message>` - Désépingler un message par son ID',
    ],
    examples: [
      'Répondez à un message avec `unpin`',
      '`unpin 123456789012345678`',
    ],
    permissions: 'Gérer les messages',
  },

  firstmessage: {
    description: 'Voir le premier message d\'un salon',
    usage: [
      '`firstmessage` - Voir le premier message du salon actuel',
      '`firstmessage <#salon>` - Voir le premier message d\'un salon spécifique',
    ],
    examples: [
      '`firstmessage`',
      '`firstmessage #général`',
    ],
    permissions: 'Aucune',
  },

  dice: {
    description: 'Lancer des dés (format XdY ou XdY+Z)',
    arguments: 'expression',
    syntax: '<XdY> [±Z]',
    example: '2d6 ou 4d8+3',
    module: 'Fun',
    aliases: ['d', 'roll'],
    usage: ['`dice <expression>` - Ex: 1d6, 2d20, 4d8+3'],
    examples: ['`dice 1d6`', '`dice 2d20`', '`dice 4d8+3`'],
    permissions: 'Aucune',
  },

  urban: {
    description: 'Chercher une définition sur Urban Dictionary',
    arguments: 'terme',
    syntax: '<terme>',
    example: 'banger',
    module: 'Fun',
    aliases: ['ud', 'urbandict'],
    usage: ['`urban <terme>` - Définition du terme'],
    examples: ['`urban banger`', '`urban no cap`'],
    permissions: 'Aucune',
  },

  embed: {
    description: 'Créer un embed personnalisé (titre, description, couleur)',
    arguments: 'titre, description, couleur',
    syntax: '<titre> | <description> [| #couleur]',
    example: 'Annonce | Bienvenue ! | 5865F2',
    module: 'Utilitaires',
    usage: ['`embed <titre> | <description> [| couleur]`'],
    examples: ['`embed Annonce | Bienvenue !`', '`embed Événement | RDV samedi | FF0000`'],
    permissions: 'Gérer les messages',
  },

  suggest: {
    description: 'Créer une suggestion pour le serveur',
    arguments: 'suggestion',
    syntax: '<suggestion>',
    example: 'Ajouter un salon de musique',
    module: 'Fun',
    aliases: ['sug', 'suggestion'],
    usage: ['`suggest <suggestion>` - Créer une suggestion'],
    examples: ['`suggest Ajouter un salon de musique`'],
    permissions: 'Aucune',
  },

  webhook: {
    description: 'Gérer les webhooks',
    usage: [
      '`webhook create <nom>` - Créer un webhook dans ce salon',
      '`webhook list` - Voir tous les webhooks du salon',
      '`webhook delete <id>` - Supprimer un webhook',
    ],
    examples: [
      '`webhook create MonWebhook`',
      '`webhook list`',
    ],
    permissions: 'Gérer les webhooks',
  },

  ignore: {
    description: 'Gérer la liste d\'ignorés',
    usage: [
      '`ignore user <@utilisateur>` - Ajouter/retirer un utilisateur de la liste d\'ignorés',
      '`ignore channel <#salon>` - Ajouter/retirer un salon de la liste d\'ignorés',
      '`ignore list` - Voir la liste complète des ignorés',
    ],
    examples: [
      '`ignore user @Utilisateur`',
      '`ignore list`',
    ],
    permissions: 'Gérer le serveur',
  },

  boost: {
    description: 'Afficher les informations sur les boosts du serveur',
    usage: [
      '`boost` - Afficher les informations sur les boosts',
    ],
    examples: [
      '`boost`',
    ],
    permissions: 'Aucune',
  },

  profile: {
    description: 'Affiche le profil d\'un utilisateur',
    usage: ['`profile [@utilisateur|id]`'],
    examples: ['`profile`', '`profile @User`'],
    permissions: 'Aucune',
  },

  remind: {
    description: 'Programmer un rappel (MP ou serveur)',
    arguments: 'durée, message',
    syntax: '<durée> <message>',
    example: '5m Appeler maman',
    module: 'Perso',
    aliases: ['rappel', 'reminder'],
    usage: ['`remind <durée> <message>` - Ex: 30s, 5m, 1h, 2d'],
    examples: ['`remind 5m Pause`', '`remind 1h Réunion`'],
    permissions: 'Aucune',
  },

  backup: {
    description: 'Sauvegarder ou restaurer un serveur complet',
    usage: [
      '`backup create [messages] [durée]` - Créer une sauvegarde',
      '• messages: oui/non (défaut: non)',
      '• durée: 7j, 30j, 14d si messages=oui',
      '`backup restore` - Restaurer (joindre le fichier .json)',
    ],
    examples: [
      '`backup create`',
      '`backup create oui 30j`',
      '`backup restore` + fichier en pièce jointe',
    ],
    permissions: 'Administrateur',
  },

  giveaway: {
    description: 'Gérer les giveaways (cadeaux)',
    usage: [
      '`giveaway create <prix> <durée> <gagnants>` - Créer un giveaway',
      '`giveaway end <id>` - Terminer un giveaway',
      '`giveaway reroll <id>` - Retirer les gagnants',
      '`giveaway list` - Liste des giveaways actifs',
    ],
    examples: [
      '`giveaway create Nitro 1h 1`',
      '`giveaway create Jeu Steam 24d 3`',
    ],
    permissions: 'Gérer le serveur',
  },

  owner: {
    description: 'Gérer les owners du bot (propriétaire principal uniquement)',
    usage: [
      '`owner add <@user|id>` - Ajouter un owner',
      '`owner remove <@user|id>` - Retirer un owner',
      '`owner list` - Liste des owners',
    ],
    examples: [
      '`owner add @User`',
      '`owner list`',
    ],
    permissions: 'Propriétaire principal uniquement',
  },

  vip: {
    description: 'Gérer les abonnés VIP (owners uniquement)',
    usage: [
      '`vip add <@user|id>` - Ajouter un utilisateur VIP',
      '`vip remove <@user|id>` - Retirer le statut VIP',
      '`vip list` - Liste des utilisateurs VIP',
      '`vip check [@user]` - Vérifier le statut VIP',
    ],
    examples: [
      '`vip add @User`',
      '`vip list`',
    ],
    permissions: 'Propriétaire uniquement',
  },

  vouch: {
    description: 'Système de recommandations (vouches)',
    usage: [
      '`vouch add <@user> [commentaire]` - Ajouter un vouch',
      '`vouch remove <id>` - Retirer votre vouch',
      '`vouch list [@user]` - Liste des vouches',
      '`vouch profile [@user]` - Profil vouch',
    ],
    examples: [
      '`vouch add @User Très bon vendeur`',
      '`vouch profile @User`',
    ],
    permissions: 'Aucune',
  },

  notes: {
    description: 'Gérer tes notes personnelles',
    arguments: 'action, contenu',
    syntax: 'add|list|view|remove [contenu]',
    example: 'add Ma note',
    module: 'Perso',
    aliases: ['note', 'n'],
    usage: ['`notes add <texte>` - Ajouter', '`notes list` - Liste', '`notes view <id>` - Voir', '`notes remove <id>` - Supprimer'],
    examples: ['`notes add Idée`', '`notes list`'],
    permissions: 'Aucune',
  },
};
