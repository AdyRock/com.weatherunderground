'use strict';

const Homey = require( 'homey' );

const forecast_dayToNum = [
    { id: "today", value: 0 },
    { id: "tonight", value: 1 },
    { id: "today_1", value: 2 },
    { id: "tonight_1", value: 3 },
    { id: "today_2", value: 4 },
    { id: "tonight_2", value: 5 },
    { id: "today_3", value: 6 },
    { id: "tonight_3", value: 7 },
    { id: "today_4", value: 8 },
    { id: "tonight_4", value: 9 },
    { id: "today_5", value: 10 },
    { id: "tonight_5", value: 11 },
];

class ForecastDevice extends Homey.Device
{

    async onInit()
    {
        this.log( ' Forecast has been inited' );
        this.refreshCapabilities = this.refreshCapabilities.bind( this );
        this.timerID = setTimeout( this.refreshCapabilities, 1000 );

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
            this.addCapability( "measure_gust_strength" );
            this.removeCapability( "measure_wind_strength" );
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
            return this.updateCapabilities( value );
        } );

        if ( !this.getCapabilityValue( 'forecast_day' ) )
        {
            this.setCapabilityValue( 'forecast_day', "today" );
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

        clearTimeout( this.timerID );
        this.timerID = setTimeout( this.refreshCapabilities, 1000 );
    }

    async updateCapabilities( value )
    {
        try
        {
            if ( this.forecastData )
            {
                const entry = forecast_dayToNum.find( x => x.id == value );
                let dayNight = entry.value;
                const day = Math.floor( dayNight / 2 );
                this.log( "day = " + dayNight );

                // Whole day parts
                this.setCapabilityValue( "forecast_active_day", this.forecastData.dayOfWeek[ day ] );
                this.setCapabilityValue( "forecast_moonPhase", this.forecastData.moonPhase[ day ] );
                this.setCapabilityValue( "measure_rain", this.forecastData.qpf[ day ] );
                this.setCapabilityValue( "measure_snow", this.forecastData.qpfSnow[ day ] );
                this.setCapabilityValue( "measure_temperature.max", this.forecastData.temperatureMax[ day ] );
                this.setCapabilityValue( "measure_temperature.min", this.forecastData.temperatureMin[ day ] );

                // Day / Night parts
                if (this.forecastData.daypart[ 0 ].daypartName[ dayNight ] == null){
                    dayNight++;
                }
                this.setCapabilityValue( "forecast_text", this.forecastData.daypart[ 0 ].daypartName[ dayNight ] );
                this.setCapabilityValue( "forecast_summary", this.forecastData.daypart[ 0 ].wxPhraseLong[ dayNight ] );
                this.setCapabilityValue( "measure_cloud_cover", this.forecastData.daypart[ 0 ].cloudCover[ dayNight ] );
                this.setCapabilityValue( "measure_precipitation_chance", this.forecastData.daypart[ 0 ].precipChance[ dayNight ] );
                this.setCapabilityValue( "precipitation_type", this.forecastData.daypart[ 0 ].precipType[ dayNight ] );
                this.setCapabilityValue( "measure_wind_angle", this.forecastData.daypart[ 0 ].windDirection[ dayNight ] );
                this.setCapabilityValue( "measure_gust_strength", this.forecastData.daypart[ 0 ].windSpeed[ dayNight ] );
                this.setCapabilityValue( "measure_humidity", this.forecastData.daypart[ 0 ].relativeHumidity[ dayNight ] );
                this.setCapabilityValue( "measure_ultraviolet", this.forecastData.daypart[ 0 ].uvIndex[ dayNight ] );
                this.setCapabilityValue( "thunder_category", this.forecastData.daypart[ 0 ].thunderCategory[ dayNight ] );
                this.setCapabilityValue( "measure_temperature.feelsLike", this.forecastData.daypart[ 0 ].temperature[ dayNight ] );
                
                this.setAvailable();
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
        try
        {
            this.log( "Forecast refreshCapabilities" );
            
            this.unsetWarning();
            let result = await this.getForecast();
            if ( result )
            {
                this.forecastData = JSON.parse( result.body );
                Homey.app.updateLog( "Forecast Data = " + JSON.stringify( this.forecastData, null, 2 ) );
                this.updateCapabilities( this.getCapabilityValue( 'forecast_day' ) );
                Homey.app.stationOffline = false;
            }
        }
        catch ( err )
        {
            this.log( "Forecast Refresh Error: " + err );
            this.setWarning( "Forecast Refresh Error: " + err, null );

            if ( !Homey.app.stationOffline && (err.search( ": 204" ) > 0 ))
            {
                Homey.app.stationOffline = true;
                let noDataTrigger = new Homey.FlowCardTrigger( 'no_data_changed' );
                noDataTrigger
                    .register()
                    .trigger()
                    .catch( this.error )
                    .then( this.log("Offline triggered") )
            }
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