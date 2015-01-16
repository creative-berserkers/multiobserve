# multiobserve

Simple library to deeply observe objects. Note that this is still very unstable.

For example, if we have following object that we want to observe:

```js
var object = {
    property: {
        a: 1,
        b: {
            c: 'hello'
        }
    }
}
```

and we listen on it like this:

```js
multiobserve.observe(object, function(changes) {})
```

and then we change c property like:

```js
object.property.b.c = 'bye'
```

we will get callback from library with the change that will look like:

```js
{
    path : ['property', 'b', 'c'],
    value : 'bye',
    oldValue : 'hello'
}
```

