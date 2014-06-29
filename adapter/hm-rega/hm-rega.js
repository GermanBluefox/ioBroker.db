var adapter = require('../../modules/adapter.js')({

    name:           'hm-rega',
    version:        '0.0.1',

    // Wird aufgerufen wenn sich ein Objekt - das via adapter.subscribeObjects aboniert wurde - ändert.
    objectChange: function (id, obj) {

    },
    // Wird aufgerufen wenn sich ein Status - der via adapter.subscribeStates aboniert wurde - ändert.
    stateChange: function (id, state) {
        adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));
    },

    // Wird aufgerufen bevor der Adapter beendet wird - callback muss unbedingt aufgerufen werden!
    unload: function (callback) {
        try {
            if (regaPending > 0) {

            }
            adapter.log.info('terminating');
            callback();
        } catch (e) {
            adapter.log.error('terminating' + e);
            callback();
        }
    },

    // Wird aufgerufen wenn der Adapter mit den Datenbanken verbunden ist und seine Konfiguration erhalten hat.
    // Hier einsteigen!
    ready: function () {
        main();
    }

});

var rega;
var regaPending = 0;
var ccuReachable;
var ccuRegaUp;

function main() {

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

                rega.checkTime(getVariables);

            }
        }
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
        // Todo catch error
        var response = [];
        for (var i = 0; i < doc.rows.length; i++) {
            var id = doc.rows[i].value._id.split('.');
            id = id[id.length - 1];
            response.push(id);
        }
        adapter.log.info('got ' + doc.rows.length + ' variables');

        rega.runScriptFile('variables', function (data) {
            data = JSON.parse(data);
            for (var id in data) {
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
                if (data[id].ValueSubType === 29) {
                    var statesArr = unescape(data[id].ValueList).split(';');
                    obj.common.states = {};
                    for (var i = 0; i < statesArr.length; i++) {
                        obj.common.states[i] = statesArr[i];
                    }
                    obj.common.min = 0;
                    obj.common.max = statesArr.length - 1;
                }

                adapter.setObject(id, obj);
                adapter.setState(id, {val: data[id].Value, ack: true, ts: data[id].Timestamp});

                if (response.indexOf(id) !== -1) {
                    response.splice(response.indexOf(id), 1);
                }

            }

            adapter.log.info('deleting ' + response.length + ' variables');
            for (var i = 0; i < response.length; i++) {
                adapter.delObject(response[i]);
            }

            if (typeof callback === 'function') callback();
        });




    });





}

function stop(callback) {
    if (rega.pendingRequests > 0) {
        adapter.log.info('waiting for pending Rega request');
        setTimeout(function () {
            stop(callback);
        }, 500);
    }
}


