# ioBroker
*...domesticate the Internet of Things.*

ioBroker is an integration platform for the Internet of Things, focused on Smarthome, Building Automation, Ambient
Assisted Living, Process Automation, Visualization and Data Logging. It aims to be a possible replacement for software
like f.e. OpenHAB or The Thing System. ioBroker will be the successor of [CCU.IO](http://ccu.io), a project quite
popular in the german HomeMatic community.

## Core Concept
ioBroker is not just an application, it's more of a a concept, a database schema, and offers a very easy way for systems
to interoperate. ioBroker defines some common rules for a pair of databases used to exchange data and publish events
between different systems.

### Adapters
Systems are attached to ioBrokers databases via so called adapters, technically processes running anywhere
in the network and connecting all kinds of systems to ioBrokers databases. A connection to ioBrokers databases can be
easily implemented in nearly any programming language on nearly any platform that is capable of doing ip networking.


### Databases
ioBroker uses Redis and CouchDB. Redis is an in-memory key-value data store and also a message broker with
publish/subscribe pattern. It's used to maintain and publish all states of connected systems. CouchDB is used to store
rarely changing and larger data, like metadata of systems and things, configurations or any additional files.


### Security
ioBroker is designed to be accessed by trusted adapters inside trusted networks. This means that usually it is not a
good idea to expose the ioBroker databases directly to the internet or, in general, to an environment where untrusted
clients can directly access ioBroker databases network services. There are different special adapters that offer
services needed to be exposed to the internet, for example webserver-adapters for user interfaces. These should be
handled with care, for example with additional security measures like a reverse proxy.



## Getting started

### Installation prerequisites

* a [Node.js](http://nodejs.org) installation including npm
* a [CouchDB](http://couchdb.apache.org/) installation
* a [Redis](http://redis.io/) installation

### Install ioBroker

* Clone the repository or download and unzip the [zip-file]()
* Change to the iobroker root directory
* run ```npm install``` to install dependencies
* if CouchDB and/or Redis aren't running on localhost you need to edit conf/iobroker.json according to your needs

### Install admin adapter

* Change to the ioBroker/adapter/admin directory
* run ```npm install``` to install dependencies
* Change back to the iobroker/ directory
* run ```node iobroker.js add admin```

### Start ioBroker

* run ```node iobroker.js start```
* watch the logfile ```tail -f log/iobroker.log```

### Activate the web adapter

* open Futon on http://&lt;couch&gt;:5984/_utils/ and set attribute *enabled* true in object system.adapter.web.0
* watch the logfile for the line ```info: web.0 http server listening on port ...```
* open http://&lt;host&gt;:&lt;port&gt;/admin


## License

The MIT License (MIT)

Copyright (c) 2014 hobbyquaker, bluefox

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


