import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

const vouchSlashData = new SlashCommandBuilder()
  .setName('vouch')
  .setDescription('Système de recommandations (vouches)')
  .addSubcommand(sub =>
    sub
      .setName('add')
      .setDescription('Ajouter un vouch pour un seller')
      .addUserOption(o => o.setName('seller').setDescription('Le vendeur à recommander').setRequired(true))
      .addStringOption(o => o.setName('produit').setDescription('Produit ou service').setRequired(false))
      .addStringOption(o => o.setName('prix').setDescription('Prix payé (ex: 5€)').setRequired(false))
      .addIntegerOption(o => o.setName('etoiles').setDescription('Note de 1 à 5').setRequired(false).setMinValue(1).setMaxValue(5))
      .addStringOption(o => o.setName('raison').setDescription('Raison / commentaire').setRequired(false))
  )
  .addSubcommand(sub =>
    sub
      .setName('remove')
      .setDescription('Retirer un de vos vouches')
      .addStringOption(o => o.setName('id').setDescription('ID du vouch (ex: v_1234_abc)').setRequired(true))
  )
  .addSubcommand(sub =>
    sub
      .setName('list')
      .setDescription('Liste des vouches')
      .addUserOption(o => o.setName('utilisateur').setDescription('Voir les vouches').setRequired(false))
  )
  .addSubcommand(sub =>
    sub
      .setName('profile')
      .setDescription('Profil vouch')
      .addUserOption(o => o.setName('utilisateur').setDescription('Utilisateur').setRequired(false))
  );

function getVouches(guildId) {
  const guildData = getGuildData(guildId);
  if (!guildData.vouches) guildData.vouches = {};
  return guildData.vouches;
}

function saveVouches(guildId, vouches) {
  const guildData = getGuildData(guildId);
  guildData.vouches = vouches;
  saveGuildData(guildId, guildData);
}

