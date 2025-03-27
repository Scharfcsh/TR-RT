// const { contextBridge, ipcRenderer } = require('electron');

// // Expose a limited set of APIs to the renderer process
// contextBridge.exposeInMainWorld('electron', {
//   // Example of exposing a method
//   sayHello: () => ipcRenderer.send('say-hello'),
  
//   // Example of receiving data
//   onHelloResponse: (callback) => 
//     ipcRenderer.on('hello-response', (event, message) => callback(message))
// });


window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
 
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })