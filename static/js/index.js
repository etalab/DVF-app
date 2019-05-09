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
							<b>{{ formatterNombre(mutation.infos[0]['valeur_fonciere']) }} € / {{ mutation.infos[0]['nature_mutation'] }}</b><br>
							<span>{{ mutation.infos[0]['date_mutation'] }}</span>
			 			</div>
						<div v-if="vue.mutationIndex != index" class="ml-1 mr-1">
							<i class="fas fa-sort-down fa-1x"></i>
						</div>
					</div>
					<div v-if="vue.mutationIndex == index" style="background-color: #eee" class="mt-3">
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
		mapStyle: 'vector',
	},
	methods: {},
});

// Resize map when left side bar show/hide
vue.$watch('fold_left', function () {
	map.resize()
})

// Partie JavaScript standard (sans framework) --------------------------------

// Définition des variables globales

var MIN_DATE = '2014-01-01'
var MAX_DATE = '2018-12-31'

var map = null;
var mapLoaded = false;
var mapStyleChanged = false;
var hoveredStateId = null;
var selectedStateId = null;
var codeDepartement = null;
var codeCommune = null;
var codeSection = null;
var data_parcelle = null;
var codeParcelle = null;
var codesParcelles = null;

var styles = {
	ortho: {
		"version": 8,
		"glyphs": "https://openmaptiles.geo.data.gouv.fr/fonts/{fontstack}/{range}.pbf",
		"sources": {
			"raster-tiles": {
				"type": "raster",
				"tiles": [
					"https://wxs.ign.fr/eop8s6g4hrpvxnxer1g6qu44/geoportail/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"
				],
				"tileSize": 256,
				"attribution": "Images aériennes © IGN"
			}
		},
		"layers": [
			{
				"id": "simple-tiles",
				"type": "raster",
				"source": "raster-tiles"
			}
		]
	},
	vector: {
		"version": 8,
		"glyphs": "https://openmaptiles.geo.data.gouv.fr/fonts/{fontstack}/{range}.pbf",
		"sources": {
			"raster-tiles": {
				"type": "raster",
				"tiles": [
					"https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
					"https://b.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
					"https://c.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
				],
				"tileSize": 256,
				"attribution": 'donn&eacute;es &copy; <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>'
			}
		},
		"layers": [
			{
				"id": "simple-tiles",
				"type": "raster",
				"source": "raster-tiles"
			}
		]
	}
}

var nom_fichier_section = null;
var data_section = null;

var startDate = MIN_DATE
var endDate = MAX_DATE

var fillColor = '#2a4ba9'
var borderColor = '#627BC1'
var mutationColor = '#238FD8'
var mutationSelectedColor = '#ff5FA8'
var mutationLieesColor = '#ff8FD8'
var unmutatedColor = '#212f39'

var hoverableSources = ['departements', 'communes', 'sections', 'parcelles']
var fillLayerPaint = {
	"fill-color": fillColor,
	"fill-outline-color": borderColor,
	"fill-opacity": ["case",
		["boolean", ["feature-state", "hover"], false],
		0.2,
		0
	]
}

