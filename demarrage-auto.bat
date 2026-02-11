@echo off
echo Configuration du demarrage automatique...
echo.
echo Le bot est deja demarre avec PM2 !
echo Pour qu'il demarre automatiquement au boot de Windows:
echo.
echo 1. Appuyez sur Win+R
echo 2. Tapez: taskschd.msc
echo 3. Creez une tache de base
echo 4. Declencheur: Au demarrage
echo 5. Action: Demarrer un programme
echo 6. Programme: pm2
echo 7. Arguments: resurrect
echo 8. Cochez "Executer avec les privileges les plus eleves"
echo.
echo OU utilisez ce script PowerShell (execute en admin):
echo.
pause
