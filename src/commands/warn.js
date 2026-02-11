import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'warn',
    description: 'Avertit un membre',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageMessages')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous n\'avez pas la permission d\'avertir des membres.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!message.mentions.users.size) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez mentionner un utilisateur à avertir.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const target = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

    if (target.id === message.author.id) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Vous ne pouvez pas vous avertir vous-même.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const warnEmbed = createEmbed('moderation', {
      title: 'Avertissement',
      description: `${target.user.tag} a reçu un avertissement.`,
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

    message.reply({ embeds: [warnEmbed] });

    try {
      await target.send({ embeds: [warnEmbed] });
    } catch {
      // L'utilisateur a les DMs désactivés, on ignore
    }
  },
};
