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
                    object : object,
                    name : 'propX',
                    type : 'update',
                    oldValue : 10
                })

                expect(changes[1]).to.eql({
                    object : object,
                    name : 'propZ',
                    type : 'update',
                    node : object.propY,
                    oldValue : 33,
                    path : ['propY', 'propZ']
                })

                done()
            })
            object.propX = 11
            object.propY.propZ = 55
        })

        it('should call callback change releated with add property', function(done) {
            var object = {
                propX: 10,
                propY: {}
            }

            Object.observe(deep(object), function(changes) {
                expect(changes[0]).to.eql({
                    object : object,
                    name : 'propZ',
                    type : 'add',
                    node : object.propY,
                    oldValue : undefined,
                    path : ['propY', 'propZ']
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
                    object : object,
                    name : 'propZ',
                    type : 'delete',
                    node : object.propY,
                    oldValue : 33,
                    path : ['propY', 'propZ']
                })

                done()
            })
            delete object.propY.propZ
        })
        
        it('should call callback change releated with update array element', function(done) {
            var object = {
                propX: 10,
                propY: {
                    propZ: [1,2,3,4]
                }
            }

            Object.observe(deep(object), function(changes) {
                expect(changes[0]).to.eql({
                    object : object,
                    name : '2',
                    type : 'update',
                    node : object.propY.propZ,
                    oldValue : 3,
                    path : ['propY', 'propZ', '2'],
                    index : undefined,
                    removed: undefined,
                    addedCount : undefined
                })
                
                done()
            })
            object.propY.propZ[2] = 99
        })
    })
})