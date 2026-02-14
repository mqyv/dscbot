import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

const DEFAULT_PANEL_EMBED = {
  title: '🎫 Système de tickets',
  description: 'Cliquez sur un bouton ci-dessous pour ouvrir un ticket.\n\nUn membre de l\'équipe vous répondra dès que possible.',
  footer: 'Ne créez un ticket que si nécessaire',
  color: 0x5865F2,
};

const DEFAULT_TICKET_EMBED = {
  title: '🎫 Ticket #{ticketnumber}',
  description: 'Bienvenue {user} !\n\nDécrivez votre demande et {support} vous répondra dès que possible.\n\nUtilisez `,ticket close` pour fermer ce ticket (staff uniquement).',
  footer: 'Ouvert par {username}',
  color: 0x5865F2,
};

function formatEmbedText(text, vars = {}) {
  if (!text || typeof text !== 'string') return '';
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'gi'), String(value ?? ''));
  }
  return result;
}

function buildEmbedFromConfig(config, vars = {}) {
  const embed = new EmbedBuilder();
  if (config.title) embed.setTitle(formatEmbedText(config.title, vars));
  if (config.description) embed.setDescription(formatEmbedText(config.description, vars));
  if (config.footer) embed.setFooter({ text: formatEmbedText(config.footer, vars) });
  if (config.color) embed.setColor(config.color);
  embed.setTimestamp();
  return embed;
}

export default {
  data: {
    name: 'ticket',
    description: 'Gérer le système de tickets',
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

    switch (subcommand) {
      case 'setup':
        await ticketSetup(message, args.slice(1));
        break;
      case 'addtype':
        await ticketAddType(message, args.slice(1));
        break;
      case 'removetype':
        await ticketRemoveType(message, args.slice(1));
        break;
      case 'embed':
        await ticketEmbed(message, args.slice(1));
        break;
      case 'button':
        await ticketButton(message, args.slice(1));
        break;
      case 'close':
        await ticketClose(message);
        break;
      case 'add':
        await ticketAdd(message, args.slice(1));
        break;
      case 'remove':
        await ticketRemove(message, args.slice(1));
        break;
      case 'config':
        await ticketConfig(message, args.slice(1));
        break;
      default:
        const embed = createEmbed('settings', {
          title: 'Système de tickets',
          description: 'Système de tickets avec types multiples et embeds personnalisables.',
          fields: [
            { name: '`,ticket addtype <id> <catégorie>`', value: 'Ajouter un type de ticket (ex: support, report)', inline: false },
            { name: '`,ticket removetype <id>`', value: 'Supprimer un type de ticket', inline: false },
            { name: '`,ticket setup [type1] [type2]...`', value: 'Créer le panneau (tous les types ou spécifiques)', inline: false },
            { name: '`,ticket embed <type> panel|ticket title|description|footer|color <valeur>`', value: 'Personnaliser l\'embed', inline: false },
            { name: '`,ticket button <type> label|emoji <valeur>`', value: 'Personnaliser le bouton', inline: false },
            { name: '`,ticket config support <type> @rôle`', value: 'Rôle support pour un type', inline: false },
            { name: '`,ticket close` / `add` / `remove`', value: 'Dans un canal ticket', inline: false },
            { name: 'Variables embeds', value: '`{user}` `{username}` `{support}` `{server}` `{ticketnumber}`', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
        break;
    }
  },
};

function ensureTicketTypes(guildData, guildId) {
  const ticket = guildData.settings?.ticket || {};
  if (!ticket.types || Object.keys(ticket.types).length === 0) {
    if (ticket.categoryId) {
      if (!guildData.settings) guildData.settings = {};
      if (!guildData.settings.ticket) guildData.settings.ticket = {};
      guildData.settings.ticket.types = {
        default: {
          categoryId: ticket.categoryId,
          supportRoleId: ticket.supportRoleId,
          panelEmbed: { ...DEFAULT_PANEL_EMBED },
          ticketEmbed: { ...DEFAULT_TICKET_EMBED },
          buttonLabel: 'Ouvrir un ticket',
          buttonEmoji: '🎫',
        },
      };
      if (guildId) saveGuildData(guildId, guildData);
      return guildData.settings.ticket.types;
    }
    return ticket.types || {};
  }
  return ticket.types;
}

function getTicketTypes(guildData) {
  const ticket = guildData.settings?.ticket || {};
  if (ticket.types && Object.keys(ticket.types).length > 0) {
    return ticket.types;
  }
  if (ticket.categoryId) {
    return {
      default: {
        categoryId: ticket.categoryId,
        supportRoleId: ticket.supportRoleId,
        panelEmbed: { ...DEFAULT_PANEL_EMBED },
        ticketEmbed: { ...DEFAULT_TICKET_EMBED },
        buttonLabel: 'Ouvrir un ticket',
        buttonEmoji: '🎫',
      },
    };
  }
  return {};
}

function getCategoryForChannel(guildData, parentId) {
  const types = getTicketTypes(guildData);
  for (const [typeId, config] of Object.entries(types)) {
    if (config.categoryId === parentId) return { typeId, config };
  }
  return null;
}

async function ticketAddType(message, args) {
  if (!args[0] || !args[1]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Usage: `,ticket addtype <id> <catégorie>`\nExemple: `,ticket addtype support #Tickets-Support`\nExemple: `,ticket addtype report #Tickets-Report`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const typeId = args[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!typeId) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'ID invalide. Utilisez lettres, chiffres, _ ou -.' })] });
  }

  const category = message.mentions.channels.first() || message.guild.channels.cache.get(args[1].replace(/[<#>]/g, ''));
  if (!category || category.type !== ChannelType.GuildCategory) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Mentionnez une catégorie valide.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  if (!guildData.settings.ticket) guildData.settings.ticket = {};
  if (!guildData.settings.ticket.types) {
    guildData.settings.ticket.types = {};
    if (guildData.settings.ticket.categoryId) {
      guildData.settings.ticket.types.default = {
        categoryId: guildData.settings.ticket.categoryId,
        supportRoleId: guildData.settings.ticket.supportRoleId,
        panelEmbed: { ...DEFAULT_PANEL_EMBED },
        ticketEmbed: { ...DEFAULT_TICKET_EMBED },
        buttonLabel: 'Ouvrir un ticket',
        buttonEmoji: '🎫',
      };
    }
  }

  guildData.settings.ticket.types[typeId] = {
    categoryId: category.id,
    supportRoleId: null,
    panelEmbed: { ...DEFAULT_PANEL_EMBED },
    ticketEmbed: { ...DEFAULT_TICKET_EMBED },
    buttonLabel: `Ticket ${typeId}`,
    buttonEmoji: '🎫',
  };
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Type de ticket ajouté',
    description: `Le type \`${typeId}\` a été configuré avec la catégorie ${category}.`,
  });
  message.reply({ embeds: [successEmbed] });
}

