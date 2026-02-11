import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export default {
  data: new SlashCommandBuilder()
    .setName('reels')
    .setDescription('Télécharge un Reels Instagram en MP4')
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

    const timestamp = Date.now();
    const outputPath = join(process.cwd(), 'temp', `reels_${timestamp}.mp4`);

    try {
      // Télécharger la vidéo avec yt-dlp
      await execAsync(`yt-dlp -f "best[ext=mp4]" -o "${outputPath}" "${url}"`);

      // Vérifier que le fichier existe
      if (!existsSync(outputPath)) {
        throw new Error('Le fichier n\'a pas été téléchargé');
      }

      // Vérifier la taille (limite Discord : 25MB sans boost, 50MB avec boost)
      const stats = statSync(outputPath);
      const sizeMB = stats.size / (1024 * 1024);

      if (sizeMB > 25) {
        unlinkSync(outputPath);
        const errorEmbed = createEmbed('error', {
          title: 'Vidéo trop volumineuse',
          description: `La vidéo fait ${sizeMB.toFixed(2)}MB. Discord limite à 25MB.\n\nUtilisez ce lien : ${url.replace('instagram.com', 'ddinstagram.com')}`,
        });
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // Créer l'attachment et envoyer
      const attachment = new AttachmentBuilder(outputPath, { name: 'reels.mp4' });

      await interaction.editReply({
        content: `📸 **Instagram Reels** de ${interaction.user}`,
        files: [attachment],
      });

      // Supprimer le fichier après envoi
      setTimeout(() => {
        if (existsSync(outputPath)) {
          unlinkSync(outputPath);
        }
      }, 5000);

    } catch (error) {
      console.error('Erreur Reels:', error);
      
      // Nettoyer le fichier si erreur
      if (existsSync(outputPath)) {
        unlinkSync(outputPath);
      }

      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de télécharger le reels: ${error.message}\n\nAssurez-vous que yt-dlp est installé sur le serveur.\nOu utilisez : ${url.replace('instagram.com', 'ddinstagram.com')}`,
      });
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
