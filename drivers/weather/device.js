'use strict';

const Homey = require( 'homey' );
const https = require("https");

class WeatherDevice extends Homey.Device
{

    onInit()
    {
		this.log( ' WeatherDevice has been inited' );
		this.refreshCapabilities = this.refreshCapabilities.bind( this );
		this.timerID = setTimeout( this.refreshCapabilities, 1000 );
	}
	
	async refreshCapabilities()
	{
		try
		{
			let result = await this.getWeather();
			if (result)
			{
				let weatherData = JSON.parse(result.body);
				let currentData = weatherData.observations[0];
				this.log( "currentData = " + JSON.stringify( currentData ));
				this.setCapabilityValue("measure_wind_angle", currentData.winddir);
				this.setCapabilityValue("measure_wind_strength", currentData.metric.windSpeed);
				this.setCapabilityValue("measure_gust_strength", currentData.metric.windGust);
				this.setCapabilityValue("measure_humidity", currentData.humidity);
				this.setCapabilityValue("measure_temperature", currentData.metric.temp);
				this.setCapabilityValue("measure_temperature.feelsLike", currentData.metric.heatIndex);
				this.setCapabilityValue("measure_temperature.windchill", currentData.metric.windChill);
				this.setCapabilityValue("measure_temperature.dewPoint", currentData.metric.dewpt);
				this.setCapabilityValue("measure_rain", currentData.metric.precipRate);
				this.setCapabilityValue("measure_rain.total", currentData.metric.precipTotal);
				this.setCapabilityValue("measure_pressure", currentData.metric.pressure);
			}
		}
        catch ( err )
        {
            this.log( "Refresh Error: " + err );
        }
		this.timerID = setTimeout( this.refreshCapabilities, 60000 );
}

    async getWeather()
    {
		let settings = this.getSettings();
		let url = "https://api.weather.com/v2/pws/observations/current?stationId=" + settings.stationID + "&format=json&units=m&apiKey=" + settings.apiKey;
        this.log( url );

        return new Promise( ( resolve, reject ) =>
        {
            try
            {
                https.get( url, ( res ) =>
                {
                    if ( res.statusCode === 200 )
                    {
                        let body = [];
                        res.on( 'data', ( chunk ) =>
                        {
                            this.log( "retrieve data" );
                            body.push( chunk );
                        } );
                        res.on( 'end', () =>
                        {
                            this.log( "Done retrieval of data" );
                            resolve(
                            {
                                "body": Buffer.concat( body )
                            } );
                        } );
                    }
                    else
                    {
                        this.log( "HTTPS Error: " + res.statusCode );
                        reject( null );
                    }
                } ).on( 'error', ( err ) =>
                {
                    this.log( err );
                    reject( null );
                } );
            }
            catch ( e )
            {
				this.log( e );
                reject( null );
            }
        } );
    }
	
	async onDeleted()
	{
		clearTimeout( this.timerID );
	}
}

module.exports = WeatherDevice;