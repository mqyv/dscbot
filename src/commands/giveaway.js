import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';
import { getE, E } from '../utils/emojis.js';
import { getGuildData, saveGuildData } from '../utils/database.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

const giveawaySlashData = new SlashCommandBuilder()
  .setName('giveaway')
  .setDescription('Gérer les giveaways (cadeaux)')
  .addSubcommand(sub =>
    sub
      .setName('create')
      .setDescription('Créer un giveaway avec embed personnalisable')
      .addStringOption(o => o.setName('prix').setDescription('Prix à gagner').setRequired(true))
      .addStringOption(o => o.setName('duree').setDescription('Durée (ex: 10m, 1h, 24d)').setRequired(true))
      .addIntegerOption(o => o.setName('gagnants').setDescription('Nombre de gagnants (1-20)').setRequired(true).setMinValue(1).setMaxValue(20))
      .addChannelOption(o => o.setName('canal').setDescription('Salon où envoyer (défaut: actuel)').setRequired(false))
      .addStringOption(o => o.setName('titre').setDescription('Titre de l\'embed').setRequired(false))
      .addStringOption(o => o.setName('description').setDescription('Description de l\'embed').setRequired(false))
      .addStringOption(o => o.setName('couleur').setDescription('Couleur hex (ex: 5865F2)').setRequired(false))
      .addRoleOption(o => o.setName('role').setDescription('Rôle requis pour participer').setRequired(false))
  )
  .addSubcommand(sub =>
    sub.setName('end').setDescription('Terminer un giveaway').addStringOption(o => o.setName('id').setDescription('ID du giveaway').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('reroll').setDescription('Relancer les gagnants').addStringOption(o => o.setName('id').setDescription('ID du giveaway').setRequired(true))
  )
  .addSubcommand(sub => sub.setName('list').setDescription('Liste des giveaways actifs'));

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

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields(fields)
    .setFooter({ text: `Organisé par ${giveaway.hostTag || 'Inconnu'} • ID: ${giveaway.id}` })
    .setTimestamp();

  if (custom.thumbnail) embed.setThumbnail(custom.thumbnail);
  if (custom.image) embed.setImage(custom.image);

  return embed;
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
  data: giveawaySlashData,
  execute: async (interaction) => {
    if (!interaction.isChatInputCommand?.()) {
      return interaction.reply({
        embeds: [createEmbed('info', { title: 'Giveaway', description: 'Utilisez **/giveaway create**, **/giveaway end**, **/giveaway reroll**, **/giveaway list**' })],
      }).catch(() => {});
    }
    if (!interaction.member?.permissions?.has('ManageGuild')) {
      return interaction.reply({
        embeds: [createEmbed('error', { title: 'Permission refusée', description: 'Vous devez avoir "Gérer le serveur".' })],
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      await interaction.deferReply({ ephemeral: true });
      const prize = interaction.options.getString('prix');
      const durationMs = parseDuration(interaction.options.getString('duree'));
      const winnersCount = interaction.options.getInteger('gagnants');
      const channel = interaction.options.getChannel('canal') || interaction.channel;
      const titre = interaction.options.getString('titre');
      const description = interaction.options.getString('description');
      const couleur = interaction.options.getString('couleur');
      const role = interaction.options.getRole('role');

      if (!durationMs || durationMs < 60000) {
        return interaction.editReply({
          embeds: [createEmbed('error', { title: 'Erreur', description: 'Durée invalide. Ex: 10m, 1h, 24d (min 1 min)' })],
        });
      }
      if (!channel?.isTextBased()) {
        return interaction.editReply({
          embeds: [createEmbed('error', { title: 'Erreur', description: 'Canal invalide.' })],
        });
      }

      const endAt = Date.now() + durationMs;
      const id = `gw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const embedOpts = {};
      if (titre) embedOpts.title = titre;
      if (description) embedOpts.description = description;
      if (couleur) embedOpts.color = couleur;

      const giveaway = {
        id,
        channelId: channel.id,
        hostId: interaction.user.id,
        hostTag: interaction.user.tag,
        prize,
        endAt,
        winnersCount,
        participants: [],
        winners: null,
        ended: false,
        embed: Object.keys(embedOpts).length ? embedOpts : null,
        requiredRoles: role ? [role.id] : null,
      };

      const guildData = getGuildData(interaction.guild.id);
      if (!guildData.giveaways) guildData.giveaways = {};
      guildData.giveaways[id] = giveaway;
      saveGuildData(interaction.guild.id, guildData);

      const embed = buildGiveawayEmbed(giveaway, false, interaction.guild);
      const row = getGiveawayButton(false);

      const msg = await channel.send({ embeds: [embed], components: [row] });
      giveaway.messageId = msg.id;
      saveGuildData(interaction.guild.id, guildData);

      return interaction.editReply({
        embeds: [createEmbed('success', {
          title: 'Giveaway créé',
          description: `**${prize}** envoyé dans ${channel}. Fin dans ${formatDuration(durationMs)}.`,
        })],
      });
    }

    if (sub === 'end') {
      const id = interaction.options.getString('id');
      const guildData = getGuildData(interaction.guild.id);
      const giveaway = guildData.giveaways?.[id];
      if (!giveaway) {
        return interaction.reply({
          embeds: [createEmbed('error', { title: 'Erreur', description: 'Giveaway introuvable.' })],
          ephemeral: true,
        });
      }
      await endGiveaway(interaction.client, interaction.guild.id, id);
      return interaction.reply({
        embeds: [createEmbed('success', { title: 'Giveaway terminé', description: 'Le giveaway a été clôturé.' })],
        ephemeral: true,
      });
    }

    if (sub === 'reroll') {
      const id = interaction.options.getString('id');
      const guildData = getGuildData(interaction.guild.id);
      const giveaway = guildData.giveaways?.[id];
      if (!giveaway || !giveaway.ended) {
        return interaction.reply({
          embeds: [createEmbed('error', { title: 'Erreur', description: 'Giveaway introuvable ou pas terminé.' })],
          ephemeral: true,
        });
      }
      const participants = giveaway.participants || [];
      if (participants.length === 0) {
        return interaction.reply({
          embeds: [createEmbed('error', { title: 'Erreur', description: 'Aucun participant.' })],
          ephemeral: true,
        });
      }
      const count = Math.min(giveaway.winnersCount, participants.length);
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      const newWinners = shuffled.slice(0, count).map(uid => `<@${uid}>`);
      giveaway.winners = newWinners;
      saveGuildData(interaction.guild.id, guildData);
      try {
        const ch = await interaction.guild.channels.fetch(giveaway.channelId).catch(() => null);
        const m = ch ? await ch.messages.fetch(giveaway.messageId).catch(() => null) : null;
        if (m) await m.edit({ embeds: [buildGiveawayEmbed(giveaway, true, interaction.guild)], components: [getGiveawayButton(true)] });
      } catch {}
      return interaction.reply({
        embeds: [createEmbed('success', { title: 'Reroll effectué', description: `Nouveaux gagnants: ${newWinners.join(', ')}` })],
        ephemeral: true,
      });
    }

    if (sub === 'list') {
      const guildData = getGuildData(interaction.guild.id);
      const giveaways = guildData.giveaways || {};
      const active = Object.values(giveaways).filter(g => !g.ended && g.endAt > Date.now());
      if (active.length === 0) {
        return interaction.reply({
          embeds: [createEmbed('info', { title: 'Giveaways actifs', description: 'Aucun giveaway en cours.' })],
          ephemeral: true,
        });
      }
      const lines = active.map(g => `• **${g.prize}** – ID: \`${g.id}\` – Fin <t:${Math.floor(g.endAt / 1000)}:R>`);
      return interaction.reply({
        embeds: [createEmbed('info', { title: 'Giveaways actifs', description: lines.join('\n') })],
        ephemeral: true,
      });
    }
  },
};

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

  const requiredRoles = giveaway.requiredRoles || [];
  if (requiredRoles.length > 0) {
    const memberRoles = interaction.member?.roles?.cache;
    const hasRole = requiredRoles.some(roleId => memberRoles?.has(roleId));
    if (!hasRole) {
      const rolesStr = requiredRoles.map(r => `<@&${r}>`).join(', ');
      await interaction.reply({ content: `Vous devez avoir le rôle ${rolesStr} pour participer.`, ephemeral: true });
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
