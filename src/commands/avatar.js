import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'avatar',
    description: 'Affiche l\'avatar d\'un utilisateur',
  },
  execute: async (message, args) => {
    let target = message.author;

    if (args.length > 0 && message.mentions.users.size > 0) {
      target = message.mentions.users.first();
    }

    const avatarURL = target.displayAvatarURL({ dynamic: true, size: 4096 });

    const embed = createEmbed('default', {
      title: `Avatar de ${target.tag}`,
      image: avatarURL,
      description: `[Télécharger](${avatarURL})`,
    });

    message.reply({ embeds: [embed] });
  },
};
