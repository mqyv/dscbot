import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';
import { getInviteCount } from '../utils/invites.js';
import { config } from 'dotenv';

config();

export default {
  data: {
    name: 'invite',
    description: 'Lien du bot, stats d\'invitations ou config du salon',
  },
  execute: async (message, args) => {
    if (!message.guild) {
      const clientId = process.env.CLIENT_ID || message.client.user.id;
      const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
      return message.reply({
        embeds: [createEmbed('info', {
          title: '🔗 Lien d\'invitation du bot',
          description: `[Inviter le bot](${inviteUrl})`,
        })],
      });
    }

    const sub = args[0]?.toLowerCase();
    const guildData = getGuildData(message.guild.id);

    // invite @user - stats de l'utilisateur (PRIORITAIRE)
    let target = message.mentions.users.first();
    if (!target && args[0]) {
      const mentionMatch = String(args[0]).match(/<@!?(\d+)>/);
      const userId = mentionMatch ? mentionMatch[1] : args[0].replace(/[<@!>]/g, '').trim();
      if (userId && /^\d{17,19}$/.test(userId)) {
        target = await message.client.users.fetch(userId).catch(() => null);
      } else if (args[0] && args[0].length <= 32) {
        const search = args[0].replace(/^@/, '').toLowerCase();
        target = message.guild.members.cache.find(m =>
          m.user.username.toLowerCase().includes(search) ||
          (m.user.globalName || m.displayName || '').toLowerCase().includes(search)
        )?.user;
      }
    }
    if (target) {
      const count = getInviteCount(message.guild.id, target.id);
      return message.reply({
        embeds: [createEmbed('info', {
          title: `Invitations – ${target.username}`,
          thumbnail: target.displayAvatarURL({ size: 256 }),
          description: `**${target}** a invité **${count}** personne(s) sur ce serveur.`,
        })],
      });
    }

    // invite set #canal - configurer le salon (ManageGuild)
    if (sub === 'set' || sub === 'channel') {
      if (!message.member.permissions.has('ManageGuild')) {
        return message.reply({
          embeds: [createEmbed('error', {
            title: 'Permission refusée',
            description: 'Vous devez avoir "Gérer le serveur".',
          })],
        });
      }
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (channel) {
        if (!guildData.settings) guildData.settings = {};
        guildData.settings.inviteChannel = channel.id;
        saveGuildData(message.guild.id, guildData);
        return message.reply({
          embeds: [createEmbed('success', {
            title: 'Salon configuré',
            description: `Les arrivées seront affichées dans ${channel} avec l'inviteur.`,
          })],
        });
      }
      const current = guildData.settings?.inviteChannel;
      return message.reply({
        embeds: [createEmbed('info', {
          title: 'Salon des invitations',
          description: current ? `Actuel: <#${current}>\n\n\`invite set #canal\` pour changer` : 'Aucun salon configuré.\n\n`invite set #canal` pour définir',
        })],
      });
    }

    // invite (sans arg) - lien du bot
    const clientId = process.env.CLIENT_ID || message.client.user.id;
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
    return message.reply({
      embeds: [createEmbed('info', {
        title: '🔗 Lien d\'invitation du bot',
        description: `[Inviter le bot](${inviteUrl})`,
        fields: [
          { name: 'Stats', value: '`invite @user` – Voir le nombre d\'invitations', inline: false },
          { name: 'Config', value: '`invite set #canal` – Salon des arrivées (Gérer le serveur)', inline: false },
        ],
      })],
    });
  },
};
