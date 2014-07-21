# 0.1

* Adapter hm-rpc
* Adapter hm-rega
* enum Objekte
* state history
* system logging concept... full winston config or simplify via wrappers?
* Adapter history: targets: fifo, couchdb and file

# 0.2

* admin-ui: delete object
* admin-ui: edit object
* admin-ui: add object
* admin-ui: manage enums
* Files (Attachments) in CouchDB / Virtual Filesystem
* Adapter yr

# 0.3


* Adapter Script-Engine - Speichern der Scripte in CouchDB
* Adapter Script-Engine - subscribe/on/schedule/getState/setState/getObject/setObject/extendObject/... HTTP GET/POST/PUT/DELETE..., Telnet
* Adapter Logging (verschiedene Ziele: Datei, Graphite, Log4j, Loggly?, Xively?, RRD?, SQL?)
* ctrl: Adapter start via schedule
* ctrl: Adapter start/stop via subscribe


# 0.4

* Adapter web -> Beginn Portierung ioBroker.vis (DashUI), ioBroker.mobile (yahui)
* Adapter hm-rpc: binrpc implementieren, CUxD Unterstützung
* Adapter geofency
* Adapter hue
* Adapter bcontrol

# 0.5

* iobroker.js add adapter - check for package.json in adapter-directory and run npm install if available
* adapter.json - pre/post install hooks
* Adapter-download/install via Admin UI, list adapters in conf/sources.json, offer method to paste zip-file or github repo url
* Adapter instance config via Admin UI
* Adapter Konfiguration - html config über Admin UI


# 0.6

* Adapter web auth / User management in Admin UI

# 0.7

* Objekt-Modell freeze / dokumentieren
* Adapter-Entwicklung dokumentieren, API freeze

# 0.8

* ctrl: support non-javascript adapters
* Adapter example-perl / adapter module
* Adapter example-python / adapter module
* Adapter example-java / adapter module



# 0.9

* CouchDB Auth
* Redis Auth
* Paketieren: .msi, .pkg, .deb, wahlweise mit node_modules oder ohne

# 1.0


