/*jslint node: true */
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

const Sector = {
    'en': ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'],
    'nl': ['N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO', 'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW', 'N'],
    'fr': ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'OOO', 'NO', 'NNO', 'N']
};

class ForecastDevice extends Homey.Device
{
    async onInit()
    {
        this.log( 'ForecastDevice has been initialised' );
        
        this.upgradeCapabilities();

        this.registerCapabilityListener( 'forecast_day', async ( Day ) =>
        {
            return this.updateCapabilities( Day );
        });

        this.registerCapabilityListener('button.send_log', this.onCapabilitySendLog.bind(this));

        if ( !this.getCapabilityValue( 'forecast_day' ) )
        {
            this.setCapabilityValue( 'forecast_day', "today" ).catch(this.error);
        }
        
        if (!this.hasCapability('measure_wind_direction'))
        {
            this.addCapability('measure_wind_direction');
        }

		this.forecastData = this.getSettings().forecastData;
		let nextUpdate = 1000;
		if (this.forecastData && this.forecastData.time)
		{
			// Make sure the forecast is updated 1 hour after the time saved in the forecast data
			this.homey.clearTimeout(this.timerID);
			let now = new Date().getTime();
			nextUpdate = this.forecastData.time + 3600000 - now;
			if (nextUpdate < 0) {
				nextUpdate = 1000;
			}
		}

		this.timerID = this.homey.setTimeout(() => {
			this.refreshCapabilities();
		}, nextUpdate);
    }

    upgradeCapabilities()
    {
        if ( !this.hasCapability( 'button.send_log' ) )
        {
            this.addCapability( 'button.send_log' );
        }

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
            this.addCapability( "forecast_gust_strength" );
            this.removeCapability( "measure_wind_strength" );
        }

        if ( this.hasCapability( "measure_gust_strength.forecast" ) )
        {
            this.addCapability( "forecast_gust_strength" );
            this.removeCapability( "measure_gust_strength.forecast" );
        }

        if ( this.hasCapability( "measure_rain" ) )
        {
            this.addCapability( "forecast_rain" );
            this.removeCapability( "measure_rain" );
        }

        if ( this.hasCapability( "measure_rain.forecast" ) )
        {
            this.addCapability( "forecast_rain" );
            this.removeCapability( "measure_rain.forecast" );
        }

        if ( this.hasCapability( "measure_wind_angle" ) )
        {
            this.addCapability( "forecast_wind_angle" );
            this.removeCapability( "measure_wind_angle" );
        }

        if ( this.hasCapability( "measure_wind_angle.forecast" ) )
        {
            this.addCapability( "forecast_wind_angle" );
            this.removeCapability( "measure_wind_angle.forecast" );
        }

        if ( this.hasCapability( "measure_gust_strength" ) )
        {
            this.addCapability( "forecast_gust_strength" );
            this.removeCapability( "measure_gust_strength" );
        }

        if ( this.hasCapability( "measure_gust_strength.forecast" ) )
        {
            this.addCapability( "forecast_gust_strength" );
            this.removeCapability( "measure_gust_strength.forecast" );
        }

        if ( this.hasCapability( "measure_humidity" ) )
        {
            this.addCapability( "forecast_humidity" );
            this.removeCapability( "measure_humidity" );
        }

        if ( this.hasCapability( "measure_humidity.forecast" ) )
        {
            this.addCapability( "forecast_humidity" );
            this.removeCapability( "measure_humidity.forecast" );
        }

        if ( this.hasCapability( "measure_ultraviolet" ) )
        {
            this.addCapability( "forecast_ultraviolet" );
            this.removeCapability( "measure_ultraviolet" );
        }

        if ( this.hasCapability( "measure_ultraviolet.forecast" ) )
        {
            this.addCapability( "forecast_ultraviolet" );
            this.removeCapability( "measure_ultraviolet.forecast" );
        }

        if ( this.hasCapability( "measure_temperature.max" ) )
        {
            this.addCapability( "forecast_temperature.max" );
            this.removeCapability( "measure_temperature.max" );
        }

        if ( this.hasCapability( "measure_temperature.min" ) )
        {
            this.addCapability( "forecast_temperature.min" );
            this.removeCapability( "measure_temperature.min" );
        }

