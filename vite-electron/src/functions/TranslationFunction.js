// const processAudioStream = async (inputStream) => {
//   // Create an audio context to process the stream
//   const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//   const source = audioContext.createMediaStreamSource(inputStream);

//   // Create a processor node for audio processing
//   const processor = audioContext.createScriptProcessor(4096, 1, 1);

//   // Buffer to temporarily store audio chunks
//   let audioChunks = [];

//   // Create a MediaRecorder to capture chunks of audio
//   const mediaRecorder = new MediaRecorder(inputStream);

//   // Speech recognition setup
//   const speechRecognition = new (window.SpeechRecognition ||
//     window.webkitSpeechRecognition)();
//   speechRecognition.continuous = true;
//   speechRecognition.interimResults = true;

//   // Target language for translation (can be made configurable)
//   const targetLanguage = "es"; // Spanish as an example

//   // Create a destination for the processed audio
//   const destination = audioContext.createMediaStreamDestination();

//   // Setup audio processing pipeline
//   source.connect(processor);
//   processor.connect(audioContext.destination);

//   // Start recording
//   mediaRecorder.start();

//   // Start speech recognition
//   speechRecognition.start();

//   // Create a new MediaStream for the processed audio
//   const processedStream = new MediaStream();

//   return new Promise((resolve) => {
//     // Handle speech recognition results
//     speechRecognition.onresult = async (event) => {
//       const transcript = Array.from(event.results)
//         .map((result) => result[0].transcript)
//         .join("");

//       console.log("Transcription:", transcript);

//       // Translate the text
//       const translatedText = await translateText(transcript, targetLanguage);
//       console.log("Translated:", translatedText);

//       // Convert translated text back to speech
//       const translatedAudio = await textToSpeech(
//         translatedText,
//         targetLanguage
//       );

//       // Create a new audio track from the synthesized speech
//       const audioTrack = createAudioTrackFromBuffer(
//         translatedAudio,
//         audioContext
//       );

//       // Add the new track to our processed stream
//       processedStream.addTrack(audioTrack);
//     };

//     // Resolve with the processed stream
//     // Note: In a real implementation, you might need to handle timing issues
//     // between transcription, translation, and synthesis
//     resolve(processedStream);
//   });
// };

// // Function to translate text
// const translateText = async (text, targetLanguage) => {
//   // This would typically be an API call to a translation service
//   // For example, using Google Cloud Translation API or similar
//   try {
//     const response = await fetch("https://your-translation-api-endpoint", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         text: text,
//         targetLanguage: targetLanguage,
//       }),
//     });

//     const data = await response.json();
//     return data.translatedText;
//   } catch (error) {
//     console.error("Translation error:", error);
//     return text; // Fallback to original text on error
//   }
// };

// // Function to convert text to speech
// const textToSpeech = async (text, language) => {
//   // This would typically be an API call to a TTS service
//   // For example, using Google Cloud Text-to-Speech API or similar
//   try {
//     const response = await fetch("https://your-tts-api-endpoint", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         text: text,
//         language: language,
//       }),
//     });

//     // Assuming the API returns audio as ArrayBuffer
//     const audioData = await response.arrayBuffer();
//     return audioData;
//   } catch (error) {
//     console.error("Text-to-speech error:", error);

//     // Fallback: Use browser's built-in speech synthesis
//     return new Promise((resolve) => {
//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.lang = language;

//       // This is a simplified approach - in production you'd need to
//       // capture the audio from speechSynthesis which is more complex
//       speechSynthesis.speak(utterance);

//       // Return an empty buffer as fallback
//       resolve(new ArrayBuffer(0));
//     });
//   }
// };

// // Function to create an audio track from an audio buffer
// const createAudioTrackFromBuffer = (audioBuffer, audioContext) => {
//   // In a real implementation, you would decode the audio buffer
//   // and create a MediaStreamTrack from it

//   // This is a simplified approach
//   const oscillator = audioContext.createOscillator();
//   const destination = audioContext.createMediaStreamDestination();
//   oscillator.connect(destination);
//   oscillator.start();

//   // In reality, you would play back the decoded audio buffer instead
//   // This is just a placeholder that creates a tone

//   return destination.stream.getAudioTracks()[0];
// };





// File structure:
// - package.json
// - main.js
// - preload.js
// - index.html
// - renderer.js
// - server.js

