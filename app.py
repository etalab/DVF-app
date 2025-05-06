# Pour lancer le serveur : python app.py
# Puis acceder au site sur localhost:5000

from flask import Flask, request, send_from_directory, jsonify
import json
import pandas as pd
from sqlalchemy import create_engine


pd.set_option('display.max_rows', 500)
pd.set_option('display.max_columns', 500)
pd.set_option('display.width', 1000)
pd.set_option('precision', 0)

app = Flask(__name__, static_url_path='')

config = pd.read_csv('config.csv', header=None)
id = config[0][0]
pwd = config[0][1]
host = config[0][2]
db = config[0][3]
engine = create_engine('postgresql://%s:%s@%s/%s'%(id, pwd, host, db))

# Chargement des natures de culture plus besoin

@app.route('/api/dates2')
def dates():
	dateMin = pd.read_sql("""SELECT min(date_mutation) FROM public.dvf """, engine)
	dateMax = pd.read_sql("""SELECT max(date_mutation) FROM public.dvf """, engine)
	return '{"min": "' + str(dateMin['min'][0]) + '", "max": "' + str(dateMax['max'][0]) + '"}'


@app.route('/')
def root():
	return app.send_static_file('index.html')


@app.route('/faq.html')
def rootFAQ():
	return app.send_static_file('faq.html')

	
@app.route('/css/<path:path>')
def send_css(path):
	return send_from_directory('static/css', path)


@app.route('/js/<path:path>')
def send_js(path):
	return send_from_directory('static/js', path)


@app.route('/donneesgeo/<path:path>')
def send_donneesgeo(path):
	return send_from_directory('static/donneesgeo', path)


@app.route('/api/mutations2/<commune>/<sectionPrefixee>/from=<dateminimum>&to=<datemaximum>')
def get_mutations2(commune, sectionPrefixee, dateminimum, datemaximum):
	mutations = pd.read_sql("""SELECT * FROM public.dvf WHERE code_commune = %(code)s AND section_prefixe = %(sectionPrefixee)s AND date_mutation >= %(datemin)s AND date_mutation <= %(datemax)s """, engine, params = {"code": commune, "sectionPrefixee" : sectionPrefixee, "datemin": dateminimum, "datemax": datemaximum})
	mutations = mutations.applymap(str) # Str pour éviter la conversion des dates en millisecondes.
	mutations = mutations.sort_values(by=['date_mutation', 'code_type_local'], ascending=[False, True])
	nbMutations = len(mutations.id_mutation.unique())
	json_mutations = '{"donnees": ' + mutations.to_json(orient = 'records') + ', "nbMutations": ' + str(nbMutations) + '}'
	
	return json_mutations


@app.route('/api/mutations3/<commune>/<sectionPrefixee>')
def get_mutations3(commune, sectionPrefixee):
	mutations = pd.read_sql("""SELECT * FROM public.dvf WHERE code_commune = %(code)s AND section_prefixe = %(sectionPrefixee)s""", engine, params = {"code": commune, "sectionPrefixee" : sectionPrefixee})
	mutations = mutations.applymap(str) # Str pour éviter la conversion des dates en millisecondes.
	mutations = mutations.sort_values(by=['date_mutation', 'code_type_local'], ascending=[False, True])
	json_mutations = '{"mutations": ' + mutations.to_json(orient = 'records') + '}'
	return json_mutations


