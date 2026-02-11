import { createEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logs.js';

export default {
  data: {
    name: 'hideall',
    description: 'Cache tous les salons d\'une catégorie',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageChannels')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer les canaux" pour utiliser cette commande.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    // Récupérer le canal (le canal actuel si aucun n'est mentionné)
    const channel = message.mentions.channels.first() || message.channel;

    if (!channel) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez mentionner un canal ou utiliser cette commande dans un canal.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    // Vérifier que le canal appartient à une catégorie
    if (!channel.parent) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Ce canal n\'appartient à aucune catégorie.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const category = channel.parent;
    const channelsInCategory = message.guild.channels.cache.filter(
      c => c.parentId === category.id && c.type !== 4 // Exclure les catégories elles-mêmes
    );

    if (channelsInCategory.size === 0) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Aucun salon trouvé dans cette catégorie.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      const loadingEmbed = createEmbed('info', {
        title: 'Masquage en cours...',
        description: `Masquage de ${channelsInCategory.size} salon(s) dans la catégorie **${category.name}**...`,
      });
      const loadingMessage = await message.reply({ embeds: [loadingEmbed] });

      let hiddenCount = 0;
      let failedCount = 0;
      const failedChannels = [];

      // Cacher tous les salons de la catégorie
      for (const targetChannel of channelsInCategory.values()) {
        try {
          await targetChannel.permissionOverwrites.edit(message.guild.roles.everyone, {
            ViewChannel: false,
          });
          hiddenCount++;
        } catch (error) {
          console.error(`Erreur lors du masquage de ${targetChannel.name}:`, error);
          failedCount++;
          failedChannels.push(targetChannel.name);
        }
      }

      const fields = [
        {
          name: '📊 Résultats',
          value: `✅ Cachés: ${hiddenCount}\n❌ Échoués: ${failedCount}`,
          inline: true,
        },
        {
          name: 'Catégorie',
          value: category.name,
          inline: true,
        },
      ];

      if (failedChannels.length > 0) {
        fields.push({
          name: 'Salons échoués',
          value: failedChannels.slice(0, 10).join(', ') + (failedChannels.length > 10 ? '...' : ''),
          inline: false,
        });
      }

      const successEmbed = createEmbed('success', {
        title: 'Catégorie cachée',
        description: `${hiddenCount} salon(s) ont été cachés avec succès dans la catégorie **${category.name}**.`,
        fields: fields,
      });

      await loadingMessage.edit({ embeds: [successEmbed] });

      await sendLog(message.guild, 'mod', {
        action: 'Catégorie cachée',
        description: `Tous les salons de la catégorie ${category.name} ont été cachés.`,
        moderator: message.author,
        target: { id: category.id, tag: category.name },
        reason: `Commande \`hideall\` par ${message.author.tag}`,
      });
    } catch (error) {
      console.error('Erreur lors du masquage de la catégorie:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de cacher la catégorie: ${error.message}`,
      });
      await message.reply({ embeds: [errorEmbed] });
    }
  },
};
