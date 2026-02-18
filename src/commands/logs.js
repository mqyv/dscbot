import { createEmbed } from '../utils/embeds.js';
import { E } from '../utils/emojis.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'logs',
    description: 'Configurer les logs du serveur',
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
    const logType = args[1]?.toLowerCase();

    if (subcommand === 'set') {
      await logsSet(message, args.slice(1));
    } else if (subcommand === 'remove') {
      await logsRemove(message, args.slice(1));
    } else if (subcommand === 'view') {
      await logsView(message, logType);
    } else if (subcommand === 'list') {
      await logsList(message);
    } else if (subcommand === 'setup') {
      await logsSetup(message, args.slice(1));
    } else {
      const embed = createEmbed('settings', {
        title: 'Système de logs',
        description: 'Commandes disponibles :',
        fields: [
          { name: '`,logs setup <id_catégorie>`', value: 'Configurer automatiquement tous les logs dans une catégorie (par ID)', inline: false },
          { name: '`,logs set <type> <channel>`', value: 'Configurer un canal de log', inline: false },
          { name: '`,logs remove <type>`', value: 'Retirer un canal de log', inline: false },
          { name: '`,logs view [type]`', value: 'Voir la configuration des logs', inline: false },
          { name: '`,logs list`', value: 'Voir tous les logs configurés', inline: false },
          { name: '\u200b', value: '**Types disponibles:**', inline: false },
          { name: 'Types', value: '`join`, `leave`, `mod`, `message`, `nickname`, `role`, `voice`, `server`, `ticket`, `rep`', inline: false },
        ],
      });
      message.reply({ embeds: [embed] });
    }
  },
};

const logTypes = {
  join: 'join-logging',
  leave: 'leave-logging',
  mod: 'mod-logging',
  message: 'msg-logging',
  nickname: 'nickname-logging',
  voice: 'vc-logging',
  server: 'serv-logging',
  rep: 'rep-logging',
  role: 'role-logging',
  ticket: 'ticket-logging',
};

