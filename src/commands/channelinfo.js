import { createEmbed, formatBleedDate, getTimeAgo } from '../utils/embeds.js';

export default {
  data: {
    name: 'channelinfo',
    description: 'Affiche les informations sur un canal',
  },
  execute: async (message, args) => {
    const channel = args[0] 
      ? message.guild.channels.cache.get(args[0].replace(/[<#>]/g, '')) || message.mentions.channels.first()
      : message.channel;

    if (!channel) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Canal non trouvé.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const embed = createEmbed('default', {
      title: `Informations: ${channel.name}`,
      fields: [
        {
          name: '🆔 ID',
          value: channel.id,
          inline: true,
        },
        {
          name: '📅 Créé le',
          value: `${formatBleedDate(channel.createdAt)} (${getTimeAgo(channel.createdAt)})`,
          inline: false,
        },
        {
          name: '📝 Type',
          value: getChannelType(channel.type),
          inline: true,
        },
        {
          name: '👥 Membres',
          value: channel.members?.size ? `${channel.members.size} membres` : 'N/A',
          inline: true,
        },
        {
          name: '📊 Position',
          value: `${channel.position}`,
          inline: true,
        },
        ...(channel.topic ? [{
          name: '📌 Sujet',
          value: channel.topic.length > 1024 ? channel.topic.substring(0, 1021) + '...' : channel.topic,
          inline: false,
        }] : []),
      ],
    });

    message.reply({ embeds: [embed] });
  },
};

function getChannelType(type) {
  const types = {
    0: 'Textuel',
    2: 'Vocal',
    4: 'Catégorie',
    5: 'Annonces',
    13: 'Stage',
    15: 'Forum',
  };
  return types[type] || 'Inconnu';
}
