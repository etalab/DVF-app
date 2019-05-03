-- Update après chargement

-- Ajout de colonne
ALTER TABLE dvf
ADD COLUMN section_prefixe char(5);
UPDATE dvf SET section_prefixe = substr(id_parcelle, 6, 5) ;

-- Ajout d'index
CREATE INDEX idx_sectionPrefixe ON dvf(section_prefixe) ;
CREATE INDEX idx_commune ON dvf(code_commune) ;
CREATE INDEX idx_date ON dvf(date_mutation) ;
CREATE INDEX idx_parcelle ON dvf(id_parcelle) ;
CREATE INDEX idx_section_commune ON dvf(code_commune, section_prefixe) ;
