import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'welcome',
    description: 'Gérer les messages de bienvenue',
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
      case 'add':
        await welcomeAdd(message, args.slice(1));
        break;
      case 'remove':
        await welcomeRemove(message, args.slice(1));
        break;
      case 'view':
        await welcomeView(message, args.slice(1));
        break;
      case 'list':
        await welcomeList(message);
        break;
      case 'variables':
        await welcomeVariables(message);
        break;
      default:
        const embed = createEmbed('settings', {
          title: 'Messages de bienvenue',
          description: 'Commandes disponibles :',
          fields: [
            { name: '`,welcome add <channel> <message>`', value: 'Ajouter un message de bienvenue', inline: false },
            { name: '`,welcome remove <channel>`', value: 'Retirer un message de bienvenue', inline: false },
            { name: '`,welcome view <channel>`', value: 'Voir le message de bienvenue', inline: false },
            { name: '`,welcome list`', value: 'Voir tous les messages de bienvenue', inline: false },
            { name: '`,welcome variables`', value: 'Voir les variables disponibles', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
        break;
    }
  },
};

async function welcomeAdd(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un canal.\nExemple: `,welcome add #bienvenue Bienvenue {user} !`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const channel = message.mentions.channels.first();
  if (!channel) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Canal non trouvé. Mentionnez un canal valide.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const welcomeMessage = args.slice(1).join(' ') || 'Bienvenue {user} sur {server} !';

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  if (!guildData.settings.welcome) guildData.settings.welcome = {};
  guildData.settings.welcome[channel.id] = welcomeMessage;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Message de bienvenue ajouté',
    description: `Le message de bienvenue a été configuré pour ${channel}`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function welcomeRemove(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un canal.\nExemple: `,welcome remove #bienvenue`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const channel = message.mentions.channels.first();
  if (!channel) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Canal non trouvé.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  if (guildData.settings?.welcome?.[channel.id]) {
    delete guildData.settings.welcome[channel.id];
    saveGuildData(message.guild.id, guildData);

    const successEmbed = createEmbed('success', {
      title: 'Message de bienvenue retiré',
      description: `Le message de bienvenue a été retiré de ${channel}`,
    });
    message.reply({ embeds: [successEmbed] });
  } else {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Aucun message de bienvenue configuré pour ce canal.',
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function welcomeView(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un canal.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const channel = message.mentions.channels.first();
  if (!channel) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Canal non trouvé.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  const welcomeMessage = guildData.settings?.welcome?.[channel.id];

  if (!welcomeMessage) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Aucun message de bienvenue configuré pour ce canal.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const embed = createEmbed('settings', {
    title: `Message de bienvenue - ${channel.name}`,
    description: welcomeMessage,
  });

  message.reply({ embeds: [embed] });
}

async function welcomeList(message) {
  const guildData = getGuildData(message.guild.id);
  const welcomeMessages = guildData.settings?.welcome || {};

  if (Object.keys(welcomeMessages).length === 0) {
    const embed = createEmbed('info', {
      title: 'Messages de bienvenue',
      description: 'Aucun message de bienvenue configuré.',
    });
    return message.reply({ embeds: [embed] });
  }

  const list = Object.entries(welcomeMessages)
    .map(([channelId, msg]) => {
      const channel = message.guild.channels.cache.get(channelId);
      return channel ? `${channel}: \`${msg.substring(0, 50)}${msg.length > 50 ? '...' : ''}\`` : null;
    })
    .filter(Boolean)
    .join('\n');

  const embed = createEmbed('settings', {
    title: '👋 Messages de bienvenue',
    description: list,
  });

  message.reply({ embeds: [embed] });
}

async function welcomeVariables(message) {
  const embed = createEmbed('settings', {
    title: 'Variables disponibles',
    description: 'Variables que vous pouvez utiliser dans les messages de bienvenue :',
    fields: [
      { name: '{user}', value: 'Mention de l\'utilisateur', inline: true },
      { name: '{username}', value: 'Nom d\'utilisateur', inline: true },
      { name: '{server}', value: 'Nom du serveur', inline: true },
      { name: '{membercount}', value: 'Nombre de membres', inline: true },
      { name: '{channel}', value: 'Mention du canal', inline: true },
    ],
  });

  message.reply({ embeds: [embed] });
}
