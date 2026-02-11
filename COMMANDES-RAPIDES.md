# 🚀 Commandes rapides pour gérer le bot

## Démarrer le bot

**Option 1 : Script rapide**
- Double-cliquez sur `START-BOT.bat`

**Option 2 : Commande PM2**
```bash
pm2 start ecosystem.config.cjs
```

**Option 3 : Script npm**
```bash
npm run pm2:start
```

---

## Vérifier que le bot tourne

```bash
pm2 list
```

Vous devriez voir `dscbot` avec le status **online**

---

## Voir les logs en temps réel

```bash
pm2 logs dscbot
```

---

## Redémarrer le bot

```bash
pm2 restart dscbot
```

---

## Arrêter le bot

```bash
pm2 stop dscbot
```

---

## Le bot est déjà démarré !

D'après les logs, le bot tourne déjà depuis plusieurs minutes. Vous pouvez vérifier dans Discord qu'il est bien en ligne !
