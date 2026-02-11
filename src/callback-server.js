import http from 'http';
import { URL } from 'url';

const PORT = 3000;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Gérer le callback OAuth2
  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const guildId = url.searchParams.get('guild_id');
    const permissions = url.searchParams.get('permissions');
    
    console.log('\n🎉 CALLBACK OAuth2 REÇU !');
    console.log(`   Code: ${code ? 'Oui' : 'Non'}`);
    console.log(`   Guild ID: ${guildId || 'N/A'}`);
    console.log(`   Permissions: ${permissions || 'N/A'}`);
    console.log(`   URL complète: ${req.url}\n`);
    
    // Répondre avec une page de succès
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bot ajouté avec succès</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            max-width: 500px;
          }
          h1 { margin: 0 0 20px 0; color: #4ade80; }
          p { margin: 10px 0; }
          .success { color: #4ade80; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Bot ajouté avec succès !</h1>
          <p class="success">L'autorisation a été complétée.</p>
          <p>Le bot devrait maintenant être disponible sur votre serveur Discord.</p>
          <p>Vous pouvez fermer cette page.</p>
          ${guildId ? `<p><small>Serveur ID: ${guildId}</small></p>` : ''}
        </div>
      </body>
      </html>
    `);
  } else {
    // Page d'accueil simple
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Discord Bot Callback Server</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #1e1e1e;
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Discord Bot Callback Server</h1>
          <p>Serveur de callback actif sur le port ${PORT}</p>
        </div>
      </body>
      </html>
    `);
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Serveur de callback démarré sur http://localhost:${PORT}`);
  console.log(`📋 Redirect URI à utiliser: http://localhost:${PORT}/callback`);
});
