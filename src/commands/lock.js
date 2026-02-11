import { createEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logs.js';

export default {
  data: {
    name: 'lock',
    description: 'Verrouille un salon (textuel ou vocal)',
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
        description: 'Veuillez mentionner un canal ou utiliser cette commande dans le canal à verrouiller.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      // Verrouiller le salon pour @everyone (ne peut pas envoyer de messages/parler)
      const permissions = {
        SendMessages: false,
        Speak: false,
        AddReactions: false,
      };

      // Si c'est un salon vocal, ajouter Connect: false aussi
      if (channel.isVoiceBased()) {
        permissions.Connect = false;
      }

      await channel.permissionOverwrites.edit(message.guild.roles.everyone, permissions);

      const successEmbed = createEmbed('success', {
        title: 'Salon verrouillé',
        description: `Le salon ${channel} a été verrouillé avec succès.`,
      });
      await message.reply({ embeds: [successEmbed] });

      await sendLog(message.guild, 'mod', {
        action: 'Salon verrouillé',
        description: `Le salon ${channel} a été verrouillé.`,
        moderator: message.author,
        target: { id: channel.id, tag: channel.name },
        reason: `Commande \`lock\` par ${message.author.tag}`,
      });
    } catch (error) {
      console.error('Erreur lors du verrouillage du salon:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de verrouiller le salon: ${error.message}`,
      });
      await message.reply({ embeds: [errorEmbed] });
    }
  },
};
