# multiobserve

Simple library to deeply observe objects. Note that this is still very unstable.

It can be used client side but require Object.observe to be implemented.

For example, we have following object that we want to observe:

```js
var object = {
    propX : 10,
    propY : {
        propZ : 'hello'
    }
}
```

to observe each subproperty object and array in tree structure:

```js
var deep = require('multiobserve').Multiobserve

Object.observe(deep(object), function(changes) {})
```

and then if we change propZ property like:

```js
object.propY.propZ = 'bye'
```

we will get callback from library with the change that will look like:

```js
{
    type: 'update', //A string indicating the type of change taking place. One of "add", "update", or "delete".
    path : ['propY', 'propZ'], //path from root
    object: { propX : 10, propY : { propZ : 'hello' } } //root object
    node : {propZ: 'hello'}, //this is object in object tree that was changed
    name : 'propZ',
    oldValue : 'hello'
}
```
You can provide an optional callback as third parameter which will be called for each property node and by returning true the node will be observed, otherwwise skipped(not implemented yet)

```js
Object.observe(deep(object), function(changes) {}, function(node, path){})

``

Note that if you change root object the path will be undefined and node will be undefined

