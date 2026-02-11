import { createEmbed } from '../utils/embeds.js';
import { ChannelType } from 'discord.js';

export default {
  data: {
    name: 'nuke',
    description: 'Supprime tous les messages d\'un salon en le recréant',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageChannels')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer les canaux".',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const channel = message.mentions.channels.first() || message.channel;

    if (!channel.manageable) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Je ne peux pas gérer ce salon.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      const position = channel.position;
      const name = channel.name;
      const topic = channel.topic;
      const nsfw = channel.nsfw;
      const rateLimitPerUser = channel.rateLimitPerUser;
      const parent = channel.parent;
      const permissionOverwrites = channel.permissionOverwrites.cache;

      await channel.delete();

      const newChannel = await message.guild.channels.create({
        name: name,
        type: ChannelType.GuildText,
        topic: topic,
        nsfw: nsfw,
        rateLimitPerUser: rateLimitPerUser,
        parent: parent,
        position: position,
        permissionOverwrites: permissionOverwrites,
      });

      const embed = createEmbed('success', {
        title: 'Salon nuke',
        description: `${newChannel} a été nettoyé.`,
      });

      await newChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur nuke:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de nuke le salon: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
  },
};
