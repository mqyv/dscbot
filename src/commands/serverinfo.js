import { createEmbed, formatBleedDate, getTimeAgo } from '../utils/embeds.js';
import { getE } from '../utils/emojis.js';

export default {
  data: {
    name: 'serverinfo',
    description: 'Affiche les informations sur le serveur',
  },
  execute: async (message) => {
    const e = getE(message.guild);
    const guild = message.guild;
    const owner = await guild.fetchOwner();

    const embed = createEmbed('default', {
      title: `${e.stats} ${guild.name}`,
      description: `Informations sur le serveur ${guild.name}`,
      thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
      fields: [
        {
          name: '👑 Propriétaire',
          value: `${owner.user.tag}`,
          inline: true,
        },
        {
          name: '🆔 ID du serveur',
          value: guild.id,
          inline: true,
        },
        {
          name: '📅 Créé le',
          value: `${formatBleedDate(guild.createdAt)} (${getTimeAgo(guild.createdAt)})`,
          inline: false,
        },
        {
          name: '👥 Membres',
          value: `${guild.memberCount} membres`,
          inline: true,
        },
        {
          name: '🎭 Rôles',
          value: `${guild.roles.cache.size} rôles`,
          inline: true,
        },
        {
          name: `${e.notes} Canaux`,
          value: [
            `Textuels: ${guild.channels.cache.filter(c => c.isTextBased()).size}`,
            `Vocaux: ${guild.channels.cache.filter(c => c.isVoiceBased()).size}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: `${e.lock} Niveau de vérification`,
          value: getVerificationLevel(guild.verificationLevel),
          inline: true,
        },
        {
          name: '🌍 Région',
          value: guild.preferredLocale || 'N/A',
          inline: true,
        },
      ],
      timestamp: true,
    });

    message.reply({ embeds: [embed] });
  },
};

function getVerificationLevel(level) {
  const levels = {
    0: 'Aucune',
    1: 'Faible',
    2: 'Moyenne',
    3: 'Élevée',
    4: 'Très élevée',
  };
  return levels[level] || 'Inconnu';
}

