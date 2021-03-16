import Koa, {Request, Response, Next} from 'koa';
import Router from '@koa/router';
import WebSocket from "ws";
import WebSocketConfig from '../config/config.json';
import http from "http";

const app = new Koa();
const router = new Router();
//   type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;
WebSocketConfig.server = http.createServer({request: Request, response: Response});

const wss = new WebSocket.Server()

console.dir(WebSocketConfig);


function broadCast(message: string) {
    wss.clients.forEach((client)=>{
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function connection(webSocket : WebSocket, request: Request) {
    console.log('Hello');
    webSocket.on('message', broadCast)
    const clientIp : string = request.socket.remoteAddress!;
    webSocket.send(`hello, your ip is ${clientIp}`);
}


wss.on('connection', connection)

wss.on('error', async (server : WebSocket, error : Error)=>{
    console.error(error);
});

wss.on('close', async ()=>{
    console.log('disconnected');
});
