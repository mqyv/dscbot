import { createEmbed } from '../utils/embeds.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

export default {
  data: {
    name: 'backup',
    description: 'Crée une sauvegarde des informations du serveur',
  },
  execute: async (message) => {
    if (!message.member.permissions.has('Administrator')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez être administrateur pour créer une sauvegarde.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const guild = message.guild;

    try {
      const backup = {
        name: guild.name,
        id: guild.id,
        icon: guild.iconURL({ size: 2048 }),
        memberCount: guild.memberCount,
        createdAt: guild.createdAt,
        channels: guild.channels.cache.map(c => ({
          name: c.name,
          type: c.type,
          position: c.position,
          topic: c.topic || null,
          nsfw: c.nsfw || false,
          parent: c.parent?.name || null,
        })),
        roles: guild.roles.cache.map(r => ({
          name: r.name,
          color: r.hexColor,
          position: r.position,
          permissions: r.permissions.toArray(),
          hoist: r.hoist,
          mentionable: r.mentionable,
        })),
        emojis: guild.emojis.cache.map(e => ({
          name: e.name,
          url: e.url,
          animated: e.animated,
        })),
        backupDate: new Date().toISOString(),
      };

      const filename = `backup_${guild.id}_${Date.now()}.json`;
      const filepath = join(process.cwd(), 'temp', filename);

      writeFileSync(filepath, JSON.stringify(backup, null, 2));

      const embed = createEmbed('success', {
        title: 'Sauvegarde créée',
        description: `Sauvegarde de **${guild.name}**\n\n**Channels:** ${backup.channels.length}\n**Rôles:** ${backup.roles.length}\n**Emojis:** ${backup.emojis.length}`,
      });

      await message.reply({ 
        embeds: [embed],
        files: [{ attachment: filepath, name: filename }]
      });

    } catch (error) {
      console.error('Erreur backup:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de créer la sauvegarde: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
