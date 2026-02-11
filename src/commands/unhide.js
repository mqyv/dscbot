import { createEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logs.js';

export default {
  data: {
    name: 'unhide',
    description: 'Affiche un salon caché (textuel ou vocal)',
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
        description: 'Veuillez mentionner un canal ou utiliser cette commande dans le canal à afficher.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      // Afficher le salon pour @everyone (voir le canal)
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        ViewChannel: true,
      });

      const successEmbed = createEmbed('success', {
        title: 'Salon affiché',
        description: `Le salon ${channel} est maintenant visible pour tous.`,
      });
      await message.reply({ embeds: [successEmbed] });

      await sendLog(message.guild, 'mod', {
        action: 'Salon affiché',
        description: `Le salon ${channel} est maintenant visible.`,
        moderator: message.author,
        target: { id: channel.id, tag: channel.name },
        reason: `Commande \`unhide\` par ${message.author.tag}`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'affichage du salon:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible d'afficher le salon: ${error.message}`,
      });
      await message.reply({ embeds: [errorEmbed] });
    }
  },
};
