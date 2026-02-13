import { EmbedBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'embed',
    description: 'Créer un embed personnalisé (titre, description, couleur)',
  },
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Cette commande est réservée aux serveurs.' })] });
    }
    if (!message.member?.permissions?.has('ManageMessages')) {
      return message.reply({ embeds: [createEmbed('error', { title: 'Permission refusée', description: 'Tu dois pouvoir gérer les messages.' })] });
    }

    if (!args[0]) {
      const prefix = (await import('../utils/database.js')).getPrefix(message.guild.id, message.author.id);
      return message.reply({
        embeds: [createEmbed('info', {
          title: 'Utilisation de embed',
          description: [
            '**Format:** `' + prefix + 'embed <titre> | <description> [| #couleur]`',
            '',
            'Le `|` sépare le titre de la description. La couleur est optionnelle (hex sans #).',
            '',
            '**Exemples:**',
            '`' + prefix + 'embed Annonce | Bienvenue sur le serveur !`',
            '`' + prefix + 'embed Événement | RDV samedi 20h | 5865F2`',
          ].join('\n'),
        })],
      });
    }

    const full = args.join(' ');
    const parts = full.split(/\s*\|\s*/);
    const title = parts[0]?.trim() || 'Embed';
    const description = parts[1]?.trim() || '';
    const colorHex = parts[2]?.trim().replace(/^#/, '') || '5865F2';

    const color = parseInt(colorHex, 16);
    if (isNaN(color) || color < 0 || color > 0xFFFFFF) {
      return message.reply({ embeds: [createEmbed('error', { title: 'Couleur invalide', description: 'Utilise un code hex (ex: 5865F2 ou FF0000)' })] });
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setTimestamp();

    if (description) embed.setDescription(description);

    await message.delete().catch(() => {});
    await message.channel.send({ embeds: [embed] });
  },
};
