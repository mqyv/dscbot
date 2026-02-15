import { createEmbed } from '../utils/embeds.js';
import { getWhitelist, addToWhitelist, removeFromWhitelist } from '../utils/database.js';

export default {
  data: {
    name: 'wl',
    description: 'Gérer la whitelist du serveur (chaque serveur a sa propre whitelist)',
  },
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply({
        embeds: [createEmbed('error', { title: 'Erreur', description: 'Cette commande ne peut être utilisée que sur un serveur.' })],
      });
    }

    if (!message.member.permissions.has('ManageGuild')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer le serveur" pour gérer la whitelist.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'add':
        await wlAdd(message, args.slice(1));
        break;
      case 'remove':
      case 'rm':
        await wlRemove(message, args.slice(1));
        break;
      case 'list':
        await wlList(message);
        break;
      case 'view':
        await wlView(message, args.slice(1));
        break;
      default:
        const embed = createEmbed('settings', {
          title: 'Gestion de la whitelist',
          description: `Whitelist du serveur **${message.guild.name}** – Les utilisateurs whitelistés peuvent utiliser les commandes de configuration.`,
          fields: [
            { name: '`,wl add <@utilisateur|id>`', value: 'Ajouter un utilisateur à la whitelist', inline: false },
            { name: '`,wl remove <@utilisateur|id>`', value: 'Retirer un utilisateur de la whitelist', inline: false },
            { name: '`,wl list`', value: 'Voir les utilisateurs whitelistés sur ce serveur', inline: false },
            { name: '`,wl view <@utilisateur|id>`', value: 'Vérifier si un utilisateur est whitelisté', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
    }
  },
};

async function wlAdd(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: '❌ Erreur',
      description: 'Veuillez mentionner un utilisateur ou fournir son ID.\nExemple: `,wl add @Utilisateur` ou `,wl add 123456789012345678`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const userId = message.mentions.users.first()?.id || args[0];

  if (!userId || !/^\d+$/.test(userId)) {
    const errorEmbed = createEmbed('error', {
      title: '❌ Erreur',
      description: 'ID utilisateur invalide.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    const user = await message.client.users.fetch(userId).catch(() => null);

    if (getWhitelist(message.guild.id).includes(userId)) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `L'utilisateur ${user ? user.tag : userId} est déjà dans la whitelist de ce serveur.`,
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    addToWhitelist(message.guild.id, userId);

    const successEmbed = createEmbed('success', {
      title: 'Utilisateur ajouté',
      description: `${user ? `${user.tag} (${user.id})` : userId} a été ajouté à la whitelist de ce serveur.`,
      fields: [
        { name: '👤 Utilisateur', value: user ? `${user} (${user.tag})` : userId, inline: true },
        { name: '🆔 ID', value: userId, inline: true },
      ],
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la whitelist:', error);
    const errorEmbed = createEmbed('error', {
      title: '❌ Erreur',
      description: `Impossible d'ajouter l'utilisateur: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function wlRemove(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: '❌ Erreur',
      description: 'Veuillez mentionner un utilisateur ou fournir son ID.\nExemple: `,wl remove @Utilisateur` ou `,wl remove 123456789012345678`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const userId = message.mentions.users.first()?.id || args[0];

  if (!userId || !/^\d+$/.test(userId)) {
    const errorEmbed = createEmbed('error', {
      title: '❌ Erreur',
      description: 'ID utilisateur invalide.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    const user = await message.client.users.fetch(userId).catch(() => null);

    if (!getWhitelist(message.guild.id).includes(userId)) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `L'utilisateur ${user ? user.tag : userId} n'est pas dans la whitelist de ce serveur.`,
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    removeFromWhitelist(message.guild.id, userId);

    const successEmbed = createEmbed('success', {
      title: 'Utilisateur retiré',
      description: `${user ? `${user.tag} (${user.id})` : userId} a été retiré de la whitelist de ce serveur.`,
      fields: [
        { name: '👤 Utilisateur', value: user ? `${user} (${user.tag})` : userId, inline: true },
        { name: '🆔 ID', value: userId, inline: true },
      ],
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Erreur lors du retrait de la whitelist:', error);
    const errorEmbed = createEmbed('error', {
      title: '❌ Erreur',
      description: `Impossible de retirer l'utilisateur: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function wlList(message) {
  const whitelist = getWhitelist(message.guild.id);

  if (whitelist.length === 0) {
    const embed = createEmbed('info', {
      title: 'Whitelist',
      description: `Aucun utilisateur dans la whitelist de **${message.guild.name}**.`,
    });
    return message.reply({ embeds: [embed] });
  }

  try {
    const users = [];
    for (const userId of whitelist) {
      try {
        const user = await message.client.users.fetch(userId);
        users.push({ id: userId, tag: user.tag, user });
      } catch {
        users.push({ id: userId, tag: 'Utilisateur inconnu', user: null });
      }
    }

    const userList = users.map(u => `• ${u.user ? `${u.user} (${u.tag})` : u.tag} - \`${u.id}\``).join('\n');

    const embed = createEmbed('info', {
      title: `Whitelist - ${message.guild.name}`,
      description: `**${whitelist.length} utilisateur(s) whitelisté(s) sur ce serveur :**\n\n${userList}`,
      fields: [{ name: '📊 Total', value: `${whitelist.length}`, inline: true }],
    });

    message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur lors de l\'affichage de la whitelist:', error);
    const errorEmbed = createEmbed('error', {
      title: '❌ Erreur',
      description: `Impossible d'afficher la whitelist: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function wlView(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: '❌ Erreur',
      description: 'Veuillez mentionner un utilisateur ou fournir son ID.\nExemple: `,wl view @Utilisateur` ou `,wl view 123456789012345678`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const userId = message.mentions.users.first()?.id || args[0];

  if (!userId || !/^\d+$/.test(userId)) {
    const errorEmbed = createEmbed('error', {
      title: '❌ Erreur',
      description: 'ID utilisateur invalide.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    const user = await message.client.users.fetch(userId).catch(() => null);
    const isInWl = getWhitelist(message.guild.id).includes(userId);

    const embed = createEmbed(isInWl ? 'success' : 'info', {
      title: isInWl ? 'Whitelisté' : 'Non whitelisté',
      description: `${user ? `${user.tag} (${user.id})` : userId} ${isInWl ? 'est' : 'n\'est pas'} dans la whitelist de ce serveur.`,
      fields: [
        { name: '👤 Utilisateur', value: user ? `${user} (${user.tag})` : userId, inline: true },
        { name: '🆔 ID', value: userId, inline: true },
        { name: '📋 Statut', value: isInWl ? '✅ Whitelisté' : '❌ Non whitelisté', inline: true },
      ],
    });

    message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    const errorEmbed = createEmbed('error', {
      title: '❌ Erreur',
      description: `Impossible de vérifier l'utilisateur: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}
