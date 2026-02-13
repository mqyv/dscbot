import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Options pour les commandes qui ont des arguments (slash)
const COMMAND_OPTIONS = {
  '8ball': (b) => b.addStringOption(o => o.setName('question').setDescription('Votre question').setRequired(true)),
  'afk': (b) => b.addStringOption(o => o.setName('raison').setDescription('Raison de votre AFK').setRequired(false)),
  'avatar': (b) => b.addUserOption(o => o.setName('utilisateur').setDescription('Utilisateur').setRequired(false)),
  'ban': (b) => b.addUserOption(o => o.setName('membre').setDescription('Membre à bannir').setRequired(true)).addStringOption(o => o.setName('raison').setDescription('Raison du ban').setRequired(false)),
  'calc': (b) => b.addStringOption(o => o.setName('expression').setDescription('Expression mathématique').setRequired(true)),
  'clear': (b) => b.addIntegerOption(o => o.setName('nombre').setDescription('Nombre de messages (1-100)').setRequired(true)),
  'help': (b) => b.addStringOption(o => o.setName('commande').setDescription('Commande pour l\'aide').setRequired(false)),
  'kick': (b) => b.addUserOption(o => o.setName('membre').setDescription('Membre à expulser').setRequired(true)).addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false)),
  'say': (b) => b.addStringOption(o => o.setName('message').setDescription('Message à envoyer').setRequired(true)),
  'suggest': (b) => b.addStringOption(o => o.setName('suggestion').setDescription('Votre suggestion').setRequired(true)),
  'timeout': (b) => b.addUserOption(o => o.setName('membre').setDescription('Membre à muter').setRequired(true)).addIntegerOption(o => o.setName('minutes').setDescription('Durée en minutes').setRequired(true)).addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false)),
  'unban': (b) => b.addStringOption(o => o.setName('id').setDescription('ID de l\'utilisateur à débannir').setRequired(true)),
  'userinfo': (b) => b.addUserOption(o => o.setName('utilisateur').setDescription('Utilisateur').setRequired(false)),
  'warn': (b) => b.addUserOption(o => o.setName('membre').setDescription('Membre à avertir').setRequired(true)).addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false)),
  'random': (b) => b.addStringOption(o => o.setName('choix').setDescription('Choix séparés par des virgules').setRequired(true)),
  'poll': (b) => b.addStringOption(o => o.setName('question').setDescription('Question du sondage').setRequired(true)).addStringOption(o => o.setName('options').setDescription('Options séparées par |').setRequired(false)),
  'quote': (b) => b.addStringOption(o => o.setName('id').setDescription('ID du message').setRequired(false)),
  'profile': (b) => b.addUserOption(o => o.setName('utilisateur').setDescription('Utilisateur').setRequired(false)),
};

const commands = [];
const commandsPath = join(__dirname, 'src', 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('Chargement des commandes slash...');

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  
  if (!command.default?.data) continue;

  let slashData;
  if (command.default.data.toJSON) {
    slashData = command.default.data.toJSON();
  } else {
    const plain = command.default.data;
    let builder = new SlashCommandBuilder()
      .setName(plain.name)
      .setDescription(plain.description || 'Aucune description');
    if (COMMAND_OPTIONS[plain.name]) {
      builder = COMMAND_OPTIONS[plain.name](builder);
    }
    slashData = builder.toJSON();
  }

  commands.push(slashData);
  console.log(`✓ ${slashData.name}`);
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
