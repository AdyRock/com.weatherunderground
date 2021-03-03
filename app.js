/*jslint node: true */
'use strict';
if ( process.env.DEBUG === '1' )
{
    require( 'inspector' ).open( 9222, '0.0.0.0', true );
}

const Homey = require( 'homey' );
const https = require( "https" );

class WeatherApp extends Homey.App
{
    onInit()
    {
        this.log( ' WeatherApp is running...' );
        Homey.ManagerSettings.set( 'diagLog', "App Started\r\n" );
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
                    let body = [];

                    res.on( 'data', ( chunk ) =>
                    {
                        this.updateLog( "retrieve data" );
                        body.push( chunk );
                    } );

                    res.on( 'end', () =>
                    {
                        this.updateLog( "Done retrieval of data" );
                        if ( res.statusCode === 200 )
                        {
                            resolve(
                            {
                                "body": Buffer.concat( body )
                            } );
                        }
                        else
                        {
                            this.updateLog( "HTTPS Error: " + res.statusCode, true );
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
                            reject( "GetURL Error: " + res.statusCode + ", " + message );
                        }
                    } );
                } ).on( 'error', ( err ) =>
                {
                    let errMessage = null;
                    if ( err.message )
                    {
                        errMessage = err.message;
                    }
                    else if ( err.data )
                    {
                        if ( err.data.message )
                        {
                            errMessage = err.data.message;
                        }
                    }

                    if ( !errMessage )
                    {
                        errMessage = err.toString();
                    }

                    this.updateLog( "GetURL On Error: " + this.varToString( err ), true );
                    reject( "GetURL On Error: " + errMessage );
                } );
            }
            catch ( e )
            {
                this.updateLog( "GetURL Catch: " + this.varToString( e ), true );
                reject( e );
            }
        } );
    }

    varToString( source, includeStack = true )
    {
        try
        {
            if ( source === null )
            {
                return "null";
            }
            if ( source === undefined )
            {
                return "undefined";
            }
            if ( source instanceof Error )
            {
                if ( includeStack )
                {
                    let stack = source.stack.replace( '/\\n/g', '\n' );
                    return source.message + '\n' + stack;
                }
                return source.message;
            }
            if ( typeof( source ) === "object" )
            {
                return JSON.stringify( source, null, 2 );
            }
            if ( typeof( source ) === "string" )
            {
                return source;
            }

            return source.toString();
        }
        catch ( error )
        {
            this.log( "Error decoding message to a string", source );
            return "Error decoding message to a string";
        }
    }

    updateLog( newMessage, isError = false )
    {
        // Maximum size of the log in characters
        let maxSize = 30000;
        if ( !Homey.ManagerSettings.get( 'logEnabled' ) )
        {
            if ( !isError )
            {
                return;
            }

            // Reduce the size if only logging errors
            maxSize = 5000;
        }

        this.log( newMessage );

        //Remove the API key from the output
        let apiKeyIndex = newMessage.indexOf( "apiKey=" );
        if ( apiKeyIndex > 0 )
        {
            newMessage = newMessage.substring( 0, apiKeyIndex + 7 );
        }

        var oldText = Homey.ManagerSettings.get( 'diagLog' );
        if ( oldText.length > maxSize )
        {
            // Remove characters from the beginning to make space for the new message.
            oldText = oldText.substring( newMessage.length + 20 );
            var n = oldText.indexOf( "\n" );
            if ( n >= 0 )
            {
                // Remove up to and including the first \n so the log starts on a whole line
                oldText = oldText.substring( n + 1 );
            }
        }

        const nowTime = new Date( Date.now() );

        if ( oldText.length == 0 )
        {
            oldText = "Log ID: ";
            oldText += nowTime.toJSON();
            oldText += "\r\n";
            oldText += "App version ";
            oldText += Homey.manifest.version;
            oldText += "\r\n\r\n";
            this.logLastTime = nowTime;
        }

        oldText += nowTime.toJSON();
        oldText += "\r\n  ";

        oldText += "* ";
        oldText += newMessage;
        oldText += "\r\n\r\n";
        Homey.ManagerSettings.set( 'diagLog', oldText );
    }
}

module.exports = WeatherApp;