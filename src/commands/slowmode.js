import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'slowmode',
    description: 'Active le mode lent dans un salon',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageChannels')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer les canaux".',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const channel = message.mentions.channels.first() || message.channel;
    const duration = args[0];

    if (!duration) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Spécifiez une durée en secondes (0-21600).\nExemple: `,slowmode 5`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const seconds = parseInt(duration);

    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'La durée doit être entre 0 et 21600 secondes (6 heures).',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      await channel.setRateLimitPerUser(seconds);

      const embed = createEmbed('success', {
        title: 'Mode lent activé',
        description: seconds === 0 
          ? `Le mode lent a été désactivé dans ${channel}.`
          : `Le mode lent a été défini à **${seconds}** secondes dans ${channel}.`,
      });

      message.reply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de modifier le mode lent: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
