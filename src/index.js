import { Client, GatewayIntentBits, Collection, Events, VoiceState } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createEmbed } from './utils/embeds.js';
import { getPrefix, isWhitelisted, getGuildData, saveGuildData, addPreviousName, getUserData, saveUserData } from './utils/database.js';

config();

// IDs des propriétaires du bot
const OWNER_IDS = [
  process.env.OWNER_ID || '1214655422980423731', // Propriétaire principal
  '1405334845420343328', // Owner supplémentaire
  '1230641184209109115', // Owner supplémentaire
].filter(id => id); // Filtrer les IDs vides

// Commandes réservées au propriétaire uniquement (modification du bot)
const OWNER_ONLY_COMMANDS = [
  'customize', 'settings', 'prefix', 'filter', 'welcome', 'goodbye', 
  'logs', 'boosterrole', 'invite', 'steal', 'extractemojis', 'emoji', 'wl'
];

// Commandes de modération accessibles aux whitelistés sur leurs serveurs
const MODERATION_COMMANDS = [
  'ban', 'kick', 'timeout', 'warn', 'unban', 'clear', 'say', 
  'renew', 'roleall', 'hide', 'unhide', 'lock', 'unlock', 'hideall',
  'alias', 'sticky', 'autoresponder', 'imageonly', 'pin', 'unpin', 'webhook', 'ignore',
  'autorole', 'ticket'
];

// Commandes utilisables en MP (bot perso)
const DM_COMMANDS = [
  'ai', 'ping', '8ball', 'coinflip', 'random', 'dice', 'urban', 'help', 'avatar', 'calc', 'afk',
  'remind', 'notes', 'botinfo', 'invite'
];

// Fonction pour vérifier si l'utilisateur est un propriétaire
function isOwner(userId) {
  return OWNER_IDS.includes(userId);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// Charger les commandes
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  if (command.default && 'data' in command.default && 'execute' in command.default) {
    client.commands.set(command.default.data.name, command.default);
  }
}

