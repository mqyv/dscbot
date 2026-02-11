import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'alias',
    description: 'Gérer les alias de commandes',
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
      case 'add':
        await aliasAdd(message, args.slice(1));
        break;
      case 'remove':
      case 'rm':
        await aliasRemove(message, args.slice(1));
        break;
      case 'list':
        await aliasList(message);
        break;
      default:
        const embed = createEmbed('settings', {
          title: 'Gestion des alias',
          description: 'Commandes disponibles :',
          fields: [
            { name: '`,alias add <alias> <commande>`', value: 'Créer un alias pour une commande', inline: false },
            { name: '`,alias remove <alias>`', value: 'Supprimer un alias', inline: false },
            { name: '`,alias list`', value: 'Voir tous les alias', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
    }
  },
};

async function aliasAdd(message, args) {
  if (args.length < 2) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un alias et une commande.\nExemple: `,alias add b ban`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const alias = args[0].toLowerCase();
  const command = args[1].toLowerCase();

  // Vérifier que la commande existe
  const commandExists = message.client.commands.has(command);
  if (!commandExists) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `La commande "${command}" n'existe pas.`,
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  // Vérifier que l'alias n'est pas déjà une commande
  if (message.client.commands.has(alias)) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `"${alias}" est déjà une commande existante.`,
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  if (!guildData.aliases) {
    guildData.aliases = {};
  }

  if (guildData.aliases[alias]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `L'alias "${alias}" existe déjà.`,
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  guildData.aliases[alias] = command;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Alias créé',
    description: `L'alias \`${alias}\` a été créé pour la commande \`${command}\`.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function aliasRemove(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un alias à supprimer.\nExemple: `,alias remove b`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const alias = args[0].toLowerCase();
  const guildData = getGuildData(message.guild.id);

  if (!guildData.aliases || !guildData.aliases[alias]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `L'alias "${alias}" n'existe pas.`,
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  delete guildData.aliases[alias];
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Alias supprimé',
    description: `L'alias \`${alias}\` a été supprimé.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function aliasList(message) {
  const guildData = getGuildData(message.guild.id);
  const aliases = guildData.aliases || {};

  if (Object.keys(aliases).length === 0) {
    const embed = createEmbed('info', {
      title: 'Alias',
      description: 'Aucun alias configuré sur ce serveur.',
    });
    return message.reply({ embeds: [embed] });
  }

  const aliasList = Object.entries(aliases)
    .map(([alias, command]) => `\`${alias}\` → \`${command}\``)
    .join('\n');

  const embed = createEmbed('info', {
    title: 'Alias configurés',
    description: aliasList,
    fields: [
      {
        name: 'Total',
        value: `${Object.keys(aliases).length}`,
        inline: true,
      },
    ],
  });

  message.reply({ embeds: [embed] });
}
