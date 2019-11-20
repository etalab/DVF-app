# Comment mettre à jour la base de données et le site

Deux mises à jour par an, fin avril et fin octobre.

Les manipulations à faire sont les suivantes : 
1) A partir des données dvf de la dgfip, créer la version dvf_etalab (environ 4h de moulinette)
2) Dans le script build_db, changer les dates : 
  - en octobre, ajouter l'année en cours
  - en avril, retirer l'année la plus ancienne (en 2020, on retire 2014, en 2021, 2015 etc)
3) Dans static/js/index.js : adapter les dates (début éventuellement et fin à chaque fois) pour tenir compte de la nouvelle plage de données. Possibilité de le faire via l'api dates2, mais nécessitera une requête de plus.
4) Dans build_db.sh 
  - renommer la base dvf_octobre en dvf_avril (ou l'inverse, en fonction de la mise à jour. on va alterner entre les deux bases pour pouvoir rebasculer sur l'ancienne version s'il y a un problème)
  - faire tourner le script intégralement ``sh build_db.sh``
5) Dans config.csv (uniquement sur le serveur)
  - changer le nom de la base de donnée (4ème ligne)
  - relancer python ``supervisorctl restart all`` pour prendre en compte cette modification de nom de base
6) Vider le cache Nginx et relancer le service : ``rm -R -rf /var/cache/nginx/*`` puis ``systemctl restart nginx`` 
7) S'assurer que le cache du navigateur tient compte de la nouvelle plage de date, sinon, dans index.html, incrémenter la version du script (dernière ligne) ``<script src="js/index.js?v=1">``

 
