import { createEmbed } from '../utils/embeds.js';
import { getE } from '../utils/emojis.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: {
    name: 'suggest',
    description: 'Créer une suggestion',
  },
  execute: async (message, args) => {
    if (!args.length) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez fournir une suggestion.\nExemple: `,suggest Ajouter un salon de musique`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const suggestion = args.join(' ');
    const guildData = getGuildData(message.guild.id);
    
    // Obtenir le canal de suggestions (si configuré)
    const suggestionsChannelId = guildData.settings?.suggestionsChannel;
    let targetChannel = message.channel;
    
    if (suggestionsChannelId) {
      const channel = message.guild.channels.cache.get(suggestionsChannelId);
      if (channel) {
        targetChannel = channel;
      }
    }

    const embed = createEmbed('info', {
      title: 'Nouvelle suggestion',
      description: suggestion,
      fields: [
        {
          name: 'Auteur',
          value: `${message.author} (${message.author.tag})`,
          inline: true,
        },
        {
          name: 'Statut',
          value: 'En attente',
          inline: true,
        },
      ],
      footer: { text: `Suggestion #${(guildData.suggestions?.length || 0) + 1}` },
    });

    const suggestionMessage = await targetChannel.send({ embeds: [embed] });
    const e = getE(message.guild);
    await suggestionMessage.react(e.success).catch(() => suggestionMessage.react('✅'));
    await suggestionMessage.react(e.error).catch(() => suggestionMessage.react('❌'));

    // Sauvegarder la suggestion
    if (!guildData.suggestions) {
      guildData.suggestions = [];
    }
    guildData.suggestions.push({
      id: suggestionMessage.id,
      authorId: message.author.id,
      channelId: targetChannel.id,
      content: suggestion,
      createdAt: Date.now(),
    });
    saveGuildData(message.guild.id, guildData);

    const successEmbed = createEmbed('success', {
      title: 'Suggestion créée',
      description: `Votre suggestion a été créée dans ${targetChannel}.`,
    });

    message.reply({ embeds: [successEmbed] });
  },
};
