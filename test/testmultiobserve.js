var chai = require('chai')
var spies = require('chai-spies')
var multiobserve = require('../lib/multiobserve.js')

chai.use(spies)


var expect = chai.expect
var deep = multiobserve.deep

describe('multiobserve', function() {
    describe('.deep()', function() {
        it('should call callback with correct path value and oldValue when observing', function(done) {
            var object = {
                propX: 10,
                propY: {
                    propZ: 33
                }
            }

            Object.observe(deep(object), function(changes) {
                expect(changes[0]).to.eql({
                    object: object,
                    name: 'propX',
                    type: 'update',
                    oldValue: 10
                })

                expect(changes[1]).to.eql({
                    object: object,
                    name: 'propZ',
                    type: 'update',
                    node: object.propY,
                    oldValue: 33,
                    path: ['propY', 'propZ']
                })

                done()
            })
            object.propX = 11
            object.propY.propZ = 55
        })
        
        it('should call callback change releated with array push', function(done) {
            var object = {
                propX: 10,
                propY: []
            }

            Object.observe(deep(object), function(changes) {
                expect(changes[0]).to.eql({ 
                    object : object,
                    path: [ 'propY' ],
                    node: object.propY,
                    type: 'update',
                    arrayChangeType: 'splice',
                    name: 'propY',
                    index: 0,
                    removed: [],
                    //added: [ 55 ],
                    addedCount: 1,
                    oldValue: undefined 
                })

                done()
            })
            object.propY.push(55)
        })
        
        it('should call callback change releated with array pop', function(done) {
            var object = {
                propX: 10,
                propY: [1,2,3]
            }

            Object.observe(deep(object), function(changes) {
                expect(changes[0]).to.eql({ 
                    object : object,
                    path: [ 'propY' ],
                    node: object.propY,
                    type: 'update',
                    arrayChangeType: 'splice',
                    name: 'propY',
                    index: 2,
                    removed: [ 3 ],
                    //added: [ 55 ],
                    addedCount: 0,
                    oldValue: undefined 
                })

                done()
            })
            object.propY.pop()
        })
        

        it('should call callback change releated with add property', function(done) {
            var object = {
                propX: 10,
                propY: {}
            }

            Object.observe(deep(object), function(changes) {
                expect(changes[0]).to.eql({
                    object: object,
                    name: 'propZ',
                    type: 'add',
                    node: object.propY,
                    oldValue: undefined,
                    path: ['propY', 'propZ']
                })

                done()
            })
            object.propY.propZ = 55
        })

        it('should call callback change releated with delete property', function(done) {
            var object = {
                propX: 10,
                propY: {
                    propZ: 33
                }
            }

            Object.observe(deep(object), function(changes) {
                expect(changes[0]).to.eql({
                    object: object,
                    name: 'propZ',
                    type: 'delete',
                    node: object.propY,
                    oldValue: 33,
                    path: ['propY', 'propZ']
                })

                done()
            })
            delete object.propY.propZ
        })

        it('should call callback change releated with update array element', function(done) {
            var object = {
                propX: 10,
                propY: {
                    propZ: [1, 2, 3, 4]
                }
            }

            Object.observe(deep(object), function(changes) {
                expect(changes[0]).to.eql({
                    object: object,
                    name: '2',
                    type: 'update',
                    node: object.propY.propZ,
                    oldValue: 3,
                    path: ['propY', 'propZ', '2'],
                })

                done()
            })
            object.propY.propZ[2] = 99
        })
        
        it('should call callback change releated with update element within array', function(done) {
            var object = {
                propX: 10,
                propY: {
                    propZ: [{
                        propN : 10
                    },{
                        propN : 11
                    }]
                }
            }

            Object.observe(deep(object), function(changes) {
                expect(changes[0]).to.eql({
                    object: object,
                    name: 'propN',
                    type: 'update',
                    node: object.propY.propZ[1],
                    oldValue: 11,
                    path: ['propY', 'propZ', '1', 'propN'],
                })

                done()
            })
            object.propY.propZ[1].propN = 12
        })


        it('should call callback change when adding property and changing its property', function(done) {
            var object = {
                propX: 10,
                propY: {}
            }
            var callTimes = 0;

            Object.observe(deep(object), function(changes) {
                callTimes++;
                if (callTimes === 1) {
                    expect(changes[0]).to.eql({
                        object: object,
                        name: 'propZ',
                        type: 'add',
                        node: {
                            propZ: {
                                propN: {
                                    propP: 20
                                }
                            }
                        },
                        oldValue: undefined,
                        path: ['propY', 'propZ']
                    })
                    setTimeout(function() {
                        object.propY.propZ.propN.propP = 65
                    }, 0);
                } else {
                    expect(changes[0]).to.eql({
                        object: object,
                        name: 'propP',
                        type: 'update',
                        node: object.propY.propZ.propN,
                        oldValue: 20,
                        path: ['propY', 'propZ', 'propN', 'propP']
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
            var object = {
                propX: 10,
                propY: {
                    propZ: {
                        propN: {
                            propP: 10
                        }
                    }
                }
            }
            var tmpPointer = object.propY.propZ
            var callTimes = 0;

            function changeFunction(changes) {
                callTimes++;
                if (callTimes === 1) {
                    expect(changes[0]).to.eql({
                        object: object,
                        name: 'propP',
                        type: 'update',
                        node: object.propY.propZ.propN,
                        oldValue: 10,
                        path: ['propY', 'propZ', 'propN', 'propP']
                    })

                    setTimeout(function() {
                        delete object.propY.propZ
                    }, 0)
                } else {
                    expect(changes[0]).to.eql({
                        object: object,
                        name: 'propZ',
                        type: 'delete',
                        node: {},
                        oldValue: tmpPointer,
                        path: ['propY', 'propZ']
                    })
                    tmpPointer.propN.propP = 32

                    setTimeout(function() {
                        expect(changeFunctionSpy).to.have.been.called.exactly(2)
                        done()
                    }, 0)
                }
            }

            var changeFunctionSpy = chai.spy(changeFunction)

            Object.observe(deep(object), changeFunctionSpy)
            object.propY.propZ.propN.propP = 69

        })
    })
})