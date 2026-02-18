import { createEmbed } from '../utils/embeds.js';
import { E } from '../utils/emojis.js';
import { getGuildData, saveGuildData } from '../utils/database.js';
import { isMainOwner } from '../utils/owners.js';

const PROFILE_KEYS = ['avatar', 'banner', 'activity', 'bio', 'username', 'nickname'];

// Types d'activité Discord : Playing, Streaming, Listening, Watching, Custom, Competing
const ACTIVITY_TYPES = {
  playing: 0, joue: 0, play: 0, p: 0,
  streaming: 1, stream: 1, direct: 1, live: 1, s: 1,
  listening: 2, écoute: 2, listen: 2, l: 2,
  watching: 3, regarde: 3, watch: 3, w: 3,
  custom: 4, c: 4,
  competing: 5, participe: 5, compete: 5,
};

function parseActivityString(str) {
  if (!str?.trim()) return null;
  const parts = str.trim().split(/\s+/);
  const typeKey = parts[0]?.toLowerCase();
  const type = ACTIVITY_TYPES[typeKey] ?? 3; // default: watching
  const urlMatch = parts.find(p => /^https?:\/\//i.test(p));
  const url = urlMatch || null;
  const rest = parts.filter((p, i) => i > 0 && p !== url);
  let name, state;
  if (type === 4) {
    // Custom: tout le reste est le statut personnalisé
    name = 'Custom Status';
    state = rest.join(' ') || 'En ligne';
  } else {
    name = rest[0] || 'quelque chose';
    state = rest.length > 1 ? rest.slice(1).join(' ') : undefined;
  }
  if (type === 1 && !url) return null; // Streaming requiert une URL
  return { type, name, state, url };
}

function setBotActivity(client, { type, name, state, url }) {
  const opts = { type };
  if (state) opts.state = state;
  if (url && type === 1) opts.url = url; // Streaming
  return client.user.setActivity(name, opts);
}

export async function restoreBotActivity(client) {
  const globalData = getGuildData('global');
  const activityStr = globalData?.settings?.botActivity;
  if (activityStr) {
    const act = parseActivityString(activityStr);
    if (act) setBotActivity(client, act).catch(() => {});
  }
}

export default {
  data: {
    name: 'customize',
    description: 'Personnaliser le profil complet du bot (pp, bannière, activité, bio, etc.)',
  },
  execute: async (message, args) => {
    const authorId = message.author?.id || message.user?.id;
    if (!isMainOwner(authorId)) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Seul le propriétaire principal du bot peut modifier le profil (avatar, bannière, activité, etc.).',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (message.interaction?.options?.data?.length) {
      return customizeSetAll(message, []);
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'set':
      case 'all':
      case 'profile':
        await customizeSetAll(message, args.slice(1));
        break;
      case 'bio':
        await customizeBio(message, args.slice(1));
        break;
      case 'avatar':
        await customizeAvatar(message, args.slice(1));
        break;
      case 'banner':
        await customizeBanner(message, args.slice(1));
        break;
      case 'nickname':
        await customizeNickname(message, args.slice(1));
        break;
      case 'username':
        await customizeUsername(message, args.slice(1));
        break;
      case 'activity':
        await customizeActivity(message, args.slice(1));
        break;
      case 'view':
        await customizeView(message);
        break;
      default:
        const prefix = (await import('../utils/database.js')).getPrefix(message.guild?.id, message.author.id);
        const embed = createEmbed('settings', {
          title: 'Personnalisation du bot',
          description: '**Modifier tout en une fois:**\n`' + prefix + 'customize set avatar <url> banner <url> activity <texte> bio <texte> username <nom> nickname <surnom>`\n\n**Ou une par une:**',
          fields: [
            { name: '`avatar`', value: 'Photo de profil (PP)', inline: true },
            { name: '`banner`', value: 'Bannière du profil', inline: true },
            { name: '`activity`', value: 'Activité (playing, streaming, listening, watching, competing, custom)', inline: true },
            { name: '`bio`', value: 'Bio du bot', inline: true },
            { name: '`username`', value: 'Nom d\'utilisateur', inline: true },
            { name: '`nickname`', value: 'Surnom sur le serveur', inline: true },
            { name: '`view`', value: 'Voir la config actuelle', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
        break;
    }
  },
};

function parseProfileArgs(args) {
  const result = {};
  let i = 0;
  while (i < args.length) {
    const arg = args[i].toLowerCase();
    if (PROFILE_KEYS.includes(arg)) {
      const valueParts = [];
      i++;
      while (i < args.length && !PROFILE_KEYS.includes(args[i].toLowerCase())) {
        valueParts.push(args[i]);
        i++;
      }
      result[arg] = valueParts.join(' ').trim();
    } else {
      i++;
    }
  }
  return result;
}

async function customizeSetAll(message, args) {
  let params = {};

  if (message.interaction) {
    const opt = (name) => message.interaction.options.get(name)?.value;
    if (opt('avatar')) params.avatar = opt('avatar');
    if (opt('banner')) params.banner = opt('banner');
    if (opt('activity')) params.activity = opt('activity');
    if (opt('bio')) params.bio = opt('bio');
    if (opt('username')) params.username = opt('username');
    if (opt('nickname')) params.nickname = opt('nickname');
  } else {
    if (!args.length) {
      const prefix = (await import('../utils/database.js')).getPrefix(message.guild?.id, message.author.id);
      return message.reply({
        embeds: [createEmbed('error', {
          title: 'Usage',
          description: `\`${prefix}customize set avatar <url> banner <url> activity <texte> bio <texte> username <nom> nickname <surnom>\`\n\nTu peux ne mettre que ce que tu veux changer.`,
        })],
      });
    }
    params = parseProfileArgs(args);
  }

  if (!Object.keys(params).length) {
    return message.reply({
      embeds: [createEmbed('error', { title: 'Erreur', description: 'Aucun paramètre fourni.' })],
    });
  }
  const e = E;
  const guildData = message.guild ? getGuildData(message.guild.id) : { settings: {} };
  if (!guildData.settings) guildData.settings = {};
  const changes = [];

  try {
    if (params.avatar) {
      try {
        new URL(params.avatar);
      } catch {
        throw new Error('URL avatar invalide');
      }
      await message.client.user.setAvatar(params.avatar);
      guildData.settings.botAvatar = params.avatar;
      changes.push(`${e.success} Avatar (PP)`);
    }

    if (params.banner) {
      try {
        new URL(params.banner);
      } catch {
        throw new Error('URL bannière invalide');
      }
      await message.client.user.setBanner(params.banner).catch(() => {});
      guildData.settings.botBanner = params.banner;
      changes.push(`${e.success} Bannière`);
    }

    if (params.activity) {
      const act = parseActivityString(params.activity);
      if (!act) throw new Error('Format activité invalide. Ex: playing Minecraft ou streaming Ma chaîne https://twitch.tv/...');
      await setBotActivity(message.client, act);
      const globalData = getGuildData('global');
      if (!globalData.settings) globalData.settings = {};
      globalData.settings.botActivity = params.activity;
      saveGuildData('global', globalData);
      changes.push(`${e.success} Activité`);
    }

    if (params.bio) {
      if (params.bio.length > 190) throw new Error('Bio max 190 caractères');
      guildData.settings.botBio = params.bio;
      changes.push(`${e.success} Bio`);
    }

    if (params.username) {
      if (params.username.length < 2 || params.username.length > 32) throw new Error('Username: 2-32 caractères');
      await message.client.user.setUsername(params.username);
      changes.push(`${e.success} Nom d'utilisateur`);
    }

    if (params.nickname && message.guild) {
      if (params.nickname.length > 32) throw new Error('Nickname max 32 caractères');
      const member = await message.guild.members.fetch(message.client.user.id);
      await member.setNickname(params.nickname);
      guildData.settings.botNickname = params.nickname;
      changes.push(`${e.success} Surnom`);
    }

    if (message.guild) {
      saveGuildData(message.guild.id, guildData);
    }

    const embed = createEmbed('success', {
      title: 'Profil du bot mis à jour',
      description: changes.length ? changes.join('\n') : 'Aucun changement.',
      thumbnail: message.client.user.displayAvatarURL({ size: 256 }),
      image: guildData.settings?.botBanner || undefined,
    });
    message.reply({ embeds: [embed] });
  } catch (error) {
    message.reply({
      embeds: [createEmbed('error', { title: 'Erreur', description: error.message })],
    });
  }
}

async function customizeBio(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier une bio.\nExemple: `,customize bio Un bot Discord moderne et personnalisable`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const bio = args.join(' ');

  if (bio.length > 190) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'La bio ne peut pas dépasser 190 caractères.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  guildData.settings.botBio = bio;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Bio modifiée',
    description: `La bio du bot a été définie sur :\n\`${bio}\``,
  });

  message.reply({ embeds: [successEmbed] });
}

async function customizeAvatar(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez fournir une URL d\'image.\nExemple: `,customize avatar https://example.com/avatar.png`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const avatarUrl = args[0];

  // Vérifier que c'est une URL valide
  try {
    new URL(avatarUrl);
  } catch {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'URL invalide. Veuillez fournir une URL valide.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    await message.client.user.setAvatar(avatarUrl);

    const guildData = getGuildData(message.guild.id);
    if (!guildData.settings) guildData.settings = {};
    guildData.settings.botAvatar = avatarUrl;
    saveGuildData(message.guild.id, guildData);

    const successEmbed = createEmbed('success', {
      title: 'Avatar modifié',
      description: `L'avatar du bot a été modifié.\n**Note:** L'avatar est global pour tous les serveurs.`,
      thumbnail: avatarUrl,
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de modifier l'avatar: ${error.message}\n\n**Note:** Vous ne pouvez modifier l'avatar que 2 fois par heure.`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function customizeBanner(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez fournir une URL d\'image.\nExemple: `,customize banner https://example.com/banner.png`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const bannerUrl = args[0];

  try {
    new URL(bannerUrl);
  } catch {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'URL invalide.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    await message.client.user.setBanner(bannerUrl);
  } catch (e) {
    console.error('setBanner:', e);
  }

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  guildData.settings.botBanner = bannerUrl;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Bannière configurée',
    description: `La bannière du bot a été configurée.`,
    image: bannerUrl,
  });

  message.reply({ embeds: [successEmbed] });
}

async function customizeNickname(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un surnom.\nExemple: `,customize nickname Mon Bot`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const nickname = args.join(' ');

  if (nickname.length > 32) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Le surnom ne peut pas dépasser 32 caractères.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    const member = await message.guild.members.fetch(message.client.user.id);
    await member.setNickname(nickname);

    const guildData = getGuildData(message.guild.id);
    if (!guildData.settings) guildData.settings = {};
    guildData.settings.botNickname = nickname;
    saveGuildData(message.guild.id, guildData);

    const successEmbed = createEmbed('success', {
      title: 'Surnom modifié',
      description: `Le surnom du bot a été modifié sur : \`${nickname}\``,
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de modifier le surnom: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function customizeUsername(message, args) {
  if (!message.member.permissions.has('Administrator')) {
    const errorEmbed = createEmbed('error', {
      title: `${E.error} Permission refusée`,
      description: 'Vous devez être administrateur pour modifier le nom d\'utilisateur du bot.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un nom d\'utilisateur.\nExemple: `,customize username MonBot`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const username = args.join(' ');

  if (username.length < 2 || username.length > 32) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Le nom d\'utilisateur doit contenir entre 2 et 32 caractères.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    await message.client.user.setUsername(username);

    const successEmbed = createEmbed('success', {
      title: 'Nom d\'utilisateur modifié',
      description: `Le nom d'utilisateur du bot a été modifié sur : \`${username}\`\n\n**Note:** Le changement peut prendre quelques minutes pour s'afficher.`,
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de modifier le nom d'utilisateur: ${error.message}\n\n**Note:** Vous ne pouvez modifier le nom que 2 fois par heure.`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function customizeActivity(message, args) {
  const inGuild = !!message.guild;
  if (inGuild && message.member && !message.member.permissions.has('ManageGuild')) {
    const errorEmbed = createEmbed('error', {
      title: `${E.error} Permission refusée`,
      description: 'Vous devez avoir la permission "Gérer le serveur".',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  if (!args[0]) {
    const prefix = (await import('../utils/database.js')).getPrefix(message.guild?.id, message.author.id);
    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Types d\'activité disponibles',
        description: [
          '**Format:** `' + prefix + 'customize activity <type> <nom> [description] [url]`',
          '',
          '**Types:**',
          '• `playing` / `joue` – Joue à {nom}',
          '• `streaming` / `direct` – En direct (URL Twitch/YouTube requise)',
          '• `listening` / `écoute` – Écoute {nom} (ex: Spotify)',
          '• `watching` / `regarde` – Regarde {nom}',
          '• `competing` / `participe` – Participe à {nom}',
          '• `custom` – Statut personnalisé',
          '',
          '**Exemples:**',
          '`' + prefix + 'customize activity playing Minecraft`',
          '`' + prefix + 'customize activity streaming Ma chaîne https://twitch.tv/user`',
          '`' + prefix + 'customize activity listening Blanka par PNL`',
          '`' + prefix + 'customize activity clear` – Supprimer l\'activité',
          '',
          '_Note: Les images et boutons ne sont pas supportés pour les bots Discord._',
        ].join('\n'),
      })],
    });
  }

  if (['clear', 'reset', 'remove', 'aucune'].includes(args[0].toLowerCase()) && args.length === 1) {
    try {
      await message.client.user.setActivity(null);
      const globalData = getGuildData('global');
      if (globalData.settings) delete globalData.settings.botActivity;
      saveGuildData('global', globalData);
      return message.reply({ embeds: [createEmbed('success', { title: 'Activité supprimée', description: "L'activité du bot a été effacée." })] });
    } catch (e) {
      return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: e.message })] });
    }
  }

  const activityStr = args.join(' ');
  const act = parseActivityString(activityStr);

  if (!act) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Format invalide. Pour le streaming, une URL Twitch ou YouTube est requise.\nEx: `customize activity streaming Ma chaîne https://twitch.tv/moncompte`',
      })],
    });
  }

  try {
    await setBotActivity(message.client, act);

    const globalData = getGuildData('global');
    if (!globalData.settings) globalData.settings = {};
    globalData.settings.botActivity = activityStr;
    saveGuildData('global', globalData);

    const typeLabels = {
      0: 'Joue à', 1: 'En direct', 2: 'Écoute', 3: 'Regarde', 4: 'Custom', 5: 'Participe à',
    };
    const desc = act.state
      ? `${typeLabels[act.type] || 'Activité'} **${act.name}** – ${act.state}`
      : `${typeLabels[act.type] || 'Activité'} **${act.name}**`;

    const successEmbed = createEmbed('success', {
      title: 'Activité modifiée',
      description: desc,
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de modifier l'activité: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function customizeView(message) {
  const guildId = message.guild?.id || 'global';
  const guildData = getGuildData(guildId);
  const settings = guildData.settings || {};
  const member = message.guild?.members?.cache?.get(message.client.user.id);

  const embed = createEmbed('settings', {
    title: 'Configuration du bot',
    description: `Configuration actuelle${message.guild ? ` pour **${message.guild.name}**` : ''}`,
    thumbnail: message.client.user.displayAvatarURL({ dynamic: true }),
    fields: [
      {
        name: '👤 Nom d\'utilisateur',
        value: message.client.user.tag,
        inline: true,
      },
      {
        name: `${E.notes} Surnom`,
        value: member?.nickname || 'Aucun',
        inline: true,
      },
      {
        name: '📄 Bio',
        value: settings.botBio || 'Aucune bio configurée',
        inline: false,
      },
      {
        name: '🔗 Activité',
        value: (() => {
          const act = message.client.user.presence?.activities?.[0];
          const saved = getGuildData('global')?.settings?.botActivity;
          if (act) return `${act.name}${act.state ? ` – ${act.state}` : ''}`;
          return saved || 'Aucune';
        })(),
        inline: true,
      },
      {
        name: '🖼️ Avatar',
        value: settings.botAvatar ? '[Configuré]' : 'Par défaut',
        inline: true,
      },
      {
        name: '🎨 Bannière',
        value: settings.botBanner ? '[Configurée]' : 'Aucune',
        inline: true,
      },
    ],
  });

  if (settings.botBanner) {
    embed.setImage(settings.botBanner);
  }

  message.reply({ embeds: [embed] });
}
