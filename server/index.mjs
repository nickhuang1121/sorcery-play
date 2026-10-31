import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {install} from '../src/cards.js';
import {createRoomStore,RoomError} from './rooms.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
install(JSON.parse(fs.readFileSync(path.join(root,'data/official-cards.json'))));
export function createGameServer({directory=path.join(root,'.online-data'),allowedOrigins=['http://127.0.0.1:5500','http://localhost:5500'],...options}={}){
 const store=createRoomStore({directory,...options});
 const server=http.createServer(async(req,res)=>{
  const json=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname.startsWith('/api/')){
    const origin=req.headers.origin;
    if(origin&&new URL(origin).host!==req.headers.host&&!allowedOrigins.includes(origin))throw new RoomError('不允許跨來源操作',403);
    if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');}
    if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
    const token=req.headers.authorization?.replace(/^Bearer /,'');
    let body={};
    if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk; if(raw.length>128*1024)throw new RoomError('請求過大',413);}try{body=JSON.parse(raw||'{}');}catch{throw new RoomError('JSON 格式錯誤');}}
    if(req.method==='GET'&&url.pathname==='/api/rooms')return json(store.list());
    if(req.method==='POST'&&url.pathname==='/api/rooms')return json(store.create(),201);
    const match=/^\/api\/rooms\/([A-Z0-9]{6})(\/(?:join|replay))?$/.exec(url.pathname);
    if(!match)throw new RoomError('找不到此 API',404);
    if(req.method==='GET'&&match[2]==='/replay')return json(store.replay(match[1],token));
    if(req.method==='POST'&&match[2]==='/join')return json(store.join(match[1]));
    if(req.method==='GET'&&!match[2])return json(store.read(match[1],token));
    if(req.method==='POST'&&!match[2])return json(store.update(match[1],token,body));
    throw new RoomError('不支援此方法',405);
   }
   if(!['GET','HEAD'].includes(req.method))throw new RoomError('不支援此方法',405);
   let pathname=decodeURIComponent(url.pathname);if(pathname.endsWith('/'))pathname+='index.html';
   // Only ship public game assets, never private rooms, sources of this server,
   // dotfiles, arbitrary workspace files, or local audit output.
   if(!/^\/(?:index\.html|lobby\.html|online-play\.html|(?:src|styles|language|data|card-images|assets)\/[^\\]+)$/.test(pathname)||pathname.split('/').some(p=>p==='..'||p.startsWith('.'))||/\.(?:mjs|pem|key)$/.test(pathname))throw new RoomError('找不到此檔案',404);
   const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile())throw new RoomError('找不到此檔案',404);
   const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
   res.writeHead(200,{'Content-Type':mime,'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-cache'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
  }catch(e){json({error:e.message},e.status||400);}
 });
 return {server,store};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||8787),host=process.env.HOST||'127.0.0.1';
 const testSeed=process.env.NODE_ENV==='test'&&process.env.ONLINE_TEST_SEED!==undefined?()=>Number(process.env.ONLINE_TEST_SEED)>>>0:undefined;
 const {server}=createGameServer({directory:process.env.ROOM_DATA_DIR||undefined,...(process.env.ONLINE_ALLOWED_ORIGINS?{allowedOrigins:process.env.ONLINE_ALLOWED_ORIGINS.split(',').filter(Boolean)}:{}),...(testSeed?{seed:testSeed}:{})});
 server.listen(port,host,()=>console.log(`Sorcery online: http://${host}:${port}`));
}
