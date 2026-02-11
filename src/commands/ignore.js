import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'ignore',
    description: 'Gérer la liste d\'ignorés',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageGuild')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer le serveur" pour utiliser cette commande.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'user':
        await ignoreUser(message, args.slice(1));
        break;
      case 'channel':
        await ignoreChannel(message, args.slice(1));
        break;
      case 'list':
        await ignoreList(message);
        break;
      default:
        const embed = createEmbed('settings', {
          title: 'Gestion des ignorés',
          description: 'Commandes disponibles :',
          fields: [
            { name: '`,ignore user <@utilisateur>`', value: 'Ajouter/retirer un utilisateur de la liste d\'ignorés', inline: false },
            { name: '`,ignore channel <#salon>`', value: 'Ajouter/retirer un salon de la liste d\'ignorés', inline: false },
            { name: '`,ignore list`', value: 'Voir la liste complète des ignorés', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
    }
  },
};

async function ignoreUser(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un utilisateur.\nExemple: `,ignore user @Utilisateur`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const user = message.mentions.users.first();
  if (!user) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Utilisateur introuvable.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  if (!guildData.ignore) {
    guildData.ignore = { users: [], channels: [] };
  }
  if (!guildData.ignore.users) {
    guildData.ignore.users = [];
  }

  const isIgnored = guildData.ignore.users.includes(user.id);

  if (isIgnored) {
    guildData.ignore.users = guildData.ignore.users.filter(id => id !== user.id);
    saveGuildData(message.guild.id, guildData);
    const successEmbed = createEmbed('success', {
      title: 'Utilisateur retiré de la liste d\'ignorés',
      description: `${user.tag} n'est plus ignoré.`,
    });
    return message.reply({ embeds: [successEmbed] });
  } else {
    guildData.ignore.users.push(user.id);
    saveGuildData(message.guild.id, guildData);
    const successEmbed = createEmbed('success', {
      title: 'Utilisateur ajouté à la liste d\'ignorés',
      description: `${user.tag} est maintenant ignoré.`,
    });
    return message.reply({ embeds: [successEmbed] });
  }
}

async function ignoreChannel(message, args) {
  const channel = message.mentions.channels.first() || message.channel;

  const guildData = getGuildData(message.guild.id);
  if (!guildData.ignore) {
    guildData.ignore = { users: [], channels: [] };
  }
  if (!guildData.ignore.channels) {
    guildData.ignore.channels = [];
  }

  const isIgnored = guildData.ignore.channels.includes(channel.id);

  if (isIgnored) {
    guildData.ignore.channels = guildData.ignore.channels.filter(id => id !== channel.id);
    saveGuildData(message.guild.id, guildData);
    const successEmbed = createEmbed('success', {
      title: 'Salon retiré de la liste d\'ignorés',
      description: `${channel} n'est plus ignoré.`,
    });
    return message.reply({ embeds: [successEmbed] });
  } else {
    guildData.ignore.channels.push(channel.id);
    saveGuildData(message.guild.id, guildData);
    const successEmbed = createEmbed('success', {
      title: 'Salon ajouté à la liste d\'ignorés',
      description: `${channel} est maintenant ignoré.`,
    });
    return message.reply({ embeds: [successEmbed] });
  }
}

async function ignoreList(message) {
  const guildData = getGuildData(message.guild.id);
  const ignore = guildData.ignore || { users: [], channels: [] };

  if (ignore.users.length === 0 && ignore.channels.length === 0) {
    const embed = createEmbed('info', {
      title: 'Liste d\'ignorés',
      description: 'Aucun utilisateur ou salon ignoré.',
    });
    return message.reply({ embeds: [embed] });
  }

  const userList = ignore.users.length > 0
    ? await Promise.all(ignore.users.map(async (id) => {
        try {
          const user = await message.client.users.fetch(id);
          return `${user.tag} (${id})`;
        } catch {
          return `Utilisateur inconnu (${id})`;
        }
      }))
    : ['Aucun'];

  const channelList = ignore.channels.length > 0
    ? ignore.channels.map(id => {
        const channel = message.guild.channels.cache.get(id);
        return channel ? `${channel} (${id})` : `Salon inconnu (${id})`;
      })
    : ['Aucun'];

  const embed = createEmbed('info', {
    title: 'Liste d\'ignorés',
    fields: [
      {
        name: 'Utilisateurs ignorés',
        value: userList.join('\n') || 'Aucun',
        inline: false,
      },
      {
        name: 'Salons ignorés',
        value: channelList.join('\n') || 'Aucun',
        inline: false,
      },
    ],
  });

  message.reply({ embeds: [embed] });
}
