import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData, getUserData, saveUserData, getPrefix } from '../utils/database.js';

export default {
  data: {
    name: 'prefix',
    description: 'Gérer le préfixe des commandes',
  },
  execute: async (message, args) => {
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'view':
        await prefixView(message);
        break;
      case 'set':
        await prefixSet(message, args.slice(1));
        break;
      case 'remove':
        await prefixRemove(message);
        break;
      case 'self':
        await prefixSelf(message, args.slice(1));
        break;
      default:
        await prefixView(message);
        break;
    }
  },
};

async function prefixView(message) {
  const guildData = getGuildData(message.guild.id);
  const userData = getUserData(message.author.id);
  const currentPrefix = getPrefix(message.guild.id, message.author.id);

  const embed = createEmbed('prefix', {
    title: 'Préfixe des commandes',
    description: `**Préfixe actuel:** \`${currentPrefix}\``,
    fields: [
      {
        name: 'Préfixe du serveur',
        value: `\`${guildData.prefix}\``,
        inline: true,
      },
      {
        name: 'Votre préfixe personnel',
        value: userData.prefix ? `\`${userData.prefix}\`` : 'Aucun (utilise le préfixe du serveur)',
        inline: true,
      },
    ],
  });

  message.reply({ embeds: [embed] });
}

async function prefixSet(message, args) {
  if (!message.member.permissions.has('Administrator')) {
    const errorEmbed = createEmbed('error', {
      title: 'Permission refusée',
      description: 'Vous devez être administrateur pour modifier le préfixe du serveur.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un préfixe.\nExemple: `,prefix set !`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const newPrefix = args[0];
  if (newPrefix.length > 5) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Le préfixe ne peut pas dépasser 5 caractères.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  guildData.prefix = newPrefix;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Préfixe modifié',
    description: `Le préfixe du serveur a été défini sur \`${newPrefix}\``,
  });

  message.reply({ embeds: [successEmbed] });
}

async function prefixRemove(message) {
  if (!message.member.permissions.has('Administrator')) {
    const errorEmbed = createEmbed('error', {
      title: 'Permission refusée',
      description: 'Vous devez être administrateur pour réinitialiser le préfixe du serveur.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  guildData.prefix = ',';
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Préfixe réinitialisé',
    description: 'Le préfixe du serveur a été réinitialisé sur `,`',
  });

  message.reply({ embeds: [successEmbed] });
}

async function prefixSelf(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un préfixe.\nExemple: `,prefix self !`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const newPrefix = args[0];
  if (newPrefix.length > 5) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Le préfixe ne peut pas dépasser 5 caractères.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const userData = getUserData(message.author.id);
  userData.prefix = newPrefix;
  saveUserData(message.author.id, userData);

  const successEmbed = createEmbed('success', {
    title: 'Préfixe personnel défini',
    description: `Votre préfixe personnel a été défini sur \`${newPrefix}\`\nCe préfixe sera utilisé sur tous les serveurs où vous utilisez le bot.`,
  });

  message.reply({ embeds: [successEmbed] });
}
