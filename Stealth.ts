import * as T from 'three';
import {type HouseBuilder,HOUSE_PLAN_SCALE as k} from '../world/HouseBuilder';
// These are clearance volumes for the existing room, not new furniture.
export function underLoft(x:number,z:number,margin=0){return x>(2.17*k-margin)&&x<(4.10*k+margin)&&z>(-2.55*k-margin)&&z<(-1.68*k+margin);}
export function roomAt(house:HouseBuilder,p:{x:number;z:number}){return house.rooms.find(({b:[a,b,c,d]})=>p.x>=a&&p.x<=b&&p.z>=c&&p.z<=d)?.name;}
export const entry=new T.Vector3(0,0,4.89*k);
export type Waypoint={x:number;z:number;look?:number;wait?:number;door?:'kitchen'|'living'|'kids';low?:boolean;central?:boolean;checked?:boolean};
const pt=(x:number,z:number,opts:Partial<Waypoint>={}):Waypoint=>({x:x*k,z:z*k,...opts});
export const searchRoute=[pt(0,4.49),pt(-.025,3.43,{look:Math.PI,wait:1.1}),pt(-.015,3.07),pt(.70,3.13,{look:Math.PI/2,wait:1.1,door:'kitchen'}),pt(1.37,3.13,{look:Math.PI/2,wait:1.6}),pt(.46,3.13),pt(-.66,3.15,{look:-Math.PI/2,wait:1.1,door:'living'}),pt(-1.37,3.15,{look:-Math.PI/2,wait:1.6}),pt(-.48,3.15),pt(0,3.09),pt(0,1.38,{central:true,look:Math.PI,wait:.9}),pt(.03,-1.16),pt(1.46,-1.17,{door:'kids',look:Math.PI/2,wait:.45}),pt(2.04,-1.18,{look:2.12,wait:3.6,low:true}),pt(1.47,-1.17),pt(.04,-1.16,{door:'kids',checked:true,look:0,wait:.35})];
export const exitRoute=[pt(.03,1.4),pt(0,3.28),pt(0,4.48),pt(0,5.13),pt(.81,5.8)];

export class Patrol{
 private exits=exitRoute;
 private index=0;private rest=0;private stride=0;private facing=Math.PI;private aim=Math.PI;private low=false;
 reset(){this.exits=exitRoute;this.index=0;this.rest=0;this.stride=0;this.facing=this.aim=Math.PI;this.low=false;}
 startExit(room:string|undefined,p:T.Vector3){
  this.reset();
  if(room==='Dormitorio de los niños')this.exits=[pt(1.45,-1.17),pt(.03,-1.16,{door:'kids'}),...exitRoute];
  else if(room==='Cocina'||room==='Salón'){const sign=room==='Cocina'?1:-1;this.exits=[pt(sign*1.34,3.14),pt(0,3.14),...exitRoute.slice(2)];}
  else if(p.z>2.65*k)this.exits=exitRoute.filter(w=>w.z>=p.z);
 }
 tick(dt:number,p:T.Vector3,escaping:boolean,openKids?:()=>boolean){
  const route=escaping?this.exits:searchRoute,way=route[this.index];let travel=0,step=false,central=false,checked=false;
  if(way&&(way.door!=='kids'||!openKids||openKids())){const dx=way.x-p.x,dz=way.z-p.z,d=Math.hypot(dx,dz);if(d>.016){travel=Math.min(d,dt*(escaping?4.1:1.35));p.x+=travel*dx/d;p.z+=travel*dz/d;this.facing=Math.atan2(dx,dz);this.aim=this.facing;this.low=false;this.stride+=travel;if(this.stride>(escaping?.66:.61)){step=true;this.stride=0;}}
   else{this.rest+=dt;central=!!way.central;this.aim=(way.look??this.facing)+(way.wait?Math.sin(this.rest*2.2)*.28:0);this.low=!!way.low;if(this.rest>=(way.wait??0)){checked=!!way.checked;this.index++;this.rest=0;}}
  }
  return {travel,step,central,checked,door:way?.door,facing:this.facing,aim:this.aim,aimY:this.low?.62:1.12,done:!way};
 }
}
