function typeOf(value) {
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (value instanceof Array) {
                s = 'array'
            } else {
                s = 'object'
            }
        }
        else {
            s = 'null';
        }
    }
    return s;
}

function observeDeep(path, object, callback) {
    for (var property in object) {
        if (object.hasOwnProperty(property)) {
            if (typeOf(object[property]) === 'object') {
                Object.observe(object[property], function(changes) {
                    console.log('called 1')
                    var result = changes.map(function(change) {
                        if (change.type === 'update') {
                            return {
                                type: 'update',
                                path: path,
                                value: change.object[change.name],
                                oldValue: change.oldValue
                            }
                        }
                    })
                    callback(result)
                })
                observeDeep(path.concat([property]), object[property], callback)
            }
        }
    }

}


exports.multiobserve = {
    observe: function(object, callback) {
        Object.observe(object, function(changes) {
            var result = changes.map(function(change) {
                console.log('called 1')
                if (change.type === 'update') {
                    return {
                        type: 'update',
                        path: [],
                        value: change.object[change.name],
                        oldValue: change.oldValue
                    }
                }
            })
            callback(result)
        })
        observeDeep([], object, callback)

        return object
    }
}