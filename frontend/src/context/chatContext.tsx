import React, { createContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { Channel } from '../components/chat/ChatComponent';

export const socket = io('http://' + process.env.REACT_APP_URL_MACHINE + ':4000/chat', {
	// we need this socket to not connect until someone il log
	transports: [ "websocket" ],
	withCredentials: true,
	autoConnect:false
});
export const WebsocketContext = createContext<Socket>(socket);

export const WebsocketProvider = WebsocketContext.Provider;


export interface IChatContext {
	allChannels: Channel[],
	setAllChannels: (allChannels: Channel[]) => void;
	activeChannel: Channel,
	setActiveChannel: (activeChannel: Channel) => void;
	needToUpdate: string,
	setNeedToUpdate: (str: string) => void;
	blockedUsers: {idUser: number, username: string, login: string}[];
	setBlockedUsers: (blocked: {idUser: number, username: string, login: string}[]) => void;
};

const defaultState:IChatContext = {
	allChannels: [],
	setAllChannels: () => {},
	activeChannel: {
		id: -1,
		channelName: "PongOffice Chat",
		chatPicture: "",
		type: "",
		status: "",
		username: null,
		dateSend: null,
		msg: null,
		userId: null,
	},
	setActiveChannel: () => {},
	needToUpdate: "",
	setNeedToUpdate: () => {},
	blockedUsers: [],
	setBlockedUsers: () => {},
};

export default React.createContext(defaultState);
