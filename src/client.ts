// import config from '../config/config.json'
let webSocket = new WebSocket('wss://localhost:3000');

webSocket.onopen = ()=>{
    console.log('web socket client connect with server!');
}

webSocket.onerror = (error)=>{
    console.error(error);
}

webSocket.onclose = ()=>{
    console.log('web socket client disconnect with server!');
}
webSocket.onmessage = (message) => {
    console.log(`from server message: ${message.data}`);
}

export default webSocket;