// --------- package.json ---------
// {
//     "name": "voice-chat-app",
//     "version": "1.0.0",
//     "description": "Real-time voice chat application with speech-to-text and text-to-speech",
//     "main": "main.js",
//     "scripts": {
//       "start": "electron .",
//       "server": "node server.js"
//     },
//     "dependencies": {
//       "electron": "^28.2.0",
//       "express": "^4.18.2",
//       "socket.io": "^4.7.2",
//       "socket.io-client": "^4.7.2"
//     }
//   }
  
  // --------- main.js ---------
  const { app, BrowserWindow, ipcMain } = require('electron');
  const path = require('path');
  const url = require('url');
  
  let mainWindow;
  
  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });
  
    mainWindow.loadFile('index.html');
    
    // Open DevTools (comment out in production)
    // mainWindow.webContents.openDevTools();
  
    mainWindow.on('closed', function () {
      mainWindow = null;
    });
  }
  
  app.whenReady().then(createWindow);
  
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
  
  app.on('activate', function () {
    if (mainWindow === null) createWindow();
  });
  
  // --------- preload.js ---------
  const { contextBridge, ipcRenderer } = require('electron');
  const io = require('socket.io-client');
  
  let socket;
  let speechRecognition;
  
  contextBridge.exposeInMainWorld('voiceChat', {
    connectToRoom: (roomId, username) => {
      socket = io('http://0.0.0.0:3000');
      
      socket.emit('join', { roomId, username });
      
      socket.on('connect', () => {
        console.log('Connected to server');
      });
      
      return socket;
    },
    
    startListening: () => {
      if (!('webkitSpeechRecognition' in window)) {
        return { error: 'Speech recognition not supported' };
      }
      
      speechRecognition = new webkitSpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      
      return { success: true };
    },
    
    disconnectFromRoom: () => {
      if (socket) {
        socket.disconnect();
      }
      if (speechRecognition) {
        speechRecognition.stop();
      }
    }
  });
  
  // --------- index.html ---------
//   <!DOCTYPE html>
//   <html>
//   <head>
//     <meta charset="UTF-8">
//     <title>Voice Chat App</title>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         padding: 20px;
//         max-width: 800px;
//         margin: 0 auto;
//       }
      
//       .container {
//         display: flex;
//         flex-direction: column;
//         height: 100vh;
//       }
      
//       .join-form {
//         margin-bottom: 20px;
//       }
      
//       .chat-container {
//         display: none;
//         flex: 1;
//         flex-direction: column;
//       }
      
//       .messages {
//         flex: 1;
//         overflow-y: auto;
//         border: 1px solid #ccc;
//         padding: 10px;
//         margin-bottom: 10px;
//         height: 300px;
//       }
      
//       .message {
//         margin-bottom: 10px;
//         padding: 8px;
//         border-radius: 5px;
//       }
      
//       .outgoing {
//         background-color: #e3f2fd;
//         align-self: flex-end;
//       }
      
//       .incoming {
//         background-color: #f1f1f1;
//         align-self: flex-start;
//       }
      
//       .controls {
//         display: flex;
//         justify-content: space-between;
//         margin-top: 10px;
//       }
      
//       .status {
//         color: #666;
//         font-style: italic;
//         margin-top: 10px;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="join-form" id="joinForm">
//         <h2>Join a Voice Chat Room</h2>
//         <div>
//           <label for="username">Your Name:</label>
//           <input type="text" id="username" placeholder="Enter your name">
//         </div>
//         <div>
//           <label for="roomId">Room ID:</label>
//           <input type="text" id="roomId" placeholder="Enter room ID or create new">
//         </div>
//         <button id="joinBtn">Join Room</button>
//       </div>
      
//       <div class="chat-container" id="chatContainer">
//         <h2 id="roomInfo">Room: <span id="currentRoom"></span></h2>
//         <div class="messages" id="messages"></div>
//         <div class="status" id="status">Not connected</div>
//         <div class="controls">
//           <button id="startBtn">Start Speaking</button>
//           <button id="stopBtn" disabled>Stop Speaking</button>
//           <button id="leaveBtn">Leave Room</button>
//         </div>
//       </div>
//     </div>
    
