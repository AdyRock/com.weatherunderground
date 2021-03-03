/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

class ForecastDriver extends Homey.Driver
{

    onInit()
    {
        this.log( 'ForecastDriver has been inited' );

        this.rainTrigger = new Homey.FlowCardTriggerDevice( 'rain_changed_forecast' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire rain trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.windAngleTrigger = new Homey.FlowCardTriggerDevice( 'wind_angle_changed_forecast' );
        this.windAngleTrigger
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire wind angle trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );


        this.gustStrengthTrigger = new Homey.FlowCardTriggerDevice( 'gust_strength_forecast' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire gust trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.humidityTrigger = new Homey.FlowCardTriggerDevice( 'humidity_changed_forecast' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire humidity trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.ultraVioletTrigger = new Homey.FlowCardTriggerDevice( 'ultraviolet_changed_forecast' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire UV trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.tempMaxTrigger = new Homey.FlowCardTriggerDevice( 'temperature_max_changed' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire T.Max trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.tempMinTrigger = new Homey.FlowCardTriggerDevice( 'temperature_min_changed' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire T.Min trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.cloudCoverTrigger = new Homey.FlowCardTriggerDevice( 'cloud_cover_changed' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire Cloud trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.precipitationTypeTrigger = new Homey.FlowCardTriggerDevice( 'precipitation_type_changed' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire precipitation type trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.precipitationTrigger = new Homey.FlowCardTriggerDevice( 'precipitation_chance_changed' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire precipitation chance trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.snowTrigger = new Homey.FlowCardTriggerDevice( 'snow_changed' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire snow chance trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.temperatureTrigger = new Homey.FlowCardTriggerDevice( 'temperature_feelsLike_forecast_changed' )
            .register()
            .registerRunListener( ( args, state ) =>
            {
                console.log( "Fire feels like trigger = ", args.day === state.day );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } );

        this.cloudCoverEqualCondition = new Homey.FlowCardCondition( 'cloud_cover_equal' );
        this.cloudCoverEqualCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return args.device.oldForecastData.daypart[ 0 ].cloudCover[ day.dayNight ] == args.value;
            } );

        this.cloudCoverGreaterCondition = new Homey.FlowCardCondition( 'cloud_cover_greater' );
        this.cloudCoverGreaterCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return args.device.oldForecastData.daypart[ 0 ].cloudCover[ day.dayNight ] > args.value;
            } );

        this.gustStrengthEqualCondition = new Homey.FlowCardCondition( 'gust_strength_equal' );
        this.gustStrengthEqualCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.daypart[ 0 ].windSpeed[ day.dayNight ] == args.value;
            } );

        this.gustStrengthGreaterCondition = new Homey.FlowCardCondition( 'gust_strength_greater' );
        this.gustStrengthGreaterCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.daypart[ 0 ].windSpeed[ day.dayNight ] > args.value;
            } );

        this.humidityEqualCondition = new Homey.FlowCardCondition( 'humidity_equal' );
        this.humidityEqualCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.daypart[ 0 ].relativeHumidity[ day.dayNight ] == args.value;
            } );

