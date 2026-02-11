import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'unpin',
    description: 'Désépingler un message',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageMessages')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer les messages" pour utiliser cette commande.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    let targetMessage;
    
    if (message.reference?.messageId) {
      // Message référencé (réponse)
      targetMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    } else if (args[0]) {
      // ID du message fourni
      targetMessage = await message.channel.messages.fetch(args[0]).catch(() => null);
    } else {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez répondre à un message ou fournir l\'ID d\'un message.\nExemple: Répondez à un message avec `,unpin` ou `,unpin <id_message>`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!targetMessage) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Message introuvable.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!targetMessage.pinned) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Ce message n\'est pas épinglé.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      await targetMessage.unpin();
      const successEmbed = createEmbed('success', {
        title: 'Message désépinglé',
        description: `Le message a été désépinglé.`,
      });
      message.reply({ embeds: [successEmbed] });
    } catch (error) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de désépingler le message: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