//     <script src="renderer.js"></script>
//   </body>
//   </html>
  
  // --------- renderer.js ---------
  document.addEventListener('DOMContentLoaded', () => {
    const joinForm = document.getElementById('joinForm');
    const chatContainer = document.getElementById('chatContainer');
    const messagesContainer = document.getElementById('messages');
    const statusEl = document.getElementById('status');
    const currentRoomEl = document.getElementById('currentRoom');
    
    const joinBtn = document.getElementById('joinBtn');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const leaveBtn = document.getElementById('leaveBtn');
    
    let socket;
    let username;
    let roomId;
    let recognition;
    let isListening = false;
    
    // Function to join a room
    joinBtn.addEventListener('click', () => {
      username = document.getElementById('username').value.trim();
      roomId = document.getElementById('roomId').value.trim();
      
      if (!username) {
        alert('Please enter your name');
        return;
      }
      
      if (!roomId) {
        roomId = generateRoomId();
      }
      
      // Connect to room
      socket = window.voiceChat.connectToRoom(roomId, username);
      
      setupSocketListeners();
      
      // Show chat interface
      joinForm.style.display = 'none';
      chatContainer.style.display = 'flex';
      currentRoomEl.textContent = roomId;
      
      // Initialize speech recognition
      const result = window.voiceChat.startListening();
      if (result.error) {
        statusEl.textContent = result.error;
        return;
      }
      
      // Initialize speech recognition
      setupSpeechRecognition();
      
      statusEl.textContent = 'Connected to room ' + roomId + ' as ' + username;
    });
    
    // Start speaking
    startBtn.addEventListener('click', () => {
      if (recognition) {
        recognition.start();
        isListening = true;
        statusEl.textContent = 'Listening...';
        startBtn.disabled = true;
        stopBtn.disabled = false;
      }
    });
    
    // Stop speaking
    stopBtn.addEventListener('click', () => {
      if (recognition) {
        recognition.stop();
        isListening = false;
        statusEl.textContent = 'Not listening';
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    });
    
    // Leave room
    leaveBtn.addEventListener('click', () => {
      window.voiceChat.disconnectFromRoom();
      
      // Show join form
      chatContainer.style.display = 'none';
      joinForm.style.display = 'block';
      
      // Clear messages
      messagesContainer.innerHTML = '';
      statusEl.textContent = 'Not connected';
    });
    
    function setupSocketListeners() {
      socket.on('message', (data) => {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.classList.add('message');
        
        if (data.username === username) {
          messageEl.classList.add('outgoing');
          messageEl.textContent = `You: ${data.text}`;
        } else {
          messageEl.classList.add('incoming');
          messageEl.textContent = `${data.username}: ${data.text}`;
          
          // Use browser's text-to-speech to read the incoming message
          if (data.final) {
            speak(data.text);
          }
        }
        
        // Add message to UI
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
      
      socket.on('userJoined', (data) => {
        statusEl.textContent = `${data.username} joined the room`;
      });
      
      socket.on('userLeft', (data) => {
        statusEl.textContent = `${data.username} left the room`;
      });
    }
    
    function setupSpeechRecognition() {
      recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      let finalTranscript = '';
      let interimTranscript = '';
      
      recognition.onresult = (event) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            
            // Send final result to server
            socket.emit('message', {
              text: event.results[i][0].transcript,
              final: true
            });
            
            // Clear transcript for next speech segment
            finalTranscript = '';
          } else {
            interimTranscript += event.results[i][0].transcript;
            
            // Send interim result to server
            socket.emit('message', {
              text: event.results[i][0].transcript,
              final: false
            });
          }
        }
      };
      
      recognition.onerror = (event) => {
        statusEl.textContent = 'Error occurred in recognition: ' + event.error;
      };
      
      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        }
      };
    }
    
    function speak(text) {
      // Use the browser's native speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
    
    function generateRoomId() {
      return Math.random().toString(36).substring(2, 10);
    }
  });
  
  // --------- server.js ---------
  const express = require('express');
  const http = require('http');
  const socketIo = require('socket.io');
  
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  const PORT = process.env.PORT || 3000;
  
  // Store active rooms and users
  const rooms = {};
  
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    let currentRoom = null;
    let username = null;
  
    socket.on('join', (data) => {
      currentRoom = data.roomId;
      username = data.username;
      
      // Join socket room
      socket.join(currentRoom);
      
      // Initialize room if doesn't exist
      if (!rooms[currentRoom]) {
        rooms[currentRoom] = [];
      }
      
      // Add user to room
      rooms[currentRoom].push({
        id: socket.id,
        username
      });
      
      // Notify everyone in the room
      io.to(currentRoom).emit('userJoined', {
        username,
        users: rooms[currentRoom]
      });
      
      console.log(`${username} joined room ${currentRoom}`);
    });
  
    socket.on('message', (data) => {
      if (currentRoom) {
        // Broadcast message to everyone in the room
        io.to(currentRoom).emit('message', {
          username,
          text: data.text,
          final: data.final
        });
      }
    });
  
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      if (currentRoom && rooms[currentRoom]) {
        // Remove user from room
        rooms[currentRoom] = rooms[currentRoom].filter(user => user.id !== socket.id);
        
        // Notify everyone in the room
        io.to(currentRoom).emit('userLeft', {
          username,
          users: rooms[currentRoom]
        });
        
        // Clean up empty rooms
        if (rooms[currentRoom].length === 0) {
          delete rooms[currentRoom];
        }
      }
    });
  });
  
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });