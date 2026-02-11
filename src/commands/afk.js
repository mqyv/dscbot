import { createEmbed } from '../utils/embeds.js';
import { getUserData, saveUserData } from '../utils/database.js';

export default {
  data: {
    name: 'afk',
    description: 'Marque comme absent avec une raison',
  },
  execute: async (message, args) => {
    const reason = args.join(' ') || 'AFK';
    const userData = getUserData(message.author.id);
    
    userData.afk = {
      reason: reason,
      timestamp: Date.now(),
    };
    
    saveUserData(message.author.id, userData);
    
    const embed = createEmbed('success', {
      title: 'AFK activé',
      description: `Raison: ${reason}`,
    });
    
    message.reply({ embeds: [embed] });
  },
};
