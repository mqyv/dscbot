import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

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
          description: 'Ouvrez un ticket en cliquant sur le bouton du panneau, ou utilisez les commandes ci-dessous.',
          fields: [
            { name: '`,ticket setup [catégorie]`', value: 'Créer le panneau de tickets (optionnel: mentionner une catégorie)', inline: false },
            { name: '`,ticket close`', value: 'Fermer le ticket (dans un canal ticket)', inline: false },
            { name: '`,ticket add @utilisateur`', value: 'Ajouter quelqu\'un au ticket', inline: false },
            { name: '`,ticket remove @utilisateur`', value: 'Retirer quelqu\'un du ticket', inline: false },
            { name: '`,ticket config support @rôle`', value: 'Définir le rôle support (mentionné dans les tickets)', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
        break;
    }
  },
};

async function ticketSetup(message, args) {
  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  if (!guildData.settings.ticket) guildData.settings.ticket = {};

  let category = null;
  if (args[0]) {
    const categoryMatch = args[0].match(/^<#(\d+)>$/);
    const categoryId = categoryMatch ? categoryMatch[1] : args[0];
    category = message.guild.channels.cache.get(categoryId);
    if (category && category.type !== ChannelType.GuildCategory) {
      category = null; // Pas une catégorie
    }
  }

  if (!category) {
    category = message.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === 'Tickets');
    if (!category) {
      category = await message.guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
      });
    }
  }

  guildData.settings.ticket.categoryId = category.id;
  guildData.settings.ticket.panelChannelId = message.channel.id;
  saveGuildData(message.guild.id, guildData);

  const embed = createEmbed('info', {
    title: '🎫 Système de tickets',
    description: 'Cliquez sur le bouton ci-dessous pour ouvrir un ticket et contacter le staff.\n\nUn membre de l\'équipe vous répondra dès que possible.',
    footer: { text: 'Ne créez un ticket que si nécessaire' },
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_create')
      .setLabel('Ouvrir un ticket')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary)
  );

  await message.channel.send({ embeds: [embed], components: [row] });

  const successEmbed = createEmbed('success', {
    title: 'Panneau de tickets créé',
    description: `Le système de tickets est configuré. Les tickets seront créés dans la catégorie ${category}.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function ticketClose(message) {
  const guildData = getGuildData(message.guild.id);
  const ticketConfig = guildData.settings?.ticket;
  if (!ticketConfig?.categoryId) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Ce canal n\'est pas un ticket ou le système de tickets n\'est pas configuré.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const category = message.guild.channels.cache.get(ticketConfig.categoryId);
  if (!category || message.channel.parentId !== category.id) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Utilisez cette commande dans un canal ticket.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const isStaff = message.member.permissions.has('ManageChannels') ||
    (ticketConfig.supportRoleId && message.member.roles.cache.has(ticketConfig.supportRoleId));

  if (!isStaff) {
    const errorEmbed = createEmbed('error', {
      title: 'Permission refusée',
      description: 'Seuls les membres du staff peuvent fermer les tickets.',
    });
    return message.reply({ embeds: [errorEmbed] });
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
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Mentionnez un utilisateur à ajouter.\nExemple: `,ticket add @utilisateur`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const user = message.mentions.users.first();
  if (!user) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Utilisateur non trouvé.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  const ticketConfig = guildData.settings?.ticket;
  if (!ticketConfig?.categoryId) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Utilisez cette commande dans un canal ticket.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const category = message.guild.channels.cache.get(ticketConfig.categoryId);
  if (!category || message.channel.parentId !== category.id) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Utilisez cette commande dans un canal ticket.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  await message.channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  const successEmbed = createEmbed('success', {
    title: 'Utilisateur ajouté',
    description: `${user} a été ajouté au ticket.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function ticketRemove(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Mentionnez un utilisateur à retirer.\nExemple: `,ticket remove @utilisateur`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const user = message.mentions.users.first();
  if (!user) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Utilisateur non trouvé.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  const ticketConfig = guildData.settings?.ticket;
  if (!ticketConfig?.categoryId) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Utilisez cette commande dans un canal ticket.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const category = message.guild.channels.cache.get(ticketConfig.categoryId);
  if (!category || message.channel.parentId !== category.id) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Utilisez cette commande dans un canal ticket.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  await message.channel.permissionOverwrites.delete(user.id);

  const successEmbed = createEmbed('success', {
    title: 'Utilisateur retiré',
    description: `${user} a été retiré du ticket.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function ticketConfig(message, args) {
  const subcommand = args[0]?.toLowerCase();

  if (subcommand === 'support') {
    if (!args[1]) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Mentionnez un rôle.\nExemple: `,ticket config support @Support`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const role = message.mentions.roles.first();
    if (!role) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Rôle non trouvé.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const guildData = getGuildData(message.guild.id);
    if (!guildData.settings) guildData.settings = {};
    if (!guildData.settings.ticket) guildData.settings.ticket = {};
    guildData.settings.ticket.supportRoleId = role.id;
    saveGuildData(message.guild.id, guildData);

    const successEmbed = createEmbed('success', {
      title: 'Rôle support configuré',
      description: `Le rôle ${role} sera mentionné lors de l'ouverture d'un ticket.`,
    });

    message.reply({ embeds: [successEmbed] });
  } else {
    const guildData = getGuildData(message.guild.id);
    const ticketConfig = guildData.settings?.ticket || {};
    const category = ticketConfig.categoryId
      ? message.guild.channels.cache.get(ticketConfig.categoryId)
      : null;
    const supportRole = ticketConfig.supportRoleId
      ? message.guild.roles.cache.get(ticketConfig.supportRoleId)
      : null;

    const embed = createEmbed('settings', {
      title: 'Configuration des tickets',
      fields: [
        { name: 'Catégorie', value: category ? `${category}` : 'Non configuré', inline: true },
        { name: 'Rôle support', value: supportRole ? `${supportRole}` : 'Non configuré', inline: true },
      ],
    });

    message.reply({ embeds: [embed] });
  }
}
