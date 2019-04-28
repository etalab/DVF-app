#!/bin/bash
# Script de creation de la base de donnees PostgreSQL 

mkdir data

sudo -u postgres psql -c "DROP DATABASE IF EXISTS dvf;"
sudo -u postgres psql -c "CREATE DATABASE dvf;"
sudo -u postgres psql -c "ALTER DATABASE dvf SET datestyle TO ""ISO, DMY"";"
sudo -u postgres psql -d dvf -f "create_table.sql"

# Chargement des données 
cd data
wget -r -np -nH --level 0 --cut-dirs 3 'https://static.data.gouv.fr/resources/demande-de-valeurs-foncieres/20190417-121621/valeursfoncieres-2018.txt'
wget -r -np -nH --level 0 --cut-dirs 3 'https://static.data.gouv.fr/resources/demande-de-valeurs-foncieres/20190417-143602/valeursfoncieres-2017.txt'
wget -r -np -nH --level 0 --cut-dirs 3 'https://static.data.gouv.fr/resources/demande-de-valeurs-foncieres/20190417-145226/valeursfoncieres-2016.txt'
wget -r -np -nH --level 0 --cut-dirs 3 'https://static.data.gouv.fr/resources/demande-de-valeurs-foncieres/20190417-124719/valeursfoncieres-2015.txt'
wget -r -np -nH --level 0 --cut-dirs 3 'https://static.data.gouv.fr/resources/demande-de-valeurs-foncieres/20190417-123017/valeursfoncieres-2014.txt'

# Modification de la base (on enlève les décimales).
perl -i.bak -pe 's/\,\d\d//g' valeursfoncieres-2014.txt
perl -i.bak -pe 's/\,\d\d//g' valeursfoncieres-2015.txt
perl -i.bak -pe 's/\,\d\d//g' valeursfoncieres-2016.txt
perl -i.bak -pe 's/\,\d\d//g' valeursfoncieres-2017.txt
perl -i.bak -pe 's/\,\d\d//g' valeursfoncieres-2018.txt

#Chargement des données
DIR="$( cd "$(dirname "$0")" ; pwd -P )"
sudo -u postgres psql -d dvf -c "COPY dvf FROM '$DIR/valeursfoncieres-2014.txt' delimiter '|' csv header encoding 'UTF8';"
sudo -u postgres psql -d dvf -c "COPY dvf FROM '$DIR/valeursfoncieres-2015.txt' delimiter '|' csv header encoding 'UTF8';"
sudo -u postgres psql -d dvf -c "COPY dvf FROM '$DIR/valeursfoncieres-2016.txt' delimiter '|' csv header encoding 'UTF8';"
sudo -u postgres psql -d dvf -c "COPY dvf FROM '$DIR/valeursfoncieres-2017.txt' delimiter '|' csv header encoding 'UTF8';"
sudo -u postgres psql -d dvf -c "COPY dvf FROM '$DIR/valeursfoncieres-2018.txt' delimiter '|' csv header encoding 'UTF8';"

# Ajout de colonnes et normalisation de champs -- Assez long
cd ..
sudo -u postgres psql -d dvf -f "alter_table.sql"

