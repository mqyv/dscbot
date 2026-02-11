import { createEmbed } from '../utils/embeds.js';
import { config } from 'dotenv';

config();

export default {
  data: {
    name: 'invite',
    description: 'Obtenir le lien d\'invitation du bot',
  },
  execute: async (message) => {
    const clientId = process.env.CLIENT_ID || message.client.user.id;
    const permissions = '8'; // Administrateur par défaut
    
    // Permissions recommandées pour toutes les fonctionnalités
    const recommendedPermissions = [
      '8', // Administrateur
      // Ou permissions individuelles :
      // '268435456', // View Channels
      // '536870912', // Send Messages
      // '1073741824', // Manage Messages
      // '4', // Manage Channels
      // '16', // Manage Guild
      // '2', // Kick Members
      // '4', // Ban Members
      // '1099511627776', // Moderate Members
      // '8589934592', // Manage Roles
      // '274877906944', // Manage Webhooks
    ];

    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;

    const embed = createEmbed('info', {
      title: '🔗 Lien d\'invitation du bot',
      description: `Cliquez sur le lien ci-dessous pour inviter le bot sur votre serveur :`,
      fields: [
        {
          name: '📋 Lien d\'invitation',
          value: `[Inviter le bot](${inviteUrl})`,
          inline: false,
        },
        {
          name: '⚙️ Permissions',
          value: 'Administrateur (recommandé pour toutes les fonctionnalités)',
          inline: false,
        },
        {
          name: '💡 Note',
          value: 'Vous pouvez copier le lien et l\'utiliser pour inviter le bot sur d\'autres serveurs.',
          inline: false,
        },
      ],
    });

    // Envoyer aussi le lien en texte pour faciliter la copie
    const reply = await message.reply({ embeds: [embed] });
    
    // Envoyer aussi le lien brut dans un message séparé pour faciliter la copie
    await message.channel.send(`\`${inviteUrl}\``).catch(() => {});
  },
};
