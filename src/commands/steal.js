import { createEmbed } from '../utils/embeds.js';
import { AttachmentBuilder } from 'discord.js';

export default {
  data: {
    name: 'steal',
    description: 'Cloner des emojis depuis d\'autres serveurs (un ou plusieurs)',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('ManageEmojisAndStickers')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Gérer les emojis et stickers".',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!args[0]) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez fournir un ou plusieurs emojis à cloner.\nExemple: `,steal :emoji:` ou `,steal <emoji1> <emoji2> <emoji3>`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    // Extraire tous les emojis des arguments
    const emojiRegex = /<a?:(\w+):(\d+)>/g;
    const emojiInputs = message.content.match(emojiRegex) || [];

    if (emojiInputs.length === 0) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Aucun emoji valide trouvé. Mentionnez des emojis personnalisés.\nExemple: `,steal :emoji1: :emoji2:`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    // Vérifier le nombre d'emojis sur le serveur
    const emojiCount = message.guild.emojis.cache.size;
    const maxEmojis = message.guild.premiumTier === 'TIER_3' ? 500 : 
                     message.guild.premiumTier === 'TIER_2' ? 300 :
                     message.guild.premiumTier === 'TIER_1' ? 100 : 50;

    const availableSlots = maxEmojis - emojiCount;
    if (availableSlots <= 0) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Le serveur a atteint la limite d'emojis (${maxEmojis}).`,
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    // Limiter le nombre d'emojis à traiter selon les slots disponibles
    const emojisToProcess = emojiInputs.slice(0, availableSlots);
    if (emojiInputs.length > availableSlots) {
      const warningEmbed = createEmbed('warning', {
        title: 'Limite atteinte',
        description: `Seulement ${availableSlots} emoji(s) seront traités sur ${emojiInputs.length} demandés.`,
      });
      await message.reply({ embeds: [warningEmbed] });
    }

    const loadingEmbed = createEmbed('info', {
      title: '⏳ Clonage en cours...',
      description: `Clonage de ${emojisToProcess.length} emoji(s)...`,
    });
    const loadingMessage = await message.reply({ embeds: [loadingEmbed] });

    const successful = [];
    const failed = [];
    const skipped = [];

    for (const emojiInput of emojisToProcess) {
      try {
        // Extraire les informations de l'emoji
        const match = emojiInput.match(/<a?:(\w+):(\d+)>/);
        if (!match) continue;

        const emojiName = match[1];
        const emojiId = match[2];
        const isAnimated = emojiInput.startsWith('<a:');

        // Vérifier si l'emoji existe déjà
        const existingEmoji = message.guild.emojis.cache.find(e => e.name === emojiName);
        if (existingEmoji) {
          skipped.push({ name: emojiName, reason: 'Déjà existant' });
          continue;
        }

        // Télécharger l'emoji
        const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;
        const response = await fetch(emojiUrl);
        if (!response.ok) {
          failed.push({ name: emojiName, reason: 'Impossible de télécharger' });
          continue;
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        // Créer l'emoji
        const newEmoji = await message.guild.emojis.create({
          attachment: buffer,
          name: emojiName,
          reason: `Emoji cloné par ${message.author.tag}`,
        });

        successful.push({ emoji: newEmoji, name: emojiName, animated: isAnimated });
      } catch (error) {
        console.error('Erreur lors du clonage d\'un emoji:', error);
        const match = emojiInput.match(/<a?:(\w+):(\d+)>/);
        failed.push({ name: match ? match[1] : 'Inconnu', reason: error.message || 'Erreur inconnue' });
      }
    }

    // Créer l'embed de résultat
    const fields = [];

    if (successful.length > 0) {
      const emojiList = successful.slice(0, 10).map(s => `${s.emoji} \`${s.name}\``).join('\n');
      fields.push({
        name: `✅ Clonés (${successful.length})`,
        value: emojiList + (successful.length > 10 ? `\n... et ${successful.length - 10} autre(s)` : ''),
        inline: false,
      });
    }

    if (skipped.length > 0) {
      const skippedList = skipped.slice(0, 5).map(s => `\`${s.name}\``).join(', ');
      fields.push({
        name: `⏭️ Ignorés (${skipped.length})`,
        value: skippedList + (skipped.length > 5 ? `...` : '') + '\n*Déjà existants sur le serveur*',
        inline: false,
      });
    }

    if (failed.length > 0) {
      const failedList = failed.slice(0, 5).map(f => `\`${f.name}\`: ${f.reason}`).join('\n');
      fields.push({
        name: `❌ Échoués (${failed.length})`,
        value: failedList + (failed.length > 5 ? `\n... et ${failed.length - 5} autre(s)` : ''),
        inline: false,
      });
    }

    fields.push({
      name: '📊 Résumé',
      value: `✅ ${successful.length} | ⏭️ ${skipped.length} | ❌ ${failed.length}`,
      inline: true,
    });

    const resultEmbed = createEmbed(successful.length > 0 ? 'success' : 'error', {
      title: successful.length > 0 ? 'Clonage terminé' : 'Aucun emoji cloné',
      description: successful.length > 0 
        ? `${successful.length} emoji(s) cloné(s) avec succès !`
        : 'Aucun emoji n\'a pu être cloné.',
      fields: fields,
    });

    await loadingMessage.edit({ embeds: [resultEmbed] });
  },
};
