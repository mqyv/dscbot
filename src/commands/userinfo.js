import { createEmbed, formatBleedDate, getTimeAgo } from '../utils/embeds.js';

export default {
  data: {
    name: 'userinfo',
    description: 'Affiche des informations détaillées sur un utilisateur',
  },
  execute: async (message, args) => {
    let target = message.author;
    let member = message.member;

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

    const embed = createEmbed('default', {
      title: `Utilisateur: ${target.tag}`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
      fields: [
        {
          name: '🆔 ID',
          value: target.id,
          inline: true,
        },
        {
          name: '📅 Compte créé',
          value: `${formatBleedDate(target.createdAt)} (${getTimeAgo(target.createdAt)})`,
          inline: false,
        },
        {
          name: '📅 Rejoint le serveur',
          value: member.joinedAt ? `${formatBleedDate(member.joinedAt)} (${getTimeAgo(member.joinedAt)})` : 'N/A',
          inline: false,
        },
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
        {
          name: '🏷️ Badges',
          value: target.flags?.toArray().join(', ') || 'Aucun badge',
          inline: false,
        },
        {
          name: '🤖 Bot',
          value: target.bot ? 'Oui' : 'Non',
          inline: true,
        },
        {
          name: '💬 Statut',
          value: member.presence?.status || 'Hors ligne',
          inline: true,
        },
      ],
    });

    message.reply({ embeds: [embed] });
  },
};
