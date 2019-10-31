# Comment mettre à jour la base de données et le site

Deux màj par an, fin avril et fin octobre.
Les manipulations à faire sont les suivantes : 
1) A partir des données dvf de la dgfip, créer la version dvf_etalab (environ 4h de moulinette)
2) Dans le script build_db, changer les dates : 
  - en octobre, ajouter l'année en cours
  - en avril, retirer l'année la plus ancienne (en 2020, on retire 2014, en 2021, 2015 etc)
3) Dans static/js/index.js : changer la date de fin, pour tenir compte de la nouvelle plage de données. A faire : faire dépendre cette plage de dates de l'api dates2 qui calcule min et max à partir de la base de données
4) Relancer le script build_db.sh --> risqué + provoque une interruption de 15 minutes du service (le temps que le script tourne). 
Opter éventuellement pour un renommage de la base de données en dvf_etalab_2 et ultérieurement (une fois tout le travail achevé) remplacer dvf_etalab par dvf_etalab_2. Cela dit, beaucoup de choses sont en cache, donc pas forcément visible par les utilisateurs.
5) Si la base a changé de nom, changer le nom dans config.csv et relancer python ``supervisorctl restart all`` 
6) Vider le cache Nginx et relancer le service : ``rm –rf /var/cache/nginx/*`` puis ``systemctl restart nginx`` 
7) S'assurer que le cache du navigateur tient compte de la nouvelle plage de date, sinon, dans index.html, incrémenter la version du script (dernière ligne) ``<script src="js/index.js?v=1">``

 
