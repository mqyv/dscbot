import { config } from 'dotenv';
import http from 'http';

config();

console.log('🔧 Configuration du bot Discord\n');
console.log('📋 Vérifications à faire dans Discord Developer Portal:\n');

console.log('1️⃣  Bot → Privileged Gateway Intents:');
console.log('   ✅ PRESENCE INTENT');
console.log('   ✅ SERVER MEMBERS INTENT');
console.log('   ✅ MESSAGE CONTENT INTENT\n');

console.log('2️⃣  OAuth2 → General → Redirects:');
console.log('   Ajoutez: http://localhost:3000/callback\n');

console.log('3️⃣  OAuth2 → URL Generator:');
console.log('   Scopes: bot + applications.commands');
console.log('   Permissions: Administrateur');
console.log('   Copiez l\'URL générée\n');

console.log('4️⃣  Démarrer le serveur de callback:');
console.log('   npm run callback\n');

console.log('5️⃣  Utiliser l\'URL copiée pour inviter le bot\n');

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ ERREUR: DISCORD_TOKEN non trouvé dans .env');
  console.error('   Vérifiez votre fichier .env');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error('❌ ERREUR: CLIENT_ID non trouvé dans .env');
  console.error('   Vérifiez votre fichier .env');
  process.exit(1);
}

console.log('✅ Configuration .env trouvée');
console.log(`   Client ID: ${process.env.CLIENT_ID}\n`);

console.log('🚀 Pour démarrer le bot:');
console.log('   Terminal 1: npm run callback');
console.log('   Terminal 2: npm start\n');
