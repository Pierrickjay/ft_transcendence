import React, { createContext, useState, ReactNode } from 'react';

type SharedData = {
  page: string;
  menu: string;
  chat: string;
  zoom: number;
  toolbar: boolean;
  resetGame: boolean;
  coords: { coordX: number; coordY: number };
  scroll: { scrollX: number; scrollY: number };
  game: { player1: string; player2: string; points1: number; points2: number};
  updatePage: (page: string) => void;
  updateMenu: (menu: string) => void;
  updateChat: (chat: string) => void;
  updateZoom: (zoom: number) => void;
  updateReset: (reset: boolean) => void;
  updateToolbar: (newTool: boolean) => void;
  updatePageMenuChatReset: (page:string, menu: string, chat: string, reset: boolean) => void;
  updateCoords: (newCoords: { coordX: number; coordY: number }) => void;
  updateCoordsMenu: (newCoords: { coordX: number; coordY: number }, newMenu: string) => void;
  updateScroll: (newScroll: { scrollX: number; scrollY: number }) => void;
  updateGame: (newGame: { player1: string; player2: string; points1: number; points2: number}) => void;
};

const MyContext = createContext<SharedData | undefined>(undefined);

type MyProviderProps = {
  children: ReactNode;
};

function MyProvider({ children }: MyProviderProps) {
  const [sharedData, setSharedData] = useState({
    page:'Profile',
    menu:'none',
    chat:'none',
    zoom:125,
    toolbar:false,
    resetGame: true,
    coords: { coordX: 0, coordY: 0 },
    scroll: { scrollX: 0, scrollY: 0 },
    game: {player1: "player1", player2: "player2", points1: 0, points2: 0},
  });

  const updatePage = (newData: string) => {
    setSharedData({ ...sharedData, page: newData });
  };
  const updateMenu = (newData: string) => {
    setSharedData({ ...sharedData, menu: newData });
  };
  const updateChat = (newData: string) => {
    setSharedData({ ...sharedData, chat: newData });
  };
  const updateZoom = (newData: number) => {
    setSharedData({ ...sharedData, zoom: newData });
  };
  const updateToolbar = (newData: boolean) => {
    setSharedData({ ...sharedData, toolbar: newData });
  };
  const updateReset = (newReset: boolean) => {
    setSharedData({ ...sharedData, resetGame: newReset });
  };
  const updatePageMenuChatReset = (newPage: string, newMenu: string, newChat: string, newReset: boolean ) => {
    setSharedData({ ...sharedData, page: newPage, menu: newMenu, chat: newChat , resetGame: newReset});
  };
  const updateCoords = (newCoords: { coordX: number; coordY: number }) => {
    setSharedData({ ...sharedData, coords: { ...newCoords } });
  };
  const updateCoordsMenu = (newCoords: { coordX: number; coordY: number }, newMenu: string) => {
    setSharedData({ ...sharedData, coords: { ...newCoords }, menu: newMenu});
  };
  const updateScroll = (newScroll: { scrollX: number; scrollY: number }) => {
    setSharedData({ ...sharedData, scroll: { ...newScroll } });
  };
  const updateGame = (newGame: { player1: string; player2: string; points1: number; points2: number}) => {
    setSharedData({ ...sharedData, game: { ...newGame } });
  };
  

  return (
    <MyContext.Provider value={{ ...sharedData, updatePage, updateMenu, updateChat, updateZoom, updateToolbar, updateReset, updatePageMenuChatReset, updateCoords, updateCoordsMenu, updateScroll, updateGame}}>
      {children}
    </MyContext.Provider>
  );
}

export { MyProvider, MyContext };