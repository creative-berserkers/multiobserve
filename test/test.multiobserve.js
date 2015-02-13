'use strict'

let chai = require('chai')
let spies = require('chai-spies')
let multiobserve = require('../lib/multiobserve.js')

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

            function changeFunction(changes) {
                callTimes++;
                if (callTimes === 1) {
                    expect(changes[0]).to.eql({
                        node: object.propY.propZ.propN,
                        path: ['propY', 'propZ', 'propN', 'propP'],
                        type: 'update',
                        oldValue: 10,
                    })

                    setTimeout(function() {
                        delete object.propY.propZ
                    }, 0)
                } else {
                    expect(changes[0]).to.eql({
                        node: {},
                        path: ['propY', 'propZ'],
                        type: 'delete',
                        oldValue: tmpPointer,
                    })
                    tmpPointer.propN.propP = 32

                    setTimeout(function() {
                        expect(changeFunctionSpy).to.have.been.called.exactly(2)
                        done()
                    }, 0)
                }
            }

            let changeFunctionSpy = chai.spy(changeFunction)

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

        it('should call callback change releated with update array element', function(done) {
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
        
        it('should call callback change releated with calling splice on array element', function(done) {
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
        
        it('should call callback change releated with update element within array', function(done) {
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

            let callTimes = 0;
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
                    oldValue: 11,
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
                        oldValue: 11,
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
        
        it('should call callback change releated with update element within array after push when array contained one element', function(done) {
            let object = {
                propX: 10,
                propY: {
                    propZ: [{
                        propN : 89
                    }]
                }
            }

            let callTimes = 0;
            Multiobserve.observe(object, function(changes) {
                console.log(changes)
                console.log(changes)
                if(callTimes === 0){
                    expect(changes[0]).to.eql({
                        node: object,
                        name: ['propX'],
                        type: 'update',
                        oldValue: 10
                    })
                    expect(changes[1]).to.eql({ 
                        node: object.propY.propZ,
                        path: [ 'propY' , 'propZ'],
                        type: 'splice',
                        index: 1,
                        removed: [],
                        addedCount: 1
                    })
                    setTimeout(function() {
                        object.propY.propZ[1].propN = 12
                    }, 0);
                } else {
                    expect(changes[0]).to.eql({
                        node: object.propY.propZ[1],
                        path: ['propY', 'propZ', '1', 'propN'],
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

    })
})