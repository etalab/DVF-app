# coding: utf-8

# Pour lancer le serveur : python app.py
# Puis acceder au site sur localhost:5000



from flask import Flask, request, send_from_directory, jsonify
import json
import pandas as pd
from sqlalchemy import create_engine


pd.set_option('display.max_rows', 500)
pd.set_option('display.max_columns', 500)
pd.set_option('display.width', 1000)

app = Flask(__name__, static_url_path='')

config = pd.read_csv('config.csv', header=None)
id = config[0][0]
pwd = config[0][1]
host = config[0][2]
engine = create_engine('postgresql://%s:%s@%s/dvf'%(id, pwd, host))

# Chargement des natures de culture
cultures = pd.read_csv('TableNatureCulture.csv')
culturesSpeciales = pd.read_csv('TableNatureSpeciale.csv')

@app.route('/api/dates')
def dates():
	dateMin = pd.read_sql("""SELECT min("Date mutation") FROM public.dvf """, engine)
	dateMax = pd.read_sql("""SELECT max("Date mutation") FROM public.dvf """, engine)
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


@app.route('/api/mutations/<commune>/<sectionPrefixee>/from=<dateminimum>&to=<datemaximum>')
def get_mutations(commune, sectionPrefixee, dateminimum, datemaximum):
	print("On récupère les mutations")
	mutations = pd.read_sql("""SELECT * FROM public.dvf WHERE "Code INSEE" = %(code)s AND "Section prefixe" = %(sectionPrefixee)s AND "Date mutation" >= %(datemin)s AND "Date mutation" <= %(datemax)s """, engine, params = {"code": commune, "sectionPrefixee" : sectionPrefixee, "datemin": dateminimum, "datemax": datemaximum})
	
	mutations = mutations.applymap(str) # Str pour éviter la conversion des dates en millisecondes.

	group_vars = ['No disposition','Date mutation', 'Valeur fonciere']
	mutations = mutations.merge(mutations[group_vars].drop_duplicates(group_vars).reset_index(), on=group_vars)
	mutations = mutations.rename(index=str, columns={"index": "groupe"})
	nbMutations = len(mutations.groupe.unique())
	print(mutations.to_json(orient = 'records', date_format='iso', date_unit='s'))
	json_mutations = '{"donnees": ' + mutations.to_json(orient = 'records') + ', "nbMutations": ' + str(nbMutations) + '}'
	
	return json_mutations

@app.route('/api/parcelles/<parcelle>/from=<dateminimum>&to=<datemaximum>')
def get_parcelle(parcelle, dateminimum, datemaximum):
	mutations = pd.read_sql("""SELECT * FROM public.dvf WHERE "Code parcelle" = %(code)s AND "Date mutation" >= %(datemin)s AND "Date mutation" <= %(datemax)s ;""", 
								engine, 
								params = {"code": parcelle, "datemin": dateminimum, "datemax": datemaximum})
	group_vars = ['No disposition','Date mutation', 'Valeur fonciere']
	mutations = mutations.merge(mutations[group_vars].drop_duplicates(group_vars).reset_index(), on=group_vars)
	mutations = mutations.rename(index=str, columns={"index": "groupe"})
	mutations = mutations.sort_values(by=['Date mutation'], ascending = False)

	json_mutations = []
	for mutationIndex in mutations.groupe.unique():
		df_s = mutations.loc[mutations.groupe == mutationIndex]
		df_s = df_s.applymap(str) # Str pour éviter la conversion des dates en millisecondes.

		# Informations générales
		infos = df_s.iloc[[0]]
		
		date = infos['Date mutation'][0]
		codeInsee = infos['Code INSEE'][0]
		section = infos['Section'][0]
		prix = infos['Valeur fonciere'][0]
		parcelle = mutations['Code parcelle'][0]
		
		infos = infos.to_json(orient = 'records')
		
		# Mutations liées
		mutations_liees = pd.read_sql("""SELECT * FROM public.dvf WHERE "Date mutation" = %(date)s AND  "Code INSEE" = %(codeInsee)s AND  "Section" = %(section)s AND  "Valeur fonciere" = %(prix)s AND  "Code parcelle"<> %(parcelle)s;""", 
                                  engine, 
								  params = {"date": date, "codeInsee" : codeInsee, "section" : section, "prix" : prix, "parcelle" : parcelle})
		mutations_liees['Type local'].replace('Local industriel. commercial ou assimilé', 'Local industriel commercial ou assimilé', inplace = True)
		mutations_liees = mutations_liees.to_json(orient = 'records')
		

		# Maison, dépendances et locaux commerciaux
		batiments = df_s[['Code type local', 'Type local', 'Surface reelle bati', 'Nombre pieces principales']].drop_duplicates()
		batiments = batiments[batiments['Type local'] != "None"]
		batiments = batiments.sort_values(by=['Code type local'])
		batiments['Type local'].replace('Local industriel. commercial ou assimilé', 'Local industriel commercial ou assimilé', inplace = True)		
		batiments = batiments.to_json(orient = 'records')

		# Terrains 
		terrains = df_s[['Nature culture', 'Nature culture speciale', 'Surface terrain']].drop_duplicates()
		terrains = terrains[terrains['Surface terrain'] != "None"]
		terrains = terrains.merge(cultures, left_on='Nature culture', right_on='Code Nature de Culture', how = 'left')
		terrains = terrains.merge(culturesSpeciales, left_on='Nature culture speciale', right_on='Code Nature Culture Spéciale', how = 'left')
		terrains = terrains.fillna("")
		terrains = terrains.to_json(orient = 'records')

		# Appartements avec lots
		
		lots = df_s[['1er lot', 'Surface Carrez du 1er lot',
				 '2eme lot', 'Surface Carrez du 2eme lot', 
				 '3eme lot', 'Surface Carrez du 3eme lot',
				 '4eme lot', 'Surface Carrez du 4eme lot',
				 '5eme lot', 'Surface Carrez du 5eme lot']].drop_duplicates()
		lots.columns = ['Lot1', 'Carrez1', 'Lot2', 'Carrez2', 'Lot3', 'Carrez3', 'Lot4', 'Carrez4', 'Lot5', 'Carrez5']
		
		lots['id'] = range(1, len(lots) + 1)
		lots = pd.wide_to_long(lots, ["Lot", "Carrez"], i='id', j='numLot')
		lots = lots[lots['Lot'] != "None"]
		lots = lots.reset_index()
		lots = lots.to_json(orient = 'records')
		
		json_mutation = '{"infos": ' + infos + ', "batiments": ' + batiments + ', "terrains": ' + terrains + ', "lots": ' + lots + ', "mutations_liees": ' + mutations_liees + '}'
		json_mutations.append(json_mutation)

	retour = '{"mutations": [' + ', '.join(json_mutations) + '], "nbMutations": [' + str(len(mutations.groupe.unique())) +  ']}'
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
	app.run()