// Événement : Bot prêt
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}!`);
  console.log(`📊 Le bot est sur ${client.guilds.cache.size} serveur(s)`);
  client.guilds.cache.forEach(guild => {
    console.log(`   - ${guild.name} (${guild.id})`);
  });
  const { restoreBotActivity } = await import('./commands/customize.js');
  await restoreBotActivity(client);
});

// Construire args et message-like depuis une interaction (pour les commandes prefix)
function buildContextFromInteraction(interaction) {
  const users = new Map();
  const members = new Map();
  const args = [];
  let hasUserOpt = false;

  for (const opt of interaction.options.data || []) {
    if (opt.user) {
      hasUserOpt = true;
      users.set(opt.user.id, opt.user);
      if (opt.member) members.set(opt.member.id, opt.member);
    }
    if (opt.value !== undefined && opt.value !== null && opt.type !== 6) {
      args.push(String(opt.value));
    }
  }
  if (hasUserOpt) {
    args.unshift('');
  }

  const usersCol = new Collection(users);
  const membersCol = new Collection(members);

  const messageLike = {
    reply: async (content) => {
      await interaction.reply(content);
      return { edit: (c) => interaction.editReply(c) };
    },
    channel: interaction.channel,
    author: interaction.user,
    guild: interaction.guild,
    member: interaction.member,
    client: interaction.client,
    interaction,
    mentions: {
      users: usersCol,
      members: membersCol,
    },
  };

  return { messageLike, args };
}

// Événement : Gestion des interactions (slash commands + boutons)
client.on(Events.InteractionCreate, async interaction => {
  // Gestion des boutons (tickets)
  if (interaction.isButton()) {
    if (interaction.customId === 'ticket_create') {
      try {
        const { getGuildData } = await import('./utils/database.js');
        const { createEmbed } = await import('./utils/embeds.js');
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = await import('discord.js');

        const guildData = getGuildData(interaction.guild.id);
        const ticketConfig = guildData.settings?.ticket;
        if (!ticketConfig?.categoryId) {
          return interaction.reply({
            content: 'Le système de tickets n\'est pas configuré sur ce serveur.',
            ephemeral: true,
          });
        }

        const category = interaction.guild.channels.cache.get(ticketConfig.categoryId);
        if (!category) {
          return interaction.reply({
            content: 'La catégorie des tickets n\'existe plus. Contactez un administrateur.',
            ephemeral: true,
          });
        }

        // Vérifier si l'utilisateur a déjà un ticket ouvert
        const existingTicket = category.children.cache.find(
          ch => ch.name.startsWith('ticket-') && ch.permissionOverwrites.cache.has(interaction.user.id)
        );
        if (existingTicket) {
          return interaction.reply({
            content: `Vous avez déjà un ticket ouvert : ${existingTicket}`,
            ephemeral: true,
          });
        }

        const ticketNumber = (category.children.cache.size + 1).toString().padStart(4, '0');
        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${ticketNumber}`,
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          ],
        });

        const supportMention = ticketConfig.supportRoleId
          ? `<@&${ticketConfig.supportRoleId}>`
          : 'Le staff';

        const embed = createEmbed('info', {
          title: `🎫 Ticket #${ticketNumber}`,
          description: `Bienvenue ${interaction.user} !\n\nDécrivez votre demande et ${supportMention} vous répondra dès que possible.\n\nUtilisez \`,ticket close\` pour fermer ce ticket (staff uniquement).`,
          footer: { text: `Ouvert par ${interaction.user.tag}` },
          timestamp: true,
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_close_btn')
            .setLabel('Fermer le ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
          content: `${interaction.user} ${supportMention}`,
          embeds: [embed],
          components: [row],
        });

        await interaction.reply({
          content: `Votre ticket a été créé : ${ticketChannel}`,
          ephemeral: true,
        });
      } catch (error) {
        console.error('Erreur création ticket:', error);
        const errMsg = { content: 'Une erreur est survenue lors de la création du ticket.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errMsg).catch(() => {});
        } else {
          await interaction.reply(errMsg).catch(() => {});
        }
      }
    } else if (interaction.customId === 'ticket_close_btn') {
      try {
        const { getGuildData } = await import('./utils/database.js');
        const { createEmbed } = await import('./utils/embeds.js');

        const guildData = getGuildData(interaction.guild.id);
        const ticketConfig = guildData.settings?.ticket;
        if (!ticketConfig?.categoryId) return;

        const category = interaction.guild.channels.cache.get(ticketConfig.categoryId);
        if (!category || interaction.channel.parentId !== category.id) {
          return interaction.reply({
            content: 'Ce bouton ne peut être utilisé que dans un ticket.',
            ephemeral: true,
          });
        }

        const isStaff = interaction.member.permissions.has('ManageChannels') ||
          (ticketConfig.supportRoleId && interaction.member.roles.cache.has(ticketConfig.supportRoleId));

        if (!isStaff) {
          return interaction.reply({
            content: 'Seuls les membres du staff peuvent fermer les tickets.',
            ephemeral: true,
          });
        }

        const embed = createEmbed('warning', {
          title: 'Ticket fermé',
          description: `Ce ticket a été fermé par ${interaction.user}.\nLe canal sera supprimé dans 5 secondes.`,
          timestamp: true,
        });

        await interaction.reply({ embeds: [embed] });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      } catch (error) {
        console.error('Erreur fermeture ticket:', error);
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;
  const command = client.commands.get(commandName);

  if (!command) {
    console.error(`Commande slash inconnue: ${commandName}`);
    return;
  }

  // Vérifier les permissions (comme pour les commandes préfixe)
  if (OWNER_ONLY_COMMANDS.includes(commandName)) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        content: 'Cette commande est réservée au propriétaire du bot.',
        ephemeral: true,
      });
    }
  } else if (MODERATION_COMMANDS.includes(commandName)) {
    if (!isOwner(interaction.user.id) && !isWhitelisted(interaction.user.id)) {
      return interaction.reply({
        content: 'Cette commande est réservée au propriétaire du bot ou aux utilisateurs whitelistés.',
        ephemeral: true,
      });
    }
  }

  try {
    // La commande ai a sa propre logique (interaction)
    if (commandName === 'ai') {
      await command.execute(interaction);
    } else {
      const { messageLike, args } = buildContextFromInteraction(interaction);
      await command.execute(messageLike, args, client);
    }
  } catch (error) {
    console.error(`Erreur lors de l'exécution de /${commandName}:`, error);
    const errorMessage = {
      content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage).catch(() => {});
    } else {
      await interaction.reply(errorMessage).catch(() => {});
    }
  }
});

