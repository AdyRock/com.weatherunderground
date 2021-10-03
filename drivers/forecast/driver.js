/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

class ForecastDriver extends Homey.Driver
{

    onInit()
    {
        this.log( 'ForecastDriver has been inited' );

        this.rainTrigger = this.homey.flow.getDeviceTriggerCard( 'rain_changed_forecast' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire rain trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.windAngleTrigger = this.homey.flow.getDeviceTriggerCard( 'wind_angle_changed_forecast' );
        this.windAngleTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire wind angle trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );


        this.gustStrengthTrigger = this.homey.flow.getDeviceTriggerCard( 'gust_strength_forecast' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire gust trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.humidityTrigger = this.homey.flow.getDeviceTriggerCard( 'humidity_changed_forecast' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire humidity trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.ultraVioletTrigger = this.homey.flow.getDeviceTriggerCard( 'ultraviolet_changed_forecast' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire UV trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.tempMaxTrigger = this.homey.flow.getDeviceTriggerCard( 'temperature_max_changed' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire T.Max trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.tempMaxLessTrigger = this.homey.flow.getDeviceTriggerCard( 'temperature_max_less_than' )
            .registerRunListener( ( args, state ) =>
            {
                // If true, this flow should run
                return Promise.resolve( ( args.day === state.day ) && ( state.temperature < args.temperature ) && (state.oldValue >= args.temperature) );
            } );

        this.tempMaxGreaterTrigger = this.homey.flow.getDeviceTriggerCard( 'temperature_max_greater_than' )
            .registerRunListener( ( args, state ) =>
            {
                // If true, this flow should run
                return Promise.resolve( ( args.day === state.day ) && ( state.temperature > args.temperature ) && (state.oldValue <= args.temperature) );
            } );

        this.tempMinTrigger = this.homey.flow.getDeviceTriggerCard( 'temperature_min_changed' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire T.Min trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.tempMinLessTrigger = this.homey.flow.getDeviceTriggerCard( 'temperature_min_less_than' )
            .registerRunListener( ( args, state ) =>
            {
                // If true, this flow should run
                return Promise.resolve( ( args.day === state.day ) && ( state.temperature < args.temperature ) && (state.oldValue >= args.temperature) );
            } );

        this.tempMinGreaterTrigger = this.homey.flow.getDeviceTriggerCard( 'temperature_min_greater_than' )
            .registerRunListener( ( args, state ) =>
            {
                // If true, this flow should run
                return Promise.resolve( ( args.day === state.day ) && ( state.temperature > args.temperature ) && (state.oldValue <= args.temperature) );
            } );

        this.cloudCoverTrigger = this.homey.flow.getDeviceTriggerCard( 'cloud_cover_changed' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire Cloud trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.precipitationTypeTrigger = this.homey.flow.getDeviceTriggerCard( 'precipitation_type_changed' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire precipitation type trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.precipitationTrigger = this.homey.flow.getDeviceTriggerCard( 'precipitation_chance_changed' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire precipitation chance trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.snowTrigger = this.homey.flow.getDeviceTriggerCard( 'snow_changed' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire snow chance trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.temperatureTrigger = this.homey.flow.getDeviceTriggerCard( 'temperature_feelsLike_forecast_changed' )
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire feels like trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );
    }

    async onPair( session )
    {
        session.setHandler( 'validate', async ( settings ) =>
        {
            this.log( 'onPair validate called: ' + settings );
            return await this.homey.app.getPlaceID( settings, null );
        } );
    }

    async triggerRain( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering rain changed for: ", Day, " With: ", Value );
        let tokens = { 'measure_rain': Value };
        let state = { 'day': Day };

        this.rainTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_rain" ) )
            .catch( this.error );
    }

    async triggerWindAngle( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering wind angle changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_wind_angle': Value };
        let state = { 'day': Day };

        this.windAngleTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_wind_angle" ) )
            .catch( this.error );
    }

    async triggerGustStrength( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering gust strength changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_gust_strength': Value };
        let state = { 'day': Day };

        this.gustStrengthTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_gust_strength" ) )
            .catch( this.error );
    }

    async triggerHumidity( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering humidity changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_humidity': Value };
        let state = { 'day': Day };

        this.humidityTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_humidity" ) )
            .catch( this.error );
    }

    async triggerUltraviolet( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering ultraviolet changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_ultraviolet': Value };
        let state = { 'day': Day };

        this.ultraVioletTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_ultraviolet" ) )
            .catch( this.error );
    }

    async triggerTempMax( Device, Day, Value, OldValue )
    {
        // trigger the card
        this.log( "Triggering max temp changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_temperature.max': Value };
        let state = { 'day': Day, "temperature": Value, 'oldValue': OldValue};

        this.tempMaxTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger forecast_temperature.max" ) )
            .catch( this.error );

        this.tempMaxGreaterTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger forecast_temperature.max_greater" ) )
            .catch( this.error );

        this.tempMaxLessTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger forecast_temperature.max_less" ) )
            .catch( this.error );
    }

    async triggerTempMin( Device, Day, Value, OldValue )
    {
        // trigger the card
        this.log( "Triggering min temp changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_temperature.min': Value };
        let state = { 'day': Day, "temperature": Value, 'oldValue': OldValue };

        this.tempMinTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_temperature.min" ) )
            .catch( this.error );

        this.tempMinGreaterTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger forecast_temperature.min_greater" ) )
            .catch( this.error );

        this.tempMinLessTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger forecast_temperature.min_less" ) )
            .catch( this.error );
    }

    async triggerCloudCover( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering cloud cover changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_cloud_cover': Value };
        let state = { 'day': Day };

        this.cloudCoverTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_cloud_cover" ) )
            .catch( this.error );
    }

    async triggerPrecipitationType( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering precipitation type changed for: ", Day, " with: ", Value );
        let tokens = { 'precipitation_type': Value };
        let state = { 'day': Day };

        this.precipitationTypeTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger precipitation_type" ) )
            .catch( this.error );
    }

    async triggerRainChance( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering precipitation chance changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_precipitation_chance': Value };
        let state = { 'day': Day };

        this.precipitationTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_precipitation_chance" ) )
            .catch( this.error );
    }

    async triggerSnow( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering snow changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_snow': Value };
        let state = { 'day': Day };

        this.snowTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_snow" ) )
            .catch( this.error );
    }

    async triggerTemperature( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering feels like changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_temperature.feelsLike.forecast': Value };
        let state = { 'day': Day };

        this.temperatureTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_temperature.feelsLike.forecast" ) )
            .catch( this.error );
    }
}

module.exports = ForecastDriver;