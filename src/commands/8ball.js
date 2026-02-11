import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: '8ball',
    description: 'Pose une question à la boule magique',
  },
  execute: async (message, args) => {
    if (!args.length) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez poser une question.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const responses = [
      'C\'est certain.',
      'C\'est décidément ainsi.',
      'Sans aucun doute.',
      'Oui, définitivement.',
      'Vous pouvez compter dessus.',
      'Comme je le vois, oui.',
      'Très probablement.',
      'Les perspectives sont bonnes.',
      'Oui.',
      'Les signes indiquent que oui.',
      'Réponse floue, réessayez.',
      'Demandez plus tard.',
      'Mieux vaut ne pas vous le dire maintenant.',
      'Impossible de prédire maintenant.',
      'Concentrez-vous et réessayez.',
      'Ne comptez pas dessus.',
      'Ma réponse est non.',
      'Mes sources disent non.',
      'Les perspectives ne sont pas bonnes.',
      'Très douteux.',
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const question = args.join(' ');

    const embed = createEmbed('fun', {
      title: 'Boule magique',
      description: `**Question:** ${question}\n\n**Réponse:** ${response}`,
    });

    message.reply({ embeds: [embed] });
  },
};
