import { OnModuleInit, Injectable, NestHybridApplicationOptions } from "@nestjs/common";
import { SubscribeMessage, WebSocketGateway, MessageBody, WebSocketServer,ConnectedSocket } from "@nestjs/websockets";
import { Server } from 'socket.io'
import { PrismaChatService } from "src/prisma/chat/prisma.chat.service";
import { getDate } from "../utils/utils.service";
import { encodePassword, checkPassword } from "../password/password.service";
import { JoinChatService } from "../joinChat/joinChat.service";
import { RetrieveMessageService } from "../retrieveMessage/retrieveMessage.service";
import {ChatLister} from "../chatLister/chatLister.service";
import { Socket } from "socket.io";
import { CreateChatService } from "../createchat/createchat.service";
import { MutedUserService } from "../mutedUser/mutedUser.service";
import { subscribe } from "diagnostics_channel";
import { PrivateConvService } from "../privateConv/privateConv.service";


let lastMessageId = 0;


@WebSocketGateway({
	cors: {
		origin: 'http://localhost:3000'
	},
})


@Injectable()
export class MyGateway {

	constructor (private readonly mutedUserService: MutedUserService,
		 private prismaChatService: PrismaChatService,
		 private privateConv : PrivateConvService ){}
	private socketsLogin: { login: string; sock: Socket, idOfLogin: number }[] = [];

	@WebSocketServer()
	server: Server;

	handleConnection(client:Socket){
		console.log("client connected : ", client.id)
		client.on('disconnect', () => {
			console.log("client disconect : ", client.id)
			this.socketsLogin = this.socketsLogin.filter((s) => {return s.sock != client;});
		})
	}

	getSocketsArray() {
		return this.socketsLogin;
	}

	@SubscribeMessage('newChatConnection')
	async newChatConnection(@MessageBody() login:string, @ConnectedSocket() client:Socket)
	{
		if (!this.socketsLogin.find((item) => item.login === login && item.sock === client))
		{
			const idOfLogin = await this.prismaChatService.getIdOfLogin(login);
			if (idOfLogin)
				this.socketsLogin.push({login : login , sock: client, idOfLogin: idOfLogin})
		}
	}

	@SubscribeMessage('newMessage')
	async onNewMessage(@MessageBody() messageData: {username: string, content: string, idOfChat: number}, @ConnectedSocket() client:Socket) {
		if (!this.mutedUserService.IsMutedUser(messageData.username, messageData.idOfChat))
		{
			const targetSocket = this.socketsLogin.find((socket) => socket.sock === client);
			if (targetSocket !== undefined)
			{
				lastMessageId++; // probleme with that in multi client. need to have an increment front end
				const message = {
					msg: messageData.content,
					username: messageData.username,
					date: getDate(),
					id: lastMessageId,
					idOfChat: messageData.idOfChat
				}
				await this.prismaChatService.addChatMessage(messageData.idOfChat, targetSocket.idOfLogin, messageData.content, getDate());
				this.server.to(messageData.idOfChat.toString()).emit('newMessage', message);
				this.server.to(messageData.idOfChat.toString()).emit('lastMessage', message);
			}
		}
	}

	@SubscribeMessage('retrievePrivateMessage')
	async onRetrieveMp(@MessageBody() username:string, client: Socket)
	{
		const targetSocket = this.socketsLogin.find((socket) => socket.sock === client);
		if (targetSocket !== undefined)
		{
			//const ReceiveAndSendMp = await this.prismaChatService.RetrievePrivateMessage(username);
			client.emit("retrievePrivateMessage", targetSocket);
		}
	}


	@SubscribeMessage('JoinChatRoom')
	async onJoinChatRoom(@MessageBody() messageData:{username: string, chat_id:string, user_role:string, passeword:string}, @ConnectedSocket() client:Socket) {
		const targetSocket = this.socketsLogin.find((socket) => socket.sock === client);
		if (targetSocket !== undefined)
		{
			const joinClass = new JoinChatService(this.prismaChatService);
			joinClass.joinChat(targetSocket.idOfLogin, messageData.chat_id, messageData.user_role, messageData.passeword, targetSocket.sock);
		}
	}