// Événement : Bot rejoint un serveur
client.on(Events.GuildCreate, guild => {
  console.log(`\n🎉 BOT AJOUTÉ À UN SERVEUR !`);
  console.log(`   Serveur: ${guild.name} (${guild.id})`);
  console.log(`   Membres: ${guild.memberCount}`);
  console.log(`   Propriétaire: ${guild.ownerId}\n`);
});

// Événement : Changement de pseudo
client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  if (oldMember.user.username !== newMember.user.username) {
    addPreviousName(newMember.user.id, oldMember.user.username);
    console.log(`Pseudo changé: ${oldMember.user.username} -> ${newMember.user.username}`);
  }
});

// Événement : Utilisateur rejoint un serveur (enregistrer le pseudo actuel)
client.on(Events.GuildMemberAdd, member => {
  addPreviousName(member.user.id, member.user.username);
});

// Événement : Détection AFK
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  // Vérifier si l'auteur était AFK
  const authorData = getUserData(message.author.id);
  if (authorData.afk) {
    delete authorData.afk;
    saveUserData(message.author.id, authorData);
    
    try {
      const reply = await message.reply(`Bienvenue ! Tu n'es plus AFK.`);
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    } catch {}
  }

  // Vérifier si quelqu'un mentionne un utilisateur AFK
  if (message.mentions.users.size > 0) {
    for (const [id, user] of message.mentions.users) {
      if (user.bot) continue;
      
      const userData = getUserData(id);
      if (userData.afk) {
        const duration = Date.now() - userData.afk.timestamp;
        const minutes = Math.floor(duration / 60000);
        const timeStr = minutes > 0 ? `depuis ${minutes}min` : 'à l\'instant';
        
        try {
          const reply = await message.reply(`${user} est AFK: ${userData.afk.reason} (${timeStr})`);
          setTimeout(() => reply.delete().catch(() => {}), 10000);
        } catch {}
      }
    }
  }
});

// Événement : Bot quitte un serveur
client.on(Events.GuildDelete, guild => {
  console.log(`\n⚠️ BOT RETIRÉ D'UN SERVEUR`);
  console.log(`   Serveur: ${guild.name} (${guild.id})\n`);
});

// Événement : Membre rejoint le serveur
client.on(Events.GuildMemberAdd, async member => {
  const { getGuildData } = await import('./utils/database.js');
  const { sendLog } = await import('./utils/logs.js');
  const guildData = getGuildData(member.guild.id);
  
  // Autorole - attribuer le rôle à l'arrivée
  const autoroleId = guildData.settings?.autorole;
  if (autoroleId) {
    const role = member.guild.roles.cache.get(autoroleId);
    if (role) {
      member.roles.add(role).catch(err => console.error('Erreur autorole:', err));
    }
  }

  // Messages de bienvenue
  const welcomeMessages = guildData.settings?.welcome || {};
  for (const [channelId, message] of Object.entries(welcomeMessages)) {
    const channel = member.guild.channels.cache.get(channelId);
    if (channel && channel.isTextBased()) {
      const formattedMessage = message
        .replace(/{user}/g, member.toString())
        .replace(/{username}/g, member.user.username)
        .replace(/{server}/g, member.guild.name)
        .replace(/{membercount}/g, member.guild.memberCount.toString())
        .replace(/{channel}/g, channel.toString());
      
      channel.send(formattedMessage).catch(() => {});
    }
  }

  // Log join
  await sendLog(member.guild, 'join', { member });
});

