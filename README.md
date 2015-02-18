# multiobserve

Simple library to deeply observe objects.

It can be used client side but require Object.observe to be implemented.

#Observing objects

For example, we have following object that we want to observe:

```js
var object = {
    propX : 10,
    propY : {
        propZ : 'hello'
    },
    propQ: function(){}
}
```

to observe each subproperty object and array in tree structure:

```js
var Multiobserve = require('multiobserve').Multiobserve

Multiobserve.observe(object, function(changes) {})
```

now if *propZ* is changed like this:

```js
object.propY.propZ = 'bye'
```

we will get callback from library with the change:

```js
{
    type: 'update', //A string indicating the type of change taking place. One of "add", "update", "delete" or "splice".
    path : ['propY', 'propZ'], //path from root
    node : {propZ: 'hello'}, //this is object in object tree that was changed
    oldValue : 'hello'
    //index : 0 //this is the index of change - splice only
    //removed : [] //array of removed elements - splice only
    //addedCount : 0//number of elements added - splice only
}
```
You can provide an optional callback as third parameter which will be called for each property node and by returning *true* the node will be observed, otherwise skipped. For example:

```js
Object.observe(object, function(changes) {}, function(node, path){
    if(typeof node === 'function') { return false }
    else  { return true }
})
``



