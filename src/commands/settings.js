import { createEmbed } from '../utils/embeds.js';
import { E } from '../utils/emojis.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'settings',
    description: 'Configuration du serveur',
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
      case 'config':
        await settingsConfig(message);
        break;
      case 'modlog':
        await settingsModlog(message, args.slice(1));
        break;
      case 'muted':
        await settingsMuted(message, args.slice(1));
        break;
      case 'staff':
        await settingsStaff(message, args.slice(1));
        break;
      case 'reset':
        await settingsReset(message);
        break;
      default:
        await settingsConfig(message);
        break;
    }
  },
};

async function settingsConfig(message) {
  const e = E;
  const guildData = getGuildData(message.guild.id);
  const settings = guildData.settings || {};

  const embed = createEmbed('settings', {
    title: 'Configuration du serveur',
    description: `Configuration actuelle pour **${message.guild.name}**`,
    fields: [
      {
        name: `${e.notes} Préfixe`,
        value: `\`${guildData.prefix}\``,
        inline: true,
      },
      {
        name: '📋 Mod Log',
        value: settings.modlog ? `<#${settings.modlog}>` : 'Non configuré',
        inline: true,
      },
      {
        name: '🔇 Rôle muet',
        value: settings.muted ? `<@&${settings.muted}>` : 'Non configuré',
        inline: true,
      },
      {
        name: '👮 Rôles staff',
        value: settings.staff && settings.staff.length > 0
          ? settings.staff.map(id => `<@&${id}>`).join(', ')
          : 'Non configuré',
        inline: false,
      },
    ],
  });

  message.reply({ embeds: [embed] });
}

async function settingsModlog(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un canal.\nExemple: `,settings modlog #logs`',
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
  guildData.settings.modlog = channel.id;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Mod Log configuré',
    description: `Le canal de modération a été défini sur ${channel}`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function settingsMuted(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un rôle.\nExemple: `,settings muted @Muted`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const role = message.mentions.roles.first();
  if (!role) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Rôle non trouvé. Mentionnez un rôle valide.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  guildData.settings.muted = role.id;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Rôle muet configuré',
    description: `Le rôle muet a été défini sur ${role}`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function settingsStaff(message, args) {
  const subcommand = args[0]?.toLowerCase();

  if (subcommand === 'list') {
    const guildData = getGuildData(message.guild.id);
    const staffRoles = guildData.settings?.staff || [];

    if (staffRoles.length === 0) {
      const embed = createEmbed('info', {
        title: '👮 Rôles staff',
        description: 'Aucun rôle staff configuré.',
      });
      return message.reply({ embeds: [embed] });
    }

    const embed = createEmbed('settings', {
      title: '👮 Rôles staff',
      description: staffRoles.map(id => `<@&${id}>`).join('\n'),
    });

    return message.reply({ embeds: [embed] });
  }

  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un rôle.\nExemple: `,settings staff @Moderator`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const role = message.mentions.roles.first();
  if (!role) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Rôle non trouvé. Mentionnez un rôle valide.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  if (!guildData.settings.staff) guildData.settings.staff = [];

  if (guildData.settings.staff.includes(role.id)) {
    guildData.settings.staff = guildData.settings.staff.filter(id => id !== role.id);
    const successEmbed = createEmbed('success', {
      title: 'Rôle staff retiré',
      description: `${role} a été retiré des rôles staff.`,
    });
    message.reply({ embeds: [successEmbed] });
  } else {
    guildData.settings.staff.push(role.id);
    const successEmbed = createEmbed('success', {
      title: 'Rôle staff ajouté',
      description: `${role} a été ajouté aux rôles staff.`,
    });
    message.reply({ embeds: [successEmbed] });
  }

  saveGuildData(message.guild.id, guildData);
}

async function settingsReset(message) {
  const e = E;
  if (!message.member.permissions.has('Administrator')) {
    const errorEmbed = createEmbed('error', {
      title: `${e.error} Permission refusée`,
      description: 'Vous devez être administrateur pour réinitialiser la configuration.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  guildData.settings = {};
  guildData.prefix = ',';
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Configuration réinitialisée',
    description: 'Toutes les configurations du serveur ont été réinitialisées.',
  });

  message.reply({ embeds: [successEmbed] });
}
