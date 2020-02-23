'use strict';

const Homey = require('homey');

class  WeatherApp extends Homey.App {
	
	onInit() {
		this.log(' WeatherApp is running...');
	}
	
}

module.exports =  WeatherApp;