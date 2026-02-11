import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'boost',
    description: 'Afficher les informations sur les boosts du serveur',
  },
  execute: async (message, args) => {
    const guild = message.guild;
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;

    const levelNames = {
      0: 'Niveau 0',
      1: 'Niveau 1',
      2: 'Niveau 2',
      3: 'Niveau 3',
    };

    const levelBenefits = {
      0: 'Aucun boost',
      1: 'Qualité audio 128kbps, emojis animés, bannière de serveur',
      2: 'Qualité audio 256kbps, 300 emojis, bannière animée',
      3: 'Qualité audio 384kbps, 500 emojis, bannière animée, qualité vidéo améliorée',
    };

    const nextLevelBoosts = {
      0: 2,
      1: 7,
      2: 14,
    };

    const embed = createEmbed('boosterrole', {
      title: 'Informations sur les boosts',
      fields: [
        {
          name: 'Niveau actuel',
          value: levelNames[boostLevel] || 'Niveau 0',
          inline: true,
        },
        {
          name: 'Boosts',
          value: `${boostCount}`,
          inline: true,
        },
        {
          name: 'Avantages actuels',
          value: levelBenefits[boostLevel] || 'Aucun',
          inline: false,
        },
        ...(boostLevel < 3 ? [{
          name: 'Prochain niveau',
          value: `Niveau ${boostLevel + 1} (${nextLevelBoosts[boostLevel] || 0} boosts nécessaires)`,
          inline: false,
        }] : []),
      ],
    });

    if (guild.premiumTier >= 2 && guild.banner) {
      embed.setImage(guild.bannerURL({ size: 512 }));
    }

    message.reply({ embeds: [embed] });
  },
};
