// Partie Vue -----------------------------------------------------------------

// On commence par creer des "composants" qu'on va utiliser un peu partout

// Là on donne le nom du composant (comme un span, div, h3, etc)
Vue.component('boite', {
	// Les paramètres sont là
	props: ['couleur', 'valeur', 'icone', 'texte'],
	// La on donne le code source HTML du composant qui peut utiliser des données
	template: 
		`<div class="media d-flex mt-3">
			<div class="align-self-center ml-1 mr-1">
				<i :class="'fa-2x fa-fw ' + icone"></i>
			</div>
			<div class="media-body text-left ml-1">
				<b>{{valeur}}</b><br>
				<span>{{texte}}</span>
			</div>
		</div>`
});

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
							<b>{{ mutation.infos[0]['Valeur fonciere'] }} €</b><br>
							<span>{{ mutation.infos[0]['Date mutation'] }}</span>
			 			</div>
					</div>
					<div v-if="vue.mutationIndex == index" style="background-color: #eee" class="mt-3">
						<boite 
							v-for="batiment in mutation.batiments" 
							:valeur="(batiment['Code type local'] < 3) ? (batiment['Surface reelle bati'] + ' m²') : ''" 
							:icone="['', 'fa fa-home', 'fas fa-building', 'fas fa-warehouse', 'fas fa-store'][batiment['Code type local']]" 
							:texte="batiment['Type local'] + ((batiment['Code type local'] < 3) ? (' / ' + batiment['Nombre pieces principales'] + ' p') : '')">
						</boite>
						<boite 
							v-for="terrain in mutation.terrains"  
							:valeur="terrain['Surface terrain'] + ' m²'" 
							icone="fa fa-tree" 
							:texte="terrain['Libellé Nature de Culture'] + (terrain['Libellé Nature Culture Spéciale'] != '' ? ' / ' + terrain['Libellé Nature Culture Spéciale'] : '')">
						</boite>
							<div v-if="mutation.mutations_liees.length > 0" style = "padding:0.5rem">
								Cette mutation contient des dispositions dans des parcelles adjacentes. La valeur foncière correspond au total.
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


// Ici, on cree l'application Vue (on lui dit de se relier à l'élément HTML app)
var vue = new Vue({
		el: '#app',
		data: {
			fold_left: false,
			section: null,
			parcelle: {
				code: null
			},
			mutationIndex: null,
		},
		methods: {},
	});

// Partie JavaScript standard (sans framework) --------------------------------

// Définition des variables globales

var codeDepartement = null;
var codeCommune = null;
var codeSection = null;
var codeParcelle = null;

var communesLayer = null;
var sectionsLayer = null;
var parcellesLayer = null;
var labelsSections = [];
var data_dvf = null;
var nom_fichier_section = null;

var data_section = null;

var dateMin = '01-01-2015';
var dateMax = '01-01-2019';

// Fonctions

/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
  document.getElementById("sidebar_left").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}

$('.input-daterange input').each(function() {
    $(this).datepicker('clearDates');
});

function exportJson(el) {
	var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data_dvf));
	
	// const items = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data_dvf));
	// const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here ;
	// const header = Object.keys(items[0])
	// let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
	// csv.unshift(header.join(';'))
	// csv = csv.join('\r\n')
	// console.log(csv)


	el.setAttribute("href", "data:"+data);
	el.setAttribute("download", nom_fichier_section);    
}

function selectionnerDepartement() {
	// L'utilisateur a cliqué sur la liste déroulante des départements
	var e = document.getElementById("departements");
	var sonCode = e.options[e.selectedIndex].value;
	entrerDansDepartement(sonCode);

};

function selectionnerCommune() {
	// L'utilisateur a cliqué sur la liste déroulante des communes
	var e = document.getElementById("communes");
	var sonCode = e.options[e.selectedIndex].value;
	entrerDansCommune(sonCode);
}

