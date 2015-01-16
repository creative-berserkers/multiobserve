var chai= require('chai')
var spies = require('chai-spies')
var multiobserve = require('../lib/multiobserve.js').multiobserve

chai.use(spies);


var expect = chai.expect;

describe("multiobserve", function() {
    describe(".observe()", function() {
        it('should not call callback when there is no change', function() {
            var spyCallback = chai.spy()
            
            multiobserve.observe({}, spyCallback)
            
            expect(spyCallback).to.not.have.been.called()
        })
        
        it("should call callback with correct path value and oldValue when there is one change", function(done) {
            this.timeout(4000)
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
                    
                    done()
                })
            })
            object.property.b.c = 'bye'
        })
    })
})