Vue.component('boite-accordeon', {
	// Les paramètres sont là
	props: ['couleur', 'mutation', 'icone', 'index'],
	data () {
		return {
			showDetail: false
		}
	},
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
						<mutation :mutation="mutation"></mutation>
						<div v-if="mutation.mutationsLiees.length > 0" style = "padding:0.5rem">
							Cette mutation contient des dispositions dans des parcelles adjacentes. La valeur foncière correspond au total.
							<br><button v-on:click="showDetail = !showDetail">Voir le contenu des autres parcelles de cette mutation</button>
						</div>
						<div class="mutations-liees" v-if="showDetail && mutation.mutationsLiees.length > 0">
							<mutation
							  v-for="mutationLiee in mutation.mutationsLiees"
							  :mutation="mutationLiee">
						  </mutation>
						</div>
					</div>
			</div>
		</div>`,
	methods: {
		selectionnerMutation() {
			entrerDansMutation(this.index);
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
