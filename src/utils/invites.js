import { getGuildData, saveGuildData } from './database.js';

/** Cache des invites par guild: { code -> { uses, inviterId } } */
const inviteCache = new Map();

export function getInviteCache(guildId) {
  if (!inviteCache.has(guildId)) {
    inviteCache.set(guildId, new Map());
  }
  return inviteCache.get(guildId);
}

export async function fetchAndCacheInvites(guild) {
  try {
    const invites = await guild.invites.fetch();
    const cache = getInviteCache(guild.id);
    cache.clear();
    for (const [code, inv] of invites) {
      cache.set(code, { uses: inv.uses, inviterId: inv.inviter?.id || null });
    }
    return cache;
  } catch (err) {
    console.error('Erreur fetch invites:', err);
    return getInviteCache(guild.id);
  }
}

/**
 * Trouve l'invite utilisée (celle dont les uses ont augmenté)
 * @returns {Promise<{ inviterId: string|null }>}
 */
export async function findUsedInvite(guild, member) {
  try {
    const invites = await guild.invites.fetch();
    const cache = getInviteCache(guild.id);

    for (const [code, inv] of invites) {
      const cached = cache.get(code);
      const currentUses = inv.uses || 0;
      const prevUses = cached?.uses || 0;
      if (currentUses > prevUses) {
        cache.set(code, { uses: currentUses, inviterId: inv.inviter?.id || null });
        return { inviterId: inv.inviter?.id || null };
      }
    }
  } catch (err) {
    console.error('Erreur findUsedInvite:', err);
  }
  return { inviterId: null };
}

export function addInvite(guildId, inviterId) {
  const guildData = getGuildData(guildId);
  if (!guildData.invites) guildData.invites = {};
  if (!guildData.invites[inviterId]) guildData.invites[inviterId] = 0;
  guildData.invites[inviterId]++;
  saveGuildData(guildId, guildData);
}

export function getInviteCount(guildId, userId) {
  const guildData = getGuildData(guildId);
  return guildData.invites?.[userId] || 0;
}
