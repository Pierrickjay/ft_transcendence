import "./Message.scss"
import { useContext, useEffect, useState, useRef } from "react";
import ChatContext, { WebsocketContext } from "../../context/chatContext";
import { Link } from "react-router-dom";
import { useLogin } from "../../components/user/auth";
import GameContext from "../../context/gameContext";
import { PageContext } from "../../context/PageContext";

type uInfo = {
	userStatus: string, // "owner", "admin", "user", "banned", "out" (if kicked or left)
	friend: boolean
}

const  Message = (props: {username: string, login: string, date: string, msg: string, isOwner: boolean, isAdmin: boolean, chatId: number, service: boolean, isDM: boolean, msgId: number}) => {

    const auth = useLogin();
	const context = useContext(PageContext);
	if (!context) {
		throw new Error('useContext must be used within a MyProvider');
	}
	const { updateChat } = context;
	const {roomId, setRoomId} = useContext(GameContext)
	const {setActiveChannel, setNeedToUpdate, setBlockedUsers } = useContext(ChatContext)
    const [showUserActionsMenu, setShowUserActionsMenu] = useState(false);
	const [userInfo, setUserInfo] = useState<uInfo>({userStatus: "user", friend: false})
	const [errorMessage, setErrorMessage] = useState("");
    const socket = useContext(WebsocketContext);
	const [image, setImage] = useState("");
	let menuRef = useRef<HTMLInputElement>(null);
	let messageType = "normal";

	useEffect(() => {
		const clickHandler = (e: any) => {
			if (!menuRef.current?.contains(e.target)) {
				setShowUserActionsMenu(false);
			}
		};
		document.addEventListener("mousedown", clickHandler);
		return () => {
			document.removeEventListener("mousedown", clickHandler);
		}
	});

	useEffect(() => {
		socket.on("userIsMute", (userIsMute:boolean) => {

			if(!userIsMute) 
				console.log("print something")
			else
				console.log(" i am muted");
		})
        return () => {
			socket.off("userIsMute");
		}
    }, [socket])

	async function checkIfUserIsBanned() {

		try {
			const response = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/chatOption/${props.login}/banned/${props.chatId}`, {
				method: "GET",
				headers: { Authorization: auth.getBearer()},
			  }
			);
			if (!response.ok) {
				throw new Error("Request failed");
			}
			const data = await response.json();
			if (data.isBanned) {
				return true;
			} else {
				return false;
			}
		}
		catch(error) {
			console.error("Error while checking if user is banned", error);
		}
	}

    if (auth.user.login === props.login) {
        messageType = "owner";
    }
	if (props.service) {
		messageType = "service";
	}

	async function checkIfAlreadyFriend() {
		try {
			const response = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/friend/${auth.user.login}/${props.login}/isMyFriend`, {
				method: "GET",
				headers: { Authorization: auth.getBearer()},
			  });
			if (!response.ok) {
				throw new Error("Request failed");
			}
			const data = await response.json();
			if (data)
				return data;
		}
		catch(error) {
			console.error("Error while checking if user is friend", error);
		}
	}

	async function getUserInfo() {
		try {
			const response = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/chatOption/${props.login}/info/${props.chatId}`, {
				method: "GET",
				headers: { Authorization: auth.getBearer()},
			  });
			if (!response.ok) {
				throw new Error("Request failed");
			}
			const data = await response.json();
			if (data) {
				if (data.banned === true)
					return ("banned");
				if (data.kicked === true)
					return ("left");
				if (data.user_role === "user")
					return ("");
				return (data.user_role);
			}
		}
		catch(error) {
			console.error("Error while checking user info", error);
		}
	}

    async function toggleUserActionsMenu() {
		const info: uInfo = {userStatus: "", friend: false};
		if (showUserActionsMenu === false) {
			info.userStatus =  await getUserInfo();
			info.friend = await checkIfAlreadyFriend();
			setUserInfo(info);
		}
        setShowUserActionsMenu(!showUserActionsMenu);
		setErrorMessage("");
    }

	function sendServiceMessage(message: string) {
		const messageData = {
			username: auth.user.username,
			login:auth.user.login,
			content: message,
			serviceMessage: true,
			idOfChat: props.chatId,
		}
		socket.emit('newMessage', messageData);
	}

	async function sendNewAdmin() {

		const requestOptions = {
			method: 'post',
			headers: { 'Content-Type': 'application/json' ,
			Authorization: auth.getBearer()},
			body: JSON.stringify({ login: props.login, chatId: props.chatId})
		};
		try {
			await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/chatOption/setAdmin/`, requestOptions)
			toggleUserActionsMenu();
			sendServiceMessage(props.username + " is now an administrator of this channel");
		}
		catch (error) {
			console.error("Error while setting new admin", error);
		}
	}

	function muteUser() {
		socket.emit("mutedUser", {login: props.login, chatId: props.chatId, time: 60 })
		toggleUserActionsMenu();
		sendServiceMessage(props.login + " has been muted for 1 min");
	}

	async function banUser() {
		const requestOptions = {
			method: 'post',
			headers: { 'Content-Type': 'application/json',
			Authorization: auth.getBearer()},
			body: JSON.stringify({ login: props.login, chatId: props.chatId})
		};
		try {
			let banned = await checkIfUserIsBanned();
			if (banned) {
				setErrorMessage(props.username + " is already banned");
			} else {
				const response = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/chatOption/banUser/`, requestOptions);
				const data = await response.json();
				if (data.isOwner)
					setErrorMessage(props.username + " cannot be banned since he or she owns this channel")
				else {
				toggleUserActionsMenu();
				sendServiceMessage(props.username + " has been banned from this channel");
				}
			}
		}
		catch (error) {
			console.error("Error while banning user", error);
		}
	}

	async function kickUser() {
		const requestOptions = {
			method: 'post',
			headers: { 'Content-Type': 'application/json',
			Authorization: auth.getBearer()},
			body: JSON.stringify({ login: props.login, chatId: props.chatId})
		};
		try {
			const response = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/chatOption/kickUser/`, requestOptions);
			const data = await response.json();
			if (data.isOwner)
				setErrorMessage(props.username + " cannot be kicked since he or she owns this channel")
			else {
				toggleUserActionsMenu();
				sendServiceMessage(props.username + " has been kicked from this channel");
			}
		}
		catch (error) {
			console.error("Error while kicking user", error);
		}
	}

	async function startDmFromMessage() {
		const requestOptions = {
			method: 'post',
			headers: { 'Content-Type': 'application/json',
			Authorization: auth.getBearer()},
			body: JSON.stringify({ idSender: auth.user.id, loginReceiver: props.login})
		};
		try {
			const response = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/chatOption/newPrivateConv`, requestOptions);
			if (!response.ok) {
				throw new Error("Request failed");
			}
			const data = await response.json();
			setNeedToUpdate("newDM " + data.id.toString());
			toggleUserActionsMenu();
		}
		catch (error) {
			console.error("Error while starting private conversation", error);
		}
	}

	async function addToFriends() {
		const requestOptions = {
			method: 'post',
			headers: { 'Content-Type': 'application/json',
			Authorization: auth.getBearer()},
			body: JSON.stringify({ login: auth.user.login, friendToAdd: props.login})
		};
		try {
			await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/friend/addFriend/`, requestOptions)
			toggleUserActionsMenu();
		}
		catch (error) {
			console.error("Error while adding friend", error);
		}
	}

	async function blockUser() {
		const requestOptions = {
			method: 'post',
			headers: { 'Content-Type': 'application/json',
			Authorization: auth.getBearer()},
			body: JSON.stringify({blockedLogin: props.login, login: auth.user.login})
		};
		try {
			const response = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/chatOption/blockUser/`, requestOptions);
			if (!response.ok) {
				throw new Error("Request failed");
			}
			const response2 = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/chatOption/listOfBlockedUser/${auth.user.login}`, {
				method: "GET",
				headers: { Authorization: auth.getBearer()},
			  });
			if (!response2.ok) {
				throw new Error("Request failed");
			}
			const data = await response2.json();
			let result: {idUser: number, username: string, login: string}[] = [];
			if (data) {
				data.map((element: any) => {
					return result.push(element)
				})
				setBlockedUsers(result);
			}
			toggleUserActionsMenu();
			if (props.isDM)
				setActiveChannel({
					id: -1,
					channelName: "PongOffice Chat",
					type: "",
					status: "",
					username: null,
					dateSend: null,
					msg: null,
					userId: null,
					userLogin: "",
				})
		}
		catch (error) {
			console.error("Error while blocking user", error);
		}
	}

	async function startGame(mode: string) {
		const requestOptions = {
			method: 'post',
			headers: { 'Content-Type': 'application/json' ,
			Authorization: auth.getBearer()},
			body: JSON.stringify({typeGame: mode})
		};
		try {
			const response = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/game/newRoom/`, requestOptions);
			const data = await response.json();
			sendServiceMessage(mode + " game invitation received to play in room " + data.roomId)
			setRoomId(data.roomId);
			updateChat("none");
		}
		catch (error) {
			console.error('Error creating game room', error);
		}
	}

	async function joinGame() {
		const indexOfId = props.msg.lastIndexOf(" ") + 1;
		const idToJoin = parseInt(props.msg.substring(indexOfId));
		try {
			const response = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/chatOption/deleteMessage/${props.msgId}`, {
				method: 'DELETE',
				headers: { Authorization: auth.getBearer()},
			});
			if (!response.ok) {
				console.error(`Error deleting invite: ${response.status}`);
				return;
			}
		} catch (error) {
			console.error('Error removing message:', error);
		}
		setRoomId(idToJoin);
		updateChat("none");
	}

	async function fetchAvatar(avatar: string) {
		const res = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/user/avatar/` + avatar, {
		method: "GET",
		headers: { Authorization: auth.getBearer() },
		});
		const imageBlob = await res.blob();
		const imageObjectURL = URL.createObjectURL(imageBlob);
		setImage(imageObjectURL);
	}

	async function fetchUserAvatar() {
		const data = await fetch(`http://${process.env.REACT_APP_URL_MACHINE}:4000/user/` + props.login, {
			method: "GET",
			headers: { Authorization: auth.getBearer() },
			});
			const newUser = await data.json();
			if (newUser.avatar) {
				try {
					fetchAvatar(newUser.avatar).catch((e) => console.error("Failed to fetch avatar"));
				} catch (e) {
					console.error(e);
				}
			}
	}

	useEffect(() => {
		if (messageType === "owner") {
			if (auth.user.avatar) {
				try {
					fetchAvatar(auth.user.avatar).catch((e) => console.error("Failed to fetch avatar"));
				} catch (e) {
					console.error(e);
				}
			}
		}
		else {
			try {
				fetchUserAvatar().catch((e) => console.error("Failed to fetch avatar"));
			} catch (e) {
				console.error(e);
			}
		}
	}, []);

	const profileUrl = "/profile/" + props.login;

	if (messageType !== "service") {
		return (
			<div className={messageType === "owner" ? "messageItem owner" : "messageItem"}>
				<div className='messageInfo'>
					{messageType === "owner" ?
						<div>
							<img src={image} alt="user Avatar"/>
						</div> :
						<div className="userOptions" ref={menuRef}>
							<img src={image} alt="user Avatar" style={{cursor:"pointer"}} onClick={toggleUserActionsMenu}/>
							<div className={showUserActionsMenu ? "userActions" : "userActions-hidden"}>
								{props.isDM || userInfo.userStatus === "" ? <h4>{props.username}</h4> : <h4>{props.username + " (" + userInfo.userStatus + ")"}</h4>}
								<hr></hr>
								<div className="menuItems">
									{props.isDM && roomId === 0 && <div onClick={() => {startGame("BASIC")}}>Invite to Classic Game</div>}
									{props.isDM && roomId === 0 && <div onClick={() => {startGame("ADVANCED")}}>Invite to Advanced Game</div>}
									{!userInfo.friend && <div onClick={addToFriends}>Add to friends</div>}
									{props.isDM === false && <div onClick={startDmFromMessage}>Send DM</div>}
									<Link to={profileUrl} style={{textDecoration:"none", color: "#ddddf7"}}>
										<div>Show profile</div>
									</Link>
									{((props.isAdmin || props.isOwner) && (userInfo.userStatus === "" || userInfo.userStatus === "admin")) &&
										<div onClick={kickUser}>Kick</div>}
									{((props.isAdmin || props.isOwner) && userInfo.userStatus !== "banned" && userInfo.userStatus !== "owner") &&
										<div onClick={banUser}>Ban</div>}
									{((props.isAdmin || props.isOwner) && (userInfo.userStatus === "" || userInfo.userStatus === "admin")) &&
										<div onClick={muteUser}>Mute 1 minute</div>}
									{(props.isOwner && userInfo.userStatus === "") &&
										<div onClick={sendNewAdmin}>Set as admin </div>}
									<div onClick={blockUser}>Block User</div>
								</div>
								{errorMessage !== "" && <div className="errorMessage">{errorMessage}</div>}
							</div>
						</div>}
				</div>
				<div className='messageContent'>
					<p>{props.msg}</p>
					<div className="name-time">
						{auth.user.login === props.username ? <span></span> : <span>{props.username},</span>}
						<span>{props.date}</span>
					</div>
				</div>
			</div>
		)
	} else {
		return (
			<div className="service-message" >
				{(props.isDM && props.login !== auth.user.login) &&
					<div><p>{props.msg}</p><button onClick={joinGame}>Yes</button><button>No</button></div>}
				{(props.isDM && props.login === auth.user.login) &&
					<div><p>Classic game invitation sent</p></div>}
				{props.isDM === false && <p>{props.msg}</p>}
			</div>
			);
	}
}

export default Message;
