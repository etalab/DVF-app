Vue.component('mutation', {
	// Les paramètres sont là
	props: ['couleur', 'mutation', 'icone', 'index'],
	// La on donne le code source HTML du composant qui peut utiliser des données
	template:
		`<div class="mutation">
			<boite
				v-for="batiment in mutation.batiments"
				:valeur="(batiment['code_type_local'] != 3) ? (formatterNombre(batiment['surface_reelle_bati']) + ' m²') : ''"
				:icone="['', 'fa fa-home', 'fas fa-building', 'fas fa-warehouse', 'fas fa-store'][batiment['code_type_local']]"
				:texte="batiment['type_local'] + ((batiment['code_type_local'] < 3) ? (' / ' + formatterNombre(batiment['nombre_pieces_principales']) + ' p') : '')">
			</boite>
			<boite
				v-for="terrain in mutation.terrains"
				:valeur="formatterNombre(terrain['surface_terrain']) + ' m²'"
				icone="fa fa-tree"
				:texte="terrain['nature_culture'] + (terrain['nature_culture_speciale'] != 'None' ? ' / ' + terrain['nature_culture_speciale'] : '')">
			</boite>
		</div>`
});

function formatterNombre(nombreDecimal) {
	return nombreDecimal.replace(/\..*/g, '').replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
}
