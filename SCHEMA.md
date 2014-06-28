# Database Schema

## IDs

a string with a maximum length of 250 bytes, hierarchically structured, levels separated by dots.


### Namespaces

* system.
* system.host.        - Controller processes
* system.adapter.     - Adapter processes
* system.adapter.&lt;adapter-name&gt; - default config of an adapter
* &lt;adaper-name&gt;.&lt;instance-number&gt;. - An adapters namespace

## States

A state is an object with following attributes:

* val - the actual value - can be any type that is JSON-encodeable
* ack - a boolean flag indicating if the target system has acknowledged the value
* ts - a unix timestamp indicating the last update of the state
* lc - a unix timestamp indicating the last change of the states actual value
* (exipre - a integer value that can be used to set states that expire after a given number of seconds)

Every state has to be represented by an object of the type state.


## Objects

### Mandatory attributes

Following attributes have to exist in every object:

* _id
* type (see below for possible values)
* common (includes an object with mandatory attributes for specific type)
* native

### Optional attributes

* name
* parent

### Tree structure

Objects can have a *parent* attribute containing the *id* of their parent to build a tree structure. This should be
limited to 3 levels (except for objects of type path)

### Object types

* state - parent should be of type channel, device, instance or host
* channel - object to group one or more states. parent should be device
* device - object to group one or more channels or state. should have no parent.
* enum
* host
* adapter
* instance - parent has to be of type adapter
* meta
* config - configuration
* path
* file - parent has to be of type path



### Mandatory attributes for specific types

#### state

* common.type (possible values: number, string, boolean, array, object)
* common.role (indicates how this state should be represented in user interfaces)

##### common.role

* button
* button.long
* button.stop
* indicator
* indicator.state
* indicator.working
* indicator.direction
* indicator.maintenance
* level
* level.dimmer
* level.blind
* level.temperature
* switch
* value
* value.temperature
* value.humidity
* value.brightness




#### channel



#### device



#### meta

id

 * *&lt;adapter-name&gt;.&lt;instance-number&gt;.meta.&lt;meta-name&gt;*
 * *&lt;adapter-name&gt;.meta.&lt;meta-name&gt;*
 * system.*meta.&lt;meta-name&gt;*



#### adapter

id *system.adapter.&lt;adapter.name&gt;*

* common.mode
* common.enabled (value should be false so new instances are disabled by default)
* common.language (possible values: javascript, other)


#### instance

id *system.adapter.&lt;adapter.name&gt;.&lt;instance-number&gt;*

* common.host (host where the adapter should be started at - object *system.host.&lt;host&gt;* must exist
* common.enabled
* common.mode (possible values see below)

##### instance common.mode

* **daemon** - always running process (will be restarted if process exits)
* **subscribe** - is started when state *system.adapter.&lt;adapter-name&gt;.&lt;instance-number&gt;.alive* changes to *true*. Is killed when *.alive* changes to *false* and sets *.alive* to *false* if process exits (will **not** be restarted when process exits)
* **schedule** - is started by schedule found in *system.adapter.&lt;adapter-name&gt;.&lt;instance-number&gt;.schedule* - reacts on changes of *.schedule* by rescheduling with new state



#### host

id *system.host.&lt;host&gt;*

#### config

#### path

* common.children (array of child objects of the type path)

#### file

* parent (id of a path object)
* common.size (size in kBytes)
* CouchDB-Attachment
