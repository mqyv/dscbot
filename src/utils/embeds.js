import { EmbedBuilder } from 'discord.js';

/**
 * Crée un embed avec le style bleed (fond gris clair, design moderne)
 * @param {string} type - Type d'embed: 'default', 'success', 'error', 'warning', 'info'
 * @param {Object} options - Options de l'embed
 * @returns {EmbedBuilder}
 */
export function createEmbed(type = 'default', options = {}) {
  const {
    title,
    description,
    fields = [],
    footer,
    thumbnail,
    image,
    color,
    timestamp,
    author,
  } = options;

  // Couleurs selon le type
  const colors = {
    default: 0x5865F2,   // Bleu Discord
    success: 0x57F287,   // Vert Discord
    error: 0xED4245,     // Rouge Discord
    warning: 0xFEE75C,   // Jaune Discord
    info: 0x5865F2,      // Bleu Discord
    prefix: 0x5865F2,
    settings: 0x5865F2,
    boosterrole: 0xFF73FA,
    moderation: 0xED4245,
    fun: 0xFEE75C,
    utility: 0x57F287,
  };

  const embed = new EmbedBuilder()
    .setColor(color || colors[type] || colors.default);

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (timestamp) embed.setTimestamp(timestamp === true ? new Date() : timestamp);
  if (author) {
    if (typeof author === 'string') {
      embed.setAuthor({ name: author });
    } else {
      embed.setAuthor(author);
    }
  }

  // Ajouter les champs
  if (fields.length > 0) {
    embed.addFields(fields.map(field => {
      if (typeof field === 'string') {
        return { name: '\u200b', value: field, inline: false };
      }
      return field;
    }));
  }

  // Footer si spécifié
  if (footer) {
    if (typeof footer === 'string') {
      embed.setFooter({ text: footer });
    } else {
      embed.setFooter(footer);
    }
  }

  return embed;
}

/**
 * Formatte une date au format français
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat('fr-FR', { ...defaultOptions, ...options }).format(date);
}

/**
 * Formatte une date au style bleed (MM/DD/YYYY, HH:MM)
 */
export function formatBleedDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day}/${year}, ${hours}:${minutes}`;
}

/**
 * Calcule le temps écoulé depuis une date
 */
export function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `il y a ${years} an${years > 1 ? 's' : ''}`;
  if (months > 0) return `il y a ${months} mois`;
  if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `il y a ${seconds} seconde${seconds > 1 ? 's' : ''}`;
}
