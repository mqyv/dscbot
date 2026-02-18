import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

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

function buildGiveawayEmbed(giveaway, ended = false) {
  const endDate = new Date(giveaway.endAt);
  const fields = [
    { name: 'Prix', value: giveaway.prize, inline: true },
    { name: 'Gagnants', value: String(giveaway.winnersCount), inline: true },
    { name: 'Participants', value: String(giveaway.participants?.length || 0), inline: true },
    { name: 'Fin', value: ended ? 'Terminé' : `<t:${Math.floor(endDate.getTime() / 1000)}:R>`, inline: false },
  ];
  if (ended && giveaway.winners?.length) {
    fields.push({ name: 'Gagnant(s)', value: giveaway.winners.join(', '), inline: false });
  }
  return createEmbed(ended ? 'success' : 'info', {
    title: ended ? '🎉 Giveaway terminé' : '🎁 Giveaway',
    description: ended
      ? `**${giveaway.prize}**\n\nFélicitations aux gagnants !`
      : `**${giveaway.prize}**\n\nCliquez sur le bouton pour participer !`,
    fields,
    footer: ended
      ? { text: `Organisé par ${giveaway.hostTag || 'Inconnu'}` }
      : { text: `Organisé par ${giveaway.hostTag || 'Inconnu'} • ID: ${giveaway.id}` },
    timestamp: true,
  });
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
          description: 'Vous devez avoir la permission "Gérer le serveur".',
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
          '**`giveaway create <prix> <durée> <gagnants>`** – Créer un giveaway',
          '• Durée: ex. `10m`, `1h`, `24d`',
          '',
          '**`giveaway end <id>`** – Terminer un giveaway maintenant',
          '**`giveaway reroll <id>`** – Retirer les gagnants',
          '**`giveaway list`** – Liste des giveaways actifs',
        ].join('\n'),
      })],
    });
  },
};

async function giveawayCreate(message, args) {
  if (args.length < 3) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `giveaway create <prix> <durée> <gagnants>`\nEx: `giveaway create Nitro 1h 1`',
      })],
    });
  }

  const prize = args[0];
  const durationMs = parseDuration(args[1]);
  const winnersCount = parseInt(args[2], 10);

  if (!durationMs || durationMs < 60000) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Durée invalide. Ex: 10m, 1h, 24d (min 1 minute)',
      })],
    });
  }
  if (isNaN(winnersCount) || winnersCount < 1 || winnersCount > 20) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Nombre de gagnants invalide (1-20).',
      })],
    });
  }

  const endAt = Date.now() + durationMs;
  const id = `gw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const giveaway = {
    id,
    channelId: message.channel.id,
    hostId: message.author.id,
    hostTag: message.author.tag,
    prize,
    endAt,
    winnersCount,
    participants: [],
    winners: null,
    ended: false,
  };

  const guildData = getGuildData(message.guild.id);
  if (!guildData.giveaways) guildData.giveaways = {};
  guildData.giveaways[id] = giveaway;
  saveGuildData(message.guild.id, guildData);

  const embed = buildGiveawayEmbed(giveaway);
  const row = getGiveawayButton(false);

  const giveawayMsg = await message.channel.send({
    embeds: [embed],
    components: [row],
  });

  giveaway.messageId = giveawayMsg.id;
  saveGuildData(message.guild.id, guildData);

  await message.reply({
    embeds: [createEmbed('success', {
      title: 'Giveaway créé',
      description: `Giveaway **${prize}** créé. Fin dans ${formatDuration(durationMs)}.`,
    })],
  });
}

async function giveawayEnd(message, args) {
  const id = args[0];
  if (!id) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `giveaway end <id>`\nUtilisez `giveaway list` pour voir les IDs.',
      })],
    });
  }

  const guildData = getGuildData(message.guild.id);
  const giveaway = guildData.giveaways?.[id];

  if (!giveaway) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Giveaway introuvable ou déjà terminé.',
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
        description: 'Giveaway introuvable ou pas encore terminé.',
      })],
    });
  }

  const participants = giveaway.participants || [];
  if (participants.length === 0) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Aucun participant pour reroll.',
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
      const embed = buildGiveawayEmbed(giveaway, true);
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

  const embed = buildGiveawayEmbed(giveaway);
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
      const embed = buildGiveawayEmbed(giveaway, true);
      await msg.edit({ embeds: [embed], components: [getGiveawayButton(true)] });
      if (winners.length > 0) {
        await channel.send({
          content: `🎉 Félicitations ${winners.join(', ')} ! Vous avez gagné **${giveaway.prize}** !`,
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
