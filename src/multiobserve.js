'use strict'

const objects = new WeakMap()

function typeOf(value) {
    let s = typeof value
    if (s === 'object') {
        if (value) {
            if (value instanceof Array) {
                s = 'array'
            }
        }
        else {
            s = 'null'
        }
    }
    return s
}

function observeObject(ctx, object, path) {
    let func = function (changes) {
        changes.forEach(function(change) {
            ctx.notify({
                path: path.concat(change.name),
                type: change.type,
                name: change.name,
                newValue : change.object[change.name],
                oldValue: change.oldValue
            })
            if(change.type === 'add'){
                if(!ctx.filter(object,path)) { return }
                observeDeepObject(ctx, change.object, path)
            } else if(change.type === 'delete') {
                unobserveDeepObject(ctx, change.oldValue, path.concat(change.name))
            }
        })
    }
    ctx.setHandler(object, path, func)
    Object.observe(object, func)
}

function observeArray(ctx, object, name, path) {
    Array.observe(object, function(changes) {
        changes.forEach(function(change) {
            let msg = null

            if(change.type === 'update'){
                msg = {
                    path: path.concat(change.name),
                    type: 'update',
                    name: change.name,
                    newValue : change.object[change.name],
                    oldValue: change.oldValue

                }
            } else if (change.type === 'splice'){
                let added = change.object.slice(change.index,change.index+change.addedCount)
                msg = {
                    path: path,
                    type: 'update',
                    arrayChangeType: change.type,
                    name: name,
                    index: change.index,
                    removedCount: change.removed.length,
                    added: added,
                }

                added.forEach(function(element){
                    if(typeOf(element) !== 'array' && typeOf(element) !== 'object' && typeOf(element) !== 'function') { return }
                    if(!ctx.filter(element,path.concat(String(change.index)))) { return }
                    observeObject(ctx,element,path.concat(String(change.index)))
                    observeDeepObject(ctx,element,path.concat(String(change.index)))
                })
                change.removed.forEach(function(element){
                    if(typeOf(element) === 'array'){
                        Array.unobserve(element, ctx.getHandler(element,path.concat(String(change.index))))
                        unobserveDeepArray(ctx, element, change.path)
                    } else if (typeOf(element) === 'object' || typeOf(element) === 'function') {
                        Object.unobserve(element, ctx.getHandler(element,path.concat(String(change.index))))
                        unobserveDeepObject(ctx, element, change.path)
                    }

                })
            }

            ctx.notify(msg)
        })
    })
}

function unobserveDeepObject(ctx, object, path) {
    Object.keys(object).forEach(function(property){
        let propObject = object[property]

        if (typeOf(propObject) === 'object') {
            Object.unobserve(propObject, ctx.getHandler(propObject, path.concat(property)))
            unobserveDeepObject( ctx, propObject, path.concat(property))
        } else if(typeOf(propObject) === 'array'){
            Array.unobserve(propObject, ctx.getHandler(propObject,path.concat(property)))
            unobserveDeepArray(ctx, propObject, path.concat(property))
        }
    })
}

function unobserveDeepArray(ctx, array, path) {
    array.forEach(function(element, index){

        if (typeOf(element) === 'object' || typeOf(element) === 'function') {
            Object.unobserve(element, ctx.getHandler(element, path.concat(String(index))))
            unobserveDeepObject( ctx, element, path.concat(String(index)))
        } else if(typeOf(element) === 'array'){
            Array.unobserve(element, ctx.getHandler(element,path.concat(String(index))))
            unobserveDeepArray(ctx, array, path.concat(String(index)))
        }
    })
}

function observeDeepObject(ctx, object, path) {
    Object.keys(object).forEach(function(property){
        const currPath = path.concat([property])
        const propObject = object[property]

        if (typeOf(propObject) === 'object' || typeOf(propObject) === 'function') {
            if(!ctx.filter(propObject,currPath)) { return }
            observeObject(ctx, propObject, currPath)
            observeDeepObject(ctx, propObject, currPath)
        } else if(typeOf(propObject) === 'array'){
            if(!ctx.filter(propObject,currPath)) { return }
            observeArray(ctx,propObject,property,currPath)
            observeDeepArray(ctx, propObject, currPath)
        }
    })
}

function observeDeepArray(ctx, array, path) {
    array.forEach(function(element, index) {
        const currPath = path.concat(String(index))

        if(typeOf(element) === 'array') {
            if(!ctx.filter(element,currPath)) { return }
            observeArray(ctx,element,currPath)
            observeDeepArray(ctx, element, currPath)
        } else if(typeOf(element) === 'object' || typeOf(element) === 'function') {
            if(!ctx.filter(element,currPath)) { return }
            observeObject(ctx,element,currPath)
            observeDeepObject(ctx, element, currPath)
        }
    })
}

function comparePaths(path1, path2){
    return (path1.length === path2.length) && path1.every(function(element, index) {
        return element === path2[index]
    })
}

function findAndAddMethod(object, path, methods){
    Object.getOwnPropertyNames(object).forEach(function(prop){
        if(typeOf(object[prop]) === 'function'){
            methods.push(path.concat(prop))
        }
        if(typeOf(object[prop]) === 'object'){
            findAndAddMethod(object[prop],path.concat(prop), methods)
        }
        if(typeOf(object[prop]) === 'array'){
            object[prop].forEach(function(el, index){
                findAndAddMethod(el,path.concat(prop).concat(String(index)), methods)
            })
        }
    })
}

exports.Multiobserve = {
    observe(object, callback, filterCallback){
        const root = {}
        const rootNotifier = Object.getNotifier(root)
        const handlers = new WeakMap()
        const ctx = Object.freeze({
            notify(msg) {
                rootNotifier.notify(msg)
            },
            setHandler(object, path, handler ) {
                let ph = handlers.get(object)
                let o = {
                    handler,
                    path
                }
                if(ph === undefined){
                    ph = [o]
                    handlers.set(object, ph)
                } else {
                    if(!ph.some(function(el){
                        return comparePaths(el.path, path)
                    })){
                        ph.push(o)
                    }
                }

            },
            getHandler(object, path){
                let ph = handlers.get(object)
                let result = void(0)
                ph.forEach(function(el){
                    if(comparePaths(el.path, path)){
                        result = el.handler
                    }
                })
                return result
            },
            filter(node, path){
                return filterCallback === undefined ? true : filterCallback(node, path)
            }
        })
        observeObject(ctx, object, [])
        observeDeepObject(ctx, object, [])
        Object.observe(root,function(changes){
            callback(changes.map(function(change){
                if(change.arrayChangeType === 'splice'){
                    return {
                        path : change.path || change.name,
                        type : 'splice',
                        index: change.index,
                        removedCount: change.removedCount,
                        added: change.added
                    }
                } else if(change.type === 'update' || change.type === 'add' || change.type === 'delete'){
                    return {
                        type : change.type,
                        path : change.path || change.name,
                        newValue : change.newValue,
                        oldValue : change.oldValue
                    }
                }
            }))
        })
        objects.set(object, {
            root,
            rootNotifier,
            handlers,
            ctx
        })
    },
    findNode(object, path){
        if(!Array.isArray(path)) {
            return undefined
        }
        let curr = object
        path.every(function(node) {
            if (curr[node] !== undefined) {
                curr = curr[node]
                return true
            } else {
                curr = undefined
                return false
            }
        })
        return curr
    },
    methodsToPaths(object){
        const methods = []

        findAndAddMethod(object, [], methods)
        return methods
    }
}
