import { createEmbed } from '../utils/embeds.js';
import { getE } from '../utils/emojis.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ChannelType } from 'discord.js';

const TEMP_DIR = join(process.cwd(), 'temp');

function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Parse une durée (ex: 7j, 30j, 1j) en millisecondes
 */
function parseDuration(str) {
  const match = str.match(/^(\d+)(j|d|h|m|s)$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { j: 86400000, d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return val * (multipliers[unit] || 86400000);
}

/**
 * Récupère les messages d'un salon depuis une date
 */
async function fetchChannelMessages(channel, since) {
  const messages = [];
  let lastId;
  const limit = 100;
  const maxIterations = 50; // max 5000 messages par salon
  let iterations = 0;

  while (iterations < maxIterations) {
    const options = { limit };
    if (lastId) options.before = lastId;

    const fetched = await channel.messages.fetch(options);
    if (fetched.size === 0) break;

    for (const [, msg] of fetched) {
      if (msg.createdAt < since) return messages;
      if (!msg.author?.bot) {
        messages.push({
          content: msg.content,
          author: msg.author?.tag || 'Inconnu',
          authorId: msg.author?.id,
          createdAt: msg.createdAt.toISOString(),
          attachments: msg.attachments.map(a => ({ url: a.url, name: a.name })),
        });
      }
      lastId = msg.id;
    }
    lastId = fetched.last()?.id;
    iterations++;
  }
  return messages;
}

export default {
  data: {
    name: 'backup',
    description: 'Sauvegarder ou restaurer un serveur complet',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply({
        embeds: [createEmbed('error', {
          title: 'Permission refusée',
          description: 'Vous devez être administrateur pour utiliser cette commande.',
        })],
      });
    }

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'restore') {
      await backupRestore(message, args.slice(1));
      return;
    }

    if (subcommand === 'create' || !subcommand) {
      await backupCreate(message, args.slice(1));
      return;
    }

    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Backup – Aide',
        description: [
          '**`backup create [messages] [durée]`** – Créer une sauvegarde',
          '• `messages` : `oui` ou `non` – Inclure les messages (défaut: non)',
          '• `durée` : ex. `7j`, `30j`, `14d` – Période en arrière si messages=oui (défaut: 7j)',
          '',
          '**`backup restore`** – Restaurer depuis un fichier JSON',
          '• Joignez le fichier backup au message avec la commande',
          '',
          'Exemples:',
          '`backup create` – Backup structure uniquement',
          '`backup create oui 30j` – Backup + messages des 30 derniers jours',
        ].join('\n'),
      })],
    });
  },
};

