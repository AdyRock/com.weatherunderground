'use strict';

const Homey = require( 'homey' );
const https = require( "https" );

class WeatherApp extends Homey.App
{
    onInit()
    {
        this.log( ' WeatherApp is running...' );
    }

    async GetURL( url )
    {
        this.log( url );

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
                            this.log( "retrieve data" );
                            body.push( chunk );
                        } );
                        res.on( 'end', () =>
                        {
                            this.log( "Done retrieval of data" );
                            resolve(
                            {
                                "body": Buffer.concat( body )
                            } );
                        } );
                    }
                    else
                    {
                        this.log( "HTTPS Error: " + res.statusCode );
                        reject( null );
                    }
                } ).on( 'error', ( err ) =>
                {
                    this.log( err );
                    reject( null );
                } );
            }
            catch ( e )
            {
                this.log( e );
                reject( null );
            }
        } );
    }
}

module.exports = WeatherApp;