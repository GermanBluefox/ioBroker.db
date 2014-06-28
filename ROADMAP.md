# 0.1

* Adapter hm-rpc
* Adapter hm-rega
* enum Objekte, Methode getEnumObjects in Modul adapter.js

# 0.2


* admin-ui: delete object
* admin-ui: edit object
* admin-ui: add object
* Adapter bcontrol
* Adapter hue

# 0.3

* Adapter Script-Engine - beinhaltet neben subscribe/schedule/getState/setState/getObject/setObject/... auch Email, Pushover, HTTP GET/POST/PUT/DELETE..., Growl und andere "Kleinigkeiten" für die keine Objekte in den Datenbanken benötigt werden
* Adapter Logging (verschiedene Ziele: Datei, Graphite, Log4j, Loggly?, Xively?, RRD?, SQL?)
* ctrl: Adapter start via schedule
* ctrl: Adapter start/stop via subscribe
* Adapter yr

# 0.4

* Dateien (Attachments) in CouchDB
* Adapter webserver -> Beginn Portierung ioBroker.vis (DashUI), ioBroker.mobile (yahui)
* Adapter hm-rpc: binrpc implementieren, CUxD Unterstützung
* Adapter geofency


# 0.5

* iobroker.js add adapter - prüfen ob package.json im adapter-verzeichnis vorliegt und ggf. automatisch npm install aufrufen
* adapter.json - nach-Installations-
* Adapter-Installation über Admin UI, Zipfile-URL (kann Github sein, aber muss nicht) zum frei eingeben, außerdem Liste von "offiziellen" Adaptern zum auswählen die von iobroker.com heruntergeladen wird.
* Adapter Instanzen erzeugen über Admin UI
* Adapter Konfiguration - html config über Admin UI


# 0.6

* Adapter web auth mit Benutzerverwaltung in Admin UI

# 0.7

* Objekt-Modell freeze / dokumentieren
* Adapter-Entwicklung dokumentieren, API freeze

# 0.8

* Adapter dummy-php
* Adapter dummy-py
* Adapter dummy-rb

# 0.9

* CouchDB Auth
* Redis Auth
* Paketieren: .msi, .pkg, .deb, wahlweise mit node_modules oder ohne

# 1.0


