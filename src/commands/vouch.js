import { EmbedBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'vouch',
    description: 'Système de recommandations (vouches)',
  },
  execute: async (message, args) => {
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'add') {
      await vouchAdd(message, args.slice(1));
      return;
    }
    if (subcommand === 'remove') {
      await vouchRemove(message, args.slice(1));
      return;
    }
    if (subcommand === 'list' || subcommand === 'ls') {
      await vouchList(message, args.slice(1));
      return;
    }
    if (subcommand === 'profile' || subcommand === 'p') {
      await vouchProfile(message, args.slice(1));
      return;
    }

    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Vouch – Aide',
        description: [
          '**`vouch add @seller | produit | prix | étoiles | raison`**',
          '• produit, prix, raison : texte libre',
          '• étoiles : 1 à 5',
          '',
          '**`vouch remove <id>`** – Retirer un vouch (le vôtre uniquement)',
          '**`vouch list [@user]`** – Liste des vouches',
          '**`vouch profile [@user]`** – Profil vouch',
        ].join('\n'),
      })],
    });
  },
};

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

async function vouchAdd(message, args) {
  const rest = args.join(' ');
  const parts = rest.split('|').map(p => p.trim());

  const target = message.mentions.users.first()
    || (parts[0] ? await message.client.users.fetch(parts[0].replace(/[<@!>]/g, '')).catch(() => null) : null);

  if (!target) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Mentionnez le seller.\n`vouch add @seller | produit | prix | étoiles | raison`',
      })],
    });
  }

  if (target.bot) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Vous ne pouvez pas vouch un bot.',
      })],
    });
  }

  if (target.id === message.author.id) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Vous ne pouvez pas vous vouch vous-même.',
      })],
    });
  }

  if (parts.length < 4) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Format: `vouch add @seller | produit | prix | étoiles | raison`\nEx: `vouch add @User | 4l tiktok | 5€ | 5 | Rapide et fiable`',
      })],
    });
  }

  const product = parts[1] || 'Non spécifié';
  const price = parts[2] || '—';
  const stars = Math.min(5, Math.max(1, parseInt(parts[3], 10) || 5));
  const reason = parts[4] || 'Aucune raison fournie.';

  const vouchId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const vouches = getVouches(message.guild.id);
  if (!vouches[target.id]) vouches[target.id] = [];

  const vouch = {
    id: vouchId,
    authorId: message.author.id,
    authorTag: message.author.tag,
    targetId: target.id,
    product,
    price,
    stars,
    reason,
    comment: reason,
    createdAt: new Date().toISOString(),
  };

  vouches[target.id].push(vouch);
  saveVouches(message.guild.id, vouches);

  const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);

  const embed = new EmbedBuilder()
    .setColor(0xFF73FA)
    .setTitle('• New Vouch Recorded!')
    .setThumbnail(target.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: '🛒 Product', value: product, inline: true },
      { name: '💰 Price', value: price, inline: true },
      { name: '👤 Seller', value: target.toString(), inline: true },
      { name: '⭐ Rating', value: starStr, inline: true },
      { name: '💬 Reason', value: reason, inline: false },
      { name: '🔍 Vouched By', value: message.author.toString(), inline: true },
      { name: '🔗 Vouch ID', value: vouchId, inline: true },
      { name: '🕐 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: `${message.guild.name} • Vouches` })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });

  return message.reply({
    embeds: [createEmbed('success', {
      title: 'Vouch enregistré',
      description: `Vouch pour **${target.tag}** enregistré.`,
    })],
  }).catch(() => {});
}

async function vouchRemove(message, args) {
  const id = args[0];
  if (!id) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `vouch remove <id>`',
      })],
    });
  }

  const vouches = getVouches(message.guild.id);
  let found = false;

  for (const [targetId, list] of Object.entries(vouches)) {
    const idx = list.findIndex(v => v.id === id && v.authorId === message.author.id);
    if (idx !== -1) {
      list.splice(idx, 1);
      if (list.length === 0) delete vouches[targetId];
      found = true;
      break;
    }
  }

  saveVouches(message.guild.id, vouches);

  if (!found) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Vouch introuvable ou vous n\'êtes pas l\'auteur de ce vouch.',
      })],
    });
  }

  return message.reply({
    embeds: [createEmbed('success', {
      title: 'Vouch retiré',
      description: 'Le vouch a été supprimé.',
    })],
  });
}

async function vouchList(message, args) {
  const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
  const vouches = getVouches(message.guild.id);

  if (target) {
    const list = vouches[target.id] || [];
    if (list.length === 0) {
      return message.reply({
        embeds: [createEmbed('info', {
          title: `Vouches – ${target.tag}`,
          description: 'Aucun vouch pour cet utilisateur.',
        })],
      });
    }

    const lines = list.slice(0, 10).map(v => {
      const date = new Date(v.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const desc = v.reason || v.comment || '—';
      const stars = v.stars ? '★'.repeat(v.stars) + '☆'.repeat(5 - v.stars) : '';
      return `• **${v.authorTag}** ${stars ? `(${stars}) ` : ''}– ${desc}\n  \`${v.id}\` (${date})`;
    });

    return message.reply({
      embeds: [createEmbed('info', {
        title: `Vouches – ${target.tag} (${list.length})`,
        description: lines.join('\n\n'),
      })],
    });
  }

  const entries = Object.entries(vouches).filter(([, list]) => list.length > 0);
  if (entries.length === 0) {
    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Vouches du serveur',
        description: 'Aucun vouch sur ce serveur.',
      })],
    });
  }

  const sorted = entries.sort((a, b) => b[1].length - a[1].length);
  const lines = sorted.slice(0, 15).map(([userId, list]) => {
    const user = message.guild.members.cache.get(userId)?.user?.tag || userId;
    return `• **${user}** – ${list.length} vouch(es)`;
  });

  return message.reply({
    embeds: [createEmbed('info', {
      title: 'Vouches du serveur',
      description: lines.join('\n'),
    })],
  });
}

async function vouchProfile(message, args) {
  const target = message.mentions.users.first()
    || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null)
    || message.author;

  const vouches = getVouches(message.guild.id);
  const list = vouches[target.id] || [];

  const positive = list.length;
  const uniqueAuthors = new Set(list.map(v => v.authorId)).size;

  const recent = list.slice(-3).reverse().map(v => {
    const desc = v.reason || v.comment || '—';
    const stars = v.stars ? '★'.repeat(v.stars) : '';
    return `${stars} *${desc}* — ${v.authorTag}`;
  }).join('\n');

  return message.reply({
    embeds: [createEmbed('info', {
      title: `Profil Vouch – ${target.tag}`,
      thumbnail: target.displayAvatarURL({ size: 2048 }),
      fields: [
        { name: 'Vouches', value: String(positive), inline: true },
        { name: 'Utilisateurs distincts', value: String(uniqueAuthors), inline: true },
        { name: 'Derniers vouches', value: recent || 'Aucun', inline: false },
      ],
    })],
  });
}
