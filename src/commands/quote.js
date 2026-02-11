import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'quote',
    description: 'Affiche une citation aléatoire',
  },
  execute: async (message) => {
    const quotes = [
      { text: 'La vie est ce qui arrive pendant que vous êtes occupé à faire d\'autres projets.', author: 'John Lennon' },
      { text: 'L\'avenir appartient à ceux qui croient en la beauté de leurs rêves.', author: 'Eleanor Roosevelt' },
      { text: 'Le succès, c\'est d\'aller d\'échec en échec sans perdre son enthousiasme.', author: 'Winston Churchill' },
      { text: 'Sois le changement que tu veux voir dans le monde.', author: 'Mahatma Gandhi' },
      { text: 'La seule façon de faire du bon travail est d\'aimer ce que vous faites.', author: 'Steve Jobs' },
      { text: 'L\'imagination est plus importante que la connaissance.', author: 'Albert Einstein' },
      { text: 'Il n\'y a pas d\'essai, seulement faire.', author: 'Maître Yoda' },
      { text: 'Le seul vrai échec est celui d\'apprendre de rien.', author: 'Henry Ford' },
      { text: 'Les détails ne sont pas des détails. Ils font le design.', author: 'Charles Eames' },
      { text: 'L\'innovation distingue un leader d\'un suiveur.', author: 'Steve Jobs' },
    ];

    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    const embed = createEmbed('fun', {
      title: '💬 Citation',
      description: `"${quote.text}"\n\n— ${quote.author}`,
    });

    message.reply({ embeds: [embed] });
  },
};
