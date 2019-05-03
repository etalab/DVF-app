#!/bin/bash
# Script de creation de la base de donnees PostgreSQL 

sudo -u postgres psql -c "DROP DATABASE IF EXISTS dvf2;"
sudo -u postgres psql -c "CREATE DATABASE dvf2;"
sudo -u postgres psql -c "ALTER DATABASE dvf2 SET datestyle TO ""ISO, DMY"";"
sudo -u postgres psql -d dvf2 -f "create_table_jd.sql"

# Chargement des données 
mkdir data
cd data

wget -r -np -nH --cut-dirs 5  https://cadastre.data.gouv.fr/data/etalab-dvf/latest/csv/2014/full.csv.gz -O full_2014.csv.gz
wget -r -np -nH --cut-dirs 5  https://cadastre.data.gouv.fr/data/etalab-dvf/latest/csv/2015/full.csv.gz -O full_2015.csv.gz
wget -r -np -nH --cut-dirs 5  https://cadastre.data.gouv.fr/data/etalab-dvf/latest/csv/2016/full.csv.gz -O full_2016.csv.gz
wget -r -np -nH --cut-dirs 5  https://cadastre.data.gouv.fr/data/etalab-dvf/latest/csv/2017/full.csv.gz -O full_2017.csv.gz
wget -r -np -nH --cut-dirs 5  https://cadastre.data.gouv.fr/data/etalab-dvf/latest/csv/2018/full.csv.gz -O full_2018.csv.gz
find . -name '*.gz' -exec gunzip -f '{}' \;

#Chargement des données
DIR="$( cd "$(dirname "$0")" ; pwd -P )"
sudo -u postgres psql -d dvf2 -c "COPY dvf FROM '$DIR/full_2014.csv' delimiter ',' csv header encoding 'UTF8';"
sudo -u postgres psql -d dvf2 -c "COPY dvf FROM '$DIR/full_2015.csv' delimiter ',' csv header encoding 'UTF8';"
sudo -u postgres psql -d dvf2 -c "COPY dvf FROM '$DIR/full_2016.csv' delimiter ',' csv header encoding 'UTF8';"
sudo -u postgres psql -d dvf2 -c "COPY dvf FROM '$DIR/full_2017.csv' delimiter ',' csv header encoding 'UTF8';"
sudo -u postgres psql -d dvf2 -c "COPY dvf FROM '$DIR/full_2018.csv' delimiter ',' csv header encoding 'UTF8';"


# Ajout d'une colonne et d'index - Assez long
cd ..
sudo -u postgres psql -d dvf2 -f "alter_table_jd.sql"

