var adapter = require('../../modules/adapter.js')({
    name:       'hmxml',
    version:    '0.0.1',
    mode:       'daemon',
    config: {
        ip:                 '192.168.2.20',
        port:               '2001',
        type:               'rfd',
        checkInit:          false,
        checkInitInterval:  180,
        checkInitTrigger:   'Bidcos-RF:50.PRESS_LONG'
    },

    install: function () {

    },
    ready: function () {
        adapter.subscribeStates('*');
        adapter.subscribeObjects('*');
        main();
    },
    objectChange: function (id, obj) {

    },
    stateChange: function (id, state) {
        if (state.ack !== true) {
            var tmp = id.split('.');
            console.log(state);
            adapter.log.info('RPC -> setValue ' + JSON.stringify([tmp[0], tmp[1], state.val]));
            rpcClient.methodCall('setValue', [tmp[0], tmp[1], state.val], function () {

            });
        }
    },
    unload: function () {
        if (adapter.config.init) {
            log.info("RPC -> " + adapter.config.ip + ':' + adapter.config.port + ' init ' + JSON.stringify(['http://' + adapter.host + ':' + adapter.config.port, '']));
            rpcClient.methodCall('init', ['http://' + adapter.host + ':' + adapter.config.port, ''], function (err, data) { });
        }
        adapter.log.info('terminating');
    }
});


var xmlrpc = require('xmlrpc');
var Iconv  = require('iconv').Iconv;
var iconv = new Iconv('UTF-8', 'ISO-8859-1');

// TODO auf iconv-lite umsteigen
//var iconvLite = require('iconv-lite');
//var encoding = require('encoding');

var rpc;
var rpcClient;
var rpcClientPending;

var rpcServer;
var rpcServerStarted;

var metaValues = {};


function main() {



    rpcClient = xmlrpc.createClient({
        host: adapter.config.ip,
        port: adapter.config.port,
        path: '/'
    });

    if (adapter.config.init) {

        if (!rpcServerStarted) initRpcServer();

        log.info("RPC -> " + adapter.config.ip + ':' + adapter.config.port + ' init ' + JSON.stringify(['http://' + adapter.host + ':' + adapter.config.port, adapter.namespace]));

        rpcClient.methodCall('init', ['http://' + adapter.host + ':' + adapter.config.port, adapter.namespace], function (err, data) { });
    }
    

}

function initRpcServer() {
    rpcServerStarted = true;
    rpcServer = xmlrpc.createServer({ host: adapter.host, port: adapter.config.port });

    log.info('RPC server listening on ' + adapter.host + ':' + adapter.config.port);

    rpcServer.on('NotFound', function(method, params) {
        log.warn('RPC <- undefined method ' + method + ' ' + JSON.stringify(params).slice(0, 80));
    });

    rpcServer.on('system.multicall', function(method, params, callback) {
        var response = [];
        for (var i = 0; i < params[0].length; i++) {
            if (methods[params[0][i].methodName]) {
                response.push(methods[params[0][i].methodName](null, params[0][i].params));
            } else {
                response.push('');
            }

        }
        callback(null, response);
    });

    rpcServer.on('event', function(err, params, callback) {
        callback(null, methods.event(err, params));
    });

    rpcServer.on('newDevices', function(err, params, callback) {
        var deviceArr = params[1];
        adapter.log.info('RPC <- newDevices ' + deviceArr.length);

        for (var i = 0; i < deviceArr.length; i++) {
            var obj = {
                type: (deviceArr[i].PARENT === '' ? 'device' : 'channel'),
                parent: (deviceArr[i].PARENT === '' ? null : adapter.namespace + '.' + deviceArr[i].PARENT),
                common: {

                },
                native: deviceArr[i]
            };

            adapter.setObject(deviceArr[i].ADDRESS, obj);

            if (obj.type === 'channel') {
                var cid = obj.PARENT_TYPE + '.' + obj.TYPE + '.' + obj.VERSION;
                if (metaValues[cid]) {

                } else {
                    queueValueParamsets.push(obj);
                }

            }
        }
        getValueParamsets();
        callback(null, '');
    });



    rpcServer.on('listDevices', function(err, params, callback) {
        log.info('RPC <- listDevices ' + JSON.stringify(params));
        callback(null, ''); return; // FIXME
        adapter.objects.getObjectView('hm-service', 'listDevices', {}, function (err, doc) {
            var response = [];
            for (var i = 0; i < doc.rows.length; i++) {
                response.push(doc.rows[i].value);
            }
            log.info('RPC -> ' + doc.rows.length + ' devices');
            callback(null, response);
        });

    });

    rpcServer.on('deleteDevices', function(err, params, callback) {
        log.info('RPC <- deleteDevices ' + JSON.stringify(params));
        for (var i = 0; i < params[1].length; i++) {
            adapter.delObject(params[1][i]);
        }
        callback(null, '');
    });
}

