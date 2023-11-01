import React, { createContext } from 'react';
import { io, Socket } from 'socket.io-client';


export const socket = io('http://localhost:4000', {
	// we need this socket to not connect until someone il log
	//autoConnect:false
});
export const WebsocketContext = createContext<Socket>(socket);

export const WebsocketProvider = WebsocketContext.Provider;

export interface IChatContext {
	chatId: number,
	setChatId: (chatId: number) => void;
};

const defaultState:IChatContext = {
	chatId: 0,
	setChatId: () => {},
};

export default React.createContext(defaultState);
