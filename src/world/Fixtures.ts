import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {solid} from '../config/HouseMaterials';
import {MIRROR_HEAD_LAYER} from '../entities/YasminPlayer';
export const porcelain=solid(0xe4e0d8,.30), chrome=solid(0xb4bac0,.23,.85), brass=solid(0xad885a,.30,.80), rubber=solid(0x232629,.78);
function put(parent:T.Object3D,g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
export function tube(parent:T.Object3D,points:number[][],radius:number,mat:T.Material=chrome,smooth=true){const pts=points.map(([x,y,z])=>new T.Vector3(x,y,z));const path=new T.CatmullRomCurve3(pts,false,smooth?'centripetal':'catmullrom',smooth?.5:0);return put(parent,new T.TubeGeometry(path,Math.max(8,pts.length*3),radius,6,false),mat);}
export function ring(parent:T.Object3D,x:number,y:number,z:number,r:number,t:number,mat:T.Material,flat=false){const o=put(parent,new T.TorusGeometry(r,t,8,24),mat,x,y,z);if(flat)o.rotation.x=-Math.PI/2;return o;}
export function cylinder(parent:T.Object3D,x:number,y:number,z:number,r:number,h:number,m:T.Material,rBottom=r){return put(parent,new T.CylinderGeometry(r,rBottom,h,16),m,x,y,z);}
export function vessel(parent:T.Object3D,x:number,y:number,z:number,w:number,l:number,depth:number,mat=porcelain,shape=1){
 const rings=[[.001,-depth],[.52,-depth],[.68,-depth*.87],[.86,-depth*.32],[.9,-.013],[.96,.006],[1.0,-.007],[.985,-.045],[.83,-depth*.83],[.55,-depth*1.06],[.001,-depth*1.06]];const positions:number[]=[],uvs:number[]=[],indices:number[]=[];const n=40;
 rings.forEach(([r,y],i)=>{for(let k=0;k<=n;k++){const a=k/n*Math.PI*2;const p=(v:number)=>Math.sign(v)*Math.abs(v)**shape;positions.push(p(Math.cos(a))*w*.5*r,y,p(Math.sin(a))*l*.5*r);uvs.push(k/n,i/(rings.length-1));if(i&&k){const v=i*(n+1)+k;indices.push(v,v-1,v-n-2,v,v-n-2,v-n-1);}}});
 const geo=new T.BufferGeometry();geo.setIndex(indices);geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.computeVertexNormals();const surface=mat.clone();surface.side=T.DoubleSide;const o=put(parent,geo,surface,x,y,z);cylinder(parent,x,y-depth+.002,z,.031,.009,chrome);return o;
}
export function tap(parent:T.Object3D,x:number,y:number,z:number,toward=-1,mat=chrome,reach=.14){cylinder(parent,x,y+.018,z,.033,.036,mat);tube(parent,[[x,y+.028,z],[x,y+.14,z],[x,y+.182,z+toward*.042],[x,y+.168,z+toward*reach],[x,y+.13,z+toward*reach]],.013,mat);tube(parent,[[x,y+.084,z],[x+.058,y+.103,z]],.009,mat);}
let reflecting=false;
export function mirror(parent:T.Object3D,x:number,y:number,z:number,w:number,h:number,angle:number){
 const o=new Reflector(new T.PlaneGeometry(w,h),{textureWidth:256,textureHeight:256,color:0xb3ada8,clipBias:.006});o.position.set(x,y,z);o.rotation.y=angle;const original=o.onBeforeRender;let last=-Infinity;o.onBeforeRender=function(...args){const now=performance.now();if(args[2].userData.storyStill||reflecting||now-last<84)return;o.getReflectionCamera(args[2]).layers.enable(MIRROR_HEAD_LAYER);reflecting=true;try{original.apply(this,args);last=now;}finally{reflecting=false;}};o.userData.live=true;o.userData.opticalMirror=true;o.userData.inspect="Soy yo. La luz me hace parecer más cansada de lo que estoy.";o.userData.inspectLabel="Mirarte en el espejo";parent.add(o);return o;
}
export function fabric(parent:T.Object3D,x:number,y:number,z:number,w:number,d:number,mat:T.Material,vertical=false,angle=0){
 const g=new T.PlaneGeometry(w,d,18,12),a=g.attributes.position;
 for(let i=0;i<a.count;i++){const A=a.getX(i),B=a.getY(i);a.setZ(i,(vertical?.020:.024)*Math.sin(A/w*27+B/d*4)+(vertical?.010:.013)*Math.sin(B/d*15+A/w*10));if(vertical)a.setY(i,B+Math.max(0,-B/d)*.014*Math.sin(A/w*23));else if(Math.abs(B)>d*.39)a.setZ(i,a.getZ(i)-(Math.abs(B)/d-.39)*.28);}
 g.computeVertexNormals();const m=mat.clone();m.side=T.DoubleSide;const o=put(parent,g,m,x,y,z);if(!vertical)o.rotation.x=-Math.PI/2;o.rotateOnWorldAxis(new T.Vector3(0,1,0),angle);return o;
}
