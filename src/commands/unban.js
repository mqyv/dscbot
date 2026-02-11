import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'unban',
    description: 'Débannit un utilisateur',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('BanMembers')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous n\'avez pas la permission de débannir des membres.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!args[0]) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez spécifier l\'ID de l\'utilisateur à débannir.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      const bans = await message.guild.bans.fetch();
      const target = bans.find(ban => ban.user.id === args[0] || ban.user.tag === args[0]);

      if (!target) {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: 'Cet utilisateur n\'est pas banni de ce serveur.',
        });
        return message.reply({ embeds: [errorEmbed] });
      }

      await message.guild.bans.remove(target.user.id);
      const successEmbed = createEmbed('success', {
        title: 'Utilisateur débanni',
        description: `${target.user.tag} a été débanni du serveur.`,
        fields: [
          {
            name: 'Modérateur',
            value: message.author.tag,
            inline: false,
          },
        ],
      });
      message.reply({ embeds: [successEmbed] });
    } catch (error) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de débannir l'utilisateur: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