// Événement : Membre quitte le serveur
client.on(Events.GuildMemberRemove, async member => {
  const { getGuildData } = await import('./utils/database.js');
  const { sendLog } = await import('./utils/logs.js');
  const guildData = getGuildData(member.guild.id);
  
  // Messages d'au revoir
  const goodbyeMessages = guildData.settings?.goodbye || {};
  for (const [channelId, message] of Object.entries(goodbyeMessages)) {
    const channel = member.guild.channels.cache.get(channelId);
    if (channel && channel.isTextBased()) {
      const formattedMessage = message
        .replace(/{user}/g, member.user.tag)
        .replace(/{username}/g, member.user.username)
        .replace(/{server}/g, member.guild.name)
        .replace(/{membercount}/g, member.guild.memberCount.toString());
      
      channel.send(formattedMessage).catch(() => {});
    }
  }

  // Log leave
  await sendLog(member.guild, 'leave', { user: member.user });
});

// Événement : Message supprimé
client.on(Events.MessageDelete, async message => {
  if (!message.guild || message.author?.bot) return;
  
  // Stocker pour la commande snipe
  const { addSnipe } = await import('./utils/snipes.js');
  if (message.channel && message.author) {
    addSnipe(message.channel.id, message);
  }
  
  const { sendLog } = await import('./utils/logs.js');
  await sendLog(message.guild, 'message', {
    author: message.author,
    channel: message.channel,
    content: message.content,
  });
});

// Événement : Membre mis à jour (nickname, roles)
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  const { sendLog } = await import('./utils/logs.js');
  
  // Log nickname
  if (oldMember.nickname !== newMember.nickname) {
    await sendLog(newMember.guild, 'nickname', {
      member: newMember,
      oldNickname: oldMember.nickname,
      newNickname: newMember.nickname,
    });
  }

  // Log roles
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;
  
  const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
  const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

  for (const role of addedRoles.values()) {
    if (role.id !== newMember.guild.id) {
      await sendLog(newMember.guild, 'role', {
        member: newMember,
        role: role,
        action: 'ajouté',
        executor: null,
      });
    }
  }

  for (const role of removedRoles.values()) {
    if (role.id !== newMember.guild.id) {
      await sendLog(newMember.guild, 'role', {
        member: newMember,
        role: role,
        action: 'retiré',
        executor: null,
      });
    }
  }
});

// Événement : Membre rejoint/quitte un canal vocal
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const { sendLog } = await import('./utils/logs.js');
  
  if (oldState.channelId === newState.channelId) return;

  if (!oldState.channel && newState.channel) {
    // Rejoint un canal
    await sendLog(newState.guild, 'voice', {
      member: newState.member,
      channel: newState.channel,
      action: 'Rejoint',
    });
  } else if (oldState.channel && !newState.channel) {
    // Quitte un canal
    await sendLog(oldState.guild, 'voice', {
      member: oldState.member,
      channel: oldState.channel,
      action: 'Quitté',
    });
  } else if (oldState.channelId !== newState.channelId) {
    // Changé de canal
    await sendLog(newState.guild, 'voice', {
      member: newState.member,
      channel: newState.channel,
      action: 'Changé',
    });
  }
});

