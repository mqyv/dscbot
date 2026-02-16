import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';

config();

/**
 * Supprime TOUTES les commandes slash (globales) du bot.
 * À exécuter avant deploy-commands.js si des commandes supprimées persistent.
 * 
 * Discord met en cache les commandes globales (jusqu'à 1h).
 * Ce script force la suppression immédiate.
 */
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function clearCommands() {
  try {
    const existing = await rest.get(
      Routes.applicationCommands(process.env.CLIENT_ID)
    );

    if (existing.length === 0) {
      console.log('Aucune commande globale à supprimer.');
      return;
    }

    console.log(`Suppression de ${existing.length} commande(s)...`);
    for (const cmd of existing) {
      await rest.delete(
        Routes.applicationCommand(process.env.CLIENT_ID, cmd.id)
      );
      console.log(`  ✓ Supprimé: /${cmd.name}`);
    }
    console.log('✅ Toutes les commandes globales ont été supprimées.');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

clearCommands();
