/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

const Sector = {
    'en': ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'],
    'nl': ['N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO', 'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW', 'N'],
    'fr': ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'OOO', 'NO', 'NNO', 'N']
};

class WeatherDevice extends Homey.Device
{

    onInit()
    {
        this.log( ' WeatherDevice has been init' );

        if ( !this.hasCapability( 'button.send_log' ) )
        {
            this.addCapability( 'button.send_log' );
        }

        this.registerCapabilityListener( 'button.send_log', this.onCapabilitySedLog.bind( this ) );

        if ( this.hasCapability( "measure_temperature.heatIndex" ) )
        {
            this.removeCapability( "measure_temperature.heatIndex" );
        }

        if ( this.hasCapability( "measure_temperature.windchill" ) )
        {
            this.removeCapability( "measure_temperature.windchill" );
        }

        this.setCapabilityValue( "measure_temperature.feelsLike", 0 ).catch( this.error );
        
        if (!this.hasCapability('measure_hours_since_rained'))
        {
            this.addCapability('measure_hours_since_rained');
        }
        
        if (!this.hasCapability('measure_wind_direction'))
        {
            this.addCapability('measure_wind_direction');
        }

        this.lastRained = this.homey.settings.get('lastRainedTime');
        if (this.lastRained === null)
        {
            const now = new Date(Date.now());
            this.lastRained = now.getTime();
            this.homey.settings.set('lastRainedTime', this.lastRained);
        }

        if ( this.homey.app.NumStations == 0 )
        {
            // App must have been updated from an older version that didn't have this setting
            this.homey.app.NumStations++;
            this.homey.settings.set( 'NumStations', this.homey.app.NumStations );
        }

        // Refresh forecast but give it a minute to settle down
        this.timerID = this.homey.setTimeout( () =>
        {
			this.unitsChanged('SpeedUnits');
			this.refreshCapabilities();
        }, 6000 );
    }