// Événement : Message reçu
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  // === GESTION DES MPS (bot perso) ===
  if (!message.guild) {
    const prefix = getPrefix(null, message.author.id);
    const isCommand = message.content.startsWith(prefix);
    if (!isCommand) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) {
      const helpEmbed = createEmbed('info', {
        title: '🤖 Bot perso - MP',
        description: `Commande inconnue. Utilise \`${prefix}help\` pour voir les commandes disponibles en MP.`,
      });
      return message.reply({ embeds: [helpEmbed] });
    }
    const allowedInDM = DM_COMMANDS.includes(commandName) || (OWNER_ONLY_COMMANDS.includes(commandName) && isOwner(message.author.id));
    if (!allowedInDM) {
      return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Cette commande n\'est pas disponible en MP.' })] });
    }

    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(`Erreur commande MP ${commandName}:`, error);
      message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Une erreur s\'est produite.' })] }).catch(() => {});
    }
    return;
  }

  // === GESTION DES SERVEURS ===
  // Vérifier les filtres de mots
  const { getGuildData } = await import('./utils/database.js');
  const guildData = getGuildData(message.guild.id);
  const filteredWords = guildData.settings?.filter?.words || [];
  const exemptRoles = guildData.settings?.filter?.exempt || [];
  
  if (filteredWords.length > 0) {
    const memberRoles = message.member.roles.cache.map(r => r.id);
    const isExempt = exemptRoles.some(roleId => memberRoles.includes(roleId));
    
    if (!isExempt && !message.member.permissions.has('ManageMessages')) {
      const messageLower = message.content.toLowerCase();
      const containsFilteredWord = filteredWords.some(word => messageLower.includes(word));
      
      if (containsFilteredWord) {
        await message.delete().catch(() => {});
        const warnEmbed = createEmbed('warning', {
          title: '⚠️ Message supprimé',
          description: `${message.author}, votre message contient un mot filtré.`,
        });
        const warningMsg = await message.channel.send({ embeds: [warnEmbed] });
        setTimeout(() => warningMsg.delete().catch(() => {}), 3000);
        return;
      }
    }
  }

  // Gérer les sticky messages
  const stickyData = guildData.sticky?.[message.channel.id];
  if (stickyData && stickyData.lastMessageId) {
    try {
      const stickyMsg = await message.channel.messages.fetch(stickyData.lastMessageId).catch(() => null);
      if (stickyMsg) {
        await stickyMsg.delete().catch(() => {});
      }
      const stickyEmbed = createEmbed('info', {
        title: 'Message collant',
        description: stickyData.message,
        footer: { text: 'Ce message sera automatiquement republié en bas du salon' },
      });
      const newSticky = await message.channel.send({ embeds: [stickyEmbed] });
      guildData.sticky[message.channel.id].lastMessageId = newSticky.id;
      saveGuildData(message.guild.id, guildData);
    } catch {}
  }

  // Préfixe personnalisable
  const prefix = getPrefix(message.guild.id, message.author.id);
  const isCommand = message.content.startsWith(prefix);
  
  // Gérer les autoresponders (seulement si ce n'est pas une commande)
  if (!isCommand) {
    const autoresponders = guildData.autoresponders || {};
    const messageLower = message.content.toLowerCase();
    for (const [trigger, response] of Object.entries(autoresponders)) {
      if (messageLower.includes(trigger.toLowerCase())) {
        await message.reply(response).catch(() => {});
        break; // Une seule réponse par message
      }
    }
  }

  if (!isCommand) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  let commandName = args.shift().toLowerCase();

  // Vérifier les alias
  if (guildData.aliases && guildData.aliases[commandName]) {
    commandName = guildData.aliases[commandName];
  }

  const command = client.commands.get(commandName);

  if (!command) return;

  // Vérifier les permissions selon le type de commande
  if (OWNER_ONLY_COMMANDS.includes(commandName)) {
    // Commandes réservées au propriétaire uniquement (modification du bot)
    if (!isOwner(message.author.id)) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Cette commande est réservée au propriétaire du bot.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }
  } else if (MODERATION_COMMANDS.includes(commandName)) {
    // Commandes de modération : propriétaire OU whitelisté
    if (!isOwner(message.author.id) && !isWhitelisted(message.author.id)) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Cette commande est réservée au propriétaire du bot ou aux utilisateurs whitelistés.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }
  }

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande ${commandName}:`, error);
    
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Une erreur s\'est produite lors de l\'exécution de cette commande.',
    });

    message.reply({ embeds: [errorEmbed] }).catch(console.error);
  }
});

// Gestion des erreurs
client.on(Events.Error, error => {
  console.error('Erreur Discord.js:', error);
});

process.on('unhandledRejection', error => {
  console.error('Rejection non gérée:', error);
});

// Connexion du bot
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Erreur lors de la connexion:', error);
  process.exit(1);
});

