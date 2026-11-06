import {defaultScenario} from '../../../lib/scenario';
import {validate,predict,allocate,simulateMesh,modelCard,InputError} from '../../../lib/engine';
export const dynamic='force-dynamic';
const json=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function GET(request:Request){
 const path=new URL(request.url).pathname;
 if(path==='/api/health')return json({status:'ok',version:'1.0.0',mode:'research-prototype',data:'synthetic'});
 if(path==='/api/scenario')return json(defaultScenario());
 if(path==='/api/models')return json(modelCard());
 return json({error:'Endpoint not found'},404);
}
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>200000)return json({error:'Request too large'},413);
  const raw=await request.text();if(raw.length>200000)return json({error:'Request too large'},413);
  let body:any;try{body=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
  const path=new URL(request.url).pathname;
  if(path==='/api/predict'){const {regions,roads}=validate(body);if(body.model&&!['gnn','forest','ensemble'].includes(body.model))throw new InputError('Unknown model');return json({predictions:predict(regions,roads,body.model),provenance:'synthetic-trained',generatedAt:new Date().toISOString()});}
  if(path==='/api/allocate'){const {regions,roads}=validate(body);return json(allocate(regions,roads,body.resources,body.fairness??.35));}
  if(path==='/api/mesh/simulate')return json(simulateMesh(body));
  // Stateless acknowledgement lets queued messages sync without pretending to dispatch help.
  if(path==='/api/messages/sync'){
   if(!Array.isArray(body.messages)||body.messages.length>100)throw new InputError('Provide up to 100 queued messages');
   for(const m of body.messages)if(typeof m.id!=='string'||typeof m.text!=='string'||!m.text.trim()||m.text.length>1000)throw new InputError('Each message needs an ID and 1–1000 characters.');
   return json({acknowledged:body.messages.map((m:any)=>m.id),mode:'prototype-acknowledgement',storedOnServer:false,dispatched:false});
  }
  return json({error:'Endpoint not found'},404);
 }catch(error){return json({error:error instanceof InputError?error.message:'Unable to process request'},error instanceof InputError?400:500);}
}
