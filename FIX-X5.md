# Fix réponses x5 - Instructions complètes

## 1. Sur ta machine (Windows)

```powershell
cd c:\Users\tyzzl\Documents\DscBot
git add .
git status
git commit -m "Fix x5: emit patch + onceReply + lock /tmp"
git push origin main
```

## 2. Sur le VPS

```bash
cd ~/dscbot
git pull

# Arrêter TOUT
pm2 delete all
rm -f /tmp/dscbot.lock .dscbot.lock

# Vérifier qu'aucun processus ne tourne
ps aux | grep "node.*index"
# Tu dois voir 0 résultats (sauf la ligne grep)

# Relancer UNE SEULE instance
pm2 start src/index.js --name dscbot
pm2 save
pm2 list
```

## 3. Test avec debug (optionnel)

Si ça fait toujours x5, lance avec le debug pour voir si on bloque les doublons :

```bash
pm2 delete dscbot
DEBUG_DEDUP=1 pm2 start src/index.js --name dscbot --update-env
pm2 logs dscbot
```

Envoie une commande (ex: `,help`). Dans les logs :
- Si tu vois `[DEDUP] Message bloqué` 4 fois → le patch fonctionne, le problème vient d'ailleurs
- Si tu ne vois rien → les événements ne sont pas dupliqués à la source

## 4. Vérifications importantes

**As-tu plusieurs applications/bots dans le serveur ?**
- Discord → Paramètres du serveur → Intégrations → Applications
- Si tu vois plusieurs bots avec le même nom, supprime les doublons

**As-tu plusieurs .env ou tokens ?**
```bash
ls -la ~/dscbot/.env*
# Ne doit y avoir qu'un seul .env
```

**Combien de processus node tournent ?**
```bash
ps aux | grep node
# Ne doit y avoir qu'UN processus pour dscbot
```
