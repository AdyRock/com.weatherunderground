/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

const forecast_dayToNum = [
    { id: "today", value: 0, day: 0 },
    { id: "tonight", value: 1, day: -1 },
    { id: "today_1", value: 2, day: 1 },
    { id: "tonight_1", value: 3, day: -2 },
    { id: "today_2", value: 4, day: 2 },
    { id: "tonight_2", value: 5, day: -3 },
    { id: "today_3", value: 6, day: 3 },
    { id: "tonight_3", value: 7, day: -4 },
    { id: "today_4", value: 8, day: 4 },
    { id: "tonight_4", value: 9, day: -5 },
    { id: "today_5", value: 10, day: 5 },
    { id: "tonight_5", value: 11, day: -6 },
];

class ForecastDevice extends Homey.Device
{
    async onInit()
    {
        this.log( 'ForecastDevice has been initialised' );

        if ( !this.hasCapability( "forecast_day" ) )
        {
            this.addCapability( "forecast_day" );
        }

        if ( !this.hasCapability( "forecast_active_day" ) )
        {
            this.addCapability( "forecast_active_day" );
        }

        if ( !this.hasCapability( "forecast_moonPhase" ) )
        {
            this.addCapability( "forecast_moonPhase" );
        }

        if ( !this.hasCapability( "forecast_summary" ) )
        {
            this.addCapability( "forecast_summary" );
        }

        if ( this.hasCapability( "measure_wind_strength" ) )
        {
            this.addCapability( "measure_gust_strength.forecast" );
            this.removeCapability( "measure_wind_strength" );
        }

        if ( this.hasCapability( "measure_rain" ) )
        {
            this.addCapability( "measure_rain.forecast" );
            this.removeCapability( "measure_rain" );
        }

        if ( this.hasCapability( "measure_wind_angle" ) )
        {
            this.addCapability( "measure_wind_angle.forecast" );
            this.removeCapability( "measure_wind_angle" );
        }

        if ( this.hasCapability( "measure_gust_strength" ) )
        {
            this.addCapability( "measure_gust_strength.forecast" );
            this.removeCapability( "measure_gust_strength" );
        }

        if ( this.hasCapability( "measure_humidity" ) )
        {
            this.addCapability( "measure_humidity.forecast" );
            this.removeCapability( "measure_humidity" );
        }

        if ( this.hasCapability( "measure_ultraviolet" ) )
        {
            this.addCapability( "measure_ultraviolet.forecast" );
            this.removeCapability( "measure_ultraviolet" );
        }

        if ( this.hasCapability( "thunder_category" ) )
        {
            this.removeCapability( "thunder_category" );
        }

        if ( this.hasCapability( "measure_temperature.windchill" ) )
        {
            this.removeCapability( "measure_temperature.windchill" );
        }

        if ( !this.hasCapability( "measure_temperature.feelsLike.forecast" ) )
        {
            this.addCapability( "measure_temperature.feelsLike.forecast" );
        }

        if ( this.hasCapability( "measure_temperature.feelsLike" ) )
        {
            this.removeCapability( "measure_temperature.feelsLike" );
        }

        this.registerCapabilityListener( 'forecast_day', async ( Day ) =>
        {
            return this.updateCapabilities( Day );
        } );

        if ( !this.getCapabilityValue( 'forecast_day' ) )
        {
            this.setCapabilityValue( 'forecast_day', "today" );
        }

        this._driver = this.getDriver();

        // Refresh forecast but give it a minute and a bit to settle down
        this.timerID = setTimeout( () =>
        {
            this.refreshCapabilities();
        }, 70000 );
    }