function selectionnerSection() {
	// L'utilisateur a cliqué sur la liste déroulante des sections
	var e = document.getElementById("sections");
	var sonCode = e.options[e.selectedIndex].value;
	entrerDansSection(sonCode);
}

function selectionnerParcelle() {
	// L'utilisateur a cliqué sur la liste déroulante des sections
	var e = document.getElementById("parcelles");
	var sonCode = e.options[e.selectedIndex].value;
	entrerDansParcelle(sonCode);
}

function onEachFeatureCommune(feature, layer) {
	
	layer.on({
		click: onCityClicked
	});
}

function onEachFeatureSection(feature, layer) {

	var label = L.marker(layer.getBounds().getCenter(), {
			icon: L.divIcon({
				className: 'labelSection',
				html: feature.properties.code,
			})
		});
	label.addTo(map);
	labelsSections.push(label);
	$('#sections').append($('<option />', {
		value: feature.properties.code,
		text: feature.properties.code
	}));
	layer.on({
		click: onSectionClicked
	});
}

function viderLabelsSections() {

	for (label of labelsSections) {
		map.removeLayer(label);
	}
	labelsSections = [];
}

function onEachFeatureParcelle(feature, layer) {
	
	$('#parcelles').append($('<option />', {
		value: feature.id,
		text: feature.id
	}));
	layer.on({
		click: onParcelleClicked
	});
}

function onParcelleClicked(event) {

	sonCode = event.target.feature.id;
	document.getElementById("parcelles").value = sonCode;
	entrerDansParcelle(sonCode);
}

function entrerDansParcelle(sonCode) {
	
	codeParcelle = sonCode;
	console.log("Parcelle sélectionnée : " + codeParcelle);
	data_parcelle = null;
	$.getJSON("api/parcelles/" + codeParcelle + "/from=" + dateMin.replace(new RegExp("/", "g"), "-")  + '&to=' + dateMax.replace(new RegExp("/", "g"), "-") ,
		function (data) {
			data_parcelle = data;
			data_parcelle.mutations[0].infos[0]['Date mutation'] = (new Date(data_parcelle.mutations[0].infos[0]['Date mutation'])).toLocaleDateString('fr-FR');
			data_parcelle.mutations[0].infos[0]['Valeur fonciere'] = data_parcelle.mutations[0].infos[0]['Valeur fonciere'].replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
			vue.parcelle = {
				code: codeParcelle,
				n_mutations: data_parcelle.nbMutations,
				mutations: data_parcelle.mutations,
			};
			
			if (vue.parcelle.mutations.length == 1) {
				entrerDansMutation(0);
			} else {
				entrerDansMutation(null);
			}
		}
	);
}

function onSectionClicked(event) {

	sonCode = event.target.feature.properties.code;
	document.getElementById("sections").value = sonCode;
	entrerDansSection(sonCode);
}

function entrerDansMutation(sonIndex) {

	vue.mutationIndex = sonIndex;
	leCode = vue.parcelle.mutations.length > 0 ? vue.parcelle.mutations[0].infos[0]['Code parcelle'] : '';
	codesParcelles = [];
	if (sonIndex != null) {
		for (autre of vue.parcelle.mutations[sonIndex].mutations_liees) {
			codesParcelles.push(autre['Code parcelle']);
		}
	}
	parcellesLayer.eachLayer(function (layer) {
		var aColorier = false;
		for (mutation of data_section.donnees) {
			if (mutation["Code parcelle"] == layer.feature.id) {
				aColorier = true;
			}
		}
		if (aColorier) {
			style = {
				color: '#238FD8',
				fillOpacity: 0.5
			};
			for (autreCode of codesParcelles) {
				if (autreCode == layer.feature.id) {
					style = {
						color: '#ff8FD8',
						fillOpacity: 0.5
					};
				}
			}
			if (leCode == layer.feature.id) {
				style = {
					color: '#ff5FA8',
					fillOpacity: 0.8
				};
			}
			layer.setStyle(style);
		};
	});
}

