import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'pp',
    description: 'Affiche la taille du pseudo (meme)',
  },
  execute: async (message, args) => {
    const target = message.mentions.users.first() || message.author;
    const name = target.username;

    const seed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const size = (seed % 11); // 0 à 10
    const bar = '8' + '='.repeat(size) + 'D';

    const messages = [
      'Tout petit... 😔',
      'Petit mais costaud !',
      'Taille moyenne, rien à dire.',
      'Pas mal du tout !',
      'Au-dessus de la moyenne !',
      'Impressionnant ! 😏',
      'Wow, respect !',
      'Énorme ! 🫣',
      'Légendaire !',
      'Mythique ! 🏆',
      'INFINI !!! 🌌',
    ];

    const embed = createEmbed('fun', {
      title: '📏 Taille du pseudo',
      description: `**${target.username}**\n\n\`${bar}\`\n\n${messages[size]}`,
    });

    message.reply({ embeds: [embed] });
  },
};
