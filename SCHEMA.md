# Database Schema

## States

A state is an object with these attributes:

* val - the actual value - can be any type that is JSON-encodeable
* ack - a boolean flag indicating if the target system has acknowledged the value
* ts - a unix timestamp indicating the last update of the state
* lc - a unix timestamp indicating the last change of the states actual value
* (exipre - a integer value that can be used to set states that expire after a given number of seconds)


## Objects

### Namespaces

system.
system.adapter.     - Adapter Processes
system.host.        - Controller Processes


### Object types

* state
* channel - object to group one or more states
* device -  object to group one or more channels or states
* meta
* adapter
* instance
* host

