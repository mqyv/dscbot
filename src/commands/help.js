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
      const footerParts = [];
      if (helpInfo?.module) footerParts.push(`Module: ${helpInfo.module}`);
      if (helpInfo?.aliases?.length) footerParts.push(`Aliases: ${helpInfo.aliases.join(', ')}`);

      const embed = createEmbed('info', {
        title: `Aide: ${prefix}${commandName}`,
        description: description,
        footer: footerParts.length ? { text: footerParts.join(' • ') } : undefined,
        timestamp: true,
      });
      if (usage.length > 0) {
        embed.addFields({ name: '📋 Utilisation', value: usage.join('\n'), inline: false });
      }
      if (examples.length > 0) {
        embed.addFields({ name: '💡 Exemples', value: examples.join('\n'), inline: false });
      }
      if (permissions) {
        embed.addFields({ name: '🔐 Permissions', value: permissions, inline: false });
      }

      return message.reply({ embeds: [embed] });
    }

    // Liste des commandes - TOUTES les commandes du bot
    const allCommands = Array.from(client.commands.values()).map(c => c.data.name).sort();
    const DM_CATEGORIES = {
      'Perso': ['remind', 'notes'],
      'IA & Fun': ['ai', '8ball', 'coinflip', 'random', 'dice', 'urban', 'ship', 'choose', 'roast', 'compliment', 'pp'],
      'Utilitaires': ['ping', 'avatar', 'calc', 'afk', 'help', 'botinfo', 'invite'],
    };
    const SERVER_CATEGORIES = {
      'Propriétaire (owner)': ['owner', 'customize', 'wl'],
      'WL serveur (modération, config)': ['prefix', 'settings', 'alias', 'ignore', 'autorole', 'filter', 'logs', 'kick', 'ban', 'unban', 'timeout', 'warn', 'clear', 'hide', 'unhide', 'lock', 'unlock', 'hideall', 'pin', 'unpin', 'addrole', 'delrole'],
      'Messages': ['welcome', 'goodbye', 'sticky', 'autoresponder', 'imageonly'],
      'Booster': ['boosterrole', 'boost'],
      'Informations': ['help', 'info', 'userinfo', 'profile', 'serverinfo', 'botinfo', 'channelinfo', 'roleinfo', 'invite', 'snipe', 'firstmessage', 'membercount', 'uptime'],
      'Utilitaires': ['avatar', 'emoji', 'ping', 'say', 'poll', 'calc', 'random', 'dice', 'urban', 'embed', 'webhook', 'afk', 'remind', 'notes', 'backup', 'giveaway', 'extractemojis', 'ticket', 'joincreate', 'renew', 'roleall', 'nuke', 'antiraid'],
      'Fun': ['8ball', 'coinflip', 'quote', 'suggest', 'ship', 'choose', 'roast', 'compliment', 'pp'],
      'Vouch': ['vouch'],
    };

    const categories = isDM ? DM_CATEGORIES : SERVER_CATEGORIES;
    const usedNames = new Set();
    const fields = [];

    for (const [category, commandNames] of Object.entries(categories)) {
      const found = commandNames
        .filter(name => client.commands.has(name))
        .map(name => {
          usedNames.add(name);
          return `\`${prefix}${name}\``;
        })
        .join(', ');
      if (found) {
        fields.push({ name: category, value: found, inline: false });
      }
    }

    // Commandes non catégorisées (au cas où)
    const uncategorized = allCommands.filter(name => !usedNames.has(name));
    if (uncategorized.length > 0) {
      fields.push({
        name: 'Autres',
        value: uncategorized.map(n => `\`${prefix}${n}\``).join(', '),
        inline: false,
      });
    }

    const embed = createEmbed('info', {
      title: isDM ? '🤖 Commandes MP (bot perso)' : 'Commandes disponibles',
      description: `Utilisez \`${prefix}help <commande>\` pour plus d'informations.\nExemple: \`${prefix}help ${isDM ? 'remind' : 'ban'}\``,
      fields,
      footer: { text: isDM ? 'Utilisable en messages privés' : `${allCommands.length} commandes au total` },
    });

    message.reply({ embeds: [embed] });
  },
};

