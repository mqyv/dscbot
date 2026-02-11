import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log('\n✅ Bot connecté avec succès !');
  console.log(`📛 Nom: ${client.user.tag}`);
  console.log(`🆔 ID: ${client.user.id}`);
  console.log(`\n📊 Serveurs où le bot est présent (${client.guilds.cache.size}):`);
  
  if (client.guilds.cache.size === 0) {
    console.log('⚠️  Le bot n\'est sur AUCUN serveur !');
    console.log('\n🔗 Pour inviter le bot:');
    console.log(`   https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot`);
  } else {
    client.guilds.cache.forEach(guild => {
      console.log(`   ✓ ${guild.name} (${guild.id})`);
    });
  }
  
  console.log('\n✅ Le bot fonctionne correctement !');
  console.log('💡 Si le bot n\'apparaît pas dans votre serveur, utilisez le lien ci-dessus pour l\'inviter.');
  
  process.exit(0);
});

client.on('error', error => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Erreur de connexion:', error.message);
  if (error.message.includes('TokenInvalid')) {
    console.error('\n⚠️  Le token Discord est invalide !');
    console.error('   Vérifiez votre fichier .env et assurez-vous que DISCORD_TOKEN est correct.');
  }
  process.exit(1);
});
