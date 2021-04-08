// import {path, port, reconnectDuration} from '../config/config.json'

export default async function initializeWebSocket(duration: number = 4) {

    if (duration > 60) {
        throw new Error("Failed to connect websocket!");
    }

    let webSocket = new WebSocket('wss://localhost:4000');

    webSocket.onopen = ()=>{
        console.log('web socket client connect with server!');
        // 열리면 반환
        return webSocket;
    }

    webSocket.onerror = (error)=>{
        console.error(error);
    }

    webSocket.onclose = (closeEvent)=>{
        console.log('web socket client disconnect with server!');
        console.log('disconnected time : ', new Date());

        // 연결 실패시 시간을 2배 더해 재연결 시도
        if (closeEvent.code !== 1000) {
            console.log(`close code : ${closeEvent.code} reason: ${closeEvent.reason}`);
            setTimeout(()=>{
                initializeWebSocket(duration * 2);
            }, duration * 1000);
        }

    }

    webSocket.onmessage = (message) => {
        console.log(`from server message: ${message.data}`);
    }

    // ping 받으면 console 에 표시ㅋ
    // 이건 또 작동 안함. (client 에서 이벤트가 ping 이란걸 인지 못함)
    webSocket.addEventListener('ping', ()=>{
        console.log(`client received ping from server!`);
    });

}