var methods = {

    event: function (err, params) {
        log.info('RPC <- event ' + JSON.stringify(params));
        adapter.setState(params[1]+'.'+params[2], {val: params[3], ack: true});
        return '';
    }

};

var queueValueParamsets = [];

function addParamsetObjects(channel, paramset) {
    for (var key in paramset) {
        var commonType = {
            'ACTION':       'boolean',
            'BOOL':         'boolean',
            'FLOAT':        'number',
            'ENUM':         'number',
            'INTEGER':      'number',
            'STRING':       'string'
        };


        var obj = {
            type: 'state',
            parent: channel._id,


            common: {

                def: paramset[key].DEFAULT,
                min: paramset[key].MIN,
                max: paramset[key].MAX,
                type: commonType[paramset[key].TYPE] || paramset[key].TYPE,
                oper: {
                    read:   (paramset[key].OPERATIONS & 1 ? true : false),
                    write:  (paramset[key].OPERATIONS & 2 ? true : false),
                    event:  (paramset[key].OPERATIONS & 4 ? true : false)
                }

            },
            native: paramset[key]
        };
        if (paramset[key].UNIT === '100%') {
            obj.common.unit = '%';
            obj.common.max = 100 * paramset[key].MAX;
        } else {
            obj.common.unit = paramset[key].UNIT;
        }

        if (paramset[key].OPERATIONS & 8) {
            obj.common.role = 'indicator.service'
        } else if (channel.native.type == 'DIMMER' && key == 'LEVEL') {
            obj.common.role = 'level.dimmer'
        } else if (channel.native.type == 'BLIND' && key == 'LEVEL') {
            obj.common.role = 'level.blind';
        } else if (key == 'WORKING') {
            obj.common.role = 'indicator.working';
        } else if (key == 'DIRECTION') {
            obj.common.role = 'indicator.direction';
        } else if (key == 'PRESS_SHORT') {
            obj.common.role = 'button';
        } else if (key == 'PRESS_LONG') {
            obj.common.role = 'button.long';
        } else if (key == 'STOP') {
            obj.common.role = 'button.stop';
        }

        adapter.log.info('setObject ' + channel.ADDRESS + '.' + key);


        adapter.setObject(channel.ADDRESS + '.' + key, obj, function () {

        });
    }
}

function getValueParamsets() {
    if (queueValueParamsets.length === 0) {
        return;
    }
    var obj = queueValueParamsets.pop();
    var cid = obj.native.PARENT_TYPE + '.' + obj.native.TYPE + '.' + obj.native.VERSION;

    adapter.log.debug('getValueParamsets ' + cid);

    if (metaValues[cid]) {

        adapter.log.debug('paramset cache hit');
        addParamsetObjects(obj, metaValues[cid]);
        getValueParamsets();

    } else {

        var key = 'meta.hm-service.VALUES.' + cid;
        adapter.objects.getObject(key, function (err, res) {
            if (res && res.native) {
                adapter.log.debug(key + ' found');
                metaValues[cid] = res.native;
                addParamsetObjects(obj, res.native);
                getValueParamsets();


            } else {

                adapter.log.info('RPC -> getParamsetDescription ' + JSON.stringify([obj.ADDRESS, 'VALUES']));
                rpcClient.methodCall('getParamsetDescription', [obj.ADDRESS, 'VALUES'], function (err, res) {
                    var paramset = {
                        'type': 'meta',
                        'meta': {
                            adapter: 'hm-service',
                            type: 'paramsetDescription'
                        },
                        'common': {},
                        'native': res
                    };
                    metaValues[key] = res;
                    setTimeout(getValueParamsets, 1000);
                    adapter.objects.setObject(key, paramset);
                    addParamsetObjects(obj, res);
                });

            }

        });

    }
}

