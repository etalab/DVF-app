# Développer en local sans installer quoi que ce soit

Le seul prérequis est d'avoir docker et docker-compose installé sur votre machine.

le script `restart.sh` va démarrer trois containers:
- une instance de base de données
- Une serveur python
- Un client nodejs

Ces trois containers vont monter le répertoire de développement en volume. 
Toutes les modifications effectuées dans le répertoire sont visibles directement dans les trois serveurs de dev.

## Configuration

### Configuration de la base de données

Il faut copier le fichier `./docker-compose/.env.sample` vers `./docker-compose/.env` et renseigner le mot de passe d'accès à la base de données.

### Configuration du serveur

le fichier de donfiguration `./config.csv` doit être renseigné comme suit:

```
postgres
<mot de passe base de données>
postgres
dvf_202010

```

**Note**: Modifier le nom de la base de données en fonction de la version de l'application (voir dans le script `build_db.sh`).

### Configuration du client

Le fichier `./.env` doit être configuré comme suit:

```
API_URL=http://server:5000/api
PORT=3000

```

## Alimentation de la base de données

La commande executée pour alimenter la base de données nécessite d'être lancée depuis ce serveur.

Voici les étapes:

- `docker exec -it postgres bash`
- `cd /home/dvfapp`

A partir de ce moment là on se trouve dans le container de base de données au niveau du répertoire des sources et la suite ne change pas.

- `cd db`
- `./build_db.sh`

**Attention**: Le batch `build_db.sh` ne va pas fonctionner si le serveur est connecté à la base de données. Pour éviter celà, quittez la webapp sur vos browsers, redémarrez l'ensemble (`restart.sh`) et lancez le script. 
