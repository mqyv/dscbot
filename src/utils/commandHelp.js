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
    module: 'Configuration',
    aliases: ['profile', 'setprofile'],
    usage: [
      '`customize view` – Voir la configuration actuelle',
      '`customize avatar <url>` – Changer la photo de profil (PP)',
      '`customize banner <url>` – Changer la bannière du profil',
      '`customize bio <texte>` – Changer la bio du bot',
      '`customize username <nom>` – Changer le nom d\'utilisateur',
      '`customize nickname <surnom>` – Changer le surnom sur le serveur',
      '`customize activity <type> <nom> [description] [url]` – Changer l\'activité affichée',
      '  Types: `playing`, `streaming`, `listening`, `watching`, `competing`, `custom`',
      '  Pour streaming: l\'URL Twitch/YouTube est requise',
      '`customize activity clear` – Supprimer l\'activité',
      '`customize set avatar <url> banner <url> activity <texte> bio <texte> username <nom> nickname <surnom>` – Tout modifier en une fois (tu peux ne mettre que ce que tu veux changer)',
    ],
    examples: [
      '`customize view`',
      '`customize avatar https://exemple.com/image.png`',
      '`customize activity playing Minecraft`',
      '`customize activity listening Blanka par PNL`',
      '`customize activity streaming Ma chaîne https://twitch.tv/user`',
      '`customize activity watching Netflix`',
      '`customize activity clear`',
      '`customize bio Mon bot préféré`',
      '`customize set avatar https://... activity playing Discord`',
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
    description: 'Gérer les filtres de chat (mots interdits)',
    usage: [
      '`filter add <mot>` – Ajouter un mot à filtrer',
      '`filter remove <mot>` – Retirer un mot filtré',
      '`filter list` – Voir tous les mots filtrés',
      '`filter reset` – Réinitialiser tous les filtres',
      '`filter exempt <rôle>` – Ajouter ou retirer un rôle des exemptions (toggle)',
      '`filter exempt list` – Voir les rôles exemptés',
    ],
    examples: [
      '`filter add spam`',
      '`filter remove spam`',
      '`filter list`',
      '`filter exempt @Modérateur`',
      '`filter exempt list`',
    ],
    permissions: 'Gérer les canaux',
  },

  welcome: {
    description: 'Gérer les messages de bienvenue (quand un membre rejoint)',
    usage: [
      '`welcome add <canal> <message>` – Ajouter un message de bienvenue',
      '`welcome remove <canal>` – Retirer le message d\'un canal',
      '`welcome view <canal>` – Voir le message configuré pour un canal',
      '`welcome list` – Liste des canaux avec message de bienvenue',
      '`welcome variables` – Variables disponibles ({user}, {server}, etc.)',
    ],
    examples: [
      '`welcome add #bienvenue Bienvenue {user} sur {server} !`',
      '`welcome remove #bienvenue`',
      '`welcome variables`',
    ],
    permissions: 'Gérer le serveur',
  },

  goodbye: {
    description: 'Gérer les messages d\'au revoir (quand un membre quitte)',
    usage: [
      '`goodbye add <canal> <message>` – Ajouter un message d\'au revoir',
      '`goodbye remove <canal>` – Retirer le message d\'un canal',
      '`goodbye view <canal>` – Voir le message configuré pour un canal',
      '`goodbye list` – Liste des canaux avec message d\'au revoir',
      '`goodbye variables` – Variables disponibles ({user}, {server}, etc.)',
    ],
    examples: [
      '`goodbye add #au-revoir Au revoir {user} !`',
      '`goodbye remove #au-revoir`',
      '`goodbye variables`',
    ],
    permissions: 'Gérer le serveur',
  },

  logs: {
    description: 'Configurer les logs du serveur (modération, arrivées, etc.)',
    usage: [
      '`logs setup <id_catégorie>` – Créer tous les canaux de log dans une catégorie',
      '`logs set <type> <canal>` – Définir un canal pour un type de log',
      '`logs remove <type>` – Retirer un canal de log',
      '`logs view <type>` – Voir le canal configuré pour un type',
      '`logs list` – Liste de tous les logs configurés',
    ],
    examples: [
      '`logs setup 123456789012345678`',
      '`logs set join #arrivées`',
      '`logs set mod #modération`',
      '`logs list`',
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
    description: 'Stats d\'invitations ou lien du bot',
    usage: [
      '`invite @user` - Nombre d\'invitations de l\'utilisateur',
      '`invite set #canal` - Salon des arrivées (Gérer le serveur)',
      '`invite` - Lien d\'invitation du bot',
    ],
    examples: [
      '`invite @c`',
      '`invite set #arrivées`',
    ],
    permissions: 'Gérer le serveur (pour set)',
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
    description: 'Gérer les messages collants (répétés en bas du salon)',
    usage: [
      '`sticky set <message>` – Définir un message collant pour ce salon',
      '`sticky remove` – Retirer le message collant',
      '`sticky view` – Voir le message collant actuel',
    ],
    examples: [
      '`sticky set Bienvenue dans ce salon !`',
      '`sticky view`',
      '`sticky remove`',
    ],
    permissions: 'Gérer les messages',
  },

  ticket: {
    description: 'Système de tickets pour le support',
    usage: [
      '`ticket` – Menu de configuration',
      '`ticket setup` – Configurer le système',
      '`ticket addtype <nom> <emoji> <description>` – Ajouter un type de ticket',
      '`ticket removetype <nom>` – Retirer un type',
      '`ticket embed` – Envoyer le message avec les boutons',
      '`ticket close` – Fermer le ticket (dans un canal ticket)',
      '`ticket rename <nom>` – Renommer le ticket (staff, dans un canal ticket)',
      '`ticket add <@user>` – Ajouter quelqu\'un au ticket',
      '`ticket remove <@user>` – Retirer quelqu\'un du ticket',
      '`ticket config` – Voir la configuration',
      '`ticket lang <fr|en>` – Changer la langue',
    ],
    examples: [
      '`ticket setup`',
      '`ticket addtype Support 🎫 Besoin d\'aide ?`',
      '`ticket rename support-urgent`',
      '`ticket close`',
    ],
    permissions: 'Gérer le serveur',
  },

  joincreate: {
    description: 'Join to create : rejoins un vocal pour créer le tien (tu es prioritaire)',
    usage: [
      '`/joincreate set <canal>` – Définir le canal "rejoindre pour créer" (Admin)',
      '`/joincreate unset` – Désactiver',
      '`/joincreate config` – Voir la configuration',
      '`/joincreate rename <nom>` – Renommer ton vocal (propriétaire)',
      '`/joincreate limit <0-99>` – Limiter le nombre de personnes',
      '`/joincreate permit <@user>` – Autoriser quelqu\'un à rejoindre',
      '`/joincreate reject <@user>` – Retirer quelqu\'un',
      '`/joincreate lock` – Verrouiller (personne ne peut rejoindre)',
      '`/joincreate unlock` – Déverrouiller',
    ],
    examples: [
      '`/joincreate set #rejoindre-pour-créer`',
      '`/joincreate rename Mon vocal`',
      '`/joincreate limit 5`',
    ],
    permissions: 'Gérer les canaux (set/unset), propriétaire du vocal (autres)',
  },

  antiraid: {
    description: 'Protection anti-raid (slash uniquement)',
    usage: [
      '`/antiraid on` – Activer',
      '`/antiraid off` – Désactiver',
      '`/antiraid config` – Seuil, fenêtre, action (kick/ban/lock)',
      '`/antiraid whitelist_role_add` – Exempter un rôle',
      '`/antiraid whitelist_role_remove` – Retirer un rôle',
      '`/antiraid whitelist_user_add` – Exempter un utilisateur',
      '`/antiraid whitelist_user_remove` – Retirer un utilisateur',
      '`/antiraid newaccount` – Cibler comptes récents (0-365j)',
      '`/antiraid lockduration` – Auto-désactivation du lock (0-1440min)',
      '`/antiraid alert` – Canal des alertes',
      '`/antiraid alert_clear` – Supprimer le canal d\'alerte',
      '`/antiraid reason` – Raison personnalisée kick/ban',
      '`/antiraid reset` – Réinitialiser',
      '`/antiraid status` – Voir la config',
    ],
    examples: [
      '`/antiraid on`',
      '`/antiraid config seuil:5 fenetre:30 action:kick`',
      '`/antiraid whitelist_role_add role:@Staff`',
    ],
    permissions: 'Administrateur',
  },

  autorole: {
    description: 'Rôle donné automatiquement aux nouveaux membres',
    usage: [
      '`autorole set <rôle>` – Définir le rôle automatique',
      '`autorole remove` – Désactiver',
      '`autorole view` – Voir le rôle configuré',
    ],
    examples: [
      '`autorole set @Membre`',
      '`autorole view`',
    ],
    permissions: 'Gérer le serveur',
  },

  addrole: {
    description: 'Ajouter un rôle à un membre',
    usage: ['`addrole <@membre> <rôle>` – Ajouter un rôle à un membre'],
    examples: ['`addrole @User @Membre`'],
    permissions: 'Gérer les rôles',
  },

  delrole: {
    description: 'Retirer un rôle d\'un membre',
    usage: ['`delrole <@membre> <rôle>` – Retirer un rôle d\'un membre'],
    examples: ['`delrole @User @Membre`'],
    permissions: 'Gérer les rôles',
  },

  autoresponder: {
    description: 'Réponses automatiques quand un mot est détecté',
    usage: [
      '`autoresponder add <mot> <réponse>` – Ajouter une réponse automatique',
      '`autoresponder remove <mot>` – Supprimer une réponse',
      '`autoresponder list` – Voir toutes les réponses configurées',
    ],
    examples: [
      '`autoresponder add bonjour Salut !`',
      '`autoresponder remove bonjour`',
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
    module: 'Utilitaires',
    usage: [
      '`embed <titre> | <description>` – Embed basique',
      '`embed <titre> | <description> | <couleur>` – Avec couleur (hex sans #)',
    ],
    examples: [
      '`embed Annonce | Bienvenue sur le serveur !`',
      '`embed Événement | RDV samedi 15h | FF0000`',
    ],
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
    description: 'Ignorer des utilisateurs ou salons (le bot ne réagit pas aux commandes)',
    usage: [
      '`ignore user <@utilisateur>` – Ajouter ou retirer un utilisateur (toggle)',
      '`ignore channel <#salon>` – Ajouter ou retirer un salon (toggle)',
      '`ignore list` – Voir la liste des ignorés',
    ],
    examples: [
      '`ignore user @Utilisateur`',
      '`ignore channel #spam`',
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
    description: 'Sauvegarder ou restaurer un serveur (rôles, canaux, etc.)',
    usage: [
      '`backup create` – Sauvegarde sans les messages',
      '`backup create oui [durée]` – Sauvegarde avec messages (durée: 7j, 14d, 30j)',
      '`backup restore` – Restaurer (joindre le fichier .json en pièce jointe)',
    ],
    examples: [
      '`backup create`',
      '`backup create oui 30j`',
      '`backup restore` + envoyer le fichier .json',
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

  vouch: {
    description: 'Système de recommandations (vouches) entre membres',
    usage: [
      '`vouch add @vendeur | produit | prix | étoiles | raison` – Ajouter un vouch (séparer avec |)',
      '`vouch remove <id>` – Retirer votre vouch',
      '`vouch list [@user]` – Liste des vouches (tous ou d\'un utilisateur)',
      '`vouch profile [@user]` – Profil vouch d\'un utilisateur',
    ],
    examples: [
      '`vouch add @User | 4l tiktok | 5€ | 5 | Rapide et fiable`',
      '`vouch list @User`',
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
