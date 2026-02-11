import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'clear',
    description: 'Supprime un nombre de messages (max 100)',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageMessages')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous n\'avez pas la permission de gérer les messages.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const amount = parseInt(args[0]);

    if (!amount || amount < 1 || amount > 100) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez spécifier un nombre entre 1 et 100.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      const messages = await message.channel.bulkDelete(amount + 1, true);
      const successEmbed = createEmbed('moderation', {
        title: 'Messages supprimés',
        description: `${messages.size - 1} message(s) ont été supprimé(s).`,
      });
      const msg = await message.channel.send({ embeds: [successEmbed] });
      setTimeout(() => msg.delete().catch(() => {}), 3000);
    } catch (error) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de supprimer les messages: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
