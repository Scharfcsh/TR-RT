import { Server } from "socket.io";
import http from "http";
import express from "express";
import { log } from "console";


const app = express();


const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};
export const userSocketMap = {}; // {userId: socketId}
let offers = [
	// offererUserName
	// offer
	// offerIceCandidates
	// answererUserName
	// answer
	// answererIceCandidates
];

const cleanupOldOffers = () => {
	const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
	// offers = offers.filter(offer => offer.timestamp > fiveMinutesAgo);
	offers=[]
};

const connectedSockets = [
	//username, socketId
]

io.on("connection", (socket) => {
	const userId = socket.handshake.query.userId;
	userSocketMap[userId] = socket.id;
	console.log(`User connected - Socket: ${socket.id}, UserId: ${userId}`);

	if (userId && userId !== "undefined") {
		userSocketMap[userId] = socket.id;
		console.log("Current connected users:", userSocketMap);
	}

	io.emit("getOnlineUsers", userSocketMap);

	if (offers.length) {
		socket.emit('availableOffers', offers);
	}

	socket.on('newOffer', (userId, newOffer) => {
		cleanupOldOffers();
		offers.push({
			offereruserId: userId,
			offer: newOffer,
			offerIceCandidates: [],
			answereruserId: null,
			answer: null,
			answererIceCandidates: []
		})
		// console.log(newOffer);
		console, log(userId);
		// console.log(newOffer.sdp.slice(150))
		console.log(userSocketMap);
		//send out to all connected sockets EXCEPT the caller
		for (const [key, socketId] of Object.entries(userSocketMap)) {
			if (key !== userId) {
				io.to(socketId).emit('newOfferAwaiting', offers.slice(-1));
			}
		}
	})

	socket.on('newAnswer', (offerObj, ackFunction) => {

		console.log(`Processing answer from ${offerObj.answereruserId} to ${offerObj.offereruserId}`);

		// console.log(offerObj.answer);
		console.log(offerObj.offereruserId);
		console.log(userSocketMap);
		console.log(typeof offerObj.offereruserId);
		console.log("------------------------------------------------------")
		//emit this answer (offerObj) back to CLIENT1
		//in order to do that, we need CLIENT1's socketid
		// const socketToAnswer = connectedSockets.find(s=>s.userId === offerObj.offereruserId);
		const socketToAnswer = userSocketMap[offerObj.offereruserId];
		console.log(socketToAnswer, "--------------------------------------------------");
		if (!socketToAnswer) {
			console.log("No matching socket")
			return;
		}
		//we found the matching socket, so we can emit to it!
		// const socketIdToAnswer = socketToAnswer;
		// console.log("we find the offer to update so we can emit it", socketIdToAnswer);

		const offerToUpdate = offers.find(o => o.offereruserId === offerObj.offereruserId);
		// console.log(offerToUpdate);
		if (!offerToUpdate) {
			console.log("No OfferToUpdate")
			return;
		}
		//send back to the answerer all the iceCandidates we have already collected
		ackFunction(offerToUpdate.offerIceCandidates);
		offerToUpdate.answer = offerObj.answer
		offerToUpdate.answereruserId = offerObj.answereruserId;


		console.log("offerToUpdate done", offerToUpdate.answererIceCandidates);
		//socket has a .to() which allows emiting to a "room"
		//every socket has it's own room
		socket.to(socketToAnswer).emit('answerResponse', offerToUpdate)
	})

	socket.on('sendIceCandidateToSignalingServer', iceCandidateObj => {
		const { didIOffer, iceUserId, iceCandidate } = iceCandidateObj;
		// console.log(iceCandidate);
		if (didIOffer) {
			//this ice is coming from the offerer. Send to the answerer
			const offerInOffers = offers.find(o => o.offereruserId === iceUserId);
			if (offerInOffers) {
				offerInOffers.offerIceCandidates.push(iceCandidate)
				// 1. When the answerer answers, all existing ice candidates are sent
				// 2. Any candidates that come in after the offer has been answered, will be passed through
				if (offerInOffers.answereruserId) {
					//pass it through to the other socket
					const socketToSendTo = userSocketMap[offerInOffers.answereruserId];

					if (socketToSendTo) {
						socket.to(socketToSendTo).emit('receivedIceCandidateFromServer', iceCandidate)
					} else {
						console.log("Ice candidate recieved but could not find answere")
					}
				}
			}
		} else {

			const offerInOffers = offers.find(o => o.answereruserId === iceUserId);
			if (offerInOffers) {
				offerInOffers.answererIceCandidates.push(iceCandidate);
				const socketToSendTo = userSocketMap[offerInOffers.offereruserId];
				if (socketToSendTo) {
					socket.to(socketToSendTo).emit('receivedIceCandidateFromServer', iceCandidate);
				}
			}
			//this ice is coming from the answerer. Send to the offerer
			//pass it through to the other socket
			// console.log(offers);


			// // const offerInOffers = offers.find(o=>o.answereruserId === iceUserId);
			// // console.log(offerInOffers);
			// console.log("-------------------------------------------------------")
			// console.log("-------------------------------------------------------")
			// console.log("-------------------------------------------------------")
			// console.log("-------------------------------------------------------")
			// console.log("-------------------------------------------------------")
			// console.log(offers[0].offereruserId);
			// console.log(userSocketMap[0])
			// const socketToSendTo = Object.values(userSocketMap)[0];
			// console.log(socketToSendTo);
			// if (socketToSendTo) {
			// 	socket.to(socketToSendTo).emit('receivedIceCandidateFromServer', iceCandidate)
			// } else {
			// 	console.log("Ice candidate recieved but could not find offerer")
			// }
		}
		// console.log(offers)
	})
	socket.on("endcall",()=>{
		const offers=[]
	})

	socket.on("disconnect", () => {
		console.log("user disconnected", socket.id);
		delete userSocketMap[userId];
		offers = offers.filter(offer =>
			offer.offereruserId !== userId && offer.answereruserId !== userId
		);
		io.emit("getOnlineUsers", userSocketMap);
	});
});



export { app, io, server };