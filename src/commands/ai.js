import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Groq from 'groq-sdk';

let groq = null;
function getGroq() {
  if (!groq && process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

// Stocker les conversations par utilisateur
const conversations = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Discuter avec une IA (Groq)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('ask')
        .setDescription('Poser une question à l\'IA')
        .addStringOption(option =>
          option
            .setName('question')
            .setDescription('Votre question')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Réinitialiser la conversation')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'reset') {
      conversations.delete(interaction.user.id);
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Conversation réinitialisée')
        .setDescription('Votre historique de conversation a été effacé.')
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'ask') {
      const question = interaction.options.getString('question');

      // Vérifier que l'API key existe
      if (!process.env.GROQ_API_KEY) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Erreur de configuration')
          .setDescription('La clé API Groq n\'est pas configurée. Ajoutez `GROQ_API_KEY` dans le fichier `.env`.')
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      await interaction.deferReply();

      try {
        // Récupérer ou créer l'historique de conversation
        if (!conversations.has(interaction.user.id)) {
          conversations.set(interaction.user.id, [
            {
              role: 'system',
              content: 'Tu es un pote sur Discord, vraiment décontracté. Tu parles comme les jeunes : argot, verlan, vulgarité, tout est permis. Adapte-toi à la façon de parler de la personne et utilise les mêmes expressions qu\'elle. Si elle dit "frr", tu dis "frr". Si elle dit "wsh", tu dis "wsh". Si elle est vulgaire, sois vulgaire aussi. Pas de filtre, pas de politesse excessive, juste un vrai dialogue de pote. Utilise des emojis genre 💀😭🔥. Sois direct, drôle, et n\'hésite pas à chambrer ou à dire des trucs choquants si c\'est pour rire. Tu es là pour kiffer, pas pour être sage.'
            }
          ]);
        }

        const history = conversations.get(interaction.user.id);
        history.push({
          role: 'user',
          content: question
        });

        // Appel à l'API Groq
        const groqClient = getGroq();
        const completion = await groqClient.chat.completions.create({
          messages: history,
          model: 'llama-3.3-70b-versatile', // Modèle le plus puissant de Groq
          temperature: 0.7,
          max_tokens: 2000,
        });

        const response = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';

        // Ajouter la réponse à l'historique
        history.push({
          role: 'assistant',
          content: response
        });

        // Limiter l'historique à 20 messages (10 échanges)
        if (history.length > 21) { // +1 pour le message système
          conversations.set(interaction.user.id, [
            history[0], // Garder le message système
            ...history.slice(-20) // Garder les 20 derniers messages
          ]);
        }

        // Découper la réponse si elle est trop longue (limite Discord : 2000 caractères par message)
        const maxLength = 1900;
        if (response.length > maxLength) {
          const chunks = response.match(new RegExp(`.{1,${maxLength}}`, 'g'));
          
          await interaction.editReply(`**${interaction.user.username}:** ${question}\n\n${chunks[0]}`);

          // Envoyer les parties suivantes
          for (let i = 1; i < chunks.length; i++) {
            await interaction.followUp(chunks[i]);
          }
        } else {
          await interaction.editReply(`**${interaction.user.username}:** ${question}\n\n${response}`);
        }

      } catch (error) {
        console.error('Erreur Groq API:', error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Erreur')
          .setDescription(`Impossible de contacter l'IA: ${error.message}`)
          .setTimestamp();

        if (interaction.deferred) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      }
    }
  },
};
