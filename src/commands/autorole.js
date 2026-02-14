import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'autorole',
    description: "Gérer le rôle automatique à l'arrivée des membres",
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
      case 'set':
        await autoroleSet(message, args.slice(1));
        break;
      case 'remove':
        await autoroleRemove(message);
        break;
      case 'view':
        await autoroleView(message);
        break;
      default:
        const embed = createEmbed('settings', {
          title: "Système d'autorole",
          description: "Rôle attribué automatiquement aux nouveaux membres à leur arrivée sur le serveur.",
          fields: [
            { name: '`,autorole set <rôle>`', value: "Définir le rôle automatique", inline: false },
            { name: '`,autorole remove`', value: "Désactiver l'autorole", inline: false },
            { name: '`,autorole view`', value: "Voir le rôle actuellement configuré", inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
        break;
    }
  },
};

async function autoroleSet(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez mentionner un rôle.\nExemple: `,autorole set @Membre`',
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

  // Vérifier que le rôle du bot est au-dessus du rôle à attribuer
  const botMember = message.guild.members.me;
  if (botMember.roles.highest.position <= role.position) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Le rôle ${role} est au-dessus ou au même niveau que mon rôle. Placez mon rôle au-dessus pour que je puisse l'attribuer.`,
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings) guildData.settings = {};
  guildData.settings.autorole = role.id;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Autorole configuré',
    description: `Le rôle ${role} sera désormais attribué automatiquement aux nouveaux membres.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function autoroleRemove(message) {
  const guildData = getGuildData(message.guild.id);
  if (!guildData.settings?.autorole) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: "Aucun autorole n'est configuré.",
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  delete guildData.settings.autorole;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Autorole désactivé',
    description: "Le rôle automatique a été retiré. Les nouveaux membres n'auront plus de rôle attribué.",
  });

  message.reply({ embeds: [successEmbed] });
}

async function autoroleView(message) {
  const guildData = getGuildData(message.guild.id);
  const autoroleId = guildData.settings?.autorole;

  if (!autoroleId) {
    const embed = createEmbed('info', {
      title: "Autorole actuel",
      description: "Aucun autorole configuré.",
    });
    return message.reply({ embeds: [embed] });
  }

  const role = message.guild.roles.cache.get(autoroleId);
  const embed = createEmbed('settings', {
    title: "Autorole actuel",
    description: role ? `Le rôle ${role} est attribué aux nouveaux membres.` : `Rôle ID: \`${autoroleId}\` (rôle peut-être supprimé)`,
  });

  message.reply({ embeds: [embed] });
}
