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

function observeObject(ctx, object, path) {
    ctx.handlers[object] = function (changes) {
        changes.forEach(function(change) {
            if(change.type === 'add'){
                observeDeep(ctx, change.object, path)
            } else if(change.type === 'delete'){
                //Object.unobserve(change.oldValue, func)
                unobserveDeep(ctx, change.oldValue)
            }
            ctx.notifier.notify({
                path: path.concat(change.name),
                node: change.object,
                type: change.type,
                name: change.name,
                oldValue: change.oldValue
            })
        })
    }
    
    Object.observe(object, ctx.handlers[object])
}

function observeArray(ctx, object, path) {
    Array.observe(object, function(changes) {
        changes.forEach(function(change) {
            ctx.notifier.notify({
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

function unobserveDeep(ctx, object) {
    for (var property in object) {
        if (!object.hasOwnProperty(property)) continue

        var propObject = object[property]

        if (typeOf(propObject) === 'object') {
            Object.unobserve(propObject, ctx.handlers[propObject])
            unobserveDeep( propObject, propObject)
        }
    }
}

function observeDeep(ctx, object, path) {
    for (var property in object) {
        if (!object.hasOwnProperty(property)) continue

        var currPath = path.concat([property])
        var propObject = object[property]

        if (typeOf(propObject) === 'object') {
            observeObject(ctx, propObject, currPath)
            observeDeep(ctx, propObject, currPath)
        } else if(typeOf(propObject) === 'array'){
            observeArray(ctx,propObject,currPath)
            propObject.forEach(function(element){
                observeDeep(ctx, element, currPath)
            })
        }
    }

}


exports.deep = function(object) {
    var ctx = {
        notifier : Object.getNotifier(object),
        handlers : []
    }
    observeDeep(ctx, object, [])
    return object
}