function entrerDansSection(sonCode) {
	
	codeSection = sonCode;
	console.log("Section sélectionnée : " + sonCode);
	viderLabelsSections();
	vue.parcelle = null;
	document.getElementById('parcelles').innerHTML = '<option style="display:none"></option>';
	$.when(
		// Charge la couche géographique
		$.getJSON("cadastre/" + codeDepartement + "/" + codeCommune + "/cadastre-" + codeCommune + "-parcelles.json",
			function (data) {
				data_geo = data;
			}
		),
		// Charge les mutations
		$.getJSON("api/mutations/" + codeCommune + "/" + sonCode + "/from=" + dateMin.replace(new RegExp("/", "g"), "-") + '&to=' + dateMax.replace(new RegExp("/", "g"), "-") ,
			function (data) {
				data_section = data;
				data_dvf = data.data_dvf;
			}
		)
	).then(
		// Une fois qu'on a la géographie et les mutations, on fait tout l'affichage
		function () {
			data_geo.features = data_geo.features.filter(e => (sonCode == e.properties.section));
			if (parcellesLayer != null) {
				map.removeLayer(parcellesLayer);
			}
			parcellesLayer = L.geoJson(data_geo, {
				style: function (feature) {
					var aColorier = false;
					for (mutation of data_section.donnees) {
						if (mutation["Code parcelle"] == feature.id) {
							aColorier = true;
						}
					}
					if (aColorier) {
						return {
							color: '#238FD8',
							fillOpacity: 0.5
						};
					} else {
						return {
							color: '#212f39',
							fillOpacity: 0.2
						};
					}
				},
				weight: 1,
				onEachFeature: onEachFeatureParcelle
			});
			if (parcellesLayer != null) {
				map.removeLayer(parcellesLayer);
			}
			parcellesLayer.addTo(map);
			map.fitBounds(parcellesLayer.getBounds());
			nom_fichier_section = codeCommune + '_' + sonCode + '.json';
			vue.section = {
				code: sonCode,
				n_mutations: data_section.nbMutations,
			};
			
		}
	);
}


function entrerDansCommune(sonCode) {

	console.log("Nous entrons dans la commune " + sonCode);
	viderLabelsSections();
	vue.section = null;
	codeCommune = sonCode;
	document.getElementById('sections').innerHTML = '<option style="display:none"></option>';
	document.getElementById('parcelles').innerHTML = '<option style="display:none"></option>';
	$.getJSON("cadastre/" + codeDepartement + "/" + codeCommune + "/cadastre-" + codeCommune + "-sections.json",
		function (data) {
			if (sectionsLayer != null) {
				map.removeLayer(sectionsLayer);
			}
			sectionsLayer = L.geoJson(data, {
					weight: 1,
					fillOpacity: 0.2,
					color: '#212f39',
					onEachFeature: onEachFeatureSection
				});
			if (parcellesLayer != null) {
				map.removeLayer(parcellesLayer);
			}
			sectionsLayer.addTo(map);
			map.fitBounds(sectionsLayer.getBounds());
		}
	);
}

function entrerDansDepartement(sonCode) {

	codeDepartement = sonCode;
	console.log('Nous entrons dans le département ' + codeDepartement);
	viderLabelsSections();
	vue.section = null;
	document.getElementById('communes').innerHTML = '<option style="display:none"></option>';
	document.getElementById('sections').innerHTML = '<option style="display:none"></option>';
	document.getElementById('parcelles').innerHTML = '<option style="display:none"></option>';
	$.getJSON(// "https://geo.api.gouv.fr/departements/"+ codeDepartement +"/communes?fields=contour&type=commune-actuelle,arrondissement-municipal",
		"donneesgeo/communesParDepartement/communes_" + codeDepartement + ".geojson",
		function (data) {
			if (communesLayer != null) {
				map.removeLayer(communesLayer);
			}
			communesLayer = L.geoJson(data, {
					weight: 1,
					fillOpacity: 0,
					color: '#212f39',
					onEachFeature: onEachFeatureCommune
				});
			if (sectionsLayer != null) {
				map.removeLayer(sectionsLayer);
			}
			if (parcellesLayer != null) {
				map.removeLayer(parcellesLayer);
			}
			communesLayer.addTo(map);
			map.fitBounds(communesLayer.getBounds());
		}
	);
	// Liste des communes du département
	$.getJSON("https://geo.api.gouv.fr/communes?codeDepartement=" + sonCode + "&fields=nom,code&type=commune-actuelle,arrondissement-municipal", 
		function (data) {
			var $select = $('#communes');
			$.each(data, function (i, val) {
				$select.append($('<option />', {
					value: data[i].code,
					text: data[i].nom
				}));
			});
		}
	);
}

