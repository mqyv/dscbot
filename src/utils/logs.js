import { createEmbed } from './embeds.js';
import { getE } from './emojis.js';
import { getGuildData } from './database.js';
import { formatBleedDate } from './embeds.js';

/**
 * Envoie un log dans un canal spécifique
 */
export async function sendLog(guild, logType, data) {
  const guildData = getGuildData(guild.id);
  const logChannelId = guildData.settings?.logs?.[logType];

  if (!logChannelId) return;

  const logChannel = guild.channels.cache.get(logChannelId);
  if (!logChannel || !logChannel.isTextBased()) return;

  let embed;

  switch (logType) {
    case 'join':
      embed = createEmbed('success', {
        title: '👤 Membre rejoint',
        description: `${data.member} a rejoint le serveur`,
        thumbnail: data.member.displayAvatarURL({ dynamic: true }),
        fields: [
          { name: '👤 Utilisateur', value: `${data.member} (${data.member.id})`, inline: true },
          { name: '📅 Compte créé', value: `<t:${Math.floor(data.member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '👥 Membres', value: `${guild.memberCount}`, inline: true },
        ],
        timestamp: true,
      });
      break;

    case 'leave':
      embed = createEmbed('error', {
        title: '👋 Membre parti',
        description: `${data.user.tag} a quitté le serveur`,
        thumbnail: data.user.displayAvatarURL({ dynamic: true }),
        fields: [
          { name: '👤 Utilisateur', value: `${data.user.tag} (${data.user.id})`, inline: true },
          { name: '👥 Membres', value: `${guild.memberCount}`, inline: true },
        ],
        timestamp: true,
      });
      break;

    case 'mod':
      embed = createEmbed('moderation', {
        title: `🔧 ${data.action}`,
        description: data.description || '',
        fields: [
          { name: '👤 Membre', value: `${data.target} (${data.target.id})`, inline: true },
          { name: '👮 Modérateur', value: `${data.moderator}`, inline: true },
          { name: `${getE(guild).notes} Raison`, value: data.reason || 'Aucune raison', inline: false },
        ],
        timestamp: true,
      });
      break;

    case 'message':
      embed = createEmbed('default', {
        title: '💬 Message supprimé',
        description: `Message supprimé dans ${data.channel}`,
        fields: [
          { name: '👤 Auteur', value: `${data.author} (${data.author.id})`, inline: true },
          { name: `${getE(guild).notes} Contenu`, value: data.content?.substring(0, 1024) || 'Aucun contenu', inline: false },
        ],
        timestamp: true,
      });
      break;

    case 'nickname':
      embed = createEmbed('info', {
        title: `${getE(guild).notes} Surnom modifié`,
        description: `${data.member} a changé de surnom`,
        fields: [
          { name: '👤 Membre', value: `${data.member}`, inline: true },
          { name: 'Ancien surnom', value: data.oldNickname || 'Aucun', inline: true },
          { name: 'Nouveau surnom', value: data.newNickname || 'Aucun', inline: true },
        ],
        timestamp: true,
      });
      break;

    case 'role':
      embed = createEmbed('info', {
        title: `🎭 Rôle ${data.action}`,
        description: `${data.member} - ${data.role}`,
        fields: [
          { name: '👤 Membre', value: `${data.member}`, inline: true },
          { name: '🎭 Rôle', value: `${data.role}`, inline: true },
          { name: '👮 Modifié par', value: data.executor ? `${data.executor}` : 'Système', inline: true },
        ],
        timestamp: true,
      });
      break;

    case 'voice':
      embed = createEmbed('info', {
        title: `🔊 ${data.action}`,
        description: `${data.member} ${data.action === 'Rejoint' ? 'a rejoint' : 'a quitté'} un canal vocal`,
        fields: [
          { name: '👤 Membre', value: `${data.member}`, inline: true },
          { name: '🔊 Canal', value: `${data.channel}`, inline: true },
        ],
        timestamp: true,
      });
      break;

    case 'server':
      embed = createEmbed('settings', {
        title: `⚙️ Serveur ${data.action}`,
        description: data.description || '',
        fields: data.fields || [],
        timestamp: true,
      });
      break;

    default:
      return;
  }

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}