        if ( this.hasCapability( "thunder_category" ) )
        {
            this.removeCapability( "thunder_category" );
        }

        if ( this.hasCapability( "measure_temperature" ) )
        {
            this.removeCapability( "measure_temperature" );
        }

        if ( !this.hasCapability( "forecast_temperature" ) )
        {
            this.addCapability( "forecast_temperature" );
        }

        if ( this.hasCapability( "measure_temperature.windchill" ) )
        {
            this.removeCapability( "measure_temperature.windchill" );
        }

        if ( this.hasCapability( "measure_temperature.feelsLike.forecast" ) )
        {
            this.removeCapability( "measure_temperature.feelsLike.forecast" );
        }

        if ( !this.hasCapability( "measure_temperature.feelsLike_forecast" ) )
        {
            this.addCapability( "forecast_temperature.feelsLike" );
        }

        if ( this.hasCapability( "measure_temperature.feelsLike" ) )
        {
            this.removeCapability( "measure_temperature.feelsLike" );
        }

        if ( this.hasCapability( "measure_snow" ) )
        {
            this.addCapability( "forecast_snow" );
            this.removeCapability( "measure_snow" );
        }

        if ( this.hasCapability( "measure_precipitation_chance" ) )
        {
            this.addCapability( "forecast_precipitation_chance" );
            this.removeCapability( "measure_precipitation_chance" );
        }

