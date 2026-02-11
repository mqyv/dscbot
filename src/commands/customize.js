import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'customize',
    description: 'Personnaliser le profil du bot sur le serveur',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageGuild')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer le serveur".',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
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
        const embed = createEmbed('settings', {
          title: 'Personnalisation du bot',
          description: 'Commandes disponibles :',
          fields: [
            { name: '`,customize username <nom>`', value: 'Modifier le nom d\'utilisateur du bot', inline: false },
            { name: '`,customize bio <texte>`', value: 'Modifier la bio du bot', inline: false },
            { name: '`,customize avatar <url>`', value: 'Modifier l\'avatar du bot', inline: false },
            { name: '`,customize banner <url>`', value: 'Modifier la bannière du bot', inline: false },
            { name: '`,customize nickname <nom>`', value: 'Modifier le surnom du bot sur le serveur', inline: false },
            { name: '`,customize activity <texte>`', value: 'Modifier l\'activité (lien affiché)', inline: false },
            { name: '`,customize view`', value: 'Voir la configuration actuelle', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
        break;
    }
  },
};

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

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  guildData.settings.botBanner = bannerUrl;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Bannière configurée',
    description: `La bannière du bot a été configurée.\n**Note:** La bannière est stockée localement pour ce serveur.`,
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
      title: '❌ Permission refusée',
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
  if (!message.member.permissions.has('ManageGuild')) {
    const errorEmbed = createEmbed('error', {
      title: '❌ Permission refusée',
      description: 'Vous devez avoir la permission "Gérer le serveur".',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier une activité.\nExemple: `,customize activity https://monsite.com`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const activity = args.join(' ');

  try {
    await message.client.user.setActivity(activity, { type: 4 }); // WATCHING

    const guildData = getGuildData(message.guild.id);
    if (!guildData.settings) guildData.settings = {};
    guildData.settings.botActivity = activity;
    saveGuildData(message.guild.id, guildData);

    const successEmbed = createEmbed('success', {
      title: 'Activité modifiée',
      description: `L'activité du bot a été modifiée sur : \`${activity}\``,
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
  const guildData = getGuildData(message.guild.id);
  const settings = guildData.settings || {};
  const member = message.guild.members.cache.get(message.client.user.id);

  const embed = createEmbed('settings', {
    title: 'Configuration du bot',
    description: `Configuration actuelle pour **${message.guild.name}**`,
    thumbnail: message.client.user.displayAvatarURL({ dynamic: true }),
    fields: [
      {
        name: '👤 Nom d\'utilisateur',
        value: message.client.user.tag,
        inline: true,
      },
      {
        name: '📝 Surnom',
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
        value: message.client.user.presence?.activities[0]?.name || settings.botActivity || 'Aucune',
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
