import { createEmbed } from '../utils/embeds.js';

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
    description: 'Copier emojis/stickers d\'un serveur ou lister les siens',
  },
  execute: async (message, args) => {
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'list') {
      await emojiList(message, args.slice(1));
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

    if (!args[0]) {
      return message.reply({
        embeds: [createEmbed('info', {
          title: 'Emoji – Copier ou lister',
          description: [
            '**`emoji list`** – Lister les emojis et stickers du serveur',
            '**`emoji <id_serveur>`** – Copier tous les emojis et stickers d\'un serveur vers celui-ci',
            '**`emoji <emoji1> [emoji2] ...`** – Copier les emojis spécifiés',
            '',
            'Le bot doit être dans le serveur source pour copier par ID.',
          ].join('\n'),
        })],
      });
    }

    const input = args[0];
    const isGuildId = /^\d{17,20}$/.test(input);

    if (isGuildId) {
      await emojiCopyFromGuild(message, input);
    } else {
      await emojiCopyFromInput(message, args);
    }
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

async function emojiCopyFromGuild(message, sourceGuildId) {
  const targetGuild = message.guild;
  const sourceGuild = message.client.guilds.cache.get(sourceGuildId);

  if (!sourceGuild) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Serveur introuvable. Le bot doit être dans ce serveur.',
      })],
    });
  }

  const loadingMsg = await message.reply({
    embeds: [createEmbed('info', { title: '⏳ Copie en cours...', description: 'Récupération des emojis et stickers...' })],
  });

  const emojiCount = targetGuild.emojis.cache.size;
  const stickerCount = targetGuild.stickers.cache.size;
  const maxEmojis = getMaxEmojis(targetGuild);
  const maxStickers = getMaxStickers(targetGuild);

  const sourceEmojis = sourceGuild.emojis.cache;
  let sourceStickers = sourceGuild.stickers.cache;
  try {
    await sourceGuild.stickers.fetch();
    sourceStickers = sourceGuild.stickers.cache;
  } catch (_) {}

  const emojiSlots = Math.max(0, maxEmojis - emojiCount);
  const stickerSlots = Math.max(0, maxStickers - stickerCount);

  const emojisToCopy = Array.from(sourceEmojis.values()).filter(e => !targetGuild.emojis.cache.has(e.id));
  const stickersToCopy = Array.from(sourceStickers.values()).filter(s => !targetGuild.stickers.cache.has(s.id));

  const emojisToProcess = emojisToCopy.slice(0, emojiSlots);
  const stickersToProcess = stickersToCopy.slice(0, stickerSlots);

  const emojiSuccess = [];
  const emojiFailed = [];
  const stickerSuccess = [];
  const stickerFailed = [];

  for (const emoji of emojisToProcess) {
    try {
      const ext = emoji.animated ? 'gif' : 'png';
      const res = await fetch(emoji.url);
      if (!res.ok) throw new Error('Fetch failed');
      const buffer = Buffer.from(await res.arrayBuffer());
      const existing = targetGuild.emojis.cache.find(e => e.name === emoji.name);
      const name = existing ? `${emoji.name}_${emoji.id.slice(-6)}` : emoji.name;
      const newEmoji = await targetGuild.emojis.create({
        attachment: buffer,
        name,
        reason: `Copié par ${message.author.tag}`,
      });
      emojiSuccess.push(newEmoji);
    } catch (err) {
      emojiFailed.push({ name: emoji.name, reason: err.message });
    }
  }

  for (const sticker of stickersToProcess) {
    try {
      const existing = targetGuild.stickers.cache.find(s => s.name === sticker.name);
      const name = existing ? `${sticker.name}_${sticker.id.slice(-6)}` : sticker.name;
      const newSticker = await targetGuild.stickers.create({
        file: sticker.url,
        name,
        description: sticker.description || sticker.name,
        tags: sticker.tags || sticker.name,
        reason: `Copié par ${message.author.tag}`,
      });
      stickerSuccess.push(newSticker);
    } catch (err) {
      stickerFailed.push({ name: sticker.name, reason: err.message });
    }
  }

  const fields = [];
  if (emojiSuccess.length > 0) {
    const list = emojiSuccess.slice(0, 8).map(e => `${e} \`${e.name}\``).join('\n');
    fields.push({ name: `✅ Emojis (${emojiSuccess.length})`, value: list + (emojiSuccess.length > 8 ? `\n... +${emojiSuccess.length - 8}` : ''), inline: false });
  }
  if (stickerSuccess.length > 0) {
    const list = stickerSuccess.slice(0, 8).map(s => `\`${s.name}\``).join(', ');
    fields.push({ name: `✅ Stickers (${stickerSuccess.length})`, value: list + (stickerSuccess.length > 8 ? ` ... +${stickerSuccess.length - 8}` : ''), inline: false });
  }
  if (emojiFailed.length > 0 || stickerFailed.length > 0) {
    const failedList = [
      ...emojiFailed.slice(0, 3).map(f => `Emoji \`${f.name}\`: ${f.reason}`),
      ...stickerFailed.slice(0, 3).map(f => `Sticker \`${f.name}\`: ${f.reason}`),
    ].join('\n');
    fields.push({ name: `❌ Échecs (${emojiFailed.length + stickerFailed.length})`, value: failedList, inline: false });
  }

  const totalSuccess = emojiSuccess.length + stickerSuccess.length;
  const embed = createEmbed(totalSuccess > 0 ? 'success' : 'error', {
    title: totalSuccess > 0 ? 'Copie terminée' : 'Aucun élément copié',
    description: totalSuccess > 0
      ? `${emojiSuccess.length} emoji(s) et ${stickerSuccess.length} sticker(s) copié(s) depuis ${sourceGuild.name}.`
      : 'Aucun emoji ni sticker n\'a pu être copié.',
    fields: fields.length ? fields : undefined,
  });

  await loadingMsg.edit({ embeds: [embed] });
}

