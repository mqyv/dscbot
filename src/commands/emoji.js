import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'emoji',
    description: 'Gérer les emojis du serveur',
  },
  execute: async (message, args) => {
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'rename') {
      await emojiRename(message, args.slice(1));
    } else {
      await emojiInfo(message, args);
    }
  },
};

async function emojiInfo(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner ou fournir un emoji.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const emojiText = args[0];
  const emoji = message.guild.emojis.cache.find(e => e.name === emojiText.replace(/[<>:]/g, '') || e.toString() === emojiText);

  if (!emoji) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Emoji non trouvé sur ce serveur.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const embed = createEmbed('default', {
    title: `Emoji: ${emoji.name}`,
    thumbnail: emoji.url,
    fields: [
      {
        name: 'ID',
        value: emoji.id,
        inline: true,
      },
      {
        name: 'Format',
        value: emoji.toString(),
        inline: true,
      },
      {
        name: 'Animé',
        value: emoji.animated ? 'Oui' : 'Non',
        inline: true,
      },
      {
        name: 'Créé le',
        value: `<t:${Math.floor(emoji.createdTimestamp / 1000)}:F>`,
        inline: false,
      },
    ],
  });

  message.reply({ embeds: [embed] });
}

async function emojiRename(message, args) {
  if (!message.member.permissions.has('ManageEmojisAndStickers')) {
    const errorEmbed = createEmbed('error', {
      title: 'Permission refusée',
      description: 'Vous devez avoir la permission "Gérer les emojis et stickers".',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un emoji et spécifier un nouveau nom.\nExemple: `,emoji rename :emoji: nouveau_nom`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const emojiText = args[0];
  const newName = args[1];

  if (!newName) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un nouveau nom pour l\'emoji.\nExemple: `,emoji rename :emoji: nouveau_nom`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  // Valider le nom (2-32 caractères, alphanumérique et underscore)
  if (newName.length < 2 || newName.length > 32) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Le nom de l\'emoji doit contenir entre 2 et 32 caractères.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  if (!/^[\w]+$/.test(newName)) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Le nom de l\'emoji ne peut contenir que des lettres, chiffres et underscores.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  // Trouver l'emoji
  const emojiRegex = /<a?:(\w+):(\d+)>/;
  const match = emojiText.match(emojiRegex);
  
  let emoji;
  if (match) {
    emoji = message.guild.emojis.cache.get(match[2]);
  } else {
    emoji = message.guild.emojis.cache.find(e => e.name === emojiText.replace(/[<>:]/g, '') || e.toString() === emojiText);
  }

  if (!emoji) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Emoji non trouvé sur ce serveur.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  // Vérifier si le nom existe déjà
  const existingEmoji = message.guild.emojis.cache.find(e => e.name === newName && e.id !== emoji.id);
  if (existingEmoji) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Un emoji avec le nom \`${newName}\` existe déjà sur ce serveur.`,
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    const oldName = emoji.name;
    await emoji.edit({ name: newName, reason: `Renommé par ${message.author.tag}` });

    const successEmbed = createEmbed('success', {
      title: 'Emoji renommé',
      description: `L'emoji ${emoji} a été renommé.`,
      thumbnail: emoji.url,
      fields: [
        {
          name: 'Ancien nom',
          value: `\`${oldName}\``,
          inline: true,
        },
        {
          name: 'Nouveau nom',
          value: `\`${newName}\``,
          inline: true,
        },
      ],
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de renommer l'emoji: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}
