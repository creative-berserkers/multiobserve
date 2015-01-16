var chai= require('chai')
var spies = require('chai-spies')
var multiobserve = require('../lib/multiobserve.js').multiobserve

chai.use(spies);

var should = chai.should()
  , expect = chai.expect;

describe("multiobserve", function() {
    describe(".observe()", function() {
        it("return correct path value and oldValue", function(done) {
            var object = {
                property: {
                    a: 1,
                    b: {
                        c: 'hello'
                    }
                }
            }
            
            multiobserve.observe(object, function(changes) {
                changes.forEach(function(change) {
                    expect(change.path).to.eql(['property', 'b', 'c'])
                    expect(change.value).to.eql('bye')
                    expect(change.oldValue).to.eql('hello')
                    console.log('done called'+change)
                    done()
                })
            })
            object.property.b.c = 'bye'
        })

        /*it('should not call callback', function() {
            var spyCallback = chai.spy()
            
            multiobserve.observe({}, spyCallback)
            
            expect(spyCallback).to.not.have.been.called()
        })*/
    })
})