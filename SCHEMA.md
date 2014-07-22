# Database Schema

## IDs

a string with a maximum length of 250 bytes, hierarchically structured, levels separated by dots.


### Namespaces

* system.
* system.host.        - Controller processes
* system.config.      - System settings, like language
* system.adapter.     - Adapter processes
* system.adapter.&lt;adapter-name&gt; - default config of an adapter
* &lt;adapter-name&gt;.&lt;instance-number&gt;. - An adapters namespace
* enum.               - Enumerations
* hist.               - History Data

## States

getState method and stateChange event delivers an object with all attributes except expire

for "setState" method everything except "val" is optional, "from" is set automatically by the "setState" method. "ack" defaults to false, "ts" and "lc" are set as expected

attributes for getState/stateChange/setState object:

* val  - the actual value - can be any type that is JSON-encodable
* ack  - a boolean flag indicating if the target system has acknowledged the value
* ts   - a unix timestamp indicating the last update of the state
* lc   - a unix timestamp indicating the last change of the state's actual value
* from - adapter instance that did the "setState"
* expire - a integer value that can be used to set states that expire after a given number of seconds. Can be used ony with setValue. After the value expires, it disappears from redisDB.





Every *state* has to be represented by an object of the type state containing Meta-Data for the state. see below.



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

* state    - parent should be of type channel, device, instance or host
* channel  - object to group one or more states. parent should be device
* device   - object to group one or more channels or state. should have no parent.
* enum     - objects holding a array in common.members that points to states, channels, devices or files. enums can have a parent enum (tree-structure possible)
* host     - a host that runs a controller process
* adapter  - the default config of an adapter. presence also indicates that the adapter is successfully installed. (suggestion: should have an attribute holding an array of the hosts where it is installed)
* instance - parent has to be of type adapter
* meta     - rarely changing meta information that a adapter or his instances needs
* config   - configurations
* path     - a virtual path. parent has to be another path or an ancestor of vfs.root
* file     - a object with an attached file - parent has to be of type path


### Attributes for specific types

#### state

attributes:

* common.type (optional - default is mixed==any type) (possible values: number, string, boolean, array, object, mixed)
* common.min  (optional)
* common.max  (optional)
* common.unit (optional)
* common.def  (optional - the default value)
* common.desc (optional, string)
* common.oper.read  (boolean, mandatory) - true if read is possible for this state
* common.oper.write (boolean, mandatory) - true if write is possible for this state

##### state common.history

History function needs the history adapter

fifo length is reduced to min when max is hit. set to null or leave undefined to use defaults

for a list of transports see history adapter README

* common.history (optional)
* common.history.fifo (optional, high speed history storage)
* common.history.fifo.enabled (boolean)
* common.history.fifo.min (integer, min fifo length)
* common.history.fifo.max (integer, max fifo length)
* common.history.fifo.transports (array of strings, log-transports data should be sent to after leaving the fifo)
* common.history.direct.enabled (boolean)
* common.history.direct.transports (array of strings, log-transports data should be sent on change)



* common.role (indicates how this state should be represented in user interfaces)

##### state common.role

possible values:

* text (common.type = string)
* html (common.type = string)
* list (common.type = array)
* list.horizontal
* ...

* value             (common.type=number, common.oper.write=false)
* value.temperature (common.type=number, common.oper.write=false, common.unit='°C' or '°F' or '°K')
* value.humidity    (common.type=number, common.oper.write=false)
* value.brightness  (common.type=number, common.oper.write=false)
* ...

* button (common.type=boolean)
* button.long
* button.stop
* button.play
* button.pause
* button.forward
* button.reverse
* button.fastforward
* button.fastreverse
* ...

* indicator             (common.type=boolean)
* indicator.working     (common.type=boolean, indicates that something the target systems is doing changes on the parent channel)
* indicator.direction   (common.type=number or string, indicates up/down, left/right, 4-way switches, wind-direction, ... )
* indicator.maintenance (common.type=boolean, indicates system warnings/errors, alarms, service messages, battery empty or stuff like that)
* indicator.maintenance.desc (common.type=string, indicates system warnings/errors, alarms, service messages, battery empty or stuff like that as a text, e.g "low battery")
* ...

* level             (common.type=number, common.oper.write=true)
* level.dimmer      (common.type=number, common.oper.write=true)
* level.blind       (common.type=number, common.oper.write=true)
* level.temperature (common.type=number, common.oper.write=true)
* ...

* switch (common.type=boolean, common.oper.write=true)  - (QUESTION) relay?(See below why)
* ...



#### channel

##### channel common.role

suggestion: the channel-objects common.role should/could imply a set of mandatory and/or optional state-child-objects

possible values:

* info          - (QUESTION) Currency or shares rate? What else?
* forecast      - weather forecast
* media         - common media channel
* media.music   - media player, like sonos, yamaha and so on
* media.tv      - TV 
* media...
* thermo        - Monitor or control the temperature, humidity and so on
* thermo.heat 
* thermo.cool
* dimmer        - Light dimmer
* switch        - Light or actor switch. Normally can be OFF or ON (may be relay?, see by remote why)
* shutter       - Window shutter control
* color         - Light control with ability of color changing
* color.ct      - color temperature °K
* color.rgb     - Set color in RGB
* color.hsl     - Set color in Hue/Saturation/Lightness
* color.hslct   - Set color in Hue/Saturation/Lightness with Kelvin
* remote        - (QUESTION) ??? Button on the wall? Remote with buttons? (Possible names: keyPad, buttons, remote, keySwitch, switch - if other switch will be "relay")  
* contact       - E.g. window or door contact, water leak sensor, fire sensor
* contact.doorwindow
* contact.water
* contact.fire
* phone         - fritz box, speedport and so on
* ...


##### switch - Attributes description
* switch                       - mandatory (common.type=boolean, common.oper.write=true)
* text.description             - optional
* indicator.maintenance        - optional
* indicator.maintenance.desc   - optional
(QUESTION)  Where must be room and role? in enum.rooms.common.members ?

##### dimmer - Attributes description
* level.dimmer                 - mandatory (common.type=boolean, common.oper.write=true) - (QUESTION) Must it be readable too? 
* value.dimmer                 - or must it be used? (QUESTION)
* text.description             - optional
* indicator.maintenance        - optional
* indicator.maintenance.desc   - optional

#### device

#### enum

* common.members - optional array of member IDs


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
* common.browse (search in the home network the devices automatically) 



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

#### path (better name it dir?)

id *system.vfs.&lt;name&gt;

* common.name (name of the directory)
* common.children (better name it common.subdirs?) (array of child objects with type path)
* common.files (array of child objects with type file)

#### file

* parent (id of a path object)
* common.size (size in kBytes)
* common.mine (mime-type)

one CouchDB-Attachment - the file itself
