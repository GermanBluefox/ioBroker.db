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

### Tree structure

Objects can have a *parent* attribute containing the *id* of their parent to build a tree structure. (Restriction to 3 Levels?)

### Object types

* state
* channel - object to group one or more states
* device - object to group one or more channels or state
* enum
* host
* adapter
* instance
* meta
* config - configuration
* path
* file - parent has to be a path object



### Mandatory attributes for specific types

#### state

* common.name
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

* common.name

#### device

* common.name

#### meta

#### adapter

* common.name
* common.mode
* common.enabled (value should be false so new instances are disabled by default)
* common.language (possible values: javascript, other)


#### instance

* common.name
* common.mode
* common.host
* common.enabled

#### host

#### config