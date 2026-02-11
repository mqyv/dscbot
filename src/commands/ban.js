import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'ban',
    description: 'Bannit un membre du serveur',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('BanMembers')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous n\'avez pas la permission de bannir des membres.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!message.mentions.users.size) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez mentionner un utilisateur à bannir.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const target = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

    if (!target.bannable) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Je ne peux pas bannir cet utilisateur (permissions insuffisantes ou rôle supérieur).',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (target.id === message.author.id) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Vous ne pouvez pas vous bannir vous-même.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      await target.ban({ reason });
      
      // Log modération
      const { sendLog } = await import('../utils/logs.js');
      await sendLog(message.guild, 'mod', {
        action: 'Ban',
        target: target.user,
        moderator: message.author,
        reason: reason,
      });

      const successEmbed = createEmbed('moderation', {
        title: 'Membre banni',
        description: `${target.user.tag} a été banni du serveur.`,
        fields: [
          {
            name: 'Raison',
            value: reason,
            inline: false,
          },
          {
            name: 'Modérateur',
            value: message.author.tag,
            inline: false,
          },
        ],
      });
      message.reply({ embeds: [successEmbed] });
    } catch (error) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de bannir ${target.user.tag}: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
