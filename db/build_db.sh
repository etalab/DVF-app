#!/bin/bash
# Script de création de la base de donnees PostgreSQL
DIR=$(echo $(dirname $0))
cd $DIR

url=$(curl -L --silent 'https://www.data.gouv.fr/api/1/datasets/5cc1b94a634f4165e96436c1'| jq -r '.resources[]|select(.title|contains("unique"))|.url')
filename=$(basename $url)
filename_no_gz=$(echo $filename|sed 's#\.gz##g')

DATADIR="data"
mkdir -p $DATADIR
[ ! -f $DATADIR/$filename ] && wget -r -np -nH -N --cut-dirs 5  $url -O $DATADIR/$filename 
find $DATADIR -name '*.gz' -exec gunzip -f '{}' \;


last_date=$(xsv select date_mutation $DATADIR/$filename_no_gz | sort | uniq | sort|grep -v date_mutation| tail -n1 -)
month=$(echo $last_date | cut -d '-' -f2)
year_end=$(echo $last_date | cut -d '-' -f1)

sudo -u postgres psql -c "DROP DATABASE IF EXISTS dvf_${year_end}${month};"
sudo -u postgres psql -c "CREATE DATABASE dvf_${year_end}${month};"
sudo -u postgres psql -c "ALTER DATABASE dvf_${year_end}${month} SET datestyle TO ""ISO, DMY"";"
sudo -u postgres psql -d dvf_${year_end}${month} -f "create_table.sql"

# Chargement des données sur le serveur


#Chargement des données dans postgres
DATAPATH=$( cd $DATADIR ; pwd -P )
sudo -u postgres psql -d dvf_$year_end$month -c "COPY dvf FROM '$DATAPATH/$filename_no_gz' delimiter ',' csv header encoding 'UTF8';"

# Ajout d'une colonne et d'index - Assez long
sudo -u postgres psql -d dvf_$year_end$month -f "alter_table.sql"

