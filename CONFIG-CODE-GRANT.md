# 🔧 Configuration Code Grant - Solution complète

## Le problème
L'erreur "Integration requires code grant" signifie que Discord nécessite un flux OAuth2 avec redirect URI.

## Solution étape par étape

### ÉTAPE 1 : Configurer la Redirect URI dans Discord Developer Portal

1. Allez sur : https://discord.com/developers/applications
2. Sélectionnez votre application "WW"
3. Cliquez sur **"OAuth2"** → **"General"**
4. Dans la section **"Redirects"**, ajoutez exactement :
   ```
   http://localhost:3000/callback
   ```
5. Cliquez sur **"Add"** puis **"Save Changes"**
6. **IMPORTANT** : Notez que la redirect URI doit être EXACTEMENT `http://localhost:3000/callback`

### ÉTAPE 2 : Configurer l'URL Generator avec Redirect URI

1. Toujours dans **"OAuth2"**, cliquez sur **"URL Generator"**
2. Dans **"SCOPES"**, cochez :
   - ✅ `bot`
   - ✅ `applications.commands` (optionnel)
3. Dans **"BOT PERMISSIONS"**, cochez :
   - ✅ **Administrateur**
4. **CRUCIAL** : Dans le champ **"Redirect URI"** ou **"Generated URL"**, entrez :
   ```
   http://localhost:3000/callback
   ```
5. L'URL complète sera générée automatiquement en bas
6. **COPIEZ CETTE URL COMPLÈTE**

### ÉTAPE 3 : Vérifier les Intents

1. Cliquez sur **"Bot"** dans la barre latérale
2. Descendez jusqu'à **"Privileged Gateway Intents"**
3. Activez ces 3 intents :
   - ✅ PRESENCE INTENT
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
4. Cliquez sur **"Save Changes"**

### ÉTAPE 4 : Démarrer le serveur de callback

Dans un terminal, exécutez :
```bash
npm run callback
```

Vous devriez voir :
```
🌐 Serveur de callback démarré sur http://localhost:3000
📋 Redirect URI à utiliser: http://localhost:3000/callback
```

**Laissez ce terminal ouvert !**

### ÉTAPE 5 : Démarrer le bot

Dans un **autre terminal**, exécutez :
```bash
npm start
```

Vous devriez voir :
```
✅ Bot connecté en tant que ww#1986!
📊 Le bot est sur X serveur(s)
```

### ÉTAPE 6 : Inviter le bot

1. **Assurez-vous que le serveur de callback est actif** (ÉTAPE 4)
2. Ouvrez l'URL que vous avez copiée à l'ÉTAPE 2 dans votre navigateur
3. Sélectionnez votre serveur Discord
4. Cliquez sur **"Autoriser"**
5. Vous devriez être redirigé vers `http://localhost:3000/callback`
6. Vous devriez voir une page verte : **"✅ Bot ajouté avec succès !"**
7. **Regardez le terminal du serveur de callback** - vous devriez voir :
   ```
   🎉 CALLBACK OAuth2 REÇU !
      Code: Oui
      Guild ID: [ID de votre serveur]
   ```
8. **Regardez le terminal du bot** - vous devriez voir :
   ```
   🎉 BOT AJOUTÉ À UN SERVEUR !
      Serveur: [Nom] ([ID])
   ```

### ÉTAPE 7 : Vérifier dans Discord

1. Ouvrez Discord
2. Allez sur votre serveur
3. Vérifiez que **ww#1986** apparaît dans la liste des membres
4. Testez : `,ping` ou `,help`

---

## ⚠️ Points importants

1. **Le serveur de callback DOIT être actif** avant d'inviter le bot
2. La redirect URI doit être **exactement** `http://localhost:3000/callback`
3. Les 3 intents doivent être **activés** dans Bot → Privileged Gateway Intents
4. Utilisez l'URL **générée par URL Generator**, pas un lien direct
5. Après avoir autorisé, vous **devez** être redirigé vers `localhost:3000/callback`

---

## 🔍 Si ça ne marche toujours pas

Vérifiez dans l'ordre :
1. ✅ Le serveur de callback est démarré et actif
2. ✅ La redirect URI est bien `http://localhost:3000/callback` dans OAuth2 → General
3. ✅ Vous avez entré `http://localhost:3000/callback` dans URL Generator
4. ✅ Les 3 intents sont activés
5. ✅ Le bot est démarré et connecté
6. ✅ Vous utilisez l'URL générée par URL Generator (pas un lien direct)
