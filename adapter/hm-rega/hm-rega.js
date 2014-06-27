var adapter = require('../../modules/adapter.js')({

    // Ein paar Attribute die jeder Adapter mitbringen muss
    name:           'dummy',
    version:        '0.0.0',

    daemon:         true,

    // Default Config
    config: {
        testTimeout: 30
    },

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
            adapter.log.info('hm-rega terminating');
            callback();
        } catch (e) {
            adapter.log.error('hm-rega terminating' + e);
            callback();
        }
    },

    // Wird aufgerufen wenn der Adapter mit den Datenbanken verbunden ist und seine Konfiguration erhalten hat.
    // Hier einsteigen!
    ready: function () {
        main();
    }

});

var regaPending = 0;

function main() {

    var Rega = require('./modules/rega.js');



    var rega = new Rega({
        ccuIp: adapter.config.host,
        ready: function (err) {

            if (err == "ReGaHSS down") {
                adapter.log.error("ReGaHSS down");
                ccuReachable = true;
                ccuRegaUp = false;

            } else if (err == "CCU unreachable") {

                adapter.log.error("CCU unreachable");
                ccuReachable = false;
                ccuRegaUp = false;

            } else {

                adapter.log.info("ReGaHSS up");
                ccuReachable = true;
                ccuRegaUp = true;

                rega.checkTime();

            }
        }
    });


}

function stop(callback) {
    if (regaPending > 0) {
        setTimeout(function () {
            stop(callback);
        }, 500);
    }
}


