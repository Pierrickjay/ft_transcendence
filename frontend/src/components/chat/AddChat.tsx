import { useState, useContext, useEffect } from 'react';
import { WebsocketContext } from '../../context/chatContext';
import  ConnectionContext from "../../context/authContext"
import AddIcon from '@mui/icons-material/Add';
import { Tooltip } from  "@mui/material";
import "./AddChat.scss";

type CreateChatPayload = {
	username: string;
	chatName: string;
	chatPassword: string | null;
	chatType: string;
}

export const AddChat = (props: {showSubMenu: string, setShowSubMenu: Function}) => {
	
	const {username} = useContext(ConnectionContext);
	const [chatName, setChatName] = useState('');
	const [password, setPassword] = useState('');
	const socket = useContext(WebsocketContext);
	const [chatType, setChatType] = useState('public');

	const toggleForm = () => {
		if (props.showSubMenu !== "add") {
	  		props.setShowSubMenu("add");
		} else {
			props.setShowSubMenu("none");
		}
	};

	const onSubmit = () => {

		let createChatData: CreateChatPayload;
		if (chatName === "" || (chatType === "protected by password" && password === ""))
			return ;
		if (password === "")
		{
			createChatData = {
				username: username,
				chatName: chatName,
				chatType: chatType,
				chatPassword: null,
			}
		}
		else
		{
			createChatData = {
				username: username,
				chatName: chatName,
				chatType: chatType,
				chatPassword: password,
			}
		}

		socket.emit('createChat', createChatData);
		setChatName('');
		setPassword('');
		toggleForm();
	}
	return (
		<div className='addchat'>
			<Tooltip title="Create new channel" arrow>
				<AddIcon onClick={toggleForm}/>
			</Tooltip>
			<div className={props.showSubMenu === "add" ? 'submenu' : 'submenu-hidden'}>
				<div className='form'>
					<div>
						<input
							type="text"
							placeholder="Channel Name"
							maxLength={42}
							value={chatName}
							onChange={(e) => setChatName(e.target.value)}
						/>
						<p>Select the type of channel.</p>
						<select
							value={chatType}
							onChange={(e) => setChatType(e.target.value)}
						>
							<option value="public">Public</option>
							<option value="private">Private</option>
							<option value="protected by password">Protected by password</option>
						</select>
						{chatType === 'protected by password' && (
							<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							/>
						)}
					</div>
					<button onClick={onSubmit}>Create</button>
				</div>
			</div>
		</div>
	  );
}
