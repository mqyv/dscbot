import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'timeout',
    description: 'Mute temporairement un membre (en minutes)',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ModerateMembers')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous n\'avez pas la permission de modérer les membres.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!message.mentions.users.size) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez mentionner un utilisateur à mettre en timeout.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const target = message.mentions.members.first();
    const duration = parseInt(args[1]) || 10; // Par défaut 10 minutes
    const reason = args.slice(2).join(' ') || 'Aucune raison spécifiée';

    if (!target.moderatable) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Je ne peux pas modérer cet utilisateur (rôle supérieur).',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (target.id === message.author.id) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Vous ne pouvez pas vous mettre en timeout vous-même.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const timeoutDuration = Math.min(duration * 60 * 1000, 28 * 24 * 60 * 60 * 1000); // Max 28 jours

    try {
      await target.timeout(timeoutDuration, reason);
      
      // Log modération
      const { sendLog } = await import('../utils/logs.js');
      await sendLog(message.guild, 'mod', {
        action: 'Timeout',
        target: target.user,
        moderator: message.author,
        reason: reason,
      });

      const successEmbed = createEmbed('moderation', {
        title: 'Membre en timeout',
        description: `${target.user.tag} a été mis en timeout pour ${duration} minute(s).`,
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
        description: `Impossible de mettre en timeout ${target.user.tag}: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
