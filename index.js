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
	if (serverMessage.request_type == messages.RequestResponseType.FS_ASK_NAME) {
		console.log('Please tell me your name:');		
	} else if (serverMessage.request_type == messages.RequestResponseType.FS_SEND_ALL_USERS_INFOS) {
		console.log("New Player  added to table");
		console.log("Cross Player : " + serverMessage.cross_user_name);
		console.log("Left Player  : " + serverMessage.left_user_name);
		console.log("Right Player : " + serverMessage.right_user_name);
	} else if (serverMessage.request_type == messages.RequestResponseType.FS_SEND_PLAYER_CARDS) { // kartlari goster
		console.log("Your cards : " + serverMessage.user_cards.map(function(card) {
			return cardNumberToString(card.card_number) + " of " + cardTypeToString(card.card_type)
		}).join())
	} else if (serverMessage.request_type == messages.RequestResponseType.FS_ASK_PLAY_COUNT) { //el sayisi sor
		console.log("Cross Play Count : " + serverMessage.cross_play_count)
		console.log("Left Play Count  : " + serverMessage.left_play_count)
		console.log("Right Play Count : " + serverMessage.right_play_count)
		console.log("How many plays?")		
	} else if (serverMessage.request_type == messages.RequestResponseType.FS_ASK_TRUMP) {
		console.log('Whats trump?')		
	} else if (serverMessage.request_type == messages.RequestResponseType.FS_SEND_WHOS_TURN){
		console.log("Cards on table " + serverMessage.cards_on_table.map(function(card){
			return cardNumberToString(card.card_number) + " of " + cardTypeToString(card.card_type)
		}).join())
		console.log("Whos Turn : " + userDirectionToString(serverMessage.user_direction))
	}
});

function userDirectionToString(userDirection) {
	switch(userDirection){
		case 0:
			return "Cross";
		case 1:
			return "Left";
		case 2:
			return "Right";
		case 3:
			return "Self";
	}
}
function cardNumberToString(cardNumber) {
	switch(cardNumber){
		case 0:
			return "Ace"
		case 1:
			return "Two"
		case 2:
			return "Three"
		case 3:
			return "Four"
		case 4:
			return "Five"
		case 5:
			return "Six"
		case 6:
			return "Seven"
		case 7:
			return "Eight"
		case 8:
			return "Nine"
		case 9:
			return "Ten"
		case 10: 
			return "Jack"
		case 11:
			return "Queen"
		case 12:
			return "King"
	}
}

function cardTypeToString(cardType){
	switch(cardType){
		case 0:
			return "Spades"
		case 1:
			return "Hearts"
		case 2:
			return "Clubs"
		case 3:
			return "Diamonds"
	}
}

rl.on('line', function(line){
	var commands = line.trim().split(" ")	
	switch (commands[0]){
		case "SN" :
		client.write(messages.BasRequestResponse.encode({
			request_type: messages.RequestResponseType.FC_SEND_NAME,
			name: commands[1]
		}));
		break;
		case "SPC":
		client.write(messages.BasRequestResponse.encode({
				request_type: messages.RequestResponseType.FC_SEND_PLAY_COUNT,
				play_count: parseInt(commands[1])
			}));
		break;
		case "WT":
		client.write(messages.BasRequestResponse.encode({
			request_type: messages.RequestResponseType.FC_SEND_TRUMP,
			card_in_play: {
				card_number: 1,
				card_type: messages.CardType.CT_SPADES
			}
		}));
		case "PC" :
		client.write(messages.BasRequestResponse.encode({
			request_type: messages.RequestResponseType.FC_PLAY_CARD,
			card_in_play: {
				card_number: commands[1],
				card_type: parseInt(commands[2])
			}
		}));
		break;
	}
})

// Add a 'close' event handler for the client socket
client.on('close', function() {
	console.log('Connection closed');
});


rl.on('close', function() {
  	console.log('Destroying app')	
	process.stdin.destroy();
	client.end();
	client.destroy();
	process.exit(0);
});

process.on('SIGINT', function() {	
	console.log('Destroying app')
	rl.close(); 
	process.stdin.destroy();
	client.end();
	client.destroy();
	process.exit(0);
});