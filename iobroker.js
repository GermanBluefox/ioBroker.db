var daemon = require("daemonize2").setup({
    main: "control.js",
    name: "iobroker.ctrl",
    pidfile: "iobroker.pid"
});

var ObjectsCouch;
var os;
var firstIp;

switch (process.argv[2]) {

    case "start":
        daemon.start();
        break;

    case "stop":
        daemon.stop();
        break;

    case "add":
        ObjectsCouch = require('./modules/couch.js');
        os = require('os');

        var ifaces = os.networkInterfaces();
        var ipArr = [];
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details) {
                if (dev !== 'lo') ipArr.push(details.address);
            });
        }
        firstIp = ipArr[0];

        var objects = new ObjectsCouch({
            logger: {
                debug: function (msg) { },
                info: function (msg) { },
                warn: function (msg) { console.log(msg) },
                error: function (msg) { console.log(msg) }
            },
            connected: function () {
                console.log('couchdb connected');
                createInstance(process.argv[3]);
            }
        });
        break;

    default:
        console.log("Usage: ");
        console.log("  node iobroker.js start");
        console.log("  node iobroker.js stop");
        console.log("  node iobroker.js add <adapter-name>");

}

function installAdapter(adapter, callback) {
    var fs = require('fs');

    if (!fs.existsSync(__dirname + '/adapter/' + adapter + '/adapter.json')) {
        console.log('error: adapter ' + adapter + ' not found');
        process.exit(1);
    }

    try {
        adapter = JSON.parse(fs.readFileSync(__dirname + '/adapter/' + adapter + '/adapter.json').toString());
    } catch (e) {
        console.log('error: reading adapter.json ' + e);
        process.exit(1);
    }

    function install() {
        var objs = [];
        if (adapter.objects && adapter.objects.length > 0) objs = adapter.objects;

        adapter.common.enabled = false;

        objs.push({
            _id: 'system.adapter.' + adapter.common.name,
            type: 'adapter',
            common: adapter.common,
            native: adapter.native
        });

        function setObject(callback) {
            if (objs.length === 0) {
                callback();
            } else {
                var obj = objs.pop();
                objects.setObject(obj._id, obj, function (err, res) {
                    if (err) {
                        console.log('error setObject ' + obj._id + ' ' + err);
                        process.exit(1);
                    } else {
                        console.log('object ' + obj._id + ' created');
                        setObject(callback);
                    }
                });
            }
        }

        setObject(callback);

    }

    install();
}


function createInstance(adapter, callback) {

    objects.getObject('system.adapter.' + adapter, function (err, doc) {
        if (err || !doc) {
            installAdapter(adapter, function () {
                createInstance(adapter, callback);
            });
            return;
        }
        objects.getObjectView('system', 'instanceStats', { startkey: 'system.adapter.' + adapter + '.', endkey: 'system.adapter.' + adapter + '.\u9999' }, function (err, res) {
            if (err || !res) {
                console.log('error: view instanceStats ' + err);
                process.exit(1);
                return;
            }
            var instance = (res.rows && res.rows[0] && res.rows[0].value ? res.rows[0].value.max + 1 : 0);
            objects.getObject('system.adapter.' + adapter, function (err, res) {
                var obj = res;
                obj._id = 'system.adapter.' + adapter + '.' + instance;
                obj.type = 'instance';
                obj.parent = 'system.adapter.' + adapter;
                delete obj._rev;
                obj.common.enabled = false;
                obj.common.host = firstIp;
                objects.setObject('system.adapter.' + adapter + '.' + instance, obj, function () {
                    console.log('object ' + 'system.adapter.' + adapter + '.' + instance + ' created');
                    objects.setObject('system.adapter.' + adapter + '.' + instance + '.alive', {
                        type: 'state',
                        name: adapter + '.' + instance + '.alive',
                        parent: 'system.adapter.' + adapter + '.' + instance,
                        common: {
                            type: 'bool',
                            role: 'indicator.state'
                        },
                        native: {}
                    }, function () {
                        console.log('object ' + 'system.adapter.' + adapter + '.' + instance + '.alive created');
                        objects.setObject('system.adapter.' + adapter + '.' + instance + '.connected', {
                            type: 'state',
                            name: adapter + '.' + instance + '.connected',
                            parent: 'system.adapter.' + adapter + '.' + instance,
                            common: {
                                type: 'bool',
                                role: 'indicator.state'
                            },
                            native: {}
                        }, function () {
                            console.log('object ' + 'system.adapter.' + adapter + '.' + instance + '.connected created');
                            process.exit(0);
                        });
                    });
                });
            });
        });
    });

}


