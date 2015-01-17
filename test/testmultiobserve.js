var chai = require('chai')
var spies = require('chai-spies')
var multiobserve = require('../lib/multiobserve.js')

chai.use(spies)


var expect = chai.expect
var deep = multiobserve.deep

describe('multiobserve', function() {
    describe('.observe()', function() {
        it('should call callback with correct path value and oldValue when observing', function(done) {
            var object = {
                propX: 10,
                propY: {
                    propZ: 33
                }
            }

            Object.observe(deep(object), function(changes) {
                expect(changes[0].object).to.eql(object)
                expect(changes[0].name).to.eql('propX')
                expect(changes[0].type).to.eql('update')
                expect(changes[0].oldValue).to.eql(10)

                expect(changes[1].object).to.eql(object)
                expect(changes[1].name).to.eql('propZ')
                expect(changes[1].type).to.eql('update')
                expect(changes[1].node).to.eql(object.propY)
                expect(changes[1].oldValue).to.eql(33)
                expect(changes[1].path).to.eql(['propY', 'propZ'])
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
                expect(changes[0].object).to.eql(object)
                expect(changes[0].name).to.eql('propZ')
                expect(changes[0].type).to.eql('add')
                expect(changes[0].node).to.eql(object.propY)
                expect(changes[0].oldValue).to.eql(undefined)
                expect(changes[0].path).to.eql(['propY', 'propZ'])
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
                expect(changes[0].object).to.eql(object)
                expect(changes[0].name).to.eql('propZ')
                expect(changes[0].type).to.eql('delete')
                expect(changes[0].node).to.eql(object.propY)
                expect(changes[0].oldValue).to.eql(33)
                expect(changes[0].path).to.eql(['propY', 'propZ'])
                done()
            })
            delete object.propY.propZ
        })
    })
})