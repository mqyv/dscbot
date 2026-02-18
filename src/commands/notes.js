import { createEmbed } from '../utils/embeds.js';
import { getE } from '../utils/emojis.js';
import { getUserNotes, addUserNote, removeUserNote, getPrefix } from '../utils/database.js';

export default {
  data: {
    name: 'notes',
    description: 'Gérer tes notes personnelles (MP ou serveur)',
  },
  execute: async (message, args, client) => {
    const e = getE(message.guild);
    const prefix = getPrefix(message.guild?.id, message.author.id);
    const notes = getUserNotes(message.author.id);

    if (!args.length || args[0].toLowerCase() === 'list' || args[0].toLowerCase() === 'liste') {
      if (notes.length === 0) {
        const embed = createEmbed('info', {
          title: `${e.notes} Mes notes`,
          description: `Aucune note. Utilise \`${prefix}notes add <texte>\` pour en ajouter.`,
        });
        return message.reply({ embeds: [embed] });
      }
      const list = notes.slice(0, 10).map((n, i) => `**${i + 1}.** ${n.content.slice(0, 50)}${n.content.length > 50 ? '...' : ''}`).join('\n');
      const embed = createEmbed('info', {
        title: `${e.notes} Mes notes (${notes.length})`,
        description: list + (notes.length > 10 ? `\n\n*...et ${notes.length - 10} autre(s)*` : ''),
        footer: { text: `${prefix}notes add <texte> | view <id> | remove <id>` },
      });
      return message.reply({ embeds: [embed] });
    }

    const sub = args[0].toLowerCase();

    if (sub === 'add' || sub === 'ajouter' || sub === 'a') {
      const content = args.slice(1).join(' ');
      if (!content) {
        return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Donne un texte pour ta note.' })] });
      }
      const note = addUserNote(message.author.id, content);
      const embed = createEmbed('success', {
        title: `${e.notes} Note ajoutée`,
        description: content.slice(0, 500),
        footer: { text: `ID: ${note.id}` },
      });
      return message.reply({ embeds: [embed] });
    }

    if (sub === 'view' || sub === 'voir' || sub === 'v') {
      const id = args[1];
      const note = notes.find(n => n.id === parseInt(id) || n.id == id);
      if (!note) {
        return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Note introuvable.' })] });
      }
      const embed = createEmbed('info', {
        title: `${e.notes} Note #${note.id}`,
        description: note.content,
        footer: { text: new Date(note.createdAt).toLocaleString('fr-FR') },
      });
      return message.reply({ embeds: [embed] });
    }

    if (sub === 'remove' || sub === 'delete' || sub === 'suppr' || sub === 'r') {
      const id = args[1];
      if (!id) {
        return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Donne l\'ID de la note à supprimer.' })] });
      }
      const removed = removeUserNote(message.author.id, id);
      if (!removed) {
        return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Note introuvable.' })] });
      }
      return message.reply({ embeds: [createEmbed('success', { title: `${e.notes} Note supprimée`, description: 'La note a été supprimée.' })] });
    }

    const embed = createEmbed('info', {
      title: `${e.notes} Notes`,
      description: `**Sous-commandes:**\n\`${prefix}notes add <texte>\` - Ajouter\n\`${prefix}notes list\` - Liste\n\`${prefix}notes view <id>\` - Voir\n\`${prefix}notes remove <id>\` - Supprimer`,
    });
    message.reply({ embeds: [embed] });
  },
};