async function logsSet(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un type de log et un canal.\nExemple: `,logs set join #logs`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const logType = args[0].toLowerCase();
  if (!logTypes[logType]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Type de log invalide. Types disponibles: ${Object.keys(logTypes).join(', ')}`,
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

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  if (!guildData.settings.logs) guildData.settings.logs = {};
  guildData.settings.logs[logType] = channel.id;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Log configuré',
    description: `Le log \`${logType}\` a été configuré pour ${channel}`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function logsRemove(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un type de log à retirer.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const logType = args[0].toLowerCase();
  const guildData = getGuildData(message.guild.id);

  if (!guildData.settings?.logs?.[logType]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Ce type de log n\'est pas configuré.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  delete guildData.settings.logs[logType];
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Log retiré',
    description: `Le log \`${logType}\` a été retiré.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function logsView(message, logType) {
  const guildData = getGuildData(message.guild.id);
  const logs = guildData.settings?.logs || {};

  if (logType && logTypes[logType]) {
    const channelId = logs[logType];
    if (!channelId) {
      const embed = createEmbed('info', {
        title: `Log: ${logType}`,
        description: 'Ce log n\'est pas configuré.',
      });
      return message.reply({ embeds: [embed] });
    }

    const channel = message.guild.channels.cache.get(channelId);
    const embed = createEmbed('settings', {
      title: `📋 Log: ${logType}`,
      description: `Canal: ${channel || 'Canal introuvable'}`,
    });
    return message.reply({ embeds: [embed] });
  }

  if (Object.keys(logs).length === 0) {
    const embed = createEmbed('info', {
      title: 'Logs configurés',
      description: 'Aucun log configuré.',
    });
    return message.reply({ embeds: [embed] });
  }

  const logsList = Object.entries(logs)
    .map(([type, channelId]) => {
      const channel = message.guild.channels.cache.get(channelId);
      return `**${type}**: ${channel || 'Canal introuvable'}`;
    })
    .join('\n');

  const embed = createEmbed('settings', {
    title: '📋 Logs configurés',
    description: logsList,
  });

  message.reply({ embeds: [embed] });
}

async function logsList(message) {
  await logsView(message);
}

async function logsSetup(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez fournir l\'ID d\'une catégorie.\nExemple: `,logs setup 123456789012345678`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  // Récupérer la catégorie par ID
  const categoryId = args[0].replace(/[<#>]/g, '');
  let category = message.guild.channels.cache.get(categoryId);
  
  if (!category) {
    // Essayer de fetch si pas en cache
    try {
      category = await message.guild.channels.fetch(categoryId);
    } catch (error) {
      const errorEmbed = createEmbed('error', {
        title: 'Catégorie introuvable',
        description: 'La catégorie spécifiée n\'existe pas sur ce serveur.\nVérifiez que l\'ID est correct.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }
  }
  
  if (category.type !== 4) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Le canal spécifié n\'est pas une catégorie.\nVeuillez fournir l\'ID d\'une catégorie valide.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    const loadingEmbed = createEmbed('info', {
      title: `${E.loading} Configuration des logs...`,
      description: `Création des canaux de logs dans ${category}...`,
    });
    const loadingMessage = await message.reply({ embeds: [loadingEmbed] });

    const guildData = getGuildData(message.guild.id);
    if (!guildData.settings) {
      guildData.settings = {};
    }
    if (!guildData.settings.logs) {
      guildData.settings.logs = {};
    }

    // Types de logs disponibles
    const logTypes = {
      join: 'join-logging',
      leave: 'leave-logging',
      mod: 'mod-logging',
      message: 'msg-logging',
      nickname: 'nickname-logging',
      role: 'role-logging',
      voice: 'vc-logging',
      server: 'serv-logging',
      ticket: 'ticket-logging',
      rep: 'rep-logging',
    };

    const createdChannels = [];
    const existingChannels = [];
    const errors = [];

    // Créer ou trouver les canaux pour chaque type de log
    for (const [logType, channelName] of Object.entries(logTypes)) {
      try {
        // Chercher si le canal existe déjà dans la catégorie
        let channel = message.guild.channels.cache.find(
          c => c.name === channelName && c.parentId === category.id && c.type === 0
        );

        if (!channel) {
          // Créer le canal
          channel = await message.guild.channels.create({
            name: channelName,
            type: 0, // TextChannel
            parent: category.id,
            reason: `Configuration automatique des logs par ${message.author.tag}`,
          });
          createdChannels.push(channel);
        } else {
          existingChannels.push(channel);
        }

        // Configurer le log
        guildData.settings.logs[logType] = channel.id;
      } catch (error) {
        console.error(`Erreur lors de la création du canal ${channelName}:`, error);
        errors.push({ type: logType, name: channelName, error: error.message });
      }
    }

    // Sauvegarder la configuration
    saveGuildData(message.guild.id, guildData);

    // Message de succès
    const fields = [];
    
    if (createdChannels.length > 0) {
      fields.push({
        name: `${E.success} Canaux créés`,
        value: createdChannels.map(c => c.toString()).join('\n'),
        inline: false,
      });
    }

    if (existingChannels.length > 0) {
      fields.push({
        name: `${E.info} Canaux existants réutilisés`,
        value: existingChannels.map(c => c.toString()).join('\n'),
        inline: false,
      });
    }

    if (errors.length > 0) {
      fields.push({
        name: `${E.error} Erreurs`,
        value: errors.map(e => `${e.name}: ${e.error}`).join('\n'),
        inline: false,
      });
    }

    fields.push({
      name: `${E.stats} Statistiques`,
      value: `Total configuré: ${Object.keys(logTypes).length - errors.length}/${Object.keys(logTypes).length}`,
      inline: false,
    });

    const successEmbed = createEmbed('success', {
      title: 'Logs configurés',
      description: `Tous les logs ont été configurés dans ${category} !`,
      fields: fields,
    });

    await loadingMessage.edit({ embeds: [successEmbed] });

  } catch (error) {
    console.error('Erreur lors de la configuration des logs:', error);
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de configurer les logs: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}
