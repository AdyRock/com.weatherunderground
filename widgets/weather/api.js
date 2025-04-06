'use strict';

module.exports = {
	async getSomething({ homey, query })
	{
		if (query.deviceId)
		{
			const forecast = await homey.app.getWidget5DayWeather(query.deviceId);
			return forecast;
		}
	},

	async addSomething({ homey, body })
	{
		// access the post body and perform some action on it.
		return homey.app.addSomething(body);
	},

	async updateSomething({ homey, params, body })
	{
		return homey.app.setSomething(body);
	},

	async deleteSomething({ homey, params })
	{
		return homey.app.deleteSomething(params.id);
	},
};
