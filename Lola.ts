import * as T from 'three';
import {HOUSE_PLAN_SCALE, type HouseBuilder} from '../world/HouseBuilder';
import {characterTexture,shape} from './YasminPlayer';
export type LolaState='FOLLOW'|'IDLE'|'EAT'|'ALERT_STARE'|'HIDE';
type P={x:number;z:number};
function coat(color:number,key?:string){const m=new T.MeshStandardMaterial({color,roughness:.96});if(key){m.map=characterTexture(key);m.bumpMap=m.map;m.bumpScale=.004;}return m;}
const yaw=(a:number,b:number,t:number)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
export class Lola{
 readonly root=new T.Group();state:LolaState='IDLE';
 private head=new T.Group();private back=new T.Group();private tail=new T.Group();private legs:T.Group[]=[];private ears:T.Group[]=[];
 private task?:{goal:P;look:P;arrived:boolean;elapsed:number};
 private route:P[]=[];private replan=0;private gait=0;private time=0;private sit=0;private affection=0;private previousGoal:P={x:0,z:0};
 private readonly step=.235;private readonly radius=.135;
 constructor(private house:HouseBuilder,scene:T.Scene){
  this.root.name='Lola';this.root.position.set(.30*HOUSE_PLAN_SCALE,0,2.95*HOUSE_PLAN_SCALE);scene.add(this.root);this.root.add(this.back,this.head,this.tail);
  const fawn=coat(0xd5a379,'lola-lomo'), chest=coat(0xdcc5a6,'lola-pecho'), tan=coat(0xad703d), deep=coat(0x42302b), mask=coat(0xa1968d,'lola-mascara'), inner=coat(0xa07765,'lola-oreja'),eyes=coat(0x271813),black=coat(0x121010);black.roughness=.38;
  shape(this.back,fawn,0,.273,-.025,.218,.24,.519);shape(this.back,chest,0,.241,.149,.192,.236,.208);shape(this.back,fawn,0,.253,-.219,.205,.211,.205);
  const neck=shape(this.back,fawn,0,.354,.186,.157,.229,.172);neck.rotation.x=.38;
  this.head.position.set(0,.439,.228);shape(this.head,fawn,0,.027,.015,.170,.159,.177);shape(this.head,mask,0,-.022,.070,.136,.110,.182);shape(this.head,deep,0,-.049,.080,.106,.046,.131);
  shape(this.head,black,0,-.019,.158,.075,.047,.047);for(const s of [-1,1]){
   shape(this.head,deep,s*.051,.027,.075,.067,.062,.050);shape(this.head,eyes,s*.056,.033,.096,.042,.036,.021);shape(this.head,black,s*.054,.034,.106,.024,.026,.011);shape(this.head,coat(0xa28c6b),s*.054-.004,.041,.110,.007,.007,.004);
   this.ear(s,deep,inner);
  }
  this.tail.position.set(0,.309,-.267);const tailPts=[[0,0,0],[0,.017,-.085],[.014,.035,-.180],[.022,.027,-.254],[.026,.006,-.297]];
  for(let i=0;i<tailPts.length-1;i++){const a=new T.Vector3(...tailPts[i]),b=new T.Vector3(...tailPts[i+1]),p=a.clone().lerp(b,.5);const t=shape(this.tail,tan,p.x,p.y,p.z,.045-i*.008,a.distanceTo(b)+.02,.039-i*.007);t.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());}
  for(const front of [true,false])for(const s of [-1,1]){
   const l=new T.Group();l.position.set(s*(front?.066:.071),.254,front?.142:-.197);this.root.add(l);this.legs.push(l);
   shape(l,fawn,0,-.055,front?.003:-.016,front?.071:.111,.154,.102).rotation.x=front?-.08:.29;
   shape(l,tan,0,-.162,front?.005:-.026,.048,.162,.056).rotation.x=front?-.06:-.27;
   shape(l,chest,0,-.234,front?.026:.007,.062,.046,.092);for(const j of [-1,0,1])shape(l,deep,j*.013,-.242,front?.064:.045,.010,.010,.012);
  }
 }
 private ear(s:number,edge:T.Material,inside:T.Material){
  const ear=new T.Group();this.head.add(ear);this.ears.push(ear);
  const X=(v:number)=>v*s, verts=[X(.045),.057,-.016,X(.092),.051,.007,X(.142),.196,-.025,X(.078),.136,-.033,X(.097),.116,.022,X(.089),.102,-.055];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex([0,1,4,1,2,4,2,3,4,3,0,4,0,5,1,1,5,2,2,5,3,3,5,0]);g.computeVertexNormals();const mat=edge.clone();mat.side=T.DoubleSide;ear.add(new T.Mesh(g,mat));
  const v=[X(.063),.071,.011,X(.091),.062,.014,X(.130),.174,-.014,X(.077),.121,-.013,X(.097),.114,.027];const inG=new T.BufferGeometry();inG.setAttribute('position',new T.Float32BufferAttribute(v,3));inG.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.83,1,.18,.63,.56,.46],2));inG.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);inG.computeVertexNormals();const im=inside.clone();im.side=T.DoubleSide;ear.add(new T.Mesh(inG,im));
 }
 private pass(a:P,b:P,r=this.radius){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.012));for(let i=1;i<=n;i++)if(this.house.blocked(T.MathUtils.lerp(a.x,b.x,i/n),T.MathUtils.lerp(a.z,b.z,i/n),r))return false;return true;}
 private plan(start:P,end:P){
  const s=this.step,ix=Math.round(start.x/s),iz=Math.round(start.z/s),ex=Math.round(end.x/s),ez=Math.round(end.z/s),id=(x:number,z:number)=>`${x},${z}`;
  const Q:[number,number][]=[];const prev=new Map<string,[number,number]|null>();
  for(let r=0;r<3&&!Q.length;r++)for(let x=ix-r;x<=ix+r;x++)for(let z=iz-r;z<=iz+r;z++)if(this.pass(start,{x:x*s,z:z*s})){Q.push([x,z]);prev.set(id(x,z),null);}
  let nearest: [number,number]|undefined,best=Infinity;
  for(let i=0;i<Q.length&&i<10000;i++){
   const [x,z]=Q[i],distance=Math.hypot(x-ex,z-ez);if(distance<best){nearest=Q[i];best=distance;}if(distance<1.75&&this.pass({x:x*s,z:z*s},end))break;
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=id(nx,nz);if(prev.has(k)||!this.pass({x:x*s,z:z*s},{x:nx*s,z:nz*s}))continue;prev.set(k,Q[i]);Q.push([nx,nz]);}
  }
  const result:P[]=[];let p=nearest;while(p){result.push({x:p[0]*s,z:p[1]*s});p=prev.get(id(...p))??undefined;}return result.reverse();
 }
 get chewing(){return this.state==='EAT'&&!!this.task?.arrived;}
 get staring(){return this.state==='ALERT_STARE'&&!!this.task?.arrived;}
 eatAt(goal:P,bowl:P){this.state='EAT';this.task={goal,look:bowl,arrived:false,elapsed:0};this.route=[];this.replan=0;}
 alertAt(goal:P,look:P){this.state='ALERT_STARE';this.task={goal,look,arrived:false,elapsed:0};this.route=[];this.replan=0;}
 private performTask(dt:number){
  const task=this.task;if(!task)return;const p=this.root.position;
  if(!task.arrived&&Math.hypot(p.x-task.goal.x,p.z-task.goal.z)<.105){task.arrived=true;this.route=[];}
  let travel=0,dir:number|undefined;
  if(!task.arrived){
   this.replan-=dt;let target:P|undefined;
   if(this.pass(p,task.goal))target=task.goal;
   else{
    if(this.replan<=0){this.route=this.plan(p,task.goal);this.replan=.55;}
    while(this.route.length&&Math.hypot(this.route[0].x-p.x,this.route[0].z-p.z)<.025)this.route.shift();
    for(let i=Math.min(this.route.length-1,8);i>=0;i--)if(this.pass(p,this.route[i])){target=this.route[i];break;}
   }
   if(target){const dx=target.x-p.x,dz=target.z-p.z,len=Math.hypot(dx,dz);if(len>.001){const m=Math.min(len,1.66*dt),next={x:p.x+dx/len*m,z:p.z+dz/len*m};if(this.pass(p,next)){p.x=next.x;p.z=next.z;travel=m;dir=Math.atan2(dx,dz);}else this.replan=0;}}
  }
  if(task.arrived){task.elapsed+=dt;dir=Math.atan2(task.look.x-p.x,task.look.z-p.z);}
  if(dir!==undefined)this.root.rotation.y=yaw(this.root.rotation.y,dir,Math.min(1,dt*11));
  const eating=this.state==='EAT'&&task.arrived,alert=this.state==='ALERT_STARE';this.gait+=travel*23;
  this.sit=0;this.back.rotation.x=T.MathUtils.damp(this.back.rotation.x,0,8,dt);this.back.position.y=T.MathUtils.damp(this.back.position.y,0,8,dt);
  this.head.position.y=T.MathUtils.damp(this.head.position.y,eating?.225:.439,8,dt);this.head.rotation.x=T.MathUtils.damp(this.head.rotation.x,eating?.97+Math.sin(task.elapsed*15)*.034:alert?-.055:0,8,dt);
  this.head.rotation.y=T.MathUtils.damp(this.head.rotation.y,0,9,dt);this.head.rotation.z=0;this.tail.rotation.y=alert?0:Math.sin(this.time*4)*.19;this.tail.rotation.x=alert?.19:0;this.tail.position.y=.309;
  for(const ear of this.ears)ear.rotation.x=T.MathUtils.damp(ear.rotation.x,alert?-.87:0,10,dt);
  for(let i=0;i<4;i++){const l=this.legs[i];l.position.y=.254;l.rotation.x=task.arrived&&alert?0:T.MathUtils.damp(l.rotation.x,travel>.0001?Math.sin(this.gait+(i===0||i===3?0:Math.PI))*.53:0,13,dt);}
  if(eating&&task.elapsed>=4.4){this.state='FOLLOW';this.task=undefined;this.route=[];this.replan=0;}
 }
 resetFollow(position:T.Vector3,yaw:number){this.root.position.copy(position);this.root.rotation.y=yaw;this.root.scale.y=1;this.state='FOLLOW';this.task=undefined;this.route=[];this.replan=0;this.affection=0;this.sit=this.gait=this.time=0;this.previousGoal={x:0,z:0};this.head.position.y=.439;this.back.position.y=0;this.tail.position.y=.309;for(const part of [this.head,this.back,this.tail,...this.ears,...this.legs])part.rotation.set(0,0,0);for(const leg of this.legs)leg.position.y=.254;}
 hide(){this.state='HIDE';this.task=undefined;this.route=[];this.replan=0;}
 resetAlert(x:number,z:number,goal:P,look:P){this.root.position.set(x,0,z);this.root.scale.y=1;this.alertAt(goal,look);}
 private creep(dt:number,player:P){
  const p=this.root.position;this.root.scale.y=T.MathUtils.damp(this.root.scale.y,.69,10,dt);let moved=0;
  if(Math.hypot(player.x-p.x,player.z-p.z)>.44){
   let target:P|undefined;if(this.pass(p,player))target=player;else{this.replan-=dt;if(this.replan<=0){this.replan=.45;this.route=this.plan(p,player);}while(this.route.length&&Math.hypot(this.route[0].x-p.x,this.route[0].z-p.z)<.03)this.route.shift();target=[...this.route].reverse().find(v=>this.pass(p,v));}
   if(target){const x=target.x-p.x,z=target.z-p.z,d=Math.hypot(x,z);if(d>.005){const m=Math.min(d,1.91*dt),next={x:p.x+x*m/d,z:p.z+z*m/d};if(this.pass(p,next)){p.x=next.x;p.z=next.z;moved=m;this.root.rotation.y=yaw(this.root.rotation.y,Math.atan2(x,z),Math.min(1,dt*10));}}}
  }
  this.gait+=moved*22;this.tail.rotation.y=0;this.tail.rotation.x=.25;this.head.rotation.y=0;this.head.rotation.x=.22;this.head.position.y=.36;this.back.rotation.x=.095;
  for(let i=0;i<this.legs.length;i++){this.legs[i].position.y=.254;this.legs[i].rotation.x=moved>.0001?Math.sin(this.gait+(i%2)*Math.PI)*.41:0;}
 }
 pet(){this.affection=1.45;}
 update(dt:number,player:P,playerMoving:boolean){
  this.time+=dt;if(this.state==='HIDE'){this.creep(dt,player);return;}this.root.scale.y=T.MathUtils.damp(this.root.scale.y,1,12,dt);if(this.state==='EAT'||this.state==='ALERT_STARE'){this.performTask(dt);return;}this.affection=Math.max(0,this.affection-dt);const position=this.root.position, distance=Math.hypot(player.x-position.x,player.z-position.z),direct=distance<3.4&&this.pass(position,player);
  const roomAt=(p:P)=>this.house.rooms.find(({b:[a,b,c,d]})=>p.x>=a&&p.x<=b&&p.z>=c&&p.z<=d);
  const same=roomAt(position)===roomAt(player);
  if(this.state==='IDLE'&&((!same&&!direct)||distance>(playerMoving?1.93:2.10)))this.state='FOLLOW';
  if(this.state==='FOLLOW'&&distance<(playerMoving?1.57:1.77)&&(direct||(same&&distance<1.25)))this.state='IDLE';
  let moved=0;
  if(this.state==='FOLLOW'){
   this.replan-=dt;let target:P|undefined;
   if(direct){target=player;this.route=[];}
   else{
    if(this.replan<=0||Math.hypot(player.x-this.previousGoal.x,player.z-this.previousGoal.z)>.78){this.route=this.plan(position,player);this.previousGoal={...player};this.replan=.55;}
    while(this.route.length&&Math.hypot(this.route[0].x-position.x,this.route[0].z-position.z)<.025)this.route.shift();
    for(let i=Math.min(this.route.length-1,10);i>=0;i--){const p=this.route[i],dist=Math.hypot(p.x-position.x,p.z-position.z),advance=Math.min(1,.055/Math.max(.001,dist));
     if(this.pass(position,p)&&this.pass(position,{x:T.MathUtils.lerp(position.x,p.x,advance),z:T.MathUtils.lerp(position.z,p.z,advance)})){target=p;break;}
    }
   }
   if(target){const dx=target.x-position.x,dz=target.z-position.z,l=Math.hypot(dx,dz),len=Math.min(l,(distance>3.6?2.22:1.43)*dt,direct?Math.max(0,distance-1.54):Infinity);
    if(l>.005&&len>0){const next={x:position.x+dx/l*len,z:position.z+dz/l*len};if(this.pass(position,next)){position.x=next.x;position.z=next.z;moved=len;this.root.rotation.y=yaw(this.root.rotation.y,Math.atan2(dx,dz),Math.min(1,dt*9));}else this.replan=0;}
   }
  }
  this.sit=T.MathUtils.damp(this.sit,this.state==='IDLE'?1:0,7,dt);this.gait+=moved*23;
  this.back.rotation.x=this.sit*.25;this.back.position.y=-this.sit*.029;this.head.position.y=T.MathUtils.damp(this.head.position.y,.439-this.sit*.022,12,dt);
  if(this.state==='IDLE'){const facing=Math.atan2(player.x-position.x,player.z-position.z);this.root.rotation.y=yaw(this.root.rotation.y,facing,Math.min(1,dt*2.4));}
  this.head.rotation.y=yaw(this.head.rotation.y,this.state==='IDLE'?T.MathUtils.clamp(Math.atan2(Math.sin(Math.atan2(player.x-position.x,player.z-position.z)-this.root.rotation.y),Math.cos(Math.atan2(player.x-position.x,player.z-position.z)-this.root.rotation.y)),-.82,.82):0,Math.min(1,dt*6));
  const pet=Math.min(1,this.affection*2);this.head.rotation.x=-this.sit*.16-pet*.17;this.head.rotation.z=Math.sin(this.time*6)*pet*.09;this.tail.rotation.y=Math.sin(this.time*(this.state==='IDLE'?4.0+pet*6.0:6.2))*(.31+.2*this.sit+pet*.24);this.tail.position.y=.309-this.sit*.079;
  for(let i=0;i<4;i++){const stride=moved>.0001?Math.sin(this.gait+(i===0||i===3?0:Math.PI))*.53:0;this.legs[i].rotation.x=T.MathUtils.damp(this.legs[i].rotation.x,stride+(i>=2?-this.sit*.91:this.sit*.12),12,dt);this.legs[i].position.y=.254-(i>=2?this.sit*.073:0);}
 }
}
