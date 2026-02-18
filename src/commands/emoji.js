import { createEmbed } from '../utils/embeds.js';
import { E } from '../utils/emojis.js';

const EMOJI_REGEX = /<a?:(\w+):(\d+)>/g;

function getMaxEmojis(guild) {
  const tier = guild.premiumTier;
  return tier === 'TIER_3' ? 500 : tier === 'TIER_2' ? 300 : tier === 'TIER_1' ? 100 : 50;
}

function getMaxStickers(guild) {
  const tier = guild.premiumTier;
  return tier === 'TIER_3' ? 60 : tier === 'TIER_2' ? 30 : tier === 'TIER_1' ? 15 : 5;
}

export default {
  data: {
    name: 'emoji',
    description: 'Copier les emojis/stickers spécifiés ou lister les siens',
  },
  execute: async (message, args) => {
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'list') {
      await emojiList(message, args.slice(1));
      return;
    }

    if (subcommand === 'export') {
      await emojiExport(message);
      return;
    }

    // Sans sous-commande = copier (emojis/stickers d'un serveur vers le mien)
    if (!message.member.permissions.has('ManageEmojisAndStickers')) {
      return message.reply({
        embeds: [createEmbed('error', {
          title: 'Permission refusée',
          description: 'Vous devez avoir la permission "Gérer les emojis et stickers".',
        })],
      });
    }

    if (!args[0] && (!message.stickers || message.stickers.size === 0)) {
      return message.reply({
        embeds: [createEmbed('info', {
          title: 'Emoji – Copier ou lister',
          description: [
            '**`emoji list`** – Lister les emojis et stickers du serveur',
            '**`emoji export`** – Exporter les emojis au format config (pour personnalisation du bot)',
            '**`emoji <emoji1> [emoji2] ...`** – Copier les emojis/stickers spécifiés',
            '',
            'Collez les emojis ou ajoutez des autocollants au message.',
          ].join('\n'),
        })],
      });
    }

    await emojiCopyFromInput(message, args);
  },
};

async function emojiList(message, args) {
  const guild = message.guild;
  const emojis = guild.emojis.cache;
  const stickers = guild.stickers.cache;

  const maxEmojis = getMaxEmojis(guild);
  const maxStickers = getMaxStickers(guild);

  const page = parseInt(args[0]) || 1;
  const perPage = 15;
  const emojiArr = Array.from(emojis.values());
  const stickerArr = Array.from(stickers.values());
  const totalItems = emojiArr.length + stickerArr.length;

  if (totalItems === 0) {
    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Emojis & stickers',
        description: 'Ce serveur n\'a aucun emoji ni sticker personnalisé.',
      })],
    });
  }

  const totalPages = Math.ceil(totalItems / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;

  const allItems = [
    ...emojiArr.map(e => ({ type: 'emoji', data: e })),
    ...stickerArr.map(s => ({ type: 'sticker', data: s })),
  ];
  const pageItems = allItems.slice(start, end);

  const lines = pageItems.map(item => {
    if (item.type === 'emoji') {
      return `${item.data} \`${item.data.name}\` (emoji)`;
    }
    return `:${item.data.name}: \`${item.data.name}\` (sticker)`;
  });

  const embed = createEmbed('default', {
    title: `Emojis & stickers – ${guild.name}`,
    description: lines.join('\n') || 'Aucun',
    fields: [
      { name: 'Emojis', value: `${emojis.size}/${maxEmojis}`, inline: true },
      { name: 'Stickers', value: `${stickers.size}/${maxStickers}`, inline: true },
      { name: 'Page', value: `${page}/${totalPages}`, inline: true },
    ],
    footer: totalPages > 1 ? { text: `emoji list <page>` } : undefined,
  });

  message.reply({ embeds: [embed] });
}

