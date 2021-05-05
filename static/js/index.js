// Partie Vue -----------------------------------------------------------------

// Les composants sont définis dans des fichiers séparés

// On crée l'application Vue (on lui dit de se relier à l'élément HTML app)
var vue = new Vue({
	el: '#app',
	data: {
		fold_left: false,
		section: false,
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
var MAX_DATE = '2020-12-31'

var map = null;
var mapLoaded = false;
var mapStyleChanged = false;
var hoveredStateId = null;
var selectedStateId = null;
var codeDepartement = null;
var codeCommune = null;
var idSection = null;
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
					"https://tiles.geo.api.gouv.fr/photographies-aeriennes/tiles/{z}/{x}/{y}"
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
	vector: 'https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json'
}

var nom_fichier_section = null;
var data_section = null;

var startDate = MIN_DATE
var endDate = MAX_DATE

var fillColor = '#2a4ba9'
var borderColor = '#627BC1'
var mutationColor = '#00C5FF'
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
			['get', 'label'], {}
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
		'fill-opacity': 0.05
	}
}
var unmutatedParcellesContoursLayer = {
	id: 'unmutated-parcelles-countours-layer',
	source: 'parcelles',
	type: 'line',
	paint: contoursPaint
}

var EMPTY_FEATURE_COLLECTION = {
	type: 'FeatureCollection',
	features: []
}

// Fonctions

function idSectionToCode(idSection) {
	return idSection.substr(5, 5)
}

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

function resetSourcesData(sources) {
	sources.forEach(function (source) {
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
	vue.section = false;
	idSection = null;
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
	sections = null;

	document.getElementById('sections').innerHTML = '<option style="display:none"></option>';
	map.getSource('sections').setData(EMPTY_FEATURE_COLLECTION)
	map.setFilter('communes-layer', null)

	if (idSection) {
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
	var newIdSection = e.options[e.selectedIndex].value;
	entrerDansSection(newIdSection);
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
	$('#sections').append($('<option />', {
		value: feature.properties.id,
		text: feature.properties.label
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

function entrerDansParcelle(newCodeParcelle) {
	codeParcelle = newCodeParcelle;
	data_parcelle = computeParcelle(data_section, newCodeParcelle)

	// Formattage des champs pour l'affichage
	for (m = 0; m < data_parcelle.mutations.length; m++) {
		data_parcelle.mutations[m].infos[0]['date_mutation'] = (new Date(data_parcelle.mutations[m].infos[0]['date_mutation'])).toLocaleDateString('fr-FR');
	}

	vue.parcelle = {
		code: codeParcelle,
		mutations: data_parcelle.mutations,
	};

	if (vue.parcelle.mutations.length == 1) {
		return entrerDansMutation(0);
	}

	return entrerDansMutation(null);
}

function sortirDeParcelle() {
	resetParcelle()
	fit(parcelles)
}

function onSectionClicked(event) {
	var newIdSection = event.features[0].properties.id
	document.getElementById("sections").value = newIdSection;
	entrerDansSection(newIdSection);
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

	return Promise.resolve()
}

function entrerDansSection(newIdSection) {
	if (idSection) {
		resetSection()
	}

	if (data_parcelle) {
		resetParcelle()
	}

	idSection = newIdSection;

	return Promise.all([
		// Charge la couche géographique
		getParcelles(codeCommune, idSection).then(function (data) {
			parcelles = data;
		}),
		// Charge les mutations
		getMutations(codeCommune, idSection, startDate, endDate).then(function (data) {
			data_section = data
		})
	]).then(
		// Une fois qu'on a la géographie et les mutations, on fait tout l'affichage
		function () {
			map.getSource('parcelles').setData(parcelles)
			parcelles.features.forEach(filledParcelleOptions)
			parcellesFilter()
			fit(parcelles)
			vue.section = true
		}
	);
}

function entrerDansCommune(newCodeCommune) {
	if (codeCommune) {
		resetCommune()
	}

	if (idSection) {
		resetSection()
	}

	console.log("Nous entrons dans la commune " + newCodeCommune);
	codeCommune = newCodeCommune;

	return getSections(codeCommune).then(
		function (data) {
			sections = data
			map.getSource('sections').setData(sections)

			data.features.map(filledSectionsOptions)
			communeFilter()

			resetSourcesData(['parcelles'])

			fit(sections)
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
	return getCommunes(codeDepartement).then(afficherCommunesDepartement)
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
		maxZoom: 19
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
		if (idSection !== null) {
			entrerDansSection(idSection);
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
		['match', ['get', 'id'], _.uniq(codesParcelles), true, false],
		mutationLieesColor,
		mutationColor
	])
}

function parcellesFilter() {
	var parcellesId = data_section.map(function (parcelle) {
		return parcelle.id_parcelle
	})
	parcellesId.unshift('id')

	var includesMutated = parcellesId.slice()
	includesMutated.unshift('in')

	var exludesMutated = parcellesId.slice()
	exludesMutated.unshift('!in')

	map.setFilter('parcelles-layer', includesMutated) // include
	map.setFilter('unmutated-parcelles-layer', exludesMutated) // exclude
	map.setFilter('sections-layer', ['!=', ['get', 'id'], idSection])
}

function communeFilter() {
	map.setFilter('communes-layer', ['!=', ['get', 'code'], codeCommune])
}

function departementsFilter() {
	map.setFilter('departements-layer', ['!=', ['get', 'code'], codeDepartement])
}


