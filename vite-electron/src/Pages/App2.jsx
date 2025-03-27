import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import { useSocketContext } from "../context/SocketContext";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import Button from "../components/Button";
import { PhoneCall, Users, Video, Mic, MicOff } from "lucide-react";
import useFetchUsers from "../hooks/useFetchUsers";
const peerConfiguration = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

function App2() {
  const [userId, setUserId] = useState("");
  // const [socket, setSocket] = useState(null);
  // const [onlineUsers, setOnlineUsers] = useState({});
  const [active, setActive] = useState(null);
  const [callState, setCallState] = useState("idle"); // idle, calling, receiving, connected
  const [peerConnection, setPeerConnection] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [currentCaller, setCurrentCaller] = useState(null);
  const [currentReceiver, setCurrentReceiver] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [iceCandidates, setIceCandidates] = useState([]);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const didIOfferRef = useRef(false);
  const socketRef = useRef(null);
  const { users } = useFetchUsers();

  const { socket, anyoffer, offerObject, addIceCandidates, onlineUsers } =
    useSocketContext();
    useEffect(() => {
      console.log(onlineUsers,"online===============")
    }, [onlineUsers]);
  socketRef.current = socket;
  const { authUser } = useAuthContext();

  const [incomingCall, setIncomingCall] = useState(null);
    useEffect(() => {
      console.log("incoming call", anyoffer);
      setIncomingCall(anyoffer[0]);
    }, [anyoffer]);

  const [isSpeaking, setIsSpeaking] = useState({
    local: false,
    remote: false
  });
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  const fetchUserMedia = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices API not supported");
      }
  
      // First enumerate devices to find available audio inputs
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === "audioinput");
  
      console.log("Available audio devices:", audioInputs);
  
      if (audioInputs.length === 0) {
        throw new Error("No audio input devices found. Please check your microphone connection.");
      }
  
      // Try to get the default audio device first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            deviceId: audioInputs[0].deviceId // Use first available device
          },
          video: false
        });
  
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error("No audio track was created");
        }
  
        const activeTrack = audioTracks[0];
        console.log("Active audio track:", {
          label: activeTrack.label || "Unnamed track",
          enabled: activeTrack.enabled,
          muted: activeTrack.muted,
          readyState: activeTrack.readyState,
          deviceId: activeTrack.getSettings().deviceId
        });
  
        localAudioRef.current.srcObject = stream;
        setupAudioAnalysis(stream, true);
        localStreamRef.current = stream;
        return stream;
  
      } catch (err) {
        console.error("Error with default device, trying fallback:", err);
        // Fallback to try specific PulseAudio/ALSA device
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: "default", // Try PulseAudio default device
            echoCancellation: false, // Disable processing to reduce complexity
            noiseSuppression: false,
            autoGainControl: false
          },
          video: false
        });
  
        if (localVideoRef?.current) {
          localVideoRef.current.srcObject = stream;
        }
  
        localStreamRef.current = stream;
        return stream;
      }
  
    } catch (err) {
      console.error("Error in fetchUserMedia:", err);
      
      // Enhanced error reporting
      let errorMessage;
      switch (err.name) {
        case "NotAllowedError":
          errorMessage = "Microphone access denied. Please check browser permissions and system privacy settings.";
          break;
        case "NotFoundError":
          errorMessage = `No microphone found. Please check:\n- Microphone connection\n- System audio settings\n- Browser permissions`;
          break;
        case "NotReadableError":
          errorMessage = "Microphone is in use by another application.";
          break;
        default:
          errorMessage = `Error accessing media devices: ${err.message}`;
      }
  
      toast.error(errorMessage);
      throw err;
    }
  };

  const setupAudioAnalysis = (stream, isLocal) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, value) => acc + value, 0) / bufferLength;
        
        setIsSpeaking(prev => ({
          ...prev,
          [isLocal ? 'local' : 'remote']: average > 30
        }));

        requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
    } catch (err) {
      console.error("Error setting up audio analysis:", err);
    }
  };

  const setupPeerConnection = async () => {
    const pc = new RTCPeerConnection(peerConfiguration);
    peerConnectionRef.current = pc;

    // Set up media streams
    remoteStreamRef.current = new MediaStream();
    // if (remoteVideoRef.current) {
    //   remoteVideoRef.current.srcObject = remoteStreamRef.current;
    // }

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    pc.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        socketRef.current.emit("sendIceCandidateToSignalingServer", {
          iceCandidate: event.candidate,
          iceUserId: authUser._id,
          didIOffer: didIOfferRef.current,
        });
      }
    });

    // Handle incoming tracks
    pc.addEventListener("track", (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
      const [remoteStream] = event.streams;
      remoteAudioRef.current.srcObject = remoteStream;
      setupAudioAnalysis(remoteStream, false);
    });

    // Debug signaling state changes
    pc.addEventListener("signalingstatechange", () => {
      console.log("Signaling State:", pc.signalingState);
    });

    // Debug connection state changes
    pc.addEventListener("connectionstatechange", () => {
      console.log("Connection State:", pc.connectionState);
    });

    return pc;
  };

  const initiateCall = async () => {
    try {
      await fetchUserMedia();
      const pc = await setupPeerConnection();

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      didIOfferRef.current = true;
      socketRef.current.emit("newOffer", authUser._id, offer);
      toast("Call Initiated!!");
    } catch (err) {
      console.error("Error creating offer:", err);
    }
  };

  const handleUserCall = (id) => {
    setSelectedUser(id);
    console.log("selected user detail", selectedUser);
    // call();
    initiateCall();
  };

  const answerOffer = async (offerObj) => {
    await fetchUserMedia();
    const pc = await setupPeerConnection();

    await pc.setRemoteDescription(offerObj.offer);

    const answer = await pc.createAnswer({});
    await pc.setLocalDescription(answer);

    offerObj.answer = answer;
    const offerIceCandidates = await socket.emitWithAck("newAnswer", offerObj);
    console.log("offerIceCandidates", offerIceCandidates);
    // offerIceCandidates.forEach((candidate) => {
    //   peerConnectionRef.current.addIceCandidate(candidate);
    //   console.log("======Added Ice Candidate======");
    // });
    offerIceCandidates.forEach((candidate) => {
      pc.addIceCandidate(candidate);
    });
    console.log(offerIceCandidates);
  };

  const addAnswer = async (offerObject) => {
    try {
      if (peerConnectionRef.current && offerObject?.answer) {
        await peerConnectionRef.current.setRemoteDescription(
          offerObject.answer
        );
      }
    } catch (err) {
      console.error("Error adding answer:", err);
    }
  };
  const handleAnswerCall = () => {
    setSelectedUser(incomingCall);
    answerOffer(incomingCall);
    setIncomingCall(null);
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    peerConnectionRef.current = null;
    setIsMuted(false); // Reset mute state
  };

  // Add this to your "End Call" button click handler
  const handleEndCall = () => {
    cleanupCall();
    setSelectedUser(null);
  };

   useEffect(() => {
      if (offerObject) {
        addAnswer(offerObject);
      }
    }, [offerObject]);
  

    useEffect(() => {
        if (peerConnectionRef.current && addIceCandidates) {
          peerConnectionRef.current
            .addIceCandidate(addIceCandidates)
            .catch((err) => console.error("Error adding ICE candidate:", err));
        }
      }, [addIceCandidates]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      setIsMuted(!isMuted);
      toast.success(isMuted ? 'Unmuted' : 'Muted');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-purple-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Video Chat Dashboard | <strong>{authUser.fullname}</strong></h1>
        <Button />
      </header>
      <main className="container mx-auto p-4">
        {!selectedUser ? (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {/* Available users */}
              <Users className="mr-2" /> Available Users
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserCall(user.id)}
                  className="bg-white p-4 relative rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {user.name.charAt(0)}
                  </div>
                  <span className="w-1/3">{user.name}</span>
                  <span className="text-end w-1/3 ml-10">
                    {onlineUsers[user.id] ? (
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-200 text-green-800`}
                      >
                        Online
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-200 text-red-800`}
                      >
                        Offline
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Video className="mr-2" /> Call with {selectedUser.name}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded-full ${
                    isMuted 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                  onClick={handleEndCall}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                  End Call
                </button>
              </div>
            </div>

            {/* <div className="flex  gap-4">
              <div className={`p-4 rounded-full w-48 h-48 ${isSpeaking.local ? 'bg-green-100' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">You {isMuted && '(Muted)'}</span>
                  {isSpeaking.local && !isMuted && (
                    <span className="text-green-600 text-sm">Speaking...</span>
                  )}
                </div>
                <audio ref={localAudioRef} autoPlay playsInline muted/>
              </div>

              <div className={`p-4 rounded-full w-48 h-48 ${isSpeaking.remote ? 'bg-green-100' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{selectedUser.name}</span>
                  {isSpeaking.remote && (
                    <span className="text-green-600 text-sm">Speaking...</span>
                  )}
                </div>
                <audio ref={remoteAudioRef} autoPlay playsInline />
              </div>
            </div> */}
            <div className="flex  items-center justify-center gap-16">
      <div className="relative">
        {/* Speaking animation for local user */}
        {isSpeaking.local && !isMuted && (
          <>
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping-slow" />
            <div
              className="absolute inset-0 rounded-full bg-green-400/30"
              style={{
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          </>
        )}

        <div
          className={`relative p-4 rounded-full w-72 h-72 flex flex-col justify-between z-10 ${
            isSpeaking.local && !isMuted ? "bg-green-100" : "bg-gray-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">You {isMuted && "(Muted)"}</span>
            {isSpeaking.local && !isMuted && <span className="text-green-600 text-sm font-medium">Speaking...</span>}
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>

          <audio ref={localAudioRef} autoPlay playsInline muted />
        </div>
      </div>

      <div className="relative">
        {/* Speaking animation for remote user */}
        {isSpeaking.remote && (
          <>
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping-slow" />
            <div
              className="absolute inset-0 rounded-full bg-green-400/30"
              style={{
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          </>
        )}

        <div
          className={`relative p-4 rounded-full w-72 h-72 flex flex-col justify-between z-10 ${
            isSpeaking.remote ? "bg-green-100" : "bg-gray-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{selectedUser.name}</span>
            {isSpeaking.remote && <span className="text-green-600 text-sm font-medium">Speaking...</span>}
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>

          <audio ref={remoteAudioRef} autoPlay playsInline />
        </div>
      </div>

      {/* Add the animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.3;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.7;
          }
        }
        
        .animate-ping-slow {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
          </div>
        )}
      </main>
      {incomingCall && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <p className="mb-2">Incoming call</p>
          <button
            onClick={handleAnswerCall}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <PhoneCall className="mr-2" size={18} />
            Answer Call
          </button>
        </div>
      )}
    </div>
  );
}

export default App2;