/** Clés utilisées pour la personnalisation des emojis du bot */
const EMOJI_MAPPING_KEYS = [
  'success', 'error', 'loading', 'warning', 'info', 'skipped',
  'stats', 'ticket', 'gift', 'celebration', 'lock', 'notes',
  'reminder', 'dice', 'book',
];

async function emojiExport(message) {
  const guild = message.guild;
  const emojis = guild.emojis.cache;

  if (emojis.size === 0) {
    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Export emojis',
        description: 'Ce serveur n\'a aucun emoji. Ajoutez des emojis puis réessayez.',
      })],
    });
  }

  const lines = [];
  lines.push('# Format: <:nom:id> ou <a:nom:id> pour les animés');
  lines.push('# Copiez les lignes ci-dessous et remplacez par vos emojis pour configurer le bot.');
  lines.push('');
  lines.push('# === EMOJIS DU SERVEUR ===');
  for (const [, e] of emojis) {
    const format = e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`;
    lines.push(`${e.name}: ${format}`);
  }
  lines.push('');
  lines.push('# === TEMPLATE À REMPLIR (pour settings emojis) ===');
  lines.push('# Associez chaque clé à un emoji de la liste ci-dessus :');
  for (const key of EMOJI_MAPPING_KEYS) {
    lines.push(`${key}: <:nom:id>`);
  }

  const content = lines.join('\n');

  if (content.length <= 1900) {
    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Export emojis – Format config',
        description: '```\n' + content.slice(0, 1800) + (content.length > 1800 ? '\n...' : '') + '\n```',
        footer: { text: 'Utilisez emoji export pour obtenir le fichier complet si nécessaire' },
      })],
    });
  }

  const { writeFileSync } = await import('fs');
  const { join } = await import('path');
  const filename = `emoji_export_${guild.id}_${Date.now()}.txt`;
  const filepath = join(process.cwd(), 'temp', filename);
  const { existsSync, mkdirSync } = await import('fs');
  const tempDir = join(process.cwd(), 'temp');
  if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
  writeFileSync(filepath, content);

  return message.reply({
    embeds: [createEmbed('success', {
      title: 'Export emojis',
      description: `${emojis.size} emoji(s) exporté(s).\n\nFichier joint : copiez le contenu et utilisez-le avec \`settings emojis\` pour personnaliser les emojis du bot.`,
    })],
    files: [{ attachment: filepath, name: filename }],
  });
}

