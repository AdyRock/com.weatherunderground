'use strict';

const assert = require( 'node:assert/strict' );
const { test } = require( 'node:test' );
const Module = require( 'node:module' );

const originalLoad = Module._load;
Module._load = function( request, parent, isMain )
{
    if ( request === 'homey' )
    {
        return { Device: class {} };
    }
    return originalLoad.call( this, request, parent, isMain );
};
const WeatherDevice = require( '../drivers/weather/device' );
Module._load = originalLoad;

function createDevice( settings, capabilities = [] )
{
    const device = new WeatherDevice();
    const active = new Set( capabilities );
    device.getSettings = () => settings;
    device.hasCapability = capability => active.has( capability );
    device.addCapability = async capability => { active.add( capability ); };
    device.removeCapability = async capability => { active.delete( capability ); };
    device.setCapabilityValue = async ( capability, value ) => { device.value = value; };
    device.log = () => {};
    device.homey = { __: key => key, app: {}, clearTimeout: () => {} };
    device.refreshCapabilities = () => {};
    return { device, active };
}

test( 'luminance is opt-in and is removed when disabled or radiation is unavailable', async () =>
{
    const settings = {};
    const { device, active } = createDevice( settings );
    await device.updateLuminance( 100 );
    assert.equal( active.has( 'measure_luminance' ), false );

    settings.luminanceEnabled = true;
    await device.updateLuminance( 100 );
    assert.equal( active.has( 'measure_luminance' ), true );
    await device.updateLuminance( null );
    assert.equal( active.has( 'measure_luminance' ), false );

    await device.updateLuminance( 100 );
    settings.luminanceEnabled = false;
    await device.updateLuminance( 100 );
    assert.equal( active.has( 'measure_luminance' ), false );
} );

test( 'luminance uses the default or configured factor, including zero radiation', async () =>
{
    const settings = { luminanceEnabled: true };
    const { device } = createDevice( settings );
    await device.updateLuminance( 100 );
    assert.equal( device.value, 12600 );
    settings.luminanceFactor = 126.7;
    await device.updateLuminance( 10 );
    assert.equal( device.value, 1267 );
    await device.updateLuminance( 0 );
    assert.equal( device.value, 0 );
} );

test( 'invalid settings and radiation are rejected', async () =>
{
    const settings = { luminanceEnabled: true, luminanceFactor: 0 };
    const { device } = createDevice( settings );
    await assert.rejects( device.updateLuminance( 10 ), /Invalid solar radiation/ );
    await assert.rejects(
        device.onSettings( { oldSettings: {}, newSettings: settings, changedKeys: [ 'luminanceFactor' ] } ),
        /invalidLuminanceFactor/
    );
    settings.luminanceFactor = 126;
    await assert.rejects( device.updateLuminance( -1 ), /Invalid solar radiation/ );
} );

test( 'disabling luminance removes it without contacting the weather service', async () =>
{
    const settings = { luminanceEnabled: false, luminanceFactor: 126 };
    const { device, active } = createDevice( settings, [ 'measure_luminance' ] );
    await device.onSettings( { oldSettings: {}, newSettings: settings, changedKeys: [ 'luminanceEnabled' ] } );
    assert.equal( active.has( 'measure_luminance' ), false );
} );

test( 'enabling luminance immediately uses the current radiation and new settings', async () =>
{
    const oldSettings = { luminanceEnabled: false, luminanceFactor: 126 };
    const newSettings = { luminanceEnabled: true, luminanceFactor: 100 };
    const { device, active } = createDevice( oldSettings, [ 'measure_radiation' ] );
    device.getCapabilityValue = () => 10.1;

    await device.onSettings( { oldSettings, newSettings, changedKeys: [ 'luminanceEnabled', 'luminanceFactor' ] } );
    assert.equal( active.has( 'measure_luminance' ), true );
    assert.equal( device.value, 1010 );

    await device.onSettings( {
        oldSettings: newSettings,
        newSettings: { ...newSettings, luminanceFactor: 120 },
        changedKeys: [ 'luminanceFactor' ]
    } );
    assert.equal( device.value, 1212 );

    device.getCapabilityValue = () => 0;
    await device.onSettings( {
        oldSettings: newSettings,
        newSettings: { ...newSettings, luminanceFactor: 120 },
        changedKeys: [ 'luminanceFactor' ]
    } );
    assert.equal( device.value, 0 );
} );

test( 'enabling luminance waits for a refresh when radiation is unavailable', async () =>
{
    const oldSettings = { luminanceEnabled: false };
    const newSettings = { luminanceEnabled: true, luminanceFactor: 126 };
    const { device, active } = createDevice( oldSettings, [ 'measure_radiation' ] );
    device.getCapabilityValue = () => null;
    await device.onSettings( { oldSettings, newSettings, changedKeys: [ 'luminanceEnabled' ] } );
    assert.equal( active.has( 'measure_luminance' ), false );
} );

test( 'weather refresh updates luminance without changing the radiation reading', async () =>
{
    const settings = { luminanceEnabled: true, luminanceFactor: 100 };
    const { device, active } = createDevice( settings, [ 'measure_radiation' ] );
    device.refreshCapabilities = WeatherDevice.prototype.refreshCapabilities;
    const values = {};
    device.setCapabilityValue = async ( capability, value ) => { values[ capability ] = value; };
    device.getCapabilityValue = capability => values[ capability ];
    device.getWeather = async () => ( { body: JSON.stringify( {
        observations: [ {
            winddir: 0, humidity: 50, uv: 1, solarRadiation: 250,
            metric: { windSpeed: 0, windGust: 0, temp: 20, dewpt: 10, precipRate: 0, precipTotal: 0, pressure: 1000 }
        } ]
    } ) } );
    device.setAvailable = device.unsetWarning = async () => {};
    device.lastRained = Date.now();
    device.homey.i18n = { getLanguage: () => 'en' };
    device.homey.settings = { set: () => {} };
    device.homey.setTimeout = () => 1;
    device.homey.app = {
        SpeedUnits: '0',
        NumStations: 1,
        updateLog: () => {},
        varToString: error => error.message
    };
    device.driver = {
        triggerFeelLike: () => {},
        triggerDewPoint: () => {},
        triggerRainTotal: () => {},
        triggerRadiation: () => {}
    };

    await device.refreshCapabilities();
    assert.equal( active.has( 'measure_luminance' ), true );
    assert.equal( values.measure_radiation, 250 );
    assert.equal( values.measure_luminance, 25000 );
} );

test( 'weather polling is rescheduled after a request timeout', async () =>
{
    const { device } = createDevice( {} );
    device.refreshCapabilities = WeatherDevice.prototype.refreshCapabilities;
    device.getWeather = async () => { throw 'GetURL On Error: Weather request timed out after 30 seconds'; };
    device.unsetWarning = device.setUnavailable = async () => {};
    device.homey.app = {
        NumStations: 2,
        updateLog: () => {},
        varToString: error => error
    };
    let delay;
    device.homey.setTimeout = ( callback, ms ) => { delay = ms; return 1; };

    await device.refreshCapabilities();
    assert.equal( delay, 120000 );
} );