function onCityClicked(event) {
	// L'utilisateur a cliqué sur la géométrie d'une commune
	var sonCode = event.sourceTarget.feature.properties.code;
	entrerDansCommune(sonCode);
	document.getElementById("communes").value = sonCode;
}

function onDepartementClick(event) {
	// L'utilisateur a cliqué sur la géométrie d'un département
	var id = event.target._leaflet_id;
	var sonCode = event.target._layers[id - 1]['feature'].properties.code;
	entrerDansDepartement(sonCode);
	document.getElementById("departements").value = sonCode;
};


// C'est le code qui est appelé au début (sans que personne ne clique)
(function () {

	// Mise en place de la carte
	map = new L.Map('mapid', min = 0, max = 30);
	var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {
			minZoom: 0,
			maxZoom: 30,
			attribution: osmAttrib
		});
	map.setView(new L.LatLng(47, 3), 5);
	map.addLayer(osm);

	// Paramètres français du range picker
	$('input[name="daterange"]').daterangepicker({
		opens: 'left',
		"locale": {
			"format": "DD/MM/YYYY",
			"separator": " - ",
			"applyLabel": "Valider",
			"cancelLabel": "Annuler",
			"fromLabel": "De",
			"toLabel": "à",
			"customRangeLabel": "Custom",
			"daysOfWeek": [
				"Dim",
				"Lun",
				"Mar",
				"Mer",
				"Jeu",
				"Ven",
				"Sam"
			],
			"monthNames": [
				"Janvier",
				"Février",
				"Mars",
				"Avril",
				"Mai",
				"Juin",
				"Juillet",
				"Août",
				"Septembre",
				"Octobre",
				"Novembre",
				"Décembre"
			],
			"firstDay": 1
		}
	}, function (start, end) {
		// Fonction executée quand la personne change les dates
		console.log("L'utilisateur a modifié la plage de dates. Rechargement des données.");
		dateMin = start.format('DD-MM-YYYY');
		dateMax = end.format('DD-MM-YYYY');
		if (codeSection != null) {
			chargerSection(codeSection);
		}
	});

	// Chargement de la liste des départements
	$.getJSON("donneesgeo/departements.json", 
		function (data) {
			var $select = $('#departements');
			$.each(data, function (i, val) {
				$select.append($('<option />', {
						value: data[i].code,
						text: data[i].nom
					}));
			});
		}
	);

	// Chargement des contours des départements
	$.getJSON("donneesgeo/departements-100m.geojson",
		function (data) {
			departements = data;
			departements.features.forEach(function (state) {
				var polygon = L.geoJson(state, {
						weight: 1,
						fillOpacity: 0,
						color: '#212f39',
					}).addTo(map).on('click', onDepartementClick);
			});
		}
	);

	// On récupère la plage des mutations de la base
	$.getJSON("api/dates",
		function (data) {
			dateMin = (new Date(data.min)).toLocaleDateString('fr-FR');
			dateMax = (new Date(data.max)).toLocaleDateString('fr-FR');
			$('#daterange').data('daterangepicker').setStartDate(dateMin);
			$('#daterange').data('daterangepicker').setEndDate(dateMax);
		}
	);
})();
