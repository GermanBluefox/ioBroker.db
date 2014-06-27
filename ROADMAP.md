# 0.1

* Adapter Unterscheidung js/anderes
* Adapter hm-rpc
* Adapter hm-rega
* enum Objekte, Methode getEnumObjects in Modul adapter.js

# 0.2

* Objekt-Modell dokumentieren
* Adapter-Entwicklung dokumentieren
* admin-ui: delete object
* admin-ui: edit object
* admin-ui: add object
* Adapter bcontrol
* Adapter hue
* Adapter geofency


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
* Adapter dummy-php

# 0.5

* iobroker.js add adapter - prüfen ob package.json im adapter-verzeichnis vorliegt und ggf. automatisch npm install aufrufen
* adapter.json - nach-Installations-
* Adapter-Installation über Admin UI, Zipfile-URL (kann Github sein, aber muss nicht) zum frei eingeben, außerdem Liste zum auswählen die von iobroker.com heruntergeladen wird
* Adapter Instanzen erzeugen über Admin UI
* Adapter Konfiguration - html config über Admin UI



# 0.6

* Benutzerverwaltung
* Adapter web auth

# 0.7

* Adapter dummy-py
* Adapter dummy-rb

# 0.8


# 0.9

* CouchDB Auth
* Redis Auth

# 1.0

* Paketieren: .msi, .pkg, .deb