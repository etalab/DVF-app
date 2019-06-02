-- Update après chargement

-- Ajout de colonne

UPDATE dvf SET section_prefixe = substr(id_parcelle, 6, 5) ;
UPDATE dvf SET nature_culture = 'Terrain à bâtir' WHERE code_nature_culture = 'AB';
UPDATE dvf SET nature_culture_speciale = 'Abreuvoirs' WHERE code_nature_culture_speciale = 'ABREU';