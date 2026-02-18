import { createEmbed } from '../utils/embeds.js';
import { getE, E } from '../utils/emojis.js';
import { getGuildData, saveGuildData } from '../utils/database.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

/**
 * Parse une durée (ex: 10m, 1h, 2d) en millisecondes
 */
function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d|j)$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000, j: 86400000 };
  return val * (multipliers[unit] || 60000);
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}j ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function parseHexColor(hex) {
  if (!hex) return null;
  const m = String(hex).replace(/^#/, '').match(/^([0-9A-Fa-f]{6})$/);
  return m ? parseInt(m[1], 16) : null;
}

function buildGiveawayEmbed(giveaway, ended = false, guild = null) {
  const e = guild ? getE(guild) : E;
  const endDate = new Date(giveaway.endAt);
  const custom = giveaway.embed || {};
  const color = parseHexColor(custom.color) ?? (ended ? 0x57F287 : 0x5865F2);

  const fields = [
    { name: 'Prix', value: giveaway.prize, inline: true },
    { name: 'Gagnants', value: String(giveaway.winnersCount), inline: true },
    { name: 'Participants', value: String(giveaway.participants?.length || 0), inline: true },
    { name: 'Fin', value: ended ? 'Terminé' : `<t:${Math.floor(endDate.getTime() / 1000)}:R>`, inline: false },
  ];
  if (ended && giveaway.winners?.length) {
    fields.push({ name: 'Gagnant(s)', value: giveaway.winners.join(', '), inline: false });
  }
  if (giveaway.requiredRoles?.length && !ended) {
    const rolesStr = giveaway.requiredRoles.map(r => `<@&${r}>`).join(', ');
    fields.push({ name: 'Conditions', value: `Rôle requis : ${rolesStr}`, inline: false });
  }

  const title = custom.title || (ended ? `${e.celebration} Giveaway terminé` : `${e.gift} Giveaway`);
  const description = custom.description || (ended
    ? `**${giveaway.prize}**\n\nFélicitations aux gagnants !`
    : `**${giveaway.prize}**\n\nCliquez sur le bouton pour participer !`);

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields(fields)
    .setFooter({ text: `Organisé par ${giveaway.hostTag || 'Inconnu'} • ID: ${giveaway.id}` })
    .setTimestamp();
}

function getGiveawayButton(ended) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_join')
      .setLabel(ended ? 'Terminé' : 'Participer')
      .setStyle(ended ? ButtonStyle.Secondary : ButtonStyle.Primary)
      .setDisabled(ended)
  );
}

