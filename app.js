'use strict';

const Homey = require( 'homey' );
const https = require( "https" );

class WeatherApp extends Homey.App
{
    onInit()
    {
        this.log( ' WeatherApp is running...' );
        Homey.ManagerSettings.set( 'diagLog', "App Started" );
        this.stationOffline = false;
    }

    async getPlaceID( newSettings, oldSettings )
    {
        let placeID = newSettings.placeID;
        let oldStationID = newSettings.oldStationID;
        if ( oldSettings )
        {
            oldStationID = oldSettings.stationID;
        }

        if ( !placeID || ( oldStationID != newSettings.stationID ) )
        {
            let url = "https://api.weather.com/v3/location/search?query=" + newSettings.stationID + "&locationType=pws&language=en-US&format=json&apiKey=" + newSettings.apiKey;
            let searchResult = await this.GetURL( url );
            if ( searchResult )
            {
                let searchData = JSON.parse( searchResult.body );
                Homey.app.updateLog( JSON.stringify( searchData, null, 2 ) );
                placeID = searchData.location.placeId[ 0 ];
            }
            else
            {
                return null;
            }
        }

        return placeID;
    }

    async GetURL( url )
    {
        this.updateLog( url );

        return new Promise( ( resolve, reject ) =>
        {
            try
            {
                https.get( url, ( res ) =>
                {
                    if ( res.statusCode === 200 )
                    {
                        let body = [];
                        res.on( 'data', ( chunk ) =>
                        {
                            this.updateLog( "retrieve data" );
                            body.push( chunk );
                        } );
                        res.on( 'end', () =>
                        {
                            this.updateLog( "Done retrieval of data" );
                            resolve(
                            {
                                "body": Buffer.concat( body )
                            } );
                        } );
                    }
                    else
                    {
                        this.updateLog( "HTTPS Error: " + res.statusCode );
                        let message = "";
                        if ( res.statusCode === 204 )
                        {
                            message = "No Data Found";
                        }
                        else if ( res.statusCode === 400 )
                        {
                            message = "Bad request";
                        }
                        else if ( res.statusCode === 401 )
                        {
                            message = "Unauthorized";
                        }
                        else if ( res.statusCode === 403 )
                        {
                            message = "Forbidden";
                        }
                        else if ( res.statusCode === 404 )
                        {
                            message = "Not Found";
                        }
                        reject( "HTTPS Error: " + res.statusCode + ", " + message );
                    }
                } ).on( 'error', ( err ) =>
                {
                    this.updateLog( "HTTPS Catch: " + err );
                    reject( "HTTPS Catch: " + err );
                } );
            }
            catch ( e )
            {
                this.updateLog( e );
                reject( "HTTPS Error: " + e );
            }
        } );
    }

	varToString(source) {
		if (source === null) {
			return "null";
		}
		if (source === undefined) {
			return "undefined";
		}
		if (typeof (source) === "object") {
			return JSON.stringify(source, null, 2);
		}
		if (typeof (source) === "string") {
			return source;
		}

		return source.toString();
	}

    updateLog( newMessage )
    {
        if ( !Homey.ManagerSettings.get( 'logEnabled' ) )
        {
            return;
        }

        this.log( newMessage );
        var oldText = Homey.ManagerSettings.get( 'diagLog' );
        if ( oldText.length > 5000 )
        {
            oldText = "";
        }
        oldText += "* ";
        oldText += newMessage;
        oldText += "\r\n";
        Homey.ManagerSettings.set( 'diagLog', oldText );
    }
}

module.exports = WeatherApp;