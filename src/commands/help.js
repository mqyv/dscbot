import { createEmbed } from '../utils/embeds.js';
import { commandHelp } from '../utils/commandHelp.js';
import { getPrefix } from '../utils/database.js';

export default {
  data: {
    name: 'help',
    description: 'Affiche l\'aide et les commandes disponibles',
  },
  execute: async (message, args, client) => {
    // Obtenir le préfixe
    const prefix = getPrefix(message.guild.id, message.author.id);
    
    // Log de l'utilisation de la commande help
    try {
      const { sendLog } = await import('../utils/logs.js');
      await sendLog(message.guild, 'message', {
        author: message.author,
        channel: message.channel,
        content: `Help command used: ${args[0] || 'list'}`,
      }).catch(() => {});
    } catch (error) {
      // Ignorer les erreurs de log
    }

    if (args[0]) {
      // Aide détaillée pour une commande spécifique
      const commandName = args[0].toLowerCase();
      const command = client.commands.get(commandName);
      const helpInfo = commandHelp[commandName];

      if (!command && !helpInfo) {
        const errorEmbed = createEmbed('error', {
          title: 'Commande non trouvée',
          description: `La commande "${args[0]}" n'existe pas.\nUtilisez \`${prefix}help\` pour voir toutes les commandes disponibles.`,
        });
        return message.reply({ embeds: [errorEmbed] });
      }
      const description = helpInfo?.description || command?.data?.description || 'Aucune description disponible.';
      const usage = helpInfo?.usage || [];
      const examples = helpInfo?.examples || [];
      const permissions = helpInfo?.permissions;

      const embed = createEmbed('info', {
        title: `Aide: ${prefix}${commandName}`,
        description: description,
      });

      if (usage.length > 0) {
        embed.addFields({
          name: 'Utilisation',
          value: usage.join('\n'),
          inline: false,
        });
      }

      if (examples.length > 0) {
        embed.addFields({
          name: 'Exemples',
          value: examples.join('\n'),
          inline: false,
        });
      }

      if (permissions) {
        embed.addFields({
          name: 'Permissions requises',
          value: permissions,
          inline: false,
        });
      }

      return message.reply({ embeds: [embed] });
    }

    // Liste de toutes les commandes
    const commands = Array.from(client.commands.values());
    const categories = {
      'Configuration': ['prefix', 'settings', 'customize', 'alias', 'ignore'],
      'Booster Role': ['boosterrole', 'boost'],
      'Messages': ['welcome', 'goodbye', 'sticky', 'autoresponder', 'imageonly'],
      'Filtres': ['filter'],
      'Informations': ['help', 'info', 'userinfo', 'profile', 'prevname', 'serverinfo', 'botinfo', 'channelinfo', 'roleinfo', 'invite', 'snipe', 'firstmessage'],
      'Modération': ['kick', 'ban', 'unban', 'timeout', 'warn', 'clear', 'roleall', 'hide', 'unhide', 'lock', 'unlock', 'hideall', 'pin', 'unpin'],
      'Utilitaires': ['avatar', 'emoji', 'emojis', 'steal', 'extractemojis', 'ping', 'say', 'poll', 'uptime', 'calc', 'random', 'renew', 'webhook'],
      'Logs': ['logs'],
      'Fun': ['8ball', 'coinflip', 'quote', 'suggest'],
    };

    const fields = [];
    for (const [category, commandNames] of Object.entries(categories)) {
      const categoryCommands = commands
        .filter(cmd => commandNames.includes(cmd.data.name))
        .map(cmd => `\`${prefix}${cmd.data.name}\``)
        .join(', ');
      
      if (categoryCommands) {
        fields.push({
          name: category,
          value: categoryCommands,
          inline: false,
        });
      }
    }

    const embed = createEmbed('info', {
      title: 'Commandes disponibles',
      description: `Utilisez \`${prefix}help <commande>\` pour plus d'informations sur une commande spécifique.\nExemple: \`${prefix}help ban\` ou \`${prefix}help prefix\``,
      fields: fields,
      footer: { text: `Total: ${commands.length} commandes disponibles` },
    });

    message.reply({ embeds: [embed] });
  },
};

