import artifact from './models.json';
import {FEATURE_NAMES, type Region, type Road} from './scenario';
export class InputError extends Error {}
export function validate(body:any){
 if(!body||!Array.isArray(body.regions)||body.regions.length<1||body.regions.length>80)throw new InputError('Provide 1–80 regions.');
 const ids=new Set<string>();
 for(const r of body.regions){
  if(typeof r.id!=='string'||r.id.length>30||ids.has(r.id))throw new InputError('Region IDs must be unique strings of at most 30 characters.');ids.add(r.id);
  if(typeof r.name!=='string'||r.name.length>100||!['Flood','Cyclone','Earthquake','Wildfire'].includes(r.hazard))throw new InputError('Each region needs a name and a supported hazard.');
  for(const k of FEATURE_NAMES)if(typeof r[k]!=='number'||!Number.isFinite(r[k])||r[k]<0||r[k]>1)throw new InputError(k+' must be between 0 and 1.');
  if(!Number.isFinite(r.people)||r.people<0||r.people>1e8)throw new InputError('People must be a nonnegative number.');
 }
 if(!Array.isArray(body.roads)||body.roads.length>1000)throw new InputError('Provide up to 1000 road links.');
 for(const e of body.roads)if(!ids.has(e.from)||!ids.has(e.to)||typeof e.open!=='boolean'||!Number.isFinite(e.minutes)||e.minutes<=0)throw new InputError('Road links must reference known regions with positive travel times.');
 return body as {regions:Region[];roads:Road[];resources?:{teams:number;ambulances:number;supplies:number}};
}
function treePredict(t:any,x:number[]){let n=0;while(t.left[n]!==-1)n=x[t.feature[n]]<=t.threshold[n]?t.left[n]:t.right[n];return t.value[n];}
export function predict(regions:Region[],roads:Road[],model='ensemble'){
 const w=artifact.weights;
 const vectors=regions.map(r=>FEATURE_NAMES.map(k=>(r as any)[k]));
 return regions.map((r,i)=>{
  const neighbors=[i,...roads.filter(e=>e.open&&(e.from===r.id||e.to===r.id)).map(e=>regions.findIndex(n=>n.id===(e.from===r.id?e.to:e.from)))];
  const mean=FEATURE_NAMES.map((_,j)=>neighbors.reduce((s,n)=>s+vectors[n][j],0)/neighbors.length);
  const h=w['local.weight'].map((row,j)=>Math.max(0,row.reduce((s,v,k)=>s+v*vectors[i][k],w['local.bias'][j])+w['neighbor.weight'][j].reduce((s,v,k)=>s+v*mean[k],0)));
  const gnn=1/(1+Math.exp(-(w['out.weight'][0].reduce((s,v,j)=>s+v*h[j],w['out.bias'][0]))));
  const forest=artifact.trees.reduce((s,t)=>s+treePredict(t,vectors[i]),0)/artifact.trees.length;
  const score=Math.round(100*(model==='gnn'?gnn:model==='forest'?forest:.7*gnn+.3*forest));
  return {...r,score,level:score>=75?'Critical':score>=60?'High':score>=40?'Moderate':'Low',gnn:Math.round(gnn*100),forest:Math.round(forest*100),drivers:[{name:'Hazard severity',value:r.severity},{name:'Infrastructure damage',value:r.damage},{name:'Access disruption',value:1-r.access},{name:'Resource demand',value:r.demand}].sort((a,b)=>b.value-a.value).slice(0,3),connectedNeighbors:neighbors.length-1};
 });
}
export function allocate(regions:Region[],roads:Road[],resources:any,fairness=.35){
 for(const k of ['teams','ambulances','supplies'])if(!resources||!Number.isInteger(resources[k])||resources[k]<0||resources[k]>100000)throw new InputError('Resource counts must be integers between 0 and 100000.');
 if(!Number.isFinite(fairness)||fairness<0||fairness>1)throw new InputError('Fairness must be between 0 and 1.');
 const scored=predict(regions,roads);
 const weights=scored.map(r=>((1-fairness)*r.score/100+fairness*(.5*r.vulnerability+.5*r.demand))*r.demand*(.55+.45*r.access));
 const sum=weights.reduce((a,b)=>a+b,0)||1;
 // Largest-remainder assignment conserves the complete inventory.
 const distribute=(count:number)=>{const exact=weights.map(v=>count*v/sum);const out=exact.map(Math.floor);let left=count-out.reduce((a,b)=>a+b,0);const order=exact.map((v,i)=>({i,f:v-out[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);for(let n=0;n<left;n++)out[order[n%order.length].i]++;return out;};
 const t=distribute(resources.teams),a=distribute(resources.ambulances),s=distribute(resources.supplies);
 const rows=scored.map((r,i)=>({...r,teams:t[i],ambulances:a[i],supplies:s[i],accessWarning:r.access<.3||!roads.some(e=>e.open&&(e.from===r.id||e.to===r.id)),status:'Proposed',etaMinutes:r.access<.3?null:Math.round(12+40*(1-r.access))})).sort((a,b)=>b.score-a.score);
 const coverage=rows.map(r=>(r.teams+r.ambulances+r.supplies/20)/Math.max(.1,r.demand));
 const jain=coverage.reduce((s,v)=>s+v,0)**2/(coverage.length*coverage.reduce((s,v)=>s+v*v,0)||1);
 return {rows,totals:resources,fairnessIndex:Math.round(jain*1000)/1000,method:'Risk-and-demand weighted largest remainder; vulnerability weight '+fairness,notice:'Planning proposal only. Blocked-access assignments require a verified alternative route or air/boat transport. No teams have been dispatched.'};
}
export function simulateMesh(body:any){
 const {regions,roads}=validate(body);const source=body.source;
 if(!regions.some(r=>r.id===source))throw new InputError('Choose an existing source region.');
 const gateways=regions.filter(r=>r.communication>=.7).map(r=>r.id);
 const queue=[source],seen=new Set(queue),prev:Record<string,string>={};let target:string|undefined;
 while(queue.length){const id=queue.shift()!;if(gateways.includes(id)){target=id;break;}for(const e of roads){const next=e.from===id?e.to:e.to===id?e.from:null;if(next&&!seen.has(next)){seen.add(next);prev[next]=id;queue.push(next);}}}
 const path:string[]=[];if(target){let at=target;path.unshift(at);while(at!==source){at=prev[at];path.unshift(at);}}
 const reliability=path.length?path.reduce((p,id)=>p*(.85+.14*regions.find(r=>r.id===id)!.communication),1):0;
 return {mode:'simulated',delivered:!!target,path,gateway:target||null,hops:Math.max(0,path.length-1),estimatedDelayMs:path.length?Math.max(120,(path.length-1)*420):null,packetDeliveryRatio:Number(reliability.toFixed(3)),notice:'Assumed graph links and synthetic latency. No BLE or Wi-Fi Direct packets are transmitted.'};
}
export function modelCard(){const {weights,trees,...card}=artifact;return card;}
