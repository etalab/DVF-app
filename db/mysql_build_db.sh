#!/bin/bash

# exit when any command fails
set -e
set -x

# Script de creation de la base de donnees MySQL
DIR=$(echo $(dirname $0))
cd $DIR


sudo mysql -e "GRANT ALL PRIVILEGES ON dvf2.* TO 'postgres'@'localhost' IDENTIFIED BY 'postgres';"
echo 1
sudo mysql -e "CREATE DATABASE IF NOT EXISTS dvf2;"
echo 2
cat mysql_create_table.sql | sudo mysql dvf2
echo 3
sudo mysql dvf2 -e "show tables;"

# Chargement des données 
DATADIR="data"
mkdir -p $DATADIR
YEARS="2014 2015 2016 2017 2018"

for YEAR in $(echo $YEARS | tr " " "\n"); do
  FILE=$DATADIR"/full_"$YEAR".csv"
  GZ_FILE=$FILE".gz"
  echo "[[ wget "$GZ_FILE
  [ ! -f $GZ_FILE ] && wget -r -np -nH --cut-dirs 5  https://cadastre.data.gouv.fr/data/etalab-dvf/latest/csv/$YEAR/full.csv.gz -O $GZ_FILE

  echo "[[ gz "$GZ_FILE" => "$FILE
  [ ! -f $FILE ] && gunzip -k -f $GZ_FILE
done


SECURE_FILE_PRIV="/var/lib/mysql-files/"

#Chargement des données
DATAPATH=$( cd $DATADIR ; pwd -P )
for YEAR in $(echo $YEARS | tr " " "\n"); do
  FILE="full_"$YEAR".csv"
  echo "[[ $FILE => mysql"
  sudo cp $DATAPATH"/"$FILE $SECURE_FILE_PRIV"/"$FILE
  sudo mysql dvf2 -e "SET SESSION sql_mode = ''; LOAD DATA INFILE '$SECURE_FILE_PRIV/$FILE' INTO TABLE dvf COLUMNS TERMINATED BY ',' LINES TERMINATED BY '\n' IGNORE 1 LINES
  (id_mutation,date_mutation,numero_disposition,nature_mutation,valeur_fonciere,adresse_numero,adresse_suffixe,adresse_nom_voie,adresse_code_voie,code_postal,code_commune,nom_commune,code_departement,ancien_code_commune,ancien_nom_commune,id_parcelle,ancien_id_parcelle,numero_volume,lot1_numero,lot1_surface_carrez,lot2_numero,lot2_surface_carrez,lot3_numero,lot3_surface_carrez,lot4_numero,lot4_surface_carrez,lot5_numero,lot5_surface_carrez,nombre_lots,code_type_local,type_local,surface_reelle_bati,nombre_pieces_principales,code_nature_culture,nature_culture,code_nature_culture_speciale,nature_culture_speciale,surface_terrain,longitude,latitude);"
  sudo rm $SECURE_FILE_PRIV"/"$FILE
done

cat mysql_alter_table.sql | sudo mysql dvf2

