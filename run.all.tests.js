'use strict'

let Mocha = require('mocha')
let fs = require('fs')
let path = require('path')
    
let mocha = new Mocha({
    ui: 'tdd',
    reporter: 'list',
    bail: true
})

mocha.run(function(){})

// Then, you need to use the method "addFile" on the mocha
// object for each file.

// Here is an example:
fs.readdirSync('test').filter(function(file){
    // Only keep the .js files
    return file.substr(-3) === '.js';

}).forEach(function(file){
    // Use the method "addFile" to add the file to mocha
    let p = path.join('test', file)
    console.log(p)
    mocha.addFile( p );
    
});

// Now, you can run the tests.
mocha.run(function(){});