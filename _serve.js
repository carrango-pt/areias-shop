const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname; const port=4599;
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]); if(p.endsWith('/'))p+='index.html';
  let fp=path.join(root,p); if(!fp.startsWith(root)){res.writeHead(403);return res.end();}
  fs.readFile(fp,(e,d)=>{ if(e){res.writeHead(404);return res.end('404');} res.writeHead(200,{'Content-Type':types[path.extname(fp)]||'application/octet-stream'});res.end(d);});
}).listen(port,()=>console.log('serving areia on http://localhost:'+port));
