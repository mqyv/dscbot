// Stockage des messages supprimés pour la commande snipe
const snipes = new Map();

export function addSnipe(channelId, message) {
  // Stocker seulement les informations nécessaires
  const snipeData = {
    content: message.content || '',
    author: message.author,
    authorId: message.author?.id,
    authorTag: message.author?.tag,
    channelId: message.channel?.id || channelId,
    createdAt: message.createdAt || new Date(),
    attachments: message.attachments?.map(att => ({
      url: att.url,
      name: att.name,
      proxyURL: att.proxyURL,
    })) || [],
    embeds: message.embeds?.length > 0 ? true : false,
  };
  
  snipes.set(channelId, snipeData);
  
  // Supprimer après 5 minutes
  setTimeout(() => {
    snipes.delete(channelId);
  }, 300000);
}

export function getSnipe(channelId) {
  return snipes.get(channelId) || null;
}

export function deleteSnipe(channelId) {
  snipes.delete(channelId);
}
