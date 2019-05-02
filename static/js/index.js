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
							<b>{{ mutation.infos[0]['Valeur fonciere'] }} € / {{ mutation.infos[0]['Nature mutation'] }}</b><br>
							<span>{{ mutation.infos[0]['Date mutation'] }}</span>
			 			</div>
					</div>
					<div v-if="vue.mutationIndex == index" style="background-color: #eee" class="mt-3">
						<boite
							v-for="batiment in mutation.batiments"
							:valeur="(batiment['Code type local'] != 3) ? (batiment['Surface reelle bati'] + ' m²') : ''"
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
			parcelle: null,
			mutationIndex: null,
		},
		methods: {},
	});

// Resize map when left side bar show/hide
vue.$watch('fold_left', function() {
	map.resize()
})

// Partie JavaScript standard (sans framework) --------------------------------

// Définition des variables globales

var map = null;
var mapLoaded = false;
var hoveredStateId = null;
var selectedStateId = null;
var codeDepartement = null;
var codeCommune = null;
var codeSection = null;
var codeParcelle = null;

var data_dvf = null;

var nom_fichier_section = null;
var data_section = null;

var dateMin = '01-01-2015';
var dateMax = '01-01-2019';

var hoverableSources = ['departements', 'communes', 'sections', 'parcelles']
var fillLayerPaint = {
	"fill-color": "#2a4ba9",
	"fill-outline-color": "#627BC1",
	"fill-opacity": ["case",
		["boolean", ["feature-state", "hover"], false],
		0.4,
		["boolean", ["feature-state", "selected"], false],
		0.4,
		0
	]
}

var departements = null;
var departementsLayer = {
	id: 'departements-layer',
	source: 'departements',
	type: 'fill',
	paint: fillLayerPaint
}
var departementsContoursLayer = {
	id: 'departements-contours-layer',
	source: 'departements',
	type: 'line'
}

var communes = null;
var communesLayer = {
	id: 'communes-layer',
	source: 'communes',
	type: 'fill',
	paint: fillLayerPaint
}
var communesContoursLayer = {
	id: 'communes-contours-layer',
	source: 'communes',
	type: 'line'
}

var sections = null;
var sectionsLayer = {
	id: 'sections-layer',
	source: 'sections',
	type: 'symbol',
	layout: {
		'text-field': ['format',
			['get', 'prefix'], {},
			' ', {},
			['get', 'code'], {},
		]
	}
}
var sectionsLineLayer = {
	id: 'sections-line-layer',
	source: 'sections',
	type: 'line',
	paint: {
		"line-width": [
			'case',
			["boolean", ["feature-state", "hover"], false],
			4,
			1
		]
	}
}

var parcelles = null;
var parcellesLayer = {
	id: 'parcelles-layer',
	source: 'parcelles',
	type: 'fill',
	paint: {
		"fill-color": ["case",
			["boolean", ["feature-state", "selected"], false],
			"#ff5FA8",
			"#2a4ba9"
		],
		"fill-outline-color": ["case",
			["boolean", ["feature-state", "selected"], false],
			"#ff8FD8",
			"#627BC1"
		],
		"fill-opacity": ["case",
			["boolean", ["feature-state", "hover"], false],
			0.8,
			["boolean", ["feature-state", "selected"], false],
			0.8,
			0.4
		]
	}
}
var unmutatedParcellesLayer = {
	id: 'unmutated-parcelles-layer',
	source: 'parcelles',
	type: 'fill',
	paint: {
		'fill-color': "#212f39",
		"fill-outline-color": "#222",
		'fill-opacity': 0.2
	}
}

const EMPTY_FEATURE_COLLECTION = {
	type: 'FeatureCollection',
	features: []
}

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


function exportCSV(el, data, fileName) {

	var json = data;
	var fields = Object.keys(json[0])
	var replacer = function(key, value) { return value === null ? '' : value }
	var csv = json.map(function(row){
	  return fields.map(function(fieldName){
		return JSON.stringify(row[fieldName], replacer)
	  }).join(';')
	})
	csv.unshift(fields.join(';')); // add header column
	csv = csv.join('\r\n');

	el.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
	el.setAttribute("download", fileName);
}

/*
// Non utilisé
function exportJson(el) {

	var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data_dvf));
	el.setAttribute("href", "data:"+data);
	el.setAttribute("download", 'nomfichier.json');
}
*/

