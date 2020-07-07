'use strict';

const Homey = require('homey');

class ForecastDriver extends Homey.Driver {
	
	onInit() {
        this.log('ForecastDriver has been inited');
        
        this.rainTrigger = new Homey.FlowCardTriggerDevice( 'rain_changed_forecast' );
        this.rainTrigger
        .register()
        .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )

        this.windAngleTrigger = new Homey.FlowCardTriggerDevice( 'wind_angle_changed_forecast' );
        this.windAngleTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();


        this.gustStrengthTrigger = new Homey.FlowCardTriggerDevice( 'gust_strength_forecast' );
        this.gustStrengthTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();

        this.humidityTrigger = new Homey.FlowCardTriggerDevice( 'humidity_changed_forecast' );
        this.humidityTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();

        this.ultraVioletTrigger = new Homey.FlowCardTriggerDevice( 'ultraviolet_changed_forecast' );
        this.ultraVioletTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();

        this.tempMaxTrigger = new Homey.FlowCardTriggerDevice( 'temperature_max_changed' );
        this.tempMaxTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();

        this.tempMinTrigger = new Homey.FlowCardTriggerDevice( 'temperature_min_changed' );
        this.tempMinTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();

        this.cloudCoverTrigger = new Homey.FlowCardTriggerDevice( 'cloud_cover_changed' );
        this.cloudCoverTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();

        this.precipitationTypeTrigger = new Homey.FlowCardTriggerDevice( 'precipitation_type_changed' );
        this.precipitationTypeTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();

        this.thunderCatTrigger = new Homey.FlowCardTriggerDevice( 'thunder_category_changed' );
        this.thunderCatTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();

        this.precipitationTrigger = new Homey.FlowCardTriggerDevice( 'precipitation_chance_changed' );
        this.precipitationTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();

        this.snowTrigger = new Homey.FlowCardTriggerDevice( 'snow_changed' );
        this.snowTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();

        this.temperatureTrigger = new Homey.FlowCardTriggerDevice( 'temperature_feelsLike_forecast_changed' );
        this.temperatureTrigger
            .registerRunListener( ( args, state ) =>
            {
                console.log( args );
                console.log( state );

                // If true, this flow should run
                return Promise.resolve( args.day === state.day );
            } )
            .register();
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
            .then( this.log )
            .catch( this.error )
    }

    async triggerWindAngle( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering wind angle changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_wind_angle': Value }
        let state = { 'day': Day }

        this.windAngleTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerGustStrength( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering gust strength changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_gust_strength': Value }
        let state = { 'day': Day }

        this.gustStrengthTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerHumidity( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering humidity changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_humidity': Value }
        let state = { 'day': Day }

        this.humidityTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerUltraviolet( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering ultraviolet changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_ultraviolet': Value }
        let state = { 'day': Day }

        this.ultraVioletTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerTempMax( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering max temp changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_temperature.max': Value }
        let state = { 'day': Day }

        this.tempMaxTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerTempMin( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering min temp changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_temperature.min': Value }
        let state = { 'day': Day }

        this.tempMinTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerCloudCover( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering cloud cover changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_cloud_cover': Value }
        let state = { 'day': Day }

        this.cloudCoverTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerPrecipitationType( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering precipitation type changed for: ", Day, " with: ", Value );
        let tokens = { 'precipitation_type': Value }
        let state = { 'day': Day }

        this.precipitationTypeTrigger.trigger(  Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerThunder( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering thunder changed for: ", Day, " with: ", Value );
        let tokens = { 'thunder_category': Value }
        let state = { 'day': Day }

        this.thunderCatTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerRainChance( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering precipitation chance changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_precipitation_chance': Value }
        let state = { 'day': Day }

        this.precipitationTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerSnow( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering snow changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_snow': Value }
        let state = { 'day': Day }

        this.snowTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }

    async triggerTemperature( Device, Day, Value )
    {
        // trigger the card
        this.log( "Triggering feels like changed for: ", Day, " with: ", Value );
        let tokens = { 'measure_temperature.feelsLike.forecast': Value }
        let state = { 'day': Day }

        this.temperatureTrigger.trigger( Device, tokens, state )
            .then( this.log )
            .catch( this.error )
    }
}

module.exports = ForecastDriver;