async function emojiCopyFromInput(message, args) {
  const emojiInputs = [];
  for (const arg of args) {
    const matches = arg.matchAll(EMOJI_REGEX);
    for (const m of matches) emojiInputs.push(m[0]);
  }

  if (emojiInputs.length === 0) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Aucun emoji valide. Utilisez le format `:nom:` ou collez des emojis personnalisés.\nExemple: `emoji :custom: :autre:`',
      })],
    });
  }

  const guild = message.guild;
  const emojiCount = guild.emojis.cache.size;
  const maxEmojis = getMaxEmojis(guild);
  const availableSlots = maxEmojis - emojiCount;

  if (availableSlots <= 0) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: `Le serveur a atteint la limite d'emojis (${maxEmojis}).`,
      })],
    });
  }

  const toProcess = emojiInputs.slice(0, Math.min(emojiInputs.length, availableSlots));
  const loadingMsg = await message.reply({
    embeds: [createEmbed('info', { title: '⏳ Copie...', description: `${toProcess.length} emoji(s) en cours...` })],
  });

  const successful = [];
  const failed = [];
  const skipped = [];

  for (const emojiInput of toProcess) {
    const match = emojiInput.match(/<a?:(\w+):(\d+)>/);
    if (!match) continue;

    const emojiName = match[1];
    const emojiId = match[2];

    const existing = guild.emojis.cache.find(e => e.name === emojiName);
    if (existing) {
      skipped.push(emojiName);
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
      successful.push(newEmoji);
    } catch (err) {
      failed.push({ name: emojiName, reason: err.message });
    }
  }

  const fields = [];
  if (successful.length > 0) {
    const list = successful.slice(0, 10).map(e => `${e} \`${e.name}\``).join('\n');
    fields.push({ name: `✅ Copiés (${successful.length})`, value: list + (successful.length > 10 ? `\n... +${successful.length - 10}` : ''), inline: false });
  }
  if (skipped.length > 0) {
    fields.push({ name: `⏭️ Ignorés (${skipped.length})`, value: skipped.slice(0, 5).map(s => `\`${s}\``).join(', ') + (skipped.length > 5 ? '...' : '') + '\n*Déjà existants*', inline: false });
  }
  if (failed.length > 0) {
    fields.push({ name: `❌ Échecs (${failed.length})`, value: failed.slice(0, 5).map(f => `\`${f.name}\`: ${f.reason}`).join('\n'), inline: false });
  }

  const embed = createEmbed(successful.length > 0 ? 'success' : 'error', {
    title: successful.length > 0 ? 'Emojis copiés' : 'Aucun emoji copié',
    description: successful.length > 0 ? `${successful.length} emoji(s) ajouté(s).` : 'Aucun emoji n\'a pu être copié.',
    fields: fields.length ? fields : undefined,
  });

  await loadingMsg.edit({ embeds: [embed] });
}
