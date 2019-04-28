-- Update après chargement

-- Ajout de colonne
ALTER TABLE public.dvf
ADD COLUMN "Code parcelle" char(14);
ALTER TABLE public.dvf
ADD COLUMN "Code INSEE" char(5);
ALTER TABLE public.dvf
ADD COLUMN "Section prefixe" char(5);

-- Modification ou peuplement + index
UPDATE public.dvf
SET "Code departement" = (
		CASE WHEN "Code departement" IN ('971', '972', '973', '974', '975', '976') 
		THEN LPAD("Code departement", 3, '0')
		ELSE LPAD("Code departement", 2, '0')
		END);
CREATE INDEX idx_departement ON dvf("Code departement") ;

UPDATE public.dvf
SET "Code commune" = (
		CASE WHEN "Code departement" IN ('971', '972', '973', '974', '975', '976') 
		THEN LPAD("Code commune", 2, '0')
		ELSE LPAD("Code commune", 3, '0')
		END);
CREATE INDEX idx_commune ON dvf("Code commune") ;

UPDATE public.dvf SET "Code parcelle" = "Code departement" || "Code commune" || LPAD(coalesce("Prefixe de section",''),3,'0') || LPAD("Section", 2, '0') ||LPAD("No plan", 4, '0') ;
CREATE INDEX idx_parcelle ON dvf("Code parcelle") ;

UPDATE public.dvf SET "Section prefixe" = LPAD(coalesce("Prefixe de section",''),3,'0') || LPAD("Section", 2, '0') ;
CREATE INDEX idx_sectionPrefixe ON dvf("Section prefixe") ;

UPDATE public.dvf SET "Code INSEE" = "Code departement" || "Code commune" ;
CREATE INDEX idx_section_commune ON dvf("Code INSEE", "Section prefixe") ;
CREATE INDEX idx_date ON dvf("Date mutation") ;