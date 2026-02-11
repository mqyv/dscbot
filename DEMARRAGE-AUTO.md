# ✅ Bot configuré avec PM2 - Démarrage automatique

## Le bot tourne maintenant 24/7 avec PM2 !

Le bot est actuellement **actif** et redémarrera automatiquement en cas de crash.

## Pour le démarrage automatique au boot Windows

### Méthode 1 : Tâche planifiée (Recommandé)

1. Appuyez sur **Win + R**
2. Tapez : `taskschd.msc` et Entrée
3. Dans le panneau de droite : **"Créer une tâche..."**
4. **Général :**
   - Nom : `DiscordBot-PM2`
   - Cochez **"Exécuter avec les privilèges les plus élevés"**
5. **Déclencheurs :** Cliquez **Nouveau**
   - Commencer la tâche : **Au démarrage**
6. **Actions :** Cliquez **Nouveau**
   - Action : **Démarrer un programme**
   - Programme : `pm2`
   - Arguments : `resurrect`
7. **Conditions :**
   - Décochez "Mettre fin à la tâche si l'ordinateur bascule..."
8. Cliquez **OK**

### Méthode 2 : PowerShell (Administrateur)

1. Ouvrez **PowerShell en tant qu'Administrateur**
2. Exécutez :
```powershell
.\setup-startup.ps1
```

## Commandes utiles

```bash
pm2 list          # Voir le statut
pm2 logs dscbot   # Logs en temps réel
pm2 restart dscbot # Redémarrer
pm2 stop dscbot   # Arrêter
pm2 monit         # Monitorer
```

## Vérification

Le bot est actif ! Vérifiez dans Discord qu'il est bien en ligne.