async function backupCreate(message, args) {
  const guild = message.guild;
  const e = getE(guild);
  const includeMessages = ['oui', 'yes', 'true', '1'].includes((args[0] || 'non').toLowerCase());
  const durationStr = args[1] || '7j';
  const durationMs = parseDuration(durationStr) || 7 * 24 * 60 * 60 * 1000;
  const since = new Date(Date.now() - durationMs);

  const loadingMsg = await message.reply({
    embeds: [createEmbed('info', {
      title: `${e.loading} Sauvegarde en cours...`,
      description: 'Collecte des données du serveur...',
    })],
  });

  try {
    ensureTempDir();

    const backup = {
      version: 1,
      name: guild.name,
      id: guild.id,
      icon: guild.iconURL({ size: 2048 }),
      banner: guild.bannerURL({ size: 2048 }),
      memberCount: guild.memberCount,
      createdAt: guild.createdAt.toISOString(),
      backupDate: new Date().toISOString(),
      channels: [],
      roles: [],
      emojis: [],
      stickers: [],
      messages: includeMessages ? {} : null,
    };

    // Rôles (sans @everyone)
    for (const [, r] of guild.roles.cache) {
      if (r.id === guild.id) continue;
      backup.roles.push({
        name: r.name,
        color: r.hexColor,
        position: r.position,
        permissions: r.permissions.toArray(),
        hoist: r.hoist,
        mentionable: r.mentionable,
      });
    }

    // Emojis
    for (const [, e] of guild.emojis.cache) {
      backup.emojis.push({
        name: e.name,
        url: e.url,
        animated: e.animated,
      });
    }

    // Stickers
    for (const [, s] of guild.stickers.cache) {
      backup.stickers.push({
        name: s.name,
        url: s.url,
        description: s.description,
      });
    }

    // Canaux (triés: catégories d'abord, puis par position)
    const sortedChannels = guild.channels.cache
      .filter(c => c.type !== ChannelType.GuildStageVoice)
      .sort((a, b) => {
        if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return -1;
        if (a.type !== ChannelType.GuildCategory && b.type === ChannelType.GuildCategory) return 1;
        return a.position - b.position;
      });

    for (const [, c] of sortedChannels) {
      const chData = {
        name: c.name,
        type: c.type,
        position: c.position,
        parent: c.parent?.name || null,
        permissionOverwrites: c.permissionOverwrites?.cache?.map(o => ({
          id: o.id,
          type: o.type,
          allow: o.allow.toArray(),
          deny: o.deny.toArray(),
        })) || [],
      };
      if (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement) {
        chData.topic = c.topic || null;
        chData.nsfw = c.nsfw || false;
        chData.rateLimitPerUser = c.rateLimitPerUser || 0;
      }
      if (c.type === ChannelType.GuildVoice) {
        chData.bitrate = c.bitrate || 64000;
        chData.userLimit = c.userLimit || 0;
      }
      backup.channels.push(chData);
    }

    // Messages (optionnel)
    if (includeMessages) {
      await loadingMsg.edit({
        embeds: [createEmbed('info', {
        title: `${e.loading} Sauvegarde en cours...`,
        description: `Récupération des messages (${durationStr} en arrière)...`,
        })],
      });

      const textChannels = guild.channels.cache.filter(
        c => (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement) && c.viewable
      );

      for (const [, ch] of textChannels) {
        try {
          const msgs = await fetchChannelMessages(ch, since);
          if (msgs.length > 0) {
            backup.messages[ch.name] = msgs;
          }
        } catch (err) {
          console.error(`Erreur fetch messages ${ch.name}:`, err.message);
        }
      }
    }

    const filename = `backup_${guild.id}_${Date.now()}.json`;
    const filepath = join(TEMP_DIR, filename);
    writeFileSync(filepath, JSON.stringify(backup, null, 2));

    const msgCount = backup.messages
      ? Object.values(backup.messages).reduce((sum, arr) => sum + arr.length, 0)
      : 0;

    const embed = createEmbed('success', {
      title: 'Sauvegarde créée',
      description: [
        `**${guild.name}**`,
        `**Canaux:** ${backup.channels.length}`,
        `**Rôles:** ${backup.roles.length}`,
        `**Emojis:** ${backup.emojis.length}`,
        `**Stickers:** ${backup.stickers.length}`,
        includeMessages ? `**Messages:** ${msgCount}` : '',
      ].filter(Boolean).join('\n'),
      footer: { text: 'Utilisez backup restore avec ce fichier sur un nouveau serveur' },
    });

    await loadingMsg.edit({
      embeds: [embed],
      files: [{ attachment: filepath, name: filename }],
    });
  } catch (error) {
    console.error('Erreur backup:', error);
    await loadingMsg.edit({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de créer la sauvegarde: ${error.message}`,
      })],
    });
  }
}

async function backupRestore(message, args) {
  const guild = message.guild;
  const e = getE(guild);
  const attachment = message.attachments?.first();

  if (!attachment || !attachment.name?.endsWith('.json')) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Fichier requis',
        description: 'Joignez un fichier backup (.json) à votre message.\nExemple: `backup restore` + fichier en pièce jointe',
      })],
    });
  }

  const loadingMsg = await message.reply({
    embeds: [createEmbed('info', {
      title: `${e.loading} Restauration en cours...`,
      description: 'Téléchargement et analyse du backup...',
    })],
  });

  try {
    const res = await fetch(attachment.url);
    const json = await res.json();

    if (!json.channels || !Array.isArray(json.channels)) {
      throw new Error('Fichier backup invalide.');
    }

    const roleMap = new Map();
    const channelMap = new Map();

    // 1. Créer les rôles
    await loadingMsg.edit({
      embeds: [createEmbed('info', {
        title: `${e.loading} Restauration...`,
        description: 'Création des rôles...',
      })],
    });

    for (const r of json.roles || []) {
      try {
        const role = await guild.roles.create({
          name: r.name,
          color: r.color || 0,
          permissions: r.permissions || [],
          hoist: r.hoist ?? false,
          mentionable: r.mentionable ?? false,
          reason: `Restore backup par ${message.author.tag}`,
        });
        roleMap.set(r.name, role);
      } catch (err) {
        console.error(`Rôle ${r.name}:`, err.message);
      }
    }

    // 2. Créer les catégories
    const categories = (json.channels || []).filter(c => c.type === ChannelType.GuildCategory);
    for (const c of categories) {
      try {
        const ch = await guild.channels.create({
          name: c.name,
          type: ChannelType.GuildCategory,
          position: c.position,
          reason: `Restore backup par ${message.author.tag}`,
        });
        channelMap.set(c.name, ch);
      } catch (err) {
        console.error(`Catégorie ${c.name}:`, err.message);
      }
    }

    // 3. Créer les canaux texte/vocaux
    const otherChannels = (json.channels || []).filter(c => c.type !== ChannelType.GuildCategory);
    for (const c of otherChannels) {
      try {
        const parent = c.parent ? channelMap.get(c.parent) : null;
        const parentId = parent?.id || null;

        let options = {
          name: c.name,
          parent: parentId,
          position: c.position,
          reason: `Restore backup par ${message.author.tag}`,
        };

        if (c.type === ChannelType.GuildText || c.type === 0) {
          options = {
            ...options,
            type: ChannelType.GuildText,
            topic: c.topic,
            nsfw: c.nsfw ?? false,
            rateLimitPerUser: c.rateLimitPerUser ?? 0,
          };
        } else if (c.type === ChannelType.GuildAnnouncement || c.type === 5) {
          options = {
            ...options,
            type: ChannelType.GuildAnnouncement,
            topic: c.topic,
            nsfw: c.nsfw ?? false,
          };
        } else if (c.type === ChannelType.GuildVoice || c.type === 2) {
          options = {
            ...options,
            type: ChannelType.GuildVoice,
            bitrate: Math.min(c.bitrate || 64000, 384000),
            userLimit: c.userLimit ?? 0,
          };
        } else {
          continue;
        }

        const ch = await guild.channels.create(options);
        channelMap.set(c.name, ch);
      } catch (err) {
        console.error(`Canal ${c.name}:`, err.message);
      }
    }

    // 4. Emojis
    await loadingMsg.edit({
      embeds: [createEmbed('info', {
        title: `${e.loading} Restauration...`,
        description: 'Ajout des emojis...',
      })],
    });

    for (const e of json.emojis || []) {
      try {
        const res = await fetch(e.url);
        const buffer = Buffer.from(await res.arrayBuffer());
        const ext = e.animated ? 'gif' : 'png';
        await guild.emojis.create({
          attachment: buffer,
          name: e.name,
          reason: `Restore backup par ${message.author.tag}`,
        });
      } catch (err) {
        console.error(`Emoji ${e.name}:`, err.message);
      }
    }

    // 5. Messages (optionnel) - on envoie dans les canaux correspondants
    if (json.messages && typeof json.messages === 'object') {
      await loadingMsg.edit({
        embeds: [createEmbed('info', {
          title: `${e.loading} Restauration...`,
          description: 'Restauration des messages...',
        })],
      });

      for (const [channelName, msgs] of Object.entries(json.messages)) {
        const ch = channelMap.get(channelName) || guild.channels.cache.find(c => c.name === channelName);
        if (!ch || !ch.isTextBased()) continue;

        const sorted = [...msgs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        for (const m of sorted.slice(0, 100)) {
          try {
            const text = `**[${m.author}]** ${m.content}`.slice(0, 2000);
            if (text.trim()) await ch.send(text).catch(() => {});
          } catch {}
        }
      }
    }

    await loadingMsg.edit({
      embeds: [createEmbed('success', {
        title: 'Restauration terminée',
        description: [
          `**${json.name}** a été restauré.`,
          `• Rôles: ${roleMap.size}`,
          `• Canaux: ${channelMap.size}`,
          `• Emojis: ${(json.emojis || []).length}`,
        ].join('\n'),
      })],
    });
  } catch (error) {
    console.error('Erreur restore:', error);
    await loadingMsg.edit({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de restaurer: ${error.message}`,
      })],
    });
  }
}