/** Parse les args de create : prize, duration, winners + options --channel, --title, --desc, --color, --role */
function parseCreateArgs(args) {
  const result = { prize: null, durationMs: null, winnersCount: null, channel: null, embed: {}, requiredRoles: [] };
  if (args.length < 3) return result;

  result.prize = args[0];
  result.durationMs = parseDuration(args[1]);
  result.winnersCount = parseInt(args[2], 10);

  let i = 3;
  const takeUntilNextFlag = (start) => {
    const parts = [];
    for (let j = start; j < args.length; j++) {
      if (args[j].startsWith('--')) break;
      parts.push(args[j]);
    }
    return { value: parts.join(' ').replace(/^["']|["']$/g, ''), consumed: parts.length };
  };

  while (i < args.length) {
    const a = args[i];
    if (a === '--channel' && args[i + 1]) {
      result.channel = args[i + 1].replace(/[<#>]/g, '');
      i += 2;
      continue;
    }
    if (a === '--title') {
      const { value, consumed } = takeUntilNextFlag(i + 1);
      result.embed.title = value || null;
      i += 1 + consumed;
      continue;
    }
    if (a === '--desc') {
      const { value, consumed } = takeUntilNextFlag(i + 1);
      result.embed.description = value || null;
      i += 1 + consumed;
      continue;
    }
    if (a === '--color' && args[i + 1]) {
      result.embed.color = args[i + 1];
      i += 2;
      continue;
    }
    if (a === '--role' && args[i + 1]) {
      const roleId = args[i + 1].replace(/[<@&>]/g, '');
      if (roleId) result.requiredRoles.push(roleId);
      i += 2;
      continue;
    }
    if (a.match(/^<#\d+>$/)) {
      result.channel = a.replace(/[<#>]/g, '');
    }
    i++;
  }
  return result;
}

export default {
  data: {
    name: 'giveaway',
    description: 'Gérer les giveaways (cadeaux)',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply({
        embeds: [createEmbed('error', {
          title: 'Permission refusée',
          description: 'Vous devez avoir "Gérer le serveur".',
        })],
      });
    }

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'create') {
      await giveawayCreate(message, args.slice(1));
      return;
    }
    if (subcommand === 'end') {
      await giveawayEnd(message, args.slice(1));
      return;
    }
    if (subcommand === 'reroll') {
      await giveawayReroll(message, args.slice(1));
      return;
    }
    if (subcommand === 'list') {
      await giveawayList(message);
      return;
    }

    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Giveaway – Aide',
        description: [
          '**`giveaway create <prix> <durée> <gagnants>`** – Créer',
          '• Durée: 10m, 1h, 24d',
          '',
          '**Options (optionnelles) :**',
          '• `#canal` ou `--channel #canal` – Salon où envoyer',
          '• `--title "Titre"` – Titre de l\'embed',
          '• `--desc "Description"` – Description',
          '• `--color 5865F2` – Couleur (hex)',
          '• `--role @rôle` – Rôle requis pour participer (répétable)',
          '',
          '**Exemple :** `giveaway create Nitro 1h 1 #giveaways --role @Membre --title "🎁 Nitro Gratuit"`',
          '',
          '**`giveaway end <id>`** – Terminer',
          '**`giveaway reroll <id>`** – Relancer les gagnants',
          '**`giveaway list`** – Liste des actifs',
        ].join('\n'),
      })],
    });
  },
};

async function giveawayCreate(message, args) {
  const parsed = parseCreateArgs(args);

  if (!parsed.prize || !parsed.durationMs || !parsed.winnersCount) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `giveaway create <prix> <durée> <gagnants>`\nEx: `giveaway create Nitro 1h 1`',
      })],
    });
  }

  if (parsed.durationMs < 60000) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Durée min 1 minute (10m, 1h, 24d)',
      })],
    });
  }
  if (parsed.winnersCount < 1 || parsed.winnersCount > 20) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Gagnants: 1-20',
      })],
    });
  }

  const targetChannel = parsed.channel
    ? message.guild.channels.cache.get(parsed.channel)
    : message.channel;
  if (!targetChannel?.isTextBased()) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Canal invalide ou inaccessible.',
      })],
    });
  }

  const endAt = Date.now() + parsed.durationMs;
  const id = `gw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const embedOpts = {};
  if (parsed.embed.title) embedOpts.title = parsed.embed.title;
  if (parsed.embed.description) embedOpts.description = parsed.embed.description;
  if (parsed.embed.color) embedOpts.color = parsed.embed.color;

  const giveaway = {
    id,
    channelId: targetChannel.id,
    hostId: message.author.id,
    hostTag: message.author.tag,
    prize: parsed.prize,
    endAt,
    winnersCount: parsed.winnersCount,
    participants: [],
    winners: null,
    ended: false,
    embed: Object.keys(embedOpts).length ? embedOpts : null,
    requiredRoles: parsed.requiredRoles.length ? parsed.requiredRoles : null,
  };

  const guildData = getGuildData(message.guild.id);
  if (!guildData.giveaways) guildData.giveaways = {};
  guildData.giveaways[id] = giveaway;
  saveGuildData(message.guild.id, guildData);

  const embed = buildGiveawayEmbed(giveaway, false, message.guild);
  const row = getGiveawayButton(false);

  const giveawayMsg = await targetChannel.send({
    embeds: [embed],
    components: [row],
  });

  giveaway.messageId = giveawayMsg.id;
  saveGuildData(message.guild.id, guildData);

  await message.reply({
    embeds: [createEmbed('success', {
      title: 'Giveaway créé',
      description: `**${parsed.prize}** envoyé dans ${targetChannel}. Fin dans ${formatDuration(parsed.durationMs)}.`,
    })],
  });
}

async function giveawayEnd(message, args) {
  const id = args[0];
  if (!id) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `giveaway end <id>`',
      })],
    });
  }

  const guildData = getGuildData(message.guild.id);
  const giveaway = guildData.giveaways?.[id];

  if (!giveaway) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Giveaway introuvable.',
      })],
    });
  }

  await endGiveaway(message.client, message.guild.id, id);
  await message.reply({
    embeds: [createEmbed('success', {
      title: 'Giveaway terminé',
      description: 'Le giveaway a été clôturé.',
    })],
  });
}

async function giveawayReroll(message, args) {
  const id = args[0];
  if (!id) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `giveaway reroll <id>`',
      })],
    });
  }

  const guildData = getGuildData(message.guild.id);
  const giveaway = guildData.giveaways?.[id];

  if (!giveaway || !giveaway.ended) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Giveaway introuvable ou pas terminé.',
      })],
    });
  }

  const participants = giveaway.participants || [];
  if (participants.length === 0) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Aucun participant.',
      })],
    });
  }

  const count = Math.min(giveaway.winnersCount, participants.length);
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const newWinners = shuffled.slice(0, count).map(uid => `<@${uid}>`);

  giveaway.winners = newWinners;
  saveGuildData(message.guild.id, guildData);

  try {
    const channel = await message.guild.channels.fetch(giveaway.channelId).catch(() => null);
    const msg = channel ? await channel.messages.fetch(giveaway.messageId).catch(() => null) : null;
    if (msg) {
      const embed = buildGiveawayEmbed(giveaway, true, message.guild);
      await msg.edit({ embeds: [embed], components: [getGiveawayButton(true)] });
    }
  } catch {}

  await message.reply({
    embeds: [createEmbed('success', {
      title: 'Reroll effectué',
      description: `Nouveaux gagnants: ${newWinners.join(', ')}`,
    })],
  });
}

async function giveawayList(message) {
  const guildData = getGuildData(message.guild.id);
  const giveaways = guildData.giveaways || {};
  const active = Object.values(giveaways).filter(g => !g.ended && g.endAt > Date.now());

  if (active.length === 0) {
    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Giveaways actifs',
        description: 'Aucun giveaway en cours.',
      })],
    });
  }

  const lines = active.map(g => {
    const end = `<t:${Math.floor(g.endAt / 1000)}:R>`;
    return `• **${g.prize}** – ID: \`${g.id}\` – Fin ${end}`;
  });

  return message.reply({
    embeds: [createEmbed('info', {
      title: 'Giveaways actifs',
      description: lines.join('\n'),
    })],
  });
}

