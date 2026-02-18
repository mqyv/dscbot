import { createEmbed } from '../utils/embeds.js';
import { E } from '../utils/emojis.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'filter',
    description: 'Gérer les filtres de chat',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageChannels')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer les canaux".',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const subcommand = args[0]?.toLowerCase();
    const subsubcommand = args[1]?.toLowerCase();

    if (subcommand === 'add') {
      await filterAdd(message, args.slice(1));
    } else if (subcommand === 'remove') {
      await filterRemove(message, args.slice(1));
    } else if (subcommand === 'list') {
      await filterList(message);
    } else if (subcommand === 'reset') {
      await filterReset(message);
    } else if (subcommand === 'exempt') {
      if (subsubcommand === 'list') {
        await filterExemptList(message);
      } else {
        await filterExempt(message, args.slice(1));
      }
    } else {
      const embed = createEmbed('settings', {
        title: 'Filtres de chat',
        description: 'Commandes disponibles :',
        fields: [
          { name: '`,filter add <mot>`', value: 'Ajouter un mot filtré', inline: false },
          { name: '`,filter remove <mot>`', value: 'Retirer un mot filtré', inline: false },
          { name: '`,filter list`', value: 'Voir tous les mots filtrés', inline: false },
          { name: '`,filter reset`', value: 'Réinitialiser tous les filtres', inline: false },
          { name: '`,filter exempt <role>`', value: 'Exempter un rôle des filtres', inline: false },
          { name: '`,filter exempt list`', value: 'Voir les rôles exemptés', inline: false },
        ],
      });
      message.reply({ embeds: [embed] });
    }
  },
};

async function filterAdd(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un mot à filtrer.\nExemple: `,filter add spam`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const word = args.join(' ').toLowerCase();

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  if (!guildData.settings.filter) guildData.settings.filter = {};
  if (!guildData.settings.filter.words) guildData.settings.filter.words = [];

  if (guildData.settings.filter.words.includes(word)) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Ce mot est déjà dans la liste des filtres.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  guildData.settings.filter.words.push(word);
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Mot ajouté aux filtres',
    description: `Le mot \`${word}\` a été ajouté aux filtres.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function filterRemove(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un mot à retirer.\nExemple: `,filter remove spam`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const word = args.join(' ').toLowerCase();

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings?.filter?.words) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Ce mot n\'est pas dans la liste des filtres.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  if (!guildData.settings.filter.words.includes(word)) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Ce mot n\'est pas dans la liste des filtres.',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  guildData.settings.filter.words = guildData.settings.filter.words.filter(w => w !== word);
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Mot retiré des filtres',
    description: `Le mot \`${word}\` a été retiré des filtres.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function filterList(message) {
  const guildData = getGuildData(message.guild.id);
  const filteredWords = guildData.settings?.filter?.words || [];

  if (filteredWords.length === 0) {
    const embed = createEmbed('info', {
      title: 'Mots filtrés',
      description: 'Aucun mot filtré configuré.',
    });
    return message.reply({ embeds: [embed] });
  }

  const wordsList = filteredWords.map(word => `\`${word}\``).join(', ');

  const embed = createEmbed('settings', {
    title: '🛡️ Mots filtrés',
    description: wordsList,
    footer: { text: `Total: ${filteredWords.length} mot(s)` },
  });

  message.reply({ embeds: [embed] });
}

async function filterReset(message) {
  if (!message.member.permissions.has('ManageGuild')) {
    const errorEmbed = createEmbed('error', {
      title: `${E.error} Permission refusée`,
      description: 'Vous devez avoir la permission "Gérer le serveur".',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  if (guildData.settings?.filter) {
    guildData.settings.filter.words = [];
    saveGuildData(message.guild.id, guildData);
  }

  const successEmbed = createEmbed('success', {
    title: 'Filtres réinitialisés',
    description: 'Tous les mots filtrés ont été supprimés.',
  });

  message.reply({ embeds: [successEmbed] });
}

async function filterExempt(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un rôle.\nExemple: `,filter exempt @Moderator`',
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
  if (!guildData.settings.filter) guildData.settings.filter = {};
  if (!guildData.settings.filter.exempt) guildData.settings.filter.exempt = [];

  if (guildData.settings.filter.exempt.includes(role.id)) {
    guildData.settings.filter.exempt = guildData.settings.filter.exempt.filter(id => id !== role.id);
    const successEmbed = createEmbed('success', {
      title: 'Rôle retiré des exemptions',
      description: `${role} n'est plus exempté des filtres.`,
    });
    message.reply({ embeds: [successEmbed] });
  } else {
    guildData.settings.filter.exempt.push(role.id);
    const successEmbed = createEmbed('success', {
      title: 'Rôle exempté',
      description: `${role} est maintenant exempté des filtres.`,
    });
    message.reply({ embeds: [successEmbed] });
  }

  saveGuildData(message.guild.id, guildData);
}

async function filterExemptList(message) {
  const guildData = getGuildData(message.guild.id);
  const exemptRoles = guildData.settings?.filter?.exempt || [];

  if (exemptRoles.length === 0) {
    const embed = createEmbed('info', {
      title: 'Rôles exemptés',
      description: 'Aucun rôle exempté des filtres.',
    });
    return message.reply({ embeds: [embed] });
  }

  const rolesList = exemptRoles
    .map(id => {
      const role = message.guild.roles.cache.get(id);
      return role ? role.toString() : null;
    })
    .filter(Boolean)
    .join(', ');

  const embed = createEmbed('settings', {
    title: '🛡️ Rôles exemptés',
    description: rolesList || 'Aucun rôle valide',
  });

  message.reply({ embeds: [embed] });
}
