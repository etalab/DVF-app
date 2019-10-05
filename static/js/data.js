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

function sortByNom(features) {
	return features.sort(function(a,b){return a.properties.nom.localeCompare(b.properties.nom);})
}

function getCommunes(codeDepartement) {
	return getRemoteJSON(`https://geo.api.gouv.fr/departements/${codeDepartement}/communes?geometry=contour&format=geojson&type=commune-actuelle`).then(function (communes) {

		// Pour Paris, Lyon, Marseille, il faut compléter avec les arrondissements
		if (['75', '69', '13'].includes(codeDepartement)) {
			return getRemoteJSON('/donneesgeo/arrondissements_municipaux-20180711.json').then(function (arrondissements) {
				var features = communes.features.filter(function (e) {
					return !(['13055', '69123', '75056'].includes(e.properties.code))
				})
				arrondissements.features.forEach(function (arrondissement) {
					if (arrondissement.properties.code.startsWith(codeDepartement)) {
						features.push(arrondissement)
					}
				})
				return {type: 'FeatureCollection', features: sortByNom(features)}
			})
		}

		return {type: 'FeatureCollection', features: sortByNom(communes.features)}
	})
}

function getMutations(codeCommune, idSection, startDate, endDate) {
	return getRemoteJSON(`/api/mutations3/${codeCommune}/${idSectionToCode(idSection)}`)
		.then(function (data) {
			return data.mutations.filter(function (m) {
				return m.date_mutation >= startDate && m.date_mutation <= endDate && m.id_parcelle.startsWith(idSection)
			})
		})
}

var communesMappingPromise = getRemoteJSON('/donneesgeo/communes-mapping.json', true)

function getCadastreLayer(layerName, codeCommune) {
	return communesMappingPromise.then(function (communesMapping) {
		var communesToGet = codeCommune in communesMapping ? communesMapping[codeCommune] : [codeCommune]
		return Promise.all(communesToGet.map(function (communeToGet) {
			return getRemoteJSON(`https://cadastre.data.gouv.fr/bundler/cadastre-etalab/communes/${communeToGet}/geojson/${layerName}`)
		})).then(function (featureCollections) {
			return {
				type: 'FeatureCollection',
				features: featureCollections.reduce(function (acc, featureCollection) {
					if (featureCollection && featureCollection.features) {
						return acc.concat(featureCollection.features)
					}

					return acc
				}, [])
			}
		})
	})
}

function getParcelles(codeCommune, idSection) {
	return getCadastreLayer('parcelles', codeCommune).then(function (featureCollection) {
		return {
			type: 'FeatureCollection',
			features: _.chain(featureCollection.features)
				.filter(function (f) {
					return f.id.startsWith(idSection)
				})
				.sortBy('id')
				.value()
		}
	})
}

function sortByLabel(features) {
	return _.sortBy(features, function (f) { return f.properties.label })
}

function getSections(codeCommune) {
	return getCadastreLayer('sections', codeCommune).then(function (featureCollection) {
		var features = featureCollection.features
		var hasMultiplePrefixes = features.some(function (f) {
			return f.properties.commune !== codeCommune || f.properties.prefixe !== '000'
		})
		features.forEach(function (f) {
			if (!hasMultiplePrefixes) {
				f.properties.label = f.properties.code
				return
			}

			var labelPrefix = f.properties.commune === codeCommune ? f.properties.prefixe : f.properties.commune.substr(2)
			f.properties.label = `${labelPrefix} ${f.properties.code}`
		})
		return {type: 'FeatureCollection', features: sortByLabel(features)}
	})
}

function sortByDateDesc(mutations) {
	return _.sortBy(mutations, function (m) {
		if (!m.infos[0].date_mutation) {
			return 0
		}

		return -(new Date(m.infos[0].date_mutation).getTime())
	})
}

function computeParcelle(mutationsSection, idParcelle) {
	var mutationsParcelle = mutationsSection.filter(function (m) {
		return m.id_parcelle === idParcelle
	})

	var mutations = _.chain(mutationsParcelle)
		.groupBy('id_mutation')
		.map(function (rows, idMutation) {
			var infos = [_.pick(rows[0], 'date_mutation', 'id_parcelle', 'nature_mutation', 'valeur_fonciere', 'adresse_numero', 'adresse_suffixe', 'adresse_nom_voie')]

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

	return {mutations: sortByDateDesc(mutations)}
}
