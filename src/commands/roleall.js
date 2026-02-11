import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'roleall',
    description: 'Ajouter un rôle à tous les membres du serveur',
  },
  execute: async (message, args) => {
    if (!args[0]) {
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: 'Veuillez mentionner un rôle ou fournir son ID.\nExemple: `,roleall @Rôle` ou `,roleall 123456789012345678`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    // Récupérer le rôle
    let role = message.mentions.roles.first();
    
    if (!role) {
      // Essayer avec l'ID
      const roleId = args[0].replace(/[<@&>]/g, '');
      role = message.guild.roles.cache.get(roleId);
    }

    if (!role) {
      const errorEmbed = createEmbed('error', {
        title: 'Rôle introuvable',
        description: 'Le rôle spécifié n\'existe pas sur ce serveur.',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    // Vérifier que le bot peut gérer ce rôle
    if (message.guild.members.me.roles.highest.position <= role.position && message.guild.ownerId !== message.guild.members.me.id) {
      const errorEmbed = createEmbed('error', {
        title: 'Permission insuffisante',
        description: `Je ne peux pas gérer le rôle ${role} car il est au-dessus de mon rôle le plus élevé.`,
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      // Message de chargement
      const loadingEmbed = createEmbed('info', {
        title: 'Ajout du rôle en cours...',
        description: `Ajout du rôle ${role} à tous les membres...\nCela peut prendre un certain temps selon le nombre de membres.`,
      });
      const loadingMessage = await message.reply({ embeds: [loadingEmbed] });

      // Récupérer tous les membres du serveur
      await message.guild.members.fetch();
      const members = message.guild.members.cache.filter(member => !member.user.bot && !member.roles.cache.has(role.id));

      let successCount = 0;
      let failCount = 0;
      const totalMembers = members.size;

      if (totalMembers === 0) {
        const infoEmbed = createEmbed('info', {
          title: 'Information',
          description: `Tous les membres ont déjà le rôle ${role}.`,
        });
        return loadingMessage.edit({ embeds: [infoEmbed] });
      }

      // Ajouter le rôle à tous les membres
      const promises = [];
      for (const [id, member] of members) {
        promises.push(
          member.roles
            .add(role, `Rôle ajouté par ${message.author.tag}`)
            .then(() => {
              successCount++;
            })
            .catch(() => {
              failCount++;
            })
        );

        // Traiter par lots de 50 pour éviter le rate limit
        if (promises.length >= 50) {
          await Promise.all(promises);
          promises.length = 0;
          
          // Mettre à jour le message de progression
          const progressEmbed = createEmbed('info', {
            title: 'Ajout du rôle en cours...',
            description: `Ajout du rôle ${role} à tous les membres...\n\nProgression: ${successCount + failCount}/${totalMembers}\nRéussis: ${successCount}\nÉchoués: ${failCount}`,
          });
          await loadingMessage.edit({ embeds: [progressEmbed] }).catch(() => {});
          
          // Petite pause pour éviter le rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Traiter les promesses restantes
      if (promises.length > 0) {
        await Promise.all(promises);
      }

      // Message final
      const successEmbed = createEmbed('success', {
        title: 'Rôle ajouté',
        description: `Le rôle ${role} a été ajouté à tous les membres.`,
        fields: [
          {
            name: 'Statistiques',
            value: `Réussis: ${successCount}\nÉchoués: ${failCount}\nTotal: ${totalMembers}`,
            inline: false,
          },
        ],
      });

      await loadingMessage.edit({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Erreur lors de l\'ajout du rôle:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible d'ajouter le rôle: ${error.message}`,
      });
      message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
  },
};
