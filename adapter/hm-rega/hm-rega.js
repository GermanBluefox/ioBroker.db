var adapter = require('../../modules/adapter.js')({

    name:           'hm-rega',
    version:        '0.0.1',

    objectChange: function (id, obj) {
        adapter.log.debug('obectChange ' + id + ' ' + JSON.stringify(obj));

    },

    stateChange: function (id, state) {
        adapter.log.debug('stateChange ' + id + ' ' + JSON.stringify(state));

        if (id === pollingTrigger) {
            pollVariables();
        } else {
            var rid = id.split('.');
            rid = rid[rid.length - 1];
            if (regaStates[rid] !== state.val) {
                rega.script('dom.GetObject(' + rid + ').State(' + JSON.stringify(state.val) + ')');
            }
        }

    },

    unload: stop,

    ready: function () {
        main();
    }

});

var rega;
var regaPending = 0;
var ccuReachable;
var ccuRegaUp;
var regaStates = {};
var pollingInterval;
var pollingTrigger;

function main() {


    if (adapter.config.pollingTrigger) {
        if (adapter.config.pollingTrigger.match(/^BidCoS-RF/)) {
            pollingTrigger = adapter.config.rfdAdapter + '.' + adapter.config.pollingTrigger;
        } else {
            pollingTrigger = adapter.config.hs485dAdapter + '.' + adapter.config.pollingTrigger;
        }
        adapter.log.info('subscribe ' + pollingTrigger);
        adapter.subscribeForeignStates(pollingTrigger);
    }

    adapter.subscribeStates('*');


    adapter.subscribeObjects('*');

    var Rega = require('./modules/rega.js');


    rega = new Rega({
        ccuIp: adapter.config.ip,
        port: adapter.config.port,
        logger: adapter.log,
        ready: function (err) {

            if (err == 'ReGaHSS ' + adapter.config.ip + ' down') {
                adapter.log.error('ReGaHSS down');
                ccuReachable = true;
                ccuRegaUp = false;

            } else if (err == 'CCU unreachable') {

                adapter.log.error('CCU ' + adapter.config.ip + ' unreachable');
                ccuReachable = false;
                ccuRegaUp = false;

            } else {

                adapter.log.info('ReGaHSS ' + adapter.config.ip + ' up');
                ccuReachable = true;
                ccuRegaUp = true;

                rega.checkTime(function () {
                    getVariables(getDevices);
                });

            }
        }
    });

}

function pollVariables() {
    rega.runScriptFile('polling', function (data) {
        data = JSON.parse(data);
        for (var id in data) {
            regaStates[id] = unescape(data[id][0]);
            // Todo convert and set Timestamp
            var val = data[id][0];
            if (typeof val === 'string') val = unescape(val);
            adapter.setState(id, {val: val, ack: true});
        }
    });
}

function getDevices(callback) {

    console.log('getDevices');
    rega.runScriptFile('devices', function (data) {
        data = JSON.parse(data);
        for (var addr in data) {
            var id;
            switch (data[addr].Interface) {
                case 'BidCos-RF':
                    id = adapter.config.rfdAdapter + '.';
                    if (!adapter.config.rfdAdapter) continue;
                    break;
                case 'BidCos-Wired':
                    id = adapter.config.hs485dAdapter + '.';
                    if (!adapter.config.hs485dAdapter) continue;
                    break;
                case 'CUxD':
                    id = adapter.config.cuxdAdapter + '.';
                    if (!adapter.config.cuxdAdapter) continue;
                    break;
                default:

            }

            id += addr;
            adapter.extendForeignObject(id, {name: unescape(data[addr].Name)});

        }

        if (typeof callback === 'function') callback();

    });

}

function getVariables(callback) {
    var commonTypes = {
        2:  'boolean',
        4:  'number',
        16: 'number',
        20: 'string'
    };

    adapter.objects.getObjectView('hm-rega', 'variables', {startkey: 'hm-rega.' + adapter.instance + '.', endkey: 'hm-rega.' + adapter.instance + '.\u9999'}, function (err, doc) {
        // Todo catch errors
        var response = [];
        for (var i = 0; i < doc.rows.length; i++) {
            var id = doc.rows[i].value._id.split('.');
            id = id[id.length - 1];
            response.push(id);
        }
        adapter.log.info('got ' + doc.rows.length + ' variables');

        rega.runScriptFile('variables', function (data) {
            data = JSON.parse(data);
            var count = 0;
            for (var id in data) {
                count += 1;
                var obj = {
                    _id: adapter.namespace + '.' + id,
                    type: 'state',
                    name: unescape(data[id].Name),
                    common: {
                        type:   commonTypes[data[id].ValueType],
                        oper: {
                            read:   true,
                            write:  true,
                            event:  true
                        }
                    },
                    native: {
                        Name:           unescape(data[id].Name),
                        TypeName:       data[id].TypeName,
                        DPInfo:         unescape(data[id].DPInfo),
                        ValueMin:       data[id].ValueMin,
                        ValueMax:       data[id].ValueMax,
                        ValueUnit:      data[id].ValueUnit,
                        ValueType:      data[id].ValueType,
                        ValueSubType:   data[id].ValueSubType,
                        ValueList:      unescape(data[id].ValueList)
                    }
                };
                if (data[id].ValueMin) obj.common.min = data[id].ValueMin;
                if (data[id].ValueMax) obj.common.min = data[id].ValueMax;
                if (data[id].ValueUnit) obj.common.min = data[id].ValueUnit;
                if (data[id].DPInfo) obj.common.desc = unescape(data[id].DPInfo);
                if (data[id].ValueList) {
                    var statesArr = unescape(data[id].ValueList).split(';');
                    obj.common.states = {};
                    for (var i = 0; i < statesArr.length; i++) {
                        obj.common.states[i] = statesArr[i];
                    }
                    if (data[id].ValueSubType === 29) {
                        obj.common.min = 0;
                        obj.common.max = statesArr.length - 1;
                    }

                }

                adapter.setObject(id, obj);
                regaStates[id] = unescape(data[id].Value);
                // Todo convert and set Timestamp
                adapter.setState(id, {val: unescape(data[id].Value), ack: true});

                if (response.indexOf(id) !== -1) {
                    response.splice(response.indexOf(id), 1);
                }

            }

            adapter.log.info('added/updated ' + count + ' variables');

            for (var i = 0; i < response.length; i++) {
                adapter.delObject(response[i]);
            }
            adapter.log.info('deleted ' + response.length + ' variables');

            if (adapter.config.polling && adapter.config.pollingInterval > 0) {
                pollingInterval = setInterval(function () {
                    pollVariables();
                }, adapter.config.pollingInterval * 1000);
            }

            if (typeof callback === 'function') callback();

        });

    });

}

var firstStop = true;
function stop(callback) {
    if (firstStop) clearInterval(pollingInterval);
    if (rega.pendingRequests > 0) {
        if (firstStop) adapter.log.info('waiting for pending request');
        setTimeout(function () {
            stop(callback);
        }, 500);
    } else {
        callback();
    }
    firstStop = false;
}


