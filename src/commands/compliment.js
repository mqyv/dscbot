import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'compliment',
    description: 'Envoie un compliment à quelqu\'un',
  },
  execute: async (message, args) => {
    const target = message.mentions.users.first() || message.author;

    const compliments = [
      'Tu illumines la pièce quand tu entres.',
      'Tu as un sourire magnifique.',
      'Tu es une personne incroyablement bienveillante.',
      'Ta présence rend les autres heureux.',
      'Tu as un sens de l\'humour génial.',
      'Tu es plus fort que tu ne le penses.',
      'Tu inspires les gens autour de toi.',
      'Tu as un cœur en or.',
      'Tu es unique et c\'est une bonne chose.',
      'Tu mérites tout le bonheur du monde.',
      'Tu as un talent caché qui ne demande qu\'à briller.',
      'Tu es quelqu\'un sur qui on peut compter.',
      'Tu apportes de la joie partout où tu vas.',
      'Tu es plus courageux que tu ne le crois.',
      'Tu as une énergie positive contagieuse.',
      'Tu es une personne rare et précieuse.',
      'Tu fais une différence dans la vie des autres.',
      'Tu as un potentiel illimité.',
      'Tu es une belle âme.',
      'Le monde est meilleur avec toi dedans.',
    ];

    const compliment = compliments[Math.floor(Math.random() * compliments.length)];

    const embed = createEmbed('fun', {
      title: '💝 Compliment',
      description: `${target}, ${compliment.toLowerCase()}`,
    });

    message.reply({ embeds: [embed] });
  },
};
