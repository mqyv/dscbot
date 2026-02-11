import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'membercount',
    description: 'Affiche le nombre de membres du serveur',
  },
  execute: async (message) => {
    const guild = message.guild;
    
    const totalMembers = guild.memberCount;
    const members = guild.members.cache;
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;
    const online = members.filter(m => m.presence?.status === 'online').size;
    const idle = members.filter(m => m.presence?.status === 'idle').size;
    const dnd = members.filter(m => m.presence?.status === 'dnd').size;
    const offline = members.filter(m => !m.presence || m.presence?.status === 'offline').size;

    const embed = createEmbed('info', {
      title: `Membres de ${guild.name}`,
      thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
      fields: [
        {
          name: 'Total',
          value: `${totalMembers}`,
          inline: true,
        },
        {
          name: 'Humains',
          value: `${humans}`,
          inline: true,
        },
        {
          name: 'Bots',
          value: `${bots}`,
          inline: true,
        },
        {
          name: 'En ligne',
          value: `${online}`,
          inline: true,
        },
        {
          name: 'Inactif',
          value: `${idle}`,
          inline: true,
        },
        {
          name: 'Ne pas déranger',
          value: `${dnd}`,
          inline: true,
        },
        {
          name: 'Hors ligne',
          value: `${offline}`,
          inline: true,
        },
      ],
    });

    message.reply({ embeds: [embed] });
  },
};
