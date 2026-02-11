import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'emojis',
    description: 'Voir tous les emojis d\'un serveur',
  },
  execute: async (message, args) => {
    const targetGuild = message.guild;
    const emojis = targetGuild.emojis.cache;

    if (emojis.size === 0) {
      const embed = createEmbed('info', {
        title: '😀 Emojis du serveur',
        description: 'Ce serveur n\'a aucun emoji personnalisé.',
      });
      return message.reply({ embeds: [embed] });
    }

    const animatedEmojis = emojis.filter(e => e.animated);
    const staticEmojis = emojis.filter(e => !e.animated);

    const maxEmojis = targetGuild.premiumTier === 'TIER_3' ? 500 : 
                     targetGuild.premiumTier === 'TIER_2' ? 300 :
                     targetGuild.premiumTier === 'TIER_1' ? 100 : 50;

    // Afficher les emojis par pages (max 20 par page)
    const emojiList = Array.from(emojis.values());
    const page = parseInt(args[0]) || 1;
    const perPage = 20;
    const totalPages = Math.ceil(emojiList.length / perPage);
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageEmojis = emojiList.slice(start, end);

    const emojiText = pageEmojis.map(e => `${e} \`${e.name}\``).join('\n') || 'Aucun';

    const embed = createEmbed('default', {
      title: `😀 Emojis de ${targetGuild.name}`,
      description: emojiText,
      fields: [
        {
          name: '📊 Statistiques',
          value: [
            `Total: ${emojis.size}/${maxEmojis}`,
            `Animés: ${animatedEmojis.size}`,
            `Statiques: ${staticEmojis.size}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '📄 Page',
          value: `${page}/${totalPages}`,
          inline: true,
        },
      ],
      footer: totalPages > 1 ? { text: `Utilisez ,emojis <page> pour voir d'autres pages` } : undefined,
    });

    message.reply({ embeds: [embed] });
  },
};
