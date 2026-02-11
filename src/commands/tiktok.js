import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tiktok')
    .setDescription('Télécharge et affiche une vidéo TikTok')
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('Lien de la vidéo TikTok')
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString('url');

    // Vérifier que c'est bien un lien TikTok
    if (!url.includes('tiktok.com')) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez fournir un lien TikTok valide.',
      });
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // Utiliser vxtiktok pour contourner l'embed Discord
      const fixedUrl = url.replace('tiktok.com', 'vxtiktok.com');

      await interaction.editReply({
        content: `📱 **TikTok** de ${interaction.user}\n${fixedUrl}`,
      });
    } catch (error) {
      console.error('Erreur TikTok:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de charger la vidéo: ${error.message}`,
      });
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
