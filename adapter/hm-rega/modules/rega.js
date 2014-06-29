/**
 *      HomeMatic ReGaHss Schnittstelle für Node.js
 *
 *      Version 0.7
 *
 *      Copyright (c) 2013, 2014 http://hobbyquaker.github.io
 *
 */



var http = require('http');
var fs = require('fs');
var xml2js = require('xml2js');
var iconv = require('iconv-lite');
var request = require('request');
var extend = require('extend');
var parser = new xml2js.Parser({explicitArray:false});


var rega = function(options) {

    this.logger = options.logger;
    this.options = options;

    if (options.ccuIp) {
        request('http://'+options.ccuIp+'/ise/checkrega.cgi', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body == "OK") {
                    options.ready();
                } else {
                    options.ready("ReGaHSS down");
                }
            } else {
                options.ready("CCU unreachable");
            }
        });
    }
};

rega.prototype = {
    options: {},
    pendingRequests: 0,
    regaUp: function (success, error) {

    },
    checkTime: function (callback) {
        var that = this;
        this.script('Write(system.Date("%F %X").ToTime().ToInteger());', function (data, xml) {
            var ccuTime = parseInt(data, 10);
            var localTime = Math.round(new Date().getTime() / 1000);
            var diff = localTime - ccuTime;
            if (diff > 10) {
                that.logger.warn("time difference local-ccu " + diff.toString() + "s");
            } else {
                that.logger.info("time difference local-ccu " + diff.toString() + "s");
            }
            if (typeof callback === 'function') callback(diff);
        });
    },
    loadTranslation: function (lang, callback) {
        var that = this;

        if (!(lang == "de" || lang == "en" || lang == "tr")) {
            lang = "de";
        }


        request.get({ url: 'http://' + that.options.ccuIp + '/webui/js/lang/'+lang+'/translate.lang.js', encoding: null }, function(err, res, body) {
            if (res.statusCode == 200) {
                try {
                    var HMIdentifier = {}, langJSON = {};
                    var str = unescape(iconv.decode(body, 'ISO-8859-1'));
                    var jscode = str.replace(/jQuery\./g, "");

                    eval(jscode);

                    this.logger.debug(langJSON);
                    this.logger.info("ccu.io        loaded translate.lang.js");

                    request.get({ url: 'http://' + that.options.ccuIp + '/webui/js/lang/'+lang+'/translate.lang.stringtable.js', encoding: null }, function(err, res, body) {
                        if (res.statusCode == 200) {
                            var str = unescape(iconv.decode(body, 'ISO-8859-1'));
                            var jscode = str.replace(/jQuery\./g, "");

                            try {
                                eval(jscode);
                            } catch (e) {
                                callback(langJSON);
                            }

                            this.logger.debug(langJSON);
                            this.logger.info("ccu.io        loaded translate.lang.stringtable.js");
                        } else {
                            callback(langJSON);
                            return;
                        }


                        request.get({ url: 'http://' + that.options.ccuIp + '/webui/js/lang/'+lang+'/translate.lang.extensionV.js', encoding: null }, function(err, res, body) {
                            if (res.statusCode == 200) {
                                var str = unescape(iconv.decode(body, 'ISO-8859-1'));
                                var jscode = str.replace(/jQuery\./g, "");

                                try {
                                    eval(jscode);
                                } catch (e) {
                                    callback(langJSON);
                                    return;
                                }

                                this.logger.debug(langJSON);
                                this.logger.info("ccu.io        loaded translate.lang.extensionV.js");

                            }
                            callback(langJSON);
                        });
                    });

                } catch (e) {
                    this.logger.error("ccu.io        loadTranslation "+e);
                    callback(null);
                }

            } else {
                callback(null);
            }
        });

    },
    loadStringTable: function (language, callback) {
        var that = this;
        language = language || "de";

        that.loadTranslation(language, function (translation) {
            request.get({ url: 'http://' + that.options.ccuIp + '/config/stringtable_de.txt', encoding: null }, function(err, res, body) {
                var data = body;
                var str = iconv.decode(data, 'ISO-8859-1');
                var dataArr = str.split("\n");
                var lang = {};
                for (var i = 0; i < dataArr.length; i++) {
                    var line = dataArr[i];
                    if (line && line != "") {
                        var resultArr = line.match(/^([A-Z0-9_-]+)\|?([A-Z0-9_-]+)?=?([A-Z0-9_-]+)?[ \t]+(.+)$/);

                        if (resultArr) {
                            var text = resultArr[4];

                            if (translation && translation[language]) {
                                text = translation[language][text.replace(/\${([^}]*)}/,"$1")] || text;
                            }

                            if (!lang[resultArr[1]]) {
                                lang[resultArr[1]] = {};
                            }
                            if (resultArr[3]) {
                                if (!lang[resultArr[1]][resultArr[2]]) {
                                    lang[resultArr[1]][resultArr[2]] = {};
                                }
                                if (!lang[resultArr[1]][resultArr[2]][resultArr[3]]) {
                                    lang[resultArr[1]][resultArr[2]][resultArr[3]] = {};
                                }
                                lang[resultArr[1]][resultArr[2]][resultArr[3]].text = text;
                            } else if (resultArr[2]) {
                                if (!lang[resultArr[1]][resultArr[2]]) {
                                    lang[resultArr[1]][resultArr[2]] = {};
                                }
                                lang[resultArr[1]][resultArr[2]].text = text;
                            } else {
                                lang[resultArr[1]].text = text;
                            }
                        }

                    }
                }
                this.logger.info("ccu.io        stringtable loaded");
                callback(lang);
            });
        });
    },
    addStringVariable: function (name, desc, str, callback) {
        var script = "object test = dom.GetObject('"+name+"');\n" +
            "if (test) {\n" +
            "WriteLine('false');\n" +
            "} else {\n" +
            "object o = dom.CreateObject(OT_VARDP);\n" +
            "o.Name('"+name+"');\n" +
            "dom.GetObject(ID_SYSTEM_VARIABLES).Add(o.ID());\n" +
            "o.DPInfo('"+desc+"');\n" +
            "o.DPArchive(false);\n" +
            "o.ValueUnit('');\n" +
            "o.ValueType(20);\n" +
            "o.ValueSubType(11);\n" +
            "o.State('"+str+"');\n" +
            "WriteLine(o.ID());\n" +
            "}";

        this.script(script, function (res) {
            var id = parseInt(res, 10);
            if (res == "false") {
                this.logger.error("rega          addStringVariable("+name+") already exists");
                callback(false);
            } else if (id > 0) {
                callback(id);
            } else {
                this.logger.error("rega          addStringVariable("+name+") unknown error");
                callback(false);
            }
        });
    },
    runScriptFile: function (script, callback) {
        this.logger.info('--> ' + script + '.fn');

        var that = this;
        fs.readFile(__dirname + '/../regascripts/' + script+'.fn', 'utf8', function (err, data) {
            if (err) {
                that.logger.error("runScriptFile " + err);
                return false;
            }
            that.script(data, function (stdout, xml) {
                callback(stdout, xml);
            });
        });
    },
    script: function (script, callback) {
        var that = this;
        this.logger.info('--> ' + script);

        var post_options = {
            host: this.options.ccuIp,
            port: this.options.port,
            path: '/rega.exe',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': script.length
            }
        };
        this.pendingRequests += 1;
        var post_req = http.request(post_options, function(res) {
            var data = "";
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                data += chunk.toString();
            });
            res.on('end', function () {
                that.pendingRequests -= 1;
                var pos = data.lastIndexOf("<xml>");
                var stdout = (data.substring(0, pos));
                var xml = (data.substring(pos));
                that.logger.info('<-- ' + stdout);

                parser.parseString(xml, function (err, result) {
                    if (typeof callback === 'function') {
                        if (result && result.xml) {
                            callback(stdout, result.xml);
                        } else {
                            that.logger.error('<-- invalid response:');
                            that.logger.error(JSON.stringify(data));
                            callback(stdout);
                        }
                    }
                });

            });
        });

        post_req.on('error', function(e) {
            this.logger.error('rega          post request error: ' + e.message);
            if (callback) {
                callback(null, 'rega          post request error: ' + e.message);
            }
        });

        post_req.write(script);
        post_req.end();


    }
};

module.exports = rega;
