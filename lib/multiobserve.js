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

function observeObject(notifier, object, path) {
    function func(changes) {
        changes.forEach(function(change) {
            if(change.type === 'add'){
                observeDeep(notifier, change.object, path)
            } else if(change.type === 'delete'){
                //Object.unobserve(change.oldValue, func)
                unobserveDeep(change.oldValue, func)
            }
            notifier.notify({
                path: path.concat(change.name),
                node: change.object,
                type: change.type,
                name: change.name,
                oldValue: change.oldValue
            })
        })
    }
    
    Object.observe(object, func)
}

function observeArray(notifier, object, path) {
    Array.observe(object, function(changes) {
        changes.forEach(function(change) {
            notifier.notify({
                path: path.concat(change.name),
                node: change.object,
                type: change.type,
                name: change.name,
                index: change.index,
                removed: change.removed,
                addedCount: change.addedCount,
                oldValue: change.oldValue
            })
        })
    })
}

function unobserveDeep(object, observeFunc) {
    for (var property in object) {
        if (!object.hasOwnProperty(property)) continue

        var propObject = object[property]

        if (typeOf(propObject) === 'object') {
            Object.unobserve(propObject, observeFunc)
            unobserveDeep( propObject, observeFunc)
        }
    }
}

function observeDeep(notifier, object, path) {
    for (var property in object) {
        if (!object.hasOwnProperty(property)) continue

        var currPath = path.concat([property])
        var propObject = object[property]

        if (typeOf(propObject) === 'object') {
            observeObject(notifier, propObject, currPath)
            observeDeep(notifier, propObject, currPath)
        } else if(typeOf(propObject) === 'array'){
            observeArray(notifier,propObject,currPath)
            propObject.forEach(function(element){
                observeDeep(notifier, element, currPath)
            })
        }
    }

}


exports.deep = function(object) {
    var notifier = Object.getNotifier(object)
    observeDeep(notifier, object, [])
    return object
}