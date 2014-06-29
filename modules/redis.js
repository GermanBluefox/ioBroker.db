/**
 * @fileOverview
 * @author hobbyquaker
 * @version 0.1
 */

/** @module statesRedis */

var redis = require("redis");

function StateRedis(settings) {

    var namespace =     ''; //(settings.namespace || 'io') + '.';
    var change =        settings.change;

    var client;
    var sub;
    
    var log = settings.logger;

    var __construct = function () {
        client =    redis.createClient(settings.redis.port, settings.redis.host, settings.redis.options);
        sub =       redis.createClient(settings.redis.port, settings.redis.host, settings.redis.options);

        if (typeof settings.change === 'function') {
            sub.on('pmessage', function (pattern, channel, message) {
                log.debug('redis pmessage ', pattern, channel, message);
                try {
                    change(channel.slice(namespace.length), JSON.parse(message));
                } catch (e) {
                    log.error('pmessage ' + e);
                }
            });
        }

    }();


    /**
     * @method setState
     * @param id {String}           the id of the value. '<namespace>.' will be prepended
     * @param state {any}
     *
     *
     *      an object containing the actual value and some metadata:<br>
     *      setState(id, {'val': val, 'ts': ts, 'ack': ack, 'lc': lc})
     *
     *      if no object is given state is treated as val:<br>
     *      setState(id, val)
     *
     *      <ul><li><b>val</b>  the actual value. Can be any JSON-stringifiable object. If undefined the
     *                          value is kept unchanged.</li>
     *
     *      <li><b>ack</b>  a boolean that can be used to mark a value as confirmed, used in bidirectional systems which
     *                      acknowledge that a value has been successfully set. Will be set to false if undefined.</li>
     *
     *      <li><b>ts</b>   a unix timestamp indicating the last write-operation on the state. Will be set by the
     *                      setState method if undefined.</li>
     *
     *      <li><b>lc</b>   a unix timestamp indicating the last change of the actual value. this should be undefined
     *                      when calling setState, it will be set by the setValue method itself.</li></ul>
     *
     * @param callback {Function}   will be called when redis confirmed reception of the command
     *
     *
     */
    this.setState = function (id, state, callback) {
        var expire;
        if (state.expire) {
            expire = state.expire;
            delete state.expire;
        }
        var that = this;
        var obj = {};

        if (typeof state !== 'object') {
            state = {
                val: state
            };
        }

        client.get(namespace + id, function (err, oldObj) {
            // TODO Error Handling

            if (!oldObj) {
                oldObj = {};
            } else {
                try {
                    oldObj = JSON.parse(oldObj);
                } catch (e) {
                    oldObj = {};
                }

            }

            if (state.val !== undefined) {
                obj.val = state.val;
            } else {
                obj.val = oldObj.val;
            }

            if (state.ack !== undefined) {
                obj.ack = state.ack;
            } else {
                obj.ack = false;
            }

            if (state.ts !== undefined) {
                obj.ts = state.ts;
            } else {
                obj.ts = Math.round((new Date()).getTime() / 1000);
            }


            var hasChanged;

            if (state.lc !== undefined) {
                obj.lc = state.lc;
            } else {
                if (typeof obj.val === 'object') {
                    hasChanged = JSON.stringify(oldObj.val) !== JSON.stringify(obj.val);
                } else {
                    hasChanged = oldObj.val !== obj.val;
                }
                if (!oldObj.lc || hasChanged) {
                    obj.lc = obj.ts;
                } else {
                    obj.lc = oldObj.lc;
                }
            }

            // publish event in redis
            log.debug('redis publish '+ namespace + id + ' ' + JSON.stringify(obj));
            client.publish(namespace + id, JSON.stringify(obj));


            // set object in redis
            if (expire) {
                //console.log('setex',namespace + id, expire, JSON.stringify(obj));
                client.setex(namespace + id, expire, JSON.stringify(obj), function () {
                    if (typeof callback === 'function') {
                        callback();
                    }
                });
            } else {
                //console.log('set',namespace + id, JSON.stringify(obj));
                client.set(namespace + id, JSON.stringify(obj), function () {
                    if (typeof callback === 'function') {
                        callback();
                    }
                });
            }
        });

    };


    /**
     * @method getState
     *
     * @param {String} id
     * @param callback
     */
    this.getState = function (id, callback) {
        client.get(namespace + id, function (err, obj) {

            log.debug('redis get '+id+' '+obj);

            if (typeof callback === 'function') callback(JSON.parse(obj));

        });
    };

    this.getStates = function (keys, callback) {
        client.mget(keys, function (err, obj) {
            log.debug('redis mget '+keys.length+' '+obj);
            if (typeof callback === 'function') callback(err, obj);
        });
    };

    /**
     * @method subscribe
     *
     * @param pattern
     */
    this.subscribe = function (pattern) {
        log.debug('redis psubscribe ' + namespace + pattern);
        sub.psubscribe(namespace + pattern);
    };

}

module.exports = StateRedis;
