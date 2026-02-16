import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, EmbedBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

const TEXTS = {
  fr: {
    panelEmbed: {
      title: '🎫 Système de tickets',
      description: 'Cliquez sur un bouton ci-dessous pour ouvrir un ticket.\n\nUn membre de l\'équipe vous répondra dès que possible.',
      footer: 'Ne créez un ticket que si nécessaire',
      color: 0x5865F2,
    },
    ticketEmbed: {
      title: '🎫 Ticket #{ticketnumber}',
      description: 'Bienvenue {user} !\n\nDécrivez votre demande et {support} vous répondra dès que possible.\n\nUtilisez `,ticket close` pour fermer ce ticket (staff uniquement).',
      footer: 'Ouvert par {username}',
      color: 0x5865F2,
    },
    buttonLabel: 'Ouvrir un ticket',
    closeButton: 'Fermer le ticket',
    supportDefault: 'Le staff',
    notConfigured: 'Le système de tickets n\'est pas configuré sur ce serveur.',
    categoryGone: 'La catégorie des tickets n\'existe plus. Contactez un administrateur.',
    alreadyOpen: 'Vous avez déjà un ticket ouvert :',
    ticketCreated: 'Votre ticket a été créé :',
    closeBtnOnlyInTicket: 'Ce bouton ne peut être utilisé que dans un ticket.',
    onlyStaffClose: 'Seuls les membres du staff peuvent fermer les tickets.',
    ticketClosed: 'Ticket fermé',
    closedBy: 'Ce ticket a été fermé par',
    channelDeletedIn: 'Le canal sera supprimé dans 5 secondes.',
  },
  en: {
    panelEmbed: {
      title: '🎫 Ticket System',
      description: 'Click a button below to open a ticket.\n\nA staff member will respond as soon as possible.',
      footer: 'Only create a ticket if necessary',
      color: 0x5865F2,
    },
    ticketEmbed: {
      title: '🎫 Ticket #{ticketnumber}',
      description: 'Welcome {user}!\n\nDescribe your request and {support} will respond as soon as possible.\n\nUse `,ticket close` to close this ticket (staff only).',
      footer: 'Opened by {username}',
      color: 0x5865F2,
    },
    buttonLabel: 'Open a ticket',
    closeButton: 'Close ticket',
    supportDefault: 'The staff',
    notConfigured: 'The ticket system is not configured on this server.',
    categoryGone: 'The ticket category no longer exists. Contact an administrator.',
    alreadyOpen: 'You already have an open ticket:',
    ticketCreated: 'Your ticket has been created:',
    closeBtnOnlyInTicket: 'This button can only be used in a ticket.',
    onlyStaffClose: 'Only staff members can close tickets.',
    ticketClosed: 'Ticket closed',
    closedBy: 'This ticket was closed by',
    channelDeletedIn: 'The channel will be deleted in 5 seconds.',
  },
};

const DEFAULT_PANEL_EMBED = TEXTS.fr.panelEmbed;
const DEFAULT_TICKET_EMBED = TEXTS.fr.ticketEmbed;

function getTicketLang(guildData) {
  const lang = guildData?.settings?.ticket?.lang || 'fr';
  return TEXTS[lang] || TEXTS.fr;
}

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
        await ticketEmbed(message);
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
      case 'lang':
      case 'language':
        await ticketLang(message, args.slice(1));
        break;
      default:
        await ticketMenu(message);
        break;
    }
  },
};

