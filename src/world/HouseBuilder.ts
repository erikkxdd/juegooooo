import type {InspectId} from '../story/Inspectables';
import * as T from 'three';
import {photo,solid,cropAspect,quilt} from '../config/HouseMaterials';
import {profile,packStatic} from './DetailGeometry';
import {tube,ring,cylinder,vessel,tap,mirror,porcelain,chrome,brass,rubber,fabric} from './Fixtures';
type Mat=T.Material; type Bounds=[number,number,number,number];
export type Room={name:string,b:Bounds,mat:Mat,floor?:string,light?:T.PointLight};
export type Target={mesh:T.Object3D,kind?:'door'|'switch',label:()=>string,use:()=>void};
type Door={hinge:T.Group,leaf:T.Mesh,w:number,angle:number,closed:number,open:boolean};
const originalHeight=2.55,addedHeight=.45,W=.13;
export const CEILING_HEIGHT=originalHeight+addedHeight;
const H=CEILING_HEIGHT;
export const HOUSE_PLAN_SCALE=1.22;
export class HouseBuilder{
 rooms:Room[]=[]; obstacles:Bounds[]=[]; doors:Door[]=[]; targets:Target[]=[];
 kidsDoor!:Door;
 private raised=new Map<number,number>();
 private circuits=new Map<Room,{enabled:boolean;apply:()=>void}>();
 setPower(roomName:string,enabled:boolean){const r=this.rooms.find(r=>r.name===roomName);const c=r&&this.circuits.get(r);if(c&&c.enabled!==enabled){c.enabled=enabled;c.apply();}}
 private diningLamp?:{light:T.PointLight; bulb:T.MeshStandardMaterial};
 wood=photo('door'); cream=solid(0xd9d1bd); white=solid(0xe6e1d8); dark=solid(0x1c2026); metal=brass; blue=solid(0x183a50); orange=solid(0xc78862,.91); tile=photo('kitchenTile',3,4); stone=photo('stone',3,4); ceiling=solid(0xaaa49d);
 constructor(public scene:T.Scene){
 const preexisting=new Set(scene.children);
 const hall=this.room('Recibidor',[-.92,.92,-2.90,4.85],solid(0x606b94,.91),'parquet');
 this.edges(hall,{L:[[-2.78,-1.73],[2.65,3.68]],R:[[-1.63,-.69],[2.68,3.65]],N:[[-.67,.24]],S:[[-.52,.52]]});
 for(const o of this.scene.children)if(o instanceof T.Mesh&&o.userData.wallRepeatAxis==='x'&&o.position.z>4.84&&Math.abs(o.position.x)>.52)o.userData.inspectId='entry';
 this.door(-.92,-2.78,1.05,'z',-1,false);this.door(-.52,4.85,1.04,'x',-1,false,false,true);
 this.switch(hall,.84,4.24,'z',true);
 this.place(0,0,0,()=>{
  const living=this.room('Salón',[.92,7.60,1.43,5.29],solid(0x8d7e6d,.92));
  const kitchen=this.room('Cocina',[-5.22,-.92,1.43,4.85],photo('wallKitchen',3,4),'kitchenFloor');
  this.edges(living,{L:[[2.65,3.68]],R:[[2.44,4.74]]},this.orange);
  this.edges(kitchen,{R:[[2.68,3.65]],L:[[2.38,3.92]]});
  this.door(.92,2.65,1.03,'z',1,false,true);this.door(-.92,2.68,.97,'z',-1,false,true);
  this.window(7.60,2.44,4.74,'z');const balconyStart=this.scene.children.length;this.window(-5.22,2.38,3.92,'z',true);this.kitchenBalcony();this.annotate(balconyStart,'balcony');
  this.switch(living,1.02,3.94,'z',true);this.switch(kitchen,-1.02,3.98,'z',true);
 },true);
 this.furnish();
 this.place(0,0,0,()=>{
 const kids=this.room('Dormitorio de los niños',[-4.42,-.92,-2.75,1.43],solid(0x333630,.92),'kidsFloor');
  this.edges(kids,{R:[[-1.63,-.69]],L:[[-1.7,.25]]},solid(0x486164,.92));
  this.kidsDoor=this.door(-.92,-1.63,.94,'z',-1,false);
  this.window(-4.42,-1.7,.25,'z');
  this.switch(kids,-1.03,-.35,'z');this.furnishKids();
 },true);
 this.place(Math.PI/2,0,-1.98,()=>{
  const bath=this.room('Primer baño',[.92,3.12,-.92,1.43],photo('wallStone',3,4),'kitchenFloor');
  this.edges(bath,{L:[[-.67,.24]]},undefined,'N');this.door(.92,-.67,.91,'z',1,false);
  this.switch(bath,1.02,.58,'z');this.furnishBath(false);
 });
 const parentShift=1.53;
 this.place(Math.PI/2,2.13,-1.98,()=>{
  const side=this.room('Segundo pasillo',[-.92,.92,-5.6,-3.05],solid(0x5c6085,.92),'parquet');
  const bath2=this.room('Segundo baño',[.92,3.35,-5.6,-3.05],photo('wallStone',3,4),'kitchenFloor');
  this.edges(side,{S:[[-.25,.80]],N:[[-.56,.53]],R:[[-4.87,-3.95]]});
  this.edges(bath2,{L:[[-4.87,-3.95]]},undefined,undefined,'S');
  this.door(.92,-4.87,.92,'z',-1,false);this.doorFrame(-.56,-5.6,1.09,'x');
  this.switch(side,-.83,-4.5,'z');this.switch(bath2,1.03,-3.72,'z');
  this.place(0,parentShift,0,()=>{
   const parents=this.room('Dormitorio de los padres',[-2.65,.92,-9.35,-5.6],solid(0x363530,.92),'parentsFloor');
   // Se conserva el vano de la puerta en el pasillo; solo se desplaza la estancia.
   this.edges(parents,{S:[[-.56-parentShift,.53-parentShift]],N:[[-2.32,-.71]]});
   this.window(-9.35,-2.32,-.71,'x');this.switch(parents,.73-parentShift,-5.70,'x');this.furnishBedrooms();
  });
  this.furnishBath(true);
 });
 const windowLight=new T.SpotLight(0xa7c9ff,14,5,.55,.66,1.65);
 windowLight.position.set(-7.12,1.38,-.43-parentShift);windowLight.target.position.set(-4.75,.60,-.76-parentShift);this.scene.add(windowLight,windowLight.target);
 // Una contribución fría localizada conserva la penumbra y distingue cada hueco exterior.
 const moon=(x:number,z:number,xx:number,zz:number,power:number)=>{const source=new T.SpotLight(0xa0b9e8,power,3.5,.53,.72,1.7);source.position.set(x,1.45,z);source.target.position.set(xx,.64,zz);this.scene.add(source,source.target);};
 moon(5.14,3.15,3.25,3.15,3.2);moon(4.34,-.69,2.65,-.65,3.1);
 this.alignSharedFloors();
 packStatic(this.scene,new Set([...preexisting,...this.targets.map(t=>t.mesh)]));
 this.expandPlan(preexisting);

 }
 private annotate(from:number,id:InspectId){for(let i=from;i<this.scene.children.length;i++){const o=this.scene.children[i];if(o instanceof T.Mesh)o.userData.inspectId=id;}}
 private expandPlan(preexisting:Set<T.Object3D>){
  const k=HOUSE_PLAN_SCALE,root=new T.Group();root.name='Vivienda · planta ampliada';root.scale.set(k,1,k);
  const houseObjects=this.scene.children.filter(obj=>!preexisting.has(obj));this.scene.add(root);root.add(...houseObjects);
  root.traverse(obj=>{if((obj instanceof T.PointLight||obj instanceof T.SpotLight)&&obj.distance>0)obj.distance*=k;});
  const stretch=([a,b,c,d]:Bounds):Bounds=>[a*k,b*k,c*k,d*k];
  this.obstacles=this.obstacles.map(stretch);for(const room of this.rooms)room.b=stretch(room.b);
  root.updateMatrixWorld(true);
  // Bake the three optical planes with a positive, upright basis after all room transforms.
  const mirrors:T.Object3D[]=[];root.traverse(o=>{if(o.userData.opticalMirror)mirrors.push(o);});
  for(const m of mirrors){const world=m.matrixWorld.clone(),p=new T.Vector3().setFromMatrixPosition(world);const x=new T.Vector3().setFromMatrixColumn(world,0),y=new T.Vector3().setFromMatrixColumn(world,1),n=new T.Vector3().setFromMatrixColumn(world,2);const room=this.rooms.find(({b:[a,b,c,d]})=>p.x>=a-.04&&p.x<=b+.04&&p.z>=c-.04&&p.z<=d+.04);if(room){const [a,b,c,d]=room.b;if(n.dot(new T.Vector3((a+b)/2-p.x,0,(c+d)/2-p.z))<0)n.negate();}n.y=0;n.normalize();const up=new T.Vector3(0,1,0),right=new T.Vector3().crossVectors(up,n);m.removeFromParent();this.scene.add(m);m.position.copy(p);m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,n));m.scale.set(x.length(),y.length(),1);m.updateMatrixWorld(true);}

 }
 // Gira cada ala completa: geometría, luces, colisiones y bisagras mantienen la misma planta.
 place(angle:number,dx:number,dz:number,build:()=>void,mirror=false){
  const count=this.scene.children.length, o=this.obstacles.length, r=this.rooms.length, d=this.doors.length;
  build();const c=Math.round(Math.cos(angle)),s=Math.round(Math.sin(angle));const xy=(x:number,z:number)=>[(mirror?-1:1)*(c*x+s*z+dx),-s*x+c*z+dz];
  const bounds=([a,b,e,f]:Bounds):Bounds=>{const [x,z]=xy(a,e),[X,Z]=xy(b,f);return [Math.min(x,X),Math.max(x,X),Math.min(z,Z),Math.max(z,Z)];};
  for(const obj of this.scene.children.slice(count)){const [x,z]=xy(obj.position.x,obj.position.z);obj.position.x=x;obj.position.z=z;obj.rotateOnWorldAxis(new T.Vector3(0,1,0),angle);if(mirror){obj.quaternion.y*=-1;obj.quaternion.z*=-1;obj.scale.x*=-1;}}
  for(let i=o;i<this.obstacles.length;i++)this.obstacles[i]=bounds(this.obstacles[i]);
  for(const room of this.rooms.slice(r))room.b=bounds(room.b);
  for(const door of this.doors.slice(d)){door.angle=(door.angle+angle)*(mirror?-1:1);door.closed=(door.closed+angle)*(mirror?-1:1);}
 }

 box(x:number,y:number,z:number,w:number,h:number,d:number,m:Mat,block=false,group:T.Object3D=this.scene){const o=new T.Mesh(profile(w,h,d,m===this.cream||m===this.white||m===porcelain||m===photo('upholstery',2,2)),m);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;group.add(o);if(block)this.obstacles.push([x-w/2,x+w/2,z-d/2,z+d/2]);return o;}
 rounded(x:number,y:number,z:number,w:number,h:number,d:number,m:Mat){const o=new T.Mesh(new T.SphereGeometry(1,12,8),m);o.position.set(x,y,z);o.scale.set(w/2,h/2,d/2);o.castShadow=o.receiveShadow=true;this.scene.add(o);return o;}
 room(name:string,b:Bounds,mat:Mat,floor='parquet'){
  const [x,X,z,Z]=b,r:Room={name,b,mat};this.rooms.push(r);
  const shared=floor==='parquet'||floor==='kitchenFloor';
  const slab=this.box((x+X)/2,-.065,(z+Z)/2,X-x,.13,Z-z,shared?photo(floor):photo(floor,X-x,Z-z));
  if(shared)slab.userData.floorPeriod=floor==='kitchenFloor'?.40:1;else slab.userData.scaleFloorUV=true;
  this.box((x+X)/2,H+.06,(z+Z)/2,X-x,.12,Z-z,this.ceiling);return r;
 }
 alignSharedFloors(){
  // Fija orientación, escala y fase en ejes de la casa, incluso en alas giradas.
  this.scene.updateMatrixWorld(true);const point=new T.Vector3();
  for(const mesh of this.scene.children){
   if(!(mesh instanceof T.Mesh))continue;
   const {floorPeriod:period,scaleFloorUV,wallRepeatAxis,wallHeight}=mesh.userData;
   if(!period&&!scaleFloorUV&&!wallRepeatAxis)continue;
   const geo=mesh.geometry.clone(),pos=geo.getAttribute('position'),uv=geo.getAttribute('uv');
   for(let i=0;i<pos.count;i++){
    if(period){point.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);uv.setXY(i,-point.x*HOUSE_PLAN_SCALE/period,-point.z*HOUSE_PLAN_SCALE/period);}
    else uv.setXY(i,uv.getX(i)*HOUSE_PLAN_SCALE,uv.getY(i)*(wallHeight??(scaleFloorUV?HOUSE_PLAN_SCALE:1)));
   }
   uv.needsUpdate=true;mesh.geometry=geo;
  }
 }

 edges(r:Room,open:Partial<Record<'L'|'R'|'N'|'S',[number,number][]>>,accent?:Mat,omit?:'L'|'R'|'N'|'S',center?:'L'|'R'|'N'|'S'){const [x,X,z,Z]=r.b;for(const side of ['L','R','N','S'] as const){if(side===omit)continue;const axis=side==='L'||side==='R'?'z':'x',p=side==='L'?x:side==='R'?X:side==='N'?z:Z;const a=axis==='z'?z:x,b=axis==='z'?Z:X;let last=a;const upper=(side==='R'&&r.name==='Salón')||side==='L'&&['Cocina','Dormitorio de los niños'].includes(r.name)||side==='N'&&r.name==='Dormitorio de los padres';const mat=side==='S'&&accent?accent:r.mat;const offset=side===center?0:(side==='L'||side==='N'?-1:1)*.034;const slab=(s:number,e:number,y:number,h:number,m:Mat,block=false,depth=W)=>{if(e-s<.001)return; const c=(s+e)/2;const slab=axis==='z'?this.box(p+offset,y,c,depth,h,e-s,m,block):this.box(c,y,p+offset,e-s,h,depth,m,block);if(m===mat&&depth===W){slab.userData.wallRepeatAxis=axis;slab.userData.wallHeight=h/(h===H?originalHeight:h>addedHeight&&Math.abs(y+h/2-H)<.001?h-addedHeight:h);}return slab;};const full=(s:number,e:number)=>{slab(s,e,H/2,H,mat,true);slab(s,e,.062,.124,this.wood,false,.162);slab(s,e,.116,.022,this.wood,false,.173);slab(s,e,.031,.017,this.wood,false,.171);slab(s,e,H-.05,.09,this.cream,false,.16);};for(const [s,e] of open[side]??[]){full(last,s);slab(s,e,2.34+addedHeight,.42,mat);if(upper){slab(s,e,2.13+addedHeight/2,addedHeight,mat);if(r.name!=='Cocina')slab(s,e,.47,.94,mat,true);}last=e;}full(last,b);}}
 doorFrame(x:number,z:number,w:number,axis:'x'|'z'){const point=(u:number,y:number,depth:number,h:number,m:Mat)=>axis==='x'?this.box(x+u,y,z,depth,h,.23,m):this.box(x,y,z+u,.23,h,depth,m);point(-.015,1.06+addedHeight/2,.09,2.12+addedHeight,this.wood);point(w+.015,1.06+addedHeight/2,.09,2.12+addedHeight,this.wood);point(w/2,2.10+addedHeight,w+.1,.11,this.wood);
 for(const u of [-.052,w+.052])point(u,1.058+addedHeight/2,.032,2.12+addedHeight,photo('door',1,2));point(w/2,2.146+addedHeight,w+.14,.025,this.wood);
 const transom=point(w/2,2.077+addedHeight/2,w,.15+addedHeight,this.wood);transom.userData.doorTransom=true;
 }
 door(x:number,z:number,w:number,axis:'x'|'z',dir:number,open:boolean,glass=false,exit=false){this.doorFrame(x,z,w,axis);
 const hinge=new T.Group();hinge.position.set(x,0,z);this.scene.add(hinge);const angle=axis==='z'?-Math.PI/2:0;hinge.rotation.y=angle+(open?dir*1.48:0);const leaf=this.box(w/2,1.045,0,w-.055,2.04,.057,this.wood,false,hinge);leaf.userData.doorLeaf=true;if(glass){leaf.material=new T.MeshStandardMaterial({transparent:true,opacity:.18,depthWrite:false,color:0x9aa7a7});leaf.castShadow=false;for(const u of [.05,w-.05,w/2])this.box(u,1.045,0,.10,2.04,.077,this.wood,false,hinge);for(const y of [.18,.74,1.32,1.99])this.box(w/2,y,0,w-.05,y===.18?.32:.085,.081,this.wood,false,hinge);}else{for(const y of [.43,1.38]){this.box(w/2,y,0,w-.23,y>.5?1.04:.52,.079,this.wood,false,hinge);this.box(w/2,y,0,w-.30,y>.5?.94:.42,.09,this.wood,false,hinge);}}
 for(const s of [-1,1]){this.box(w-.14,1.04,s*.051,.052,.158,.024,brass,false,hinge);
  tube(hinge,[[w-.132,1.071,s*.055],[w-.134,1.071,s*.088],[w-.16,1.071,s*.098],[w-.246,1.067,s*.093]],.013,brass);
  const lock=cylinder(hinge,w-.14,.997,s*.066,.014,.012,chrome);lock.rotation.x=Math.PI/2;
  this.box(w-.14,.998,s*.073,.006,.013,.005,rubber,false,hinge);
 }
 for(const y of [.35,1.75]){cylinder(hinge,.019,y,.046,.014,.11,brass);this.box(.043,y,.037,.052,.071,.013,brass,false,hinge);}
 if(exit){for(const y of [1.25,1.287]){const bolt=this.box(w-.169,y,-.067,.063,.012,.017,chrome,false,hinge);bolt.userData.storyAction="latch";}const peephole=cylinder(hinge,w/2,1.56,-.057,.019,.017,brass);peephole.rotation.x=Math.PI/2;const lens=cylinder(hinge,w/2,1.56,-.068,.010,.007,rubber);lens.rotation.x=Math.PI/2;peephole.userData.storyAction="peephole";lens.userData.storyAction="peephole";lens.userData.inspect="No se ve a nadie en el rellano.";lens.userData.inspectLabel="Mirar por la mirilla";const latch=this.box(w-.10,1.28,-.061,.081,.051,.026,brass,false,hinge);latch.userData.storyAction="latch";}

 const d={hinge,leaf,w,angle:angle+dir*1.48,closed:angle,open};this.doors.push(d);if(!exit)this.targets.push({mesh:hinge,kind:'door',label:()=>d.open?'Cerrar puerta':'Abrir puerta',use:()=>{d.open=!d.open;}});else d.angle=angle;return d;
 }
 window(p:number,a:number,b:number,axis:'x'|'z',full=false){const s=(u:number,y:number,w:number,h:number,d:number,m:Mat,block=false)=>axis==='z'?this.box(p,y,u,d,h,w,m,block):this.box(u,y,p,w,h,d,m,block);const c=(a+b)/2,base=full?.05:.94,top=2.13,h=top-base;s(c,(top+base)/2,b-a,h,.075,new T.MeshBasicMaterial({color:0x161d2c,transparent:true,opacity:.16,depthWrite:false}),true)!.castShadow=false;for(const u of [a,c,b])s(u,(base+top)/2,.067,h,.15,this.white);for(const y of [base,top])s(c,y,b-a+.09,.07,.17,this.white);for(let y=top-.10;y>base+.24;y-=.075){const slat=s(c,y,b-a-.04,.059,.105,this.dark);if(full)slat.userData.balconySlat=true;} if(!full)for(const u of [a-.12,b+.12])s(u,1.35,.24,2.28,.20,photo('curtain',1,2));}
 switch(r:Room,x:number,z:number,axis:'x'|'z',on=false){const [a,b,c,d]=r.b;const light=new T.PointLight(0xffc78f,on?17:0,Math.min(7,Math.max(b-a,d-c)+1.8),2);light.position.set((a+b)/2,2.30,(c+d)/2);this.scene.add(light);r.light=light;const bulb=new T.MeshStandardMaterial({color:0xd9cbb9,emissive:0xffc091,emissiveIntensity:on?.7:0,roughness:.9});this.rounded(light.position.x,2.43,light.position.z,.32,.16,.32,bulb);const obj=this.box(x,1.22,z,axis==='x'?.105:.044,.115,axis==='x'?.044:.105,this.white);if(r.name!=='Salón'&&r.name!=='Segundo pasillo')this.outlet(x,1.22,z,axis,r.name==='Cocina'?.22:.16);const rock=this.box(0,0,0,axis==='x'?.065:.055,.067,axis==='x'?.055:.065,this.cream,false,obj);let requested=on;const circuit={enabled:true,apply:()=>{const lit=requested&&circuit.enabled;light.intensity=lit?17:0;bulb.emissiveIntensity=lit?.7:0;rock.rotation[axis]=requested?.17:-.17;if(r.name==='Salón'&&this.diningLamp){this.diningLamp.light.intensity=lit?2.8:0;this.diningLamp.bulb.emissiveIntensity=lit?.52:0;}}};this.circuits.set(r,circuit);circuit.apply();this.targets.push({mesh:obj,kind:'switch',label:()=>requested?'Apagar luz':'Encender luz',use:()=>{requested=!requested;circuit.apply();}});}

 outlet(x:number,y:number,z:number,axis:'x'|'z',shift:number){const X=x+(axis==='x'?shift:0),Z=z+(axis==='z'?shift:0);this.box(X,y,Z,axis==='x'?.118:.043,.103,axis==='z'?.118:.043,this.white);for(const sign of [-1,1]){const sink=cylinder(this.scene,X+(axis==='z'?sign*.024:0),y,Z+(axis==='x'?sign*.024:0),.029,.010,this.cream);sink.rotation[axis]=Math.PI/2;
 for(const h of [-.011,.011]){const pin=cylinder(this.scene,sink.position.x+(axis==='z'?sign*.006:h),y+(axis==='z'?h:0),sink.position.z+(axis==='x'?sign*.006:0),.004,.007,rubber);pin.rotation[axis]=Math.PI/2;}}}
 furnitureTools(){const b=this.box.bind(this), q=this.rounded.bind(this), wood=this.wood, white=this.white,dark=this.dark, blue=this.blue, cream=this.cream;const red=solid(0x9e3229), gray=solid(0x8e9189), tan=solid(0x726050), carpet=solid(0x543d32), glass=new T.MeshStandardMaterial({color:0x557487,transparent:true,opacity:.48,roughness:.86});
 const table=(x:number,z:number,w:number,d:number,h:number,top:Mat,legs:Mat)=>{b(x,h,z,w,.075,d,top,true);for(const i of [-1,1])for(const j of [-1,1])b(x+i*(w/2-.09),h/2,z+j*(d/2-.08),.075,h,.075,legs);};
 const chair=(x:number,z:number,col:Mat)=>{table(x,z,.42,.43,.45,col,dark);b(x,.71,z+.189,.39,.43,.055,col);};
 const rad=(x:number,z:number,n:number,axis:'x'|'z')=>{const fins=solid(0xd5d5d1,.46,.18),length=(n-1)*.095;for(let i=0;i<n;i++){const X=x+(axis==='x'?i*.095:0),Z=z+(axis==='z'?i*.095:0);b(X,.38,Z,axis==='x'?.075:.137,.55,axis==='z'?.075:.137,fins);b(X,.657,Z,axis==='x'?.046:.105,.014,axis==='z'?.046:.105,this.dark);}for(const y of [.18,.57])b(x+(axis==='x'?length/2:0),y,z+(axis==='z'?length/2:0),axis==='x'?length+.13:.085,.045,axis==='z'?length+.13:.085,fins);cylinder(this.scene,x,.69,z,.036,.052,chrome);tube(this.scene,[[x,.18,z],[x-.056,.13,z],[x-.056,.035,z]],.012,chrome);};
 const art=(x:number,y:number,z:number,w:number,h:number,axis:'x'|'z',m:Mat)=>{const u=(s:number,Y:number,ww:number,hh:number,t:number,mat:Mat)=>axis==='x'?b(x+s,Y,z,ww,hh,t,mat):b(x,Y,z+s,t,hh,ww,mat);u(0,y,w,h,.031,this.dark);u(0,y,w-.045,h-.046,.044,m);for(const k of [-1,1]){u(k*(w/2-.013),y,.024,h,.056,wood);u(0,y+k*(h/2-.013),w,.024,.056,wood);}};
 const books=(x:number,y:number,z:number,n:number)=>{const colors=[red,blue,carpet,cream,gray,this.orange];for(let i=0;i<n;i++)b(x+(i%3-1)*.014,y+i*.044,z,.24-(i%3)*.024,.038,.17,colors[i%colors.length]);};
 return {b,q,wood,white,dark,blue,cream,red,gray,tan,carpet,glass,table,chair,rad,art,books};
 }
 furnish(){const {b,q,wood,white,dark,blue,cream,red,gray,tan,carpet,glass,table,chair,rad,art,books}=this.furnitureTools();
 this.place(0,0,0,()=>{
 this.place(Math.PI,-1.05,6.72,()=>{
 // Salón: pared naranja y sofá en L, mesa roja, comedor y vitrina enfrentada.
 let inspectStart=this.scene.children.length;
 // Librería junto a la entrada, a la izquierda antes del sofá.
 b(1.65,1.04,1.51,.70,2.04,.075,wood,true);
 for(const x of [1.30,2.00])b(x,1.04,1.66,.045,2.04,.31,wood,true);
 const spines=[red,blue,cream,tan,gray,carpet,this.orange];
 for(let row=0;row<6;row++){
  const y=.11+row*.315;b(1.65,y,1.66,.70,.045,.31,wood,true);
  for(let col=0;col<12;col++){
   const x=1.349+col*.054,h=.16+((row*13+col*7)%8)*.014,d=.115+((col+row)%4)*.024;
   b(x,y+.023+h/2,1.797-d/2,.038+((col+2*row)%4)*.004,h,d,spines[(col*3+row)%spines.length]);
   b(x,y+.064,1.799,.027,.009,.005,cream);
  }
 }
 b(1.65,2.071,1.66,.75,.045,.33,wood);
 this.annotate(inspectStart,'shelf');inspectStart=this.scene.children.length;
 b(3.76,.22,1.95,3.03,.43,.92,tan,true);b(2.46,.32,2.33,.75,.55,1.62,gray,true);b(3.81,.61,1.58,2.92,.66,.23,tan);for(let i=0;i<3;i++){b(2.93+i*.81,.49,1.98,.77,.16,.67,gray);b(2.93+i*.81,.78,1.73,.75,.46,.22,photo('upholstery',2,2)).rotation.x=-.11;}b(5.18,.48,1.96,.28,.38,.84,carpet,true);
 // La mesa y sus objetos giran juntos alrededor del centro del tablero.
 this.place(Math.PI,8.26,5.64,()=>{
 b(4.13,.52,2.82,.92,.065,.57,red,true);b(4.13,.26,2.82,.14,.52,.15,red);b(4.13,.065,2.82,.64,.08,.13,red);
 b(4.17,.571,2.80,.34,.026,.23,gray);b(4.17,.685,2.69,.34,.22,.026,dark).rotation.x=-.22;const display=new T.MeshStandardMaterial({color:0x223949,roughness:.22,emissive:0x4f7894,emissiveIntensity:.27});b(4.17,.69,2.706,.302,.178,.012,display).rotation.x=-.22;
 for(let i=0;i<6;i++)for(let j=0;j<3;j++)b(4.05+i*.041,.588,2.76+j*.028,.031,.006,.019,dark);
 b(3.82,.617,2.90,.061,.13,.061,blackCan());q(3.82,.687,2.90,.059,.012,.059,this.metal);
 });
 this.annotate(inspectStart,'sofa');
 function blackCan(){return solid(0x242128);}
 // Comedor bajo la ventana: mantel claro y tres sillas orientadas hacia la mesa.
 table(5.79,3.19,.98,1.60,.75,wood,wood);const cloth=solid(0xc4baaa);
 b(5.79,.791,3.19,1.01,.018,1.62,cloth);for(const z of [2.384,3.997])b(5.79,.655,z,1.01,.26,.019,cloth);for(const x of [5.286,6.294])fabric(this.scene,x,.655,3.19,1.60,.26,cloth,true,Math.PI/2);
 this.place(Math.PI/2,4.97,3.25,()=>chair(0,0,blue));this.place(Math.PI,5.76,2.13,()=>chair(0,0,dark));chair(5.77,4.23,cream);
 fabric(this.scene,5.76,.70,4.414,.39,.49,gray,true);
 fabric(this.scene,5.76,.72,1.946,.40,.45,dark,true);
 books(6.04,.833,2.63,5);books(5.99,.833,2.87,3);
 for(let i=0;i<5;i++){const p=b(5.54+i*.075,.805+i*.003,3.12+(i%2)*.11,.22,.006,.31,white);p.rotation.y=i*.28;}
 b(5.57,.816,2.66,.32,.029,.27,dark);b(5.96,.822,3.27,.26,.036,.18,gray);q(5.51,.828,3.43,.10,.064,.072,blackCan());
 b(5.98,.802,3.57,.40,.014,.25,cream);rad(6.43,2.43,16,'z');
 // La funda apoyada sobre el asiento queda suelta, sin cajas ni piezas rígidas.
 fabric(this.scene,4.72,.554,2.04,.42,.46,gray);
 for(const z of [2.20,4.16])fabric(this.scene,6.38,1.40,z,.35,2.13,photo('curtain',1,2),true,Math.PI/2);
 tube(this.scene,[[6.37,2.493,1.95],[6.37,2.493,4.37]],.014,chrome);
 this.diningPendant(5.76,3.15);
 for(const [x,w,h,src] of [[3.02,.46,.34,'artLarge'],[3.86,.23,.32,'artPortrait'],[4.68,.35,.46,'artFamily']] as const)this.livingFrame(x,1.72,1.475,w,h,src,1);
 this.tvConsole();b(3.70,.98,4.43,1.46,.82,.12,dark);const tvMat=new T.MeshStandardMaterial({color:0x131c27,roughness:.22,metalness:.24,emissive:0x272b33,emissiveIntensity:.12});const tvFace=b(3.70,.98,4.363,1.39,.75,.016,tvMat);tvFace.userData.live=true;tvFace.userData.inspect='La tele está apagada.';tvFace.userData.inspectLabel='Inspeccionar televisor';const screenLight=new T.PointLight(0x779bee,0,2.1,2);screenLight.position.set(3.7,1.0,4.13);this.scene.add(screenLight);let tvOn=false;const toggleTV=()=>{tvOn=!tvOn;tvMat.color.setHex(tvOn?0x263550:0x131c27);tvMat.emissive.setHex(tvOn?0x526eb0:0x272b33);tvMat.emissiveIntensity=tvOn?.38:.12;screenLight.intensity=tvOn?.74:0;};this.targets.push({mesh:tvFace,kind:'switch',label:()=>tvOn?'Apagar televisor':'Encender televisor',use:toggleTV});for(let i=0;i<12;i++){const line=b(3.7,.65+i*.055,4.353,1.36,.002,.003,solid(i%3?0x1a2029:0x282e38,.45));Object.assign(line.userData,tvFace.userData);this.targets.push({mesh:line,kind:'switch',label:()=>tvOn?'Apagar televisor':'Encender televisor',use:toggleTV});}b(3.70,.61,4.44,.085,.13,.08,dark);b(3.70,.55,4.43,.45,.022,.23,dark);for(const y of [1.57,2.08]){b(3.94,y,4.62,2.62,.063,.30,wood);books(4.63,y+.067,4.61,4);this.livingFrame(3.24,y+.15,4.66,.34,.20,'shelfArt',-1);}
 this.mediaShelfObjects();this.livingCabinet();this.printer(4.95,.582,4.455);
 const remote=solid(0x22252b,.65);for(const [x,z] of [[4.21,4.31],[4.34,4.37]]){b(x,.596,z,.063,.04,.174,remote);for(let i=0;i<5;i++)for(let j=0;j<2;j++)q(x-.014+j*.029,.619,z-.055+i*.025,.013,.009,.012,i===0&&j===0?red:gray);}
 this.outlet(3.23,.43,4.793,'x',0);
 tube(this.scene,[[3.72,.544,4.52],[3.88,.598,4.48],[4.02,.590,4.30],[4.18,.590,4.32],[4.28,.594,4.44],[4.46,.622,4.53],[4.77,.636,4.58]],.005,rubber);
 books(5.49,.37,4.45,7);b(6.07,.42,4.46,.45,.81,.29,wood,true);for(const y of [.25,.50,.78])books(6.07,y,4.46,3);
 const plant=solid(0x425540);q(6.16,.89,4.43,.21,.20,.18,carpet);for(let i=0;i<6;i++){const leaf=q(6.16+Math.sin(i*2.4)*.12,1.06+(i%3)*.046,4.43+Math.cos(i*2.4)*.10,.13,.064,.076,plant);leaf.rotation.z=i*.5;}
 q(2.29,.085,4.18,.23,.15,.22,white);q(2.29,.155,4.18,.18,.017,.17,dark);
 },true);
 // Cocina: los dos frentes, electrodomésticos y mesa azul.
 const oak=photo('cabinet'), steel=solid(0xb3b6b4,.29,.60), ceramic=solid(0x121519,.21,.14), whiteGoods=solid(0xdadcd8,.42);const counter=photo('worktop',3,1);
 for(const x of [-4.83,-4.23,-3.63,-3.03,-2.43]){
  if(x!==-3.03&&x!==-4.83&&x!==-2.43){b(x,.47,4.52,.58,.82,.61,oak,true);b(x,.49,4.196,.54,.74,.037,oak);tube(this.scene,[[x+.18,.56,4.169],[x+.195,.62,4.149],[x+.18,.68,4.169]],.011,chrome);}
  b(x,2.06,4.62,.582,.87,.41,oak);b(x,2.06,4.383,.545,.83,.045,oak);
  tube(this.scene,[[x+.185,1.82,4.348],[x+.216,1.90,4.319],[x+.187,1.98,4.348]],.012,chrome);
 }
 b(-3.63,.045,4.54,3.06,.09,.58,wood);b(-4.47,.922,4.49,1.40,.071,.66,counter,true);b(-2.82,.922,4.49,1.15,.071,.66,counter,true);
 b(-3.66,.922,4.186,.49,.071,.068,counter);b(-3.66,.922,4.762,.49,.071,.119,counter);vessel(this.scene,-3.66,.972,4.452,.52,.51,.19,steel,.64);tap(this.scene,-3.67,.969,4.752,-1,chrome,.194);
 const inspectStart=this.scene.children.length;
 // Frigorífico, con dos hojas independientes y notas sujetas por imanes.
 b(-1.65,1.00,4.50,.69,2.00,.65,whiteGoods,true);b(-1.65,1.318,4.151,.677,1.31,.14,whiteGoods);b(-1.65,.336,4.151,.677,.626,.14,whiteGoods);
 for(const [y,h] of [[1.02,.25],[.48,.20]])tube(this.scene,[[-1.92,y-h/2,4.069],[-1.92,y,4.023],[-1.92,y+h/2,4.069]],.015,steel);
 for(let i=0;i<6;i++){const x=-1.83+(i%3)*.141,y=1.16+Math.floor(i/3)*.27;b(x,y,4.077,.078,.118,.005,i<3?photo(['fridgePhoto','fridgeCalendar','fridgeNotes'][i]):i%2?cream:white).rotation.z=(i%3-1)*.17;q(x,y+.041,4.069,.022,.021,.015,[red,blue,gray][i%3]);}
 this.annotate(inspectStart,'fridge');
 // Horno, vitro y campana.
 b(-2.43,.453,4.50,.565,.825,.62,steel,true);b(-2.43,.419,4.176,.542,.53,.048,dark);b(-2.43,.419,4.146,.477,.389,.022,ceramic);
 tube(this.scene,[[-2.65,.696,4.15],[-2.62,.696,4.111],[-2.25,.696,4.111],[-2.215,.696,4.151]],.016,chrome);
 for(const x of [-2.60,-2.51,-2.35,-2.26]){const knob=cylinder(this.scene,x,.784,4.157,.023,.027,steel);knob.rotation.x=Math.PI/2;}
 b(-2.43,.969,4.48,.545,.022,.515,ceramic);for(const x of [-2.56,-2.30])for(const z of [4.355,4.59])ring(this.scene,x,.982,z,.086,.0025,steel,true);
 b(-2.44,1.70,4.51,.56,.086,.51,steel);for(let i=0;i<7;i++)b(-2.62+i*.06,1.651,4.49,.03,.007,.19,dark);
 // Lavadora: aro, junta de goma, ojo de buey y panel de mandos.
 b(-3.04,.45,4.49,.56,.82,.61,whiteGoods,true);ring(this.scene,-3.04,.425,4.174,.197,.021,whiteGoods);ring(this.scene,-3.04,.425,4.148,.170,.016,rubber);
 q(-3.04,.425,4.137,.33,.33,.064,new T.MeshStandardMaterial({color:0x263645,roughness:.18,metalness:.38}));ring(this.scene,-3.04,.425,4.114,.120,.007,steel);b(-2.871,.426,4.106,.032,.094,.026,whiteGoods);
 b(-3.166,.781,4.171,.20,.061,.022,white);b(-2.91,.784,4.168,.11,.041,.025,dark);const dial=cylinder(this.scene,-3.046,.781,4.15,.036,.029,steel);dial.rotation.x=Math.PI/2;
 b(-4.8,.459,4.49,.55,.83,.61,whiteGoods,true);b(-4.8,.48,4.168,.508,.746,.04,whiteGoods);tube(this.scene,[[-5.01,.779,4.144],[-4.99,.779,4.109],[-4.61,.779,4.108],[-4.58,.779,4.144]],.012,chrome);
 b(-4.76,1.13,4.54,.47,.32,.34,whiteGoods);b(-4.80,1.14,4.36,.34,.23,.027,ceramic);b(-4.57,1.20,4.353,.058,.09,.022,dark);
 for(const [x,z] of [[-4.2,4.61],[-4.04,4.68],[-2.94,4.72]]){cylinder(this.scene,x,1.041,z,.049,.16,cream);cylinder(this.scene,x,1.121,z,.052,.025,wood);}
 cylinder(this.scene,-2.98,1.035,4.61,.057,.14,blue);for(let i=0;i<4;i++)tube(this.scene,[[-3.02+i*.028,1.08,4.61],[-3.04+i*.041,1.25+i*.014,4.64]],.008,i%2?wood:chrome);
 // Escurreplatos y útiles junto al seno, visibles en 04.
 const rackZ=4.49;for(const x of [-3.35,-3.06])tube(this.scene,[[x,.965,rackZ-.14],[x,1.005,rackZ-.14],[x,1.005,rackZ+.15],[x,.965,rackZ+.15]],.006,chrome);
 for(let i=0;i<6;i++){const x=-3.34+i*.052;tube(this.scene,[[x,1.004,rackZ-.125],[x,1.052,rackZ],[x,1.004,rackZ+.135]],.0045,chrome);}
 for(const x of [-3.29,-3.23,-3.17]){const plate=cylinder(this.scene,x,1.075,rackZ,.076,.010,porcelain,.054);plate.rotation.z=Math.PI/2;}
 this.ovenTowel(-2.445,.696,4.111);
 for(const side of [1.482,4.818])b(-3.33,1.343,side,3.56,.087,.016,photo('tileTrim',6,1));
 b(-3.82,.72,4.152,.27,.26,.024,gray).rotation.z=.08;
 table(-3.74,1.91,1.75,.65,.75,solid(0x122f4c,.32,.20),white);chair(-3.23,2.46,blue);chair(-4.19,2.46,blue);
 this.kitchenUpper();
 for(let k=0;k<3;k++)cylinder(this.scene,-4.04,.80+k*.017,1.91,.115,.014,porcelain,.084);
 b(-3.65,.864,1.82,.24,.15,.17,steel);b(-3.65,.943,1.82,.20,.012,.042,dark);b(-3.44,.804,1.95,.14,.02,.18,photo('upholstery'));

 b(-1.31,1.78,1.545,.50,.34,.09,cream);b(-1.31,1.79,1.596,.447,.274,.021,ceramic);
 },true);
 // Recibidor y pasillo.
 const entryStart=this.scene.children.length;this.coatRack();rad(-.79,4.02,6,'z');b(-.833,1.42,4.49,.061,.25,.121,white);b(-.791,1.44,4.523,.057,.23,.047,cream).rotation.x=.09;for(let i=0;i<3;i++)b(-.795,1.36+i*.037,4.459,.025,.017,.025,gray);const coil:number[][]=[];for(let i=0;i<43;i++)coil.push([-.787+Math.sin(i*.79)*.012,1.33-i*.0057,4.51+Math.cos(i*.79)*.012]);tube(this.scene,coil,.004,rubber);this.annotate(entryStart,'entry');
 b(0,.015,4.17,1.02,.03,.53,carpet);
 
 }
 ovenTowel(x:number,y:number,z:number){
 // Perfil continuo de la tela: sube por detrás, rodea la barra y cae por delante.
 const profile=[[.022,-.196],[.022,-.105],[.019,-.028],[.019,.004],[.014,.015],[0,.020],[-.014,.015],[-.019,.004],[-.022,-.037],[-.028,-.106],[-.034,-.207],[-.036,-.257]], points:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let j=0;j<profile.length;j++)for(let i=0;i<=24;i++){
  const u=i/24,[Z,Y]=profile[j],hang=Math.max(0,-Y)/.257;
  points.push(x+(u-.5)*(.216+.028*hang),y+Y+Math.sin(u*19)*.009*hang,z+Z+Math.sin(u*26+j*.23)*.009*hang);uv.push(u,j/(profile.length-1));
  if(j&&i){const n=j*25+i;indices.push(n-26,n-25,n,n-26,n,n-1);}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:0xd4b339,side:T.DoubleSide,roughness:.97});const cloth=new T.Mesh(geo,material);cloth.castShadow=cloth.receiveShadow=true;this.scene.add(cloth);
 }
 kitchenBalcony(){
 // Vista desde 04: antepecho de celosía cuadrada, reja en el extremo y cestas a la derecha.
 const b=this.box.bind(this),x=-6.20,z=3.15,wall=solid(0x817b71,.89), lattice=solid(0x5d5d57,.88), grout=solid(0x77756d,.69);
 b(-5.76,-.08,z,1.07,.16,1.80,photo('bathFloor',2.5,4.2));
 b(-5.75,-.029,2.235,1.08,.08,.055,grout);b(-5.75,-.040,4.065,1.08,.08,.055,grout);
 for(const Z of [2.266,4.035])b(-5.71,.48,Z,1.00,.97,.115,wall);
 b(x,.063,z,.119,.126,1.82,lattice);
 const columns=15,rows=10,cell=.115,start=z-columns*cell/2;
 for(let i=0;i<=columns;i++)b(x,.594,start+i*cell,.096,1.04,.033,lattice);
 for(let i=0;i<=rows;i++)b(x,.115+i*.097,z,.096,.031,1.77,lattice);
 b(x,1.108,z,.137,.064,1.84,wall);
 // Cerramiento lateral y remate superior de obra, sin cerrar la vista a la calle.
 b(-5.67,2.48,z,.89,.11,1.90,wall);b(-6.13,1.77,4.03,.068,1.38,.071,wall);
 for(let i=0;i<4;i++)tube(this.scene,[[-5.27,1.61-i*.044,3.985],[-6.08,1.61-i*.044,3.985]],.0048,chrome);
 const basket=solid(0xae8d31,.83);b(-5.91,.034,3.73,.34,.068,.34,basket);for(const Z of [3.56,3.9]){b(-5.91,.206,Z,.35,.032,.030,basket);for(let i=0;i<7;i++)b(-6.069+i*.053,.126,Z,.012,.14,.02,basket);}
 for(const X of [-6.08,-5.74]){b(X,.206,3.73,.03,.032,.352,basket);for(let i=0;i<7;i++)b(X,.126,3.57+i*.052,.020,.14,.012,basket);}
 const translucent=new T.MeshStandardMaterial({color:0xb8b6ac,roughness:.73,transparent:true,opacity:.73});this.rounded(-5.73,.347,3.825,.39,.37,.27,translucent);tube(this.scene,[[-5.74,.49,3.76],[-5.69,.589,3.79],[-5.67,.626,3.83],[-5.68,.503,3.90]],.013,translucent);
 }
 printer(x:number,y:number,z:number){
 const body=new T.Group();body.name='Impresora del salón';body.userData.storyAction='printer';body.userData.inspect='La impresora está en su sitio. Ahora no necesito imprimir nada.';body.userData.inspectLabel='Inspeccionar impresora';body.position.set(x,y,z);this.scene.add(body);
 const satin=solid(0x191b20,.49), lid=solid(0x1c2025,.64), seam=solid(0x080a0d,.78), panel=solid(0x25282c,.40);
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,m:Mat,r:number)=>{const mesh=new T.Mesh(profile(w,h,d,r>.03),m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;body.add(mesh);return mesh;};
 // Impresora negra compacta, con tapa plana de escáner y esquinas delanteras redondeadas.
 b(0,.050,0,.437,.103,.340,satin,.043);b(0,.105,.005,.441,.044,.346,lid,.040);
 b(0,.133,.027,.414,.018,.275,lid,.015);b(0,.124,-.109,.414,.006,.014,seam,.004);
 b(0,.041,-.165,.287,.033,.011,seam,.005);b(0,.024,-.174,.290,.012,.028,panel,.007);
 const keys=b(.147,.101,-.147,.142,.029,.063,panel,.015);keys.rotation.x=-.56;
 b(.150,.116,-.163,.056,.009,.028,solid(0x171d20,.30),.003).rotation.x=-.56;
 for(let i=0;i<3;i++)b(.104+i*.039,.112,-.182,.010,.006,.009,solid(0x383b40,.60),.003).rotation.x=-.56;
 const label=new T.Mesh(new T.PlaneGeometry(.095,.054),photo('printerLabel'));label.rotation.x=-Math.PI/2;label.position.set(-.105,.142,.032);body.add(label);
 }
 tvConsole(){
 const b=this.box.bind(this),oak=photo('cabinet'), edge=solid(0xac865d,.68), dark=solid(0x322e2a,.78), face=solid(0x856a4c,.62);
 // Misma huella de colisión que el mueble anterior.
 this.obstacles.push([2.165,5.295,4.275,4.765]);
 b(3.73,.044,4.532,3.064,.074,.422,dark);b(3.73,.554,4.52,3.13,.064,.49,oak);
 for(const x of [2.184,3.064,4.314,5.274])b(x,.296,4.536,.040,.472,.431,oak);
 b(3.73,.286,4.741,3.084,.482,.035,face);b(3.73,.103,4.52,3.10,.040,.415,oak);
 for(const [x,w] of [[2.62,.82],[4.80,.91]]){b(x,.307,4.296,w,.401,.043,oak);b(x,.486,4.271,w-.069,.020,.014,edge);}
 b(3.691,.276,4.529,1.208,.034,.395,oak);b(3.633,.331,4.456,.36,.064,.227,dark);b(3.633,.343,4.337,.26,.017,.010,solid(0x575852,.58));
 }
 mediaShelfObjects(){
 const b=this.box.bind(this),dark=solid(0x222325,.65),silver=solid(0x8f9190,.42,.38);
 b(2.84,1.83,4.591,.24,.445,.24,dark);b(2.84,1.83,4.456,.20,.39,.026,silver);
 for(const [y,r] of [[1.73,.066],[1.952,.034]]){const driver=cylinder(this.scene,2.84,y,4.436,r,.015,dark);driver.rotation.x=Math.PI/2;}
 for(let i=0;i<5;i++){const k=b(3.79+i*.083,1.685,4.625,.067,.14+(i%3)*.022,.14,solid([0xa7764e,0x51666b,0x4f4842][i%3]));k.rotation.z=(i%2)*.07;}
 }
 livingCabinet(){
 const b=this.box.bind(this),x=1.70,z=4.60;
 const side=solid(0x403b35,.60), champagne=solid(0xbdb7a9,.27), glass=new T.MeshStandardMaterial({color:0x97a2a2,opacity:.27,transparent:true,roughness:.19,depthWrite:false});
 this.obstacles.push([x-.32,x+.32,z-.215,z+.215]);
 for(const X of [x-.30,x+.30])b(X,1.18,z,.039,2.32,.43,side);
 b(x,1.18,z+.192,.62,2.32,.039,side);for(const y of [.060,.71,1.45,2.311])b(x,y,z,.60,.040,.417,side);
 const face=z-.220;
 b(x,.38,face,.578,.622,.035,champagne);b(x,1.882,face,.578,.815,.035,champagne);
 for(const [key,y,h,w] of [['cabinetSheets',1.91,.36,.26],['cabinetCalendar',.452,.30,.27]] as const){const note=new T.Mesh(new T.PlaneGeometry(w,h),photo(key));note.rotation.y=Math.PI;note.position.set(x-.057,y,face-.019);this.scene.add(note);}
 b(x,1.081,face,.530,.700,.019,glass);for(const X of [x-.282,x+.282])b(X,1.081,face,.031,.728,.034,side);
 for(const y of [.714,1.448])b(x,y,face,.579,.033,.034,side);for(const y of [.91,1.17])b(x,y,z,.547,.018,.375,glass);
 // Hojas satinadas, tiradores verticales y baldas con cajas y objetos domésticos.
 for(const [y,h] of [[.43,.203],[1.07,.195],[1.80,.229]])tube(this.scene,[[x+.225,y-h/2,face-.023],[x+.229,y,face-.047],[x+.225,y+h/2,face-.023]],.009,chrome);
 for(const [X,y,color] of [[x-.119,.815,0xa48a68],[x+.109,.831,0x536168],[x+.133,1.03,0x8b7667],[x-.114,1.255,0x544943]]){b(X,y,z+.021,.127,.148,.197,solid(color,.72));}
 }
 diningPendant(x:number,z:number){
 const fixture=new T.Group();fixture.position.set(x,0,z);this.scene.add(fixture);
 const wire=solid(0x99928a,.44,.55), mount=solid(0x59534f,.35,.51);
 cylinder(fixture,0,2.506,0,.103,.077,mount,.090);cylinder(fixture,0,2.460,0,.036,.043,chrome);
 tube(fixture,[[0,2.44,0],[.016,2.35,.006],[.002,2.22,0],[0,2.155,0]],.0065,mount);
 cylinder(fixture,0,2.154,0,.041,.053,brass,.033);cylinder(fixture,0,2.102,0,.025,.073,mount);
 // Pantalla abierta de hilo trenzado, con contorno ovalado y bombilla visible.
 for(let i=0;i<14;i++){const y=1.91+i*.016,r=.152*Math.sqrt(Math.max(.12,1-((y-2.02)/.137)**2)),loop:number[][]=[];for(let j=0;j<=32;j++){const A=j/32*Math.PI*2;loop.push([Math.cos(A)*r,y+.004*Math.sin(5*A+i*.7),Math.sin(A)*r]);}tube(fixture,loop,.0027,wire);}
 for(let i=0;i<16;i++){const rib:number[][]=[];for(let j=0;j<=12;j++){const v=j/12,y=1.893+v*.257,r=.149*Math.sin(v*Math.PI)**.66+.019,a=i/16*Math.PI*2+v*.57;rib.push([r*Math.cos(a),y,r*Math.sin(a)]);}tube(fixture,rib,.0027,wire);}
 const on=!!this.rooms.find(r=>r.name==='Salón')?.light?.intensity;const bulb=new T.MeshStandardMaterial({color:0xffe1b4,roughness:.45,emissive:0xffbd6b,emissiveIntensity:on?.52:0});const globe=new T.Mesh(new T.SphereGeometry(.039,14,10),bulb);globe.position.set(0,2.034,0);globe.scale.y=1.27;fixture.add(globe);
 const light=new T.PointLight(0xffca8e,on?2.8:0,2.85,2);light.position.set(0,1.895,0);fixture.add(light);this.diningLamp={light,bulb};
 }
 kitchenUpper(){
 const b=this.box.bind(this),beige=solid(0xb9b09d,.58),frame=solid(0xbbb3a3,.52), trim=photo('cabinet'), pane=new T.MeshStandardMaterial({color:0x6b7775,roughness:.43,metalness:.07});
 // Frente continuo bajo el techo, con dos puertas de vidrio ahumado junto al acceso.
 const doors=[[-4.52,.58,false],[-3.93,.58,false],[-3.34,.58,false],[-2.75,.58,true],[-2.16,.58,true]] as const;
 b(-3.34,1.715,1.634,2.96,.069,.407,trim);b(-3.34,2.459,1.624,2.96,.043,.39,beige);
 for(const [x,w,glazed] of doors){b(x,2.09,1.624,w-.012,.709,.355,beige);const z=1.824;
  if(glazed){b(x,2.09,z-.014,w-.113,.624,.027,pane);for(const X of [x-w*.5+.04,x+w*.5-.04])b(X,2.09,z,.066,.706,.044,frame);for(const y of [1.766,2.414])b(x,y,z,w-.130,.057,.044,frame);}
  else b(x,2.09,z,w-.018,.704,.045,beige);
  const X=x+(x===-2.16?-.20:.20);tube(this.scene,[[X,1.817,z+.025],[X+.013,1.888,z+.061],[X+.016,1.973,z+.064],[X,2.025,z+.025]],.010,chrome);
 }
 }
 livingFrame(x:number,y:number,z:number,w:number,h:number,source:string,facing:1|-1){
  const frame=new T.Group();frame.position.set(x,y,z);frame.rotation.set(0,facing===1?0:Math.PI,0,'YXZ');this.scene.add(frame);
  const b=(x:number,y:number,z:number,w:number,h:number,d:number,m:Mat)=>this.box(x,y,z,w,h,d,m,false,frame);
  const edge=.019;b(0,0,.001,w,h,.018,this.dark);b(0,0,.014,w-2*edge,h-2*edge,.012,this.cream);
  for(const k of [-1,1]){b(k*(w-edge)*.5,0,.024,edge,h,.035,this.wood);b(0,k*(h-edge)*.5,.024,w-2*edge,edge,.035,this.wood);}
  const aspect=cropAspect(source),innerW=w-2*edge-.012,innerH=h-2*edge-.012, P=Math.min(innerW,innerH*aspect);
  const picture=new T.Mesh(new T.PlaneGeometry(P,P/aspect),photo(source));picture.rotation.set(0,0,0);picture.position.z=.014+.006+.005;frame.add(picture);
 }
 coatRack(){
 const b=this.box.bind(this),q=this.rounded.bind(this);const iron=solid(0x26272b,.51,.59), zip=solid(0x414044,.72);
 const railX=.82;b(railX,1.79,4.12,.085,.11,1.16,this.wood);
 for(const z of [3.65,4.12,4.61]){b(.772,1.79,z,.026,.062,.061,iron);const mount=cylinder(this.scene,.752,1.79,z,.010,.015,chrome);mount.rotation.z=Math.PI/2;tube(this.scene,[[.761,1.786,z],[.699,1.775,z],[.665,1.791,z],[.66,1.829,z]],.010,iron);}
 const jacket=(z:number,top:number,w:number,h:number,col:Mat,trim:Mat)=>{
  const pos:number[]=[],uv:number[]=[],index:number[]=[],sections=16,sides=24;
  for(let j=0;j<=sections;j++){const v=j/sections;const Y=top-v*h;const breadth=w*.5*(v<.18?.52+v*2.35:1-.17*v);const depth=.073*(.75+.25*Math.sin(v*Math.PI));
   for(let i=0;i<=sides;i++){const f=i/sides,a=f*Math.PI*2,swell=1+.08*Math.sin(v*11*Math.PI);pos.push(.712-Math.cos(a)*depth*swell,Y,z+Math.sin(a)*breadth);uv.push(f,1-v);if(i&&j){const k=j*(sides+1)+i;index.push(k,k-sides-1,k-sides-2,k,k-sides-2,k-1);}}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();const mat=col.clone();mat.side=T.DoubleSide;const mesh=new T.Mesh(geo,mat);mesh.castShadow=mesh.receiveShadow=true;this.scene.add(mesh);
  q(.744,top+.01,z,.16,.16,w*.56,trim);q(.661,top+.028,z,.087,.092,w*.38,zip);
  for(const side of [-1,1]){const sleeve=tube(this.scene,[[.71,top-.112,z+side*w*.43],[.683,top-.28*h,z+side*w*.56],[.673,top-.57*h,z+side*w*.59],[.674,top-.86*h,z+side*w*.54]],.048,col);sleeve.receiveShadow=true;
   const cuff=cylinder(this.scene,.674,top-.86*h,z+side*w*.54,.044,.050,trim);cuff.rotation.x=side*.16;
   tube(this.scene,[[.642,top-.55*h,z+side*w*.18],[.64,top-.65*h,z+side*w*.33]],.004,trim);}
  tube(this.scene,[[.650,top-.06,z],[.634,top-h*.48,z+.014],[.649,top-h*.964,z+.012]],.004,zip);
  const stitching=solid(0x342e35,.98);for(let i=1;i<=6;i++){const Y=top-h*(.23+i*.104);tube(this.scene,[[.688,Y,z-w*.38],[.648,Y-.011,z-w*.21],[.636,Y-.016,z],[.647,Y-.01,z+w*.21],[.69,Y,z+w*.37]],.0026,stitching);}
 };
 jacket(3.78,1.79,.34,.76,solid(0x1d3040,.96),solid(0x20262c,.9));
 jacket(4.17,1.77,.39,.68,solid(0xa65a42,.96),solid(0x242830,.93));
 jacket(4.55,1.82,.39,.75,solid(0xaa99a6,.96),solid(0xc5bac3,.96));
 }
 furnishKids(){const {b,q,wood,cream,dark,tan,carpet,glass,table,rad,art}=this.furnitureTools();
 // Dormitorio infantil.
 b(-3.14,.195,.69,1.97,.39,.89,wood,true);this.raised.set(this.obstacles.length-1,.55);b(-3.14,.46,.69,1.94,.14,.87,cream);q(-3.91,.577,.69,.35,.111,.59,cream);
 this.kidsQuilt(-3.08,.69,.543,1.93,.91,.17,quilt('baja'));
 // Tras reflejar la planta del dormitorio, -Z queda a la izquierda mirando desde su puerta.
 let inspectStart=this.scene.children.length;const lx=-3.14,lz=-2.11,k=2/3;
 for(const x of [-4.08,-2.20])for(const z of [lz-.41,lz+.41])b(x,.66*k,z,.073,1.32*k,.076,cream,true);
 b(lx,1.24*k,lz,1.98,.13*k,.90,cream);for(let i=0;i<12;i++)b(-4.03+i*.163,1.175*k,lz,.084,.018,.82,wood);
 b(lx,1.38*k,lz,1.93,.20*k,.89,cream);this.kidsQuilt(lx,lz,1.49*k,1.96,.91,.105,quilt('alta'));q(-3.86,1.53*k,lz,.40,.13,.61,cream);
 for(const z of [lz-.424,lz+.424]){b(lx,1.65*k,z,1.88,.057*k,.044,cream);for(const x of [-4.06,-3.54,-2.98,-2.42])b(x,1.46*k,z,.057,.44*k,.048,cream);}
 this.annotate(inspectStart,'loft');inspectStart=this.scene.children.length;
 b(-4.12,-.36,-.71,.02,.01,.01,dark);table(-4.08,-.73,.46,1.60,.72,wood,wood);this.annotate(inspectStart,'desk');rad(-4.26,-1.22,10,'z');b(-1.30,.99,.60,.65,1.98,1.28,photo('wardrobe'),true);for(const z of [.28,.92]){b(-1.635,1.08,z,.026,.61,.59,glass);b(-1.65,1.07,z+.22,.027,.13,.026,this.metal);}for(const [z,y,w,h,src] of [[.30,1.69,.38,.49,'childPoster'],[.84,1.68,.35,.49,'childCalendar'],[.87,1.30,.40,.15,'childPets']] as const)art(-1.66,y,z,w,h,'z',photo(src));for(const y of [.075,1.93])b(-1.645,y,.60,.042,.029,1.28,chrome);this.kidsPhotoObjects();for(const z of [.04,1.155])b(-1.641,1.08,z,.035,.69,.026,wood);for(const z of [.31,.92])tube(this.scene,[[-1.653,.986,z+.211],[-1.680,1.059,z+.211],[-1.653,1.136,z+.211]],.007,chrome);

 q(-2.88,2.40,-.64,.23,.15,.23,dark);for(let i=0;i<4;i++){const a=i*Math.PI/2;const o=b(-2.88+Math.cos(a)*.28,2.39,-.64+Math.sin(a)*.28,.43,.019,.14,wood);o.rotation.y=-a;}
 }
 kidsQuilt(x:number,z:number,y:number,length:number,width:number,drop:number,mat:T.MeshStandardMaterial){
  // Una sola malla cubre superficie y caídas: UV longitudinales y continuo en las esquinas.
  const pos:number[]=[],uv:number[]=[],idx:number[]=[],cols=38,rows=26;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const u=i/cols,v=j/rows,px=u*2-1,pz=v*2-1,edge=Math.max(Math.abs(px),Math.abs(pz));
   const d=T.MathUtils.smoothstep(edge,.84,1);
   pos.push(x+px*length*.5,y+.018+Math.sin(u*31+v*11)*.008+Math.cos(v*19-u*6)*.007-drop*d,z+pz*width*.5+.014*d*Math.sin(u*18+v*9));uv.push(v,1-u);
   if(i&&j){const n=j*(cols+1)+i;idx.push(n-cols-2,n-1,n,n-cols-2,n,n-cols-1);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();const m=mat.clone();m.side=T.DoubleSide;
  const mesh=new T.Mesh(geo,m);mesh.castShadow=mesh.receiveShadow=true;this.scene.add(mesh);
 }
 private kidsDeskDetails(){
  const top=.7575,group=new T.Group();group.name='Objetos personales del escritorio';group.userData.inspectId='deskDetails';this.scene.add(group);
  const matte=solid(0x252830,.87),metal=solid(0x484d55,.66,.2),paper=solid(0xc4bba5,.94),ink=solid(0x171b22,.9);
  const box=(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,m:Mat)=>this.box(x,y,z,w,h,d,m,false,p);
  const laptop=new T.Group();laptop.position.set(-4.18,top,-.024);group.add(laptop);
  box(laptop,.069,.006,0,.148,.012,.169,metal);box(laptop,.066,.013,0,.081,.003,.143,ink);
  for(let row=0;row<4;row++)for(let col=0;col<9;col++)box(laptop,.034+row*.015,.015,(col-4)*.014,.010,.002,.010,matte);
  box(laptop,.115,.013,0,.027,.002,.049,matte);
  const lid=new T.Group();lid.position.set(0,.009,0);lid.rotation.z=.19;laptop.add(lid);
  box(lid,0,.061,0,.009,.124,.168,matte);
  const display=new T.MeshStandardMaterial({color:0x253447,emissive:0x516786,emissiveIntensity:.16,roughness:.52});
  box(lid,.005,.061,0,.002,.104,.149,display);
  for(let i=0;i<3;i++)box(lid,.0063,.079-i*.012,-.018,.001,.002,.064-i*.012,solid(0x444e61,.62));
  box(group,-3.917,top+.007,.030,.046,.014,.027,matte);
  const cube=new T.Group(),size=.063,third=size/3;cube.name="Cubo de Rubik 3×3";cube.position.set(-3.916,top+size/2,-.055);cube.rotation.y=.42;group.add(cube);
  box(cube,0,0,0,size,size,size,ink);
  const palette=[0xf5f4ec,0xffda24,0xe12230,0xff791d,0x165ad9,0x22ae57].map(c=>solid(c,.68));
  const faces=[[2,0,4,1,2,5,4,0,3],[5,4,3,0,3,1,2,5,2],[1,5,3,0,0,4,3,1,5],[4,1,0,5,1,2,0,3,4],[1,2,4,5,4,0,3,2,1],[2,5,1,3,5,3,4,2,0]];
  for(let f=0;f<6;f++)for(let n=0;n<9;n++){const a=(n%3-1)*third,b=(Math.floor(n/3)-1)*third,d=(f%2?1:-1)*(size/2+.0005),tile=third-.0026,m=palette[faces[f][n]];if(f<2)box(cube,d,a,b,.001,tile,tile,m);else if(f<4)box(cube,a,d,b,tile,.001,tile,m);else box(cube,a,b,d,tile,tile,.001,m);}
  for(const [i,color] of [0x3e515e,0x794643].entries()){
   const notes=new T.Group();notes.position.set(-4.13+i*.016,top+i*.013,-1.417+i*.019);notes.rotation.y=i?.14:-.12;group.add(notes);
   const cover=solid(color,.87);box(notes,0,.006,0,.127,.012,.105,paper);for(const y of [.001,.012])box(notes,0,y,0,.132,.002,.11,cover);box(notes,0,.010,-.051,.13,.004,.011,cover);
  }
 }
 kidsPhotoObjects(){
 const b=this.box.bind(this),q=this.rounded.bind(this), cream=solid(0xd1ba95,.96), brown=solid(0x93613d,.96), black=solid(0x211a17,.79), red=solid(0x873139,.96), blue=solid(0x293743,.96);
 const deskProps=this.scene.children.length;
 // Bajo la ventana: caja baja rojiza, prendas oscuras dobladas y sudadera gris sobre el tablero.
 b(-4.08,.812,-1.14,.29,.11,.27,solid(0x6b423b,.87));b(-4.08,.875,-1.14,.302,.022,.28,solid(0x886760,.83));
 for(const [x,y,z,w,d,m] of [[-4.04,.901,-1.12,.26,.21,blue],[-4.06,.797,-.95,.25,.24,solid(0x3e434d,.95)],[-4.08,.840,-.65,.32,.37,solid(0x565963,.95)],[-4.09,.800,-.27,.31,.28,blue]] as const){b(x,y,z,w,.068,d,m);fabric(this.scene,x,y+.039,z,w,d,m);}
 fabric(this.scene,-3.84,.687,-.63,.31,.33,solid(0x555960,.95),true,Math.PI/2);
 this.annotate(deskProps,'desk');this.kidsDeskDetails();
 // Cada parte es una esfera elipsoidal suave; la fotografía aporta el pelo o el tejido.
 const furBrown=photo('plushBrown'),furCream=photo('plushCream'),furBear=photo('plushBear'),furWhite=photo('plushWhite'),furDog=photo('plushDog');
 const plush=(x:number,y:number,z:number,w:number,h:number,d:number,m:Mat,lean=0)=>{const o=q(x,y,z,w,h,d,m);o.rotation.z=lean;return o;};
 plush(-3.54,.769,.91,.47,.396,.366,furBrown,-.08);plush(-3.49,.766,.818,.334,.281,.191,furCream,.10);plush(-3.61,.914,.90,.335,.289,.302,furBrown,-.12);
 for(const [x,r] of [[-3.736,.14],[-3.48,-.19]]){plush(x,1.051,.912,.107,.111,.087,furBrown,r);plush(x,1.048,.872,.060,.073,.039,furCream,r);}
 plush(-3.55,.889,.758,.19,.128,.098,furCream);for(const x of [-3.641,-3.50])plush(x,.934,.759,.023,.027,.018,black);plush(-3.55,.892,.701,.045,.027,.027,black);
 for(const [x,lean] of [[-3.708,-.24],[-3.391,.32]]){plush(x,.742,.845,.119,.208,.118,furBrown,lean);plush(x,.594,.821,.137,.071,.104,furCream,lean);}
 const redFur=photo('plushRed');plush(-3.90,.63,.49,.275,.139,.203,redFur);plush(-3.805,.681,.472,.16,.104,.146,redFur);
 const nightFur=photo('plushDark');plush(-2.92,.605,.520,.168,.069,.097,nightFur);plush(-2.83,.637,.52,.083,.075,.075,nightFur);plush(-2.898,.615,.467,.082,.049,.016,furCream);
 const orangeFur=photo('plushOrange');plush(-2.72,.599,.718,.105,.068,.108,orangeFur);plush(-2.665,.585,.713,.043,.042,.059,furCream);for(const z of [.679,.756])for(const x of [-2.75,-2.69])plush(x,.574,z,.034,.029,.046,orangeFur);
 // Cama alta: oso de la foto 10 y perro de pelo claro de la foto 05.
 plush(-3.80,1.048,-2.11,.234,.165,.185,furBear,.13);plush(-3.90,1.142,-2.12,.163,.166,.158,furBear,-.20);
 for(const z of [-2.18,-2.06])plush(-3.949,1.223,z,.063,.059,.068,furBear,.3);plush(-3.821,1.133,-2.12,.072,.07,.10,furCream);plush(-3.785,1.148,-2.12,.018,.024,.031,black);
 for(const z of [-2.171,-2.069])plush(-3.742,1.005,z,.112,.058,.072,furBear);
 plush(-3.31,1.028,-2.06,.235,.108,.149,furWhite,.09);plush(-3.203,1.065,-2.069,.126,.122,.126,furWhite);
 for(const z of [-2.122,-2.017]){plush(-3.200,1.047,z,.081,.084,.053,furDog,.45);plush(-3.287,1.004,z,.126,.043,.052,furWhite);}
 plush(-3.139,1.05,-2.069,.035,.032,.044,black);
 }
 furnishBedrooms(){
 const {b,q,wood,white,dark,cream,gray,books,rad,art}=this.furnitureTools();
 // Eje de la foto tomada desde la entrada: paso a la izquierda, cama a la derecha y ventana al fondo.
 let inspectStart=this.scene.children.length;const cover=quilt('padres'), black=solid(0x242126), brass=solid(0xa77c51);
 b(-.28,.20,-7.69,2.04,.40,1.58,wood,true);this.raised.set(this.obstacles.length-1,.58);
 b(-.30,.47,-7.69,2.03,.16,1.60,cream);b(-.38,.545,-7.69,1.93,.035,1.65,cover);fabric(this.scene,-.38,.574,-7.69,1.94,1.66,cover);
 b(-1.327,.37,-7.69,.045,.36,1.66,cover);for(const z of [-8.51,-6.87])b(-.43,.39,z,1.81,.33,.033,cover);
 for(const z of [-8.05,-7.33]){q(.39,.61,z,.41,.15,.62,cream);const cushion=b(.24,.68,z,.30,.12,.31,black);cushion.rotation.z=.24;}
 this.annotate(inspectStart,'bed');
 b(.82,.53,-7.69,.095,1.06,1.94,solid(0xe7ded0,.36),true);b(.80,.111,-7.69,.105,.096,1.94,white);b(.755,1.075,-7.69,.225,.039,1.97,solid(0xdad5cc,.42));b(.646,1.073,-7.69,.026,.029,1.97,chrome);this.outlet(.752,.79,-8.28,'z',0);b(.744,.786,-8.05,.036,.105,.103,cream);
 b(.733,1.095,-7.71,.126,.013,.41,dark);b(.731,1.132,-8.43,.049,.19,.083,solid(0x233b49,.8));
 b(.85,1.76,-7.75,.065,1.36,2.62,photo('botanical',1,1));
 for(let i=0;i<7;i++){const bottle=q(.74,1.15+(i%3)*.015,-8.41+i*.18,.052,.105+(i%3)*.03,.058,i%2?brass:gray);b(bottle.position.x+.004,1.214+(i%3)*.03,bottle.position.z,.031,.022,.031,dark);}
 // Cajonera y estantes junto a la ventana, del lado del cabecero.
 b(.24,.49,-9.01,1.02,.98,.55,cream,true);
 for(let i=0;i<4;i++){b(.24,.14+i*.22,-8.72,.97,.185,.036,i===2?wood:white);b(.25,.14+i*.22,-8.69,.16,.022,.025,gray);}
 b(.70,1.67,-9.00,.09,1.73,.55,wood);b(-.24,1.67,-9.26,.045,1.73,.15,wood);
 for(const y of [1.08,1.48,1.88,2.27]){b(.24,y,-9.05,.93,.046,.45,wood);books(.36,y+.055,-9.04,3);}
 b(.63,1.30,-6.07,.50,2.59,.80,wood,true);b(.36,1.12,-6.05,.041,.17,.057,brass);
 for(let i=0;i<5;i++){const page=b(.12+i*.035,1.05+i*.006,-8.829,.226,.006,.20,i===4?photo('sleevePaper'):cream);page.rotation.y=i*.09;}
 b(.45,1.077,-8.955,.20,.14,.15,solid(0xadb864,.88));
 // Televisor alto y tendedero en el lado opuesto a la cama.
 b(-2.55,1.99,-6.89,.093,.40,.60,dark).rotation.z=-.13;
 b(-2.49,1.98,-6.89,.024,.34,.53,solid(0x171e29)).rotation.z=-.13;
 inspectStart=this.scene.children.length;const rod=solid(0x899499,.40,.69), joint=solid(0x334957,.53), x0=-2.43,x1=-1.90;
 this.obstacles.push([x0-.012,x1+.012,-8.44,-6.92]);this.raised.set(this.obstacles.length-1,1.08);
 for(const x of [x0,x1]){tube(this.scene,[[x,.035,-7.27],[x,.51,-7.70],[x,.96,-8.15]],.011,rod);tube(this.scene,[[x,.035,-8.14],[x,.51,-7.70],[x,.96,-7.25]],.011,rod);q(x,.51,-7.70,.043,.040,.038,joint);}
 for(const z of [-7.27,-8.14])tube(this.scene,[[x0,.045,z],[x1,.045,z]],.010,rod);
 for(const x of [x0,x1])tube(this.scene,[[x,1.065,-6.93],[x,.96,-7.25],[x,.96,-8.15],[x,1.071,-8.43]],.011,rod);
 for(let i=0;i<13;i++){const z=-6.96-i*.12,y=.958+Math.max(0,Math.abs(z+7.704)-.447)*.36;tube(this.scene,[[x0,y,z],[x1,y,z]],.006,rod);}
 for(const [zz,yy,w,h,m] of [[-7.42,.745,.42,.39,gray],[-7.85,.718,.38,.435,solid(0x354653)],[-8.22,.855,.31,.25,cream]] as const){fabric(this.scene,-2.16,yy,zz,w,h,m,true);for(const x of [-2.29,-2.04])b(x,.962,zz,.015,.042,.018,joint);}
 this.annotate(inspectStart,'rack');
 art(-2.56,1.58,-8.67,.58,.80,'z',brass);mirror(this.scene,-2.527,1.58,-8.67,.529,.745,Math.PI/2);art(.63,1.48,-8.68,.17,.25,'x',photo('parentsArt'));
 rad(-2.21,-9.19,13,'x');
 // Visillos oscuros con motivos rectangulares; el centro deja pasar la luz de la ventana.
 const curtain=photo('darkCurtain',1,2), motif=solid(0x3e4249);b(-1.53,2.38,-9.13,2.29,.026,.029,rod);
 for(const center of [-2.34,-.70])for(let i=0;i<6;i++){const x=center+(i-2.5)*.091,z=-9.09+Math.sin(i*1.8)*.032;b(x,1.31,z,.10,2.08,.047,curtain);for(let j=0;j<5;j++)if((i+j)%3===0)b(x,.62+j*.34,z+.026,.045,.10,.008,motif);}
 q(-.52,2.37,-7.67,.24,.14,.24,cream);for(let i=0;i<18;i++){const a=i*2.4;const o=q(-.52+Math.sin(a)*.21,2.16+(i%4)*.073,-7.67+Math.cos(a)*.21,.13,.075,.055,rod);o.rotation.y=a;}
 }
 bathWC(x:number,z:number){
 this.place(-Math.PI/2,x,z,()=>{const {b,q}=this.furnitureTools();
 // La cisterna queda contra la pared del fondo; la taza apunta al acceso.
 b(0,.660,0,.407,.410,.226,porcelain,true);q(0,.867,0,.403,.066,.232,porcelain);
 q(0,.209,.308,.306,.418,.378,porcelain);vessel(this.scene,0,.456,.332,.432,.508,.141,porcelain,.81);
 q(0,.470,.335,.417,.034,.485,porcelain);q(0,.495,.332,.421,.025,.487,porcelain);
 b(0,.163,.320,.309,.326,.433,porcelain,true);cylinder(this.scene,0,.899,0,.022,.010,chrome);
 });
 }
 bathSink(x:number,z:number,second:boolean){
 const inspectStart=this.scene.children.length;const {b,q,art}=this.furnitureTools();b(x,.397,z-.035,.205,.794,.260,porcelain,true);
 this.obstacles.push([x-.246,x+.246,z-.247,z+.251]);vessel(this.scene,x,.868,z,.503,.501,.124,porcelain,.77);tap(this.scene,x,.868,z-.174,1,chrome,.131);
 this.annotate(inspectStart,'bath');
 const wall=second?z-.296:-.837;art(x,1.485,wall,.494,.665,'x',second?photo('mirrorStars'):chrome);mirror(this.scene,x,1.485,wall+.029,.429,.594,0);
 if(second){const cup=solid(0xba7586,.52);cylinder(this.scene,x-.172,.921,z-.159,.036,.080,cup,.026);for(let i=0;i<2;i++)tube(this.scene,[[x-.179+i*.014,.94,z-.16],[x-.186+i*.017,1.011,z-.165]],.004,porcelain);}
 }
 furnishBath(second:boolean){
 const {b,q,white,gray,cream,rad}=this.furnitureTools();
 if(!second){
  this.bathSink(2.120,-.574,false);this.bathWC(2.934,-.178);
  // 09 solo documenta la entrada. La ducha conserva la posición indicada al fondo a la derecha.
  const inspectStart=this.scene.children.length;const x=2.639,z=.888,glass=new T.MeshStandardMaterial({color:0xb5c8d2,roughness:.18,transparent:true,opacity:.19,depthWrite:false});
  b(x,.019,z,.891,.038,.867,porcelain);
  b(x-.43,.043,z,.022,.021,.862,porcelain);b(x+.43,.043,z,.022,.021,.862,porcelain,true);this.raised.set(this.obstacles.length-1,.054);
  for(const Z of [z-.421,z+.421]){b(x,.043,Z,.877,.021,.018,porcelain,true);this.raised.set(this.obstacles.length-1,.054);}
  // Dos costados sólidos; el izquierdo deja un hueco de acceso junto al fondo.
  for(const [X,Z,depth] of [[x-.439,.603,.296],[x+.439,z,.865]]){const side=b(X,H/2,Z,.055,H,depth,photo('wallStone',3,4),true);side.userData.wallRepeatAxis='z';side.userData.wallHeight=H/originalHeight;}
  const drain=cylinder(this.scene,x,.043,z+.10,.043,.008,chrome);drain.castShadow=false;for(let i=0;i<5;i++)b(x-.023+i*.011,.048,z+.10,.004,.003,.044,rubber);
  b(x,1.029,.472,.878,1.932,.015,glass,true);for(const X of [x-.438,x+.438])b(X,1.028,.472,.024,1.948,.023,chrome);
  b(x,2.001,.472,.888,.024,.024,chrome);b(x,.057,.472,.888,.023,.024,chrome);b(x-.421,1.04,.484,.021,.173,.044,chrome);
  for(const zz of [.954,1.122]){const base=cylinder(this.scene,3.062,1.035,zz,.035,.020,chrome);base.rotation.z=Math.PI/2;}
  tube(this.scene,[[3.054,1.039,.954],[3.011,1.039,.962],[3.011,1.039,1.111],[3.054,1.039,1.122]],.020,chrome);
  tube(this.scene,[[3.01,1.024,1.029],[2.965,.73,1.029],[2.932,.67,1.05],[2.938,1.53,1.04]],.008,chrome);
  tube(this.scene,[[3.057,1.06,1.04],[3.052,1.85,1.04],[2.982,1.944,1.04],[2.816,1.946,1.04]],.013,chrome);cylinder(this.scene,2.817,1.926,1.04,.069,.024,chrome);
  this.annotate(inspectStart,'bath');return;
 }
 // Orden visible desde 13: lavabo a la izquierda, WC enfrente, bañera a la derecha y bidé en primer plano.
 this.bathSink(2.78,-5.279,true);this.bathWC(3.131,-4.490);
 const tx=2.425,tz=-3.497;
 b(tx,.286,tz,1.67,.572,.626,this.stone,true);vessel(this.scene,tx,.605,tz,1.687,.635,.242,porcelain,.38);
 tap(this.scene,3.174,.601,tz- .206,1,chrome,.135);
 const glass=new T.MeshStandardMaterial({color:0xc9d1d1,opacity:.12,transparent:true,roughness:.23,depthWrite:false});
 b(2.89,1.30,tz-.330,.716,1.38,.013,glass);b(3.253,1.302,tz-.330,.024,1.391,.021,chrome);b(2.531,1.299,tz-.330,.013,1.379,.017,chrome);
 fabric(this.scene,2.309,.434,tz-.350,.464,.358,gray,true);
 for(const [X,Z,Y,r,col] of [[3.166,-3.287,.661,.042,0x365240],[3.067,-3.259,.654,.030,0xe0d7d4],[3.129,-3.714,.631,.038,0x48594f]]){cylinder(this.scene,X,Y,Z,r,.102,solid(col,.60));cylinder(this.scene,X,Y+.056,Z,r*.74,.018,solid(col===0x48594f?0xa28046:0xcac8c3,.53));}
 // Bidé al comienzo del lateral derecho, separado del extremo de la bañera.
 const bx=1.229,bz=-3.426;q(bx,.21,bz,.293,.415,.330,porcelain);b(bx,.16,bz,.260,.32,.302,porcelain,true);vessel(this.scene,bx,.441,bz,.408,.510,.122,porcelain,.81);tap(this.scene,bx,.443,bz+.168,-1,chrome,.117);
 // Portarrollos a la derecha de la cisterna (13).
 tube(this.scene,[[3.258,.923,-4.16],[3.188,.921,-4.155],[3.166,.903,-4.165]],.010,chrome);
 const roll=cylinder(this.scene,3.151,.883,-4.154,.044,.095,porcelain);roll.rotation.z=Math.PI/2;
 fabric(this.scene,3.124,.751,-4.154,.088,.197,cream,true,Math.PI/2);
 // Radiador y toallero de 02 en la pared lateral; no invaden la entrada.
 rad(1.108,-5.459,6,'x');tube(this.scene,[[1.67,1.079,-5.535],[1.67,1.079,-5.489],[2.09,1.079,-5.489],[2.09,1.079,-5.535]],.0095,chrome);
 fabric(this.scene,1.875,.918,-5.469,.348,.361,cream,true);fabric(this.scene,1.743,.932,-5.452,.121,.336,white,true);
 }
 blocked(x:number,z:number,r=.18,height?:number,feet=0){if(!this.rooms.some(({b:[a,b,c,d]})=>x>=a&&x<=b&&z>=c&&z<=d))return true;for(let i=0;i<this.obstacles.length;i++){const [a,b,c,d]=this.obstacles[i];const top=this.raised.get(i);if(top!==undefined&&feet>=top-.002)continue;const dx=x-Math.max(a,Math.min(b,x)),dz=z-Math.max(c,Math.min(d,z));if(dx*dx+dz*dz<r*r)return true;}if(height!==undefined&&feet+height>.775){const k=HOUSE_PLAN_SCALE,dx=x-Math.max(2.15*k,Math.min(4.13*k,x)),dz=z-Math.max(-2.56*k,Math.min(-1.66*k,z));if(dx*dx+dz*dz<r*r)return true;}return this.doors.some(d=>this.doorHit(d,x,z,r));}
 ceilingAt(x:number,z:number){return this.rooms.some(({b:[a,b,c,d]})=>x>=a&&x<=b&&z>=c&&z<=d)?H:Infinity;}
 support(x:number,z:number,r:number,ceiling:number){let y=0;for(const [i,top] of this.raised){if(top>ceiling+.004)continue;const [a,b,c,d]=this.obstacles[i],dx=x-Math.max(a,Math.min(b,x)),dz=z-Math.max(c,Math.min(d,z));if(dx*dx+dz*dz<r*r)y=Math.max(y,top);}return y;}
 doorHit(d:Door,x:number,z:number,r=.18){const k=HOUSE_PLAN_SCALE,dx=x-d.hinge.position.x*k,dz=z-d.hinge.position.z*k,a=d.hinge.rotation.y;const u=(dx*Math.cos(a)-dz*Math.sin(a))*Math.sign(d.hinge.scale.x),v=dx*Math.sin(a)+dz*Math.cos(a);return Math.abs(v)<r+.04*k&&u> -r&&u<d.w*k+r;}
 update(dt:number,x:number,z:number){for(const d of this.doors){const prev=d.hinge.rotation.y;d.hinge.rotation.y=T.MathUtils.damp(prev,d.open?d.angle:d.closed,8,dt);if(this.doorHit(d,x,z))d.hinge.rotation.y=prev;}}
}
