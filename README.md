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
cd DVF
sh db/build_db.sh
```

Le script commence par créer une base de données PostgreSQL et une table, puis télécharge les données DVF retraitées par Etalab, disponibles [ici](https://github.com/etalab/dvf/). Enfin quelques post-traitements sont effectués (traitement de quelques minutes).

## Développer l'interface utilisateur

Pour participer au développement de l'interface utilisateur il n'est pas nécessaire d'installer Python et PostgreSQL.

Un script [Node.js](https://nodejs.org) permet de servir l'interface et de faire proxy vers l'API de production.

### Pré-requis

- [Node.js](https://nodejs.org) 8 ou supérieur
- [yarn](https://yarnpkg.com)

### Utilisation

```bash
# On installe les dépendances Node.js
yarn

# Démarrage du serveur Web (port 3000 par défaut)
yarn start
```

### Configuration

Certains paramètres peuvent être écrasés au moyen d'un fichier `.env`. Le fichier `.env.sample` est fourni en exemple.

### Re-générer le fichier `communes-mapping.json`

```
yarn build-communes-mapping
```