@app.route('/api/parcelles2/<parcelle>/from=<dateminimum>&to=<datemaximum>')
def get_parcelle(parcelle, dateminimum, datemaximum):
	mutations = pd.read_sql("""SELECT * FROM public.dvf WHERE id_parcelle = %(code)s AND date_mutation >= %(datemin)s AND date_mutation <= %(datemax)s ;""", 
								engine, 
								params = {"code": parcelle, "datemin": dateminimum, "datemax": datemaximum})
	mutations = mutations.sort_values(by=['date_mutation', 'code_type_local'], ascending=[False, True])
	
	json_mutations = []
	for mutationIndex in mutations.id_mutation.unique():
		df_s = mutations.loc[mutations.id_mutation == mutationIndex]
		
		df_s = df_s.applymap(str) # Str pour éviter la conversion des dates en millisecondes.

		# Informations générales
		infos = df_s.iloc[[0]]
		infos = infos.reset_index()

		date = infos['date_mutation'][0]
		codeInsee = infos['code_commune'][0]
		section = infos['section_prefixe'][0]
		prix = infos['valeur_fonciere'][0]
		parcelle = mutations['id_parcelle'][0]
		
		infos = infos.to_json(orient = 'records')
		
		# Mutations liées
		mutations_liees = pd.read_sql("""SELECT * FROM public.dvf WHERE id_mutation = %(id_mutation)s AND id_parcelle<> %(parcelle)s;""", 
		engine, 
		params = {"id_mutation" : mutationIndex, "parcelle" : parcelle})
		mutations_liees = mutations_liees.sort_values(by=['date_mutation', 'code_type_local'], ascending=[False, True])
		mutations_liees['type_local'].replace('Local industriel. commercial ou assimilé', 'Local industriel commercial ou assimilé', inplace = True)
		mutations_liees = mutations_liees.to_json(orient = 'records')
		
		# Maison, dépendances et locaux commerciaux
		batiments = df_s[['code_type_local', 'type_local', 'surface_reelle_bati', 'nombre_pieces_principales']].drop_duplicates()
		batiments = batiments[batiments['type_local'] != "None"]
		batiments = batiments.sort_values(by=['code_type_local'])
		batiments['type_local'].replace('Local industriel. commercial ou assimilé', 'Local industriel commercial ou assimilé', inplace = True)	
		batiments = batiments.to_json(orient = 'records')

		# Terrains 
		terrains = df_s[['nature_culture', 'nature_culture_speciale', 'surface_terrain']].drop_duplicates()
		terrains['nature_culture'] = terrains['nature_culture'].str.capitalize() 
		terrains = terrains[terrains['nature_culture'] != "None"]
		terrains = terrains.fillna("")
		terrains = terrains.to_json(orient = 'records')
		
		# Appartements avec lots
		lots = df_s[['lot1_numero', 'lot1_surface_carrez', 
					'lot2_numero', 'lot2_surface_carrez',
					'lot3_numero', 'lot3_surface_carrez',
					'lot4_numero', 'lot4_surface_carrez',
					'lot5_numero', 'lot5_surface_carrez']].drop_duplicates()
		lots.columns = ['Lot1', 'Carrez1', 'Lot2', 'Carrez2', 'Lot3', 'Carrez3', 'Lot4', 'Carrez4', 'Lot5', 'Carrez5']
		
		lots['id'] = range(1, len(lots) + 1)
		lots = pd.wide_to_long(lots, ["Lot", "Carrez"], i='id', j='numLot')
		lots = lots[lots['Lot'] != "None"]
		lots = lots.reset_index()
		lots = lots.to_json(orient = 'records')
		
		json_mutation = '{"infos": ' + infos + ', "batiments": ' + batiments + ', "terrains": ' + terrains + ', "lots": ' + lots + ', "mutations_liees": ' + mutations_liees + '}'
		json_mutations.append(json_mutation)

	retour = '{"mutations": [' + ', '.join(json_mutations) + '], "nbMutations": [' + str(len(mutations.id_mutation.unique())) +  ']}'
	return retour


@app.after_request
def add_header(r):
	"""
	Add headers to both force latest IE rendering engine or Chrome Frame,
	and also to cache the rendered page for 10 minutes.
	"""
	r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
	r.headers["Pragma"] = "no-cache"
	r.headers["Expires"] = "0"
	r.headers['Cache-Control'] = 'public, max-age=0'
	return r


if __name__ == '__main__':
	app.run(debug = True, host='0.0.0.0')
