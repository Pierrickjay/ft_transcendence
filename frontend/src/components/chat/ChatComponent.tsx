import "./ChatComponent.scss"
import Sidebar from './Sidebar';
import Chat from './Chat'
import { WebsocketContext } from "../../context/chatContext";
import { useState, useEffect, useContext } from 'react';
import  ConnectionContext from "../../context/authContext"
import ChatContext, {IChatContext} from "../../context/chatContext";
import { useLogin } from "../../components/user/auth";

export type Channel = {
    id: number;
    channelName: string;
    chatPicture: string;
    type : string;
    status: string;
    /*---------LastMessageReceive-------*/
    username: string | null; // bien differencier username et uid unique en cas de changement de username
	// login: string ;
    msg: string| null;
    dateSend: Date | null;
}

// export type Message = {
//     msg: string;
//     username: string;
// 	login: string;
//     date: Date;
//     id: number;
//     idOfChat: number;
// }

const ChatComponent = () => {

    const [allChannels, setAllChannels] = useState<Channel[]>([])
    const [needToUpdate, setNeedToUpdate] = useState(false);
    const [activeChannel, setActiveChannel] = useState<Channel>({
        id: -1,
        channelName: "Pong Chat",
        chatPicture: "",
        type: "",
        status: "",
        username: null,
        dateSend: null,
        msg: null
    })

  const ChatValue: IChatContext = {
    allChannels,
    setAllChannels,
    activeChannel,
    setActiveChannel,
    needToUpdate,
    setNeedToUpdate
  }

    return (
        <div className="chatcomponent">
            <div className='container'>
                <ChatContext.Provider value={ChatValue}>
                    < Sidebar />
                    {activeChannel.id > 0 ? <Chat/> : <NoChat message={activeChannel.channelName}/>}
                </ChatContext.Provider>
            </div>
        </div>
    )
}

export default ChatComponent;


const NoChat = (props: {message: string}) => {

    const auth = useLogin();
    const socket = useContext(WebsocketContext);

    useEffect(() => {

    socket.on('newMessage', (chatHistoryReceive :{msg: string, username: string, date: Date, id: number, idOfChat:number, serviceMessage: boolean}) => {

        socket.emit("chatListOfUser",auth.user.login);
    });
    return () => {
        socket.off('newMessage');
    }
}, [])

    return (<div className='noChat'>{props.message}</div>);
}