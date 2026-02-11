import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';

const LANGUAGES = {
  'fr': 'Français',
  'en': 'Anglais',
  'es': 'Espagnol',
  'de': 'Allemand',
  'it': 'Italien',
  'pt': 'Portugais',
  'ru': 'Russe',
  'ja': 'Japonais',
  'ko': 'Coréen',
  'zh': 'Chinois',
  'ar': 'Arabe',
  'hi': 'Hindi',
  'tr': 'Turc',
  'nl': 'Néerlandais',
  'pl': 'Polonais',
};

export default {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Traduit un texte')
    .addStringOption(option =>
      option
        .setName('texte')
        .setDescription('Texte à traduire')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('vers')
        .setDescription('Langue cible')
        .setRequired(true)
        .addChoices(
          { name: '🇫🇷 Français', value: 'fr' },
          { name: '🇬🇧 Anglais', value: 'en' },
          { name: '🇪🇸 Espagnol', value: 'es' },
          { name: '🇩🇪 Allemand', value: 'de' },
          { name: '🇮🇹 Italien', value: 'it' },
          { name: '🇵🇹 Portugais', value: 'pt' },
          { name: '🇷🇺 Russe', value: 'ru' },
          { name: '🇯🇵 Japonais', value: 'ja' },
          { name: '🇰🇷 Coréen', value: 'ko' },
          { name: '🇨🇳 Chinois', value: 'zh' },
        )
    )
    .addStringOption(option =>
      option
        .setName('depuis')
        .setDescription('Langue source (auto-détection par défaut)')
        .setRequired(false)
        .addChoices(
          { name: '🔍 Auto-détection', value: 'auto' },
          { name: '🇫🇷 Français', value: 'fr' },
          { name: '🇬🇧 Anglais', value: 'en' },
          { name: '🇪🇸 Espagnol', value: 'es' },
          { name: '🇩🇪 Allemand', value: 'de' },
          { name: '🇮🇹 Italien', value: 'it' },
          { name: '🇵🇹 Portugais', value: 'pt' },
          { name: '🇷🇺 Russe', value: 'ru' },
          { name: '🇯🇵 Japonais', value: 'ja' },
          { name: '🇰🇷 Coréen', value: 'ko' },
          { name: '🇨🇳 Chinois', value: 'zh' },
        )
    ),

  async execute(interaction) {
    const text = interaction.options.getString('texte');
    const targetLang = interaction.options.getString('vers');
    const sourceLang = interaction.options.getString('depuis') || 'auto';

    await interaction.deferReply();

    try {
      // Utiliser l'API Google Translate (gratuite via translate.googleapis.com)
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data[0]) {
        throw new Error('Impossible de traduire le texte');
      }

      // Extraire la traduction
      const translation = data[0].map(item => item[0]).join('');
      const detectedLang = data[2] || sourceLang;

      const embed = createEmbed('success', {
        title: 'Traduction',
        fields: [
          {
            name: `Original (${LANGUAGES[detectedLang] || detectedLang})`,
            value: text.length > 1024 ? text.substring(0, 1021) + '...' : text,
            inline: false,
          },
          {
            name: `Traduction (${LANGUAGES[targetLang] || targetLang})`,
            value: translation.length > 1024 ? translation.substring(0, 1021) + '...' : translation,
            inline: false,
          },
        ],
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur de traduction:', error);
      const errorEmbed = createEmbed('error', {
        title: 'Erreur',
        description: `Impossible de traduire: ${error.message}`,
      });
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
