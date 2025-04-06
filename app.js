/*jslint node: true */
'use strict';
if ( process.env.DEBUG === '1' )
{
//    require( 'inspector' ).open( 9222, '0.0.0.0', true );
}

const Homey = require( 'homey' );
const https = require( "https" );
const nodemailer = require( 'nodemailer' );

class WeatherApp extends Homey.App
{
    async onInit()
    {
        this.log( ' WeatherApp is running...' );
		this.numAPIcalls = this.homey.settings.get( 'numAPIcalls' );
		if ( !this.numAPIcalls )
		{
			this.numAPIcalls = 0;
		}

		// Set a timer to reset the number of API calls to zero at midnight
		let now = new Date();
		let midnight = new Date( now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0 );
		let timeToMidnight = midnight - now;
		this.homey.setTimeout( () =>
		{
			this.resetAPICounter();
		}, timeToMidnight );

        try
        {
            // Try to get the local IP address to see if the app is running in Homey cloud so we don't update the logs
            await this.homey.cloud.getLocalAddress();
            this.cloudOnly = false;
        }
        catch ( err )
        {
            // getLocalAddress will fail on Homey cloud installations so dissbale the loging options
            this.cloudOnly = true;
            this.homey.settings.set( 'logEnabled', true );
            this.log( "Logging Enabled" );
        }

        this.homey.settings.set( 'diagLog', "App Started\r\n" );
        this.stationOffline = false;

        this.NumStations = this.homey.settings.get( 'NumStations' );
        if ( !this.NumStations )
        {
            this.NumStations = 0;
            this.homey.settings.set( 'NumStations', this.NumStations );
        }

        this.SpeedUnits = this.homey.settings.get( 'SpeedUnits' );
        if ( (this.SpeedUnits === null) || (this.SpeedUnits === 0) )
        {
            this.SpeedUnits = '0';
            this.homey.settings.set( 'SpeedUnits', this.SpeedUnits );
        }

        this.homey.settings.on( 'set', ( setting ) =>
        {
            if ( setting === 'NumStations' )
            {
                this.NumStations = this.homey.settings.get( 'NumStations' );
            }
            if ( setting === 'SpeedUnits' )
            {
                this.SpeedUnits = this.homey.settings.get( 'SpeedUnits' );
                this.changeUnits( 'SpeedUnits' );
            }
        } );

        this.cloudCoverEqualCondition = this.homey.flow.getConditionCard( 'cloud_cover_equal' );
        this.cloudCoverEqualCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.oldForecastData.daypart[ 0 ].cloudCover[ day.dayNight ] == args.value;
            } );

        this.cloudCoverGreaterCondition = this.homey.flow.getConditionCard( 'cloud_cover_greater' );
        this.cloudCoverGreaterCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.oldForecastData.daypart[ 0 ].cloudCover[ day.dayNight ] > args.value;
            } );

        this.gustStrengthEqualCondition = this.homey.flow.getConditionCard( 'gust_strength_equal' );
        this.gustStrengthEqualCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.daypart[ 0 ].windSpeed[ day.dayNight ] == args.value;
            } );

        this.gustStrengthGreaterCondition = this.homey.flow.getConditionCard( 'gust_strength_greater' );
        this.gustStrengthGreaterCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.daypart[ 0 ].windSpeed[ day.dayNight ] > args.value;
            } );

        this.humidityEqualCondition = this.homey.flow.getConditionCard( 'humidity_equal' );
        this.humidityEqualCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.daypart[ 0 ].relativeHumidity[ day.dayNight ] == args.value;
            } );

        this.humidityGreaterCondition = this.homey.flow.getConditionCard( 'humidity_greater' );
        this.humidityGreaterCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.daypart[ 0 ].relativeHumidity[ day.dayNight ] > args.value;
            } );

        this.precipitationChanceEqualCondition = this.homey.flow.getConditionCard( 'precipitation_chance_equal' );
        this.precipitationChanceEqualCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.daypart[ 0 ].precipChance[ day.dayNight ] == args.value;
            } );

        this.precipitationChanceGreaterCondition = this.homey.flow.getConditionCard( 'precipitation_chance_greater' );
        this.precipitationChanceGreaterCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.daypart[ 0 ].precipChance[ day.dayNight ] > args.value;
            } );

        this.rainEqualCondition = this.homey.flow.getConditionCard( 'rain_equal' );
        this.rainEqualCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.qpf[ day.day ] == args.value;
            } );

        this.rainGreaterCondition = this.homey.flow.getConditionCard( 'rain_greater' );
        this.rainGreaterCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.qpf[ day.day ] > args.value;
            } );

        let measure_hours_since_rained_is_lessCondition = this.homey.flow.getConditionCard( 'measure_hours_since_rained_is_less' );
        measure_hours_since_rained_is_lessCondition.registerRunListener( async ( args, state ) =>
        {
            let value = args.device.getCapabilityValue( 'measure_hours_since_rained' );
            return value < args.value;
        } );

        let measure_hours_since_rained_is_equalCondition = this.homey.flow.getConditionCard( 'measure_hours_since_rained_is_equal' );
        measure_hours_since_rained_is_equalCondition.registerRunListener( async ( args, state ) =>
        {
            let value = args.device.getCapabilityValue( 'measure_hours_since_rained' );
            return value === args.value;
        } );

        this.snowEqualCondition = this.homey.flow.getConditionCard( 'snow_equal' );
        this.snowEqualCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.qpfSnow[ day.day ] == args.value;
            } );

        this.snowGreaterCondition = this.homey.flow.getConditionCard( 'snow_greater' );
        this.snowGreaterCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.qpfSnow[ day.day ] > args.value;
            } );

        this.temperatureFeelsLikeEqualCondition = this.homey.flow.getConditionCard( 'temperature_feelsLike_equal' );
        this.temperatureFeelsLikeEqualCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.daypart[ 0 ].temperature[ day.dayNight ] == args.value;
            } );

        this.temperatureFeelsLikeGreaterCondition = this.homey.flow.getConditionCard( 'temperature_feelsLike_greater' );
        this.temperatureFeelsLikeGreaterCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.daypart[ 0 ].temperature[ day.dayNight ] > args.value;
            } );

        this.temperatureMaxEqualCondition = this.homey.flow.getConditionCard( 'temperature_max_equal' );
        this.temperatureMaxEqualCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.temperatureMax[ day.day ] == args.value;
            } );

        this.temperatureMaxGreaterCondition = this.homey.flow.getConditionCard( 'temperature_max_greater' );
        this.temperatureMaxGreaterCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.temperatureMax[ day.day ] > args.value;
            } );

        this.temperatureMinEqualCondition = this.homey.flow.getConditionCard( 'temperature_min_equal' );
        this.temperatureMinEqualCondition
            .registerRunListener( async ( args, state ) =>
            {
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.temperatureMin[ day.day ] == args.value;
            } );

        this.temperatureMinGreaterCondition = this.homey.flow.getConditionCard( 'temperature_min_greater' );
        this.temperatureMinGreaterCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.temperatureMin[ day.day ] > args.value;
            } );

        this.ultravioletEqualCondition = this.homey.flow.getConditionCard( 'ultraviolet_equal' );
        this.ultravioletEqualCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.daypart[ 0 ].uvIndex[ day.dayNight ] == args.value;
            } );

        this.ultravioletGreaterCondition = this.homey.flow.getConditionCard( 'ultraviolet_greater' );
        this.ultravioletGreaterCondition
            .registerRunListener( async ( args, state ) =>
            {
                if ( !args.device.forecastData )
                {
                    throw new Error( "Forcast not available yet" );
                }
                const day = args.device.getDayNight( args.day );
                return args.device.forecastData.daypart[ 0 ].uvIndex[ day.dayNight ] > args.value;
            } );

        this.noDataTrigger = this.homey.flow.getTriggerCard( 'no_data_changed' );
        this.dataResumedTrigger = this.homey.flow.getTriggerCard( 'data_resumed_changed' );

		const widget1 = this.homey.dashboards.getWidget('forecast');
		widget1.registerSettingAutocompleteListener('devices', async (query, settings) => {
			const devices = await this.getAppForecastDevices({});
			return devices;
		});

		const widget2 = this.homey.dashboards.getWidget('weather');
		widget2.registerSettingAutocompleteListener('devices', async (query, settings) =>
		{
			const devices = await this.getAppForecastDevices({});
			return devices;
		});

	}

	resetAPICounter()
	{
		this.numAPIcalls = 0;
		this.homey.settings.set( 'numAPIcalls', this.numAPIcalls );
		let now = new Date();
		let midnight = new Date( now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0 );
		let timeToMidnight = midnight - now;
		this.homey.setTimeout( () =>
		{
			this.resetAPICounter();
		}, timeToMidnight );
	}

    async changeUnits( Units )
    {
        let promises = [];

        const drivers = this.homey.drivers.getDrivers();
        for ( const driver in drivers )
        {
            let devices = this.homey.drivers.getDriver( driver ).getDevices();
            let numDevices = devices.length;
            for ( var i = 0; i < numDevices; i++ )
            {
                let device = devices[ i ];
                if ( device.unitsChanged )
                {
                    promises.push( device.unitsChanged( Units ) );
                }
            }
        }

        // Wait for all the checks to complete
        await Promise.allSettled( promises );
    }

    async getPlaceID( newSettings, oldSettings )
    {
        let placeID = newSettings.placeID;
        let oldStationID = newSettings.oldStationID;
        if ( oldSettings )
        {
            oldStationID = oldSettings.stationID;
        }

        if ( !placeID || ( oldStationID != newSettings.stationID ) )
        {
            let url = "https://api.weather.com/v3/location/search?query=" + newSettings.stationID + "&locationType=pws&language=en-US&format=json&apiKey=" + newSettings.apiKey;
            let searchResult = await this.GetURL( url );
            if ( searchResult )
            {
                let searchData = JSON.parse( searchResult.body );
                this.homey.app.updateLog( JSON.stringify( searchData, null, 2 ) );
                placeID = searchData.location.placeId[ 0 ];
            }
            else
            {
                return null;
            }
        }

        return placeID;
    }

    async GetURL( url )
    {
		this.numAPIcalls++;
        this.updateLog( `API calls ${this.numAPIcalls}: ${url}` );
		this.homey.settings.set( 'numAPIcalls', this.numAPIcalls );

        return new Promise( ( resolve, reject ) =>
        {
            try
            {
                https.get( url, ( res ) =>
                {
                    let body = [];

                    res.on( 'data', ( chunk ) =>
                    {
                        this.updateLog( "retrieve data" );
                        body.push( chunk );
                    } );

                    res.on( 'end', () =>
                    {
                        this.updateLog( "Done retrieval of data" );
                        if ( res.statusCode === 200 )
                        {
                            resolve(
                            {
                                "body": Buffer.concat( body )
                            } );
                        }
                        else
                        {
                            this.updateLog( "HTTPS Error: " + res.statusCode, true );
                            let message = "";
                            if ( res.statusCode === 204 )
                            {
                                message = "No Data Found";
                            }
                            else if ( res.statusCode === 400 )
                            {
                                message = "Bad request";
                            }
                            else if ( res.statusCode === 401 )
                            {
                                message = "Unauthorized";
                            }
                            else if ( res.statusCode === 403 )
                            {
                                message = "Forbidden";
                            }
                            else if ( res.statusCode === 404 )
                            {
                                message = "Not Found";
                            }
                            reject( "GetURL Error: " + res.statusCode + ", " + message );
                        }
                    } );
                } ).on( 'error', ( err ) =>
                {
                    let errMessage = null;
                    if ( err.message )
                    {
                        errMessage = err.message;
                    }
                    else if ( err.data )
                    {
                        if ( err.data.message )
                        {
                            errMessage = err.data.message;
                        }
                    }

                    if ( !errMessage )
                    {
                        errMessage = err.toString();
                    }

                    this.updateLog( "GetURL On Error: " + this.varToString( err ), true );
                    reject( "GetURL On Error: " + errMessage );
                } );
            }
            catch ( e )
            {
                this.updateLog( "GetURL Catch: " + this.varToString( e ), true );
                reject( e );
            }
        } );
    }

    varToString( source, includeStack = true )
    {
        try
        {
            if ( source === null )
            {
                return "null";
            }
            if ( source === undefined )
            {
                return "undefined";
            }
            if ( source instanceof Error )
            {
                if ( includeStack )
                {
                    let stack = source.stack.replace( '/\\n/g', '\n' );
                    return source.message + '\n' + stack;
                }
                return source.message;
            }
            if ( typeof( source ) === "object" )
            {
                return JSON.stringify( source, null, 2 );
            }
            if ( typeof( source ) === "string" )
            {
                return source;
            }

            return source.toString();
        }
        catch ( error )
        {
            this.log( "Error decoding message to a string", source );
            return "Error decoding message to a string";
        }
    }

    updateLog( newMessage, isError = false )
    {
        // Maximum size of the log in characters
        let maxSize = 30000;
        if ( !this.homey.settings.get( 'logEnabled' ) )
        {
            if ( !isError )
            {
                return;
            }

            // Reduce the size if only logging errors
            maxSize = 5000;
        }

        this.log( newMessage );

        //Remove the API key from the output
        let apiKeyIndex = newMessage.indexOf( "apiKey=" );
        if ( apiKeyIndex > 0 )
        {
            newMessage = newMessage.substring( 0, apiKeyIndex + 7 );
        }

        var oldText = this.homey.settings.get( 'diagLog' );
        if ( oldText.length > maxSize )
        {
            // Remove characters from the beginning to make space for the new message.
            oldText = oldText.substring( newMessage.length + 20 );
            var n = oldText.indexOf( "\n" );
            if ( n >= 0 )
            {
                // Remove up to and including the first \n so the log starts on a whole line
                oldText = oldText.substring( n + 1 );
            }
        }

        const nowTime = new Date( Date.now() );

        if ( oldText.length == 0 )
        {
            oldText = "Log ID: ";
            oldText += nowTime.toJSON();
            oldText += "\r\n";
            oldText += "App version ";
            oldText += Homey.manifest.version;
            oldText += "\r\n\r\n";
            this.logLastTime = nowTime;
        }

        oldText += nowTime.toJSON();
        oldText += "\r\n  ";

        oldText += "* ";
        oldText += newMessage;
        oldText += "\r\n\r\n";
        this.homey.settings.set( 'diagLog', oldText );
    }

    // Send the log to the developer (not applicable to Homey cloud)
    async sendLog( body )
    {
        let tries = 5;

        let logData;
        if ( body.logType === 'diag' )
        {
            logData = this.homey.settings.get( 'diagLog' );;
        }

        while ( tries-- > 0 )
        {
            try
            {
                // create reusable transporter object using the default SMTP transport
                const transporter = nodemailer.createTransport(
                {
                    host: Homey.env.MAIL_HOST, // Homey.env.MAIL_HOST,
                    port: 465,
                    ignoreTLS: false,
                    secure: true, // true for 465, false for other ports
                    auth:
                    {
                        user: Homey.env.MAIL_USER, // generated ethereal user
                        pass: Homey.env.MAIL_SECRET, // generated ethereal password
                    },
                    tls:
                    {
                        // do not fail on invalid certs
                        rejectUnauthorized: false,
                    },
                }, );

                // send mail with defined transport object
                const info = await transporter.sendMail(
                {
                    from: `"Homey User" <${Homey.env.MAIL_USER}>`, // sender address
                    to: Homey.env.MAIL_RECIPIENT, // list of receivers
                    subject: `Weather Underground ${body.logType} log`, // Subject line
                    text: logData, // plain text body
                }, );

                this.updateLog( `Message sent: ${info.messageId}` );
                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

                // Preview only available when sending through an Ethereal account
                this.log( 'Preview URL: ', nodemailer.getTestMessageUrl( info ) );
                return this.homey.__( 'settings.logSent' );
            }
            catch ( err )
            {
                this.updateLog( `Send log error: ${err.message}`, 0 );
            }
        }

        return ( this.homey.__( 'settings.logSendFailed' ) );
    }

	getWidgetForecast( deviceId, day )
	{
		// find a Forecast driver / device for the given deviceId
		let devices = this.homey.drivers.getDriver('forecast').getDevices();
		let numDevices = devices.length;
		for (var i = 0; i < numDevices; i++)
		{
			let device = devices[i];
			if (device.getWidgetForecast)
			{
				const forecast = device.getWidgetForecast(deviceId, day);
				return forecast;
			}
		}

		return null;
	}

	getWidget5DayWeather(deviceId)
	{
		// find a Forecast driver / device for the given deviceId
		let devices = this.homey.drivers.getDriver('forecast').getDevices();
		let numDevices = devices.length;
		for (var i = 0; i < numDevices; i++)
		{
			let device = devices[i];
			if (device.getWidget5DayWeather)
			{
				const forecast = device.getWidget5DayWeather(deviceId);
				return forecast;
			}
		}

		return null;
	}

	async getAppForecastDevices()
	{
		// find a Forecast driver / device
		const forecastDevices = [];
		const drivers = this.homey.drivers.getDrivers();
		for (const driver in drivers)
		{
			let devices = this.homey.drivers.getDriver(driver).getDevices();
			let numDevices = devices.length;
			for (var i = 0; i < numDevices; i++)
			{
				let device = devices[i];
				if (device.getWidgetForecast)
				{
					forecastDevices.push(device);
				}
			}
		}
		return forecastDevices;
	}

}

module.exports = WeatherApp;