async function emojiCopyFromInput(message, args) {
  const emojiInputs = [];
  const content = message.content || '';
  const matches = content.matchAll(EMOJI_REGEX);
  for (const m of matches) emojiInputs.push(m[0]);

  const msgStickers = message.stickers ? Array.from(message.stickers.values()) : [];

  if (emojiInputs.length === 0 && msgStickers.length === 0) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Collez des emojis (`:nom:`) ou ajoutez des autocollants au message.\nExemple: `emoji :custom: :autre:`',
      })],
    });
  }

  const guild = message.guild;
  const emojiCount = guild.emojis.cache.size;
  const stickerCount = guild.stickers.cache.size;
  const maxEmojis = getMaxEmojis(guild);
  const maxStickers = getMaxStickers(guild);
  const emojiSlots = Math.max(0, maxEmojis - emojiCount);
  const stickerSlots = Math.max(0, maxStickers - stickerCount);

  const toProcessEmojis = emojiInputs.slice(0, emojiSlots);
  const toProcessStickers = msgStickers.slice(0, stickerSlots);
  const total = toProcessEmojis.length + toProcessStickers.length;
  const e = E;

  if (total === 0) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: `Limite atteinte (emojis: ${maxEmojis}, stickers: ${maxStickers}).`,
      })],
    });
  }

  const loadingMsg = await message.reply({
    embeds: [createEmbed('info', { title: `${e.loading} Copie...`, description: `${total} élément(s) en cours...` })],
  });

  const emojiSuccess = [];
  const emojiFailed = [];
  const emojiSkipped = [];
  const stickerSuccess = [];
  const stickerFailed = [];
  const stickerSkipped = [];

  for (const emojiInput of toProcessEmojis) {
    const match = emojiInput.match(/<a?:(\w+):(\d+)>/);
    if (!match) continue;

    const emojiName = match[1];
    const emojiId = match[2];

    const existing = guild.emojis.cache.find(e => e.name === emojiName);
    if (existing) {
      emojiSkipped.push(emojiName);
      continue;
    }

    try {
      let buffer;
      const gifRes = await fetch(`https://cdn.discordapp.com/emojis/${emojiId}.gif`);
      if (gifRes.ok) {
        buffer = Buffer.from(await gifRes.arrayBuffer());
      } else {
        const pngRes = await fetch(`https://cdn.discordapp.com/emojis/${emojiId}.png`);
        if (!pngRes.ok) throw new Error('Impossible de télécharger');
        buffer = Buffer.from(await pngRes.arrayBuffer());
      }
      const newEmoji = await guild.emojis.create({ attachment: buffer, name: emojiName, reason: `Copié par ${message.author.tag}` });
      emojiSuccess.push(newEmoji);
    } catch (err) {
      emojiFailed.push({ name: emojiName, reason: err.message });
    }
  }

  for (const sticker of toProcessStickers) {
    const existing = guild.stickers.cache.find(s => s.name === sticker.name);
    if (existing) {
      stickerSkipped.push(sticker.name);
      continue;
    }
    try {
      const newSticker = await guild.stickers.create({
        file: sticker.url,
        name: sticker.name,
        description: sticker.description || sticker.name,
        tags: sticker.tags || sticker.name,
        reason: `Copié par ${message.author.tag}`,
      });
      stickerSuccess.push(newSticker);
    } catch (err) {
      stickerFailed.push({ name: sticker.name, reason: err.message });
    }
  }

  const totalSuccess = emojiSuccess.length + stickerSuccess.length;
  const fields = [];
  if (emojiSuccess.length > 0) {
    const list = emojiSuccess.slice(0, 8).map(em => `${em} \`${em.name}\``).join('\n');
    fields.push({ name: `${e.success} Emojis (${emojiSuccess.length})`, value: list + (emojiSuccess.length > 8 ? `\n... +${emojiSuccess.length - 8}` : ''), inline: false });
  }
  if (stickerSuccess.length > 0) {
    const list = stickerSuccess.slice(0, 8).map(s => `\`${s.name}\``).join(', ');
    fields.push({ name: `${e.success} Stickers (${stickerSuccess.length})`, value: list + (stickerSuccess.length > 8 ? ` ... +${stickerSuccess.length - 8}` : ''), inline: false });
  }
  if (emojiSkipped.length > 0 || stickerSkipped.length > 0) {
    const skipped = [...emojiSkipped, ...stickerSkipped];
    fields.push({ name: `${e.skipped} Ignorés (${skipped.length})`, value: skipped.slice(0, 5).map(s => `\`${s}\``).join(', ') + (skipped.length > 5 ? '...' : '') + '\n*Déjà existants*', inline: false });
  }
  if (emojiFailed.length > 0 || stickerFailed.length > 0) {
    const failed = [...emojiFailed, ...stickerFailed];
    fields.push({ name: `${e.error} Échecs (${failed.length})`, value: failed.slice(0, 5).map(f => `\`${f.name}\`: ${f.reason}`).join('\n'), inline: false });
  }

  const embed = createEmbed(totalSuccess > 0 ? 'success' : 'error', {
    title: totalSuccess > 0 ? 'Copie terminée' : 'Aucun élément copié',
    description: totalSuccess > 0
      ? `${emojiSuccess.length} emoji(s) et ${stickerSuccess.length} sticker(s) copié(s).`
      : 'Aucun emoji ni sticker n\'a pu être copié.',
    fields: fields.length ? fields : undefined,
  });

  await loadingMsg.edit({ embeds: [embed] });
}
