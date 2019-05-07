#!/bin/bash
# Script de creation de la base de donnees PostgreSQL 
DIR=$(echo $(dirname $0))
cd $DIR

sudo -u postgres psql -c "DROP DATABASE IF EXISTS dvf2;"
sudo -u postgres psql -c "CREATE DATABASE dvf2;"
sudo -u postgres psql -c "ALTER DATABASE dvf2 SET datestyle TO ""ISO, DMY"";"
sudo -u postgres psql -d dvf2 -f "create_table.sql"

# Chargement des données 
DATADIR="data"
mkdir -p $DATADIR

for YEAR in 2014 2015 2016 2017 2018
do
  [ ! -f $DATADIR/full_$YEAR.csv.gz ] && wget -r -np -nH --cut-dirs 5  https://cadastre.data.gouv.fr/data/etalab-dvf/latest/csv/$YEAR/full.csv.gz -O $DATADIR/full_$YEAR.csv.gz
done

find $DATADIR -name '*.gz' -exec gunzip -f '{}' \;

#Chargement des données
DATAPATH=$( cd $DATADIR ; pwd -P )
for YEAR in 2014 2015 2016 2017 2018
do
  sudo -u postgres psql -d dvf2 -c "COPY dvf FROM '$DATAPATH/full_$YEAR.csv' delimiter ',' csv header encoding 'UTF8';"
done

# Ajout d'une colonne et d'index - Assez long
sudo -u postgres psql -d dvf2 -f "alter_table.sql"

