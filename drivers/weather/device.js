'use strict';

const Homey = require( 'homey' );

class WeatherDevice extends Homey.Device
{

    onInit()
    {
        this.log( ' WeatherDevice has been inited' );

        if ( this.hasCapability( "measure_temperature.heatIndex" ) )
        {
            this.removeCapability( "measure_temperature.heatIndex" );
        }

        if ( this.hasCapability( "measure_temperature.windchill" ) )
        {
            this.removeCapability( "measure_temperature.windchill" );
        }

        if ( !this.hasCapability( "measure_ultraviolet" ) )
        {
            this.addCapability( "measure_ultraviolet" );
        }

        if ( !this.hasCapability( "measure_radiation" ) )
        {
            this.addCapability( "measure_radiation" );
        }

        this.refreshCapabilities = this.refreshCapabilities.bind( this );
        this.timerID = setTimeout( this.refreshCapabilities, 1000 );
    }

    async onSettings( oldSettingsObj, newSettingsObj )
    {
        // run when the user has changed the device's settings in Homey.
        // changedKeysArr contains an array of keys that have been changed

        // if the settings must not be saved for whatever reason:
        // throw new Error('Your error message');
        this.log( "onSettings called" );

        try
        {
            let placeID = await Homey.app.getPlaceID( newSettingsObj, oldSettingsObj )
            if ( !placeID )
            {
                throw new Error( Homey.__( "stationNotFound" ) );
            }

            clearTimeout( this.timerID );
            this.timerID = setTimeout( this.refreshCapabilities, 1000 );
        }
        catch ( e )
        {
            throw new Error( e );
        }
    }

    async refreshCapabilities()
    {
        try
        {
            this.log( "refreshCapabilities" );

            this.unsetWarning();
            let result = await this.getWeather();
            if ( result )
            {
                let weatherData = JSON.parse( result.body );
                let currentData = weatherData.observations[ 0 ];

                Homey.app.updateLog( "currentData = " + JSON.stringify( currentData, null, 2 ) );
                this.setCapabilityValue( "measure_wind_angle", currentData.winddir );
                this.setCapabilityValue( "measure_wind_strength", currentData.metric.windSpeed );
                this.setCapabilityValue( "measure_gust_strength", currentData.metric.windGust );
                this.setCapabilityValue( "measure_humidity", currentData.humidity );
                this.setCapabilityValue( "measure_temperature", currentData.metric.temp );
                if ( currentData.metric.temp <= 16.1 )
                {
                    this.setCapabilityValue( "measure_temperature.feelsLike", currentData.metric.windChill );
                }
                else if ( currentData.metric.temp >= 21 )
                {
                    this.setCapabilityValue( "measure_temperature.feelsLike", currentData.metric.heatIndex );
                }
                else
                {
                    this.setCapabilityValue( "measure_temperature.feelsLike", currentData.metric.temp );
                }
                this.setCapabilityValue( "measure_temperature.dewPoint", currentData.metric.dewpt );
                this.setCapabilityValue( "measure_rain", currentData.metric.precipRate );
                this.setCapabilityValue( "measure_rain.total", currentData.metric.precipTotal );
                this.setCapabilityValue( "measure_pressure", currentData.metric.pressure );
                this.setCapabilityValue( "measure_ultraviolet", currentData.uv );
                this.setCapabilityValue( "measure_radiation", currentData.solarRadiation );
                this.setAvailable();
                Homey.app.updateLog( "refreshCapabilities complete: SR= " + currentData.solarRadiation );
            }
        }
        catch ( err )
        {
            this.log( "Weather Refresh: " + err );
            this.setWarning( err, null );
        }
        this.timerID = setTimeout( this.refreshCapabilities, 60000 );
    }

    async getWeather()
    {
        let settings = this.getSettings();
        let url = "https://api.weather.com/v2/pws/observations/current?numericPrecision=decimal&stationId=" + settings.stationID + "&format=json&units=m&apiKey=" + settings.apiKey;
        return await Homey.app.GetURL( url );
    }

    async onDeleted()
    {
        clearTimeout( this.timerID );
    }
}

module.exports = WeatherDevice;