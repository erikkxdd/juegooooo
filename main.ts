import {initTrailer} from './ui/Trailer';
import {IntroSlides} from './story/IntroSlides';
import {Chapters,type StartChapter} from './ui/Chapters';
import {inspection,type InspectId} from './story/Inspectables';
import './style.css';
import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {PointerLockControls} from 'three/addons/controls/PointerLockControls.js';
import {HouseBuilder,HOUSE_PLAN_SCALE,type Target} from './world/HouseBuilder';
import {Lola} from './entities/Lola';
import {YasminPlayer} from './entities/YasminPlayer';
import {AudioEngine} from './audio/AudioEngine';
import {Phone} from './ui/Phone';
import {reticle,type Mark} from './ui/Reticle';
import {createLolaLinePicker} from './ui/LolaLines';
import {StoryManager,InvasionStory,ALERT_PET,type StoryAction} from './story/StoryManager';
import {SettingsMenu,type Settings} from './ui/Settings';
import {TapePresentation} from './ui/TapePresentation';
import {VerticalMotion} from './world/VerticalMotion';
import {Intruder} from './entities/Intruder';
import {Patrol,entry,roomAt,underLoft} from './story/Stealth';
import {FinalScreen} from './story/FinalScreen';
import {StoryScene,FOOD,DOG_FEED,WATCH,WATCH_AT} from './story/StoryScene';
const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
function boot(){
const renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance'});renderer.setSize(854,480,false);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;$('view').appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0x06070a);scene.fog=new T.FogExp2(0x08080b,.085);
const camera=new T.PerspectiveCamera(69,854/480,.045,38);camera.position.set(0,1.64,4.39*HOUSE_PLAN_SCALE);camera.lookAt(0,1.60,-2.90*HOUSE_PLAN_SCALE);scene.add(camera);
scene.add(new T.HemisphereLight(0xb9c1df,0x67463b,.40));const house=new HouseBuilder(scene);
const warm=new T.PointLight(0xff996c,5,2.8*HOUSE_PLAN_SCALE,2);warm.position.set(-7.12*HOUSE_PLAN_SCALE,1.15,4.83*HOUSE_PLAN_SCALE);scene.add(warm);const moon=new T.PointLight(0x9ab8ef,4,3.2*HOUSE_PLAN_SCALE,2);moon.position.set(-7.49*HOUSE_PLAN_SCALE,1.52,3.60*HOUSE_PLAN_SCALE);scene.add(moon);function syncAccent(){warm.visible=moon.visible=!!house.rooms.find(r=>r.name==='Salón')?.light?.intensity;}
const flash=new T.SpotLight(0xe5edff,16,10,.39,.57,1.65);flash.position.set(.12,-.12,-.11);flash.target.position.set(0,0,-4);flash.castShadow=true;flash.shadow.mapSize.set(512,512);flash.shadow.bias=-.0005;flash.shadow.normalBias=.02;camera.add(flash,flash.target);flash.visible=false;
const composer=new EffectComposer(renderer);composer.setSize(854,480);composer.addPass(new RenderPass(scene,camera));const vhs=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},strength:{value:1},scanlines:{value:1}},vertexShader:`varying vec2 uvp;void main(){uvp=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 uvp;uniform sampler2D tDiffuse;uniform float time;uniform float strength;uniform float scanlines;float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec2 uv=uvp;float jitter=sin(uv.y*77.+time*1.4)*.00048*strength;vec3 col=texture2D(tDiffuse,uv+vec2(jitter,0.)).rgb;col.r=mix(col.r,texture2D(tDiffuse,uv+vec2(.0014*strength,0.)).r,.3);float lines=sin(uv.y*1507.96)*.027*scanlines*strength;float n=(rnd(floor(uv*vec2(854.,480.))+floor(time*20.))-.5)*.038*strength;float v=1.-.55*strength*smoothstep(.20,.73,length((uv-.5)*vec2(1.,.88)));gl_FragColor=vec4(max(vec3(0.),col*(v+lines)+n*.4),1.);}`});composer.addPass(vhs);composer.addPass(new OutputPass());
const audio=new AudioEngine(),phone=new Phone(audio),yasmin=new YasminPlayer(scene),lola=new Lola(house,scene);
const controls=new PointerLockControls(camera,renderer.domElement),tape=new TapePresentation(audio);
const pauseMenu=$('pause-menu'),resumeButton=$<HTMLButtonElement>('resume');
let paused=false,ignoreUnlock=false,starting=false,options:Settings;
function applySettings(value:Settings){options=value;controls.pointerSpeed=value.mouse;audio.setVolume(value.volume/100);audio.mix(value.sfx/100,value.music/100);renderer.toneMappingExposure=value.exposure;vhs.uniforms.strength.value={high:1,medium:.65,low:.30}[value.vhs];vhs.uniforms.scanlines.value=Number(value.scan);}
const chapters=new Chapters(time=>beginFromMenu(time));
initTrailer();
const intro=new IntroSlides(()=>audio.introPulse(),()=>{audio.introEnd();resetGame('21:30');});
const settings=new SettingsMenu(applySettings,()=>audio.uiTape(),closeSettings);
function openSettings(){audio.start();audio.menu(true);if(paused)pauseMenu.hidden=true;document.body.classList.add('settings-open');settings.show();}
function closeSettings(){settings.close();document.body.classList.remove('settings-open');if(paused)pauseMenu.hidden=false;$<HTMLButtonElement>(paused?'pause-settings':'home-settings').focus();audio.uiTape();}
$('home-settings').onclick=openSettings;$('pause-settings').onclick=openSettings;
document.addEventListener('pointerover',e=>{const b=(e.target as Element).closest?.('.vhs-button');if(b&&!b.contains(e.relatedTarget as Node))audio.uiHover();});
audio.menu(true);document.addEventListener('pointerdown',()=>{if(!hasStarted)audio.start();});
function setClock(time:string){$('tape-clock').textContent=time;phone.setTime(time);tape.chapter(time);recordAct(time);}
let active=false,dragMode=false,captureVersion=0;
const phoneLook=new T.Quaternion();let phoneReleasePending=false,phoneRelockPending=false,quietLookUntil=0;
const lookDebounce=80;const cross=$('cross'),status=$('status'),button=$<HTMLButtonElement>('start'),subtitle=$('subtitle');
const keys=new Set<string>();let subtitleTimer=0;type Choice={mark:Mark;label:string;use:()=>void};let target:Choice|undefined;
function thought(text:string){window.clearTimeout(subtitleTimer);subtitle.textContent=text;subtitle.hidden=false;subtitleTimer=window.setTimeout(()=>{subtitle.hidden=true;},text.length>64?5400:4300);}
const intruder=new Intruder(scene),patrol=new Patrol(),finalScreen=new FinalScreen();
const props=new StoryScene(scene,renderer,house,yasmin);
const story=new StoryManager({thought,atmosphere:m=>audio.atmosphere(m),pour:()=>audio.kibble(),doorBrush:()=>audio.peephole(),stairCut:()=>audio.stairCut(),paper:()=>audio.paper(),clock:setClock,initialMessage:()=>phone.start(),warningMessage:()=>phone.enableWarning(),
 dogEat:()=>lola.eatAt(DOG_FEED,FOOD),dogAlert:()=>lola.alertAt(WATCH,WATCH_AT),fillBowl:show=>props.fillBowl(show),latch:()=>{props.lock();audio.latch();},
 intercom:()=>audio.intercom(),peephole:first=>props.landing(first),print:p=>props.print(p),printerSound:()=>audio.printer(),makePhoto:()=>{try{props.makePhoto();}catch(e){console.warn('No se pudo capturar la fotografía de la escena.',e);}},readPhoto:()=>props.read(),
});
const vertical=new VerticalMotion();let hasStarted=false;const spawn=camera.position.clone(),spawnRotation=camera.quaternion.clone();
const k=HOUSE_PLAN_SCALE,front=house.doors.find(d=>Math.abs(d.hinge.position.z-4.85)<.01)!;
const scan=new T.Raycaster(),vector=new T.Vector3(),beam=new T.Vector3(),sample=new T.Vector3();
let crouched=false,saved:{p:T.Vector3;q:T.Quaternion;dog:T.Vector3;doors:{open:boolean;rotation:number}[];feet:number;flash:boolean;crouched:boolean}|undefined;
function stopForScreen(){phoneReleasePending=phoneRelockPending=false;quietLookUntil=0;tape.clearHeart();keys.clear();captureVersion++;if(phone.visible){phone.toggle();document.body.classList.remove('phone-open');}props.close();if(document.pointerLockElement===renderer.domElement){ignoreUnlock=true;document.exitPointerLock();}cross.hidden=true;subtitle.hidden=true;audio.growl(Infinity);}
function startInvasion(){
 resetEncounter();
 if(saved){camera.position.copy(saved.p);camera.quaternion.copy(saved.q);crouched=saved.crouched;flash.visible=saved.flash;vertical.reset(saved.feet);house.setPower('Recibidor',true);house.doors.forEach((d,i)=>{d.open=saved!.doors[i].open;d.hinge.rotation.y=saved!.doors[i].rotation;});lola.resetAlert(saved.dog.x,saved.dog.z,WATCH,WATCH_AT);}
 keys.clear();patrol.reset();intruder.reset(entry.x,entry.z);front.open=false;front.hinge.rotation.y=front.closed;front.angle=front.closed-1.48;audio.atmosphere('alert');invasion.start();
}
const invasion=new InvasionStory({
 clock:setClock,key:()=>audio.keys(),cut:()=>{house.setPower('Recibidor',false);audio.breaker();},
 enter:()=>{front.open=true;intruder.root.visible=true;intruder.light.visible=true;intruder.pose(1,0,Math.PI,Math.PI,1.12,false);},calm:()=>lola.hide(),thought,bark:()=>audio.bark(),
 caught:()=>beginChase(),
 rescue:()=>{resetEncounter();patrol.startExit(roomAt(house,intruder.root.position),intruder.root.position);audio.tension(0);phone.receiveArrival();audio.keys();front.open=true;clearRescueSounds();for(let i=0;i<4;i++)rescueSounds.push(window.setTimeout(()=>audio.intruderStep(3-i*.47,.23,true),680+i*260));},
 ending:()=>{intruder.root.visible=false;intruder.extinguish();finalScreen.ending(()=>resetGame('21:30'));stopForScreen();audio.epilogue();},
});
const rescueSounds:number[]=[];
function clearRescueSounds(){while(rescueSounds.length)clearTimeout(rescueSounds.pop());}
const switches=house.targets.filter(t=>t.kind==='switch');
function snapshot(){return{p:camera.position.clone(),q:camera.quaternion.clone(),feet:vertical.feet,crouched,flash:flash.visible,doors:house.doors.map(d=>({open:d.open,angle:d.hinge.rotation.y})),dog:lola.root.position.clone(),dogYaw:lola.root.rotation.y,phone:phone.checkpoint(),switches:switches.map(t=>t.label()),intruder:intruder.root.position.clone()};}
const baseline=snapshot();const frontDefaultAngle=front.angle;let startTimer=0,captureTimer=0;
let chapter:'21:30'|'21:42'|'21:50'|'21:56'='21:30';const checkpoints=new Map<string,ReturnType<typeof snapshot>>();let restoring=false;
function resetGame(time:StartChapter,play=true){
 resetEncounter();
 clearTimeout(startTimer);clearTimeout(captureTimer);clearTimeout(subtitleTimer);clearRescueSounds();captureVersion++;
 starting=false;paused=false;dragMode=false;phoneReleasePending=phoneRelockPending=false;quietLookUntil=0;settings.close();chapters.close(false);pauseMenu.hidden=true;finalScreen.close();
 document.body.classList.remove('starting','paused','settings-open','phone-open','story-open');
 target=undefined;lastInspection=undefined;subtitle.hidden=true;subtitle.textContent='';tape.reset();
 camera.position.copy(spawn);camera.quaternion.copy(spawnRotation);vertical.reset();crouched=false;flash.visible=baseline.flash;
 phase=bob=lastStep=stepClock=chewClock=0;yasmin.resetPose(camera);
 house.setPower('Recibidor',true);switches.forEach((t,i)=>{if(t.label()!==baseline.switches[i])t.use();});syncAccent();
 house.doors.forEach((d,i)=>{d.open=baseline.doors[i].open;d.hinge.rotation.y=baseline.doors[i].angle;});front.angle=frontDefaultAngle;
 props.resetProps(time!=='21:30');props.clearPrint();lola.resetFollow(baseline.dog,baseline.dogYaw);
 invasion.reset();patrol.reset();intruder.reset(entry.x,entry.z);saved=undefined;checkpoints.clear();restoring=false;
 phone.resetForChapter(time);audio.growl(Infinity);audio.proximity(Infinity);audio.atmosphere('calm');audio.start();audio.menu(!play);
 hasStarted=play;yasmin.root.visible=play;state(play);reticle(cross,'dot');
 if(!play){if(document.pointerLockElement===renderer.domElement){ignoreUnlock=true;document.exitPointerLock();}chapter='21:30';$('tape-clock').textContent=chapter;button.focus();return;}
 if(time==='21:50'){
  const p=camera.position;p.set(.03*k,1.64,-.19*k);camera.lookAt(0,1.58,-2.15*k);yasmin.resetPose(camera);
  lola.resetAlert(WATCH.x,WATCH.z,WATCH,WATCH_AT);story.restoreAfterPhoto();
  saved={p:p.clone(),q:camera.quaternion.clone(),dog:lola.root.position.clone(),doors:baseline.doors.map(d=>({open:d.open,rotation:d.angle})),feet:0,flash:false,crouched:false};
  startInvasion();
 }else if(time==='21:56'){
  camera.position.set(1.84*k,1.64,-1.18*k);camera.lookAt(0,1.55,-1.16*k);yasmin.resetPose(camera);
  lola.root.position.set(2.20*k,0,-1.35*k);lola.hide();story.restoreAfterPhoto();
  house.setPower('Recibidor',false);front.angle=front.closed-1.48;
  intruder.reset(.04*k,-1.16*k);intruder.root.visible=true;intruder.light.visible=true;
  intruder.pose(1,0,0,0,1.12,false);invasion.restartEnding();
 }else story.restartAct(time);
 capture();
}
function beginFromMenu(time:StartChapter){
 if(hasStarted||starting)return;starting=true;audio.start();audio.uiTape();document.body.classList.add('starting');
 startTimer=window.setTimeout(()=>resetGame(time),450);
}
function recordAct(time:string){if(time!=='21:30'&&time!=='21:42'&&time!=='21:50'&&time!=='21:56')return;chapter=time;if(!restoring)checkpoints.set(time,snapshot());}
function restartAct(){
 resetEncounter();
 const cp=checkpoints.get(chapter);if(!cp)return;lastInspection=undefined;
 if(phone.visible){phone.toggle();document.body.classList.remove('phone-open');}clearRescueSounds();props.close();clearTimeout(subtitleTimer);subtitle.hidden=true;tape.clearHeart();restoring=true;
 camera.position.copy(cp.p);camera.quaternion.copy(cp.q);vertical.reset(cp.feet);crouched=cp.crouched;flash.visible=cp.flash;keys.clear();target=undefined;bob=0;chewClock=0;
 house.setPower('Recibidor',true);switches.forEach((s,i)=>{if(s.label()!==cp.switches[i])s.use();});syncAccent();house.doors.forEach((d,i)=>{d.open=cp.doors[i].open;d.hinge.rotation.y=cp.doors[i].angle;});
 if(chapter==='21:50'){startInvasion();}
 else if(chapter==='21:56'){
  house.setPower('Recibidor',false);phone.rewindArrival();lola.hide();lola.root.position.copy(cp.dog);lola.root.rotation.y=cp.dogYaw;
  intruder.reset(cp.intruder.x,cp.intruder.z);intruder.root.visible=true;intruder.light.visible=true;invasion.restartEnding();
 }else{
  props.resetProps(chapter==='21:42');phone.restoreRoutine(cp.phone);lola.resetFollow(cp.dog,cp.dogYaw);story.restartAct(chapter);if(paused)phone.pauseDelivery();
 }
 restoring=false;setPaused(false);
}
phone.onWarningSent=()=>{
 if(invasion.phase!=='OFF')return;
 saved={p:camera.position.clone(),q:camera.quaternion.clone(),dog:lola.root.position.clone(),doors:house.doors.map(d=>({open:d.open,rotation:d.hinge.rotation.y})),feet:vertical.feet,flash:flash.visible,crouched};
 if(phone.visible)togglePhone();startInvasion();
};
function clearSight(point:T.Vector3){
 vector.subVectors(point,intruder.light.position);const distance=vector.length();if(distance>=6||distance<.015)return false;
 beam.subVectors(intruder.beam.position,intruder.light.position).normalize();vector.divideScalar(distance);
 if(vector.dot(beam)<=Math.cos(Math.PI/6))return false;
 scan.set(intruder.light.position,vector);scan.far=distance-.06;
 return !scan.intersectObjects(scene.children,true).some(h=>h.distance>.04&&h.object instanceof T.Mesh&&visibleObject(h.object)&&!h.object.userData.nonOccluding&&!ancestry(h.object,intruder.root)&&!ancestry(h.object,lola.root)&&!ancestry(h.object,yasmin.root)&&(h.object.userData.doorLeaf||!(h.object.material instanceof T.Material&&h.object.material.transparent&&h.object.material.opacity<.6)));
}
// The scripted patrol can resume from exactly where a failed pursuit began.
let chase:'off'|'run'|'return'|'lunge'='off',chaseTime=0,unseen=0,chaseStep=0,lastThreat=-1;
const trail:T.Vector3[]=[],chaseView=new T.Vector3(),attackStart=new T.Vector3(),attackRotation=new T.Quaternion(),attackAim=new T.PerspectiveCamera();
const attackLight=new T.PointLight(0xff2c24,0,2.1,1.65);scene.add(attackLight);
function threat(n:number){if(n!==lastThreat){lastThreat=n;audio.tension(n);}}
function resetEncounter(){chase='off';chaseTime=unseen=chaseStep=0;trail.length=0;attackLight.intensity=0;document.body.classList.remove('intruder-lunge');threat(0);}
function beginChase(){chase='run';chaseTime=unseen=chaseStep=0;trail.length=0;trail.push(intruder.root.position.clone());threat(1);}
function openKidsPassage(){const d=house.kidsDoor;d.open=true;return !house.doorHit(d,.92*k,-1.16*k,.24);}
function safelyHidden(p:T.Vector3){return crouched&&underLoft(p.x,p.z);}
function encounter(dt:number,p:T.Vector3){
 chaseTime+=dt;const d=intruder.root.position;
 if(chase==='lunge'){
  const u=Math.min(1,chaseTime/.35),ease=u*u;intruder.lunge(u);
  intruder.face(chaseView);camera.position.copy(attackStart).lerp(chaseView,ease*.72);
  attackAim.position.copy(camera.position);attackAim.lookAt(chaseView);camera.quaternion.copy(attackRotation).slerp(attackAim.quaternion,Math.min(1,u*5));
  attackLight.position.copy(chaseView).lerp(camera.position,.52);attackLight.intensity=Math.sin(Math.PI*Math.min(.97,u+.15))*12;
  if(u>=1){resetEncounter();finalScreen.caught(()=>{finalScreen.close();startInvasion();state(true);capture();});stopForScreen();}
  return;
 }
 if(chase==='return'){
  const goal=trail.at(-1);if(!goal){chase='off';invasion.resumeSearch();return;}
  const dx=goal.x-d.x,dz=goal.z-d.z,len=Math.hypot(dx,dz);if(house.doorHit(house.kidsDoor,goal.x,goal.z,.15)&&!openKidsPassage())return;if(len<.035){d.x=goal.x;d.z=goal.z;trail.pop();return;}
  const step=Math.min(dt*1.35,len);d.x+=step*dx/len;d.z+=step*dz/len;const yaw=Math.atan2(dx,dz);intruder.pose(dt,step,yaw,yaw,1.12,false);return;
 }
 const hidden=safelyHidden(p),dx=p.x-d.x,dz=p.z-d.z,len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);
 // The flashlight cone is for detection, not for grabbing an already spotted player.
 if(hidden){chase='return';return;}
 if(len<.72&&chaseTime>.16){
  const samples=Math.max(2,Math.ceil(len/.035));let reachable=true;
  for(let i=1;i<=samples;i++){const t=i/samples;if(house.blocked(d.x+dx*t,d.z+dz*t,.025)){reachable=false;break;}}
  if(reachable){chase='lunge';chaseTime=0;attackStart.copy(camera.position);attackRotation.copy(camera.quaternion);intruder.root.rotation.y=yaw;intruder.extinguish();keys.clear();tape.clearHeart();document.body.classList.add('intruder-lunge');audio.caught();return;}
 }
 // Continue only while sight is recent; the close-range check above still respects walls and doors.
 const visible=clearSight(sample.set(p.x,p.y-.04,p.z))||clearSight(sample.set(p.x,vertical.feet+(crouched?.45:1.03),p.z));
 unseen=visible?0:unseen+dt;if(unseen>1.25){chase='return';return;}
 const step=Math.min(dt*4.5,Math.max(0,len-.52)),x=d.x+step*dx/Math.max(.001,len),z=d.z+step*dz/Math.max(.001,len);
 let moved=0;if(!house.blocked(x,z,.15)){moved=Math.hypot(x-d.x,z-d.z);d.x=x;d.z=z;if(moved>.001)trail.push(d.clone());}
 chaseStep+=moved;if(chaseStep>=.68){chaseStep=0;audio.intruderStep(len,(-dx*right.x-dz*right.z)/Math.max(.2,len),true);}
 intruder.pose(dt,moved,yaw,yaw,p.y*.84,true);
}
function playInvasion(dt:number,elapsed:number,p:T.Vector3){
 if(invasion.phase==='OFF')return;if(chase!=='lunge'&&invasion.shelter(Math.min(1,elapsed),safelyHidden(p)))return;if(chase!=='off'){encounter(dt,p);return;}invasion.tick(Math.min(.12,elapsed));
 const escaping=invasion.phase==='ESCAPE';if(invasion.phase!=='SEARCH'&&!escaping){if(invasion.phase==='ENTRY')threat(.34);return;}
 if(!escaping){const room=roomAt(house,intruder.root.position);threat(room==='Dormitorio de los niños'?.96:room==='Recibidor'?.69:.53);}
 const pose=patrol.tick(dt,intruder.root.position,escaping,openKidsPassage);if(pose.door&&pose.door!=='kids'){const door=house.doors.find(d=>d.hinge.position.z>2.6&&d.hinge.position.z<2.7&&Math.sign(d.hinge.position.x)===(pose.door==='kitchen'?1:-1));if(door)door.open=true;}intruder.pose(dt,pose.travel,pose.facing,pose.aim,pose.aimY,escaping);
 const d=intruder.root.position,dx=d.x-p.x,dz=d.z-p.z,distance=Math.hypot(dx,dz);
 if(pose.step)audio.intruderStep(distance,(dx*right.x+dz*right.z)/Math.max(.2,distance),escaping);
 if(escaping){if(pose.done||d.z>5.22*k){intruder.root.visible=false;intruder.extinguish();}return;}
 const hidden=safelyHidden(p);
 const visible=!hidden&&(clearSight(sample.set(p.x,p.y-.04,p.z))||clearSight(sample.set(p.x,vertical.feet+(crouched?.45:1.03),p.z)));
 invasion.inspect({visible,central:pose.central,hidden});

}
function state(on:boolean){active=on;document.body.classList.toggle('active',on);cross.hidden=!on||paused;keys.clear();}
function setPaused(on:boolean){
 if(paused===on||!hasStarted||finalScreen.open)return;
 paused=on;pauseMenu.hidden=!on;document.body.classList.toggle('paused',on);cross.hidden=on;keys.clear();target=undefined;
 if(on){captureVersion++;if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();audio.menu(true);audio.uiTape();phone.pauseDelivery();tape.clearHeart();resumeButton.focus();}
 else{audio.start();audio.menu(false);phone.resumeDelivery();if(phone.visible){$('phone').querySelector<HTMLElement>('button')?.focus();}else capture();}
}
resumeButton.onclick=()=>setPaused(false);$('restart').onclick=restartAct;$('restart-game').onclick=()=>resetGame('21:30');$('quit').onclick=()=>resetGame('21:30',false);
function fallback(v:number){if(v!==captureVersion||paused||document.pointerLockElement===renderer.domElement||phone.visible||finalScreen.open)return;dragMode=true;if(phoneRelockPending){phoneRelockPending=false;quietLookUntil=performance.now()+lookDebounce;}}
function capture(){
 clearTimeout(captureTimer);const version=++captureVersion;
 if(document.pointerLockElement===renderer.domElement){dragMode=false;return;}
 try{const p=renderer.domElement.requestPointerLock();if(p)p.catch(()=>fallback(version));}catch{fallback(version);}
 captureTimer=window.setTimeout(()=>fallback(version),500);
}
controls.addEventListener('lock',()=>{
 if(paused||phone.visible||finalScreen.open){ignoreUnlock=true;if(phone.visible)phoneReleasePending=true;document.exitPointerLock();return;}
 if(phoneRelockPending){camera.quaternion.copy(phoneLook);phoneRelockPending=false;quietLookUntil=performance.now()+lookDebounce;}
 dragMode=false;keys.clear();
});
controls.addEventListener('unlock',()=>{
 if(phoneReleasePending){phoneReleasePending=false;ignoreUnlock=false;if(phoneRelockPending&&!phone.visible&&!paused)capture();return;}
 if(ignoreUnlock){ignoreUnlock=false;return;}if(active&&!paused&&!phone.visible&&!dragMode&&!finalScreen.open)setPaused(true);
});
button.onclick=()=>{if(hasStarted||starting||intro.active)return;audio.start();audio.menu(false);audio.introStart();starting=true;intro.start();};
// An automatic ending may have lost browser activation; one click can reclaim it.
renderer.domElement.addEventListener('click',()=>{if(active&&dragMode&&!paused&&!phone.visible&&!finalScreen.open)capture();});
function togglePhone(){
 const opening=!phone.visible;if(opening)phoneLook.copy(camera.quaternion);
 phone.toggle();audio.phoneMove(opening);document.body.classList.toggle('phone-open',opening);captureVersion++;keys.clear();
 if(opening){
  phoneRelockPending=false;quietLookUntil=Infinity;
  if(document.pointerLockElement===renderer.domElement){phoneReleasePending=true;document.exitPointerLock();}
  return;
 }
 camera.quaternion.copy(phoneLook);
 if(dragMode){quietLookUntil=performance.now()+lookDebounce;return;}
 phoneRelockPending=true;
 if(!phoneReleasePending){if(document.pointerLockElement===renderer.domElement){phoneRelockPending=false;quietLookUntil=performance.now()+lookDebounce;}else capture();}
}
const look=new T.Euler(0,0,0,'YXZ');
function moveLook(e:MouseEvent,scale:number){look.setFromQuaternion(camera.quaternion);look.y-=e.movementX*scale*options.mouse;look.x=T.MathUtils.clamp(look.x-e.movementY*scale*options.mouse*(options.invert?-1:1),-1.55,1.55);camera.quaternion.setFromEuler(look);}
renderer.domElement.addEventListener('pointermove',e=>{if(dragMode&&active&&!paused&&chase!=='lunge'&&!phone.visible&&performance.now()>=quietLookUntil&&(e.buttons&1))moveLook(e,.002/.75);});
// Capture phase: discard unlock/relock deltas before PointerLockControls sees them.
document.addEventListener('mousemove',e=>{
 if(document.pointerLockElement!==renderer.domElement)return;
 if(chase==='lunge'||phone.visible||phoneRelockPending||performance.now()<quietLookUntil){e.stopImmediatePropagation();return;}
 if(options.invert&&active&&!paused){e.stopImmediatePropagation();moveLook(e,.002);}
},true);
function trapFocus(root:HTMLElement,e:KeyboardEvent){const list=[...root.querySelectorAll<HTMLElement>('button:not([tabindex="-1"]),input:not([type=radio]),input[type=radio]:checked')];const i=list.indexOf(document.activeElement as HTMLElement);if(!list.length)return;e.preventDefault();list[i<0?(e.shiftKey?list.length-1:0):(i+(e.shiftKey?-1:1)+list.length)%list.length].focus();}
window.addEventListener('keydown',e=>{
 if(intro.active){if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)intro.advance();}return;}
 if(finalScreen.open||starting||chase==='lunge')return;
 if(chapters.open){if(e.code==='Escape'){e.preventDefault();if(!e.repeat)chapters.close();}else if(e.code==='Tab')trapFocus($('chapters-menu'),e);return;}
 if(settings.open){if(e.code==='Escape'){e.preventDefault();if(!e.repeat)closeSettings();}else if(e.code==='Tab')trapFocus($('settings-menu'),e);return;}
 if(active&&!paused&&phone.visible&&(e.code==='Escape'||e.code==='Tab')){e.preventDefault();if(!e.repeat)togglePhone();return;}
 const editing=e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLInputElement&&!paused;
 if(active&&(e.code==='Escape'||e.code==='KeyP'&&!editing)){e.preventDefault();if(!e.repeat)setPaused(!paused);return;}
 if(paused){if(e.code==='Tab')trapFocus(pauseMenu,e);return;}
 if(active&&props.open){if(e.code==='KeyE'||e.code==='Escape'){e.preventDefault();if(!e.repeat)props.close();return;}if(e.code==='Tab'){e.preventDefault();if(!e.repeat)props.close();}else if(!['ShiftLeft','ShiftRight'].includes(e.code))return;}
 if(active&&e.code==='Tab'){e.preventDefault();if(!e.repeat)togglePhone();return;}
 if(e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLInputElement)return;
 if(active&&e.code==='Space'){e.preventDefault();if(!e.repeat&&!crouched&&!phone.visible&&!props.open&&!underLoft(camera.position.x,camera.position.z,.18)&&vertical.grounded){vertical.jump();audio.jump();}return;}
 if(active&&!phone.visible&&!props.open&&!e.repeat&&(e.code==='KeyC'||e.code==='ControlLeft')){e.preventDefault();if(vertical.grounded&&(!crouched||!house.blocked(camera.position.x,camera.position.z,.18,1.72,vertical.feet))){crouched=!crouched;audio.cloth(.9);}return;}
 if(active&&!phone.visible&&!e.repeat&&e.code==='KeyQ'){e.preventDefault();if(target===touchDog||Math.hypot(camera.position.x-lola.root.position.x,camera.position.z-lola.root.position.z)<=2.2)invasion.quiet();return;}
 if(!active||!['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','ShiftLeft','ShiftRight'].includes(e.code))return;
 e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyF'&&!phone.visible){flash.visible=!flash.visible;audio.flashlight(flash.visible);}if(e.code==='KeyE'&&!phone.visible)target?.use();
});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();window.addEventListener('resize',resize);
const ray=new T.Raycaster();ray.far=2.2;const center=new T.Vector2(),forward=new T.Vector3(),right=new T.Vector3(),vel=new T.Vector3();const targetMap=new Map<T.Object3D,Target>(house.targets.map(t=>[t.mesh,t]));
const nextLolaLine=createLolaLinePicker();
const touchDog:Choice={mark:'paw',label:'Acariciar a Lola',use:()=>{if(lola.state==='ALERT_STARE'){thought(ALERT_PET);return;}if(lola.state==='HIDE')return;if(lola.state==='EAT'){thought('La dejo cenar tranquila.');return;}yasmin.petLola();lola.pet();audio.pet();thought(nextLolaLine());}};
function ancestry(o:T.Object3D,root:T.Object3D){for(let n:T.Object3D|null=o;n;n=n.parent)if(n===root)return true;return false;}
function visibleObject(o:T.Object3D){for(let n:T.Object3D|null=o;n;n=n.parent)if(!n.visible)return false;return true;}
let lastInspection:InspectId|undefined;
function lookTarget():Choice|undefined{
 ray.setFromCamera(center,camera);const hit=ray.intersectObjects(scene.children,true).find(h=>h.object instanceof T.Mesh&&h.distance>.06&&visibleObject(h.object)&&!h.object.userData.nonOccluding&&!ancestry(h.object,yasmin.root));
 if(!hit)return;if(ancestry(hit.object,lola.root))return touchDog;
 let ambientId:InspectId|undefined,legacy:{label:string;text:string}|undefined;
 for(let o:T.Object3D|null=hit.object;o;o=o.parent){const action=o.userData.storyAction as StoryAction|undefined;if(action)return {mark:action==='peephole'||action==='printer'&&story.phase!=='PHOTO_READY'?'eye':'hand',label:story.label(action),use:()=>story.use(action)};const t=targetMap.get(o);if(t)return {mark:'hand',label:t.label(),use:()=>{t.use();if(t.kind==='door')audio.door(t.label().startsWith('Cerrar'));else audio.click();syncAccent();}};
  if(!legacy&&typeof o.userData.inspect==='string')legacy={text:o.userData.inspect,label:String(o.userData.inspectLabel??'Inspeccionar')};
  ambientId??=o.userData.inspectId as InspectId|undefined;
 }
 if(legacy){const {label,text}=legacy;return {mark:'eye',label,use:()=>thought(text)};}
 if(ambientId){const id=ambientId;const act=chapter==='21:30'?1:chapter==='21:42'?2:chapter==='21:50'?3:4;const entry=inspection(id,{act,seenPhoto:story.phase==='ALERT'});if(entry)return {mark:'eye',label:entry.label,use:()=>{if(lastInspection!==id)audio.inspect();lastInspection=id;thought(entry.text);}};}

}
let previous=performance.now(),phase=0,bob=0,lastStep=0,stepClock=0,chewClock=0;
function frame(now:number){
 requestAnimationFrame(frame);const elapsed=Math.max(.00001,(now-previous)/1000),dt=Math.min(.065,elapsed);previous=now;const p=camera.position;
 if(!paused)tape.tick(Math.min(1,elapsed));
 if(paused)return;
 if(active&&!finalScreen.open&&chase==='lunge')encounter(Math.min(.35,elapsed),p);
 else if(active&&!finalScreen.open){
  camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.set(-forward.z,0,forward.x);
  const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight');const running=!crouched&&sprint;const stealthSprint=crouched&&sprint&&(invasion.phase==='ENTRY'||invasion.phase==='SEARCH');
  vel.set(0,0,0).addScaledVector(forward,Number(keys.has('KeyW'))-Number(keys.has('KeyS'))).addScaledVector(right,Number(keys.has('KeyD'))-Number(keys.has('KeyA'))).normalize().multiplyScalar((crouched?(stealthSprint?1.85:.83):running?2.65:1.5)*dt);
  if(props.open||phone.visible&&invasion.phase!=='OFF')vel.set(0,0,0);
  const oldX=p.x,oldZ=p.z,r=crouched?.155:.18,height=crouched&&p.y-vertical.feet<1.04?.74:1.72,oldFeet=vertical.feet;
  const impact=vertical.update(dt,house,p.x,p.z,r,crouched?.94:1.80);
  if(!house.blocked(p.x+vel.x,p.z,r,height,vertical.feet))p.x+=vel.x;if(!house.blocked(p.x,p.z+vel.z,r,height,vertical.feet))p.z+=vel.z;
  const travel=Math.hypot(p.x-oldX,p.z-oldZ),moving=travel>.0002;
  if(moving&&vertical.grounded)phase+=travel*(running?6.0:6.7);bob=T.MathUtils.damp(bob,moving?(crouched?.009:running?.045:.027)*(options.bob==='low'?.33:1):0,10,dt);const eye=crouched?(underLoft(p.x,p.z,.13)?.73:.85):1.64;const relativeEye=p.y-oldFeet;p.y=Math.min(house.ceilingAt(p.x,p.z)-.14,vertical.feet+T.MathUtils.damp(relativeEye,eye,13,dt)+(vertical.grounded?Math.sin(phase)*bob*.22:0));
  const room=house.rooms.find(({b:[a,b,c,d]})=>p.x>=a&&p.x<=b&&p.z>=c&&p.z<=d);
  const hard=!!room&&['Cocina','Primer baño','Segundo baño'].includes(room.name);if(impact>.55)audio.land(impact,hard);const foot=Math.floor(phase/(Math.PI*2));if(foot>lastStep){audio.step(hard,running,crouched);lastStep=foot;}
  stepClock+=dt;if(stepClock>.13){audio.proximity(room?.name==='Cocina'?Math.hypot(p.x-1.65*HOUSE_PLAN_SCALE,p.z-4.1*HOUSE_PLAN_SCALE):Infinity);stepClock=0;}
  const eating=lola.state==='EAT';lola.update(dt,p,moving);yasmin.update(camera,travel/dt,phase*.5,dt,crouched,vertical.feet);
  if(eating&&lola.state!=='EAT')story.fed();
  const dogDelta=lola.root.position;const dogX=dogDelta.x-p.x,dogZ=dogDelta.z-p.z,dogDistance=Math.hypot(dogX,dogZ);
  if(lola.chewing){chewClock-=dt;if(chewClock<=0){audio.chew(dogDistance);chewClock=.34+Math.random()*.16;}}else chewClock=0;
  story.tick(Math.min(1,elapsed),room?.name==='Salón');story.observeLola(lola.staring,dogDistance,props.open||phone.visible);const tense=invasion.phase==='ENTRY'||invasion.phase==='SEARCH';audio.growl(lola.staring&&!invasion.calmed&&invasion.phase!=='ESCAPE'?dogDistance:Infinity,(dogX*right.x+dogZ*right.z)/Math.max(.2,dogDistance),tense);
  document.body.classList.toggle('story-open',props.open);
  house.update(dt,p.x,p.z);scene.updateMatrixWorld();playInvasion(dt,elapsed,p);
  const closeIntruder=invasion.phase==='SEARCH'&&crouched&&intruder.root.visible?intruder.root.position.distanceTo(sample.set(p.x,0,p.z)):Infinity;
  tape.heart(dt,closeIntruder,Number.isFinite(closeIntruder)?intruder.light.position.distanceTo(p):Infinity);
  target=phone.visible||props.open?undefined:lookTarget();reticle(cross,target?.mark??'dot');if(target)cross.setAttribute('aria-label',target.label);else cross.removeAttribute('aria-label');
 }else if(!finalScreen.open){audio.growl(Infinity);if(!hasStarted){const t=now*.00021;camera.position.set(.12*Math.sin(t),1.48+.035*Math.sin(t*.81),(3.72+.47*Math.cos(t))*k);camera.lookAt(.10*Math.sin(t*.71),1.35,-2.8*k);yasmin.root.visible=false;}else{yasmin.update(camera,0,phase,dt,crouched,vertical.feet);}house.update(dt,p.x,p.z);}
 vhs.uniforms.time.value=now/1000;if(!intro.active)composer.render();
}
reticle(cross,'dot');requestAnimationFrame(frame);
}
try{boot();}catch(err){console.error(err);$('status').textContent='NO SE PUDO INICIAR WEBGL. ACTIVA LA ACELERACIÓN GRÁFICA.';$<HTMLButtonElement>('start').disabled=true;}
