Vue.component('boite-accordeon', {
	// Les paramètres sont là
	props: ['couleur', 'mutation', 'icone', 'index'],
	// La on donne le code source HTML du composant qui peut utiliser des données

	template: `<div class="card mt-3">
				<div class="card-body" v-on:click="selectionnerMutation()">
					<div class="media d-flex">
						<div class="align-self-center ml-1 mr-1">
							<i class="fas fa-file-signature fa-fw fa-2x"></i>
						</div>
						<div class="media-body text-left ml-1">
							<b>{{ formatterNombre(mutation.infos[0]['valeur_fonciere']) }} € / {{ mutation.infos[0]['nature_mutation'] }}</b><br>
							<span>{{ mutation.infos[0]['date_mutation'] }}</span>
							<div class="address">{{ formatterAdresseNumero(mutation.infos[0]['adresse_numero']) }}{{ formatterSuffixe(mutation, mutation.infos[0]['adresse_suffixe']) }} {{ mutation.infos[0]['adresse_nom_voie'] }}</div>
			 			</div>
						<div v-if="vue.mutationIndex != index" class="ml-1 mr-1">
							<i class="fas fa-sort-down fa-1x"></i>
						</div>
					</div>
					<div v-if="vue.mutationIndex == index" style="background-color: #eee" class="mt-3">
						<boite
							v-for="batiment in mutation.batiments"
							:valeur="(batiment['code_type_local'] != 3) ? (formatterNombre(batiment['surface_reelle_bati']) + ' m²') : ''"
							:prix_m2="prixMetreCarre"
							:icone="['', 'fa fa-home', 'fas fa-building', 'fas fa-warehouse', 'fas fa-store'][batiment['code_type_local']]"
							:texte="batiment['type_local'] + ((batiment['code_type_local'] < 3) ? (' / ' + formatterNombre(batiment['nombre_pieces_principales']) + ' p') : '')">
						</boite>
						<boite
							v-for="terrain in mutation.terrains"
							:valeur="formatterNombre(terrain['surface_terrain']) + ' m²'"
							icone="fa fa-tree"
							:texte="terrain['nature_culture'] + (terrain['nature_culture_speciale'] != 'None' ? ' / ' + terrain['nature_culture_speciale'] : '')">
						</boite>
							<div v-if="mutation.parcellesLiees.length > 0" style = "padding:0.5rem">
								Cette mutation contient des dispositions dans des parcelles adjacentes. La valeur foncière correspond au total.
							</div>
					</div>
			</div>
		</div>`,
	methods: {
		selectionnerMutation() {
			entrerDansMutation(this.index);
		}
	},
	computed: {
		prixMetreCarre() {
			if (this.mutation.batiments.length !== 1) return '';
			var prixM2 = this.mutation.batiments[0]['valeur_fonciere'] / this.mutation.batiments[0]['surface_reelle_bati'];
			if (isNaN(prixM2)) return '';
			return formatterNombre(prixM2.toString());
		}
	}
});

function formatterNombre(nombreDecimal) {
	return nombreDecimal.replace(/\..*/g, '').replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
}

function formatterAdresseNumero(nombreDecimal) {
	if (! isNaN(nombreDecimal)) {
		return nombreDecimal.replace(/\..*/g, '');
	}
}

function formatterSuffixe(mutation, adresse_suffixe) {
	if (!adresse_suffixe.match(/none/i)) {
		return adresse_suffixe;
	}
}
