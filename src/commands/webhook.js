import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'webhook',
    description: 'Gérer les webhooks',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageWebhooks')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer les webhooks" pour utiliser cette commande.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'create':
        await webhookCreate(message, args.slice(1));
        break;
      case 'list':
        await webhookList(message);
        break;
      case 'delete':
        await webhookDelete(message, args.slice(1));
        break;
      default:
        const embed = createEmbed('settings', {
          title: 'Gestion des webhooks',
          description: 'Commandes disponibles :',
          fields: [
            { name: '`,webhook create <nom>`', value: 'Créer un webhook dans ce salon', inline: false },
            { name: '`,webhook list`', value: 'Voir tous les webhooks du salon', inline: false },
            { name: '`,webhook delete <id>`', value: 'Supprimer un webhook', inline: false },
          ],
        });
        message.reply({ embeds: [embed] });
    }
  },
};

async function webhookCreate(message, args) {
  const name = args.join(' ') || `Webhook-${message.author.username}`;

  try {
    const webhook = await message.channel.createWebhook({
      name: name,
      avatar: message.author.displayAvatarURL(),
    });

    const successEmbed = createEmbed('success', {
      title: 'Webhook créé',
      description: `Le webhook "${name}" a été créé.`,
      fields: [
        {
          name: 'URL',
          value: `\`${webhook.url}\``,
          inline: false,
        },
        {
          name: 'ID',
          value: webhook.id,
          inline: true,
        },
      ],
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de créer le webhook: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function webhookList(message) {
  try {
    const webhooks = await message.channel.fetchWebhooks();
    
    if (webhooks.size === 0) {
      const embed = createEmbed('info', {
        title: 'Webhooks',
        description: 'Aucun webhook dans ce salon.',
      });
      return message.reply({ embeds: [embed] });
    }

    const webhookList = Array.from(webhooks.values())
      .map(wh => `**${wh.name}** (ID: ${wh.id})`)
      .join('\n');

    const embed = createEmbed('info', {
      title: 'Webhooks du salon',
      description: webhookList,
      fields: [
        {
          name: 'Total',
          value: `${webhooks.size}`,
          inline: true,
        },
      ],
    });

    message.reply({ embeds: [embed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de récupérer les webhooks: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}

async function webhookDelete(message, args) {
  if (!args[0]) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: 'Veuillez spécifier l\'ID du webhook à supprimer.\nExemple: `,webhook delete 123456789012345678`',
    });
    return message.reply({ embeds: [errorEmbed] });
  }

  try {
    const webhooks = await message.channel.fetchWebhooks();
    const webhook = webhooks.get(args[0]);

    if (!webhook) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Webhook introuvable.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    await webhook.delete();

    const successEmbed = createEmbed('success', {
      title: 'Webhook supprimé',
      description: `Le webhook "${webhook.name}" a été supprimé.`,
    });

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    const errorEmbed = createEmbed('error', {
      title: 'Erreur',
      description: `Impossible de supprimer le webhook: ${error.message}`,
    });
    message.reply({ embeds: [errorEmbed] });
  }
}
