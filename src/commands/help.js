import { createEmbed } from '../utils/embeds.js';
import { commandHelp } from '../utils/commandHelp.js';
import { getPrefix } from '../utils/database.js';

export default {
  data: {
    name: 'help',
    description: 'Affiche l\'aide et les commandes disponibles',
  },
  execute: async (message, args, client) => {
    const isDM = !message.guild;
    const prefix = getPrefix(message.guild?.id, message.author.id);
    
    if (message.guild) {
      try {
        const { sendLog } = await import('../utils/logs.js');
        await sendLog(message.guild, 'message', {
          author: message.author,
          channel: message.channel,
          content: `Help command used: ${args[0] || 'list'}`,
        }).catch(() => {});
      } catch (error) {}
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
      const hasStyledFormat = helpInfo?.syntax !== undefined;

      let embed;
      if (hasStyledFormat) {
        // Style "vile" : pas de barre colorée à gauche, texte coloré via syntax highlighting
        const syntaxLine = helpInfo.syntax ? `${prefix}${commandName} ${helpInfo.syntax}`.trim() : `${prefix}${commandName}`;
        const exampleLine = helpInfo.example ? `${prefix}${commandName} ${helpInfo.example}` : `${prefix}${commandName}`;
        // ini: [labels] en bleu, texte coloré dans le bloc
        const codeBlock = `\`\`\`ini\n[Syntax] ${syntaxLine}\n[Example] ${exampleLine}\n\`\`\``;
        const footerParts = [`Module: ${helpInfo.module || 'Général'}`];
        if (helpInfo.aliases?.length) {
          footerParts.push(`Aliases: ${helpInfo.aliases.join(', ')}`);
        }
        const fields = [];
        if (helpInfo.arguments && helpInfo.arguments !== 'aucun') {
          fields.push({ name: '**Arguments**', value: helpInfo.arguments, inline: true });
        }
        if (permissions) {
          fields.push({ name: '**Permissions**', value: permissions, inline: true });
        }
        fields.push({ name: '\u200b', value: codeBlock, inline: false });
        // 0x2F3136 = fond Discord dark theme, barre "invisible" à gauche
        embed = createEmbed('info', {
          title: `Command: ${commandName}`,
          description: description,
          fields,
          footer: { text: footerParts.join(' • ') },
          timestamp: true,
          color: 0x2F3136,
        });
      } else {
        // Format classique
        embed = createEmbed('info', {
          title: `Aide: ${prefix}${commandName}`,
          description: description,
        });
        if (usage.length > 0) {
          embed.addFields({ name: 'Utilisation', value: usage.join('\n'), inline: false });
        }
        if (examples.length > 0) {
          embed.addFields({ name: 'Exemples', value: examples.join('\n'), inline: false });
        }
        if (permissions) {
          embed.addFields({ name: 'Permissions requises', value: permissions, inline: false });
        }
      }

      return message.reply({ embeds: [embed] });
    }

    // Liste des commandes (DM = seulement commandes perso)
    const commands = Array.from(client.commands.values());
    const DM_CATEGORIES = {
      'Perso': ['remind', 'notes'],
      'IA & Fun': ['ai', '8ball', 'coinflip', 'random'],
      'Utilitaires': ['ping', 'avatar', 'calc', 'afk'],
    };
    const categories = isDM ? DM_CATEGORIES : {
      'Configuration': ['prefix', 'settings', 'customize', 'alias', 'ignore'],
      'Booster Role': ['boosterrole', 'boost'],
      'Messages': ['welcome', 'goodbye', 'sticky', 'autoresponder', 'imageonly'],
      'Filtres': ['filter'],
      'Informations': ['help', 'info', 'userinfo', 'profile', 'serverinfo', 'botinfo', 'channelinfo', 'roleinfo', 'invite', 'snipe', 'firstmessage', 'membercount'],
      'Modération': ['kick', 'ban', 'unban', 'timeout', 'warn', 'clear', 'roleall', 'hide', 'unhide', 'lock', 'unlock', 'hideall', 'pin', 'unpin', 'nuke', 'slowmode', 'voicemove'],
      'Utilitaires': ['avatar', 'emoji', 'emojis', 'steal', 'extractemojis', 'ping', 'say', 'poll', 'uptime', 'calc', 'random', 'renew', 'webhook', 'afk', 'backup', 'remind', 'notes'],
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
      title: isDM ? '🤖 Commandes MP (bot perso)' : 'Commandes disponibles',
      description: `Utilisez \`${prefix}help <commande>\` pour plus d'informations.\nExemple: \`${prefix}help ${isDM ? 'remind' : 'ban'}\``,
      fields: fields,
      footer: { text: isDM ? 'Utilisable en messages privés' : `${commands.length} commandes disponibles` },
    });

    message.reply({ embeds: [embed] });
  },
};

