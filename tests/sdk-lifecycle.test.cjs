const {test}=require('node:test'); const assert=require('node:assert/strict'); const {EventEmitter}=require('node:events');
const {Session}=require('../lib/core/session'); const {Auth}=require('../lib/core/auth');
const {WebSocketReceiver,WebSocketReceiverConfig}=require('../lib/receivers/websocket');
const {FileProcessor}=require('../lib/message/file-processor'); const {createServer}=require('node:http');
test('startup owns auth and gateway failures, synchronous ready and stop cancellation', async()=>{
 const receiver=new EventEmitter(); receiver.start=()=>receiver.emit('ready'); receiver.on('error',()=>{});
 const session=Object.assign(Object.create(Session.prototype),{receiver,userClose:false,getAccessToken:async()=>{}});
 const clean=()=>{assert.equal(receiver.listenerCount('ready'),0);assert.equal(receiver.listenerCount('stop'),0);assert.equal(receiver.listenerCount('error'),1);};
 session.getAccessToken=async()=>{throw Error('auth');}; await assert.rejects(session.start(),/auth/);clean();
 session.getAccessToken=async()=>{}; await session.start();clean();
 receiver.start=async()=>{throw Error('gateway');}; await assert.rejects(session.start(),/gateway/);clean();
 receiver.start=()=>new Promise(()=>{}); const pending=session.start(); const cancelled=assert.rejects(pending,/startup stopped/);
 await Promise.resolve();await Promise.resolve();receiver.emit('stop');await cancelled;clean();
});
test('late gateway lookup cannot create socket after stop', async()=>{
 let done,calls=0; const receiver=new WebSocketReceiver(new WebSocketReceiverConfig({autoReconnect:false,socketFactory(){calls++;}}));
 const session={userClose:false,getWsUrl:()=>new Promise(resolve=>done=resolve)};
 const pending=receiver.start(session);await receiver.stop();done('wss://invalid');await pending;assert.equal(calls,0);
});
test('destroy prevents late auth completion from rearming refresh',async()=>{
 let done;const logger={debug(){},info(){}};const auth=new Auth({appid:'fixture',secret:'fixture'},{logger});
 auth.fetchNewToken=()=>new Promise(resolve=>done=resolve);const pending=auth.refreshAccessToken();const cancelled=assert.rejects(pending,/destroyed/);
 auth.destroy();done({access_token:'fixture',expires_in:3600});await cancelled;assert.equal(auth.refreshTimer,undefined);assert.equal(auth.getCurrentTokenInfo(),null);
});
for(const base of [0,1]) test(`uploads exact slices with ${base}-based unordered indices`,async()=>{
 const uploads=new Map();const server=createServer(async(req,res)=>{const chunks=[];for await(const chunk of req)chunks.push(chunk);uploads.set(Number(req.url.slice(1)),Buffer.concat(chunks));res.end();});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  const bytes=Buffer.from(Array.from({length:237},(_,i)=>i%251));const parts=[0,1,2].map(i=>({index:i+base,block_size:String(Math.min(100,237-i*100)),presigned_url:`http://127.0.0.1:${server.address().port}/${i+base}`})).reverse();
  const processor=new FileProcessor({post:async(path)=>({data:path.endsWith('/upload_prepare')?{upload_id:'fixture',block_size:'100',parts,upload_config:{concurrency:3}}:{file_info:'fixture'}})});
  await processor.uploadByChunks(bytes,{targetType:'user',targetId:'fixture',fileType:1});
  for(let i=0;i<3;i++)assert.deepEqual(uploads.get(i+base),bytes.subarray(i*100,(i+1)*100));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('malformed upload parts fail before network submission or completion',async()=>{
 for(const parts of [[],[null,{}],[{index:0,block_size:'100'}],[{index:0,block_size:'100'},{index:0,block_size:'100'}],[{index:1,block_size:'100'},{index:3,block_size:'100'}],[{index:0,block_size:'100'},{index:1,block_size:'0'}]]){
  const processor=new FileProcessor({});processor.prepareUpload=async()=>({block_size:'100',parts});processor.completeUpload=()=>{throw Error('should not complete');};
  await assert.rejects(processor.uploadByChunks(Buffer.alloc(200),{targetType:'user',targetId:'fixture',fileType:1}),/protocol invalid/);
 }
});
test('stop invalidates pending reconnect backoff',async()=>{
 let calls=0;const receiver=new WebSocketReceiver(new WebSocketReceiverConfig({reconnectDelay:1,socketFactory(){calls++;}}));
 receiver.session={userClose:false,getWsUrl:async()=> 'wss://invalid',getBot:()=>({logger:{error(){},debug(){}}})};receiver._isStarted=true;
 const pending=receiver.reconnect();await receiver.stop();await pending;assert.equal(calls,0);
});
test('autoReconnect false emits close instead of attempting internal reconnect',()=>{
 const receiver=new WebSocketReceiver(new WebSocketReceiverConfig({autoReconnect:false}));
 receiver.session={userClose:false,getBot:()=>({logger:{error(){},debug(){}}})};receiver._isStarted=true;
 let reconnects=0,closed=0;receiver.reconnect=()=>{reconnects++;};receiver.on('close',()=>closed++);
 receiver.handleWebSocketClose(4000,Buffer.from('fixture'));assert.equal(reconnects,0);assert.equal(closed,1);
});
test('Bot options reach receiver while process handlers and cache events stay independent',()=>{
 const {Bot}=require('../lib/bot');const {ReceiverFactory,ReceiverMode}=require('../lib/receivers');
 const before=process.listeners('uncaughtException');const rejection=process.listeners('unhandledRejection');const socketFactory=()=>{};
 try {
  const bot=new Bot({appid:'fixture-options',secret:'fixture',mode:ReceiverMode.WEBSOCKET,logLevel:'off',handleProcessErrors:false,autoReconnect:false,socketFactory});
  assert.deepEqual(process.listeners('uncaughtException'),before);assert.deepEqual(process.listeners('unhandledRejection'),rejection);
  assert.ok(bot.listenerCount('notice.group.increase')>0);assert.equal(bot.sessionManager.receiver.config.socketFactory,socketFactory);assert.equal(bot.sessionManager.receiver.config.autoReconnect,false);
 }finally{ReceiverFactory.clearAll();}
});
test('guild interaction reads the canonical resolved user id',()=>{
 const {GuildActionNoticeEvent}=require('../lib/events/notice');
 const event=new GuildActionNoticeEvent({logger:{info(){}}},{guild_id:'guild',channel_id:'channel',data:{resolved:{user_id:'actor',button_id:'button'}}});
 assert.equal(event.operator_id,'actor');
});
