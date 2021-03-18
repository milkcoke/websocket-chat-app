import Koa, {Context, Request, Response, Next} from 'koa';
import Router from '@koa/router';
import WebSocket from "ws";
import cors from "@koa/cors";
import config from '../config/config.json';
import corsOptions from '../config/corsOptions.json';
import sslConfig from '../config/sslConfig.json';
import https from "https";
import path from 'path';
import * as fs from "fs";
import http from "http";

const app = new Koa();
const router = new Router();

const homeDirectory : string = process.env['HOME']!.toString();
const sslKeyPath : string = path.join(homeDirectory, '.ssh','ssl_key');
const [privateKeyFile, publicCRTFile] = [path.join(sslKeyPath, sslConfig.privateKeyFileName), path.join(sslKeyPath, sslConfig.publicCRTFileName)];

const sslOptions = {
    key: fs.readFileSync(privateKeyFile, 'utf8'),
    cert: fs.readFileSync(publicCRTFile, 'utf8')
};

app.use(cors(
    {
        origin: (ctx: Context)=>{
            return '*';
        },
        ...corsOptions
    }
));

router.get('default', '/', async (ctx: Context, next: Next)=>{
    await next();
    ctx.response.type = 'json';
    ctx.response.body = 'this message is from https Server';
});

app.use(router.routes());

// https://localhost:port 로 연결해보자.
const httpsServer = https.createServer(sslOptions, app.callback());

httpsServer.listen(config.port, ()=>{
    console.log(`Server is running on ${config.port}`);
})


// console.log({...config});
const wss = new WebSocket.Server({server : httpsServer});

function broadCast(message: string) {
    console.log(`client input :${message}`);

    wss.clients.forEach((clientWebSocket)=>{
        if (clientWebSocket.readyState === WebSocket.OPEN) {
            clientWebSocket.send(message);
        }
    });
}

function connection(webSocket : WebSocket, request: http.IncomingMessage) {
    // 모든 클라이언트 웹소켓이 최초 연결시에 메시지 받을 때 마다 브로드캐스팅 한다고 이벤트 등록해둠.

    const clientIp : string = request.socket.remoteAddress!;
    console.log(`somebody connect WebSocket client ip : ${clientIp}`);

    // client WebSocket send any message, WebSocket Server should sent message to all clients (websockets)
    webSocket.on('message', broadCast);
    webSocket.on('close', ()=>{
        broadCast(`client : ${clientIp} is out!`);
        webSocket.terminate();
    })


}

wss.on('connection', connection)

wss.on('error', async (server : WebSocket.Server, error : Error)=>{
    console.error(error);
});

wss.on('close', async (server: WebSocket.Server)=>{
    console.log('disconnected');
});
