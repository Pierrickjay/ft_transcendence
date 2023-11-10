import "./Chats.scss";
import { WebsocketContext } from "../../context/chatContext";
import React, { useContext, useState, useEffect, useRef, Component } from 'react';
import ConnectionContext from '../../context/authContext'
import { allChatOfUser } from './ChatComponent';
import { Message } from "./ChatComponent"

const Chats = (props: {activeChat: allChatOfUser, setActiveChat: Function, chatsOfUser: allChatOfUser[], setChatsOfUser: Function, lastMessage: Message}) => {

    const socket = useContext(WebsocketContext);
    const {username} = useContext(ConnectionContext);

    useEffect(() => {

        trigger();

        socket.on("ListOfChatOfUser", (channelsListReceive : allChatOfUser[]) => {
            props.setChatsOfUser(channelsListReceive);
            console.log("Console.logggegege");
            console.log(channelsListReceive);
        });

		socket.on("newChat", (newChat: allChatOfUser) => {
			props.setChatsOfUser([...props.chatsOfUser, newChat]);
		});

        return () => {

			socket.off("ListOfChatOfUser");
			socket.off("newChat")
        }
    }, [])

    const startRef = useRef<HTMLDivElement>(null); //ref to empty div to autoscroll to bottom

    function trigger() {
       socket.emit('chatListOfUser', username);
    }

    useEffect(() => {
        if (props.chatsOfUser.length > 0) {
            startRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
            });
        }
        console.log("chats receive :", props.chatsOfUser)

    }, []);

    function moveMostRecentUp(chatsOfUser: allChatOfUser[]) {

        chatsOfUser.sort((a: allChatOfUser, b: allChatOfUser) => {
            const aDate = a.dateSend;
            const bDate = b.dateSend;
            if (aDate === null || bDate === null)
                return 0;
            else if (aDate < bDate)
                return 1;
            else if (aDate > bDate)
                return -1;
            return 0;
    })
    return (chatsOfUser);
    }

    function findReceiverName(names: string) {

        let name = names.replace(username, "");
        name.trim()
        return (name)
    }

    return (
        <div className='chats'>
            {props.chatsOfUser.length === 0 ? (
				<div className='noConversations'>No conversations</div>
				) : (
					<div>
                        <div ref={startRef} />
						{moveMostRecentUp(props.chatsOfUser).map((channel) => (
                            <div key={channel.id} onClick={() => {
                                    if (channel.id != props.activeChat.id) {
                                    props.setActiveChat(channel);
                                    socket.emit('retrieveMessage', {chatId: channel.id, messageToDisplay: 15 })
                                    }}}>
                                <div className={props.activeChat.id === channel.id ? "userChat active" : "userChat"}>
                                    <img src={channel.chatPicture === null ? "" : channel.chatPicture} />
                                    <div className='userChatInfo'>
                                        <h1>{channel.type !== "DM" ? channel.channelName : findReceiverName(channel.channelName)}</h1>
                                        <p>{channel.msg ? channel.msg : ""}</p>
                                    </div>
                                </div>
                            </div>
			  			))}
			  		</div>
				)}
        </div>
    )
}

export default Chats;
