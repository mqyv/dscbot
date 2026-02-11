import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'coinflip',
    description: 'Lance une pièce (pile ou face)',
  },
  execute: async (message) => {
    const result = Math.random() < 0.5 ? 'Pile' : 'Face';
    const emoji = result === 'Pile' ? '🪙' : '🪙';

    const embed = createEmbed('fun', {
      title: '🪙 Lancé de pièce',
      description: `**Résultat:** ${result} ${emoji}`,
    });

    message.reply({ embeds: [embed] });
  },
};
