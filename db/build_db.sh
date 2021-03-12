#!/bin/bash
# Script de création de la base de donnees PostgreSQL
DIR=$(echo $(dirname $0))
cd $DIR


declare -A dvf_datasets
dvf_datasets[2015]="09f013c5-9531-444b-ab6c-7a0e88efd77d"
dvf_datasets[2016]="0ab442c5-57d1-4139-92c2-19672336401c"
dvf_datasets[2017]="7161c9f2-3d91-4caf-afa2-cfe535807f04"
dvf_datasets[2018]="1be77ca5-dc1b-4e50-af2b-0240147e0346"
dvf_datasets[2019]="3004168d-bec4-44d9-a781-ef16f41856a2"
dvf_datasets[2020]="90a98de0-f562-4328-aa16-fe0dd1dca60f"

datasets_url="https://www.data.gouv.fr/fr/datasets/r/"

sudo -u postgres psql -c "DROP DATABASE IF EXISTS dvf_202010;"
sudo -u postgres psql -c "CREATE DATABASE dvf_202010;"
sudo -u postgres psql -c "ALTER DATABASE dvf_202010 SET datestyle TO ""ISO, DMY"";"
sudo -u postgres psql -d dvf_202004 -f "create_table.sql"

# Chargement des données sur le serveur
DATADIR="dvf/data"
mkdir -p $DATADIR

for YEAR in 2015 2016 2017 2018 2019 2020 
do
  [ ! -f $DATADIR/valeursfoncieres-$YEAR.txt.gzip ] && wget -r -np -nH -N --cut-dirs 5  ${datasets_url}${dvf_datasets[${YEAR}]} -O $DATADIR/valeursfoncieres-$YEAR.txt && \
    echo gzipping file $DATADIR/valeursfoncieres-$YEAR.txt as the improve-csv script needs zip file as an input && \
    gzip -f $DATADIR/valeursfoncieres-$YEAR.txt 
done

cd dvf
npm install
cd ..

export ANNEES=2015,2016,2017,2018,2019,2020
export COG_MILLESIME="2020"
export CADASTRE_MILLESIME="2020-07-01"
export DISABLE_GEOCODING="1"
node --max-old-space-size=8192 dvf/improve-csv

#Chargement des données dans postgres
DATAPATH=$( cd $DATADIR ; pwd -P )
for YEAR in 2015 2016 2017 2018 2019 2020
do
  mv dvf/dist/${YEAR}/full.csv.gz $DATAPATH/full_$YEAR.csv.gz
  gunzip -f $DATAPATH/full_$YEAR.csv.gz
  sudo -u postgres psql -d dvf_202010 -c "COPY dvf FROM '$DATAPATH/full_$YEAR.csv' delimiter ',' csv header encoding 'UTF8';"
done

# Ajout d'une colonne et d'index - Assez long
sudo -u postgres psql -d dvf_202010 -f "alter_table.sql"