async function ticketMenu(message) {
  const guildData = getGuildData(message.guild.id);
  const types = getTicketTypes(guildData);
  const hasTypes = Object.keys(types).length > 0;

  const embed = createEmbed('settings', {
    title: '🎫 Système de tickets',
    description: 'Choisissez une action ci-dessous pour configurer ou gérer les tickets.',
    fields: [
      { name: 'Configuration', value: 'Voir la config actuelle (types, rôles, langue)', inline: true },
      { name: 'Embeds', value: 'Personnaliser panneau, ticket, boutons, messages', inline: true },
      { name: 'Panneau', value: 'Créer le message avec boutons d\'ouverture', inline: true },
      { name: 'Langue', value: 'FR ou EN pour tous les textes', inline: true },
      { name: 'Ajouter type', value: 'Nouveau type (support, report...)', inline: true },
      { name: 'Supprimer type', value: 'Retirer un type de ticket', inline: true },
      { name: 'Variables', value: '`{user}` `{username}` `{support}` `{server}` `{ticketnumber}`', inline: false },
    ],
  });

  const options = [
    { label: '📋 Configuration', value: 'config', description: 'Voir la configuration actuelle' },
    { label: '🎨 Embeds & messages', value: 'embed', description: 'Personnaliser embeds, boutons, textes' },
    { label: '📌 Créer panneau', value: 'panel', description: 'Message avec boutons d\'ouverture', disabled: !hasTypes },
    { label: '🌐 Langue', value: 'lang', description: 'Choisir FR ou EN' },
    { label: '➕ Ajouter type', value: 'addtype', description: 'Nouveau type de ticket' },
    { label: '➖ Supprimer type', value: 'removetype', description: 'Retirer un type', disabled: !hasTypes },
    { label: '❓ Aide', value: 'help', description: 'Liste des commandes' },
  ];

  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_menu_select')
    .setPlaceholder('Que voulez-vous faire ?')
    .addOptions(options.filter(o => !o.disabled).map(({ label, value, description }) => ({
      label,
      value,
      description: description || undefined,
    })));

  const row = new ActionRowBuilder().addComponents(select);
  await message.reply({ embeds: [embed], components: [row] });
}

function buildMessageLikeFromInteraction(interaction) {
  return {
    reply: async (content) => {
      await interaction.reply(content);
      return { edit: (c) => interaction.editReply(c) };
    },
    channel: interaction.channel,
    author: interaction.user,
    guild: interaction.guild,
    member: interaction.member,
    client: interaction.client,
  };
}

export async function handleTicketMenuSelect(interaction) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
  }
  const value = interaction.values[0];
  const messageLike = buildMessageLikeFromInteraction(interaction);

  if (value === 'config') {
    await ticketConfig(messageLike, []);
    return;
  }
  if (value === 'embed') {
    await ticketEmbed(messageLike);
    return;
  }
  if (value === 'lang') {
    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_lang_select')
      .setPlaceholder('Choisir la langue')
      .addOptions(
        { label: 'Français', value: 'fr', description: 'Langue française' },
        { label: 'English', value: 'en', description: 'English language' }
      );
    await interaction.reply({
      content: 'Choisissez la langue :',
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: true,
    });
    return;
  }
  if (value === 'panel') {
    const guildData = getGuildData(interaction.guild.id);
    const types = getTicketTypes(guildData);
    const typeOptions = [
      { label: 'Tous les types', value: '__all__', description: 'Inclure tous les types dans le panneau' },
      ...Object.keys(types).map(id => ({
        label: id.charAt(0).toUpperCase() + id.slice(1),
        value: id,
        description: `Inclure le type "${id}"`,
      })),
    ];
    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_panel_type_select')
      .setPlaceholder('Types à inclure')
      .addOptions(typeOptions)
      .setMinValues(1)
      .setMaxValues(typeOptions.length);
    await interaction.reply({
      content: 'Sélectionnez les types à inclure dans le panneau :',
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: true,
    });
    return;
  }
  if (value === 'addtype') {
    const modal = new ModalBuilder()
      .setCustomId('ticket_addtype_modal')
      .setTitle('Ajouter un type de ticket');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('typeid')
          .setLabel('ID du type')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: support, report, bug')
          .setMaxLength(32)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('categoryid')
          .setLabel('ID de la catégorie')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Collez l\'ID de la catégorie')
          .setMaxLength(20)
      )
    );
    await interaction.showModal(modal);
    return;
  }
  if (value === 'removetype') {
    const guildData = getGuildData(interaction.guild.id);
    const types = getTicketTypes(guildData);
    const typeOptions = Object.keys(types).map(id => ({
      label: id.charAt(0).toUpperCase() + id.slice(1),
      value: id,
      description: `Supprimer le type "${id}"`,
    }));
    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_removetype_select')
      .setPlaceholder('Type à supprimer')
      .addOptions(typeOptions);
    await interaction.reply({
      content: 'Quel type voulez-vous supprimer ?',
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: true,
    });
    return;
  }
  if (value === 'help') {
    const embed = createEmbed('settings', {
      title: 'Système de tickets – Aide',
      description: 'Commandes disponibles :',
      fields: [
        { name: '`,ticket addtype <id> <catégorie>`', value: 'Ajouter un type (ex: support, report)', inline: false },
        { name: '`,ticket removetype <id>`', value: 'Supprimer un type', inline: false },
        { name: '`,ticket setup [types...]`', value: 'Créer le panneau', inline: false },
        { name: '`,ticket embed`', value: 'Configurer embeds, boutons, messages', inline: false },
        { name: '`,ticket lang fr|en`', value: 'Langue FR ou EN', inline: false },
        { name: '`,ticket config`', value: 'Voir la configuration', inline: false },
        { name: 'Dans un ticket', value: '`close` `add @user` `remove @user`', inline: false },
        { name: 'Variables', value: '`{user}` `{username}` `{support}` `{server}` `{ticketnumber}`', inline: false },
      ],
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

export async function handleTicketLangSelect(interaction) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
  }
  const lang = interaction.values[0];
  const guildData = getGuildData(interaction.guild.id);
  if (!guildData.settings) guildData.settings = {};
  if (!guildData.settings.ticket) guildData.settings.ticket = {};
  guildData.settings.ticket.lang = lang;
  saveGuildData(interaction.guild.id, guildData);
  const msg = lang === 'fr' ? 'Langue définie : Français' : 'Language set: English';
  await interaction.reply({ content: msg, ephemeral: true });
}

export async function handleTicketPanelTypeSelect(interaction) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
  }
  const selected = interaction.values || [];
  const args = selected.includes('__all__') ? [] : selected;
  const messageLike = buildMessageLikeFromInteraction(interaction);
  await ticketSetup(messageLike, args);
}

