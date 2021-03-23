// import config from '../config/config.json'

export default function initializeWebSocket() {
    const webSocket = new WebSocket('wss://localhost:3000');

    webSocket.onopen = ()=>{
        console.log('web socket client connect with server!');
    }

    webSocket.onerror = (error)=>{
        console.error(error);
    }

    webSocket.onclose = ()=>{
        console.log('web socket client disconnect with server!');
        console.log('disconnected time : ', new Date());
    }
    webSocket.onmessage = (message) => {
        console.log(`from server message: ${message.data}`);
    }

    // ping 받으면 console 에 표시ㅋ
    // 이건 또 작동 안함. (client 에서 이벤트가 ping 이란걸 인지 못함)
    webSocket.addEventListener('ping', ()=>{
        console.log(`client received ping from server!`);
    })

    return webSocket;
}

