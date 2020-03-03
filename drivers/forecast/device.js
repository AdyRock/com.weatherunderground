'use strict';

const Homey = require( 'homey' );
const https = require( "https" );

class ForecastDevice extends Homey.Device
{

    onInit()
    {
        this.log( ' Forecast has been inited' );
        this.refreshCapabilities = this.refreshCapabilities.bind( this );
        this.timerID = setTimeout( this.refreshCapabilities, 1000 );
    }

    async refreshCapabilities()
    {
        try
        {
            let result = await this.getForecast();
            if ( result )
            {
                let forecastData = JSON.parse( result.body );

                this.log( "currentData = " + JSON.stringify( forecastData ) );
                this.setCapabilityValue( "forecast_text", forecastData.daypart[ 0 ].daypartName[ 2 ] );
                this.setCapabilityValue( "measure_cloud_cover", forecastData.daypart[ 0 ].cloudCover[ 2 ] );

                this.setCapabilityValue( "measure_precipitation_chance", forecastData.daypart[ 0 ].precipChance[ 2 ] );
                this.setCapabilityValue( "precipitation_type", forecastData.daypart[ 0 ].precipType[ 2 ] );

                this.setCapabilityValue( "measure_rain", forecastData.qpf[ 2 ] );
                this.setCapabilityValue( "measure_snow", forecastData.qpfSnow[ 2 ] );

                this.setCapabilityValue( "measure_temperature.max", forecastData.temperatureMax[ 2 ] );
                this.setCapabilityValue( "measure_temperature.min", forecastData.temperatureMin[ 2 ] );

                this.setCapabilityValue( "measure_wind_angle", forecastData.daypart[ 0 ].windDirection[ 2 ] );
                this.setCapabilityValue( "measure_wind_strength", forecastData.daypart[ 0 ].windSpeed[ 2 ] );

                this.setCapabilityValue( "measure_temperature.windchill", forecastData.daypart[ 0 ].temperatureWindChill[ 2 ] );
                this.setCapabilityValue( "measure_humidity", forecastData.daypart[ 0 ].relativeHumidity[ 2 ] );

                this.setCapabilityValue( "measure_ultraviolet", forecastData.daypart[ 0 ].uvIndex[ 2 ] );
            }
        }
        catch ( err )
        {
            this.log( "Refresh Error: " + err );
        }
        // Refresh forecast 1 per hour
        this.timerID = setTimeout( this.refreshCapabilities, 3600000 );
    }

    async getPlaceID()
    {
        let settings = this.getSettings();
        let url = "https://api.weather.com/v3/location/search?query=" + settings.stationID + "&locationType=pws&language=en-US&format=json&apiKey=" + settings.apiKey;
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

    async getForecast()
    {
        let settings = this.getSettings();
        let placeID = settings.placeID;
        if ( !placeID || (settings.oldStationID != settings.stationID ))
        {
            let searchResult = await this.getPlaceID();
            if ( searchResult )
            {
                let searchData = JSON.parse( searchResult.body );
                this.log( "searchData = " + JSON.stringify( searchData ) );
                placeID = searchData.location.placeId[0];
                settings.oldStationID = settings.stationID;
            }
            else
            {
                reject( null );
            }
        }
        let url = "https://api.weather.com/v3/wx/forecast/daily/5day?placeid=" + placeID + "&units=m&language=en-US&format=json&apiKey=" + settings.apiKey;
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

    async onDeleted()
    {
        clearTimeout( this.timerID );
    }
}

module.exports = ForecastDevice;