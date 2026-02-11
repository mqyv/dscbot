import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'say',
    description: 'Fait dire quelque chose au bot',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageMessages')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous n\'avez pas la permission d\'utiliser cette commande.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!args.length) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez spécifier un message à envoyer.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const text = args.join(' ');
    await message.delete().catch(() => {});
    await message.channel.send(text);
  },
};
