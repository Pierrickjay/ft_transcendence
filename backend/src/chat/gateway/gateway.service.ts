import { OnModuleInit, Injectable, NestHybridApplicationOptions } from "@nestjs/common";
import { SubscribeMessage, WebSocketGateway, MessageBody, WebSocketServer,ConnectedSocket } from "@nestjs/websockets";
import { Server } from 'socket.io'
import {createUser } from "../../prisma/chat/prisma.chat.test";
import {addChat, addPrivateMessage,getIdOfLogin, addChatMessage, addChanelUser, RetrieveChatMessage, findUser } from "../../prisma/chat/prisma.chat.service";
import {checkChatId, checkLogin} from "../../prisma/chat/prisma.chat.check";
import { getDate } from "../utils/utils.service";
import { encodePassword, checkPassword } from "../password/password.service";
import { JoinChatService } from "../joinChat/joinChat.service";
import { RetrieveMessageService } from "../retrieveMessage/retrieveMessage.service";
import {ChatLister} from "../chatLister/chatLister.service";
import { Socket } from "socket.io";
let lastMessageId = 0;




createUser()
@WebSocketGateway({
	cors: {
		origin: '*'
	},
})

//implements mean that it will contains the metho onModuleInit and will be executed
// the init of my gatewAY

@Injectable()
export class MyGateway {

	private sockets: Socket[] = [];

	@WebSocketServer()
	server: Server;

	handleConnection(client:Socket){
		console.log(`Client connected: ${client.id}`);
		this.sockets.push(client);

		client.on('disconnect', () => {
			console.log(`Client disconnected ${client.id}`);
			this.sockets = this.sockets.filter((s) => {return s != client;});
		})
	}

	getWebsocketServer() {
		return this.server;
	}

	/*onModuleInit() {

		this.server.on('connection', (client: Socket) => {
			this.sockets.push(client)
			console.log(client.id);
			console.log('connected');
		})
	}*/
	findSocketByUsername(username: string): Socket | undefined {
		return this.sockets.find((socket) => {
		  // Implement your logic to match the socket with the given username
		  // For example: return socket.username === username;
		});
	}

	@SubscribeMessage('newMessage')
	async onNewMessage(@MessageBody() messageData: {username: string, content: string, idOfChat: number}, @ConnectedSocket() client:Socket) {
		console.log(messageData);
		console.log('gateway side');
		console.log(messageData.idOfChat)
		lastMessageId++; // probleme with that in multi client. need to have an increment front end
		const targetSocket = this.sockets.find((socket) => socket === client);
		if (targetSocket !== undefined)
		{
			console.log("found a socket")
			this.server.emit('newMessage', {
				msg: messageData.content,
				username: messageData.username,
				date: getDate(),
				id: lastMessageId,
				idOfChat: messageData.idOfChat
			});
			await addChatMessage(messageData.idOfChat, messageData.username, messageData.content, getDate());
		}
	}


	@SubscribeMessage('JoinChatRoom')
	async onJoinChatRoom(@MessageBody() messageData:{username: string, chat_id:string, user_role:string, passeword:string}, @ConnectedSocket() client:Socket) {
		const targetSocket = this.sockets.find((socket) => socket === client);
		if (targetSocket !== undefined)
		{
			const joinClass = new JoinChatService(this);
			joinClass.joinChat(messageData.username, messageData.chat_id, messageData.user_role, messageData.passeword, targetSocket);
		}
	}

	@SubscribeMessage('SendPrivateMessage')
	async onSendMessage(@MessageBody() messageData: {msg: string, loginToSend: string, idOfUser: string}, @ConnectedSocket() client:Socket) {
		console.log(messageData);
		const targetSocket = this.sockets.find((socket) => socket === client);
		if (targetSocket !== undefined)
		{
			const userExist = await checkLogin(messageData.loginToSend);
			if (userExist === false) {
				console.log("User asked have not been found")
				targetSocket.emit('onSendMessage', {
					id : '-1'
				});
				return;
			}
			else {
				const idToSend = await getIdOfLogin(messageData.loginToSend);
				const idOfSender = await getIdOfLogin(messageData.idOfUser);
				console.log("id to send = ", idToSend, "id of sender = ", idOfSender);
				if (idOfSender !== undefined && idToSend !== undefined)
					addPrivateMessage(idOfSender, idToSend, messageData.msg);
			}
		}
	}

	@SubscribeMessage('onUserConnection')
	async onUserConnection(@MessageBody() TokenConnection: string, @ConnectedSocket() client:Socket) {
		console.log("Token receive to try to connect : ",TokenConnection);
		const targetSocket = this.sockets.find((socket) => socket === client);
		if (targetSocket !== undefined)
		{
			const userExist:boolean = await checkLogin(TokenConnection);
			if (userExist == false) {
				console.log("User asked have not been found")
				targetSocket.emit('onUserConnection', {
					id : '-1'
				});
				return;
			}
			else {
				console.log("User asked have been found");
				targetSocket.emit('onUserConnection', {
					id : 'good',
					username: TokenConnection
				});
				return;
			}
		}
	}

	@SubscribeMessage('createChat')
	async onCreateChat(@MessageBody() messageData: {username: string, chatName: string, chatType: string, chatPassword: string}, @ConnectedSocket() client:Socket) {
		const targetSocket = this.sockets.find((socket) => socket === client);
		if (targetSocket !== undefined)
		{
			const idOfUser = await getIdOfLogin(messageData.username);
			console.log("id of user : ", idOfUser);
			let encodedPassword : string | null = null;
			if (messageData.chatPassword)
				encodedPassword = await encodePassword(messageData.chatPassword);
			console.log("encoded password : ", encodedPassword);
			console.log("id of user : ", idOfUser);
			if (idOfUser !== undefined)
			{
				const newChatId = await addChat(messageData.chatName, messageData.chatType,idOfUser, encodedPassword );
				const chatType = {
					id: newChatId,
					channelName: messageData.chatName,
					chatPicture: 'avatarOfOwner',// need to be change
					username: null,
					msg: null,
					dateSend: null,
				}
				client.emit('newChat', chatType)
				await addChanelUser(newChatId, idOfUser, 'admin', getDate(), null).then(()=> client.emit('chatList', messageData.username));
			}
		}
	}

	@SubscribeMessage('retrieveMessage')
	async onRetrieveMessage(@MessageBody() messageData: {numberMsgToDisplay: number, chatId: number}, @ConnectedSocket() client:Socket) {
		console.log("in retrieve message : ", messageData);
		const targetSocket = this.sockets.find((socket) => socket === client);
		if (targetSocket !== undefined)
		{
			console.log("found a socket")
			const RetrieveMessage = new RetrieveMessageService(this);
			RetrieveMessage.retrieveMessage(messageData.chatId, messageData.numberMsgToDisplay, targetSocket);
		}
	}

	@SubscribeMessage('chatList')
	async onChatList(@MessageBody() username: string, @ConnectedSocket() client:Socket) {
		const targetSocket = this.sockets.find((socket) => socket === client);
		if (targetSocket !== undefined)
		{
			console.log("username receive : ", username)
			const chatLister = new ChatLister(this);
			chatLister.listChatOfUser(username, targetSocket);
		}
	}
}


