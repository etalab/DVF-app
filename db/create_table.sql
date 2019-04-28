-- Création de la table DVF


-- DROP TABLE public.dvf;
CREATE TABLE public.dvf
(
	"Code service CH" character varying,
	"Reference document" character varying,
	"1 Articles CGI" character varying,
	"2 Articles CGI" character varying,
	"3 Articles CGI" character varying,
	"4 Articles CGI" character varying,
	"5 Articles CGI" character varying,
	"No disposition" character varying,
	"Date mutation" date,
	"Nature mutation" character varying,
	"Valeur fonciere" character varying,
	"No voie" character varying,
	"B/T/Q" character varying,
	"Type de voie" character varying,
	"Code voie" character varying,
	"Voie" character varying,
	"Code postal" character varying,
	"Commune" character varying,
	"Code departement" character varying,
	"Code commune" character varying,
	"Prefixe de section" character varying,
	"Section" character varying,
	"No plan" character varying,
	"No Volume" character varying,
	"1er lot" character varying,
	"Surface Carrez du 1er lot" character varying,
	"2eme lot" character varying,
	"Surface Carrez du 2eme lot" character varying,
	"3eme lot" character varying,
	"Surface Carrez du 3eme lot" character varying,
	"4eme lot" character varying,
	"Surface Carrez du 4eme lot" character varying,
	"5eme lot" character varying,
	"Surface Carrez du 5eme lot" character varying,
	"Nombre de lots" integer,
	"Code type local" integer,
	"Type local" character varying,
	"Identifiant local" character varying,
	"Surface reelle bati" integer,
	"Nombre pieces principales" integer,
	"Nature culture" character varying,
	"Nature culture speciale" character varying,
	"Surface terrain" integer	
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

	

