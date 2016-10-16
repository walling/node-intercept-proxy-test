
var util   = require('util');
var http   = require('http');
var net    = require('net');
var stream = require('readable-stream');

var server = net.createServer(function(source) {
    console.log('New connection: %j', source.address());

    var chunks = [];
    var chunksSize = 0
    var data, intercept, destination;

    // Create intercept stream, that stores and analyses the beginning of the data we receive
    intercept = new stream.Writable({
        write : function(chunk, encoding, callback) {

            // Store all chunks we received so far
            chunks.push(chunk);
            chunksSize += Buffer.byteLength(chunk);
            callback();

            // If we received 1024 bytes of data, we proceed to check it
            if (chunksSize >= 10) {
                // Collect all the data we received so far and log it
                data = Buffer.concat(chunks);
                console.log('Initial data: %s', data.toString('utf8').replace(/[\x00-\x1F]/g, function(ch) {
                    return util.format('<%s>', ('0000' + ch.charCodeAt(0).toString(16).toUpperCase()).slice(-4));
                }));

                // TODO: Analyse data to find hostname

                // Stop interception the stream
                source.unpipe(intercept);

                // Connect to real server and setup proxy connection
                destination = net.connect(80, 'www.google.com', function() {
                    // Start by writing the data we intercepted and setup full-duplex proxy
                    destination.write(data);
                    source.pipe(destination);
                    destination.pipe(source);
                });
            }

        }
    });

    // Intercept the source stream
    source.pipe(intercept);
});

setInterval(function() {
    server.getConnections(function(error, count) {
        console.log('Server connections: %s', count);
    });
}, 5000);

server.listen(8080);
console.log('Running on localhost:8080');
