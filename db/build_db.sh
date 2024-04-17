#!/bin/bash
# Script de création de la base de donnees PostgreSQL
DIR=$(echo $(dirname $0))
cd $DIR

month="12"
year_end="2023"
min_year=2019
max_year=2023

sudo -u postgres psql -c "DROP DATABASE IF EXISTS dvf_${year_end}${month};"
sudo -u postgres psql -c "CREATE DATABASE dvf_${year_end}${month};"
sudo -u postgres psql -c "ALTER DATABASE dvf_${year_end}${month} SET datestyle TO ""ISO, DMY"";"
sudo -u postgres psql -d dvf_${year_end}${month} -f "create_table.sql"

# Chargement des données sur le serveur
DATADIR="data"
mkdir -p $DATADIR

for ((YEAR = $min_year ; YEAR <= $max_year ; YEAR++));
do
  [ ! -f $DATADIR/full_$YEAR.csv.gz ] && wget -r -np -nH -N --cut-dirs 5  https://files.data.gouv.fr/geo-dvf/latest/csv/$YEAR/full.csv.gz -O $DATADIR/full_$YEAR.csv.gz
done

find $DATADIR -name '*.gz' -exec gunzip -f '{}' \;

#Chargement des données dans postgres
DATAPATH=$( cd $DATADIR ; pwd -P )
for ((YEAR = $min_year ; YEAR <= $max_year ; YEAR++));
do
  sudo -u postgres psql -d dvf_$year_end$month -c "COPY dvf FROM '$DATAPATH/full_$YEAR.csv' delimiter ',' csv header encoding 'UTF8';"
done

# Ajout d'une colonne et d'index - Assez long
sudo -u postgres psql -d dvf_$year_end$month -f "alter_table.sql"
