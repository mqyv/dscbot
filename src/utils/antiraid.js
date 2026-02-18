import { getGuildData } from './database.js';
import { GuildVerificationLevel } from 'discord.js';
import { sendLog } from './logs.js';
import { createEmbed } from './embeds.js';
import { E } from './emojis.js';

/** Cache des joins par serveur */
const joinCache = new Map();

/** Timers pour auto-désactiver le lock */
const lockTimers = new Map();

function getJoins(guildId) {
  if (!joinCache.has(guildId)) {
    joinCache.set(guildId, { joins: [] });
  }
  return joinCache.get(guildId);
}

function cleanOldJoins(guildId, windowMs) {
  const data = getJoins(guildId);
  const now = Date.now();
  data.joins = data.joins.filter(j => now - j.t < windowMs);
}

function getAccountAgeDays(user) {
  return (Date.now() - user.createdTimestamp) / (24 * 60 * 60 * 1000);
}

function isWhitelisted(member, cfg) {
  if (cfg.whitelistUsers?.includes(member.id)) return true;
  const memberRoles = member.roles?.cache;
  if (memberRoles && cfg.whitelistRoles?.length) {
    return cfg.whitelistRoles.some(roleId => memberRoles.has(roleId));
  }
  return false;
}

function shouldTargetAccount(member, cfg) {
  if (!cfg.newAccountMaxDays || cfg.newAccountMaxDays <= 0) return true;
  const ageDays = getAccountAgeDays(member.user);
  return ageDays < cfg.newAccountMaxDays;
}

async function scheduleLockRevert(guild, durationMinutes) {
  const key = guild.id;
  if (lockTimers.has(key)) {
    clearTimeout(lockTimers.get(key));
  }
  if (durationMinutes <= 0) return;

  const timer = setTimeout(async () => {
    lockTimers.delete(key);
    try {
      const current = guild.verificationLevel;
      if (current === GuildVerificationLevel.Highest) {
        await guild.setVerificationLevel(GuildVerificationLevel.Medium, 'Antiraid : auto-désactivation du lock');
      }
    } catch (err) {
      console.error('Erreur revert lock antiraid:', err);
    }
  }, durationMinutes * 60 * 1000);
  lockTimers.set(key, timer);
}

async function sendAlert(guild, cfg, data) {
  const channelId = cfg.alertChannelId || null;
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) return;

  const e = E;
  const embed = createEmbed('warning', {
    title: `${e.warning} Alerte Antiraid`,
    description: data.description,
    fields: data.fields || [],
    timestamp: true,
  });
  await channel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Vérifie si un nouveau join déclenche l'antiraid.
 * @param {GuildMember} member - Le membre qui vient de rejoindre
 * @returns {Promise<boolean>} true si le membre a été kické/banni
 */
export async function checkAntiraid(member) {
  if (member.user.bot) return false;

  const guildData = getGuildData(member.guild.id);
  const cfg = guildData.settings?.antiraid;
  if (!cfg?.enabled) return false;

  if (isWhitelisted(member, cfg)) return false;
  if (!shouldTargetAccount(member, cfg)) return false;

  const { threshold, windowSeconds, action } = cfg;
  const windowMs = windowSeconds * 1000;
  const guildId = member.guild.id;

  const data = getJoins(guildId);
  data.joins.push({ t: Date.now(), userId: member.id });
  cleanOldJoins(guildId, windowMs);

  if (data.joins.length < threshold) return false;

  const reason = cfg.customReason || 'Antiraid : trop de joins en peu de temps.';
  const e = E;

  try {
    if (action === 'kick') {
      await member.kick(reason);
      await sendLog(member.guild, 'mod', {
        action: 'Kick (Antiraid)',
        description: `${member.user.tag} a été expulsé par la protection antiraid.`,
        target: member.user,
        moderator: member.guild.members.me,
        reason,
      });
      await sendAlert(member.guild, cfg, {
        description: `${member.user.tag} a été expulsé (antiraid).`,
        fields: [
          { name: 'Utilisateur', value: `${member.user.tag} (${member.user.id})`, inline: true },
          { name: 'Action', value: 'Kick', inline: true },
          { name: 'Compte créé', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        ],
      });
      return true;
    }

    if (action === 'ban') {
      await member.ban({ reason });
      await sendLog(member.guild, 'mod', {
        action: 'Ban (Antiraid)',
        description: `${member.user.tag} a été banni par la protection antiraid.`,
        target: member.user,
        moderator: member.guild.members.me,
        reason,
      });
      await sendAlert(member.guild, cfg, {
        description: `${member.user.tag} a été banni (antiraid).`,
        fields: [
          { name: 'Utilisateur', value: `${member.user.tag} (${member.user.id})`, inline: true },
          { name: 'Action', value: 'Ban', inline: true },
          { name: 'Compte créé', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        ],
      });
      return true;
    }

    if (action === 'lock') {
      await member.kick(reason);
      const maxLevel = GuildVerificationLevel.Highest;
      if (member.guild.verificationLevel < maxLevel) {
        await member.guild.setVerificationLevel(maxLevel, 'Antiraid : protection activée').catch(() => {});
      }
      await scheduleLockRevert(member.guild, cfg.lockDurationMinutes || 0);
      await sendLog(member.guild, 'mod', {
        action: 'Kick + Lock (Antiraid)',
        description: `${member.user.tag} expulsé. Niveau de vérification augmenté.`,
        target: member.user,
        moderator: member.guild.members.me,
        reason,
      });
      await sendAlert(member.guild, cfg, {
        description: `${member.user.tag} expulsé. Serveur verrouillé (niveau de vérification maximal).`,
        fields: [
          { name: 'Utilisateur', value: `${member.user.tag} (${member.user.id})`, inline: true },
          { name: 'Action', value: 'Kick + Lock', inline: true },
          { name: 'Auto-désactivation', value: cfg.lockDurationMinutes ? `${cfg.lockDurationMinutes} min` : 'Manuelle', inline: true },
        ],
      });
      return true;
    }
  } catch (err) {
    console.error('Erreur antiraid:', err);
  }
  return true;
}
