import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'ship',
    description: 'Calcule la compatibilité amoureuse entre deux personnes',
  },
  execute: async (message, args) => {
    const user1 = message.mentions.users.first();
    const user2 = message.mentions.users.at(1) || message.author;

    if (!user1) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Mentionne au moins une personne.\nExemple: `,ship @User` ou `,ship @User1 @User2`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (user1.id === user2.id) {
      const embed = createEmbed('fun', {
        title: '💕 Love Meter',
        description: `${user1} s\'aime à 100% ! Narcissique mais assumé. 😏`,
      });
      return message.reply({ embeds: [embed] });
    }

    const names = [user1.username, user2.username].sort();
    const seed = names.join('').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const percent = (seed % 101);

    const bars = Math.round((percent / 100) * 10);
    const filled = '💕'.repeat(bars);
    const empty = '🖤'.repeat(10 - bars);
    const bar = filled + empty;

    let msg = '?';
    if (percent < 20) msg = 'C\'est mort... 💀';
    else if (percent < 40) msg = 'Pas terrible comme match...';
    else if (percent < 60) msg = 'Peut-être un jour ? 🤔';
    else if (percent < 80) msg = 'Il y a de l\'espoir ! 💫';
    else if (percent < 100) msg = 'C\'est le coup de foudre ! 💘';
    else msg = 'C\'est le destin ! Mariage prévu ! 💒';

    const embed = createEmbed('fun', {
      title: '💕 Love Meter',
      description: `**${user1.username}** + **${user2.username}**\n\n${bar}\n**${percent}%**\n\n${msg}`,
    });

    message.reply({ embeds: [embed] });
  },
};
