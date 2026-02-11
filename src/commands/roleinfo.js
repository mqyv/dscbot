import { createEmbed, formatBleedDate, getTimeAgo } from '../utils/embeds.js';

export default {
  data: {
    name: 'roleinfo',
    description: 'Affiche les informations sur un rôle',
  },
  execute: async (message, args) => {
    if (!args[0]) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez mentionner ou fournir l\'ID d\'un rôle.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0].replace(/[<@&>]/g, ''));

    if (!role) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Rôle non trouvé.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const embed = createEmbed('default', {
      title: `Rôle: ${role.name}`,
      fields: [
        {
          name: '🆔 ID',
          value: role.id,
          inline: true,
        },
        {
          name: '📅 Créé le',
          value: `${formatBleedDate(role.createdAt)} (${getTimeAgo(role.createdAt)})`,
          inline: false,
        },
        {
          name: '👥 Membres',
          value: `${role.members.size} membres`,
          inline: true,
        },
        {
          name: '🎨 Couleur',
          value: role.hexColor,
          inline: true,
        },
        {
          name: '📊 Position',
          value: `${role.position}`,
          inline: true,
        },
        {
          name: '✅ Permissions',
          value: role.permissions.toArray().slice(0, 10).join(', ') || 'Aucune',
          inline: false,
        },
        {
          name: '⚙️ Options',
          value: [
            role.hoist ? 'Affiché séparément' : null,
            role.mentionable ? 'Mentionnable' : null,
            role.managed ? 'Géré par un bot/intégration' : null,
          ].filter(Boolean).join(', ') || 'Aucune',
          inline: false,
        },
      ],
    });

    if (role.color !== 0) {
      embed.setColor(role.color);
    }

    message.reply({ embeds: [embed] });
  },
};
