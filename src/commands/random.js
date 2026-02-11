import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'random',
    description: 'Génère un nombre aléatoire',
  },
  execute: async (message, args) => {
    let min = 1;
    let max = 100;

    if (args.length === 1) {
      max = parseInt(args[0]);
      if (isNaN(max)) {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: 'Veuillez fournir un nombre valide.\nExemple: `,random 50` ou `,random 10 20`',
        });
        return message.reply({ embeds: [errorEmbed] });
      }
    } else if (args.length === 2) {
      min = parseInt(args[0]);
      max = parseInt(args[1]);
      if (isNaN(min) || isNaN(max)) {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: 'Veuillez fournir des nombres valides.\nExemple: `,random 10 20`',
        });
        return message.reply({ embeds: [errorEmbed] });
      }
    }

    if (min >= max) {
      const errorEmbed = createEmbed('error', {
        title: '❌ Erreur',
        description: 'Le minimum doit être inférieur au maximum.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const random = Math.floor(Math.random() * (max - min + 1)) + min;

    const embed = createEmbed('default', {
      title: 'Nombre aléatoire',
      description: `Nombre généré entre **${min}** et **${max}**:\n**${random}**`,
    });

    message.reply({ embeds: [embed] });
  },
};
