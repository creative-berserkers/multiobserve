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

function observeArray(ctx, object,name, path) {
    Array.observe(object, function(changes) {
        changes.forEach(function(change) {
            var msg = null
            
            if(change.type === 'update'){
                msg = {
                    path: path.concat(change.name),
                    node: change.object,
                    type: 'update',
                    name: change.name,
                    oldValue: change.oldValue
                }
            } else if (change.type === 'splice'){
                
                msg = {
                    path: path,
                    node: change.object,
                    type: 'update',
                    arrayChangeType: change.type,
                    name: name,
                    index: change.index,
                    removed: change.removed,
                    //added: change.object.slice(change.index,change.addedCount),
                    addedCount: change.addedCount,
                    oldValue: change.oldValue
                }
                
                var added = change.object.slice(change.index,change.index+change.addedCount);
                //console.log('added')
                //console.log(added)
                
                added.forEach(function(element){
                    if(typeOf(element) !== 'array' && typeOf(element) !== 'object' && typeOf(element) !== 'function') return
                    observeObject(ctx,element,path.concat(String(change.index)))
                    observeDeep(ctx,element,path.concat(String(change.index)))
                })
                //console.log('removed')
                //console.log(change.removed)
                change.removed.forEach(function(element){
                    if(typeOf(element) !== 'array' && typeOf(element) !== 'object' && typeOf(element) !== 'function') return
                    unobserveDeep(ctx, element)
                })
            } else if(change.type === 'delete'){
                console.log('dddd')
            } else {
                console.log('vvvv')
            }
            
            ctx.notifier.notify(msg)
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
            observeArray(ctx,propObject,property,currPath)
            var index = 0
            propObject.forEach(function(element){
                if(typeOf(element) !== 'array' && typeOf(element) !== 'object' && typeOf(element) !== 'function') return
                observeObject(ctx,element,currPath.concat(String(index)))
                observeDeep(ctx, element, currPath.concat(String(index)))
                index++;
            })
        }
    }

}

exports.Multiobserve = {
    observe: function(object, callback){
        var root = {}
        var ctx = {
            notifier : Object.getNotifier(root),
            handlers : []
        }
        observeObject(ctx, object, [])
        observeDeep(ctx, object, [])
        Object.observe(root,function(changes){
            callback(changes.map(function(change){
                if(change.arrayChangeType === 'splice'){
                    return {
                        node : change.node || object,
                        path : change.path || change.name,
                        type : 'splice',
                        index: change.index,
                        removed: change.removed,
                        addedCount: change.addedCount
                    }
                } else if(change.type === 'update' || change.type === 'add' || change.type === 'delete'){
                    return {
                        node : change.node || object,
                        path : change.path || change.name,
                        type : change.type,
                        oldValue : change.oldValue,
                    }
                }
                return {}
            }))
        })
        return object
    }
}