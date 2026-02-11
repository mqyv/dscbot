import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

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
      // Utiliser l'API instavideosave.net
      const apiUrl = `https://v3.instavideosave.net/?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error('API non disponible');
      }

      const html = await response.text();
      
      // Extraire l'URL de la vidéo depuis la réponse HTML
      const videoUrlMatch = html.match(/"url":"(https:\/\/[^"]+\.mp4[^"]*)"/);
      
      if (!videoUrlMatch) {
        throw new Error('Impossible d\'extraire la vidéo');
      }

      const videoUrl = videoUrlMatch[1].replace(/\\u0026/g, '&');

      // Télécharger la vidéo
      const videoResponse = await fetch(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!videoResponse.ok) {
        throw new Error('Impossible de télécharger la vidéo');
      }

      const videoBuffer = await videoResponse.arrayBuffer();
      const buffer = Buffer.from(videoBuffer);

      // Vérifier la taille (limite Discord : 25MB)
      const sizeMB = buffer.length / (1024 * 1024);
      
      if (sizeMB > 25) {
        const errorEmbed = createEmbed('error', {
          title: 'Vidéo trop volumineuse',
          description: `La vidéo fait ${sizeMB.toFixed(2)}MB. Discord limite à 25MB.\n\nLien direct : ${url.replace('instagram.com', 'ddinstagram.com')}`,
        });
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // Sauvegarder temporairement
      writeFileSync(outputPath, buffer);

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
        description: `Impossible de télécharger le reels: ${error.message}\n\nEssayez avec : ${url.replace('instagram.com', 'ddinstagram.com')}`,
      });
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