async function vouchAdd(ctx, target, product, price, stars, reason) {
  if (target.bot) {
    return ctx.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Vous ne pouvez pas vouch un bot.' })], ephemeral: true });
  }
  if (target.id === ctx.author.id) {
    return ctx.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Vous ne pouvez pas vous vouch vous-même.' })], ephemeral: true });
  }
  const vouchId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const vouches = getVouches(ctx.guild.id);
  if (!vouches[target.id]) vouches[target.id] = [];
  const vouch = {
    id: vouchId,
    authorId: ctx.author.id,
    authorTag: ctx.author.tag,
    targetId: target.id,
    product: product || 'Non spécifié',
    price: price || '—',
    stars: Math.min(5, Math.max(1, stars || 5)),
    reason: reason || 'Aucune raison fournie.',
    comment: reason || 'Aucune raison fournie.',
    createdAt: new Date().toISOString(),
  };
  vouches[target.id].push(vouch);
  saveVouches(ctx.guild.id, vouches);
  const starStr = '★'.repeat(vouch.stars) + '☆'.repeat(5 - vouch.stars);
  const embed = new EmbedBuilder()
    .setColor(0xFF73FA)
    .setTitle('• New Vouch Recorded!')
    .setThumbnail(target.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: '🛒 Product', value: vouch.product, inline: true },
      { name: '💰 Price', value: vouch.price, inline: true },
      { name: '👤 Seller', value: target.toString(), inline: true },
      { name: '⭐ Rating', value: starStr, inline: true },
      { name: '💬 Reason', value: vouch.reason, inline: false },
      { name: '🔍 Vouched By', value: ctx.author.toString(), inline: true },
      { name: '🔗 Vouch ID', value: vouchId, inline: true },
      { name: '🕐 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: `${ctx.guild.name} • Vouches` })
    .setTimestamp();
  await ctx.channel.send({ embeds: [embed] });
  return ctx.reply({ embeds: [createEmbed('success', { title: 'Vouch enregistré', description: `Vouch pour **${target.tag}** enregistré.` })], ephemeral: true }).catch(() => {});
}

async function vouchRemove(ctx, id) {
  if (!id) return ctx.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Usage: vouch remove <id>' })], ephemeral: true });
  const vouches = getVouches(ctx.guild.id);
  let found = false;
  for (const [targetId, list] of Object.entries(vouches)) {
    const idx = list.findIndex(v => v.id === id && v.authorId === ctx.author.id);
    if (idx !== -1) {
      list.splice(idx, 1);
      if (list.length === 0) delete vouches[targetId];
      found = true;
      break;
    }
  }
  saveVouches(ctx.guild.id, vouches);
  if (!found) return ctx.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Vouch introuvable.' })], ephemeral: true });
  return ctx.reply({ embeds: [createEmbed('success', { title: 'Vouch retiré', description: 'Le vouch a été supprimé.' })], ephemeral: true });
}

async function vouchList(ctx, target) {
  const vouches = getVouches(ctx.guild.id);
  if (target) {
    const list = vouches[target.id] || [];
    if (list.length === 0) return ctx.reply({ embeds: [createEmbed('info', { title: `Vouches – ${target.tag}`, description: 'Aucun vouch.' })], ephemeral: true });
    const lines = list.slice(0, 10).map(v => {
      const date = new Date(v.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const desc = v.reason || v.comment || '—';
      const stars = v.stars ? '★'.repeat(v.stars) + '☆'.repeat(5 - v.stars) : '';
      return `• **${v.authorTag}** ${stars ? `(${stars}) ` : ''}– ${desc}\n  \`${v.id}\` (${date})`;
    });
    return ctx.reply({ embeds: [createEmbed('info', { title: `Vouches – ${target.tag} (${list.length})`, description: lines.join('\n\n') })], ephemeral: true });
  }
  const entries = Object.entries(vouches).filter(([, list]) => list.length > 0);
  if (entries.length === 0) return ctx.reply({ embeds: [createEmbed('info', { title: 'Vouches du serveur', description: 'Aucun vouch.' })], ephemeral: true });
  const sorted = entries.sort((a, b) => b[1].length - a[1].length);
  const lines = sorted.slice(0, 15).map(([userId, list]) => {
    const user = ctx.guild.members.cache.get(userId)?.user?.tag || userId;
    return `• **${user}** – ${list.length} vouch(es)`;
  });
  return ctx.reply({ embeds: [createEmbed('info', { title: 'Vouches du serveur', description: lines.join('\n') })], ephemeral: true });
}

async function vouchProfile(ctx, target) {
  const vouches = getVouches(ctx.guild.id);
  const list = vouches[target.id] || [];
  const positive = list.length;
  const uniqueAuthors = new Set(list.map(v => v.authorId)).size;
  const recent = list.slice(-3).reverse().map(v => {
    const desc = v.reason || v.comment || '—';
    const stars = v.stars ? '★'.repeat(v.stars) : '';
    return `${stars} *${desc}* — ${v.authorTag}`;
  }).join('\n');
  return ctx.reply({
    embeds: [createEmbed('info', {
      title: `Profil Vouch – ${target.tag}`,
      thumbnail: target.displayAvatarURL({ size: 2048 }),
      fields: [
        { name: 'Vouches', value: String(positive), inline: true },
        { name: 'Utilisateurs distincts', value: String(uniqueAuthors), inline: true },
        { name: 'Derniers vouches', value: recent || 'Aucun', inline: false },
      ],
    })],
    ephemeral: true,
  });
}

export default {
  data: vouchSlashData,
  async execute(interactionOrMessage, args, client) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const interaction = isSlash ? interactionOrMessage : null;
    const message = isSlash ? null : interactionOrMessage;
    const ctx = isSlash
      ? {
          reply: (opts) => interaction.reply({ ephemeral: opts?.ephemeral !== false, ...opts }),
          channel: interaction.channel,
          author: interaction.user,
          guild: interaction.guild,
          client: interaction.client,
        }
      : {
          reply: (opts) => { const { ephemeral, ...rest } = opts || {}; return message.reply(rest); },
          channel: message.channel,
          author: message.author,
          guild: message.guild,
          client: message.client,
        };
    if (isSlash) {
      const sub = interaction.options.getSubcommand();
      if (sub === 'add') {
        return vouchAdd(ctx, interaction.options.getUser('seller'),
          interaction.options.getString('produit') || 'Non spécifié',
          interaction.options.getString('prix') || '—',
          interaction.options.getInteger('etoiles') ?? 5,
          interaction.options.getString('raison') || '—');
      }
      if (sub === 'remove') return vouchRemove(ctx, interaction.options.getString('id'));
      if (sub === 'list') return vouchList(ctx, interaction.options.getUser('utilisateur') || null);
      if (sub === 'profile') return vouchProfile(ctx, interaction.options.getUser('utilisateur') || ctx.author);
      return ctx.reply({ embeds: [createEmbed('info', { title: 'Vouch', description: 'Utilisez les sous-commandes.' })], ephemeral: true });
    }
    return ctx.reply({
      embeds: [createEmbed('info', {
        title: 'Vouch – Slash uniquement',
        description: 'Utilisez **/vouch add**, **/vouch remove**, **/vouch list**, **/vouch profile**',
      })],
      ephemeral: true,
    });
  },
};