export async function handleTicketRemovetypeSelect(interaction) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
  }
  const typeId = interaction.values[0];
  const messageLike = buildMessageLikeFromInteraction(interaction);
  await ticketRemoveType(messageLike, [typeId]);
}

export async function handleTicketAddtypeModal(interaction) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
  }
  const typeId = interaction.fields.getTextInputValue('typeid')?.trim().toLowerCase();
  const categoryId = interaction.fields.getTextInputValue('categoryid')?.trim().replace(/[^0-9]/g, '');
  if (!typeId || !categoryId) {
    return interaction.reply({ content: 'ID du type et ID de la catégorie requis.', ephemeral: true });
  }
  const messageLike = buildMessageLikeFromInteraction(interaction);
  await ticketAddType(messageLike, [typeId, categoryId]);
}

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
    const t = getTicketLang(guildData);
    return {
      default: {
        categoryId: ticket.categoryId,
        supportRoleId: ticket.supportRoleId,
        panelEmbed: { ...t.panelEmbed },
        ticketEmbed: { ...t.ticketEmbed },
        buttonLabel: t.buttonLabel,
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
      const t = getTicketLang(guildData);
      guildData.settings.ticket.types.default = {
        categoryId: guildData.settings.ticket.categoryId,
        supportRoleId: guildData.settings.ticket.supportRoleId,
        panelEmbed: { ...t.panelEmbed },
        ticketEmbed: { ...t.ticketEmbed },
        buttonLabel: t.buttonLabel,
        buttonEmoji: '🎫',
      };
    }
  }

  const t = getTicketLang(guildData);
  guildData.settings.ticket.types[typeId] = {
    categoryId: category.id,
    supportRoleId: null,
    panelEmbed: { ...t.panelEmbed },
    ticketEmbed: { ...t.ticketEmbed },
    buttonLabel: typeId === 'default' ? t.buttonLabel : `Ticket ${typeId}`,
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

async function ticketLang(message, args) {
  if (!args[0]) {
    const guildData = getGuildData(message.guild.id);
    const lang = guildData.settings?.ticket?.lang || 'fr';
    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Langue des tickets',
        description: `Langue actuelle : **${lang.toUpperCase()}**\n\nUsage: \`,ticket lang fr\` ou \`,ticket lang en\``,
      })],
    });
  }

  const lang = args[0].toLowerCase();
  if (!['fr', 'en'].includes(lang)) {
    return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Langues disponibles : `fr`, `en`' })] });
  }

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  if (!guildData.settings.ticket) guildData.settings.ticket = {};
  guildData.settings.ticket.lang = lang;
  saveGuildData(message.guild.id, guildData);

  const msg = lang === 'fr' ? 'Langue définie sur Français.' : 'Language set to English.';
  message.reply({ embeds: [createEmbed('success', { title: 'Langue', description: msg })] });
}

