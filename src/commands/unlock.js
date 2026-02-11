import { createEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logs.js';

export default {
  data: {
    name: 'unlock',
    description: 'Déverrouille un salon (textuel ou vocal)',
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
        description: 'Veuillez mentionner un canal ou utiliser cette commande dans le canal à déverrouiller.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      // Déverrouiller le salon pour @everyone (peut envoyer des messages/parler)
      const permissions = {
        SendMessages: true,
        Speak: true,
        AddReactions: true,
      };

      // Si c'est un salon vocal, ajouter Connect: true aussi
      if (channel.isVoiceBased()) {
        permissions.Connect = true;
      }

      await channel.permissionOverwrites.edit(message.guild.roles.everyone, permissions);

      const successEmbed = createEmbed('success', {
        title: 'Salon déverrouillé',
        description: `Le salon ${channel} a été déverrouillé avec succès.`,
      });
      await message.reply({ embeds: [successEmbed] });

      await sendLog(message.guild, 'mod', {
        action: 'Salon déverrouillé',
        description: `Le salon ${channel} a été déverrouillé.`,
        moderator: message.author,
        target: { id: channel.id, tag: channel.name },
        reason: `Commande \`unlock\` par ${message.author.tag}`,
      });
    } catch (error) {
      console.error('Erreur lors du déverrouillage du salon:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de déverrouiller le salon: ${error.message}`,
      });
      await message.reply({ embeds: [errorEmbed] });
    }
  },
};
