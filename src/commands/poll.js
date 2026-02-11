import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'poll',
    description: 'Crée un sondage',
  },
  execute: async (message, args) => {
    if (args.length < 2) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Utilisation: `,poll <question> | <option1> | <option2> ...`\nExemple: `,poll Quel est votre couleur préférée? | Rouge | Bleu | Vert`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const content = args.join(' ');
    const parts = content.split('|').map(p => p.trim());

    if (parts.length < 3) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Vous devez fournir au moins 2 options séparées par `|`.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const question = parts[0];
    const options = parts.slice(1);

    if (options.length > 10) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Maximum 10 options autorisées.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const optionsText = options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n');

    const embed = createEmbed('info', {
      title: 'Sondage',
      description: `**${question}**\n\n${optionsText}`,
      footer: { text: `Sondage créé par ${message.author.tag}` },
      timestamp: true,
    });

    const pollMessage = await message.reply({ embeds: [embed] });

    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(emojis[i]);
    }
  },
};
