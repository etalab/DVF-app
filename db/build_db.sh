#!/bin/bash
# Script de création de la base de donnees PostgreSQL
#set -x
set -e

YEAR_START="2018"
YEAR_END="2022"
DB_NAME="dvf_db"
DATA_DIRECTORY="data"

DIR=$(echo $(dirname $0))
cd $DIR
pwd

YEARS=$( eval echo {$YEAR_START..$YEAR_END} )

echo "[Téléchargement des données dans $DATA_DIRECTORY pour les années $YEARS]"
mkdir -p $DATA_DIRECTORY

for YEAR in $YEARS
do

  URL="https://files.data.gouv.fr/geo-dvf/latest/csv/$YEAR/full.csv.gz"
  CSV_FILE="$DATA_DIRECTORY/full_$YEAR.csv.gz"
  printf "$YEAR $url => $CSV_FILE :"
  if [ -e "$CSV_FILE" ]; then
    echo "already done"
  else
    echo ""
    wget -r -np -nH -N --cut-dirs 5 $url -O $CSV_FILE
  fi
done


echo "[Décompression des données]"
for YEAR in $YEARS
do
  gz_file="$DATA_DIRECTORY/full_$YEAR.csv.gz"
  CSV_FILE="$DATA_DIRECTORY/full_$YEAR.csv"
  printf "zcat $gz_file > $CSV_FILE :"
  if [ -e "$CSV_FILE" ]; then
    echo "already done"
  else
    echo ""
    zcat $gz_file > $CSV_FILE
  fi
done

echo "[Réinitilisation de la base de données: $DB_NAME]";
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME SET datestyle TO ""ISO, DMY"";"
sudo -u postgres psql -d $DB_NAME -f "create_table.sql"

echo "[Réimport des données]"
DATAPATH=$( cd $DATA_DIRECTORY ; pwd -P )
for YEAR in $YEARS
do
  printf "$YEAR ..."
  sudo -u postgres psql -d $DB_NAME -c "COPY dvf FROM '$DATAPATH/full_$YEAR.csv' delimiter ',' csv header encoding 'UTF8';"
done

echo "[Indexation]"
sudo -u postgres psql -d $DB_NAME -f "alter_table.sql"
