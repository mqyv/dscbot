import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reels')
    .setDescription('Affiche un Reels Instagram')
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('Lien du Reels Instagram')
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString('url');

    // Vérifier que c'est bien un lien Instagram
    if (!url.includes('instagram.com')) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez fournir un lien Instagram valide.',
      });
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // Utiliser ddinstagram pour contourner l'embed Discord
      const fixedUrl = url.replace('instagram.com', 'ddinstagram.com');

      await interaction.editReply({
        content: `📸 **Instagram Reels** de ${interaction.user}\n${fixedUrl}`,
      });
    } catch (error) {
      console.error('Erreur Reels:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de charger le reels: ${error.message}`,
      });
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