        this.humidityGreaterCondition = new Homey.FlowCardCondition( 'humidity_greater' );
        this.humidityGreaterCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.daypart[ 0 ].relativeHumidity[ day.dayNight ] > args.value;
            } );

        this.precipitationChanceEqualCondition = new Homey.FlowCardCondition( 'precipitation_chance_equal' );
        this.precipitationChanceEqualCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.daypart[ 0 ].precipChance[ day.dayNight ] == args.value;
            } );

        this.precipitationChanceGreaterCondition = new Homey.FlowCardCondition( 'precipitation_chance_greater' );
        this.precipitationChanceGreaterCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.daypart[ 0 ].precipChance[ day.dayNight ] > args.value;
            } );

        this.rainEqualCondition = new Homey.FlowCardCondition( 'rain_equal' );
        this.rainEqualCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.qpf[ day.day ] == args.value;
            } );

        this.rainGreaterCondition = new Homey.FlowCardCondition( 'rain_greater' );
        this.rainGreaterCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.qpf[ day.day ] > args.value;
            } );

        this.snowEqualCondition = new Homey.FlowCardCondition( 'snow_equal' );
        this.snowEqualCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.qpfSnow[ day.day ] == args.value;
            } );

        this.snowGreaterCondition = new Homey.FlowCardCondition( 'snow_greater' );
        this.snowGreaterCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.qpfSnow[ day.day ] > args.value;
            } );

        this.temperatureFeelsLikeEqualCondition = new Homey.FlowCardCondition( 'temperature_feelsLike_equal' );
        this.temperatureFeelsLikeEqualCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.daypart[ 0 ].temperature[ day.dayNight ] == args.value;
            } );

        this.temperatureFeelsLikeGreaterCondition = new Homey.FlowCardCondition( 'temperature_feelsLike_greater' );
        this.temperatureFeelsLikeGreaterCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.daypart[ 0 ].temperature[ day.dayNight ] > args.value;
            } );

        this.temperatureMaxEqualCondition = new Homey.FlowCardCondition( 'temperature_max_equal' );
        this.temperatureMaxEqualCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.temperatureMax[ day.day ] == args.value;
            } );

        this.temperatureMaxGreaterCondition = new Homey.FlowCardCondition( 'temperature_max_greater' );
        this.temperatureMaxGreaterCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.temperatureMax[ day.day ] > args.value;
            } );

        this.temperatureMinEqualCondition = new Homey.FlowCardCondition( 'temperature_min_equal' );
        this.temperatureMinEqualCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.temperatureMin[ day.day ] == args.value;
            } );

        this.temperatureMinGreaterCondition = new Homey.FlowCardCondition( 'temperature_min_greater' );
        this.temperatureMinGreaterCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.temperatureMin[ day.day ] > args.value;
            } );

        this.ultravioletEqualCondition = new Homey.FlowCardCondition( 'ultraviolet_equal' );
        this.ultravioletEqualCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.daypart[ 0 ].uvIndex[ day.dayNight ] == args.value;
            } );

        this.ultravioletGreaterCondition = new Homey.FlowCardCondition( 'ultraviolet_greater' );
        this.ultravioletGreaterCondition
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return this.forecastData.daypart[ 0 ].uvIndex[ day.dayNight ] > args.value;
            } );
    }

    onPair( socket )
    {
        socket.on( 'validate', ( settings, callback ) =>
        {
            this.log( 'onPair validate called: ' + settings );
            Homey.app.getPlaceID( settings, null ).then( placeID =>
            {
                this.log( 'onPair placeID = ' + placeID );
                callback( null, placeID );
            } ).catch( err =>
            {
                this.log( 'onPair err = ' + err );
                callback( null, false );
            } );
        } );
    }

    // this is the easiest method to overwrite, when only the template 'Drivers-Pairing-System-Views' is being used.
    onPairListDevices( data, callback )
    {
        // Required properties:
        //"data": { "id": "abcd" },

        // Optional properties, these overwrite those specified in app.json:
        // "name": "My Device",
        // "icon": "/my_icon.svg", // relative to: /drivers/<driver_id>/assets/
        // "capabilities": [ "onoff", "dim" ],
        // "capabilitiesOptions: { "onoff": {} },

        // Optional properties, device-specific:
        // "store": { "foo": "bar" },
        // "settings": { "my_setting": "my_value" },

        callback( null, null );
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

    async triggerTempMax( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering max temp changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_temperature.max': Value };
        let state = { 'day': Day };

        this.tempMaxTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_temperature.max" ) )
            .catch( this.error );
    }

    async triggerTempMin( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering min temp changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_temperature.min': Value };
        let state = { 'day': Day };

        this.tempMinTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger measure_temperature.min" ) )
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