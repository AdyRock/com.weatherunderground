/*jslint node: true */
'use strict';

const Homey = require('homey');

class WeatherDriver extends Homey.Driver
{

    onInit()
    {
        this.log( 'WeatherDriver has been init' );

        this.feelLikeTrigger = this.homey.flow.getDeviceTriggerCard( 'measure_temperature_feelsLike_changed' );
        this.dewPointTrigger = this.homey.flow.getDeviceTriggerCard( 'measure_temperature_dewPoint_changed' );
        this.rainTotalTrigger = this.homey.flow.getDeviceTriggerCard( 'measure_rain_total_changed' );
        this.radiationTrigger = this.homey.flow.getDeviceTriggerCard( 'measure_radiation_changed' );
    }

    async onPair( session )
    {
        session.setHandler( 'validate', async( settings ) =>
        {
            this.log( 'onPair validate called: ' + settings );
            return await this.homey.app.getPlaceID( settings, null );
        } );
    }

    async triggerFeelLike( Device, Value )
    {
        // trigger the card
        this.homey.app.updateLog( "Triggering Feels Like changed with: " + Value );
        let tokens = { 'feelsLike': Value };
        let state = {};

        this.feelLikeTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger feelsLike" ) )
            .catch( this.error );
    }


    async triggerDewPoint( Device, Value )
    {
        // trigger the card
        this.homey.app.updateLog( "Triggering Dew Point like changed with: " + Value );
        let tokens = { 'dewPoint': Value };
        let state = {};

        this.dewPointTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger dewPoint" ) )
            .catch( this.error );
    }

    async triggerRainTotal( Device, Value )
    {
        // trigger the card
        this.homey.app.updateLog( "Triggering Rain Total changed with: " + Value );
        let tokens = { 'rain_total': Value };
        let state = {};

        this.rainTotalTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger rain_total" ) )
            .catch( this.error );
    }

    async triggerRadiation( Device, Value )
    {
        // trigger the card
        this.homey.app.updateLog( "Triggering Radiation changed with: " + Value );
        let tokens = { 'radiation': Value };
        let state = {};

        this.radiationTrigger.trigger( Device, tokens, state )
            .then( this.log( "Trigger radiation" ) )
            .catch( this.error );
    }
}

module.exports = WeatherDriver;