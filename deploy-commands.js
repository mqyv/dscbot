import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
const commandsPath = join(__dirname, 'src', 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('Chargement des commandes slash...');

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  
  if (command.default?.data?.name && command.default?.data?.toJSON) {
    commands.push(command.default.data.toJSON());
    console.log(`✓ ${command.default.data.name}`);
  }
}

console.log(`\nDéploiement de ${commands.length} commande(s) slash...`);

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands },
  );

  console.log(`✅ ${commands.length} commande(s) slash déployée(s) avec succès !`);
} catch (error) {
  console.error('❌ Erreur lors du déploiement:', error);
}
