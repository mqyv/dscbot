# 🔧 Configuration Redirect URI - Étape par étape

## ÉTAPE 1 : Vérifier que le serveur de callback fonctionne

Dans votre terminal, exécutez :
```bash
npm run callback
```

Vous devriez voir :
```
🌐 Serveur de callback démarré sur http://localhost:3000
📋 Redirect URI à utiliser: http://localhost:3000/callback
```

**IMPORTANT** : Laissez ce terminal ouvert ! Le serveur doit rester actif.

## ÉTAPE 2 : Configurer la Redirect URI dans Discord Developer Portal

1. Allez sur : https://discord.com/developers/applications
2. Sélectionnez votre application "WW"
3. Cliquez sur **"OAuth2"** dans la barre latérale
4. Cliquez sur **"General"** (sous OAuth2)
5. Dans la section **"Redirects"**, ajoutez exactement :
   ```
   http://localhost:3000/callback
   ```
6. Cliquez sur **"Add"** puis **"Save Changes"**

## ÉTAPE 3 : Utiliser l'URL Generator avec Redirect URI

1. Toujours dans **"OAuth2"**, cliquez sur **"URL Generator"**
2. Dans **"SCOPES"**, cochez :
   - ✅ `bot`
   - ✅ `applications.commands` (optionnel)
3. Dans **"BOT PERMISSIONS"**, cochez :
   - ✅ **Administrateur**
4. **IMPORTANT** : Dans le champ **"Generated URL"** ou **"Redirect URI"**, entrez :
   ```
   http://localhost:3000/callback
   ```
5. L'URL complète sera générée automatiquement en bas
6. **COPIEZ CETTE URL COMPLÈTE**

## ÉTAPE 4 : Vérifier les Intents

1. Cliquez sur **"Bot"** dans la barre latérale
2. Descendez jusqu'à **"Privileged Gateway Intents"**
3. Activez ces 3 intents :
   - ✅ PRESENCE INTENT
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
4. Cliquez sur **"Save Changes"**

## ÉTAPE 5 : Démarrer le bot

Dans un **autre terminal**, exécutez :
```bash
npm start
```

Vous devriez voir :
```
✅ Bot connecté en tant que ww#1986!
📊 Le bot est sur X serveur(s)
```

## ÉTAPE 6 : Inviter le bot

1. **Assurez-vous que le serveur de callback est toujours actif** (ÉTAPE 1)
2. Ouvrez l'URL que vous avez copiée à l'ÉTAPE 3 dans votre navigateur
3. Sélectionnez votre serveur Discord
4. Cliquez sur **"Autoriser"**
5. Vous devriez être redirigé vers `http://localhost:3000/callback`
6. Vous devriez voir une page verte de confirmation : "✅ Bot ajouté avec succès !"

## ÉTAPE 7 : Vérifier

1. Ouvrez Discord
2. Allez sur votre serveur
3. Vérifiez que **ww#1986** apparaît dans la liste des membres
4. Testez : `,ping` ou `,help`

---

## ⚠️ Si ça ne marche toujours pas

Vérifiez dans l'ordre :
1. ✅ Le serveur de callback est démarré et actif (ÉTAPE 1)
2. ✅ La redirect URI est bien `http://localhost:3000/callback` dans OAuth2 → General (ÉTAPE 2)
3. ✅ Vous avez entré `http://localhost:3000/callback` dans URL Generator (ÉTAPE 3)
4. ✅ Les 3 intents sont activés (ÉTAPE 4)
5. ✅ Le bot est démarré et connecté (ÉTAPE 5)
6. ✅ Vous utilisez l'URL générée par URL Generator (ÉTAPE 6)