var contoursPaint = {
	"line-width": [
		'case',
		["boolean", ["feature-state", "hover"], false],
		3,
		1
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
	type: 'line',
	paint: contoursPaint
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
	type: 'line',
	paint: contoursPaint
}

var sections = null;
var sectionsLayer = {
	id: 'sections-layer',
	source: 'sections',
	type: 'fill',
	paint: fillLayerPaint
}
var sectionsSymbolLayer = {
	id: 'sections-symbol-layer',
	source: 'sections',
	type: 'symbol',
	paint: {
		'text-halo-color': '#fff',
		'text-halo-width': 2
	},
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
	paint: contoursPaint
	}

var parcelles = null;
var parcellesLayer = {
	id: 'parcelles-layer',
	source: 'parcelles',
	type: 'fill',
	paint: {
		"fill-color": mutationColor,
		"fill-outline-color": ["case",
			["boolean", ["feature-state", "selected"], false],
			mutationLieesColor,
			borderColor
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
		'fill-color': unmutatedColor,
		'fill-opacity': 0.2
	}
}
var unmutatedParcellesContoursLayer = {
	id: 'unmutated-parcelles-countours-layer',
	source: 'parcelles',
	type: 'line',
	paint: contoursPaint
}

const EMPTY_FEATURE_COLLECTION = {
	type: 'FeatureCollection',
	features: []
}

var communesMappingPromise = getRemoteJSON('/donneesgeo/communes-mapping.json', true)

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

$('.input-daterange input').each(function () {
	$(this).datepicker('clearDates');
});


function exportCSV(el, data, fileName) {

	var json = data;
	var fields = Object.keys(json[0])
	var replacer = function (key, value) { return value === null ? '' : value }
	var csv = json.map(function (row) {
		return fields.map(function (fieldName) {
			return JSON.stringify(row[fieldName], replacer)
		}).join(';')
	})
	csv.unshift(fields.join(';')); // add header column
	csv = csv.join('\r\n');

	el.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
	el.setAttribute("download", fileName);
}

function getRemoteJSON(url, throwIfNotFound) {
	return fetch(url).then(function (response) {
		if (response.ok) {
			return response.json()
		}

		if (response.status === 404 && !throwIfNotFound) {
			return
		}

		throw new Error('Impossible de récupérer les données demandées : ' + response.status)
	})
}

function getCadastreLayer(layerName, codeCommune) {
	return communesMappingPromise.then(function (communesMapping) {
		const communesToGet = codeCommune in communesMapping ? communesMapping[codeCommune] : [codeCommune]
		return Promise.all(communesToGet.map(function (communeToGet) {
			return getRemoteJSON(`https://cadastre.data.gouv.fr/bundler/cadastre-etalab/communes/${communeToGet}/geojson/${layerName}`)
		})).then(function (featureCollections) {
			return {
				type: 'FeatureCollection',
				features: featureCollections.reduce(function (acc, featureCollection) {
					if (featureCollection && featureCollection.features)
					return acc.concat(featureCollection.features)
				}, [])
			}
		})
	})
}

function getParcelles(codeCommune) {
	return getCadastreLayer('parcelles', codeCommune)
}

function getSections(codeCommune) {
	return getCadastreLayer('sections', codeCommune)
}

function uniq(array) {
	return Object.keys(
		array.reduce(function (acc, item) {
			acc[item] = true
			return acc
		}, {})
	)
}

function resetSourcesData(sources) {
	sources.map(source => {
		var source = map.getSource(source)
		if (source) {
			source.setData(EMPTY_FEATURE_COLLECTION)
		}
	})
}

function fit(geojson) {
	var bbox = turf.bbox(geojson)
	map.fitBounds(bbox, { padding: 20, animate: true })
}

function onMouseMove(event, source) {
	var canvas = map.getCanvas()
	canvas.style.cursor = 'pointer'

	if (event.features.length > 0) {
		if (hoveredStateId !== null) {
			hoverableSources.map(function (source) {
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
}

function resetMutation() {
	vue.mutationIndex = null
	codesParcelles = null

	map.setPaintProperty('parcelles-layer', 'fill-color', mutationColor)

	if (selectedStateId) {
		map.setFeatureState({ source: 'parcelles', id: selectedStateId }, { selected: false });
	}
}

function resetParcelle() {
	vue.parcelle = null;
	data_parcelle = null;

	map.setPaintProperty('parcelles-layer', 'fill-color', parcellesLayer.paint['fill-color'])

	if (codesParcelles) {
		resetMutation()
	}
}

function resetSection() {
	vue.section = null;
	codeSection = null;
	data_section = null;
	parcelles = null;

	document.getElementById('parcelles').innerHTML = '<option style="display:none"></option>'
	map.getSource('parcelles').setData(EMPTY_FEATURE_COLLECTION)
	map.setFilter('parcelles-layer', null)

	if (data_parcelle) {
		resetParcelle()
	}
}

function resetCommune() {
	vue.commune = null;
	codeCommune = null;
	nom_fichier_commune = null;
	sections = null;

	document.getElementById('sections').innerHTML = '<option style="display:none"></option>';
	map.getSource('sections').setData(EMPTY_FEATURE_COLLECTION)
	map.setFilter('communes-layer', null)

	if (codeSection) {
		resetSection()
	}
}

function resetDepartement() {
	communes = null;
	codeDepartement = null

	document.getElementById('communes').innerHTML = '<option style="display:none"></option>';
	map.getSource('communes').setData(EMPTY_FEATURE_COLLECTION)
	map.setFilter('departements-layer', null)

	if (codeCommune) {
		resetCommune()
	}
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

function filledParcelleOptions(feature) {
	$('#parcelles').append($('<option />', {
		value: feature.properties.id,
		text: feature.properties.id
	}))
}

function onParcelleClicked(event) {
	sonCode = event.features[0].properties.id;
	selectedStateId = event.features[0].id
	document.getElementById("parcelles").value = sonCode;
	entrerDansParcelle(sonCode);
}

function formatterNombre(nombreDecimal) {

	return nombreDecimal.replace(/\..*/g, '').replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
}

function entrerDansParcelle(sonCode) {
	codeParcelle = sonCode;
	data_parcelle = computeParcelle(data_section, sonCode)

	// Formattage des champs pour l'affichage
	for (m = 0; m < data_parcelle.mutations.length; m++) {
		data_parcelle.mutations[m].infos[0]['date_mutation'] = (new Date(data_parcelle.mutations[m].infos[0]['date_mutation'])).toLocaleDateString('fr-FR');
	}

	vue.parcelle = {
		code: codeParcelle,
		mutations: data_parcelle.mutations,
	};

	if (vue.parcelle.mutations.length == 1) {
		entrerDansMutation(0);
	} else {
		entrerDansMutation(null);
	}
}

function sortirDeParcelle() {
	resetParcelle()
	fit(parcelles)
}

function getSectionCode(section) {
	const { prefixe, code } = section
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
		for (parcelleLiee of vue.parcelle.mutations[sonIndex].parcellesLiees) {
			codesParcelles.push(parcelleLiee);
		}
	}

	mutationsFilter()
}

function entrerDansSection(sonCode) {
	if (codeSection) {
		resetSection()
	}

	if (data_parcelle) {
		resetParcelle()
	}

	codeSection = sonCode;
	$.when(
		// Charge la couche géographique
		getParcelles(codeCommune).then(function (data) {
			data_geo = data;
		}),
		// Charge les mutations
		$.getJSON(`/api/mutations3/${codeCommune}/${codeSection}`,
			function (data) {
				data_section = data.mutations.filter(function (m) {
					return m.date_mutation >= startDate && m.date_mutation <= endDate
				});
			}
		)
	).then(
		// Une fois qu'on a la géographie et les mutations, on fait tout l'affichage
		function () {
			data_geo.features = data_geo.features.filter(function (e) {
				return (codeSection == getSectionCode({ prefixe: e.properties.prefixe, code: e.properties.section }))
			}).sort(function (e, a) {
				return (e.id).localeCompare(a.id);
			});

			parcelles = data_geo

			map.getSource('parcelles').setData(parcelles)

			parcelles.features.map(filledParcelleOptions)

			parcellesFilter()

			fit(parcelles)
			vue.section = {
				code: sonCode
			};
		}
	);
}

function entrerDansCommune(sonCode) {
	if (codeCommune) {
		resetCommune()
	}

	if (codeSection) {
		resetSection()
	}

	console.log("Nous entrons dans la commune " + sonCode);
	codeCommune = sonCode;
	getSections(codeCommune).then(
		function (data) {
			data.features.sort(function (a, b) {
				if (!a.properties.nom) return -Infinity;
				return a.properties.nom.localeCompare(b.properties.nom);
			});

			sections = data
			map.getSource('sections').setData(sections)

			data.features.map(filledSectionsOptions)
			communeFilter()

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
	if (codeDepartement) {
		resetDepartement()
	}

	// Vide l'interface
	codeDepartement = sonCode;
	console.log('Nous entrons dans le département ' + codeDepartement);
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
	departementsFilter()

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
		style: styles[vue.mapStyle],
		center: [3, 47],
		zoom: 5,
		minZoom: 1,
		maxZoom: 20
	})

	map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

	map.on('load', function() {
		if (!departements) {
			// Chargement des contours des départements
			$.getJSON("/donneesgeo/departements-100m.geojson",
				function (data) {
					departements = data
				}
			).then(function() {
					map.addSource("departements", {
						type: 'geojson',
						generateId: true,
					data: departements
					})
					map.addLayer(departementsLayer)
					map.addLayer(departementsContoursLayer)
				map.setPaintProperty(departementsContoursLayer.id, 'line-color', vue.mapStyle === 'ortho' ? '#fff' : '#000')
			})
				}
		})
	map.on('styledata', loadCustomLayers)

	hoverableSources.map(function (source) {
		var layer = `${source}-layer`

		map.on("mousemove", layer, function (e) { onMouseMove(e, source) });
		map.on("mouseleave", layer, function (e) { onMouseLeave(e, source) });
	})

	map.on('click', 'departements-layer', onDepartementClick)
	map.on('click', 'communes-layer', onCityClicked)
	map.on('click', 'sections-layer', onSectionClicked)
	map.on('click', 'parcelles-layer', function (event) {
		if (selectedStateId) {
			map.setFeatureState({ source: 'parcelles', id: selectedStateId }, { selected: false });
		}

		selectedStateId = event.features[0].id
		map.setFeatureState({ source: 'parcelles', id: selectedStateId }, { selected: true })
		onParcelleClicked(event)
	})

	// Paramètres français du range picker
	$('input[name="daterange"]').daterangepicker({
		minDate: new Date(MIN_DATE),
		maxDate: new Date(MAX_DATE),
		startDate: new Date(startDate),
		endDate: new Date(endDate),
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
		startDate = start.format('YYYY-MM-DD');
		endDate = end.format('YYYY-MM-DD');
		if (codeSection !== null) {
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

	// Sur mobile, cacher la barre latérale
	if (window.innerWidth < 768) {
		vue.fold_left = true;
	}

})();

function loadCustomLayers() {
	if (!mapLoaded) {
		if (departements) {
			map.addSource("departements", {
				type: 'geojson',
				generateId: true,
				data: departements
			})
			map.addLayer(departementsLayer)
			map.addLayer(departementsContoursLayer)
			map.setPaintProperty(departementsContoursLayer.id, 'line-color', vue.mapStyle === 'ortho' ? '#fff' : '#000')
		}

		map.addSource("communes", {
			type: 'geojson',
			generateId: true,
			data: communes
		})
		map.addLayer(communesLayer)
		map.addLayer(communesContoursLayer)
		map.setPaintProperty(communesContoursLayer.id, 'line-color', vue.mapStyle === 'ortho' ? '#fff' : '#000')

		map.addSource("sections", {
			type: 'geojson',
			generateId: true,
			data: sections
		})
		map.addLayer(sectionsLayer)
		map.addLayer(sectionsLineLayer)
		map.addLayer(sectionsSymbolLayer)
		map.setPaintProperty(sectionsLineLayer.id, 'line-color', vue.mapStyle === 'ortho' ? '#fff' : '#000')

		map.addSource("parcelles", {
			type: 'geojson',
			generateId: true,
			data: parcelles
		})
		map.addLayer(parcellesLayer)
		map.addLayer(unmutatedParcellesLayer)
		map.addLayer(unmutatedParcellesContoursLayer)
		map.setPaintProperty(unmutatedParcellesContoursLayer.id, 'line-color', vue.mapStyle === 'ortho' ? '#fff' : '#000')
	}

	if (mapStyleChanged) {
		layerfilter()
		mapStyleChanged = false
	}

	mapLoaded = true
}

function changeMapStyle() {
	vue.mapStyle = vue.mapStyle === 'vector' ? 'ortho' : 'vector'
	map.setStyle(styles[vue.mapStyle])
	mapLoaded = false
	mapStyleChanged = true
}

function layerfilter() {
	if (codeDepartement) {
		departementsFilter()
	}

	if (codeCommune) {
		communeFilter()
	}

	if (data_section) {
		parcellesFilter()
	}

	if (codesParcelles) {
		mutationsFilter()
	}
}

function mutationsFilter() {
	map.setPaintProperty('parcelles-layer', 'fill-color', [
		'case',
		['match', ['get', 'id'], uniq(codesParcelles), true, false],
		mutationLieesColor,
		mutationColor
	])
}

function parcellesFilter() {
	var parcellesId = data_section.map(parcelle => parcelle.id_parcelle)
	parcellesId.unshift('id')

	var includesMutated = parcellesId.slice()
	includesMutated.unshift('in')

	var exludesMutated = parcellesId.slice()
	exludesMutated.unshift('!in')

	map.setFilter('parcelles-layer', includesMutated) // include
	map.setFilter('unmutated-parcelles-layer', exludesMutated) // exclude
	map.setFilter('sections-layer', ['!=', ['get', 'code'], codeSection.replace(/^0+/, '')])
}

function communeFilter() {
	map.setFilter('communes-layer', ['!=', ['get', 'code'], codeCommune])
}

function departementsFilter() {
	map.setFilter('departements-layer', ['!=', ['get', 'code'], codeDepartement])
}

function computeParcelle(mutationsSection, idParcelle) {
	var mutationsParcelle = mutationsSection.filter(function (m) {
		return m.id_parcelle === idParcelle
	})

	var mutations = _.chain(mutationsParcelle)
		.groupBy('id_mutation')
		.map(function (rows, idMutation) {
			var infos = [_.pick(rows[0], 'date_mutation', 'id_parcelle', 'nature_mutation', 'valeur_fonciere')]

			var parcellesLiees = _.uniq(
				mutationsSection
					.filter(function (m) {
						return m.id_mutation === idMutation && m.id_parcelle !== idParcelle
					})
					.map(function (m) {
						return m.id_parcelle
					})
			)

			var batiments = _.chain(rows)
				.filter(function (m) {
					return m.type_local !== 'None'
				})
				.uniqBy(function (m) {
					return `${m.code_type_local}@${m.surface_reelle_bati}`
				})
				.value()

			var terrains = _.chain(rows)
				.filter(function (m) {
					return m.nature_culture !== 'None'
				})
				.uniqBy(function (m) {
					return `${m.code_nature_culture}@${m.code_nature_culture_special}@${m.surface_terrain}`
				})
				.value()

			return {
				infos: infos,
				parcellesLiees: parcellesLiees,
				batiments: batiments,
				terrains: terrains
			}
		})
		.value()

	return { mutations: mutations }
}
