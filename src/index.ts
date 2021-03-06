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

const httpsServer = https.createServer(sslOptions, app.callback());

httpsServer.listen(config.port, ()=>{
    console.log(`Server is running on ${config.port}`);
})

const wss = new WebSocket.Server({server : httpsServer});

function broadCast(message: string) {
    console.log(`client input :${message}`);

    wss.clients.forEach((clientWebSocket)=>{
        if (clientWebSocket.readyState === WebSocket.OPEN) {
            clientWebSocket.send(message);
        }
    });
}

const heartBeatCheck = setInterval(()=>{
    wss.clients.forEach(ws=>{
        // @ts-ignore
        if (ws['isAlive'] === false) return ws.terminate();
        // @ts-ignore
        ws['isAlive'] = false;
        ws.ping('', false);
    });
}, 5 * 1000);

function connection(webSocket : WebSocket, request: http.IncomingMessage) {
    //@ts-ignore
    webSocket.isAlive = true;

    // ?????? ??????????????? ???????????? ?????? ???????????? ????????? ?????? ??? ?????? ?????????????????? ????????? ????????? ????????????.
    const clientIp : string = request.socket.remoteAddress!;
    console.log(`somebody connect WebSocket client ip : ${clientIp}`);

    // client WebSocket send any message, WebSocket Server should sent message to all clients (websockets)

    webSocket.on('ping', (data => {
        console.log(`receive from client ping buffer : ${data}`);
    }));

    webSocket.on('pong', (data) => {
        //@ts-ignore
        webSocket.isAlive = true
        console.log(`pong buffer: ${data.toString('utf8')}`);
    });

    webSocket.on('message', broadCast);
    webSocket.on('close', ()=>{
        broadCast(`client : ${clientIp} is out!`);
        webSocket.terminate();
    });


}

wss.on('connection', connection);

wss.on('error', async (server : WebSocket.Server, error : Error)=>{
    console.error(error);
});

wss.on('close', async (server: WebSocket.Server)=>{
    clearInterval(heartBeatCheck);
    console.log('disconnected');
});
