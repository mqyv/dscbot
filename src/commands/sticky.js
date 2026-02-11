import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'sticky',
    description: 'Gérer les messages collants (sticky messages)',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageMessages')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer les messages" pour utiliser cette commande.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'set':
        await stickySet(message, args.slice(1));
        break;
      case 'remove':
      case 'rm':
        await stickyRemove(message);
        break;
      case 'view':
        await stickyView(message);
        break;
      default:
        const embed = createEmbed('settings', {
          title: 'Messages collants',
          description: 'Commandes disponibles :',
          fields: [
            { name: '`,sticky set <message>`', value: 'Définir un message collant pour ce salon', inline: false },
            { name: '`,sticky remove`', value: 'Retirer le message collant', inline: false },
            { name: '`,sticky view`', value: 'Voir le message collant actuel', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
    }
  },
};

async function stickySet(message, args) {
  if (!args.length) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un message.\nExemple: `,sticky set Bienvenue dans ce salon !`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const stickyMessage = args.join(' ');
  const guildData = getGuildData(message.guild.id);
  
  if (!guildData.sticky) {
    guildData.sticky = {};
  }

  guildData.sticky[message.channel.id] = {
    message: stickyMessage,
    lastMessageId: null,
  };

  saveGuildData(message.guild.id, guildData);

  // Envoyer le message collant
  const stickyEmbed = createEmbed('info', {
    title: 'Message collant',
    description: stickyMessage,
    footer: { text: 'Ce message sera automatiquement republié en bas du salon' },
  });

  const sentMessage = await message.channel.send({ embeds: [stickyEmbed] });
  guildData.sticky[message.channel.id].lastMessageId = sentMessage.id;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Message collant défini',
    description: `Le message collant a été configuré pour ${message.channel}.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function stickyRemove(message) {
  const guildData = getGuildData(message.guild.id);
  
  if (!guildData.sticky || !guildData.sticky[message.channel.id]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Aucun message collant configuré pour ce salon.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  // Supprimer l'ancien message collant s'il existe
  if (guildData.sticky[message.channel.id].lastMessageId) {
    try {
      const oldMessage = await message.channel.messages.fetch(guildData.sticky[message.channel.id].lastMessageId);
      await oldMessage.delete().catch(() => {});
    } catch {}
  }

  delete guildData.sticky[message.channel.id];
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Message collant retiré',
    description: `Le message collant a été retiré de ${message.channel}.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function stickyView(message) {
  const guildData = getGuildData(message.guild.id);
  
  if (!guildData.sticky || !guildData.sticky[message.channel.id]) {
    const embed = createEmbed('info', {
      title: 'Message collant',
      description: 'Aucun message collant configuré pour ce salon.',
    });
    return message.reply({ embeds: [embed] });
  }

  const stickyData = guildData.sticky[message.channel.id];
  const embed = createEmbed('info', {
    title: 'Message collant actuel',
    description: stickyData.message,
  });

  message.reply({ embeds: [embed] });
}