async function ticketRemoveType(message, args) {
  if (!args[0]) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Usage: `,ticket removetype <id>`' })] });
  }

  const typeId = args[0].toLowerCase();
  const guildData = getGuildData(message.guild.id);
  const types = getTicketTypes(guildData);

  if (!types[typeId]) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: `Type \`${typeId}\` introuvable.` })] });
  }

  delete guildData.settings.ticket.types[typeId];
  if (Object.keys(guildData.settings.ticket.types).length === 0) {
    guildData.settings.ticket.categoryId = null;
    guildData.settings.ticket.types = null;
  }
  saveGuildData(message.guild.id, guildData);

  message.reply({ embeds: [createEmbed('success', { title: 'Type supprimé', description: `Le type \`${typeId}\` a été supprimé.` })] });
}

async function ticketEmbed(message, args) {
  if (!args[0] || !args[1] || !args[2] || !args[3]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Usage: `,ticket embed <type> panel|ticket title|description|footer|color <valeur>`\nExemple: `,ticket embed support panel title "Support technique"`\nExemple: `,ticket embed support ticket description "Bienvenue {user} !"`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const typeId = args[0].toLowerCase();
  const target = args[1].toLowerCase();
  const field = args[2].toLowerCase();
  const value = args.slice(3).join(' ').replace(/^["']|["']$/g, '');

  if (!['panel', 'ticket'].includes(target) || !['title', 'description', 'footer', 'color'].includes(field)) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'panel|ticket et title|description|footer|color requis.' })] });
  }

  const guildData = getGuildData(message.guild.id);
  ensureTicketTypes(guildData, message.guild.id);
  const types = guildData.settings.ticket.types;
  if (!types || !types[typeId]) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: `Type \`${typeId}\` introuvable.` })] });
  }

  const embedKey = target === 'panel' ? 'panelEmbed' : 'ticketEmbed';
  if (!types[typeId][embedKey]) types[typeId][embedKey] = {};
  if (field === 'color') {
    const hex = value.replace('#', '');
    types[typeId][embedKey].color = parseInt(hex, 16) || 0x5865F2;
  } else {
    types[typeId][embedKey][field] = value;
  }

  saveGuildData(message.guild.id, guildData);

  message.reply({ embeds: [createEmbed('success', { title: 'Embed mis à jour', description: `\`${typeId}\` → ${target}.${field}` })] });
}

