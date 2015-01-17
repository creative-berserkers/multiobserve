# multiobserve

Simple library to deeply observe objects. Note that this is still very unstable.

For example, if we have following object that we want to observe:

```js
var object = {
    propX : 10,
    propY : {
        propZ : 'hello'
    }
}
```

and we listen on it like this:

```js
var deep = require('multiobserve').deep

Object.observe(deep(object), function(changes) {})
```

and then we change propZ property like:

```js
object.propY.propZ = 'bye'
```

we will get callback from library with the change that will look like:

```js
{
    path : ['propY', 'propZ'], //path from root
    object: { propX : 10, propY : { propZ : 'hello' } } //root object
    node : {propZ: 'hello'}, //this is object in object tree that was changed
    value : 'bye',
    oldValue : 'hello'
}
```

Note that if you change root object the path will be undefined and node will be undefined