    async onSettings( oldSettingsObj, newSettingsObj )
    {
        // run when the user has changed the device's settings in Homey.
        // changedKeysArr contains an array of keys that have been changed

        // if the settings must not be saved for whatever reason:
        // throw new Error('Your error message');
        this.log( "onSettings called" );

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

    async updateCapabilities( SelectedDay )
    {
        try
        {
            if ( this.forecastData )
            {
                // Update the capabilities for the selected day

                this.setAvailable();
                this.unsetWarning();
                Homey.app.stationOffline = false;

                const entry = forecast_dayToNum.find( x => x.id == SelectedDay );
                let dayNight = entry.value;
                let day = entry.day;
                if ( day < 0 )
                {
                    day = -1 - day;
                }
                this.log( "day = ", day, " Day/Night = ", dayNight );

                // Whole day parts
                this.setCapabilityValue( "forecast_active_day", this.forecastData.dayOfWeek[ day ] );
                this.setCapabilityValue( "forecast_moonPhase", this.forecastData.moonPhase[ day ] );
                this.setCapabilityValue( "measure_rain.forecast", this.forecastData.qpf[ day ] );
                this.setCapabilityValue( "measure_snow", this.forecastData.qpfSnow[ day ] );
                this.setCapabilityValue( "measure_temperature.max", this.forecastData.temperatureMax[ day ] );
                this.setCapabilityValue( "measure_temperature.min", this.forecastData.temperatureMin[ day ] );

                // Day / Night parts
                if ( this.forecastData.daypart[ 0 ].daypartName[ dayNight ] == null )
                {
                    dayNight++;
                }
                this.setCapabilityValue( "forecast_text", this.forecastData.daypart[ 0 ].daypartName[ dayNight ] );
                this.setCapabilityValue( "forecast_summary", this.forecastData.daypart[ 0 ].wxPhraseLong[ dayNight ] );
                this.setCapabilityValue( "measure_cloud_cover", this.forecastData.daypart[ 0 ].cloudCover[ dayNight ] );
                this.setCapabilityValue( "measure_precipitation_chance", this.forecastData.daypart[ 0 ].precipChance[ dayNight ] );
                this.setCapabilityValue( "precipitation_type", this.forecastData.daypart[ 0 ].precipType[ dayNight ] );
                this.setCapabilityValue( "measure_wind_angle.forecast", this.forecastData.daypart[ 0 ].windDirection[ dayNight ] );
                this.setCapabilityValue( "measure_gust_strength.forecast", this.forecastData.daypart[ 0 ].windSpeed[ dayNight ] );
                this.setCapabilityValue( "measure_humidity.forecast", this.forecastData.daypart[ 0 ].relativeHumidity[ dayNight ] );
                this.setCapabilityValue( "measure_ultraviolet.forecast", this.forecastData.daypart[ 0 ].uvIndex[ dayNight ] );
                this.setCapabilityValue( "measure_temperature.feelsLike.forecast", this.forecastData.daypart[ 0 ].temperature[ dayNight ] );
            }
        }
        catch ( err )
        {
            this.log( "Forecast Update: " + err );
            this.setWarning( err, null );
        }
    }

    async refreshCapabilities()
    {
        let errString = null;

        try
        {
            this.log( "Forecast refreshCapabilities" );

            // refresh the forecast cache
            let result = await this.getForecast( this );
            if ( result )
            {
                this.forecastData = JSON.parse( result.body );
                Homey.app.updateLog( "Forecast Data = " + JSON.stringify( this.forecastData, null, 2 ) );

                // Update the capabilities for the selected day
                this.updateCapabilities( this.getCapabilityValue( 'forecast_day' ) );

                if ( this.oldForecastData )
                {
                    // Check for changes in each day and trigger flows as required
                    forecast_dayToNum.forEach( ( element ) =>
                    {
                        this.log( "Checking forecast triggers for: ", element.id, "Value: ", element.value, "Day: ", element.day );
                        if ( element.day >= 0 )
                        {
                            if ( this.forecastData.qpf[ element.day ] != this.oldForecastData.qpf[ element.day ] ) { this._driver.triggerRain( this, element.id, this.forecastData.qpf[ element.day ] ); }
                            if ( this.forecastData.qpfSnow[ element.day ] != this.oldForecastData.qpfSnow[ element.day ] ) { this._driver.triggerSnow( this, element.id, this.forecastData.qpfSnow[ element.day ] ); }
                            if ( this.forecastData.temperatureMax[ element.day ] != this.oldForecastData.temperatureMax[ element.day ] ) { this._driver.triggerTempMax( this, element.id, this.forecastData.temperatureMax[ element.day ] ); }
                            if ( this.forecastData.temperatureMin[ element.day ] != this.oldForecastData.temperatureMin[ element.day ] ) { this._driver.triggerTempMin( this, element.id, this.forecastData.temperatureMin[ element.day ] ); }
                        }

                        let dayNight = element.value;
                        if ( this.forecastData.daypart[ 0 ].daypartName[ dayNight ] == null )
                        {
                            dayNight++;
                        }
                        if ( this.forecastData.daypart[ 0 ].cloudCover[ dayNight ] != this.oldForecastData.daypart[ 0 ].cloudCover[ dayNight ] ) { this._driver.triggerCloudCover( this, element.id, this.forecastData.daypart[ 0 ].cloudCover[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].precipChance[ dayNight ] != this.oldForecastData.daypart[ 0 ].precipChance[ dayNight ] ) { this._driver.triggerRainChance( this, element.id, this.forecastData.daypart[ 0 ].precipChance[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].precipType[ dayNight ] != this.oldForecastData.daypart[ 0 ].precipType[ dayNight ] ) { this._driver.triggerPrecipitationType( this, element.id, this.forecastData.daypart[ 0 ].precipType[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].windDirection[ dayNight ] != this.oldForecastData.daypart[ 0 ].windDirection[ dayNight ] ) { this._driver.triggerWindAngle( this, element.id, this.forecastData.daypart[ 0 ].windDirection[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].windSpeed[ dayNight ] != this.oldForecastData.daypart[ 0 ].windSpeed[ dayNight ] ) { this._driver.triggerGustStrength( this, element.id, this.forecastData.daypart[ 0 ].windSpeed[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].relativeHumidity[ dayNight ] != this.oldForecastData.daypart[ 0 ].relativeHumidity[ dayNight ] ) { this._driver.triggerHumidity( this, element.id, this.forecastData.daypart[ 0 ].relativeHumidity[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].uvIndex[ dayNight ] != this.oldForecastData.daypart[ 0 ].uvIndex[ dayNight ] ) { this._driver.triggerUltraviolet( this, element.id, this.forecastData.daypart[ 0 ].uvIndex[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].thunderCategory[ dayNight ] != this.oldForecastData.daypart[ 0 ].thunderCategory[ dayNight ] ) { this._driver.triggerThunder( this, element.id, this.forecastData.daypart[ 0 ].thunderCategory[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].temperature[ dayNight ] != this.oldForecastData.daypart[ 0 ].temperature[ dayNight ] ) { this._driver.triggerTemperature( this, element.id, this.forecastData.daypart[ 0 ].temperature[ dayNight ] ); }
                    } );
                }

                this.oldForecastData = this.forecastData;
            }
            else
            {
                this.setWarning( "No data received" );
            }
        }
        catch ( err )
        {
            errString = Homey.app.varToString( err, false );
            this.log( "Forecast Refresh Error: " + err );
        }

        try
        {
            if ( errString )
            {
                Homey.app.updateLog( "Forecast Refresh: " + errString, true );
                this.unsetWarning();

                if ( !Homey.app.stationOffline && ( errString.search( ": 204" ) > 0 ) )
                {
                    Homey.app.stationOffline = true;

                    let noDataTrigger = new Homey.FlowCardTrigger( 'no_data_changed' );
                    noDataTrigger
                        .register()
                        .trigger()
                        .catch( this.error )
                        .then( this.log( "Offline triggered" ) );

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
            Homey.app.updateLog( "Forecast Refresh Error Error: " + Homey.app.varToString( error, false ), true );
        }

        // Refresh forecast 1 per hour
        this.timerID = setTimeout( () =>
        {
            this.refreshCapabilities();
        }, 3600000 ); //3600000 ms = 1 hour
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

    getDayNight( SelectedDay )
    {
        const entry = forecast_dayToNum.find( x => x.id == SelectedDay );
        let dayNight = entry.value;
        let day = entry.day;
        if ( day < 0 )
        {
            day = -1 - day;
        }
        // Day / Night parts
        if ( this.forecastData.daypart[ 0 ].daypartName[ dayNight ] == null )
        {
            dayNight++;
        }

        return { 'dayNight': dayNight, 'day': day };
    }

    async onDeleted()
    {
        clearTimeout( this.timerID );
    }
}

module.exports = ForecastDevice;