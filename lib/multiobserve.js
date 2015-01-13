exports.multiobserve = {
    observe : function(object,callback){
        callback([{
            path : ['property','b','c'],
            value : 'bye',
            oldValue: 'hello'
        }]);
        return object
    }
}