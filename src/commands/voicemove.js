import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'voicemove',
    description: 'Déplace un utilisateur ou tous les utilisateurs en vocal du serveur vers un salon',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('MoveMembers')) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission refusée',
        description: 'Vous devez avoir la permission "Déplacer des membres".',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'all') {
      const toChannel = message.mentions.channels.first();

      if (!toChannel || !toChannel.isVoiceBased()) {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: 'Mentionnez un salon vocal de destination.\nExemple: `,voicemove all #vocal`',
        });
        return message.reply({ embeds: [errorEmbed] });
      }

      let moved = 0;
      const voiceChannels = message.guild.channels.cache.filter(
        c => c.isVoiceBased() && c.id !== toChannel.id
      );

      for (const [, channel] of voiceChannels) {
        for (const [, member] of channel.members) {
          try {
            await member.voice.setChannel(toChannel);
            moved++;
          } catch (e) {
            console.error(`Impossible de déplacer ${member.user.tag}:`, e);
          }
        }
      }

      const embed = createEmbed('success', {
        title: 'Membres déplacés',
        description: `${moved} membre(s) déplacé(s) vers ${toChannel}.`,
      });

      message.reply({ embeds: [embed] });
    } else {
      const member = message.mentions.members.first();
      const toChannel = message.mentions.channels.first();

      if (!member) {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: 'Mentionnez un utilisateur à déplacer.\nExemple: `,voicemove @User #vocal`',
        });
        return message.reply({ embeds: [errorEmbed] });
      }

      if (!member.voice.channel) {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: 'Cet utilisateur n\'est pas dans un salon vocal.',
        });
        return message.reply({ embeds: [errorEmbed] });
      }

      if (!toChannel || !toChannel.isVoiceBased()) {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: 'Mentionnez un salon vocal de destination.',
        });
        return message.reply({ embeds: [errorEmbed] });
      }

      try {
        await member.voice.setChannel(toChannel);
        const embed = createEmbed('success', {
          title: 'Membre déplacé',
          description: `${member.user} a été déplacé vers ${toChannel}.`,
        });
        message.reply({ embeds: [embed] });
      } catch (error) {
        const errorEmbed = createEmbed('error', {
          title: 'Erreur',
          description: `Impossible de déplacer le membre: ${error.message}`,
        });
        message.reply({ embeds: [errorEmbed] });
      }
    }
  },
};
