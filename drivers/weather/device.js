'use strict';

const Homey = require( 'homey' );

class WeatherDevice extends Homey.Device
{

    onInit()
    {
        this.log( ' WeatherDevice has been inited' );
        if ( !this.hasCapability( "measure_ultraviolet" ) )
        {
            this.addCapability( "measure_ultraviolet" );
        }

        if ( !this.hasCapability( "measure_radiation" ) )
        {
            this.addCapability( "measure_radiation" );
        }

        this.refreshCapabilities = this.refreshCapabilities.bind( this );
        this.timerID = setTimeout( this.refreshCapabilities, 1000 );
    }

    async refreshCapabilities()
    {
        try
        {
            this.unsetWarning();
            let result = await this.getWeather();
            if ( result )
            {
                let weatherData = JSON.parse( result.body );
                let currentData = weatherData.observations[ 0 ];

                //new Homey.FlowCardTriggerDevice( 'feelLike_changed' ).register().trigger( this, { 'temperature': currentData.metric.heatIndex } ).catch(error => { this.error(error); });
    
                //				this.log( "currentData = " + JSON.stringify( currentData ));
                this.setCapabilityValue( "measure_wind_angle", currentData.winddir );
                this.setCapabilityValue( "measure_wind_strength", currentData.metric.windSpeed );
                this.setCapabilityValue( "measure_gust_strength", currentData.metric.windGust );
                this.setCapabilityValue( "measure_humidity", currentData.humidity );
                this.setCapabilityValue( "measure_temperature", currentData.metric.temp );
                this.setCapabilityValue( "measure_temperature.feelsLike", currentData.metric.heatIndex );
                this.setCapabilityValue( "measure_temperature.windchill", currentData.metric.windChill );
                this.setCapabilityValue( "measure_temperature.dewPoint", currentData.metric.dewpt );
                this.setCapabilityValue( "measure_rain", currentData.metric.precipRate );
                this.setCapabilityValue( "measure_rain.total", currentData.metric.precipTotal );
                this.setCapabilityValue( "measure_pressure", currentData.metric.pressure );
                this.setCapabilityValue( "measure_ultraviolet", currentData.uv );
                if ( this.hasCapability( "measure_radiation" ) )
                {
                    this.setCapabilityValue( "measure_radiation", currentData.solarRadiation );
                }
                this.setAvailable();
            }
        }
        catch ( err )
        {
            this.log( "Weather Refresh Error: " + err );
            this.setWarning( "Error: " + err, null );
        }
        this.timerID = setTimeout( this.refreshCapabilities, 60000 );
    }

    async getWeather()
    {
        let settings = this.getSettings();
        let url = "https://api.weather.com/v2/pws/observations/current?numericPrecision=decimal&stationId=" + settings.stationID + "&format=json&units=m&apiKey=" + settings.apiKey;
        return await Homey.app.GetURL( url );
    }

    async onDeleted()
    {
        clearTimeout( this.timerID );
    }
}

module.exports = WeatherDevice;