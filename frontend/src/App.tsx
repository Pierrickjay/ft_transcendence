import React, { useContext, useState } from 'react';
import './styles.scss';
import { createBrowserRouter, RouterProvider, Route, Outlet, Navigate } from 'react-router-dom';
import Login from './routes/Login';
import Register from './routes/Register';
import Home from './routes/Home';
import Profile from './routes/Profile';
import Navbar from './components/menus/Navbar';
import Leftbar from './components/menus/Leftbar';
import FriendsComponent from './components/friendlist/FriendsComponent';
import { AuthContext } from './context/authContext';
import { ChatApp } from './Chat/chatApp';
import ChatComponent from './components/chat/ChatComponent';
import Leaderboards from './components/leaderboards/Leaderboards';

function App() {

  const {currentUser} = useContext(AuthContext);

  const rightBarSwitch = (state: string) => {
    switch(state) {
      case "friends" :
        return (<FriendsComponent />);
      case "chat" :
        return (<ChatComponent />);
      case "leaderboards" :
        return (<Leaderboards />);
      default :
        return;
    }
  }

  const Layout = ()=> {

    const [RightBar, setRightBar] = useState("none");

    return (
      <div>
        <Navbar RightBar={RightBar} setRightBar={setRightBar}/>
        <div style={{display: "flex"}}>
          <Leftbar />
          <div style={{flex: 7}}>
            <Outlet />
          </div>
          {rightBarSwitch(RightBar)}
        </div>
      </div>
    );
  }

  const ProtectedRoute = ({children}: any) => {

    if (!currentUser) {
      return (<Navigate to="/login" />);
    }
    return (children);
  }

  const router = createBrowserRouter([
    {
      path:"/",
      element: <ProtectedRoute><Layout /></ProtectedRoute>,
      children:[
        {
          path:"/",
          element: <Home />
        },
        {
          path:"/profile/:id",
          element: <Profile />
        }
      ]
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
  ]);
  return (
    <div >
        <RouterProvider router={router} />
    </div>
  );
}

export default App;