import { createContext, useState, useEffect, useContext } from "react";
import io from "socket.io-client";
import { useAuthContext } from "./AuthContext";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuthContext();
  const [anyoffer, setAnyoffer] = useState([]);
  const [offerObject, setOfferObject] = useState(null);
  const [addIceCandidates, setAddIceCandidates] = useState(null);
  // const authUser = "qwertgfd";
  //   const addAnswer = async (offerObject) => {
  //     await peerConnectionRef.current.setRemoteDescription(offerObject.answer);
  //   };
  function createOfferEls(offers) {
    offers.forEach((o) => {
      setAnyoffer((prevOffers) => [...prevOffers, o]);
    });
  }

  useEffect(() => {
    if (authUser) {
      const socket = io("http://localhost:3000", {
        query: {
          userId: authUser._id,
          // userId: authUser,
        },
      });

      setSocket(socket);

      // socket.on() is used to listen to the events. can be used both on client and server side
      socket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      socket.on("availableOffers", (offers) => {
        console.log(offers);
        createOfferEls(offers);
      });

      //someone just made a new offer and we're already here - call createOfferEls
      socket.on("newOfferAwaiting", (offers) => {
        console.log("yessss got the offer from the other person", offers);
        createOfferEls(offers);
      });

      socket.on("answerResponse", (offerObj) => {
        console.log(offerObj);
        // handleAddAnswer(offerObj);
        setOfferObject(offerObj);
        // addAnswer(offerObj);
      });

      socket.on("receivedIceCandidateFromServer", (iceCandidate) => {
        // addNewIceCandidate(iceCandidate);
        setAddIceCandidates(iceCandidate);
        console.log(iceCandidate);
      });

      return () => socket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers, anyoffer, offerObject, addIceCandidates }}
    >
      {children}
    </SocketContext.Provider>
  );
};
