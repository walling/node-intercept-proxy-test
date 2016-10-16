
var util   = require('util');
var http   = require('http');
var net    = require('net');
var stream = require('readable-stream');

function intercepter(name) {
    return new stream.Transform({
        transform : function(chunk, encoding, callback) {
            var data = new Buffer(chunk).toString('utf8');
            data = data.replace(/[\x00-\x1F\x7F-\xFF]/g, function(ch) {
                return util.format('<%s>', ('00' + ch.charCodeAt(0).toString(16).toUpperCase()).slice(-2));
            });

            console.log('\n%s: %s', name, data);

            this.push(chunk);
            callback();
        }
    });
}

var server = net.createServer(function(source) {
    console.log('\nNEW CONNECTION: %j', source.address());

    var intercept1 = intercepter('SERVER');
    var intercept2 = intercepter('CLIENT');

    var destination = net.connect(25565, '188.40.72.79', function() {
        destination.pipe(intercept1).pipe(source);
        source.pipe(intercept2).pipe(destination);
    });
});

server.listen(26002);
