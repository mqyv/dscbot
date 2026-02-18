import { createEmbed, formatBleedDate, getTimeAgo } from '../utils/embeds.js';
import { E } from '../utils/emojis.js';
import { version } from 'discord.js';
import { getGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'botinfo',
    description: 'Affiche les informations sur le bot',
  },
  execute: async (message, args) => {
    const e = E;
    const client = message.client;
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const guildData = getGuildData(message.guild.id);
    const customBio = guildData.settings?.botBio;
    const member = message.guild.members.cache.get(client.user.id);

    const embed = createEmbed('default', {
      title: `Informations: ${client.user.tag}`,
      description: customBio || undefined,
      thumbnail: client.user.displayAvatarURL({ dynamic: true, size: 256 }),
      fields: [
        {
          name: '🆔 ID',
          value: client.user.id,
          inline: true,
        },
        {
          name: `${e.notes} Surnom`,
          value: member?.nickname || 'Aucun',
          inline: true,
        },
        {
          name: '📅 Créé le',
          value: `${formatBleedDate(client.user.createdAt)} (${getTimeAgo(client.user.createdAt)})`,
          inline: false,
        },
        {
          name: '⏱️ Uptime',
          value: `${days}j ${hours}h ${minutes}m ${seconds}s`,
          inline: true,
        },
        {
          name: `${e.stats} Statistiques`,
          value: [
            `Serveurs: ${client.guilds.cache.size}`,
            `Utilisateurs: ${client.users.cache.size}`,
            `Canaux: ${client.channels.cache.size}`,
            `Commandes: ${client.commands.size}`,
          ].join('\n'),
          inline: false,
        },
        {
          name: '💻 Technique',
          value: [
            `Node.js: ${process.version}`,
            `Discord.js: ${version}`,
            `Latence: ${client.ws.ping}ms`,
          ].join('\n'),
          inline: false,
        },
      ],
    });

    if (guildData.settings?.botBanner) {
      embed.setImage(guildData.settings.botBanner);
    }

    message.reply({ embeds: [embed] });
  },
};
