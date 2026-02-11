import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('image')
        .setDescription('Générer une image (bientôt disponible)')
        .addStringOption(option =>
          option
            .setName('prompt')
            .setDescription('Description de l\'image')
            .setRequired(true)
        )
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

    if (subcommand === 'image') {
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('Fonctionnalité en développement')
        .setDescription('La génération d\'images sera bientôt disponible.')
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
              content: 'Tu es un assistant utile et amical sur Discord. Réponds de manière concise et claire. Tu peux utiliser des emojis pour rendre tes réponses plus expressives.'
            }
          ]);
        }

        const history = conversations.get(interaction.user.id);
        history.push({
          role: 'user',
          content: question
        });

        // Appel à l'API Groq
        const completion = await groq.chat.completions.create({
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

        // Découper la réponse si elle est trop longue (limite Discord : 4096 caractères)
        const maxLength = 4000;
        if (response.length > maxLength) {
          const chunks = response.match(new RegExp(`.{1,${maxLength}}`, 'g'));
          
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
              name: interaction.user.username,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTitle('Question')
            .setDescription(question.length > 256 ? question.substring(0, 253) + '...' : question)
            .addFields({
              name: 'Réponse (Partie 1)',
              value: chunks[0]
            })
            .setFooter({ text: 'Propulsé par Groq AI • llama-3.3-70b' })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });

          // Envoyer les parties suivantes
          for (let i = 1; i < chunks.length; i++) {
            const followUpEmbed = new EmbedBuilder()
              .setColor('#5865F2')
              .addFields({
                name: `Réponse (Partie ${i + 1})`,
                value: chunks[i]
              })
              .setTimestamp();

            await interaction.followUp({ embeds: [followUpEmbed] });
          }
        } else {
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
              name: interaction.user.username,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTitle('Question')
            .setDescription(question.length > 256 ? question.substring(0, 253) + '...' : question)
            .addFields({
              name: 'Réponse',
              value: response
            })
            .setFooter({ text: 'Propulsé par Groq AI • llama-3.3-70b' })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
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