	@SubscribeMessage('SendPrivateMessage')
	async onSendMessage(@MessageBody() messageData: {msg: string, loginToSend: string, idOfUser: string}, @ConnectedSocket() client:Socket) {
		const targetSocket = this.socketsLogin.find((socket) => socket.sock === client);
		if (targetSocket !== undefined)
		{
			const userExist = await this.prismaChatService.checkLogin(messageData.loginToSend);
			if (userExist === false) {

				targetSocket.sock.emit('onSendMessage', {
					id : '-1'
				});
				return;
			}
			else {
				const idToSend = await this.prismaChatService.getIdOfLogin(messageData.loginToSend);
				if (idToSend !== undefined)
					this.prismaChatService.addPrivateMessage(targetSocket.idOfLogin, idToSend, messageData.msg);
			}
		}
	}


	// this need to go when login works
	@SubscribeMessage('onUserConnection')
	async onUserConnection(@MessageBody() TokenConnection: string, @ConnectedSocket() client:Socket) {
			const userExist:boolean = await this.prismaChatService.checkLogin(TokenConnection);
			if (userExist == false) {

				client.emit('onUserConnection', {
					id : '-1'
				});
				return;
			}
			else {

				client.emit('onUserConnection', {
					id : 'good',
					username: TokenConnection
				});
				return;
			}
	}

	@SubscribeMessage('newPrivateConv')
	async onNewPrivateConv(@MessageBody() messageData: {sender: string, receiver: string}, @ConnectedSocket() client:Socket)
	{
		console.log("on new dm");
		const targetSocket = this.socketsLogin.find((socket) => socket.sock === client);
		if (targetSocket !== undefined)
		{
			const receiverSocket = this.socketsLogin.find((socket) => socket.login === messageData.receiver)
			if (receiverSocket)
			{
				const allGood = await this.privateConv.setDirectConv(messageData.sender, targetSocket.idOfLogin, messageData.receiver, targetSocket.sock, receiverSocket.sock);
				console.log("hey all good or nah :", allGood);
			}
		}

	}

	@SubscribeMessage('createChat')
	async onCreateChat(@MessageBody() messageData: {username: string, chatName: string, chatType: string, chatPassword: string}, @ConnectedSocket() client:Socket) {
		const targetSocket = this.socketsLogin.find((socket) => socket.sock === client);
		if (targetSocket !== undefined)
		{
			const CreateRoom = new CreateChatService(this.prismaChatService);
			CreateRoom.createChat(messageData.username, targetSocket.idOfLogin ,messageData.chatPassword, messageData.chatName, messageData.chatType, targetSocket.sock);
		}
	}

	@SubscribeMessage('retrieveMessage')
	async onRetrieveMessage(@MessageBody() messageData: {numberMsgToDisplay: number, chatId: number}, @ConnectedSocket() client:Socket) {

		const targetSocket = this.socketsLogin.find((socket) => socket.sock === client);
		if (targetSocket !== undefined)
		{
			const RetrieveMessage = new RetrieveMessageService(this.prismaChatService);
			RetrieveMessage.retrieveMessage(messageData.chatId, messageData.numberMsgToDisplay, targetSocket.sock);
		}
	}

	@SubscribeMessage('mutedUser')
	mutedUser(@MessageBody() user:{username:string, chatId: number, time: number}, @ConnectedSocket() client:Socket) {
		const userIsMute = this.mutedUserService.addMutedUser({username: user.username, chatId: user.chatId, timeStart: getDate(), duration: user.time});
		if (userIsMute)
		{
			client.emit("userIsMute",userIsMute );
		}
	}

	@SubscribeMessage('chatListOfUser')
	async onChatListOfUser(@MessageBody() username: string, @ConnectedSocket() client:Socket) {
		const targetSocket = this.socketsLogin.find((socket) => socket.sock === client);
		if (targetSocket !== undefined)
		{
			const chatLister = new ChatLister(this.prismaChatService);
			await chatLister.listChatOfUser(targetSocket.idOfLogin, targetSocket.sock);
		}
	}

	@SubscribeMessage('chatList')
	async onChatList( @ConnectedSocket() client:Socket) {
		const targetSocket = this.socketsLogin.find((socket) => socket.sock === client);
		if (targetSocket !== undefined)
		{

			const chatLister = new ChatLister(this.prismaChatService);
			chatLister.listAllPublicChat(client);
		}
	}
}


