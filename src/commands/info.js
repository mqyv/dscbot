import { createEmbed, formatBleedDate, getTimeAgo } from '../utils/embeds.js';

export default {
  data: {
    name: 'info',
    description: 'Affiche les informations sur un utilisateur ou le serveur',
  },
  execute: async (message, args) => {
    let target = message.author;
    let member = message.member;

    // Si un utilisateur est mentionné
    if (args.length > 0 && message.mentions.users.size > 0) {
      target = message.mentions.users.first();
      member = await message.guild.members.fetch(target.id).catch(() => null);
    }

    if (!member) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Impossible de trouver cet utilisateur sur ce serveur.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const createdAt = target.createdAt;
    const joinedAt = member.joinedAt;

    const embed = createEmbed('default', {
      title: `${target.tag} (${target.id})`,
      description: `Dates Created: ${formatBleedDate(createdAt)} (${getTimeAgo(createdAt)})`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
      fields: [
        ...(joinedAt ? [{
          name: '📅 Rejoint le serveur',
          value: `${formatBleedDate(joinedAt)} (${getTimeAgo(joinedAt)})`,
          inline: false,
        }] : []),
        {
          name: '🎭 Rôles',
          value: member.roles.cache.size > 1 
            ? member.roles.cache
                .filter(role => role.id !== message.guild.id)
                .map(role => role.toString())
                .slice(0, 10)
                .join(', ') || 'Aucun rôle'
            : 'Aucun rôle',
          inline: false,
        },
        ...(target.flags?.toArray().length > 0 ? [{
          name: '🏷️ Badges',
          value: target.flags.toArray().join(', '),
          inline: false,
        }] : []),
      ],
    });

    message.reply({ embeds: [embed] });
  },
};

