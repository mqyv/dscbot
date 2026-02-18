import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'roast',
    description: 'Envoie une pique amusante à quelqu\'un',
  },
  execute: async (message, args) => {
    const target = message.mentions.users.first() || message.author;

    const roasts = [
      'Si l\'ignorance était un superpouvoir, tu serais un héros.',
      'Tu es la preuve que l\'évolution peut aller en arrière.',
      'Je ne t\'insulte pas, je te décris.',
      'Tu as le charisme d\'une éponge.',
      'Ton QI est plus bas que la température en hiver.',
      'Tu es comme un nuage : quand tu disparais, c\'est une belle journée.',
      'Si tu étais un peu plus bête, il faudrait t\'arroser deux fois par semaine.',
      'Tu es la raison pour laquelle les aliens ne nous contactent pas.',
      'Tu as l\'air d\'avoir été dessiné avec la main gauche.',
      'Même un miroir refuse de te refléter.',
      'Tu es la version humaine d\'un délai de chargement.',
      'Si le cerveau était dynamite, tu n\'aurais pas assez pour faire sauter tes cheveux.',
      'Tu es comme un logiciel : plein de bugs.',
      'Tu es la preuve que même les erreurs peuvent avoir des erreurs.',
      'Ton existence est une insulte à l\'intelligence.',
      'Tu es comme le café du matin : amer et décevant.',
      'Si la stupidité était un sport, tu serais champion olympique.',
      'Tu as la personnalité d\'un toast sec.',
      'Tu es la raison pour laquelle on a des instructions sur les shampooings.',
      'Tu es comme un nuage de pluie : tout le monde t\'évite.',
    ];

    const roast = roasts[Math.floor(Math.random() * roasts.length)];

    const embed = createEmbed('fun', {
      title: '🔥 Roast',
      description: `${target}, ${roast.toLowerCase()}`,
    });

    message.reply({ embeds: [embed] });
  },
};
