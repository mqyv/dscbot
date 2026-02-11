import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('reels')
    .setDescription('Télécharge un Reels Instagram')
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
      // Utiliser l'API de téléchargement Instagram (gratuite)
      const apiUrl = `https://api.saveig.app/api/v1/download?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.success || !data.data || !data.data.video) {
        throw new Error('Impossible de récupérer la vidéo');
      }

      const videoUrl = data.data.video;
      const videoResponse = await fetch(videoUrl);
      
      if (!videoResponse.ok) {
        throw new Error('Impossible de télécharger la vidéo');
      }

      const videoBuffer = await videoResponse.arrayBuffer();
      const buffer = Buffer.from(videoBuffer);

      // Vérifier la taille (limite Discord : 25MB pour les serveurs sans boost)
      const sizeMB = buffer.length / (1024 * 1024);
      if (sizeMB > 25) {
        const errorEmbed = createEmbed('error', {
          title: 'Fichier trop volumineux',
          description: `La vidéo fait ${sizeMB.toFixed(2)}MB. Discord limite à 25MB.\n\nLien direct : ${videoUrl}`,
        });
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // Créer le fichier temporaire
      const tempPath = join(process.cwd(), 'temp', `reels_${Date.now()}.mp4`);
      writeFileSync(tempPath, buffer);

      // Créer l'attachment
      const attachment = new AttachmentBuilder(tempPath, { name: 'reels.mp4' });

      await interaction.editReply({
        content: `📸 **Instagram Reels** de ${interaction.user}`,
        files: [attachment],
      });

      // Supprimer le fichier temporaire après envoi
      setTimeout(() => {
        if (existsSync(tempPath)) {
          unlinkSync(tempPath);
        }
      }, 5000);

    } catch (error) {
      console.error('Erreur Reels:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de télécharger le reels: ${error.message}\n\nEssayez avec : ${url.replace('instagram.com', 'ddinstagram.com')}`,
      });
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
