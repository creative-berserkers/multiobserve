var Mocha = require('mocha')

var mocha = new Mocha()

mocha.addFile('./testmultiobserve.js')

mocha.run(function(){})