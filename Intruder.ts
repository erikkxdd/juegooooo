import * as T from 'three';
import {profile} from '../world/DetailGeometry';
const cloth=new T.MeshStandardMaterial({color:0x24252a,roughness:.94}), seam=new T.MeshStandardMaterial({color:0x3a393d,roughness:.97}),black=new T.MeshStandardMaterial({color:0x111216}),skin=new T.MeshStandardMaterial({color:0x675349});
export class Intruder{
 root=new T.Group();private legs:T.Group[]=[];private arms:T.Group[]=[];private head=new T.Group();private walk=0;private stride=0;
 private haze=new T.Mesh(new T.ConeGeometry(1,1,28,1,true).translate(0,-.5,0),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,vertexShader:`varying vec3 vLocal; varying vec3 vWorld; void main(){vLocal=position;vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vLocal;varying vec3 vWorld;uniform vec3 origin;uniform vec3 direction;void main(){float t=clamp(-vLocal.y,0.,1.);float rim=abs(dot(normalize(vWorld-cameraPosition),normalize(vWorld-origin-direction*dot(vWorld-origin,direction)))); float fog=smoothstep(.025,.20,t)*(1.-smoothstep(.34,1.,t))*.078*(.30+.7*rim);gl_FragColor=vec4(.54,.67,.89,fog);}`,uniforms:{origin:{value:new T.Vector3()},direction:{value:new T.Vector3()}}}));
 private axis=new T.Vector3(0,-1,0);private aimVector=new T.Vector3();
 light=new T.SpotLight(0xe1ebff,26,9,.30,.51,1.45);beam=new T.Object3D();phone=new T.Group();
 constructor(scene:T.Scene){
  scene.add(this.root);this.root.visible=false;
  const box=(p:T.Object3D,m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>{const o=new T.Mesh(profile(w,h,d,true),m);o.position.set(x,y,z);p.add(o);return o;};
  const oval=(p:T.Object3D,m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>{const o=new T.Mesh(new T.SphereGeometry(1,12,9),m);o.position.set(x,y,z);o.scale.set(w,h,d);p.add(o);return o;};
  box(this.root,cloth,0,1.23,0,.43,.59,.255);oval(this.root,cloth,0,1.45,.004,.249,.17,.134);box(this.root,seam,0,1.23,.133,.011,.48,.008);box(this.root,cloth,0,.965,.016,.42,.16,.273);
  this.head.position.set(0,1.66,.012);this.root.add(this.head);oval(this.head,cloth,0,.067,-.024,.139,.182,.134);oval(this.head,black,0,.049,.058,.105,.133,.077);oval(this.head,skin,0,.007,.093,.075,.096,.039);oval(this.head,skin,0,-.01,.127,.024,.027,.022);box(this.head,black,0,.067,.112,.151,.035,.032);
  for(const sign of [-1,1]){
   const leg=new T.Group();leg.position.set(sign*.108,.91,0);this.root.add(leg);this.legs.push(leg);box(leg,black,0,-.401,0,.177,.82,.184);box(leg,seam,0,-.845,.05,.171,.12,.28);
   const arm=new T.Group();arm.position.set(sign*.229,1.437,0);this.root.add(arm);this.arms.push(arm);box(arm,cloth,0,-.167,0,.154,.36,.158);
   const elbow=new T.Group();elbow.position.set(0,-.315,0);arm.add(elbow);elbow.rotation.x=sign===1?-1.31:-.13;box(elbow,cloth,0,-.115,0,.132,.274,.137);oval(elbow,skin,0,-.261,0,.052,.078,.052);
   if(sign===1){this.phone.position.set(.011,-.281,.026);this.phone.rotation.x=1.31;elbow.add(this.phone);box(this.phone,black,0,0,0,.067,.132,.016);box(this.phone,new T.MeshBasicMaterial({color:0xcadbf1}),0,.042,.011,.012,.012,.008);}
  }
  // Keep the beam tied to the phone; the small shadow map prevents wall bleed.
  this.light.castShadow=true;this.light.shadow.mapSize.set(256,256);this.light.shadow.bias=-.0007;this.light.shadow.normalBias=.028;this.light.shadow.camera.near=.12;
  scene.add(this.light,this.beam,this.haze);this.haze.visible=false;this.haze.userData.nonOccluding=true;this.light.target=this.beam;this.light.visible=false;
 }
 extinguish(){this.light.visible=false;this.haze.visible=false;}
 reset(x:number,z:number){this.walk=this.stride=0;this.root.position.set(x,0,z);this.root.rotation.y=Math.PI;this.root.visible=false;this.light.visible=false;this.haze.visible=false;}
 pose(dt:number,travel:number,yaw:number,aimYaw:number,aimY:number,running:boolean){
  this.root.rotation.y+=Math.atan2(Math.sin(yaw-this.root.rotation.y),Math.cos(yaw-this.root.rotation.y))*Math.min(1,dt*7);
  this.head.rotation.y=Math.atan2(Math.sin(aimYaw-this.root.rotation.y),Math.cos(aimYaw-this.root.rotation.y))*.57;
  this.walk+=travel*(running?8:11);this.stride=T.MathUtils.damp(this.stride,travel>.00001?1:0,10,dt);
  for(let i=0;i<2;i++){const a=Math.sin(this.walk+i*Math.PI)*this.stride;this.legs[i].rotation.x=a*.44;this.arms[i].rotation.x=-a*(i?.09:.32);}
  this.root.position.y=Math.abs(Math.sin(this.walk))*.024*this.stride;
  this.root.updateMatrixWorld(true);this.phone.getWorldPosition(this.light.position);this.beam.position.set(this.light.position.x+Math.sin(aimYaw)*5,aimY,this.light.position.z+Math.cos(aimYaw)*5);this.beam.updateMatrixWorld();
  this.haze.visible=this.light.visible&&this.root.visible;this.aimVector.subVectors(this.beam.position,this.light.position).normalize();this.haze.position.copy(this.light.position);this.haze.quaternion.setFromUnitVectors(this.axis,this.aimVector);const range=3.8,r=range*Math.tan(this.light.angle)*.94;this.haze.scale.set(r,range,r);this.haze.material.uniforms.origin.value.copy(this.light.position);this.haze.material.uniforms.direction.value.copy(this.aimVector);
 }
}