async function ticketButton(message, args) {
  if (!args[0] || !args[1] || !args[2]) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Usage: `,ticket button <type> label|emoji <valeur>`' })] });
  }

  const typeId = args[0].toLowerCase();
  const field = args[1].toLowerCase();
  const value = args.slice(2).join(' ').replace(/^["']|["']$/g, '');

  if (!['label', 'emoji'].includes(field)) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Utilisez label ou emoji.' })] });
  }

  const guildData = getGuildData(message.guild.id);
  ensureTicketTypes(guildData, message.guild.id);
  const types = guildData.settings.ticket.types;
  if (!types || !types[typeId]) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: `Type \`${typeId}\` introuvable.` })] });
  }

  if (field === 'label') types[typeId].buttonLabel = value;
  else types[typeId].buttonEmoji = value.replace(/[<>]/g, '');

  saveGuildData(message.guild.id, guildData);

  message.reply({ embeds: [createEmbed('success', { title: 'Bouton mis à jour', description: `\`${typeId}\` → ${field}: ${value}` })] });
}

async function ticketSetup(message, args) {
  const guildData = getGuildData(message.guild.id);
  const types = getTicketTypes(guildData);

  if (Object.keys(types).length === 0) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Aucun type de ticket. Utilisez `,ticket addtype <id> <catégorie>` d\'abord.',
      })],
    });
  }

  const typesToShow = args.length > 0
    ? args.map(a => a.toLowerCase()).filter(id => types[id])
    : Object.keys(types);

  if (typesToShow.length === 0) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Aucun type valide spécifié.' })] });
  }

  const firstType = types[typesToShow[0]];
  const panelEmbed = firstType.panelEmbed || DEFAULT_PANEL_EMBED;
  const embed = buildEmbedFromConfig(panelEmbed);

  const rows = [];
  let currentRow = new ActionRowBuilder();

  for (const typeId of typesToShow) {
    const config = types[typeId];
    const btn = new ButtonBuilder()
      .setCustomId(`ticket_create_${typeId}`)
      .setLabel(config.buttonLabel || 'Ouvrir un ticket')
      .setStyle(ButtonStyle.Primary);
    if (config.buttonEmoji) btn.setEmoji(config.buttonEmoji);

    if (currentRow.components.length >= 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
    currentRow.addComponents(btn);
  }
  if (currentRow.components.length > 0) rows.push(currentRow);

  await message.channel.send({ embeds: [embed], components: rows });

  message.reply({
    embeds: [createEmbed('success', {
      title: 'Panneau créé',
      description: `Panneau avec ${typesToShow.length} type(s): ${typesToShow.join(', ')}`,
    })],
  });
}

async function ticketClose(message) {
  const guildData = getGuildData(message.guild.id);
  const ticketInfo = getCategoryForChannel(guildData, message.channel.parentId);

  if (!ticketInfo) {
    return message.reply({
      embeds: [createEmbed('error', { title: 'Erreur', description: 'Ce canal n\'est pas un ticket.' })],
    });
  }

  const { config } = ticketInfo;
  const isStaff = message.member.permissions.has('ManageChannels') ||
    (config.supportRoleId && message.member.roles.cache.has(config.supportRoleId));

  if (!isStaff) {
    return message.reply({
      embeds: [createEmbed('error', { title: 'Permission refusée', description: 'Seuls les membres du staff peuvent fermer les tickets.' })],
    });
  }

  const embed = createEmbed('warning', {
    title: 'Ticket fermé',
    description: `Ce ticket a été fermé par ${message.author}.\nLe canal sera supprimé dans 5 secondes.`,
    timestamp: true,
  });

  await message.reply({ embeds: [embed] });
  setTimeout(() => message.channel.delete().catch(() => {}), 5000);
}

async function ticketAdd(message, args) {
  if (!args[0]) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Usage: `,ticket add @utilisateur`' })] });
  }

  const user = message.mentions.users.first();
  if (!user) return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Utilisateur non trouvé.' })] });

  const guildData = getGuildData(message.guild.id);
  if (!getCategoryForChannel(guildData, message.channel.parentId)) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Utilisez cette commande dans un canal ticket.' })] });
  }

  await message.channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  message.reply({ embeds: [createEmbed('success', { title: 'Utilisateur ajouté', description: `${user} a été ajouté au ticket.` })] });
}

