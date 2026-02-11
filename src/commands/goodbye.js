import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'goodbye',
    description: 'Gérer les messages d\'au revoir',
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
        await goodbyeAdd(message, args.slice(1));
        break;
      case 'remove':
        await goodbyeRemove(message, args.slice(1));
        break;
      case 'view':
        await goodbyeView(message, args.slice(1));
        break;
      case 'list':
        await goodbyeList(message);
        break;
      case 'variables':
        await goodbyeVariables(message);
        break;
      default:
        const embed = createEmbed('settings', {
          title: 'Messages d\'au revoir',
          description: 'Commandes disponibles :',
          fields: [
            { name: '`,goodbye add <channel> <message>`', value: 'Ajouter un message d\'au revoir', inline: false },
            { name: '`,goodbye remove <channel>`', value: 'Retirer un message d\'au revoir', inline: false },
            { name: '`,goodbye view <channel>`', value: 'Voir le message d\'au revoir', inline: false },
            { name: '`,goodbye list`', value: 'Voir tous les messages d\'au revoir', inline: false },
            { name: '`,goodbye variables`', value: 'Voir les variables disponibles', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
        break;
    }
  },
};

async function goodbyeAdd(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un canal.\nExemple: `,goodbye add #au-revoir Au revoir {user} !`',
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

  const goodbyeMessage = args.slice(1).join(' ') || 'Au revoir {user} !';

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  if (!guildData.settings.goodbye) guildData.settings.goodbye = {};
  guildData.settings.goodbye[channel.id] = goodbyeMessage;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Message d\'au revoir ajouté',
    description: `Le message d'au revoir a été configuré pour ${channel}`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function goodbyeRemove(message, args) {
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
  if (guildData.settings?.goodbye?.[channel.id]) {
    delete guildData.settings.goodbye[channel.id];
    saveGuildData(message.guild.id, guildData);

    const successEmbed = createEmbed('success', {
      title: 'Message d\'au revoir retiré',
      description: `Le message d'au revoir a été retiré de ${channel}`,
    });
    message.reply({ embeds: [successEmbed] });
  } else {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Aucun message d\'au revoir configuré pour ce canal.',
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function goodbyeView(message, args) {
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
  const goodbyeMessage = guildData.settings?.goodbye?.[channel.id];

  if (!goodbyeMessage) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Aucun message d\'au revoir configuré pour ce canal.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const embed = createEmbed('settings', {
    title: `Message d'au revoir - ${channel.name}`,
    description: goodbyeMessage,
  });

  message.reply({ embeds: [embed] });
}

async function goodbyeList(message) {
  const guildData = getGuildData(message.guild.id);
  const goodbyeMessages = guildData.settings?.goodbye || {};

  if (Object.keys(goodbyeMessages).length === 0) {
    const embed = createEmbed('info', {
      title: 'Messages d\'au revoir',
      description: 'Aucun message d\'au revoir configuré.',
    });
    return message.reply({ embeds: [embed] });
  }

  const list = Object.entries(goodbyeMessages)
    .map(([channelId, msg]) => {
      const channel = message.guild.channels.cache.get(channelId);
      return channel ? `${channel}: \`${msg.substring(0, 50)}${msg.length > 50 ? '...' : ''}\`` : null;
    })
    .filter(Boolean)
    .join('\n');

  const embed = createEmbed('settings', {
    title: '👋 Messages d\'au revoir',
    description: list,
  });

  message.reply({ embeds: [embed] });
}

async function goodbyeVariables(message) {
  const embed = createEmbed('settings', {
    title: 'Variables disponibles',
    description: 'Variables que vous pouvez utiliser dans les messages d\'au revoir :',
    fields: [
      { name: '{user}', value: 'Mention de l\'utilisateur', inline: true },
      { name: '{username}', value: 'Nom d\'utilisateur', inline: true },
      { name: '{server}', value: 'Nom du serveur', inline: true },
      { name: '{membercount}', value: 'Nombre de membres', inline: true },
    ],
  });

  message.reply({ embeds: [embed] });
}
