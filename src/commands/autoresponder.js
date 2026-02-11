import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'autoresponder',
    description: 'Gérer les réponses automatiques',
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
      case 'add':
        await autoresponderAdd(message, args.slice(1));
        break;
      case 'remove':
      case 'rm':
        await autoresponderRemove(message, args.slice(1));
        break;
      case 'list':
        await autoresponderList(message);
        break;
      default:
        const embed = createEmbed('settings', {
          title: 'Réponses automatiques',
          description: 'Commandes disponibles :',
          fields: [
            { name: '`,autoresponder add <trigger> <réponse>`', value: 'Ajouter une réponse automatique', inline: false },
            { name: '`,autoresponder remove <trigger>`', value: 'Supprimer une réponse automatique', inline: false },
            { name: '`,autoresponder list`', value: 'Voir toutes les réponses automatiques', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
    }
  },
};

async function autoresponderAdd(message, args) {
  if (args.length < 2) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un déclencheur et une réponse.\nExemple: `,autoresponder add bonjour Salut !`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const trigger = args[0].toLowerCase();
  const response = args.slice(1).join(' ');

  const guildData = getGuildData(message.guild.id);
  if (!guildData.autoresponders) {
    guildData.autoresponders = {};
  }

  guildData.autoresponders[trigger] = response;
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Réponse automatique ajoutée',
    description: `Quand quelqu'un dit "${trigger}", le bot répondra : "${response}"`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function autoresponderRemove(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier un déclencheur à supprimer.\nExemple: `,autoresponder remove bonjour`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  const trigger = args[0].toLowerCase();
  const guildData = getGuildData(message.guild.id);

  if (!guildData.autoresponders || !guildData.autoresponders[trigger]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Aucune réponse automatique trouvée pour "${trigger}".`,
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  delete guildData.autoresponders[trigger];
  saveGuildData(message.guild.id, guildData);

  const successEmbed = createEmbed('success', {
    title: 'Réponse automatique supprimée',
    description: `La réponse automatique pour "${trigger}" a été supprimée.`,
  });

  message.reply({ embeds: [successEmbed] });
}

async function autoresponderList(message) {
  const guildData = getGuildData(message.guild.id);
  const responders = guildData.autoresponders || {};

  if (Object.keys(responders).length === 0) {
    const embed = createEmbed('info', {
      title: 'Réponses automatiques',
      description: 'Aucune réponse automatique configurée.',
    });
    return message.reply({ embeds: [embed] });
  }

  const responderList = Object.entries(responders)
    .map(([trigger, response]) => `**${trigger}** → ${response}`)
    .join('\n');

  const embed = createEmbed('info', {
    title: 'Réponses automatiques',
    description: responderList,
    fields: [
      {
        name: 'Total',
        value: `${Object.keys(responders).length}`,
        inline: true,
      },
    ],
  });

  message.reply({ embeds: [embed] });
}
