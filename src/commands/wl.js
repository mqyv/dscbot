import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData, getWhitelist, addToWhitelist, removeFromWhitelist } from '../utils/database.js';

export default {
  data: {
    name: 'wl',
    description: 'Gérer la whitelist (propriétaire uniquement)',
  },
  execute: async (message, args) => {
    // Vérifier que c'est un propriétaire
    const OWNER_IDS = [
      process.env.OWNER_ID || '1214655422980423731',
      '1405334845420343328',
      '1230641184209109115',
    ].filter(id => id);
    
    if (!OWNER_IDS.includes(message.author.id)) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Cette commande est réservée aux propriétaires du bot.',
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
          description: 'Commandes disponibles (propriétaire uniquement) :',
          fields: [
            { name: '`,wl add <@utilisateur|id>`', value: 'Ajouter un utilisateur à la whitelist', inline: false },
            { name: '`,wl remove <@utilisateur|id>`', value: 'Retirer un utilisateur de la whitelist', inline: false },
            { name: '`,wl list`', value: 'Voir tous les utilisateurs whitelistés', inline: false },
            { name: '`,wl view <@utilisateur|id>`', value: 'Vérifier si un utilisateur est whitelisté', inline: false },
            { name: '\u200b', value: '**Note:** Les utilisateurs whitelistés peuvent utiliser les commandes de modération sur leurs serveurs.', inline: false },
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
    
    if (getWhitelist().includes(userId)) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `L'utilisateur ${user ? user.tag : userId} est déjà dans la whitelist.`,
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    addToWhitelist(userId);

    const successEmbed = createEmbed('success', {
      title: 'Utilisateur ajouté',
      description: `${user ? `${user.tag} (${user.id})` : userId} a été ajouté à la whitelist.`,
      fields: [
        {
          name: '👤 Utilisateur',
          value: user ? `${user} (${user.tag})` : userId,
          inline: true,
        },
        {
          name: '🆔 ID',
          value: userId,
          inline: true,
        },
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
    
    if (!getWhitelist().includes(userId)) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `L'utilisateur ${user ? user.tag : userId} n'est pas dans la whitelist.`,
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    removeFromWhitelist(userId);

    const successEmbed = createEmbed('success', {
      title: 'Utilisateur retiré',
      description: `${user ? `${user.tag} (${user.id})` : userId} a été retiré de la whitelist.`,
      fields: [
        {
          name: '👤 Utilisateur',
          value: user ? `${user} (${user.tag})` : userId,
          inline: true,
        },
        {
          name: '🆔 ID',
          value: userId,
          inline: true,
        },
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
  const whitelist = getWhitelist();

  if (whitelist.length === 0) {
    const embed = createEmbed('info', {
      title: 'Whitelist',
      description: 'Aucun utilisateur dans la whitelist.',
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
      title: 'Whitelist',
      description: `**${whitelist.length} utilisateur(s) whitelisté(s):**\n\n${userList}`,
      fields: [
        {
          name: '📊 Total',
          value: `${whitelist.length}`,
          inline: true,
        },
      ],
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
    const isWhitelisted = getWhitelist().includes(userId);

    const embed = createEmbed(isWhitelisted ? 'success' : 'info', {
        title: isWhitelisted ? 'Whitelisté' : 'Non whitelisté',
      description: `${user ? `${user.tag} (${user.id})` : userId} ${isWhitelisted ? 'est' : 'n\'est pas'} dans la whitelist.`,
      fields: [
        {
          name: '👤 Utilisateur',
          value: user ? `${user} (${user.tag})` : userId,
          inline: true,
        },
        {
          name: '🆔 ID',
          value: userId,
          inline: true,
        },
        {
          name: '📋 Statut',
          value: isWhitelisted ? '✅ Whitelisté' : '❌ Non whitelisté',
          inline: true,
        },
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
