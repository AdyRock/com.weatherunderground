'use strict';

const assert = require( 'node:assert/strict' );
const { EventEmitter } = require( 'node:events' );
const https = require( 'node:https' );
const Module = require( 'node:module' );
const { test } = require( 'node:test' );

const originalLoad = Module._load;
Module._load = function( request, parent, isMain )
{
    if ( request === 'homey' )
    {
        return { App: class {} };
    }
    if ( request === 'nodemailer' )
    {
        return {};
    }
    return originalLoad.call( this, request, parent, isMain );
};
const WeatherApp = require( '../app' );
Module._load = originalLoad;

function createRequest( t )
{
    const request = new EventEmitter();
    request.destroy = () => { request.destroyed = true; };
    let responseCallback;
    t.mock.method( https, 'get', ( url, callback ) =>
    {
        responseCallback = callback;
        return request;
    } );

    const app = new WeatherApp();
    const logs = [];
    let timeoutCallback;
    let timeoutMs;
    let cleared = false;
    app.numAPIcalls = 0;
    app.updateLog = message => logs.push( message );
    app.homey = {
        settings: { set: () => {} },
        setTimeout: ( callback, ms ) =>
        {
            timeoutCallback = callback;
            timeoutMs = ms;
            return 1;
        },
        clearTimeout: () => { cleared = true; }
    };

    return {
        request, app, logs,
        response: statusCode =>
        {
            const response = new EventEmitter();
            response.statusCode = statusCode;
            responseCallback( response );
            return response;
        },
        timeout: () => timeoutCallback(),
        timeoutMs: () => timeoutMs,
        cleared: () => cleared
    };
}

test( 'requests time out and abort before headers and during a response', async t =>
{
    for ( const withResponse of [ false, true ] )
    {
        await t.test( withResponse ? 'during body' : 'before headers', async t =>
        {
            const fixture = createRequest( t );
            const pending = fixture.app.GetURL( 'https://example.test' );
            assert.equal( fixture.timeoutMs(), 30000 );
            let response;
            if ( withResponse )
            {
                response = fixture.response( 200 );
                response.emit( 'data', Buffer.from( 'partial' ) );
                assert.equal( fixture.cleared(), false );
            }
            fixture.timeout();
            await assert.rejects( pending, error => typeof error === 'string' && error.includes( 'timed out after 30 seconds' ) );
            assert.equal( fixture.request.destroyed, true );
            assert.equal( fixture.cleared(), true );
            assert.equal( fixture.logs.some( line => line.includes( 'timed out after 30 seconds' ) ), true );
            if ( response )
            {
                response.emit( 'aborted' );
                response.emit( 'error', new Error( 'connection reset' ) );
                assert.equal( fixture.logs.filter( line => line.includes( 'GetURL On Error:' ) ).length, 1 );
            }
        } );
    }
} );

test( 'successful and no-data responses preserve their behavior and clear the timer', async t =>
{
    for ( const status of [ 200, 204, 401 ] )
    {
        await t.test( `status ${status}`, async t =>
        {
            const fixture = createRequest( t );
            const pending = fixture.app.GetURL( 'https://example.test' );
            const response = fixture.response( status );
            response.emit( 'data', Buffer.from( 'weather data' ) );
            response.emit( 'end' );

            if ( status === 200 )
            {
                assert.equal( ( await pending ).body.toString(), 'weather data' );
            }
            else if ( status === 204 )
            {
                await assert.rejects( pending, error => error === 'GetURL Error: 204, No Data Found' );
            }
            else
            {
                await assert.rejects( pending, error => error === 'GetURL Error: 401, Unauthorized' );
            }
            assert.equal( fixture.cleared(), true );
            fixture.timeout();
            assert.notEqual( fixture.request.destroyed, true );
        } );

    }
} );

test( 'an aborted response is rejected without waiting for the deadline', async t =>
{
    const fixture = createRequest( t );
    const pending = fixture.app.GetURL( 'https://example.test' );
    const response = fixture.response( 200 );
    response.emit( 'aborted' );
    response.emit( 'error', new Error( 'connection reset' ) );
    await assert.rejects( pending, error => error === 'GetURL On Error: Weather response was aborted' );
    assert.equal( fixture.cleared(), true );
    assert.equal( fixture.logs.filter( line => line.includes( 'GetURL On Error:' ) ).length, 1 );
} );

test( 'connection and response errors clear the timer', async t =>
{
    for ( const responseError of [ false, true ] )
    {
        await t.test( responseError ? 'response' : 'connection', async t =>
        {
            const fixture = createRequest( t );
            const pending = fixture.app.GetURL( 'https://example.test' );
            const source = responseError ? fixture.response( 200 ) : fixture.request;
            source.emit( 'error', new Error( 'connection lost' ) );
            await assert.rejects( pending, error => error === 'GetURL On Error: connection lost' );
            assert.equal( fixture.cleared(), true );
        } );
    }
} );
