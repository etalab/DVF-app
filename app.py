# coding: utf-8

# Pour lancer le serveur : python app.py
# Puis acceder au site sur localhost:5000



from flask import Flask, request, send_from_directory, jsonify
import json
import pandas as pd


pd.set_option('display.max_rows', 500)
pd.set_option('display.max_columns', 500)
pd.set_option('display.width', 1000)

app = Flask(__name__, static_url_path='')

# Chargement des natures de culture
cultures = pd.read_csv('TableNatureCulture.csv')
culturesSpeciales = pd.read_csv('TableNatureSpeciale.csv')

@app.route('/api/dates')
def dates():
	dateMin = "2014-01-01"
	dateMax = "2018-12-31"
	return '{"min": "' + dateMin + '", "max": "' + dateMax + '"}'


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
	json_mutations = '{}'
	return json_mutations

@app.route('/api/parcelles/<parcelle>/from=<dateminimum>&to=<datemaximum>')
def get_parcelle(parcelle, dateminimum, datemaximum):
	retour = '{}'
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
