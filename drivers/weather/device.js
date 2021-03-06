/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

class WeatherDevice extends Homey.Device
{

    onInit()
    {
        this.log( ' WeatherDevice has been init' );

        if ( this.hasCapability( "measure_temperature.heatIndex" ) )
        {
            this.removeCapability( "measure_temperature.heatIndex" );
        }

        if ( this.hasCapability( "measure_temperature.windchill" ) )
        {
            this.removeCapability( "measure_temperature.windchill" );
        }

        this.setCapabilityValue( "measure_temperature.feelsLike", 0 );

        this._driver = this.getDriver();

        // Refresh forecast but give it a minute to settle down
        this.timerID = setTimeout( () =>
        {
            this.refreshCapabilities();
        }, 6000 );
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
            let placeID = await Homey.app.getPlaceID( newSettingsObj, oldSettingsObj );
            if ( !placeID )
            {
                throw new Error( Homey.__( "stationNotFound" ) );
            }

            if ( this.timerID )
            {
                clearTimeout( this.timerID );
            }
            setImmediate( () =>
            {
                this.refreshCapabilities();
            } );
        }
        catch ( e )
        {
            throw new Error( e );
        }
    }

    async refreshCapabilities()
    {
        let errString = null;

        try
        {
            this.log( "PWS refreshCapabilities" );

            let result = await this.getWeather();
            if ( result )
            {
                let weatherData = JSON.parse( result.body );
                let currentData = weatherData.observations[ 0 ];

                this.setAvailable();
                this.unsetWarning();

                if ( Homey.app.stationOffline )
                {
                    Homey.app.stationOffline = false;

                    let dataResumedTrigger = new Homey.FlowCardTrigger( 'data_resumed_changed' );
                    dataResumedTrigger
                        .register()
                        .trigger()
                        .catch( this.error )
                        .then( this.log( "Resumed triggered" ) );
                }

                Homey.app.updateLog( "PWS Data = " + JSON.stringify( currentData, null, 2 ) );
                this.setCapabilityValue( "measure_wind_angle", currentData.winddir );
                this.setCapabilityValue( "measure_wind_strength", currentData.metric.windSpeed );
                this.setCapabilityValue( "measure_gust_strength", currentData.metric.windGust );
                this.setCapabilityValue( "measure_humidity", currentData.humidity );
                this.setCapabilityValue( "measure_temperature", currentData.metric.temp );

                let oldFeelsLike = this.getCapabilityValue( "measure_temperature.feelsLike" );

                if ( currentData.metric.temp <= 16.1 )
                {
                    await this.setCapabilityValue( "measure_temperature.feelsLike", currentData.metric.windChill );
                }
                else if ( currentData.metric.temp >= 21 )
                {
                    await this.setCapabilityValue( "measure_temperature.feelsLike", currentData.metric.heatIndex );
                }
                else
                {
                    await this.setCapabilityValue( "measure_temperature.feelsLike", currentData.metric.temp );
                }

                if ( oldFeelsLike != this.getCapabilityValue( "measure_temperature.feelsLike" ) )
                {
                    this._driver.triggerFeelLike( this, this.getCapabilityValue( "measure_temperature.feelsLike" ) );
                }

                if ( currentData.metric.dewpt != this.getCapabilityValue( "measure_temperature.dewPoint" ) )
                {
                    await this.setCapabilityValue( "measure_temperature.dewPoint", currentData.metric.dewpt );
                    this._driver.triggerDewPoint( this, currentData.metric.dewpt );
                }

                this.setCapabilityValue( "measure_rain", currentData.metric.precipRate );

                if ( currentData.metric.precipTotal != this.getCapabilityValue( "measure_rain.total" ) )
                {
                    await this.setCapabilityValue( "measure_rain.total", currentData.metric.precipTotal );
                    this._driver.triggerRainTotal( this, currentData.metric.precipTotal );
                }

                this.setCapabilityValue( "measure_pressure", currentData.metric.pressure );

                this.log( "UV = ", currentData.uv, "Radiation = ", currentData.solarRadiation );
                if ( currentData.uv != null )
                {
                    if ( !this.hasCapability( "measure_ultraviolet" ) )
                    {
                        await this.addCapability( "measure_ultraviolet" );
                    }
                    this.setCapabilityValue( "measure_ultraviolet", currentData.uv );
                }
                else if ( this.hasCapability( "measure_ultraviolet" ) )
                {
                    this.removeCapability( "measure_ultraviolet" );
                }

                if ( currentData.solarRadiation != null )
                {
                    if ( !this.hasCapability( "measure_radiation" ) )
                    {
                        await this.addCapability( "measure_radiation" );
                        this._driver.radiationTrigger = new Homey.FlowCardTriggerDevice( 'measure_radiation_changed' )
                            .register();
                    }

                    Homey.app.updateLog( "SR Old = " + this.getCapabilityValue( "measure_radiation" ) + " SR New = " + currentData.solarRadiation );

                    if ( currentData.solarRadiation != this.getCapabilityValue( "measure_radiation" ) )
                    {
                        await this.setCapabilityValue( "measure_radiation", currentData.solarRadiation );
                        this._driver.triggerRadiation( this, currentData.solarRadiation );
                    }
                }
                else if ( this.hasCapability( "measure_radiation" ) )
                {
                    this.removeCapability( "measure_radiation" );
                }
                Homey.app.updateLog( "refreshCapabilities complete" );
            }
            else
            {
                Homey.app.updateLog( "refreshCapabilities NO data received", true );
                if ( !Homey.app.stationOffline )
                {
                    Homey.app.stationOffline = true;
                    let noDataTrigger = new Homey.FlowCardTrigger( 'no_data_changed' );
                    noDataTrigger
                        .register()
                        .trigger()
                        .catch( this.error )
                        .then( this.log( "Trigger stationOffline" ) );

                }

                this.setWarning( "No data received" );
            }
        }
        catch ( err )
        {
            errString = Homey.app.varToString( err, false );
            this.log( "Weather Refresh: " + err );
        }

        try
        {
            if ( errString )
            {
                Homey.app.updateLog( "Weather Refresh: " + errString, true );
                this.unsetWarning();

                if ( !Homey.app.stationOffline && ( errString.search( ": 204" ) > 0 ) )
                {
                    Homey.app.stationOffline = true;

                    let noDataTrigger = new Homey.FlowCardTrigger( 'no_data_changed' );
                    noDataTrigger
                        .register()
                        .trigger()
                        .catch( this.error )
                        .then( this.log( "Trigger no_data_changed" ) );

                    this.setUnavailable( "No data available" );
                }
                else
                {
                    this.setUnavailable( errString );
                }
            }
        }
        catch ( error )
        {
            Homey.app.updateLog( "Weather Refresh Error Error: " + Homey.app.varToString( error, false ), true );
        }

        this.timerID = setTimeout( () =>
        {
            this.refreshCapabilities();
        }, 60000 );
    }

    async getWeather()
    {
        let settings = this.getSettings();
        let url = "https://api.weather.com/v2/pws/observations/current?numericPrecision=decimal&stationId=" + settings.stationID + "&format=json&units=m&apiKey=" + settings.apiKey;
        return await Homey.app.GetURL( url );
    }

    async onDeleted()
    {
        if ( this.timerID )
        {
            clearTimeout( this.timerID );
        }
    }
}

module.exports = WeatherDevice;