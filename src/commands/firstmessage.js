import { createEmbed } from '../utils/embeds.js';
import { formatBleedDate, getTimeAgo } from '../utils/embeds.js';

export default {
  data: {
    name: 'firstmessage',
    description: 'Voir le premier message d\'un salon',
  },
  execute: async (message, args) => {
    const channel = args[0] 
      ? message.guild.channels.cache.get(args[0].replace(/[<#>]/g, '')) || message.mentions.channels.first()
      : message.channel;

    if (!channel || !channel.isTextBased()) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Salon textuel introuvable.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      const messages = await channel.messages.fetch({ limit: 1, after: '0' });
      const firstMessage = messages.first();

      if (!firstMessage) {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: 'Aucun message trouvé dans ce salon.',
        });
        return message.reply({ embeds: [errorEmbed] });
      }

      const embed = createEmbed('info', {
        title: `Premier message de ${channel.name}`,
        description: firstMessage.content || '*Aucun contenu texte*',
        fields: [
          {
            name: 'Auteur',
            value: `${firstMessage.author} (${firstMessage.author.tag})`,
            inline: true,
          },
          {
            name: 'Date',
            value: `${formatBleedDate(firstMessage.createdAt)} (${getTimeAgo(firstMessage.createdAt)})`,
            inline: true,
          },
          {
            name: 'ID du message',
            value: firstMessage.id,
            inline: false,
          },
        ],
        footer: { text: `Message ID: ${firstMessage.id}` },
      });

      if (firstMessage.attachments.size > 0) {
        embed.setImage(firstMessage.attachments.first().url);
      }

      message.reply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de récupérer le premier message: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
