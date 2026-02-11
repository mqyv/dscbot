import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'uptime',
    description: 'Affiche le temps de fonctionnement du bot',
  },
  execute: async (message) => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const embed = createEmbed('info', {
      title: '⏱️ Uptime',
      description: `Le bot fonctionne depuis :\n**${days}** jours, **${hours}** heures, **${minutes}** minutes et **${seconds}** secondes`,
    });

    message.reply({ embeds: [embed] });
  },
};
