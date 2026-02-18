import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'choose',
    description: 'Choisit aléatoirement parmi plusieurs options',
  },
  execute: async (message, args) => {
    const text = args.join(' ');
    const options = text.split(/\s*[,|]\s*/).map(o => o.trim()).filter(Boolean);

    if (options.length < 2) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Donne au moins 2 options séparées par des virgules ou des pipes.\nExemple: `,choose pizza, burger, sushi` ou `,choose oui | non`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const choice = options[Math.floor(Math.random() * options.length)];

    const embed = createEmbed('fun', {
      title: '🎲 Choix aléatoire',
      description: `**Options:** ${options.join(', ')}\n\n**Résultat:** ${choice}`,
    });

    message.reply({ embeds: [embed] });
  },
};
