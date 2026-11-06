export const FEATURE_NAMES = ['severity','population','damage','access','capacity','communication','demand','vulnerability'];
export type Region = {id:string;name:string;hazard:string;x:number;y:number;lat:number;lon:number;people:number;severity:number;population:number;damage:number;access:number;capacity:number;communication:number;demand:number;vulnerability:number};
export type Road = {from:string;to:string;open:boolean;minutes:number};
const names=['Ennore','Manali','Madhavaram','Tondiarpet','Ambattur','Anna Nagar','Royapuram','Egmore','Poonamallee','T. Nagar','Adyar','Velachery'];
const points=[[620,98],[490,143],[365,190],[590,246],[228,276],[382,330],[646,345],[513,407],[142,449],[385,500],[589,551],[438,627]];
export function defaultScenario(){
 const severity=[.91,.72,.58,.87,.42,.55,.83,.64,.35,.69,.76,.94];
 const regions:Region[]=names.map((name,i)=>({id:'R'+String(i+1).padStart(2,'0'),name,hazard:i===1||i===6?'Cyclone':i===8?'Earthquake':i===4?'Wildfire':'Flood',x:points[i][0],y:points[i][1],lat:13.25-i*.025,lon:80.14+(points[i][0]/800)*.18,people:[18200,12600,9400,24300,8500,15600,21400,17900,6400,19300,16300,27800][i],severity:severity[i],population:[.72,.5,.38,.86,.34,.62,.8,.69,.25,.75,.64,.98][i],damage:[.79,.63,.38,.76,.24,.31,.7,.48,.18,.52,.61,.86][i],access:[.3,.56,.77,.25,.9,.81,.4,.65,.93,.58,.48,.19][i],capacity:[.24,.4,.65,.18,.74,.8,.25,.52,.8,.5,.36,.16][i],communication:[.2,.51,.8,.35,.93,.88,.4,.72,.94,.76,.58,.21][i],demand:[.91,.65,.43,.9,.28,.4,.83,.62,.21,.74,.78,.98][i],vulnerability:[.84,.7,.42,.88,.3,.4,.78,.56,.36,.58,.67,.9][i]}));
 const pairs=[[0,1],[0,3],[1,2],[1,3],[2,4],[2,5],[3,6],[3,7],[4,5],[4,8],[5,7],[5,9],[6,7],[6,10],[7,9],[7,10],[8,9],[9,10],[9,11],[10,11]];
 const roads:Road[]=pairs.map(([a,b],i)=>({from:regions[a].id,to:regions[b].id,open:![1,5,11,18].includes(i),minutes:8+(i*7)%25}));
 return {name:'Chennai coastal impact',regions,roads,resources:{teams:36,ambulances:18,supplies:640}};
}
