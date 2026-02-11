import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'kick',
    description: 'Expulse un membre du serveur',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('KickMembers')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous n\'avez pas la permission d\'expulser des membres.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!message.mentions.users.size) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez mentionner un utilisateur à expulser.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const target = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

    if (!target.kickable) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Je ne peux pas expulser cet utilisateur (permissions insuffisantes ou rôle supérieur).',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (target.id === message.author.id) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Vous ne pouvez pas vous expulser vous-même.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      await target.kick(reason);
      
      // Log modération
      const { sendLog } = await import('../utils/logs.js');
      await sendLog(message.guild, 'mod', {
        action: 'Kick',
        target: target.user,
        moderator: message.author,
        reason: reason,
      });

      const successEmbed = createEmbed('moderation', {
        title: 'Membre expulsé',
        description: `${target.user.tag} a été expulsé du serveur.`,
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
        description: `Impossible d'expulser ${target.user.tag}: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
