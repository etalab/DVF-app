-- Update après chargement

-- Ajout de colonne
ALTER TABLE dvf
ADD COLUMN section_prefixe char(5);
UPDATE dvf SET section_prefixe = substr(id_parcelle, 6, 5) ;

-- Ajout d'index
CREATE INDEX idx_sectionPrefixe2 ON dvf(section_prefixe) ;
CREATE INDEX idx_commune2 ON dvf(code_commune) ;
CREATE INDEX idx_date2 ON dvf(date_mutation) ;
CREATE INDEX idx_parcelle2 ON dvf(id_parcelle) ;
CREATE INDEX idx_section_commune2 ON dvf(code_commune, section_prefixe) ;
