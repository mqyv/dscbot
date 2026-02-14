import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'delrole',
    description: 'Retirer un rôle d\'un membre',
  },
  execute: async (message, args) => {
    if (!args[0] || !args[1]) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `,delrole @membre @rôle`\nExemple: `,delrole @User @Membre`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const member = message.mentions.members?.first();
    const role = message.mentions.roles.first();

    if (!member) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez mentionner un membre.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!role) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez mentionner un rôle.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (!member.roles.cache.has(role.id)) {
      const errorEmbed = createEmbed('warning', {
        title: 'Information',
        description: `${member} ne possède pas le rôle ${role}.`,
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    if (message.guild.members.me.roles.highest.position <= role.position) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission insuffisante',
        description: `Je ne peux pas gérer le rôle ${role} (il est au-dessus du mien).`,
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      await member.roles.remove(role, `Retiré par ${message.author.tag}`);
      const successEmbed = createEmbed('success', {
        title: 'Rôle retiré',
        description: `Le rôle ${role} a été retiré de ${member}.`,
      });
      message.reply({ embeds: [successEmbed] });
    } catch (error) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de retirer le rôle: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] });
    }
  },
};