export async function handleGiveawayButton(interaction) {
  if (interaction.customId !== 'giveaway_join') return false;

  const messageId = interaction.message.id;
  const guildData = getGuildData(interaction.guild.id);
  const giveaways = guildData.giveaways || {};
  const giveaway = Object.values(giveaways).find(g => g.messageId === messageId);

  if (!giveaway) {
    await interaction.reply({ content: 'Ce giveaway n\'existe plus.', ephemeral: true });
    return true;
  }
  if (giveaway.ended) {
    await interaction.reply({ content: 'Ce giveaway est terminé.', ephemeral: true });
    return true;
  }

  // Vérifier les conditions (rôles requis)
  const requiredRoles = giveaway.requiredRoles || [];
  if (requiredRoles.length > 0) {
    const memberRoles = interaction.member?.roles?.cache;
    const hasRole = requiredRoles.some(roleId => memberRoles?.has(roleId));
    if (!hasRole) {
      const rolesStr = requiredRoles.map(r => `<@&${r}>`).join(', ');
      await interaction.reply({
        content: `Vous devez avoir le rôle ${rolesStr} pour participer.`,
        ephemeral: true,
      });
      return true;
    }
  }

  const participants = giveaway.participants || [];
  const userId = interaction.user.id;

  if (participants.includes(userId)) {
    participants.splice(participants.indexOf(userId), 1);
    await interaction.reply({ content: 'Vous ne participez plus à ce giveaway.', ephemeral: true });
  } else {
    participants.push(userId);
    await interaction.reply({ content: 'Vous participez au giveaway !', ephemeral: true });
  }

  giveaway.participants = participants;
  saveGuildData(interaction.guild.id, guildData);

  const embed = buildGiveawayEmbed(giveaway, false, interaction.guild);
  await interaction.message.edit({ embeds: [embed] }).catch(() => {});

  return true;
}

export async function endGiveaway(client, guildId, id) {
  const guildData = getGuildData(guildId);
  const giveaway = guildData.giveaways?.[id];
  if (!giveaway || giveaway.ended) return;

  const participants = giveaway.participants || [];
  const count = Math.min(giveaway.winnersCount, participants.length);
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, count).map(uid => `<@${uid}>`);

  giveaway.ended = true;
  giveaway.winners = winners;
  saveGuildData(guildId, guildData);

  try {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    const channel = guild ? await guild.channels.fetch(giveaway.channelId).catch(() => null) : null;
    const msg = channel ? await channel.messages.fetch(giveaway.messageId).catch(() => null) : null;
    if (msg) {
      const e = guild ? getE(guild) : E;
      const embed = buildGiveawayEmbed(giveaway, true, guild);
      await msg.edit({ embeds: [embed], components: [getGiveawayButton(true)] });
      if (winners.length > 0) {
        await channel.send({
          content: `${e.celebration} Félicitations ${winners.join(', ')} ! Vous avez gagné **${giveaway.prize}** !`,
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Erreur endGiveaway:', err);
  }
}

export function startGiveawayChecker(client) {
  setInterval(async () => {
    const { getGuildData } = await import('../utils/database.js');
    const now = Date.now();

    for (const [guildId] of client.guilds.cache) {
      const data = getGuildData(guildId);
      const giveaways = data.giveaways || {};
      for (const [id, g] of Object.entries(giveaways)) {
        if (!g.ended && g.endAt && g.endAt <= now) {
          const { endGiveaway } = await import('./giveaway.js');
          await endGiveaway(client, guildId, id);
        }
      }
    }
  }, 30000);
}
