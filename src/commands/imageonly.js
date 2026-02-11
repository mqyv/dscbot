import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'imageonly',
    description: 'Gérer les salons image-only',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageChannels')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer les canaux" pour utiliser cette commande.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'enable':
        await imageOnlyEnable(message);
        break;
      case 'disable':
        await imageOnlyDisable(message);
        break;
      case 'status':
        await imageOnlyStatus(message);
        break;
      default:
        const embed = createEmbed('settings', {
          title: 'Salons image-only',
          description: 'Commandes disponibles :',
          fields: [
            { name: '`,imageonly enable`', value: 'Activer le mode image-only pour ce salon', inline: false },
            { name: '`,imageonly disable`', value: 'Désactiver le mode image-only', inline: false },
            { name: '`,imageonly status`', value: 'Voir le statut du mode image-only', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
    }
  },
};

async function imageOnlyEnable(message) {
  const guildData = getGuildData(message.guild.id);
  if (!guildData.imageOnly) {
    guildData.imageOnly = [];
  }

  if (guildData.imageOnly.includes(message.channel.id)) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Le mode image-only est déjà activé pour ce salon.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  guildData.imageOnly.push(message.channel.id);
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Mode image-only activé',
    description: `Le mode image-only a été activé pour ${message.channel}.\nSeules les images sont autorisées dans ce salon.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function imageOnlyDisable(message) {
  const guildData = getGuildData(message.guild.id);
  
  if (!guildData.imageOnly || !guildData.imageOnly.includes(message.channel.id)) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Le mode image-only n\'est pas activé pour ce salon.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  guildData.imageOnly = guildData.imageOnly.filter(id => id !== message.channel.id);
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Mode image-only désactivé',
    description: `Le mode image-only a été désactivé pour ${message.channel}.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function imageOnlyStatus(message) {
  const guildData = getGuildData(message.guild.id);
  const isEnabled = guildData.imageOnly?.includes(message.channel.id) || false;

  const embed = createEmbed('info', {
    title: 'Statut image-only',
    description: `Le mode image-only est **${isEnabled ? 'activé' : 'désactivé'}** pour ${message.channel}.`,
  });

  message.reply({ embeds: [embed] });
}
