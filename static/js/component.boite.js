Vue.component('boite', {
	// Les paramètres sont là
	props: ['prix_m2', 'valeur', 'icone', 'texte'],
	// La on donne le code source HTML du composant qui peut utiliser des données
	template:
		`<div class="media d-flex">
			<div class="align-self-center ml-1 mr-1">
				<i :class="'fa-2x fa-fw ' + icone"></i>
			</div>
			<div class="media-body text-left ml-1">
				<b>{{valeur}}</b><br>
				<span v-if="prix_m2">{{prix_m2}} € / m²<br></span>
				<span>{{texte}}</span>
			</div>
		</div>`
});
