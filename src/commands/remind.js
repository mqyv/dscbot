import { createEmbed } from '../utils/embeds.js';
import { getPrefix } from '../utils/database.js';

const reminders = new Map(); // userId -> [{ id, timeout, message }]

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d|min)$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1, m: 60, min: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] || 1) * 1000;
}

export default {
  data: {
    name: 'remind',
    description: 'Programmer un rappel (MP ou serveur)',
  },
  execute: async (message, args) => {
    if (!args.length) {
      const prefix = getPrefix(message.guild?.id, message.author.id);
      const embed = createEmbed('info', {
        title: '⏰ Rappels',
        description: `**Utilisation:** \`${prefix}remind <durée> <message>\`\n\n**Exemples:**\n\`${prefix}remind 5m Appeler maman\`\n\`${prefix}remind 1h Pause déjeuner\`\n\`${prefix}remind 30s Test\`\n\n**Formats:** s (secondes), m/min (minutes), h (heures), d (jours)`,
      });
      return message.reply({ embeds: [embed] });
    }

    const durationStr = args[0];
    const reminderMsg = args.slice(1).join(' ') || 'Rappel !';
    const duration = parseDuration(durationStr);

    if (!duration || duration < 1000) {
      const errorEmbed = createEmbed('error', {
        title: 'Durée invalide',
        description: 'Utilisez un format comme: 30s, 5m, 1h, 2d',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (duration > 7 * 24 * 60 * 60 * 1000) {
      const errorEmbed = createEmbed('error', {
        title: 'Durée trop longue',
        description: 'Le rappel maximum est de 7 jours.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const timeout = setTimeout(async () => {
      try {
        const embed = createEmbed('success', {
          title: '⏰ Rappel !',
          description: reminderMsg,
          footer: { text: `Programmé il y a ${durationStr}` },
        });
        await message.author.send({ embeds: [embed], content: `${message.author}` }).catch(() => {
          message.channel.send({ embeds: [embed], content: `${message.author}` }).catch(() => {});
        });
      } catch (e) {
        console.error('Erreur rappel:', e);
      }
      const userReminders = reminders.get(message.author.id) || [];
      reminders.set(message.author.id, userReminders.filter(r => r.timeout !== timeout));
    }, duration);

    const userReminders = reminders.get(message.author.id) || [];
    userReminders.push({ id: Date.now(), timeout, message: reminderMsg });
    reminders.set(message.author.id, userReminders);

    const successEmbed = createEmbed('success', {
      title: '⏰ Rappel programmé',
      description: `Je te rappellerai dans **${durationStr}** :\n${reminderMsg}`,
    });
    message.reply({ embeds: [successEmbed] });
  },
};
