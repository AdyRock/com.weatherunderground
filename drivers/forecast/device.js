'use strict';

const Homey = require( 'homey' );

class ForecastDevice extends Homey.Device
{

    async onInit()
    {
        this.log( ' Forecast has been inited' );
        this.refreshCapabilities = this.refreshCapabilities.bind( this );
        this.timerID = setTimeout( this.refreshCapabilities, 1000 );

        if ( this.hasCapability( "measure_wind_strength" ) )
        {
            this.addCapability( "measure_gust_strength" );
            this.removeCapability( "measure_wind_strength" );
        }

        if ( !this.hasCapability( "thunder_category" ) )
        {
            this.addCapability( "thunder_category" );
        }
    }

    async onSettings( oldSettingsObj, newSettingsObj )
    {
        // run when the user has changed the device's settings in Homey.
        // changedKeysArr contains an array of keys that have been changed

        // if the settings must not be saved for whatever reason:
        // throw new Error('Your error message');
        this.log( "onSettings called" );

        let placeID = await Homey.app.getPlaceID( newSettingsObj, oldSettingsObj )
        if ( !placeID )
        {
            throw new Error( Homey.__( "stationNotFound" ) );
        }

        this.setSettings( { placeID: placeID, oldStationID: settings.stationID } ).catch( this.error );
    }

    async refreshCapabilities()
    {
        try
        {
            this.unsetWarning();
            let result = await this.getForecast();
            if ( result )
            {
                let forecastData = JSON.parse( result.body );

                Homey.app.updateLog( "currentData = " + JSON.stringify( forecastData, null, 2 ) );
                this.setCapabilityValue( "forecast_text", forecastData.daypart[ 0 ].daypartName[ 2 ] );
                this.setCapabilityValue( "measure_cloud_cover", forecastData.daypart[ 0 ].cloudCover[ 2 ] );

                this.setCapabilityValue( "measure_precipitation_chance", forecastData.daypart[ 0 ].precipChance[ 2 ] );
                this.setCapabilityValue( "precipitation_type", forecastData.daypart[ 0 ].precipType[ 2 ] );

                this.setCapabilityValue( "measure_rain", forecastData.qpf[ 2 ] );
                this.setCapabilityValue( "measure_snow", forecastData.qpfSnow[ 2 ] );

                this.setCapabilityValue( "measure_temperature.max", forecastData.temperatureMax[ 2 ] );
                this.setCapabilityValue( "measure_temperature.min", forecastData.temperatureMin[ 2 ] );

                this.setCapabilityValue( "measure_wind_angle", forecastData.daypart[ 0 ].windDirection[ 2 ] );
                this.setCapabilityValue( "measure_gust_strength", forecastData.daypart[ 0 ].windSpeed[ 2 ] );

                this.setCapabilityValue( "measure_temperature.windchill", forecastData.daypart[ 0 ].temperatureWindChill[ 2 ] );
                this.setCapabilityValue( "measure_humidity", forecastData.daypart[ 0 ].relativeHumidity[ 2 ] );

                this.setCapabilityValue( "measure_ultraviolet", forecastData.daypart[ 0 ].uvIndex[ 2 ] );
                this.setCapabilityValue( "thunder_category", forecastData.daypart[ 0 ].thunderCategory[ 2 ] );
                this.setAvailable();
            }
        }
        catch ( err )
        {
            this.log( "Forecast Refresh Error: " + err );
            this.setWarning( "Forecast Refresh Error: " + err, null );
        }
        // Refresh forecast 1 per hour
        this.timerID = setTimeout( this.refreshCapabilities, 3600000 );
    }

    async getForecast()
    {
        let settings = this.getSettings();
        let placeID = await Homey.app.getPlaceID( settings, null );
        if ( placeID == null )
        {
            return null;
        }
        this.setSettings( { placeID: placeID, oldStationID: settings.stationID } ).catch( this.error );

        let langCode = Homey.__( "langCode" );
        let url = "https://api.weather.com/v3/wx/forecast/daily/5day?placeid=" + placeID + "&units=m&language=" + langCode + "&format=json&apiKey=" + settings.apiKey;
        return await Homey.app.GetURL( url );
    }

    async onDeleted()
    {
        clearTimeout( this.timerID );
    }
}

module.exports = ForecastDevice;