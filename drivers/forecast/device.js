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
        this.log( 'ForecastDevice has been inited' );

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

        if ( !this.hasCapability( "thunder_category" ) )
        {
            this.addCapability( "thunder_category" );
        }

        if ( this.hasCapability( "measure_temperature.windchill" ) )
        {
            this.removeCapability( "measure_temperature.windchill" );
        }

        if ( !this.hasCapability( "measure_temperature.feelsLike" ) )
        {
            this.addCapability( "measure_temperature.feelsLike" );
        }

        this.registerCapabilityListener( 'forecast_day', async ( value ) =>
        {
            return this.updateCapabilities( this, value );
        } );

        if ( !this.getCapabilityValue( 'forecast_day' ) )
        {
            this.setCapabilityValue( 'forecast_day', "today" );
        }

        //setTimeout( this.refreshCapabilities, 1000, this );
        // let device = this;
        // let driver = this.getDriver();
        // driver.ready( () =>
        // {
        //     driver.triggerRain( device, "today", 5 );
        // } );
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

        //clearTimeout( this.timerID );
        //setTimeout( this.refreshCapabilities, 1000, this );
    }

    async updateCapabilities( Device, value )
    {
        try
        {
            if ( Device.forecastData )
            {
                const entry = forecast_dayToNum.find( x => x.id == value );
                let dayNight = entry.value;
                let day = entry.day;
                if ( day < 0 )
                {
                    day = -1 - day;
                }
                Device.log( "day = ", day, " Day/Night = ", dayNight );

                // Whole day parts
                Device.setCapabilityValue( "forecast_active_day", Device.forecastData.dayOfWeek[ day ] );
                Device.setCapabilityValue( "forecast_moonPhase", Device.forecastData.moonPhase[ day ] );
                Device.setCapabilityValue( "measure_rain.forecast", Device.forecastData.qpf[ day ] );
                Device.setCapabilityValue( "measure_snow", Device.forecastData.qpfSnow[ day ] );
                Device.setCapabilityValue( "measure_temperature.max", Device.forecastData.temperatureMax[ day ] );
                Device.setCapabilityValue( "measure_temperature.min", Device.forecastData.temperatureMin[ day ] );

                // Day / Night parts
                if ( Device.forecastData.daypart[ 0 ].daypartName[ dayNight ] == null )
                {
                    dayNight++;
                }
                Device.setCapabilityValue( "forecast_text", Device.forecastData.daypart[ 0 ].daypartName[ dayNight ] );
                Device.setCapabilityValue( "forecast_summary", Device.forecastData.daypart[ 0 ].wxPhraseLong[ dayNight ] );
                Device.setCapabilityValue( "measure_cloud_cover", Device.forecastData.daypart[ 0 ].cloudCover[ dayNight ] );
                Device.setCapabilityValue( "measure_precipitation_chance", Device.forecastData.daypart[ 0 ].precipChance[ dayNight ] );
                Device.setCapabilityValue( "precipitation_type", Device.forecastData.daypart[ 0 ].precipType[ dayNight ] );
                Device.setCapabilityValue( "measure_wind_angle.forecast", Device.forecastData.daypart[ 0 ].windDirection[ dayNight ] );
                Device.setCapabilityValue( "measure_gust_strength.forecast", Device.forecastData.daypart[ 0 ].windSpeed[ dayNight ] );
                Device.setCapabilityValue( "measure_humidity.forecast", Device.forecastData.daypart[ 0 ].relativeHumidity[ dayNight ] );
                Device.setCapabilityValue( "measure_ultraviolet.forecast", Device.forecastData.daypart[ 0 ].uvIndex[ dayNight ] );
                Device.setCapabilityValue( "thunder_category", Device.forecastData.daypart[ 0 ].thunderCategory[ dayNight ] );
                Device.setCapabilityValue( "measure_temperature.feelsLike", Device.forecastData.daypart[ 0 ].temperature[ dayNight ] );

                Device.setAvailable();

                let driver = Device.getDriver();
                driver.triggerRain( Device, entry.id, Device.forecastData.qpf[ day ] );
            }
        }
        catch ( err )
        {
            Device.log( "Forecast Update: " + err );
            Device.setWarning( err, null );
        }
    }

    async refreshCapabilities( Device )
    {
        try
        {
            Device.log( "Forecast refreshCapabilities" );

            Device.unsetWarning();
            let result = await Device.getForecast( Device );
            if ( result )
            {
                Device.forecastData = JSON.parse( result.body );
                Homey.app.updateLog( "Forecast Data = " + JSON.stringify( Device.forecastData, null, 2 ) );
                Device.updateCapabilities( Device, Device.getCapabilityValue( 'forecast_day' ) );

                if ( Device.forecastData )
                {
                    if ( Device.oldForecastData )
                    {
                        let driver = Device.getDriver();
                        forecast_dayToNum.forEach( ( element ) =>
                        {
                            Device.log( "Checking forecast triggers for: ", element.id );
                            if ( element.day == 0 )
                            {
                                if ( Device.forecastData.qpf[ element.day ] != Device.oldForecastData.qpf[ element.day ] ) { driver.triggerRain( Device, element.id, Device.forecastData.qpf[ element.day ] ); }
                                // if ( Device.forecastData.qpfSnow[ element.day ] != Device.oldForecastData.qpfSnow[ element.day ] ) { driver.triggerSnow( Device, element.id, Device.forecastData.qpfSnow[ element.day ] ); }
                                // if ( Device.forecastData.temperatureMax[ element.day ] != Device.oldForecastData.temperatureMax[ element.day ] ) { driver.triggerTempMax( Device, element.id, Device.forecastData.temperatureMax[ element.day ] ); }
                                // if ( Device.forecastData.temperatureMin[ element.day ] != Device.oldForecastData.temperatureMin[ element.day ] ) { driver.triggerTempMin( Device, element.id, Device.forecastData.temperatureMin[ element.day ] ); }
                            }

                            let dayNight = element.value;
                            if ( Device.forecastData.daypart[ 0 ].daypartName[ dayNight ] == null )
                            {
                                dayNight++;
                            }
                            // if ( Device.forecastData.daypart[ 0 ].cloudCover[ dayNight ] != Device.oldForecastData.daypart[ 0 ].cloudCover[ dayNight ] ) { driver.triggerCloudCover( Device, element.id, Device.forecastData.daypart[ 0 ].cloudCover[ dayNight ] ); }
                            // if ( Device.forecastData.daypart[ 0 ].precipChance[ dayNight ] != Device.oldForecastData.daypart[ 0 ].precipChance[ dayNight ] ) { driver.triggerRainChance( Device, element.id, Device.forecastData.daypart[ 0 ].precipChance[ dayNight ] ); }
                            // if ( Device.forecastData.daypart[ 0 ].precipType[ dayNight ] != Device.oldForecastData.daypart[ 0 ].precipType[ dayNight ] ) { driver.triggerPrecipitationType( Device, element.id, Device.forecastData.daypart[ 0 ].precipType[ dayNight ] ); }
                            // if ( Device.forecastData.daypart[ 0 ].windDirection[ dayNight ] != Device.oldForecastData.daypart[ 0 ].windDirection[ dayNight ] ) { driver.triggerWindAngle( Device, element.id, Device.forecastData.daypart[ 0 ].windDirection[ dayNight ] ); }
                            // if ( Device.forecastData.daypart[ 0 ].windSpeed[ dayNight ] != Device.oldForecastData.daypart[ 0 ].windSpeed[ dayNight ] ) { driver.triggerGustStrength( Device, element.id, Device.forecastData.daypart[ 0 ].windSpeed[ dayNight ] ); }
                            // if ( Device.forecastData.daypart[ 0 ].relativeHumidity[ dayNight ] != Device.oldForecastData.daypart[ 0 ].relativeHumidity[ dayNight ] ) { driver.triggerHumidity( Device, element.id, Device.forecastData.daypart[ 0 ].relativeHumidity[ dayNight ] ); }
                            // if ( Device.forecastData.daypart[ 0 ].uvIndex[ dayNight ] != Device.oldForecastData.daypart[ 0 ].uvIndex[ dayNight ] ) { driver.triggerUltraviolet( Device, element.id, Device.forecastData.daypart[ 0 ].uvIndex[ dayNight ] ); }
                            // if ( Device.forecastData.daypart[ 0 ].thunderCategory[ dayNight ] != Device.oldForecastData.daypart[ 0 ].thunderCategory[ dayNight ] ) { driver.triggerThunder( Device, element.id, Device.forecastData.daypart[ 0 ].thunderCategory[ dayNight ] ); }
                            // if ( Device.forecastData.daypart[ 0 ].temperature[ dayNight ] != Device.oldForecastData.daypart[ 0 ].temperature[ dayNight ] ) { driver.triggerTemperature( Device, element.id, Device.forecastData.daypart[ 0 ].temperature[ dayNight ] ); }
                        } )
                    }

                    Device.oldForecastData = Device.forecastData;
                }

                Homey.app.stationOffline = false;
            }
        }
        catch ( err )
        {
            Device.log( "Forecast Refresh Error: " + err );
            Device.setWarning( "Forecast Refresh Error: " + err, null );

            if ( !Homey.app.stationOffline && ( err.search( ": 204" ) > 0 ) )
            {
                Homey.app.stationOffline = true;
                let noDataTrigger = new Homey.FlowCardTrigger( 'no_data_changed' );
                noDataTrigger
                    .register()
                    .trigger()
                    .catch( Device.error )
                    .then( Device.log( "Offline triggered" ) )
            }
        }
        // Refresh forecast 1 per hour
        //Device.timerID = setTimeout( Device.refreshCapabilities, 3600000, Device );
    }

    async getForecast( Device )
    {
        let settings = Device.getSettings();
        let placeID = await Homey.app.getPlaceID( settings, null );
        if ( placeID == null )
        {
            return null;
        }
        Device.setSettings( { placeID: placeID, oldStationID: settings.stationID } ).catch( Device.error );

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