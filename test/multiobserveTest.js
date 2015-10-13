'use strict'

let chai = require('chai')
let spies = require('chai-spies')
let multiobserve = require('../src/multiobserve.js')

chai.use(spies)


let expect = chai.expect
let Multiobserve = multiobserve.Multiobserve

describe('Multiobserve', function() {
    describe('.observe() - object property', function() {
        it('should call callback with correct path value and oldValue when observing', function(done) {
            let object = {
                propX: 10,
                propY: {
                    propZ: 33
                }
            }

            Multiobserve.observe(object, function(changes) {
                expect(changes[0]).to.eql({
                    node: object,
                    path: ['propX'],
                    type: 'update',
                    oldValue: 10
                })

                expect(changes[1]).to.eql({
                    node: object.propY,
                    path: ['propY', 'propZ'],
                    type: 'update',
                    oldValue: 33
                })

                done()
            })
            object.propX = 11
            object.propY.propZ = 55
        })

        it('should call callback change releated with add property', function(done) {
            let object = {
                propX: 10,
                propY: {}
            }

            Multiobserve.observe(object, function(changes) {
                expect(changes[0]).to.eql({
                    node: object.propY,
                    path: ['propY', 'propZ'],
                    type: 'add',
                    oldValue: undefined
                })

                done()
            })
            object.propY.propZ = 55
        })

        it('should call callback change releated with delete property', function(done) {
            let object = {
                propX: 10,
                propY: {
                    propZ: 33
                }
            }

            Multiobserve.observe(object, function(changes) {
                expect(changes[0]).to.eql({
                    node: object.propY,
                    path: ['propY', 'propZ'],
                    type: 'delete',
                    oldValue: 33
                })

                done()
            })
            delete object.propY.propZ
        })

        it('should call callback change when adding property and changing its property', function(done) {
            let object = {
                propX: 10,
                propY: {}
            }
            let callTimes = 0;

            Multiobserve.observe(object, function(changes) {
                callTimes++;
                if (callTimes === 1) {
                    expect(changes[0]).to.eql({
                        node: {
                            propZ: {
                                propN: {
                                    propP: 20
                                }
                            }
                        },
                        path: ['propY', 'propZ'],
                        type: 'add',
                        oldValue: undefined
                    })
                    setTimeout(function() {
                        object.propY.propZ.propN.propP = 65
                    }, 0);
                } else {
                    expect(changes[0]).to.eql({
                        node: object.propY.propZ.propN,
                        path: ['propY', 'propZ', 'propN', 'propP'],
                        type: 'update',
                        oldValue: 20
                    })
                    done()
                }
            })
            object.propY.propZ = {
                propN: {
                    propP: 10
                }
            }
            object.propY.propZ.propN.propP = 20
        })

        it('should not call callback when removing property and later changing removed part property', function(done) {
            let object = {
                propX: 10,
                propY: {
                    propZ: {
                        propN: {
                            propP: 10
                        }
                    }
                }
            }
            let tmpPointer = object.propY.propZ
            let callTimes = 0;
            let changeFunctionSpy

            function changeFunction(changes) {
                callTimes++;
                if (callTimes === 1) {
                    expect(changes[0]).to.eql({
                        node: object.propY.propZ.propN,
                        path: ['propY', 'propZ', 'propN', 'propP'],
                        type: 'update',
                        oldValue: 10
                    })

                    setTimeout(function() {
                        delete object.propY.propZ
                    }, 0)
                } else {
                    expect(changes[0]).to.eql({
                        node: {},
                        path: ['propY', 'propZ'],
                        type: 'delete',
                        oldValue: tmpPointer
                    })
                    tmpPointer.propN.propP = 32

                    setTimeout(function() {
                        expect(changeFunctionSpy).to.have.been.called.exactly(2)
                        done()
                    }, 0)
                }
            }

            changeFunctionSpy = chai.spy(changeFunction)

            Multiobserve.observe(object, changeFunctionSpy)
            object.propY.propZ.propN.propP = 69

        })
    })

    describe('.observe() - array property', function() {

        it('should call callback change releated with array push', function(done) {
            let object = {
                propX: 10,
                propY: []
            }

            Multiobserve.observe(object, function(changes) {
                expect(changes[0]).to.eql({
                    path: [ 'propY' ],
                    node: object.propY,
                    type: 'splice',
                    index: 0,
                    removed: [],
                    addedCount: 1
                })

                done()
            })
            object.propY.push(55)
        })

        it('should call callback change releated with array pop', function(done) {
            let object = {
                propX: 10,
                propY: [1,2,3]
            }

            Multiobserve.observe(object, function(changes) {
                expect(changes[0]).to.eql({
                    path: [ 'propY' ],
                    node: object.propY,
                    type: 'splice',
                    index: 2,
                    removed: [ 3 ],
                    addedCount: 0
                })

                done()
            })
            object.propY.pop()
        })

        it('should call callback change related with update array element', function(done) {
            let object = {
                propX: 10,
                propY: {
                    propZ: [1, 2, 3, 4]
                }
            }

            Multiobserve.observe(object, function(changes) {
                expect(changes[0]).to.eql({
                    node: object.propY.propZ,
                    path: ['propY', 'propZ', '2'],
                    type: 'update',
                    oldValue: 3
                })

                done()
            })
            object.propY.propZ[2] = 99
        })

        it('should call callback change related with calling splice on array element', function(done) {
            let object = {
                propX: 10,
                propY: {
                    propZ: [1, 2, 3, 4]
                }
            }

            Multiobserve.observe(object, function(changes) {
                expect(changes[0]).to.eql({
                    node: object.propY.propZ,
                    path: ['propY', 'propZ', '2'],
                    type: 'update',
                    oldValue: 3
                })
                expect(changes[1]).to.eql({
                    node: object.propY.propZ,
                    path: ['propY', 'propZ'],
                    type: 'splice',
                    index: 2,
                    removed: [44],
                    addedCount: 0
                })
                expect(changes[2]).to.eql({
                    node: object.propY.propZ,
                    path: ['propY', 'propZ', '2'],
                    type: 'update',
                    oldValue: 4
                })
                done()
            })
            object.propY.propZ[2] = 44
            object.propY.propZ.splice(2,1)
            object.propY.propZ[2] = 99

        })

        it('should call callback change related with update element within array', function(done) {
            let object = {
                propX: 10,
                propY: {
                    propZ: [{
                        propN : 10
                    },{
                        propN : 11
                    }]
                }
            }

            Multiobserve.observe(object, function(changes) {
                expect(changes[0]).to.eql({
                    node: object,
                    path: ['propX'],
                    type: 'update',
                    oldValue: 10
                })
                expect(changes[1]).to.eql({
                    node: object.propY.propZ[1],
                    path: ['propY', 'propZ', '1', 'propN'],
                    type: 'update',
                    oldValue: 11
                })

                done()
            })
            object.propX = 34
            object.propY.propZ[1].propN = 12
        })

        it('should call callback change releated with update element within array after push', function(done) {
            let object = {
                propX: 10,
                propY: {
                    propZ: []
                }
            }

            let callTimes = 0;
            Multiobserve.observe(object, function(changes) {
                if(callTimes === 0){
                    expect(changes[0]).to.eql({
                        node: object,
                        path: ['propX'],
                        type: 'update',
                        oldValue: 10
                    })
                    expect(changes[1]).to.eql({
                        node: object.propY.propZ,
                        path: [ 'propY' , 'propZ'],
                        type: 'splice',
                        index: 0,
                        removed: [],
                        addedCount: 1
                    })
                    setTimeout(function() {
                        object.propY.propZ[0].propN = 12
                    }, 0);
                } else {
                    expect(changes[0]).to.eql({
                        node: object.propY.propZ[0],
                        path: ['propY', 'propZ', '0', 'propN'],
                        type: 'update',
                        oldValue: 11
                    })

                    done()
                }
                callTimes++
            })
            object.propX = 34
            object.propY.propZ.push({
                propN : 11
            })

        })

        it('should call callback change related with update element within array after push when array contained one element', function(done) {
            let object = {
                propX: 10,
                propY: {
                    propZ: [{
                        propN : 89
                    }]
                }
            }

            let callTimes = 0;
            let tmp
            Multiobserve.observe(object, function(changes) {
                if(callTimes === 0){
                    expect(changes[0]).to.eql({
                        node: object.propY.propZ,
                        path: [ 'propY' , 'propZ'],
                        type: 'splice',
                        index: 1,
                        removed: [],
                        addedCount: 1
                    })
                    setTimeout(function() {
                        object.propY.propZ[0].propN = 1111
                        object.propY.propZ[1].propN = 2222
                    }, 0);
                } else if(callTimes === 1){
                    expect(changes[0]).to.eql({
                        node: object.propY.propZ[0],
                        path: ['propY', 'propZ', '0', 'propN'],
                        type: 'update',
                        oldValue: 89
                    })
                    expect(changes[1]).to.eql({
                        node: object.propY.propZ[1],
                        path: ['propY', 'propZ', '1', 'propN'],
                        type: 'update',
                        oldValue: 11
                    })
                    setTimeout(function() {
                        tmp = object.propY.propZ[0]
                        object.propY.propZ.splice(0,1,{
                            propN : 3333
                        })
                    }, 0);


                } else if(callTimes === 2){
                    expect(changes[0]).to.eql({
                        node: object.propY.propZ,
                        path: [ 'propY' , 'propZ'],
                        type: 'splice',
                        index: 0,
                        removed: [{
                            propN: 1111
                        }],
                        addedCount: 1
                    })
                    setTimeout(function() {
                        tmp.propN = 4444
                        object.propY.propZ[1].propN = 6666 //old 2222
                        object.propY.propZ[0].propN = 5555 //old 3333
                    }, 0);

                } else {
                    expect(changes[0]).to.eql({
                        node: object.propY.propZ[1],
                        path: ['propY', 'propZ', '1', 'propN'],
                        type: 'update',
                        oldValue: 2222
                    })
                    expect(changes[1]).to.eql({
                        node: object.propY.propZ[0],
                        path: ['propY', 'propZ', '0', 'propN'],
                        type: 'update',
                        oldValue: 3333
                    })

                    done()
                }
                callTimes++
            })
            object.propY.propZ.push({
                propN : 11
            })

        })
    })

    describe('.observe() - property filter', function() {
        it('should call filter callback for each object function and array in object tree, also for added ones', function(done) {
            let object = {
                propX: {
                    propK: 'test'
                },
                propY: {
                    propZ: [{
                        propN: {name: 'john'},
                        propM: function () {
                        }
                    }]
                }
            }
            let callTimes = 0;
            Multiobserve.observe(object, function () {
            }, function (node, path) {
                if (callTimes === 0) {
                    expect(node).to.eql(object.propX)
                    expect(path).to.eql(['propX'])
                } else if (callTimes === 1) {
                    expect(node).to.eql(object.propY)
                    expect(path).to.eql(['propY'])
                } else if (callTimes === 2) {
                    expect(node).to.eql(object.propY.propZ)
                    expect(path).to.eql(['propY', 'propZ'])
                } else if (callTimes === 3) {
                    expect(node).to.eql(object.propY.propZ[0])
                    expect(path).to.eql(['propY', 'propZ', '0'])
                } else if (callTimes === 4) {
                    expect(node).to.eql(object.propY.propZ[0].propN)
                    expect(path).to.eql(['propY', 'propZ', '0', 'propN'])
                } else if (callTimes === 5) {
                    expect(node).to.eql(object.propY.propZ[0].propM)
                    expect(path).to.eql(['propY', 'propZ', '0', 'propM'])
                } else if (callTimes === 6) {
                    expect(node).to.eql(object.propY.propZ[1])
                    expect(path).to.eql(['propY', 'propZ', '1'])
                } else if (callTimes === 7) {
                    expect(node).to.eql(object.propY.propZ[1].propN)
                    expect(path).to.eql(['propY', 'propZ', '1', 'propN'])
                } else if (callTimes === 8) {
                    expect(node).to.eql(object.propY.propZ[1].propM)
                    expect(path).to.eql(['propY', 'propZ', '1', 'propM'])
                    done()
                }
                callTimes++
                return true
            })

            object.propX = {
                propK : 'hello'
            }
            object.propY.propZ.push({
                propN: {name: 'patric'},
                propM: function () {
                }
            })
        })
    })

    describe('.findNode()', function() {
        it('should return node', function(done) {
            let object = {
                propX: {
                    propK: 'test'
                },
                propY: {
                    propZ: [{
                        propN: {name: 'john'},
                        propM: function () {
                        }
                    }]
                }
            }
            const node = Multiobserve.findNode(object, ['propX','propK'])
            expect(node).to.eql(object.propX.propK)
            done()
        })
    })

    describe('.findNode()', function() {
        it('should return undefined', function(done) {
            let object = {
                propX: {
                    propK: 'test'
                },
                propY: {
                    propZ: [{
                        propN: {name: 'john'},
                        propM: function () {
                        }
                    }]
                }
            }
            const node = Multiobserve.findNode(object, ['propY','propZ','propZ','propN','propU'])
            expect(node).to.eql(undefined)
            done()
        })
    })

    describe('.methodsToPaths()', function() {
        it('should find all methods', function(done) {
            let object = {
                method1: function(){},
                prop1 : {
                    method2 : function(){},
                    arr1 : [{
                        method3 : function(){},
                        prop2 : {
                            method4 : function(){}
                        }
                    }]
                }

            }
            const methods = Multiobserve.methodsToPaths(object)
            expect(methods.length).to.eql(4)
            expect(methods[0]).to.eql(['method1'])
            expect(methods[1]).to.eql(['prop1', 'method2'])
            expect(methods[2]).to.eql(['prop1', 'arr1', '0', 'method3'])
            expect(methods[3]).to.eql(['prop1', 'arr1', '0', 'prop2', 'method4'])
            done()
        })
    })

    /*describe('.observe() - custom modifier', function() {
        it('should create swap modifier', function(done) {
            let object = {
                entities : [{
                    name : 'player1',
                    position : {
                        x : 1,
                        y : 2
                    }
                },
                {
                    name : 'player2',
                    position : {
                        x : 3,
                        y : 4
                    }
                }]
            }

            const handler = Multiobserve.observe(object, function(changes) {
                expect(changes[0]).to.eql({
                    node: object,
                    path: ['entities', 'player1'],
                    type: 'move',
                    msg : {
                        position : {
                            x : 10,
                            y : 8
                        }
                    }
                })
            })

            let moveFunction = handler.createFunction("move", function(x,y){
                this.x = x;
                this.y = y;
            })

            function move(handler, entity, position){
                handler.performChange('move', function(object, notify){
                    let target = object.entities.find((el) => {el.name === entity})
                    if(target !== undefined){
                        target.position.x = position.x
                        target.position.y = position.y

                        notify(['entities', entity ], {
                            position : position
                        })
                    }
                })
            }

            move(handler, 'player1', {x:10,y:8})

            done()
        })
    })*/
})
