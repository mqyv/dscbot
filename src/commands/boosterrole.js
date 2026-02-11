import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'boosterrole',
    description: 'Gérer les rôles de booster personnalisés',
  },
  execute: async (message, args) => {
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'list':
        await boosterroleList(message);
        break;
      case 'create':
        await boosterroleCreate(message, args.slice(1));
        break;
      case 'color':
        await boosterroleColor(message, args.slice(1));
        break;
      case 'remove':
        await boosterroleRemove(message);
        break;
      case 'random':
        await boosterroleRandom(message);
        break;
      default:
        const embed = createEmbed('boosterrole', {
          title: 'Booster Role',
          description: 'Commandes disponibles :',
          fields: [
            { name: '`,boosterrole list`', value: 'Voir tous les rôles booster', inline: false },
            { name: '`,boosterrole create <nom> <couleur>`', value: 'Créer un rôle booster', inline: false },
            { name: '`,boosterrole color <couleur>`', value: 'Changer la couleur de votre rôle', inline: false },
            { name: '`,boosterrole random`', value: 'Couleur aléatoire pour votre rôle', inline: false },
            { name: '`,boosterrole remove`', value: 'Supprimer votre rôle booster', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
        break;
    }
  },
};

async function boosterroleList(message) {
  const guildData = getGuildData(message.guild.id);
  const boosterRoles = guildData.settings?.boosterRoles || {};

  if (Object.keys(boosterRoles).length === 0) {
    const embed = createEmbed('info', {
      title: 'Rôles Booster',
      description: 'Aucun rôle booster configuré sur ce serveur.',
    });
    return message.reply({ embeds: [embed] });
  }

  const rolesList = Object.entries(boosterRoles)
    .map(([userId, roleId]) => {
      const role = message.guild.roles.cache.get(roleId);
      const user = message.client.users.cache.get(userId);
      return role ? `${role} - ${user?.tag || 'Utilisateur inconnu'}` : null;
    })
    .filter(Boolean)
    .join('\n') || 'Aucun rôle valide';

  const embed = createEmbed('boosterrole', {
    title: '🎨 Rôles Booster',
    description: rolesList,
  });

  message.reply({ embeds: [embed] });
}

async function boosterroleCreate(message, args) {
  if (!message.member.premiumSince) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Vous devez être un booster du serveur pour créer un rôle booster.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un nom pour le rôle.\nExemple: `,boosterrole create Mon Rôle #FF0000`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const roleName = args[0];
  const colorHex = args[1] || 'RANDOM';

  let color = 0;
  if (colorHex !== 'RANDOM') {
    color = parseInt(colorHex.replace('#', ''), 16) || Math.floor(Math.random() * 0xFFFFFF);
  } else {
    color = Math.floor(Math.random() * 0xFFFFFF);
  }

  try {
    const role = await message.guild.roles.create({
      name: roleName,
      color: color,
      reason: `Rôle booster créé par ${message.author.tag}`,
    });

    await message.member.roles.add(role);

    const guildData = getGuildData(message.guild.id);
    if (!guildData.settings) guildData.settings = {};
    if (!guildData.settings.boosterRoles) guildData.settings.boosterRoles = {};
    guildData.settings.boosterRoles[message.author.id] = role.id;
    saveGuildData(message.guild.id, guildData);

    const successEmbed = createEmbed('boosterrole', {
      title: 'Rôle booster créé',
      description: `Le rôle ${role} a été créé et vous a été attribué.`,
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de créer le rôle: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function boosterroleColor(message, args) {
  if (!message.member.premiumSince) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Vous devez être un booster du serveur pour modifier votre rôle booster.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  const roleId = guildData.settings?.boosterRoles?.[message.author.id];

  if (!roleId) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Vous n\'avez pas de rôle booster. Créez-en un avec `,boosterrole create`.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const role = message.guild.roles.cache.get(roleId);
  if (!role) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Votre rôle booster n\'existe plus.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier une couleur.\nExemple: `,boosterrole color #FF0000`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const colorHex = args[0];
  const color = parseInt(colorHex.replace('#', ''), 16);

  if (isNaN(color)) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Couleur invalide. Utilisez un code hexadécimal (ex: #FF0000).',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    await role.setColor(color, `Couleur modifiée par ${message.author.tag}`);

    const successEmbed = createEmbed('boosterrole', {
      title: 'Couleur modifiée',
      description: `La couleur de ${role} a été modifiée.`,
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de modifier la couleur: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function boosterroleRemove(message) {
  if (!message.member.premiumSince) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Vous devez être un booster du serveur pour supprimer votre rôle booster.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  const roleId = guildData.settings?.boosterRoles?.[message.author.id];

  if (!roleId) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Vous n\'avez pas de rôle booster.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const role = message.guild.roles.cache.get(roleId);
  if (role) {
    try {
      await role.delete(`Rôle booster supprimé par ${message.author.tag}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
    }
  }

  delete guildData.settings.boosterRoles[message.author.id];
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('boosterrole', {
    title: 'Rôle booster supprimé',
    description: 'Votre rôle booster a été supprimé.',
  });

  message.reply({ embeds: [successEmbed] });
}

async function boosterroleRandom(message) {
  if (!message.member.premiumSince) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Vous devez être un booster du serveur pour modifier votre rôle booster.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  const roleId = guildData.settings?.boosterRoles?.[message.author.id];

  if (!roleId) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Vous n\'avez pas de rôle booster. Créez-en un avec `,boosterrole create`.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const role = message.guild.roles.cache.get(roleId);
  if (!role) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Votre rôle booster n\'existe plus.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const randomColor = Math.floor(Math.random() * 0xFFFFFF);

  try {
    await role.setColor(randomColor, `Couleur aléatoire par ${message.author.tag}`);

    const successEmbed = createEmbed('boosterrole', {
      title: 'Couleur aléatoire appliquée',
      description: `La couleur de ${role} a été changée en aléatoire: \`#${randomColor.toString(16).padStart(6, '0')}\``,
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de modifier la couleur: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}
