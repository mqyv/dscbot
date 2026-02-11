import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'calc',
    description: 'Effectue un calcul mathématique',
  },
  execute: async (message, args) => {
    if (!args.length) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez fournir une expression mathématique.\nExemple: `,calc 2 + 2` ou `,calc 10 * 5`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const expression = args.join(' ');

    // Sécurité : ne permettre que les caractères mathématiques sûrs
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Expression invalide. Utilisez uniquement des nombres et les opérateurs +, -, *, /, (, ).',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      const result = Function(`"use strict"; return (${expression})`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Résultat invalide');
      }

      const embed = createEmbed('success', {
        title: 'Calculatrice',
        description: `**Expression:** \`${expression}\`\n**Résultat:** \`${result}\``,
      });

      message.reply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Impossible d\'évaluer cette expression. Vérifiez la syntaxe.',
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
