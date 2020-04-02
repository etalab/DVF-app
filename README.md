# Explorer les données de DVF (Demandes de Valeur Foncière)

La base de données DVF recense les mutations à titre onéreux (vente, vente en l'état futur d'achèvement, vente terrain à bâtir, échange, adjudication, expropriation) advenues les 5 dernières années. 

L'application https://app.dvf.etalab.gouv.fr prend appui sur ces données et propose de visualiser les transactions à la maille de la parcelle cadastrale. Elle a été développée par l'équipe de la [mission Etalab](http://www.etalab.gouv.fr/).

Nous lirons volontiers vos suggestions d'amélioration. 

Les données de Mayotte ainsi que de l'Alsace et de la Moselle sont manquantes car gérées par le Livre Foncier et non par la DGFiP

Une API développée par Christian Quest est disponible [ici](http://api.cquest.org/dvf), avec sa [documentation](http://data.cquest.org/dgfip_dvf/LISEZ_MOI.txt).

## Installation

### 1- Pré-requis

Il faut un serveur Linux (ici, nous prendrons Ubuntu 18.04 comme exemple)

### 2- Récupération du dépôt
```bash
$ git clone https://github.com/etalab/DVF-app
$ cd DVF
```

### 3- Installation minimale : pour développer l'interface utilisateur seule (Front End)

Pour participer au développement de l'interface utilisateur, il n'est pas nécessaire d'installer Python et PostgreSQL.

- [Node.js](https://nodejs.org) 8 ou supérieur
```bash
$ sudo apt-get update && sudo apt install nodejs
$ nodejs -v
v8.10.0 
```

- [yarn](https://yarnpkg.com)
```bash
$ curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
$ echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
$ sudo apt-get update && sudo apt-get install yarn
$ yarn --version
1.15.2
```

Un script [Node.js](https://nodejs.org) permet de servir l'interface et de faire proxy vers l'API de production.

installation des dépendances Node.js
```bash
$ yarn
```

Démarrage du serveur Web (port 3000 par défaut)
```bash
$ yarn start
```

### 4- Suite de l'installation : pour développer l'ensemble de l'application  (Full Stack: Back End + Front End)

PostgreSQL
```bash
$ sudo apt-get update && sudo apt install postgresql-10
$ psql -V
psql (PostgreSQL) 10.7 (Ubuntu 10.7-0ubuntu0.18.04.1)
```

Creation de la base de données et import des données :

Le script commence par créer une base de données PostgreSQL et une table, puis télécharge les données DVF retraitées par Etalab, disponibles [ici](https://github.com/etalab/dvf/). Enfin quelques post-traitements sont effectués (traitement de quelques minutes).

```bash
$ sh db/build_db.sh
```

Configuration de l'accès à la base de données

Dans la commande ci-dessous, remplacer <YOUR PASSWORD> par votre mot de passe.
```bash
$ sudo -u postgres psql
postgres=# \password postgres
Enter new password: <YOUR PASSWORD>
Enter it again: <YOUR PASSWORD>
postgres=# \q

$ echo -e "postgres\n<YOUR PASSWORD>\nlocalhost" > config.csv
```

Installation des packages pythons :
```bash
$ sudo apt-get update && sudo apt install python3
$ sudo update-alternatives --install /usr/bin/python python /usr/bin/python3 10
$ sudo apt install libpq-dev python-dev
$ sudo apt install python3-psycopg2 python3-flask python3-pandas python3-sqlalchemy python3-psycopg2
```

Démarrage du serveur Web (port 5000 par défaut)

```bash
$ python app.py
```

### Configuration

Certains paramètres peuvent être écrasés au moyen d'un fichier `.env`. Le fichier `.env.sample` est fourni en exemple.

### Re-générer le fichier `communes-mapping.json`

```
yarn build-communes-mapping
```
