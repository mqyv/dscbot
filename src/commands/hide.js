import { createEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logs.js';

export default {
  data: {
    name: 'hide',
    description: 'Cache un salon (textuel ou vocal)',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageChannels')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer les canaux" pour utiliser cette commande.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const channel = message.mentions.channels.first() || message.channel;

    if (!channel) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez mentionner un canal ou utiliser cette commande dans le canal à cacher.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      // Cacher le salon pour @everyone (ne pas voir le canal)
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        ViewChannel: false,
      });

      const successEmbed = createEmbed('success', {
        title: 'Salon caché',
        description: `Le salon ${channel} a été caché avec succès.`,
      });
      await message.reply({ embeds: [successEmbed] });

      await sendLog(message.guild, 'mod', {
        action: 'Salon caché',
        description: `Le salon ${channel} a été caché.`,
        moderator: message.author,
        target: { id: channel.id, tag: channel.name },
        reason: `Commande \`hide\` par ${message.author.tag}`,
      });
    } catch (error) {
      console.error('Erreur lors du masquage du salon:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de cacher le salon: ${error.message}`,
      });
      await message.reply({ embeds: [errorEmbed] });
    }
  },
};
