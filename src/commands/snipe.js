import { createEmbed } from '../utils/embeds.js';
import { getE } from '../utils/emojis.js';
import { getSnipe } from '../utils/snipes.js';

export default {
  data: {
    name: 'snipe',
    description: 'Voir le dernier message supprimé dans ce salon',
  },
  execute: async (message, args) => {
    const e = getE(message.guild);
    const snipe = getSnipe(message.channel.id);

    if (!snipe) {
      const errorEmbed = createEmbed('info', {
        title: '🔍 Aucun message supprimé',
        description: 'Aucun message supprimé récemment dans ce salon.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const embed = createEmbed('info', {
      title: '💬 Message supprimé',
      description: snipe.content || '*Aucun contenu textuel*',
      fields: [
        {
          name: '👤 Auteur',
          value: `${snipe.authorTag} (${snipe.authorId})`,
          inline: true,
        },
        {
          name: `${e.reminder} Supprimé`,
          value: `<t:${Math.floor(snipe.createdAt.getTime() / 1000)}:R>`,
          inline: true,
        },
      ],
    });

    // Ajouter les pièces jointes si présentes
    if (snipe.attachments.length > 0) {
      embed.addFields({
        name: '📎 Pièces jointes',
        value: snipe.attachments.map((att, i) => `[${att.name || `Pièce jointe ${i + 1}`}](${att.url})`).join('\n'),
        inline: false,
      });
      
      // Ajouter la première image comme image de l'embed
      const imageAttachment = snipe.attachments.find(att => 
        att.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
      if (imageAttachment) {
        embed.setImage(imageAttachment.url);
      }
    }

    if (snipe.embeds) {
      embed.addFields({
        name: '📋 Embeds',
        value: 'Le message contenait des embeds',
        inline: false,
      });
    }

    message.reply({ embeds: [embed] });
  },
};
