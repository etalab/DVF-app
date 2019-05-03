-- DROP TABLE dvf;
CREATE TABLE public.dvf
(
	id_mutation CHARACTER VARYING,
	date_mutation DATE,
	numero_disposition INTEGER,
	nature_mutation CHARACTER VARYING,
	valeur_fonciere DECIMAL(12,2),
	adresse_numero INTEGER,
	adresse_suffixe CHARACTER VARYING,
	adresse_nom_voie CHARACTER VARYING,
	adresse_code_voie CHARACTER VARYING,
	code_postal CHARACTER VARYING,
	code_commune CHARACTER VARYING,
	nom_commune CHARACTER VARYING,
	code_departement CHARACTER VARYING,
	ancien_code_commune CHARACTER VARYING,
	ancien_nom_commune CHARACTER VARYING,
	id_parcelle CHARACTER VARYING,
	ancien_id_parcelle CHARACTER VARYING,
	numero_volume CHARACTER VARYING,
	lot1_numero CHARACTER VARYING,
	lot1_surface_carrez DECIMAL(9,2),
	lot2_numero CHARACTER VARYING,
	lot2_surface_carrez DECIMAL(9,2),
	lot3_numero CHARACTER VARYING,
	lot3_surface_carrez DECIMAL(9,2),
	lot4_numero CHARACTER VARYING,
	lot4_surface_carrez DECIMAL(9,2),
	lot5_numero CHARACTER VARYING,
	lot5_surface_carrez DECIMAL(9,2),
	nombre_lots INTEGER,
	code_type_local CHARACTER VARYING,
	type_local CHARACTER VARYING,
	surface_reelle_bati DECIMAL(9,2),
	nombre_pieces_principales INTEGER,
	code_nature_culture CHARACTER VARYING,
	nature_culture CHARACTER VARYING,
	code_nature_culture_speciale CHARACTER VARYING,
	nature_culture_speciale CHARACTER VARYING,
	surface_terrain DECIMAL(12,2),
	longitude DECIMAL(9, 7),
	latitude DECIMAL(9, 7)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

	

