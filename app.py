import json
import requests
import pymongo
from flask import Flask, render_template, redirect, jsonify
import pandas as pd
import time

app = Flask(__name__)
conn = 'mongodb://localhost:27017'
client = pymongo.MongoClient(conn)

client.drop_database('fifa')

fifa_db = client.fifa
fifa_data = fifa_db.data

csvfile = 'resources/FIFA_data.csv'
csv_read = pd.read_csv(csvfile)

fifa_data.insert_many(csv_read.to_dict('records'))

@app.route("/")
def index():
    """Return the homepage."""
    return render_template("index.html")

@app.route("/bar/countries")
def countries():

    countries_list = fifa_data.find({}, {'Nationality':1, '_id':0})
    
    countries_list_unique = []

    for country in countries_list:
        if country['Nationality'] not in countries_list_unique:
            countries_list_unique.append(country['Nationality'])

    countries_list_sorted = sorted(countries_list_unique)

    countries_list_final = ['Overall']

    for country in countries_list_sorted:
        countries_list_final.append(country)

    # Return a list of the country names, including 'Overall' at the beginning of the list

    return jsonify(countries_list_final)

@app.route("/bar/Overall/<whichSort>")
def barOverall(whichSort):
    player_list = fifa_data.find({}, {'ID':1, 'Name':1, 'Photo':1, 'Nationality':1, 'Flag':1, 'Overall':1, 'Value':1, '_id':0})

    player_list_with_numeric_values = []

    for player in player_list:
        player['Value'] = player['Value'][1:]
        if 'M' in player['Value']:
            player['Value'] = float(player['Value'][:-1]) * 10**6
        elif 'K' in player['Value']:
            player['Value'] = float(player['Value'][:-1]) * 1000
        else:
            player['Value'] = float(player['Value'])
        player_list_with_numeric_values.append(player)

    player_list_sorted = sorted(player_list_with_numeric_values,key = lambda player: player[whichSort], reverse = True)[:10]
    
    players_top_ten = []

    for player in player_list_sorted:
        players_top_ten.append(player)

    return jsonify(players_top_ten)

@app.route("/bar/<country>/<whichSort>")
def bar(country, whichSort):
    player_list = fifa_data.find({'Nationality':country}, {'ID':1, 'Name':1, 'Photo':1, 'Nationality':1, 'Flag':1, 'Overall':1, 'Value':1, '_id':0})

    player_list_with_numeric_values = []

    for player in player_list:
        player['Value'] = player['Value'][1:]
        if 'M' in player['Value']:
            player['Value'] = float(player['Value'][:-1]) * 10**6
        elif 'K' in player['Value']:
            player['Value'] = float(player['Value'][:-1]) * 1000
        else:
            player['Value'] = float(player['Value'])
        player_list_with_numeric_values.append(player)

    player_list_sorted = sorted(player_list_with_numeric_values,key = lambda player: player[whichSort], reverse = True)[:10]

    players_per_country = []

    for player in player_list_sorted:
        players_per_country.append(player)

    players_top_ten_per_country = []

    for player in players_per_country:
        if not any(player_dict['ID'] == player['ID'] for player_dict in players_top_ten_per_country):
            players_top_ten_per_country.append({
                'ID': player['ID'],
                'Name': player['Name'],
                'Photo': player['Photo'],
                'Nationality': player['Nationality'],
                'Flag': player['Flag'],
                'Overall': player['Overall'],
                'Value': player['Value']
            })

    return jsonify(players_top_ten_per_country)

if __name__ == "__main__":
    app.run(debug=True)