function resetSourcesData(sources) {
	sources.map(source => {
		var source = map.getSource(source)
		if (source) {
			source.setData(EMPTY_FEATURE_COLLECTION)
		}
	})
}

function fit(geosjon) {
	var bbox = turf.bbox(geosjon)
	map.fitBounds(bbox, { padding: 20 })
}

function onMouseMove(event, source) {
	var canvas = map.getCanvas()
	canvas.style.cursor = 'pointer'

	if (event.features.length > 0) {
		if (hoveredStateId !== null) {
			hoverableSources.map(function(source) {
				map.setFeatureState({ source, id: hoveredStateId }, { hover: false }); // clean all sources to prevent error
			})
		}
		hoveredStateId = event.features[0].id;
		map.setFeatureState({ source, id: hoveredStateId }, { hover: true });
	}
}

function onMouseLeave(event, source) {
	var canvas = map.getCanvas()
	canvas.style.cursor = ''

	if (hoveredStateId !== null) {
		map.setFeatureState({ source, id: hoveredStateId }, { hover: false });
	}
	hoveredStateId = null;
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

function filledCommunesOptions(feature) {
	$('#communes').append($('<option />', {
		value: feature.properties.code,
		text: feature.properties.nom
	}))
}

function filledSectionsOptions(feature) {
	var code = getSectionCode(feature.properties)

	$('#sections').append($('<option />', {
		value: code,
		text: code.replace(/^0+/, '')
	}))
}

function onEachFeatureParcelle(feature) {
	$('#parcelles').append($('<option />', {
		value: feature.id,
		text: feature.id
	}))
}

function onParcelleClicked(event) {
	sonCode = event.features[0].properties.id;
	selectedStateId = event.features[0].id
	document.getElementById("parcelles").value = sonCode;
	entrerDansParcelle(sonCode);
}

function entrerDansParcelle(sonCode) {
	codeParcelle = sonCode;
	data_parcelle = null;
	$.getJSON("/api/parcelles/" + codeParcelle + "/from=" + dateMin.replace(new RegExp("/", "g"), "-")  + '&to=' + dateMax.replace(new RegExp("/", "g"), "-") ,
		function (data) {
			data_parcelle = data;

			// Formattage des champs pour l'affichage
			for (m = 0; m < data_parcelle.mutations.length; m++){
				data_parcelle.mutations[m].infos[0]['Date mutation'] = (new Date(data_parcelle.mutations[m].infos[0]['Date mutation'])).toLocaleDateString('fr-FR');
				data_parcelle.mutations[m].infos[0]['Valeur fonciere'] = data_parcelle.mutations[m].infos[0]['Valeur fonciere'].replace(/(\d)(?=(\d{3})+$)/g, '$1 ');

				for (b = 0 ; b < data_parcelle.mutations[m].batiments.length; b++){
					data_parcelle.mutations[m].batiments[b]['Surface reelle bati'] = data_parcelle.mutations[m].batiments[b]['Surface reelle bati'].replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
				}
				for (ter = 0 ; ter < data_parcelle.mutations[m].terrains.length; ter++){
					data_parcelle.mutations[m].terrains[ter]['Surface terrain'] = data_parcelle.mutations[m].terrains[ter]['Surface terrain'].replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
				}
			}

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

function sortirDeParcelle() {
	map.setPaintProperty('parcelles-layer', 'fill-color', "#627BC1")
	if (selectedStateId) {
		map.setFeatureState({ source: 'parcelles', id: selectedStateId }, { selected: false });
	}
	entrerDansSection(codeSection);
}

function getSectionCode(section) {
	const {prefixe, code} = section
	return (prefixe + ('0' + code).slice(-2))
}

function onSectionClicked(event) {
	sonCode = getSectionCode(event.features[0].properties)
	document.getElementById("sections").value = sonCode;
	entrerDansSection(sonCode);
}

function entrerDansMutation(sonIndex) {
	vue.mutationIndex = sonIndex;

	codesParcelles = [codeParcelle];
	if (sonIndex != null) {

		for (autre of vue.parcelle.mutations[sonIndex].mutations_liees) {
			codesParcelles.push(autre['Code parcelle']);
		}
	}

	map.setPaintProperty('parcelles-layer', 'fill-color', [
		'case',
		['match',['get', 'id'], codesParcelles, true, false],
		"#ff8FD8",
		"#627BC1"
	])
}

function entrerDansSection(sonCode) {

	codeSection = sonCode;
	console.log("Section sélectionnée : " + sonCode);
	vue.parcelle = null;
	document.getElementById('parcelles').innerHTML = '<option style="display:none"></option>';
	$.when(
		// Charge la couche géographique
		$.getJSON("https://cadastre.data.gouv.fr/bundler/cadastre-etalab/communes/" + codeCommune + "/geojson/parcelles",
			function (data) {
				data_geo = data;
			}
		),
		// Charge les mutations
		$.getJSON("/api/mutations/" + codeCommune + "/" + sonCode + "/from=" + dateMin.replace(new RegExp("/", "g"), "-") + '&to=' + dateMax.replace(new RegExp("/", "g"), "-") ,
			function (data) {
				data_section = data;
				data_dvf = data.donnees;
			}
		)
	).then(
		// Une fois qu'on a la géographie et les mutations, on fait tout l'affichage
		function (data) {
			data_geo.features = data_geo.features.filter(function(e) {
				return (sonCode == getSectionCode({ prefixe: e.properties.prefixe, code: e.properties.section}))
			}).sort(function (e, a) {
				return (e.id).localeCompare(a.id);
			});

			parcelles = data[0]

			map.getSource('parcelles').setData(parcelles)

			fit(parcelles)

			parcelles.features.map(onEachFeatureParcelle)

			var parcellesCodes = data_section.donnees.map(parcelle => parcelle['Code parcelle'])
			parcellesCodes.unshift('id')

			var includesMutated = parcellesCodes.slice()
			includesMutated.unshift('in')

			var exludesMutated = parcellesCodes.slice()
			exludesMutated.unshift('!in')

			map.setFilter('parcelles-layer', includesMutated) // include
			map.setFilter('unmutated-parcelles-layer', exludesMutated) // exclude
			map.setFilter('sections-layer', ['!=', ['get', 'code'], codeSection.slice(-1)]) // TODO le code n'est pas le bon (prefixe+code)

			fit(parcelles)
			vue.section = {
				code: sonCode,
				n_mutations: data_section.nbMutations,
			};
		}
	);
}

function entrerDansCommune(sonCode) {
	vue.parcelle = null;
	vue.section = null;
	console.log("Nous entrons dans la commune " + sonCode);
	codeCommune = sonCode;
	document.getElementById('sections').innerHTML = '<option style="display:none"></option>';
	document.getElementById('parcelles').innerHTML = '<option style="display:none"></option>';
	$.getJSON("https://cadastre.data.gouv.fr/bundler/cadastre-etalab/communes/" + codeCommune + "/geojson/sections",
		function (data) {
			sections = data
			map.getSource('sections').setData(sections)

			data.features.map(filledSectionsOptions)
			map.setFilter('communes-layer', ['!=', ['get', 'code'], codeCommune])

			resetSourcesData(['parcelles'])

			fit(sections)

			nom_fichier_commune = codeCommune + '.csv';
			vue.commune = {
				code: sonCode
			};
		}
	);
}

function entrerDansDepartement(sonCode) {

	// Vide l'interface
	codeDepartement = sonCode;
	console.log('Nous entrons dans le département ' + codeDepartement);
	vue.section = null;
	vue.commune = null;
	document.getElementById('communes').innerHTML = '<option style="display:none"></option>';
	document.getElementById('sections').innerHTML = '<option style="display:none"></option>';
	document.getElementById('parcelles').innerHTML = '<option style="display:none"></option>';
	// Charge les communes
	$.getJSON("https://geo.api.gouv.fr/departements/" + codeDepartement + "/communes?geometry=contour&format=geojson&type=commune-actuelle",
		function (data) {
			// Pour Paris, Lyon, Marseille, il faut compléter avec les arrondissements
			if (['75', '69', '13'].includes(codeDepartement)) {
				$.getJSON("/donneesgeo/arrondissements_municipaux-20180711.json",
					function (dataPLM) {
						data.features = data.features.filter(function (e) { return !(['13055', '69123', '75056'].includes(e.properties.code)); });
						dataPLM.features = dataPLM.features.filter(function (e) { return e.properties.code.substring(0, 2) == codeDepartement; });
						data.features = data.features.concat(dataPLM.features);
						afficherCommunesDepartement(data);
					}
				);
			} else {
				afficherCommunesDepartement(data);
			}
		}
	);
}

function afficherCommunesDepartement(data) {
	communes = data

	map.getSource('communes').setData(communes)
	data.features.map(filledCommunesOptions)
	map.setFilter('departements-layer', ['!=', ['get', 'code'], codeDepartement])

	resetSourcesData(['sections', 'parcelles'])

	fit(communes)
}

function onCityClicked(event) {
	// L'utilisateur a cliqué sur la géométrie d'une commune
	var sonCode = event.features[0].properties.code;
	entrerDansCommune(sonCode);
	document.getElementById("communes").value = sonCode;
}

function onDepartementClick(event) {
	// L'utilisateur a cliqué sur la géométrie d'un département
	var sonCode = event.features[0].properties.code
	entrerDansDepartement(sonCode);
	document.getElementById("departements").value = sonCode;
};

function toggleLeftBar() {
	vue.fold_left = !vue.fold_left;
}

// C'est le code qui est appelé au début (sans que personne ne clique)
(function () {

	// Mise en place de la carte
	map = new mapboxgl.Map({
		container: 'mapid',
		style: 'https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json',
		center: [3, 47],
		zoom: 5,
		minZoom: 0,
		maxZoom: 30
	})

	if (!mapLoaded) {
		map.on('load', function () {
			map.addSource("departements", {
				type: 'geojson',
				generateId: true,
				data: departements
			})
			map.addLayer(departementsLayer)
			map.addLayer(departementsContoursLayer)

			map.addSource("communes", {
				type: 'geojson',
				generateId: true,
				data: communes
			})
			map.addLayer(communesLayer)
			map.addLayer(communesContoursLayer)

			map.addSource("sections", {
				type: 'geojson',
				generateId: true,
				data: sections
			})
			map.addLayer(sectionsLineLayer)
			map.addLayer(sectionsLayer)

			map.addSource("parcelles", {
				type: 'geojson',
				generateId: true,
				data: parcelles
			})
			map.addLayer(parcellesLayer)
			map.addLayer(unmutatedParcellesLayer)
		})

		mapLoaded = true
	}

	hoverableSources.map(function (source) {
		var layer = `${source}-layer`

		map.on("mousemove", layer, function(e) {onMouseMove(e, source)});
		map.on("mouseleave", layer, function(e) {onMouseLeave(e, source)});
	})

	map.on('click', 'departements-layer', onDepartementClick)
	map.on('click', 'communes-layer', onCityClicked)
	map.on('click', 'sections-layer', onSectionClicked)
	map.on('click', 'parcelles-layer', function(event) {
		if (selectedStateId) {
			map.setFeatureState({ source: 'parcelles', id: selectedStateId }, { selected: false });
		}

		selectedStateId = event.features[0].id
		map.setFeatureState({ source: 'parcelles', id: selectedStateId }, { selected: true })
		onParcelleClicked(event)
	})

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
		dateMin = start.format('DD-MM-YYYY');
		dateMax = end.format('DD-MM-YYYY');
		if (codeSection != null) {
			entrerDansSection(codeSection);
		}
	});

	// Chargement de la liste des départements
	$.getJSON("https://geo.api.gouv.fr/departements?fields=nom,code",
		function (data) {
			var $select = $('#departements');
			$.each(data, function (i, val) {
				$select.append($('<option />', {
					value: data[i].code,
					text: data[i].code + ' - ' + data[i].nom
				}));
			});
		}
	);

	// Chargement des contours des départements
	$.getJSON("/donneesgeo/departements-100m.geojson",
		function (data) {
			departements = data
			map.getSource('departements').setData(departements)
		}
	)

	// On récupère la plage des mutations de la base
	$.getJSON("/api/dates",
		function (data) {
			dateMin = (new Date(data.min)).toLocaleDateString('fr-FR');
			dateMax = (new Date(data.max)).toLocaleDateString('fr-FR');
			$('#daterange').data('daterangepicker').setStartDate(dateMin);
			$('#daterange').data('daterangepicker').setEndDate(dateMax);
		}
	);

	// Sur mobile, cacher la barre latérale
	if (window.innerWidth < 768) {
		vue.fold_left = true;
	}

})();