        if ( this.hasCapability( "measure_cloud_cover" ) )
        {
            this.addCapability( "forecast_cloud_cover" );
            this.removeCapability( "measure_cloud_cover" );
        }
    }

    async onSettings( { oldSettings, newSettings, changedKeys } )
    {
        // run when the user has changed the device's settings in Homey.
        // changedKeys contains an array of keys that have been changed

        // if the settings must not be saved for whatever reason:
        // throw new Error('Your error message');
        this.log( "onSettings called" );

        let placeID = await this.homey.app.getPlaceID( newSettings, oldSettings );
        if ( !placeID )
        {
            throw new Error( this.homey.__( "stationNotFound" ) );
        }

        setImmediate( () =>
        {
			this.unitsChanged('SpeedUnits');
        } );
    }

    async unitsChanged( Units )
    {
        if ( Units === 'SpeedUnits' )
        {
            let unitsText = '';
            
            switch (this.homey.app.SpeedUnits)
            {
                case '0':
                    unitsText = this.homey.__('speedUnits.km');
                    break;
                case '1':
                    unitsText = this.homey.__('speedUnits.m');
                    break;
                case '2':
                    unitsText = this.homey.__('speedUnits.mph');
                    break;
				case '3':
					unitsText = this.homey.__('speedUnits.knots');
					break;
				default:
                    unitsText = this.homey.__('speedUnits.km');
                    break;
            }

			this.setCapabilityOptions( 'forecast_gust_strength', { "units": unitsText } ).catch(this.error);
			setImmediate( () =>
			{
				this.updateCapabilities( null );
			} );
        }
    }

    async updateCapabilities( SelectedDay )
    {
		if ( SelectedDay == null )
		{
			SelectedDay = this.getCapabilityValue( 'forecast_day' );
		}

        try
        {
            if ( this.forecastData )
            {
                // Update the capabilities for the selected day

                this.setAvailable().catch(this.error);
                this.unsetWarning().catch(this.error);

                if ( this.homey.app.stationOffline )
                {
                    this.homey.app.stationOffline = false;
                    this.homey.app.dataResumedTrigger.trigger().catch(this.error);
                }

                const entry = forecast_dayToNum.find( x => x.id == SelectedDay );
                let dayNight = entry.value;
                let day = entry.day;
                if ( day < 0 )
                {
                    day = -1 - day;
                }
                this.log( "day = ", day, " Day/Night = ", dayNight );

                // Whole day parts
                this.setCapabilityValue( "forecast_active_day", this.forecastData.dayOfWeek[ day ] ).catch(this.error);
                this.setCapabilityValue( "forecast_moonPhase", this.forecastData.moonPhase[ day ] ).catch(this.error);
                this.setCapabilityValue( "forecast_rain", this.forecastData.qpf[ day ] ).catch(this.error);
                this.setCapabilityValue( "forecast_snow", this.forecastData.qpfSnow[ day ] ).catch(this.error);
                this.setCapabilityValue( "forecast_temperature.max", this.forecastData.temperatureMax[ day ] ).catch(this.error);
                this.setCapabilityValue( "forecast_temperature.min", this.forecastData.temperatureMin[ day ] ).catch(this.error);

                // Day / Night parts
                if ( this.forecastData.daypart[ 0 ].daypartName[ dayNight ] == null )
                {
                    dayNight++;
                }
                this.setCapabilityValue( "forecast_text", this.forecastData.daypart[ 0 ].daypartName[ dayNight ] ).catch(this.error);
                this.setCapabilityValue( "forecast_summary", this.forecastData.daypart[ 0 ].wxPhraseLong[ dayNight ] ).catch(this.error);
                this.setCapabilityValue( "forecast_cloud_cover", this.forecastData.daypart[ 0 ].cloudCover[ dayNight ] ).catch(this.error);
                this.setCapabilityValue( "forecast_precipitation_chance", this.forecastData.daypart[ 0 ].precipChance[ dayNight ] ).catch(this.error);
                this.setCapabilityValue( "precipitation_type", this.forecastData.daypart[ 0 ].precipType[ dayNight ] ).catch(this.error);
                this.setCapabilityValue( "forecast_wind_angle", this.forecastData.daypart[ 0 ].windDirection[ dayNight ] ).catch(this.error);

                var index = parseInt(this.forecastData.daypart[ 0 ].windDirection[ dayNight ] / 22.5);
                let langCode = this.homey.i18n.getLanguage();
                if ((langCode !== 'en') && (langCode !== 'nl'))
                {
                    langCode = 'en';
                }
                let windDir = Sector[langCode][index];
                this.setCapabilityValue('measure_wind_direction', windDir).catch(this.error);

                if ( this.homey.app.SpeedUnits === '0' )
                {
					// km/h
                    this.setCapabilityValue( "forecast_gust_strength", this.forecastData.daypart[ 0 ].windSpeed[ dayNight ] ).catch(this.error);
                }
                else if (this.homey.app.SpeedUnits === '1' )
                {
					// m/s
                    this.setCapabilityValue( "forecast_gust_strength", this.forecastData.daypart[ 0 ].windSpeed[ dayNight ] * 1000 / 3600 ).catch(this.error);
                }
				else if (this.homey.app.SpeedUnits === '2' )
				{
					// mph
					this.setCapabilityValue( "forecast_gust_strength", this.forecastData.daypart[ 0 ].windSpeed[ dayNight ] * 0.621371 ).catch(this.error);
				}
				else if ( this.homey.app.SpeedUnits === '3' )
				{
					// knots
					this.setCapabilityValue( "forecast_gust_strength", this.forecastData.daypart[ 0 ].windSpeed[ dayNight ] * 0.539957 ).catch(this.error);
				}


                this.setCapabilityValue( "forecast_humidity", this.forecastData.daypart[ 0 ].relativeHumidity[ dayNight ] ).catch(this.error);
                this.setCapabilityValue( "forecast_ultraviolet", this.forecastData.daypart[ 0 ].uvIndex[ dayNight ] ).catch(this.error);
                this.setCapabilityValue( "forecast_temperature", this.forecastData.daypart[ 0 ].temperature[ dayNight ] ).catch(this.error);

                if ( this.forecastData.daypart[ 0 ].temperature[ dayNight ] <= 16.1 )
                {
                    this.setCapabilityValue( "forecast_temperature.feelsLike", this.forecastData.daypart[ 0 ].temperatureWindChill[ dayNight ] ).catch(this.error);
                }
                else if ( this.forecastData.daypart[ 0 ].temperature[ dayNight ] >= 21 )
                {
                    this.setCapabilityValue( "forecast_temperature.feelsLike", this.forecastData.daypart[ 0 ].temperatureHeatIndex[ dayNight ] ).catch(this.error);
                }
                else
                {
                    this.setCapabilityValue( "forecast_temperature.feelsLike", this.forecastData.daypart[ 0 ].temperature[ dayNight ] ).catch(this.error);
                }
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
        let errString = null;

        try
        {
            this.log( "Forecast refreshCapabilities" );

            // refresh the forecast cache
            let result = await this.getForecast( this );
            if ( result )
            {
                this.forecastData = JSON.parse( result.body );
                this.homey.app.updateLog( "Forecast Data = " + JSON.stringify( this.forecastData, null, 2 ) );

                // Update the capabilities for the selected day
                this.updateCapabilities( this.getCapabilityValue( 'forecast_day' ) );

                if ( this.oldForecastData )
                {
                    // Check for changes in each day and trigger flows as required
                    forecast_dayToNum.forEach( ( element ) =>
                    {
                        this.log( "Checking forecast triggers for: ", element.id, "Value: ", element.value, "Day: ", element.day );
                        if ( element.day >= 0 )
                        {
                            if ( this.forecastData.qpf[ element.day ] != this.oldForecastData.qpf[ element.day ] ) { this.driver.triggerRain( this, element.id, this.forecastData.qpf[ element.day ] ); }
                            if ( this.forecastData.qpfSnow[ element.day ] != this.oldForecastData.qpfSnow[ element.day ] ) { this.driver.triggerSnow( this, element.id, this.forecastData.qpfSnow[ element.day ] ); }
                            if ( this.forecastData.temperatureMax[ element.day ] != this.oldForecastData.temperatureMax[ element.day ] ) { this.driver.triggerTempMax( this, element.id, this.forecastData.temperatureMax[ element.day ], this.oldForecastData.temperatureMax[ element.day ] ); }
                            if ( this.forecastData.temperatureMin[ element.day ] != this.oldForecastData.temperatureMin[ element.day ] ) { this.driver.triggerTempMin( this, element.id, this.forecastData.temperatureMin[ element.day ], this.oldForecastData.temperatureMin[ element.day ] ); }
                        }

                        let dayNight = element.value;
                        if ( this.forecastData.daypart[ 0 ].daypartName[ dayNight ] == null )
                        {
                            dayNight++;
                        }
                        if ( this.forecastData.daypart[ 0 ].cloudCover[ dayNight ] != this.oldForecastData.daypart[ 0 ].cloudCover[ dayNight ] ) { this.driver.triggerCloudCover( this, element.id, this.forecastData.daypart[ 0 ].cloudCover[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].precipChance[ dayNight ] != this.oldForecastData.daypart[ 0 ].precipChance[ dayNight ] ) { this.driver.triggerRainChance( this, element.id, this.forecastData.daypart[ 0 ].precipChance[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].precipType[ dayNight ] != this.oldForecastData.daypart[ 0 ].precipType[ dayNight ] ) { this.driver.triggerPrecipitationType( this, element.id, this.forecastData.daypart[ 0 ].precipType[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].windDirection[ dayNight ] != this.oldForecastData.daypart[ 0 ].windDirection[ dayNight ] ) { this.driver.triggerWindAngle( this, element.id, this.forecastData.daypart[ 0 ].windDirection[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].windSpeed[ dayNight ] != this.oldForecastData.daypart[ 0 ].windSpeed[ dayNight ] ) { this.driver.triggerGustStrength( this, element.id, this.forecastData.daypart[ 0 ].windSpeed[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].relativeHumidity[ dayNight ] != this.oldForecastData.daypart[ 0 ].relativeHumidity[ dayNight ] ) { this.driver.triggerHumidity( this, element.id, this.forecastData.daypart[ 0 ].relativeHumidity[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].uvIndex[ dayNight ] != this.oldForecastData.daypart[ 0 ].uvIndex[ dayNight ] ) { this.driver.triggerUltraviolet( this, element.id, this.forecastData.daypart[ 0 ].uvIndex[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].thunderCategory[ dayNight ] != this.oldForecastData.daypart[ 0 ].thunderCategory[ dayNight ] ) { this.driver.triggerThunder( this, element.id, this.forecastData.daypart[ 0 ].thunderCategory[ dayNight ] ); }
                        if ( this.forecastData.daypart[ 0 ].temperature[ dayNight ] != this.oldForecastData.daypart[ 0 ].temperature[ dayNight ] ) { this.driver.triggerTemperature( this, element.id, this.forecastData.daypart[ 0 ].temperature[ dayNight ] ); }
                    } );
                }

                this.forecastData.time = new Date().getTime();
				this.oldForecastData = this.forecastData;
				await this.setSettings( { forecastData: this.forecastData } );

				this.app.homey.api.realtime('updateWidget', deviceId);
            }
            else
            {
                this.setWarning( "No data received" );
            }
        }
        catch ( err )
        {
            errString = this.homey.app.varToString( err, false );
            this.log( "Forecast Refresh Error: " + err );
        }

        try
        {
            if ( errString )
            {
                this.homey.app.updateLog( "Forecast Refresh: " + errString, true );
                this.unsetWarning();

                if ( !this.homey.app.stationOffline && ( errString.search( ": 204" ) > 0 ) )
                {
                    this.homey.app.stationOffline = true;
                    this.homey.app.noDataTrigger.trigger().catch(this.error);
                    this.setUnavailable( "No data available" );
                }
                else
                {
                    this.setUnavailable( errString );
                }
            }
        }
        catch ( error )
        {
            this.homey.app.updateLog( "Forecast Refresh Error Error: " + this.homey.app.varToString( error, false ), true );
        }

        // Refresh forecast 1 per hour
        this.timerID = this.homey.setTimeout( () =>
        {
            this.refreshCapabilities();
        }, 3600000 ); //3600000 ms = 1 hour
    }

    async getForecast()
    {
        let settings = this.getSettings();
        let placeID = await this.homey.app.getPlaceID( settings, null );
        if ( placeID == null )
        {
            return null;
        }
        this.setSettings( { placeID: placeID, oldStationID: settings.stationID } ).catch( this.error );

        let langCode = this.homey.__( "langCode" );
        let url = "https://api.weather.com/v3/wx/forecast/daily/5day?placeid=" + placeID + "&units=m&language=" + langCode + "&format=json&apiKey=" + settings.apiKey;
        return await this.homey.app.GetURL( url );
    }

    getDayNight( SelectedDay )
    {
        const entry = forecast_dayToNum.find( x => x.id == SelectedDay );
        let dayNight = entry.value;
        let day = entry.day;
        if ( day < 0 )
        {
            day = -1 - day;
        }

        if ( this.oldForecastData )
        { // Day / Night parts
            if ( this.forecastData.daypart[ 0 ].daypartName[ dayNight ] == null )
            {
                dayNight++;
            }
        }
        return { 'dayNight': dayNight, 'day': day };
    }

    async onCapabilitySendLog(value)
    {
        const body = {
            notify: true,
            logType: "diag"
        };

        this.homey.app.sendLog(body);
    }

    async onDeleted()
    {
        this.homey.clearTimeout( this.timerID );
    }

	getWidgetForecast(deviceId, forecastDay )
	{
		const data = this.getData();
		if (this.__id != deviceId)
		{
			return null;
		}
		if (this.forecastData)
		{
			const entry = forecast_dayToNum[forecastDay];
			let dayNight = entry.value;
			let day = entry.day;
			if (day < 0)
			{
				day = -1 - day;
			}
			this.log("day = ", day, " Day/Night = ", dayNight);

			// Day / Night parts
			// if (this.forecastData.daypart[0].daypartName[dayNight] == null)
			// {
			// 	dayNight++;
			// }

			const period = [];
			period.push(this.homey.__("widget.today"));
			period.push(this.homey.__("widget.tonight"));
			period.push(this.homey.__("widget.tomorrow"));
			period.push(this.homey.__("widget.tomorrowNight"));

			const forecast = {
				"day_period": period[dayNight],
				"night_period": period[dayNight + 1],
				"active_day": this.forecastData.dayOfWeek[day],
				"icon_day": this.getIconFileName(this.forecastData.daypart[0].iconCode[dayNight]),
				"icon_night": this.getIconFileName(this.forecastData.daypart[0].iconCode[dayNight + 1]),
				"moonPhase": this.forecastData.moonPhase[day],
				"temperature.max": this.forecastData.temperatureMax[day],
				"temperature.min": this.forecastData.temperatureMin[day],
				"day_text": this.forecastData.daypart[0].narrative[dayNight],
				"night_text": this.forecastData.daypart[0].narrative[dayNight + 1],
				"day_cloud_cover": this.forecastData.daypart[0].cloudCover[dayNight],
				"night_cloud_cover": this.forecastData.daypart[0].cloudCover[dayNight + 1],
				"day_precipitation_chance": this.forecastData.daypart[0].precipChance[dayNight],
				"night_precipitation_chance": this.forecastData.daypart[0].precipChance[dayNight + 1],
				"day_precipitation_type": this.forecastData.daypart[0].precipType[dayNight],
				"night_precipitation_type": this.forecastData.daypart[0].precipType[dayNight + 1],
				"day_wind_angle": this.forecastData.daypart[0].windDirection[dayNight],
				"night_wind_angle": this.forecastData.daypart[0].windDirection[dayNight + 1],
				"day_gust_strength": this.forecastData.daypart[0].windSpeed[dayNight],
				"night_gust_strength": this.forecastData.daypart[0].windSpeed[dayNight + 1],
				"day_humidity": this.forecastData.daypart[0].relativeHumidity[dayNight],
				"night_humidity": this.forecastData.daypart[0].relativeHumidity[dayNight + 1],
				"ultraviolet": this.forecastData.daypart[0].uvIndex[dayNight],
				"day_temperature": this.forecastData.daypart[0].temperature[dayNight],
				"night_temperature": this.forecastData.daypart[0].temperature[dayNight + 1],
				"day_temperature.feelsLike": this.forecastData.daypart[0].temperature[dayNight],
				"night_temperature.feelsLike": this.forecastData.daypart[0].temperature[dayNight + 1]
			};

			return forecast;
		}

		return null;
	}

	getIconFileName(iconCode)
	{
		const weatherSymbols = [
			"wsymbol_0079_tornado",
			"wsymbol_0080_tropical_storm_hurricane",
			"wsymbol_0080_tropical_storm_hurricane",
			"wsymbol_0024_thunderstorms",
			"wsymbol_0024_thunderstorms",
			"wsymbol_0021_cloudy_with_sleet",
			"wsymbol_0021_cloudy_with_sleet",
			"wsymbol_0021_cloudy_with_sleet",
			"wsymbol_0049_freezing_drizzle",
			"wsymbol_0048_drizzle",
			"wsymbol_0050_freezing_rain",
			"wsymbol_0017_cloudy_with_light_rain",
			"wsymbol_0017_cloudy_with_light_rain",
			"wsymbol_0019_cloudy_with_light_snow",
			"wsymbol_0020_cloudy_with_heavy_snow",
			"wsymbol_0053_blowing_snow",
			"wsymbol_0019_cloudy_with_light_snow",
			"wsymbol_0022_cloudy_with_light_hail",
			"wsymbol_0021_cloudy_with_sleet",
			"wsymbol_0056_dust_sand",
			"wsymbol_0007_fog",
			"wsymbol_0005_hazy_sun",
			"wsymbol_0055_smoke",
			"wsymbol_0060_windy",
			"wsymbol_0060_windy",
			"wsymbol_0049_freezing_drizzle",
			"wsymbol_0004_black_low_cloud",
			"wsymbol_0044_mostly_cloudy_night",
			"wsymbol_0043_mostly_cloudy",
			"wsymbol_0041_partly_cloudy_night",
			"wsymbol_0002_sunny_intervals",
			"wsymbol_0008_clear_sky_night",
			"wsymbol_0001_sunny",
			"wsymbol_0041_partly_cloudy_night",
			"wsymbol_0002_sunny_intervals",
			"wsymbol_0023_cloudy_with_heavy_hail",
			"wsymbol_0045_hot",
			"wsymbol_0016_thundery_showers",
			"wsymbol_0016_thundery_showers",
			"wsymbol_0010_heavy_rain_showers",
			"wsymbol_0018_cloudy_with_heavy_rain",
			"wsymbol_0011_light_snow_showers",
			"wsymbol_0020_cloudy_with_heavy_snow",
			"wsymbol_0054_blizzard",
			"wsymbol_0999_unknown",
			"wsymbol_0025_light_rain_showers_night",
			"wsymbol_0027_light_snow_showers_night",
			"wsymbol_0032_thundery_showers_night"
		];

		if (iconCode && (iconCode >= 0) && (iconCode < weatherSymbols.length))
		{
			return `${weatherSymbols[iconCode]}.gif`;
		}

		return null;
	}
}

module.exports = ForecastDevice;