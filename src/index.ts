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
import {IncomingMessage} from "http";

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

app.on('error', (error: Error, ctx: Context)=> {
    console.error(`server error ${error} ${ctx}`);
});

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


const wss = new WebSocket.Server({...config, server : httpsServer})


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
