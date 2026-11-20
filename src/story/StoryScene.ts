import * as T from 'three';
import {HOUSE_PLAN_SCALE,type HouseBuilder} from '../world/HouseBuilder';
import {vessel,cylinder} from '../world/Fixtures';
import {solid} from '../config/HouseMaterials';
import {MIRROR_HEAD_LAYER,type YasminPlayer} from '../entities/YasminPlayer';
const k=HOUSE_PLAN_SCALE;
export const FOOD={x:5.01*k,z:1.86*k}, DOG_FEED={x:5.00*k,z:2.23*k};
export const WATCH={x:.03*k,z:-1.24*k}, WATCH_AT={x:-1.17*k,z:-2.24*k};
export class StoryScene{
 private kibble=new T.Group();private led?:T.Mesh;private sheet?:T.Mesh;private ink?:T.CanvasTexture;private printData='';private latchMeshes:{mesh:T.Object3D;x:number}[]=[];
 private view=document.getElementById('story-view')!;private timer=0;
 constructor(private scene:T.Scene,private renderer:T.WebGLRenderer,private house:HouseBuilder,private yasmin:YasminPlayer){
  const bowl=new T.Group();bowl.position.set(FOOD.x,0,FOOD.z);bowl.name='Cuenco de Lola';bowl.userData.storyAction='bowl';scene.add(bowl);
  const steel=solid(0x8a9197,.37,.63);vessel(bowl,0,.092,0,.285,.275,.073,steel);cylinder(bowl,0,.014,0,.137,.025,solid(0x222426,.89),.156);
  bowl.add(this.kibble);const feed=new T.InstancedMesh(new T.IcosahedronGeometry(.010,0),solid(0xffffff),28),pellet=new T.Object3D();
  for(let i=0;i<28;i++){const a=i*2.39996,r=.095*Math.sqrt((i+.5)/28);pellet.position.set(Math.cos(a)*r,.036+(i%3)*.008,Math.sin(a)*r);pellet.scale.setScalar(.83+i%4*.11);pellet.scale.y*=.7;pellet.rotation.set(i*.6,i,0);pellet.updateMatrix();feed.setMatrixAt(i,pellet.matrix);feed.setColorAt(i,new T.Color(i%3===0?0x715037:0x5b3926));}feed.computeBoundingSphere();this.kibble.add(feed);this.kibble.visible=false;
  scene.traverse(o=>{if(o.userData.storyAction==='latch')this.latchMeshes.push({mesh:o,x:o.position.x});});
  const printer=scene.getObjectByName('Impresora del salón');if(printer){
   const led=new T.Mesh(new T.BoxGeometry(.008,.004,.007),new T.MeshStandardMaterial({color:0x183325,emissive:0x4df4a0,emissiveIntensity:0}));led.position.set(.207,.116,-.161);printer.add(led);this.led=led;
   const paper=new T.Mesh(new T.PlaneGeometry(.207,.146),new T.MeshStandardMaterial({color:0xfffaf0,roughness:.94,side:T.DoubleSide}));paper.rotation.x=-Math.PI/2;paper.position.set(0,.057,-.115);paper.visible=false;paper.userData.storyAction='printer';printer.add(paper);this.sheet=paper;
  }
 }
 get open(){return !this.view.hidden;}
 fillBowl(show:boolean){this.kibble.visible=show;}
 lock(on=true){for(const {mesh,x} of this.latchMeshes)mesh.position.x=x+(on?.017:0);}
 clearPrint(){this.printData='';this.ink?.dispose();this.ink=undefined;if(this.sheet){const m=this.sheet.material as T.MeshStandardMaterial;m.map=null;m.needsUpdate=true;}}
 resetProps(locked:boolean){this.close();this.fillBowl(false);this.lock(locked);if(this.sheet)this.sheet.visible=false;if(this.led)(this.led.material as T.MeshStandardMaterial).emissiveIntensity=0;}
 close(){clearTimeout(this.timer);this.view.hidden=true;this.view.innerHTML='';this.view.className='';}
 landing(first:boolean){
  this.close();this.view.hidden=false;this.view.className='peephole-view';
  this.view.innerHTML=`<div class="peephole-field ${first?'':'dark'}"><svg viewBox="0 0 400 400" aria-label="Rellano oscuro, visto por la mirilla"><defs><radialGradient id="landing-glow"><stop stop-color="#8b826f"/><stop offset="1" stop-color="#25262b"/></radialGradient><linearGradient id="landing-floor" x2="0" y2="1"><stop stop-color="#505050"/><stop offset="1" stop-color="#22242a"/></linearGradient></defs><g class="landing-light"><rect width="400" height="400" fill="url(#landing-glow)"/><path d="M0 0H116L140 248 0 331Z" fill="#35373b"/><path d="M0 331L140 248 400 272V400H0Z" fill="url(#landing-floor)"/><path d="M115 11L324 72 319 261 140 248Z" fill="#5d5a52"/><path d="M153 71L227 88 225 249 162 245Z" fill="#272a2c" stroke="#7b7466" stroke-width="4"/><path d="M310 120l90-60v263l-89-62Z" fill="#4b4b48"/><path d="M229 285l66-82 105-17m-143 113 1-48m23 65 3-91m28 105 0-124m32 136 1-144m33 156-1-162" fill="none" stroke="#26282b" stroke-width="5"/><path d="M130 273l105 7M107 294l145 6M77 317l178 8M46 343l217 9" stroke="#33363a" stroke-width="2"/><ellipse cx="268" cy="63" rx="23" ry="6" fill="#b5ab8c"/>${first?'<g class="landing-figure" fill="#111216"><path d="M270 237l-3-57 8-31 19-14 18 0 20 13 11 24 12 44-12 6-15-33-2 47-3 41-17 0-5-37-6 39-17-1z"/><ellipse cx="303" cy="119" rx="16" ry="21"/></g>':''}</g></svg></div>`;
  if(first)this.timer=window.setTimeout(()=>this.close(),2670);else this.timer=window.setTimeout(()=>this.close(),1600);
 }
 makePhoto(){
  const W=352,H=224,still=new T.PerspectiveCamera(13,W/H,.08,42);still.userData.storyStill=true;still.layers.enable(MIRROR_HEAD_LAYER);
  still.position.set(5.64*k,1.53,3.39*k);still.lookAt(-2.89*k,1.13,3.23*k);
  const actor=new T.PerspectiveCamera();actor.position.set(-2.91*k,1.64,3.26*k);actor.lookAt(-5.5*k,1.63,3.22*k);actor.updateMatrixWorld();
  const oldPos=this.yasmin.root.position.clone(),oldRot=this.yasmin.root.quaternion.clone(),lights=this.house.rooms.filter(r=>r.light&&['Salón','Cocina','Recibidor'].includes(r.name)).map(r=>[r.light!,r.light!.intensity] as const);
  const doors=this.house.doors.filter(d=>Math.abs(Math.abs(d.hinge.position.x)-.92)<.01&&d.hinge.position.z>2),angles=doors.map(d=>d.hinge.rotation.y);
  const slats:T.Object3D[]=[];this.scene.traverse(o=>{if(o.userData.balconySlat&&o.visible)slats.push(o);});
  const rt=new T.WebGLRenderTarget(W,H),previous=this.renderer.getRenderTarget(),pixels=new Uint8Array(W*H*4);
  try{
   for(const o of slats)o.visible=false;for(const [light] of lights)light.intensity=27;doors.forEach(d=>{d.hinge.rotation.y=d.angle;});
   this.yasmin.update(actor,0,0,.016);this.scene.updateMatrixWorld(true);this.renderer.setRenderTarget(rt);this.renderer.render(this.scene,still);this.renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);
  }finally{
   this.renderer.setRenderTarget(previous);rt.dispose();doors.forEach((d,i)=>{d.hinge.rotation.y=angles[i];});for(const o of slats)o.visible=true;
   for(const [light,value] of lights)light.intensity=value;this.yasmin.root.position.copy(oldPos);this.yasmin.root.quaternion.copy(oldRot);this.scene.updateMatrixWorld(true);
  }
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d')!;const data=ctx.createImageData(W,H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const j=((H-1-y)*W+x)*4,n=(y*W+x)*4;const l=(pixels[j]*.213+pixels[j+1]*.715+pixels[j+2]*.072)/255;
   const vignette=1-.44*Math.min(1,Math.hypot((x-W/2)/W,(y-H/2)/H));const c=(Math.pow(l,.38)*262+8+(Math.random()-.5)*34+Math.sin(y*2.2)*4)*vignette;
   data.data[n]=data.data[n+1]=data.data[n+2]=c;data.data[n+3]=255;
  }
  ctx.putImageData(data,0,0);this.printData=canvas.toDataURL('image/jpeg',.91);
  this.ink?.dispose();this.ink=new T.CanvasTexture(canvas);this.ink.colorSpace=T.SRGBColorSpace;
  const m=this.sheet?.material as T.MeshStandardMaterial|undefined;if(m){m.map=this.ink;m.needsUpdate=true;}
 }
 print(progress:number){if(this.led)(this.led.material as T.MeshStandardMaterial).emissiveIntensity=progress>=1?.56:1.55;if(!this.sheet)return;this.sheet.visible=true;this.sheet.scale.y=Math.max(.035,progress);this.sheet.position.z=-.171-.073*progress;}
 read(){if(this.sheet)this.sheet.visible=false;this.close();this.view.hidden=false;this.view.className='photo-view';this.view.innerHTML=`<figure><img src="${this.printData}" alt="Fotografía impresa en blanco y negro, vista desde el balcón de la cocina"><figcaption>Fotografía impresa · E para guardar</figcaption></figure>`;}
}
