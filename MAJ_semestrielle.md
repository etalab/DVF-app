# Comment mettre à jour la base de données et le site

Deux mises à jour par an, en avril et octobre.

Les manipulations à faire sont les suivantes : 
1) A partir des données dvf de la dgfip, créer la version dvf_etalab (environ 4h de moulinette)
2) Dans le script build_db, changer les dates : 
  - en octobre, ajouter l'année en cours
  - en avril, retirer l'année la plus ancienne (en 2020, on retire 2014, en 2021, 2015 etc)
  - renommer la base dvf_YYYYMM en fonction du mois de mise à jour.
  - faire tourner le script intégralement ``sh build_db.sh``
3) Dans static/js/index.js : adapter les dates (début éventuellement et fin à chaque fois) pour tenir compte de la nouvelle plage de données. 

var MIN_DATE = 'YYYY-MM-01'

var MAX_DATE = 'YYYY-MM-31'

Possibilité de le faire via l'api dates2, mais nécessitera une requête de plus.
4) Dans config.csv (uniquement sur le serveur)
  - changer le nom de la base de donnée dvf_YYYYMM (4ème ligne)
  - relancer python ``supervisorctl restart all`` pour prendre en compte cette modification de nom de base
5) Vider le cache Nginx et relancer le service : ``rm -R -rf /var/cache/nginx/*`` puis ``systemctl restart nginx`` 
6) S'assurer que le cache du navigateur tient compte de la nouvelle plage de date, sinon, dans index.html, incrémenter la version du script (dernière ligne) ``<script src="js/index.js?v=1">``
