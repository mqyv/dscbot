import { createEmbed, formatBleedDate, getTimeAgo } from '../utils/embeds.js';

export default {
  data: {
    name: 'profile',
    description: 'Affiche le profil complet d\'un utilisateur',
  },
  execute: async (message, args) => {
    let target = message.author;
    let member = message.member;

    if (args.length > 0 && message.mentions.users.size > 0) {
      target = message.mentions.users.first();
      member = await message.guild.members.fetch(target.id).catch(() => null);
    } else if (args[0] && !message.mentions.users.size) {
      // Essayer de récupérer par ID
      try {
        target = await message.client.users.fetch(args[0]);
        member = await message.guild.members.fetch(args[0]).catch(() => null);
      } catch {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: 'Utilisateur introuvable.',
        });
        return message.reply({ embeds: [errorEmbed] });
      }
    }

    if (!member) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Impossible de trouver cet utilisateur sur ce serveur.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    // Récupérer toutes les informations
    const accountCreated = target.createdAt;
    const joinedAt = member.joinedAt;
    const roles = member.roles.cache
      .filter(role => role.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(role => role.toString())
      .slice(0, 20);
    
    const badges = target.flags?.toArray() || [];
    const badgeNames = {
      'DISCORD_EMPLOYEE': 'Employé Discord',
      'PARTNERED_SERVER_OWNER': 'Propriétaire de serveur partenaire',
      'HYPESQUAD_EVENTS': 'Événements HypeSquad',
      'BUGHUNTER_LEVEL_1': 'Chasseur de bugs niveau 1',
      'HOUSE_BRAVERY': 'Maison Bravery',
      'HOUSE_BRILLIANCE': 'Maison Brilliance',
      'HOUSE_BALANCE': 'Maison Balance',
      'EARLY_SUPPORTER': 'Supporter précoce',
      'TEAM_USER': 'Utilisateur d\'équipe',
      'BUGHUNTER_LEVEL_2': 'Chasseur de bugs niveau 2',
      'VERIFIED_BOT': 'Bot vérifié',
      'VERIFIED_DEVELOPER': 'Développeur vérifié',
      'CERTIFIED_MODERATOR': 'Modérateur certifié',
      'BOT_HTTP_INTERACTIONS': 'Bot HTTP',
      'ACTIVE_DEVELOPER': 'Développeur actif',
      'PREMIUM_EARLY_SUPPORTER': 'Supporter premium précoce',
    };

    const formattedBadges = badges.map(badge => badgeNames[badge] || badge).join(', ') || 'Aucun badge';

    // Permissions importantes
    const importantPermissions = [];
    if (member.permissions.has('Administrator')) importantPermissions.push('Administrateur');
    if (member.permissions.has('ManageGuild')) importantPermissions.push('Gérer le serveur');
    if (member.permissions.has('ManageChannels')) importantPermissions.push('Gérer les canaux');
    if (member.permissions.has('ManageMessages')) importantPermissions.push('Gérer les messages');
    if (member.permissions.has('ManageRoles')) importantPermissions.push('Gérer les rôles');
    if (member.permissions.has('BanMembers')) importantPermissions.push('Bannir des membres');
    if (member.permissions.has('KickMembers')) importantPermissions.push('Expulser des membres');
    if (member.permissions.has('ModerateMembers')) importantPermissions.push('Modérer les membres');

    // Statut
    const presence = member.presence;
    const status = presence?.status || 'offline';
    const statusNames = {
      'online': 'En ligne',
      'idle': 'Absent',
      'dnd': 'Ne pas déranger',
      'offline': 'Hors ligne',
    };

    // Activité
    let activityText = 'Aucune activité';
    if (presence?.activities && presence.activities.length > 0) {
      const activity = presence.activities[0];
      const activityTypes = {
        0: 'Joue à',
        1: 'Stream',
        2: 'Écoute',
        3: 'Regarde',
        4: 'Personnalisé',
        5: 'Compétition',
      };
      activityText = `${activityTypes[activity.type] || 'Activité'} ${activity.name}`;
      if (activity.details) activityText += ` - ${activity.details}`;
    }

    // Calculer le temps dans le serveur
    const timeInServer = joinedAt ? Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const timeSinceAccount = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));

    // Créer l'embed
    const embed = createEmbed('default', {
      title: `Profil de ${target.tag}`,
      description: target.bot ? '🤖 Bot' : `👤 Utilisateur`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
      image: member.displayAvatarURL({ dynamic: true, size: 512 }) !== target.displayAvatarURL({ dynamic: true, size: 512 }) 
        ? member.displayAvatarURL({ dynamic: true, size: 512 }) 
        : null,
      fields: [
        {
          name: 'Informations de base',
          value: [
            `**Nom d'utilisateur:** ${target.username}`,
            `**Tag:** ${target.tag}`,
            `**ID:** ${target.id}`,
            `**Bot:** ${target.bot ? 'Oui' : 'Non'}`,
            `**Statut:** ${statusNames[status] || status}`,
          ].join('\n'),
          inline: false,
        },
        {
          name: 'Dates',
          value: [
            `**Compte créé:** ${formatBleedDate(accountCreated)} (${getTimeAgo(accountCreated)})`,
            joinedAt ? `**Rejoint le serveur:** ${formatBleedDate(joinedAt)} (${getTimeAgo(joinedAt)})` : '**Rejoint le serveur:** N/A',
            timeSinceAccount ? `**Âge du compte:** ${timeSinceAccount} jour(s)` : '',
            timeInServer ? `**Dans le serveur:** ${timeInServer} jour(s)` : '',
          ].filter(Boolean).join('\n'),
          inline: false,
        },
        {
          name: 'Rôles',
          value: roles.length > 0 
            ? roles.slice(0, 10).join(', ') + (roles.length > 10 ? `\n*+ ${roles.length - 10} autres*` : '')
            : 'Aucun rôle',
          inline: false,
        },
        {
          name: 'Badges',
          value: formattedBadges,
          inline: false,
        },
        {
          name: 'Activité',
          value: activityText,
          inline: true,
        },
        {
          name: 'Rôle le plus élevé',
          value: member.roles.highest.id !== message.guild.id ? member.roles.highest.toString() : 'Aucun',
          inline: true,
        },
        {
          name: 'Couleur',
          value: member.displayHexColor !== '#000000' ? member.displayHexColor : 'Par défaut',
          inline: true,
        },
        ...(importantPermissions.length > 0 ? [{
          name: 'Permissions importantes',
          value: importantPermissions.join(', '),
          inline: false,
        }] : []),
        {
          name: 'Statistiques',
          value: [
            `**Rôles:** ${member.roles.cache.size - 1} (sans @everyone)`,
            `**Position du rôle:** ${member.roles.highest.position}`,
            `**Surnom:** ${member.nickname || 'Aucun'}`,
            `**Surnom affiché:** ${member.displayName}`,
          ].join('\n'),
          inline: false,
        },
      ],
      footer: { text: `Demandé par ${message.author.tag}` },
      timestamp: true,
    });

    // Ajouter la couleur du rôle le plus élevé si disponible
    if (member.roles.highest.id !== message.guild.id && member.roles.highest.color !== 0) {
      embed.setColor(member.roles.highest.color);
    }

    message.reply({ embeds: [embed] });
  },
};
