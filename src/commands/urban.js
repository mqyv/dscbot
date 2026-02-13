import { createEmbed } from '../utils/embeds.js';

export default {
  data: {
    name: 'urban',
    description: 'Chercher une définition sur Urban Dictionary',
  },
  execute: async (message, args) => {
    const term = args.join(' ').trim();
    if (!term) {
      const errorEmbed = createEmbed('error', {
        title: 'Usage',
        description: '`,urban <terme>`\nExemple: `,urban banger`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    try {
      const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
      const data = await res.json();

      if (!data.list?.length) {
        return message.reply({
          embeds: [createEmbed('error', { title: 'Non trouvé', description: `Aucune définition pour "${term}"` })],
        });
      }

      const def = data.list[0];
      const definition = (def.definition || '').slice(0, 1000);
      const example = (def.example || '').slice(0, 500);

      const embed = createEmbed('default', {
        title: `📖 ${def.word}`,
        description: definition,
        fields: example ? [{ name: 'Exemple', value: example, inline: false }] : [],
        footer: { text: `👍 ${def.thumbs_up} | 👎 ${def.thumbs_down} | Par ${def.author}` },
      });

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('Urban API:', e);
      message.reply({
        embeds: [createEmbed('error', { title: 'Erreur', description: 'Impossible de contacter Urban Dictionary.' })],
      });
    }
  },
};