async function ticketRemove(message, args) {
  if (!args[0]) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Usage: `,ticket remove @utilisateur`' })] });
  }

  const user = message.mentions.users.first();
  if (!user) return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Utilisateur non trouvé.' })] });

  const guildData = getGuildData(message.guild.id);
  if (!getCategoryForChannel(guildData, message.channel.parentId)) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Utilisez cette commande dans un canal ticket.' })] });
  }

  await message.channel.permissionOverwrites.delete(user.id);
  message.reply({ embeds: [createEmbed('success', { title: 'Utilisateur retiré', description: `${user} a été retiré du ticket.` })] });
}

async function ticketConfig(message, args) {
  const subcommand = args[0]?.toLowerCase();

  if (subcommand === 'support') {
    if (!args[1] || !args[2]) {
      return message.reply({
        embeds: [createEmbed('error', {
          title: 'Erreur',
          description: 'Usage: `,ticket config support <type> @rôle`\nExemple: `,ticket config support support @Support`',
        })],
      });
    }

    const typeId = args[1].toLowerCase();
    const role = message.mentions.roles.first();
    if (!role) return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Rôle non trouvé.' })] });

    const guildData = getGuildData(message.guild.id);
    ensureTicketTypes(guildData, message.guild.id);
    const types = guildData.settings.ticket.types;
    if (!types || !types[typeId]) {
      return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: `Type \`${typeId}\` introuvable.` })] });
    }

    types[typeId].supportRoleId = role.id;
    saveGuildData(message.guild.id, guildData);

    message.reply({ embeds: [createEmbed('success', { title: 'Rôle support configuré', description: `${role} pour le type \`${typeId}\`` })] });
  } else {
    const guildData = getGuildData(message.guild.id);
    const types = getTicketTypes(guildData);

    const fields = Object.entries(types).map(([id, c]) => {
      const cat = message.guild.channels.cache.get(c.categoryId);
      const role = c.supportRoleId ? message.guild.roles.cache.get(c.supportRoleId) : null;
      return {
        name: `Type: ${id}`,
        value: `Catégorie: ${cat || '?'}\nSupport: ${role || 'Non configuré'}`,
        inline: true,
      };
    });

    const embed = createEmbed('settings', {
      title: 'Configuration des tickets',
      description: Object.keys(types).length ? '' : 'Aucun type configuré.',
      fields: fields.length ? fields : [{ name: '\u200b', value: 'Utilisez `,ticket addtype` pour commencer.', inline: false }],
    });
    message.reply({ embeds: [embed] });
  }
}

export async function handleTicketCreate(interaction) {
  const typeId = interaction.customId === 'ticket_create'
    ? 'default'
    : interaction.customId.replace('ticket_create_', '');

  const { getGuildData } = await import('../utils/database.js');
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = await import('discord.js');

  const guildData = getGuildData(interaction.guild.id);
  const types = getTicketTypes(guildData);

  const config = types[typeId] || types.default || Object.values(types)[0];
  if (!config) {
    return interaction.reply({
      content: 'Le système de tickets n\'est pas configuré sur ce serveur.',
      ephemeral: true,
    });
  }

  const category = interaction.guild.channels.cache.get(config.categoryId);
  if (!category) {
    return interaction.reply({
      content: 'La catégorie des tickets n\'existe plus. Contactez un administrateur.',
      ephemeral: true,
    });
  }

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

  const supportMention = config.supportRoleId ? `<@&${config.supportRoleId}>` : 'Le staff';
  const vars = {
    user: interaction.user.toString(),
    username: interaction.user.tag,
    support: supportMention,
    server: interaction.guild.name,
    ticketnumber: ticketNumber,
  };

  const ticketEmbedConfig = config.ticketEmbed || DEFAULT_TICKET_EMBED;
  const embed = buildEmbedFromConfig(ticketEmbedConfig, vars);

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
}

export async function handleTicketClose(interaction) {
  const { getGuildData } = await import('../utils/database.js');
  const { createEmbed } = await import('../utils/embeds.js');

  const guildData = getGuildData(interaction.guild.id);
  const ticketInfo = getCategoryForChannel(guildData, interaction.channel.parentId);

  if (!ticketInfo) {
    return interaction.reply({
      content: 'Ce bouton ne peut être utilisé que dans un ticket.',
      ephemeral: true,
    });
  }

  const { config } = ticketInfo;
  const isStaff = interaction.member.permissions.has('ManageChannels') ||
    (config.supportRoleId && interaction.member.roles.cache.has(config.supportRoleId));

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
}

export { getTicketTypes, getCategoryForChannel, buildEmbedFromConfig, formatEmbedText, DEFAULT_TICKET_EMBED };
