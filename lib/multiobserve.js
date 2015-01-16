function typeOf(value) {
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (value instanceof Array) {
                s = 'array'
            }
        }
        else {
            s = 'null';
        }
    }
    return s;
}

function observeSpecific(object, path, callback) {
    Object.observe(object, function(changes) {
        var result = changes.map(function(change) {
            if (change.type === 'update') {
                return {
                    type: 'update',
                    path: path.concat(change.name),
                    value: change.object[change.name],
                    oldValue: change.oldValue
                }
            }
        })
        callback(result)
    })
}

function observeDeep(object, path, callback) {
    for (var property in object) {
        if ( ! object.hasOwnProperty(property)) continue
        
        var currPath = path.concat([property])
        var propObject = object[property]
        
        if (typeOf(propObject) === 'object') {
            observeSpecific(propObject, currPath, callback)
            observeDeep(propObject, currPath, callback)
        }
    }

}


exports.multiobserve = {
    observe: function(object, callback) {
        observeSpecific(object,[], callback)
        observeDeep(object,[], callback)

        return object
    }
}