import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'renew',
    description: 'Supprime et recrée un canal au même endroit avec les mêmes permissions',
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
    let targetChannel = message.mentions.channels.first();
    
    if (!targetChannel) {
      // Si aucun canal n'est mentionné, utiliser le canal actuel
      targetChannel = message.channel;
    }

    // Ne pas permettre de renouveler les catégories
    if (targetChannel.type === 4) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Impossible de renouveler une catégorie.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      // Sauvegarder toutes les propriétés du canal
      const channelData = {
        name: targetChannel.name,
        type: targetChannel.type,
        topic: targetChannel.topic,
        nsfw: targetChannel.nsfw,
        position: targetChannel.position,
        parent: targetChannel.parent,
        permissionOverwrites: targetChannel.permissionOverwrites.cache,
        rateLimitPerUser: targetChannel.rateLimitPerUser,
        bitrate: targetChannel.bitrate,
        userLimit: targetChannel.userLimit,
        rtcRegion: targetChannel.rtcRegion,
        videoQualityMode: targetChannel.videoQualityMode,
      };

      // Afficher un message de chargement
      const loadingEmbed = createEmbed('info', {
        title: 'Renouvellement du canal...',
        description: `Renouvellement de ${targetChannel} en cours...`,
      });
      const loadingMessage = await message.reply({ embeds: [loadingEmbed] });

      // Convertir les permission overwrites en format pour la création
      const permissionOverwrites = Array.from(channelData.permissionOverwrites.values()).map(overwrite => ({
        id: overwrite.id,
        type: overwrite.type,
        allow: overwrite.allow.bitfield,
        deny: overwrite.deny.bitfield,
      }));

      // Préparer les options de création selon le type de canal
      const createOptions = {
        name: channelData.name,
        type: channelData.type,
        topic: channelData.topic,
        nsfw: channelData.nsfw,
        position: channelData.position,
        parent: channelData.parent,
        permissionOverwrites: permissionOverwrites,
        rateLimitPerUser: channelData.rateLimitPerUser,
        reason: `Canal renouvelé par ${message.author.tag}`,
      };

      // Ajouter les options spécifiques aux canaux vocaux
      if (targetChannel.isVoiceBased()) {
        createOptions.bitrate = channelData.bitrate;
        createOptions.userLimit = channelData.userLimit;
        createOptions.rtcRegion = channelData.rtcRegion;
        createOptions.videoQualityMode = channelData.videoQualityMode;
      }

      // Supprimer le canal
      await targetChannel.delete(`Canal renouvelé par ${message.author.tag}`);

      // Recréer le canal
      const newChannel = await message.guild.channels.create(createOptions);

      // Envoyer un message de confirmation dans le nouveau canal
      const successEmbed = createEmbed('success', {
        title: 'Canal renouvelé',
        description: `Le canal ${newChannel} a été renouvelé avec succès !`,
        fields: [
          {
            name: 'Détails',
            value: `Canal recréé avec les mêmes permissions et paramètres`,
            inline: false,
          },
        ],
      });

      await newChannel.send({ embeds: [successEmbed] }).catch(() => {});

      // Supprimer le message de chargement
      await loadingMessage.delete().catch(() => {});

    } catch (error) {
      console.error('Erreur lors du renouvellement du canal:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de renouveler le canal: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
  },
};
