/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

class WeatherDriver extends Homey.Driver
{

    onInit()
    {
        this.log( 'WeatherDriver has been init' );

        this.feelLikeTrigger = new Homey.FlowCardTriggerDevice( 'measure_temperature_feelsLike_changed' )
            .register();

        this.dewPointTrigger = new Homey.FlowCardTriggerDevice( 'measure_temperature_dewPoint_changed' )
            .register();

        this.rainTotalTrigger = new Homey.FlowCardTriggerDevice( 'measure_rain_total_changed' )
            .register();

        this.radiationTrigger = new Homey.FlowCardTriggerDevice( 'measure_radiation_changed' )
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
                this.log( 'onPair placeID = ' + err );
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

    async triggerFeelLike( Device, Value )
    {
        // trigger the card
        Homey.app.updateLog( "Triggering Feels Like changed with: " + Value );
        let tokens = { 'feelsLike': Value };
        let state = {};

        this.feelLikeTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger feelsLike" ) )
            .catch( this.error );
    }


    async triggerDewPoint( Device, Value )
    {
        // trigger the card
        Homey.app.updateLog( "Triggering Dew Point like changed with: " + Value );
        let tokens = { 'dewPoint': Value };
        let state = {};

        this.dewPointTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger dewPoint" ) )
            .catch( this.error );
    }

    async triggerRainTotal( Device, Value )
    {
        // trigger the card
        Homey.app.updateLog( "Triggering Rain Total changed with: " + Value );
        let tokens = { 'rain_total': Value };
        let state = {};

        this.rainTotalTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger rain_total" ) )
            .catch( this.error );
    }

    async triggerRadiation( Device, Value )
    {
        // trigger the card
        Homey.app.updateLog( "Triggering Radiation changed with: " + Value );
        let tokens = { 'radiation': Value };
        let state = {};

        this.radiationTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger radiation" ) )
            .catch( this.error );
    }
}

module.exports = WeatherDriver;