async function ticketEmbed(message) {
  const guildData = getGuildData(message.guild.id);
  ensureTicketTypes(guildData, message.guild.id);
  const types = guildData.settings?.ticket?.types || getTicketTypes(guildData);

  if (!types || Object.keys(types).length === 0) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Aucun type configuré',
        description: 'Utilisez `,ticket addtype <id> <catégorie>` pour créer un type de ticket d\'abord.',
      })],
    });
  }

  const typeOptions = Object.keys(types).map(id => ({
    label: id.charAt(0).toUpperCase() + id.slice(1),
    value: id,
    description: `Configurer le type "${id}"`,
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_embed_type')
    .setPlaceholder('Choisissez le type de ticket...')
    .addOptions(typeOptions);

  const row = new ActionRowBuilder().addComponents(select);

  const embed = createEmbed('info', {
    title: 'Configuration des embeds',
    description: '**Étape 1** : Choisissez le type de ticket à configurer.\n\n**Modifiable :**\n• **Panneau** – Embed du panneau\n• **Ticket** – Embed dans chaque ticket\n• **Bouton** – Libellé et emoji d\'ouverture\n• **Rôle** – Rôle support mentionné\n• **Bouton fermer** – Libellé du bouton de fermeture\n• **Messages** – Message après création + contenu du ticket\n• **Embed fermeture** – Embed affiché à la fermeture',
    footer: { text: 'Variables : {user} {username} {support} {server} {ticketnumber}' },
  });

  await message.reply({ embeds: [embed], components: [row] });
}

export function buildEmbedConfigButtons(typeId, guildData) {
  const types = guildData?.settings?.ticket?.types || getTicketTypes(guildData || {});
  const typeOptions = Object.keys(types || {}).map(id => ({
    label: id.charAt(0).toUpperCase() + id.slice(1),
    value: id,
    description: `Configurer le type "${id}"`,
  }));

  const t = getTicketLang(guildData);
  const rows = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_embed_panel_${typeId}`)
        .setLabel('Panneau')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_embed_ticket_${typeId}`)
        .setLabel('Ticket')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_embed_btn_${typeId}`)
        .setLabel('Bouton')
        .setEmoji('🔘')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`ticket_embed_role_${typeId}`)
        .setLabel('Rôle')
        .setEmoji('👮')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_embed_closebtn_${typeId}`)
        .setLabel('Bouton fermer')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`ticket_embed_messages_${typeId}`)
        .setLabel('Messages')
        .setEmoji('💬')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`ticket_embed_closeembed_${typeId}`)
        .setLabel('Embed fermeture')
        .setEmoji('📤')
        .setStyle(ButtonStyle.Secondary)
    ),
  ];

  if (typeOptions.length > 0) {
    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_embed_type')
      .setPlaceholder('Changer de type...')
      .addOptions(typeOptions);
    rows.push(new ActionRowBuilder().addComponents(select));
  }

  return rows;
}

export function buildEmbedModal(typeId, part, current = {}) {
  const isBtn = part === 'btn';
  const modal = new ModalBuilder()
    .setCustomId(`ticket_embed_modal_${part}_${typeId}`)
    .setTitle(isBtn ? 'Configurer le bouton' : `Embed ${part === 'panel' ? 'du panneau' : 'du ticket'}`);

  if (isBtn) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('label')
          .setLabel('Libellé du bouton')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: Ouvrir un ticket')
          .setValue(current.buttonLabel || 'Ouvrir un ticket')
          .setMaxLength(80)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('emoji')
          .setLabel('Emoji (optionnel)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 🎫 ou ticket')
          .setValue(current.buttonEmoji || '🎫')
          .setRequired(false)
      )
    );
  } else {
    const cfg = part === 'panel' ? (current.panelEmbed || {}) : (current.ticketEmbed || {});
    const defaults = part === 'panel' ? DEFAULT_PANEL_EMBED : DEFAULT_TICKET_EMBED;
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('title')
          .setLabel('Titre')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Titre de l\'embed')
          .setValue(cfg.title || defaults.title || '')
          .setMaxLength(256)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('description')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Contenu de l\'embed. Variables: {user} {support}...')
          .setValue(cfg.description || defaults.description || '')
          .setMaxLength(4000)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('footer')
          .setLabel('Pied de page')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Texte en bas de l\'embed')
          .setValue(cfg.footer || defaults.footer || '')
          .setMaxLength(2048)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('color')
          .setLabel('Couleur (hex sans #)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 5865F2')
          .setValue((cfg.color ? cfg.color.toString(16) : (defaults.color?.toString(16) || '5865f2')))
          .setMaxLength(6)
      )
    );
  }
  return modal;
}

