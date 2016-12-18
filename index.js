var net = require('net');
var protobuf = require('protocol-buffers')
const fs = require('fs')
var readline = require('readline')

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

var messages = protobuf(fs.readFileSync('protocol.proto'))

var HOST = '127.0.0.1';
var PORT = 4242;



var encodedBuffer = messages.BasRequestResponse.encode({
	request_type: messages.RequestResponseType.FC_SEND_TEXT_MESSAGE,
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

	var serverMessage = messages.BasRequestResponse.decode(data)
	console.log('Server Response: ' + serverMessage.request_type);
	// Close the client socket completely
	//client.destroy();
	if (serverMessage.request_type == 2) {
		rl.question('Please tell me your name: ', function(name) {

			client.write(messages.BasRequestResponse.encode({
				request_type: messages.RequestResponseType.FC_SEND_NAME,
				name: name
			}));
			rl.close();
		});

	} else if (serverMessage.request_type == messages.RequestResponseType.FS_SEND_ALL_USERS_INFOS) {
		console.log("New Player  added to table");
		console.log("Cross Player : " + serverMessage.cross_user_name);
		console.log("Left Player  : " + serverMessage.left_user_name);
		console.log("Right Player : " + serverMessage.right_user_name);
	} else if (serverMessage.request_type == messages.RequestResponseType.FS_SEND_PLAYER_CARDS) { // kartlari goster
		console.log("Your cards : " + serverMessage.user_cards.map(function(card) {
			return card.card_number + " of " + card.card_type
		}).join())
	} else if (serverMessage.request_type == messages.RequestResponseType.FS_ASK_PLAY_COUNT) { //el sayisi sor
		console.log("Cross Play Count : " + serverMessage.cross_play_count)
		console.log("Left Play Count  : " + serverMessage.left_play_count)
		console.log("Right Play Count : " + serverMessage.right_play_count)
		var rl5 = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl5.question('How many plays: ', function(playCount) {

			client.write(messages.BasRequestResponse.encode({
				request_type: messages.RequestResponseType.FC_SEND_PLAY_COUNT,
				play_count: playCount
			}));
			rl5.close();
		});
	} else if (serverMessage.request_type == messages.RequestResponseType.FS_ASK_TRUMP) {
		var rl9 = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl9.question('Whats trump: ', function(cardType) {

			client.write(messages.BasRequestResponse.encode({
				request_type: messages.RequestResponseType.FC_SEND_TRUMP,
				card_in_play: {
					card_number: 1,
					card_type: cardType
				}
			}));
			rl9.close();
		});
	}
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
	console.log('Connection closed');
});

process.on('SIGINT', function() {
	//process.stdin.destroy();
	console.log('Destroying app')
	client.end();
	client.destroy();
	process.exit();
});