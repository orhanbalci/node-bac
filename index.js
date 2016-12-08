var net = require('net');
var protobuf = require('protocol-buffers')
const fs = require('fs')

var messages = protobuf(fs.readFileSync('protocol.proto'))

var HOST = '127.0.0.1';
var PORT = 4242;

var stdin = process.openStdin();
//var stdOut = process.openStdout();

var encodedBuffer = messages.BasRequestResponse.encode({
  request_type: 0,
  text_message: 'hello world'
})

var client = new net.Socket();
client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    // Write a message to the socket as soon as the client is connected, the server will receive it as message from the client 
    client.write(encodedBuffer);

});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(data) {
    
    console.log('Server Response: ' + data);
    // Close the client socket completely
    //client.destroy();
    
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Connection closed');
});

stdin.addListener("data", function(d){
	client.write(d);
});

process.on('SIGINT', function() {
  client.end();
  client.destroy();
  process.exit();
});