export async function handleTicketEmbedSelect(interaction) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return interaction.update({ content: 'Permission refusée.', embeds: [], components: [] }).catch(() => {});
  }
  const typeId = interaction.values[0];
  const guildData = getGuildData(interaction.guild.id);
  const types = getTicketTypes(guildData);
  if (!types || !types[typeId]) {
    return interaction.update({ content: 'Type introuvable.', embeds: [], components: [] });
  }

  const embed = createEmbed('info', {
    title: `Configuration : ${typeId}`,
    description: 'Choisissez ce que vous voulez modifier :',
    fields: [
      { name: '📋 Embed du panneau', value: 'L\'embed affiché sur le panneau', inline: true },
      { name: '🎫 Embed du ticket', value: 'L\'embed dans chaque ticket', inline: true },
      { name: '🔘 Bouton', value: 'Libellé et emoji', inline: true },
      { name: '👮 Rôle support', value: 'Rôle mentionné à l\'ouverture', inline: true },
    ],
  });

  await interaction.update({ embeds: [embed], components: buildEmbedConfigButtons(typeId, guildData) });
}

export async function handleTicketEmbedButton(interaction) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
  }
  const match = interaction.customId.match(/^ticket_embed_(panel|ticket|btn|role|closebtn|messages|closeembed)_(.+)$/);
  if (!match) return;

  const [, part, typeId] = match;
  const guildData = getGuildData(interaction.guild.id);
  ensureTicketTypes(guildData, interaction.guild.id);
  const types = guildData.settings?.ticket?.types;
  if (!types || !types[typeId]) {
    return interaction.reply({ content: 'Type introuvable.', ephemeral: true });
  }

  const config = types[typeId];
  const t = getTicketLang(guildData);
  if (part === 'role') {
    const role = config.supportRoleId ? interaction.guild.roles.cache.get(config.supportRoleId) : null;
    const modal = new ModalBuilder()
      .setCustomId(`ticket_embed_modal_role_${typeId}`)
      .setTitle('Rôle support');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('role')
          .setLabel('ID du rôle ou mention (@Rôle)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 123456789 ou @Support')
          .setValue(role ? role.id : '')
          .setRequired(false)
      )
    );
    await interaction.showModal(modal);
  } else if (part === 'closebtn') {
    const modal = new ModalBuilder()
      .setCustomId(`ticket_embed_modal_closebtn_${typeId}`)
      .setTitle('Bouton fermer');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('label')
          .setLabel('Libellé du bouton')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: Fermer le ticket')
          .setValue(config.closeButton ?? t.closeButton)
          .setMaxLength(80)
      )
    );
    await interaction.showModal(modal);
  } else if (part === 'messages') {
    const modal = new ModalBuilder()
      .setCustomId(`ticket_embed_modal_messages_${typeId}`)
      .setTitle('Messages');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('created')
          .setLabel('Message après création')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: Votre ticket a été créé :')
          .setValue(config.createdMessage ?? t.ticketCreated)
          .setMaxLength(200)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('ticketcontent')
          .setLabel('Contenu du message dans le ticket')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Ex: {user} {support} - Variables: {user} {support}')
          .setValue(config.ticketMessage ?? '{user} {support}')
          .setMaxLength(500)
      )
    );
    await interaction.showModal(modal);
  } else if (part === 'closeembed') {
    const ce = config.closeEmbed || {};
    const modal = new ModalBuilder()
      .setCustomId(`ticket_embed_modal_closeembed_${typeId}`)
      .setTitle('Embed fermeture');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('title')
          .setLabel('Titre')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: Ticket fermé')
          .setValue(ce.title ?? t.ticketClosed)
          .setMaxLength(256)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('description')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Ex: Ce ticket a été fermé par...')
          .setValue(ce.description ?? `${t.closedBy} {user}.\n${t.channelDeletedIn}`)
          .setMaxLength(1000)
      )
    );
    await interaction.showModal(modal);
  } else {
    const modal = buildEmbedModal(typeId, part, config);
    await interaction.showModal(modal);
  }
}

