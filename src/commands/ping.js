import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'ping',
    description: 'Affiche la latence du bot',
  },
  execute: async (message) => {
    const sent = await message.reply({ embeds: [createEmbed('info', {
      title: '🏓 Pong !',
      description: 'Calcul de la latence...',
    })] });

    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(message.client.ws.ping);

    const embed = createEmbed('utility', {
      title: '🏓 Pong !',
      description: 'Statistiques de latence :',
      fields: [
        {
          name: '📡 Latence du bot',
          value: `${latency}ms`,
          inline: true,
        },
        {
          name: '🌐 Latence de l\'API',
          value: `${apiLatency}ms`,
          inline: true,
        },
      ],
      timestamp: true,
    });

    sent.edit({ embeds: [embed] });
  },
};

