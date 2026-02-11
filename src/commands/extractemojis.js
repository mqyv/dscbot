import { createEmbed } from '../utils/embeds.js';
import { AttachmentBuilder } from 'discord.js';
import { createWriteStream, unlinkSync, mkdirSync, existsSync } from 'fs';
import archiver from 'archiver';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  data: {
    name: 'extractemojis',
    description: 'Extraire tous les emojis d\'un serveur',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('Administrator')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez être administrateur pour utiliser cette commande.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const targetGuild = message.guild;
    const emojis = targetGuild.emojis.cache;

    if (emojis.size === 0) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Ce serveur n\'a aucun emoji à extraire.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const loadingEmbed = createEmbed('info', {
        title: 'Extraction en cours...',
      description: `Extraction de ${emojis.size} emoji(s)...`,
    });

    const loadingMessage = await message.reply({ embeds: [loadingEmbed] });

    try {
      // Créer le dossier temporaire
      const tempDir = join(__dirname, '../../temp');
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      const zipPath = join(tempDir, `emojis-${targetGuild.id}-${Date.now()}.zip`);
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      let count = 0;
      for (const emoji of emojis.values()) {
        try {
          const emojiUrl = emoji.url;
          const response = await fetch(emojiUrl);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            const extension = emoji.animated ? 'gif' : 'png';
            archive.append(buffer, { name: `${emoji.name}.${extension}` });
            count++;
          }
        } catch (error) {
          console.error(`Erreur lors de l'extraction de ${emoji.name}:`, error);
        }
      }

      archive.finalize();

      output.on('close', async () => {
        const zipFile = new AttachmentBuilder(zipPath, { name: `${targetGuild.name}-emojis.zip` });

        const successEmbed = createEmbed('success', {
          title: 'Emojis extraits',
          description: `${count} emoji(s) extrait(s) avec succès !`,
          fields: [
            { name: 'Fichier', value: 'Voir ci-dessous', inline: false },
            { name: 'Statistiques', value: `${count}/${emojis.size} emoji(s)`, inline: true },
          ],
        });

        await loadingMessage.edit({ embeds: [successEmbed], files: [zipFile] });

        // Supprimer le fichier après envoi
        setTimeout(() => {
          try {
            unlinkSync(zipPath);
          } catch (error) {
            console.error('Erreur lors de la suppression du fichier:', error);
          }
        }, 60000);
      });
    } catch (error) {
      console.error('Erreur lors de l\'extraction:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible d'extraire les emojis: ${error.message}`,
      });
      await loadingMessage.edit({ embeds: [errorEmbed] });
    }
  },
};