export async function handleTicketEmbedModal(interaction) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
  }
  const match = interaction.customId.match(/^ticket_embed_modal_(panel|ticket|btn|role|closebtn|messages|closeembed)_(.+)$/);
  if (!match) return;

  const [, part, typeId] = match;
  const guildData = getGuildData(interaction.guild.id);
  ensureTicketTypes(guildData, interaction.guild.id);
  const types = guildData.settings?.ticket?.types;
  if (!types || !types[typeId]) {
    return interaction.reply({ content: 'Type introuvable.', ephemeral: true });
  }

  if (part === 'role') {
    const roleInput = interaction.fields.getTextInputValue('role')?.trim() || '';
    if (!roleInput) {
      types[typeId].supportRoleId = null;
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', { title: 'Rôle support retiré', description: `Le rôle support du type \`${typeId}\` a été retiré.` })],
        ephemeral: true,
      });
    }
    const roleId = roleInput.replace(/[<@&>]/g, '');
    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) {
      return interaction.reply({ content: 'Rôle introuvable. Vérifiez l\'ID ou la mention.', ephemeral: true });
    }
    types[typeId].supportRoleId = role.id;
    saveGuildData(interaction.guild.id, guildData);
    return interaction.reply({
      embeds: [createEmbed('success', { title: 'Rôle support configuré', description: `Le rôle ${role} sera mentionné pour le type \`${typeId}\`.` })],
      ephemeral: true,
    });
  }

  if (part === 'btn') {
    const label = interaction.fields.getTextInputValue('label') || 'Ouvrir un ticket';
    const emoji = interaction.fields.getTextInputValue('emoji') || '';
    types[typeId].buttonLabel = label;
    types[typeId].buttonEmoji = emoji.trim() || '🎫';
  } else if (part === 'closebtn') {
    const label = interaction.fields.getTextInputValue('label') || 'Fermer le ticket';
    types[typeId].closeButton = label;
  } else if (part === 'messages') {
    types[typeId].createdMessage = interaction.fields.getTextInputValue('created') || '';
    types[typeId].ticketMessage = interaction.fields.getTextInputValue('ticketcontent') || '';
  } else if (part === 'closeembed') {
    if (!types[typeId].closeEmbed) types[typeId].closeEmbed = {};
    types[typeId].closeEmbed.title = interaction.fields.getTextInputValue('title') || '';
    types[typeId].closeEmbed.description = interaction.fields.getTextInputValue('description') || '';
  } else {
    const embedKey = part === 'panel' ? 'panelEmbed' : 'ticketEmbed';
    if (!types[typeId][embedKey]) types[typeId][embedKey] = {};

    const title = interaction.fields.getTextInputValue('title') || '';
    const description = interaction.fields.getTextInputValue('description') || '';
    const footer = interaction.fields.getTextInputValue('footer') || '';
    const colorStr = (interaction.fields.getTextInputValue('color') || '5865f2').replace('#', '');
    const color = parseInt(colorStr, 16) || 0x5865F2;

    types[typeId][embedKey].title = title;
    types[typeId][embedKey].description = description;
    types[typeId][embedKey].footer = footer;
    types[typeId][embedKey].color = color;
  }

  saveGuildData(interaction.guild.id, guildData);

  await interaction.reply({
    embeds: [createEmbed('success', {
      title: 'Configuration enregistrée',
      description: `Les modifications pour le type \`${typeId}\` ont été sauvegardées.`,
    })],
    ephemeral: true,
  });
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

  const t = getTicketLang(guildData);
  const vars = { user: message.author.toString(), username: message.author.tag };
  const ce = config.closeEmbed;
  let embed;
  if (ce && (ce.title || ce.description)) {
    embed = buildEmbedFromConfig(ce, vars);
    embed.setColor(ce.color || 0xED4245);
  } else {
    embed = createEmbed('warning', {
      title: t.ticketClosed,
      description: `${t.closedBy} ${message.author}.\n${t.channelDeletedIn}`,
      timestamp: true,
    });
  }

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

    const lang = guildData.settings?.ticket?.lang || 'fr';
    const fields = Object.entries(types).map(([id, c]) => {
      const cat = message.guild.channels.cache.get(c.categoryId);
      const role = c.supportRoleId ? message.guild.roles.cache.get(c.supportRoleId) : null;
      return {
        name: `Type: ${id}`,
        value: `Catégorie: ${cat || '?'}\nSupport: ${role || 'Non configuré'}`,
        inline: true,
      };
    });
    fields.push({ name: 'Langue', value: lang.toUpperCase(), inline: true });

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
  const t = getTicketLang(guildData);
  if (!config) {
    return interaction.reply({ content: t.notConfigured, ephemeral: true });
  }

  const category = interaction.guild.channels.cache.get(config.categoryId);
  if (!category) {
    return interaction.reply({ content: t.categoryGone, ephemeral: true });
  }

  const existingTicket = category.children.cache.find(
    ch => ch.name.startsWith('ticket-') && ch.permissionOverwrites.cache.has(interaction.user.id)
  );
  if (existingTicket) {
    return interaction.reply({
      content: `${t.alreadyOpen} ${existingTicket}`,
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

  const supportMention = config.supportRoleId ? `<@&${config.supportRoleId}>` : t.supportDefault;
  const vars = {
    user: interaction.user.toString(),
    username: interaction.user.tag,
    support: supportMention,
    server: interaction.guild.name,
    ticketnumber: ticketNumber,
  };

  const ticketEmbedConfig = config.ticketEmbed || DEFAULT_TICKET_EMBED;
  const embed = buildEmbedFromConfig(ticketEmbedConfig, vars);

  const closeBtnLabel = (config.closeButton?.trim() || t.closeButton);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close_btn')
      .setLabel(closeBtnLabel)
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );

  const ticketContent = (config.ticketMessage && config.ticketMessage.trim())
    ? formatEmbedText(config.ticketMessage, vars)
    : `${interaction.user} ${supportMention}`;

  await ticketChannel.send({
    content: ticketContent,
    embeds: [embed],
    components: [row],
  });

  const createdMsg = config.createdMessage?.trim() || t.ticketCreated;
  await interaction.reply({
    content: `${createdMsg} ${ticketChannel}`,
    ephemeral: true,
  });
}

export async function handleTicketClose(interaction) {
  const { getGuildData } = await import('../utils/database.js');
  const { createEmbed } = await import('../utils/embeds.js');

  const guildData = getGuildData(interaction.guild.id);
  const ticketInfo = getCategoryForChannel(guildData, interaction.channel.parentId);

  const t = getTicketLang(guildData);
  if (!ticketInfo) {
    return interaction.reply({ content: t.closeBtnOnlyInTicket, ephemeral: true });
  }

  const { config } = ticketInfo;
  const isStaff = interaction.member.permissions.has('ManageChannels') ||
    (config.supportRoleId && interaction.member.roles.cache.has(config.supportRoleId));

  if (!isStaff) {
    return interaction.reply({ content: t.onlyStaffClose, ephemeral: true });
  }

  const vars = { user: interaction.user.toString(), username: interaction.user.tag };
  const ce = config.closeEmbed;
  let embed;
  if (ce && (ce.title || ce.description)) {
    embed = buildEmbedFromConfig(ce, vars);
    embed.setColor(ce.color || 0xED4245);
  } else {
    embed = createEmbed('warning', {
      title: t.ticketClosed,
      description: `${t.closedBy} ${interaction.user}.\n${t.channelDeletedIn}`,
      timestamp: true,
    });
  }

  await interaction.reply({ embeds: [embed] });
  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

export { getTicketTypes, getCategoryForChannel, buildEmbedFromConfig, formatEmbedText, DEFAULT_TICKET_EMBED };
