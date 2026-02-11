import { createEmbed } from '../utils/embeds.js';
import { getUserData, saveUserData } from '../utils/database.js';

export default {
  data: {
    name: 'prevname',
    description: 'Affiche les anciens pseudos d\'un utilisateur',
  },
  execute: async (message, args) => {
    let userId = args[0];
    let targetUser;

    // Si mention
    if (message.mentions.users.first()) {
      targetUser = message.mentions.users.first();
      userId = targetUser.id;
    } 
    // Si ID fourni
    else if (userId && /^\d{17,19}$/.test(userId)) {
      try {
        targetUser = await message.client.users.fetch(userId);
      } catch (e) {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: 'Utilisateur introuvable avec cet ID.',
        });
        return message.reply({ embeds: [errorEmbed] });
      }
    } 
    // Sinon, utiliser l'auteur
    else {
      targetUser = message.author;
      userId = message.author.id;
    }

    const userData = getUserData(userId);
    const previousNames = userData.previousNames || [];

    if (previousNames.length === 0) {
      const infoEmbed = createEmbed('info', {
        title: 'Anciens pseudos',
        description: `Aucun ancien pseudo enregistré pour **${targetUser.username}**.`,
      });
      return message.reply({ embeds: [infoEmbed] });
    }

    const namesList = previousNames
      .slice(-20) // Limiter aux 20 derniers
      .reverse()
      .map((entry, index) => {
        const date = new Date(entry.timestamp);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        return `\`${index + 1}.\` **${entry.name}** - ${formattedDate}`;
      })
      .join('\n');

    const embed = createEmbed('info', {
      title: `Anciens pseudos de ${targetUser.username}`,
      description: namesList,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true, size: 256 }),
      footer: { text: `ID: ${userId} • ${previousNames.length} pseudo(s) enregistré(s)` },
    });

    message.reply({ embeds: [embed] });
  },
};
