/**
 * Emojis personnalisés - utilisés si le serveur les possède, sinon fallback Unicode
 */
const E_CUSTOM = {
  success: '<:Emoji_Green_Stock:1473672661832826951>',
  error: '<:Emoji_Pink_Question:1473669815414554765>',
  loading: '<a:Emoji_Blue_loading:1473672628794556589>',
  warning: '<a:Emoji_Yellow_Star:1473672666131988775>',
  info: '<:Icon_Blue_Annonce:1473672615557337221>',
  skipped: '<:Icon_Grey_Link:1473672655382249554>',
  stats: '<:Emoji_White_Money:1473672617847423128>',
  ticket: '<:Icon_Verified:1473672631768059905>',
  gift: '<a:Emoji_Yellow_Flwrs:1473668898347024571>',
  celebration: '<a:Emoji_Yellow_Star:1473672666131988775>',
  lock: '<:Icon_White_Moderation:1473668892642508911>',
  notes: '<:Icon_Grey_Request:1473672652978786325>',
  reminder: '<a:Emoji_Blue_loading:1473672628794556589>',
  dice: '<:Emoji_White_Money:1473672617847423128>',
  book: '<:Emoji_Orange_web:1473672649904226394>',
  list: '<:Icon_Blue_Rules:1473672620745560116>',
  crown: '<:Icon_Couronne:1473672638340530267>',
  boost: '<:Icon_Boost:1473672635534544999>',
  star: '<:Icon_Star:1473672641658355713>',
  search: '<a:Emoji_Grey_Search:1473666327976612028>',
};

const E_DEFAULT = {
  success: '✅',
  error: '❌',
  loading: '⏳',
  warning: '⚠️',
  info: 'ℹ️',
  skipped: '⏭️',
  stats: '📊',
  ticket: '🎫',
  gift: '🎁',
  celebration: '🎉',
  lock: '🔒',
  notes: '📝',
  reminder: '⏰',
  dice: '🎲',
  book: '📖',
  list: '📋',
  crown: '👑',
  boost: '⚡',
  star: '⭐',
  search: '🔍',
};

const EMOJI_CHECK_ID = '1473672661832826951';

/** Retourne les emojis à utiliser : custom si le serveur les a, sinon Unicode */
export function getE(guild) {
  if (!guild?.emojis?.cache?.has(EMOJI_CHECK_ID)) {
    return E_DEFAULT;
  }
  return E_CUSTOM;
}

/** Pour compatibilité : utilise les emojis par défaut (Unicode) - toujours visibles */
export const E = E_DEFAULT;