    async onSettings( { oldSettings, newSettings, changedKeys } )
    {
        // run when the user has changed the device's settings in Homey.
        // changedKeysArr contains an array of keys that have been changed

        // if the settings must not be saved for whatever reason:
        // throw new Error('Your error message');
        this.log( "onSettings called" );

        try
        {
            let placeID = await this.homey.app.getPlaceID( newSettings, oldSettings );
            if ( !placeID )
            {
                throw new Error( Homey.__( "stationNotFound" ) );
            }

            if ( this.timerID )
            {
                this.homey.clearTimeout( this.timerID );
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

    async unitsChanged( Units )
    {
        if ( Units === 'SpeedUnits' )
        {
            let unitsText = '';
            
            switch (this.homey.app.SpeedUnits)
            {
                case '0':
                    unitsText = this.homey.__('speedUnits.km');
                    break;
                case '1':
                    unitsText = this.homey.__('speedUnits.m');
                    break;
                case '2':
                    unitsText = this.homey.__('speedUnits.mph');
                    break;
				case '3':
					unitsText = this.homey.__('speedUnits.knots');
					break;
				default:
                    unitsText = this.homey.__('speedUnits.km');
                    break;
            }

			this.setCapabilityOptions( 'measure_wind_strength', { "units": unitsText } );
            this.setCapabilityOptions( 'measure_gust_strength', { "units": unitsText } );
            if ( this.timerID )
            {
                this.homey.clearTimeout( this.timerID );
            }
            setImmediate( () =>
            {
                this.refreshCapabilities();
            } );
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

                this.setAvailable().catch( this.error );
                this.unsetWarning().catch( this.error );

                if ( this.homey.app.stationOffline )
                {
                    this.homey.app.stationOffline = false;
                    this.homey.app.dataResumedTrigger.trigger().catch( this.error );
                }

                this.homey.app.updateLog( "PWS Data = " + JSON.stringify( currentData, null, 2 ) );
                this.setCapabilityValue( "measure_wind_angle", currentData.winddir ).catch( this.error );

                var index = parseInt(currentData.winddir / 22.5);
                let langCode = this.homey.i18n.getLanguage();
                if ((langCode !== 'en') && (langCode !== 'nl'))
                {
                    langCode = 'en';
                }
                let windDir = Sector[langCode][index];
                this.setCapabilityValue('measure_wind_direction', windDir).catch(this.error);
    
                if ( this.homey.app.SpeedUnits === '0' )
                {
                    this.setCapabilityValue( "measure_wind_strength", currentData.metric.windSpeed ).catch( this.error );
                    this.setCapabilityValue( "measure_gust_strength", currentData.metric.windGust ).catch( this.error );
                }
                else if ( this.homey.app.SpeedUnits === '1' )
                {
                    // Convert Km/H to m/s
                    this.setCapabilityValue( "measure_wind_strength", currentData.metric.windSpeed * 1000 / 3600 ).catch( this.error );
                    this.setCapabilityValue( "measure_gust_strength", currentData.metric.windGust * 1000 / 3600 ).catch( this.error );
                }
				else if ( this.homey.app.SpeedUnits === '2' )
				{
					// Convert Km/H to mph
					this.setCapabilityValue( "measure_wind_strength", currentData.metric.windSpeed / 1.609344 ).catch( this.error );
					this.setCapabilityValue( "measure_gust_strength", currentData.metric.windGust / 1.609344 ).catch( this.error );
				}
				else if ( this.homey.app.SpeedUnits === '3' )
				{
					// Convert Km/H to knots
					this.setCapabilityValue( "measure_wind_strength", currentData.metric.windSpeed / 1.852 ).catch( this.error );
					this.setCapabilityValue( "measure_gust_strength", currentData.metric.windGust / 1.852 ).catch( this.error );
				}

                this.setCapabilityValue( "measure_humidity", currentData.humidity ).catch( this.error );
                this.setCapabilityValue( "measure_temperature", currentData.metric.temp ).catch( this.error );

                let oldFeelsLike = this.getCapabilityValue( "measure_temperature.feelsLike" );

                if ( currentData.metric.temp <= 16.1 )
                {
                    this.setCapabilityValue( "measure_temperature.feelsLike", currentData.metric.windChill ).catch( this.error );
                }
                else if ( currentData.metric.temp >= 21 )
                {
                    this.setCapabilityValue( "measure_temperature.feelsLike", currentData.metric.heatIndex ).catch( this.error );
                }
                else
                {
                    this.setCapabilityValue( "measure_temperature.feelsLike", currentData.metric.temp ).catch( this.error );
                }

                if ( oldFeelsLike != this.getCapabilityValue( "measure_temperature.feelsLike" ) )
                {
                    this.driver.triggerFeelLike( this, this.getCapabilityValue( "measure_temperature.feelsLike" ) );
                }

                if ( currentData.metric.dewpt != this.getCapabilityValue( "measure_temperature.dewPoint" ) )
                {
                    this.setCapabilityValue( "measure_temperature.dewPoint", currentData.metric.dewpt ).catch( this.error );
                    this.driver.triggerDewPoint( this, currentData.metric.dewpt );
                }

                this.setCapabilityValue( "measure_rain", currentData.metric.precipRate ).catch( this.error );
                if (currentData.metric.precipRate > 0)
                {
                    const now = new Date(Date.now());
                    this.lastRained = now.getTime();
                    this.homey.settings.set('lastRainedTime', this.lastRained);
                    this.setCapabilityValue('measure_hours_since_rained', 0).catch(this.error);
                }
                else
                {
                    const now = new Date(Date.now());
                    const diff = now.getTime() - this.lastRained;
                    const noRainHours = Math.floor(diff / 1000 / 60 / 60);
                    this.setCapabilityValue('measure_hours_since_rained', noRainHours).catch(this.error);
                }
    
                if ( currentData.metric.precipTotal != this.getCapabilityValue( "measure_rain.total" ) )
                {
                    this.setCapabilityValue( "measure_rain.total", currentData.metric.precipTotal ).catch( this.error );
                    this.driver.triggerRainTotal( this, currentData.metric.precipTotal );
                }

                this.setCapabilityValue( "measure_pressure", currentData.metric.pressure ).catch( this.error );

                this.log( "UV = ", currentData.uv, "Radiation = ", currentData.solarRadiation );
                if ( currentData.uv != null )
                {
                    if ( !this.hasCapability( "measure_ultraviolet" ) )
                    {
                        await this.addCapability( "measure_ultraviolet" );
                    }
                    this.setCapabilityValue( "measure_ultraviolet", currentData.uv ).catch( this.error );
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
                        this.driver.radiationTrigger = this.homey.flow.getDeviceTriggerCard( 'measure_radiation_changed' );
                    }

                    this.homey.app.updateLog( "SR Old = " + this.getCapabilityValue( "measure_radiation" ) + " SR New = " + currentData.solarRadiation );

                    if ( currentData.solarRadiation != this.getCapabilityValue( "measure_radiation" ) )
                    {
                        this.setCapabilityValue( "measure_radiation", currentData.solarRadiation ).catch( this.error );
                        this.driver.triggerRadiation( this, currentData.solarRadiation );
                    }
                }
                else if ( this.hasCapability( "measure_radiation" ) )
                {
                    this.removeCapability( "measure_radiation" );
                }
                this.homey.app.updateLog( "refreshCapabilities complete" );
            }
            else
            {
                this.homey.app.updateLog( "refreshCapabilities NO data received", true );
                if ( !this.homey.app.stationOffline )
                {
                    this.homey.app.stationOffline = true;
                    this.homey.app.noDataTrigger.trigger().catch( this.error );
                }

                this.setWarning( "No data received" );
            }
        }
        catch ( err )
        {
            errString = this.homey.app.varToString( err, false );
            this.log( "Weather Refresh: " + err );
        }

        try
        {
            if ( errString )
            {
                this.homey.app.updateLog( "Weather Refresh: " + errString, true );
                this.unsetWarning();

                if ( !this.homey.app.stationOffline && ( errString.search( ": 204" ) > 0 ) )
                {
                    this.homey.app.stationOffline = true;
                    this.homey.app.noDataTrigger.trigger().catch( this.error );
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
            this.homey.app.updateLog( "Weather Refresh Error Error: " + this.homey.app.varToString( error, false ), true );
        }

        this.timerID = this.homey.setTimeout( () =>
        {
            this.refreshCapabilities();
        }, 60000 * this.homey.app.NumStations );
    }

    async getWeather()
    {
        let settings = this.getSettings();
        let url = "https://api.weather.com/v2/pws/observations/current?numericPrecision=decimal&stationId=" + settings.stationID + "&format=json&units=m&apiKey=" + settings.apiKey;
        return await this.homey.app.GetURL( url );
    }

    async onCapabilitySedLog( value )
    {
        const body = {
            notify: true,
            logType: "diag"
        };

        this.homey.app.sendLog( body );
    }

    async onAdded()
    {
        this.homey.app.NumStations++;
        this.homey.settings.set( 'NumStations', this.homey.app.NumStations );
    }

    async onDeleted()
    {
        if ( this.timerID )
        {
            this.homey.clearTimeout( this.timerID );
        }
        this.homey.app.NumStations--;
        this.homey.settings.set( 'NumStations', this.homey.app.NumStations );
    }
}

module.exports = WeatherDevice;
