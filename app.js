'use strict';

const Homey = require( 'homey' );
const https = require( "https" );

class WeatherApp extends Homey.App
{
    onInit()
    {
        this.log( ' WeatherApp is running...' );
    }

    async getPlaceID( newSettings, oldSettings )
    {
        let placeID = newSettings.placeID;
        let oldStationID = newSettings.oldStationID;
        if (oldSettings)
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
                        reject( null );
                    }
                } ).on( 'error', ( err ) =>
                {
                    this.updateLog( err );
                    reject( null );
                } );
            }
            catch ( e )
            {
                this.updateLog( e );
                reject( null );
            }
        } );
    }

    updateLog( newMessage )
    {
        if ( !Homey.ManagerSettings.get( 'logEnabled' ) )
        {
            return;
        }

        this.log( newMessage );
        var oldText = Homey.ManagerSettings.get( 'diagLog' );
        oldText += "* ";
        oldText += newMessage;
        oldText += "\r\n";
        Homey.ManagerSettings.set( 'diagLog', oldText );
    }
}

module.exports = WeatherApp;