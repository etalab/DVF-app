# Explorer les données de DVF (demandes de valeur foncière)

La base de données DVF recense les mutations à titre onéreux (vente, vente en l'état futur d'achèvement, vente terrain à bâtir, échange, adjudication, expropriation) advenues les 5 dernières années. 

L'application https://app.dvf.etalab.gouv.fr prend appui sur ces données et propose de visualiser les transactions à la maille de la parcelle cadastrale. Elle a été développée par l'équipe de la [mission Etalab](http://www.etalab.gouv.fr/) et **n'est pas dans sa version finale**. 

Nous lirons volontiers vos suggestions d'amélioration. 

Les données de Mayotte ainsi que de l'Alsace et de la Moselle sont manquantes.

Une API développée par Christian Quest est disponible [ici](http://api.cquest.org/dvf), avec sa [documentation](http://data.cquest.org/dgfip_dvf/LISEZ_MOI.txt)

## Installation sur un serveur

### Pré-requis

Il faut un serveur Linux, avec au minium PostgreSQL et Python (Flask). Pour héberger l'application, ajouter Nginx, Supervisor et GUnicorn.

### Base de données

Pour préparer la base de données, il faut lancer le script dédié. On peut procéder ainsi :

```bash
git clone https://github.com/marion-paclot/DVF
sh DVF/db/build_db.sh
```

Le script commence par créer une base de données PostgreSQL et une table, puis télécharge les données brutes depuis data.gouv.fr, retire les décimales (dans les montants et surfaces), injecte les données dans la table, puis effectue une série de post-traitements (création d'index, de colonnes, normalisation de codes). Certaines étapes sont très longues (plusieurs minutes).