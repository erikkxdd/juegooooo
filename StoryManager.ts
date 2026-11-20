import type {Atmosphere} from '../audio/AudioEngine';
export type StoryPhase='ROUTINE'|'QUIET'|'BUZZED'|'PEEPHOLE'|'WAIT_PRINT'|'PRINTING'|'PHOTO_READY'|'ALERT';
export type StoryAction='bowl'|'latch'|'peephole'|'printer';
export const ERIK_FIRST='Oye Yasmín, hay cola y tardamos unos 25 min. Dale de cenar a Lola y echa el pestillo de la entrada por si acaso.';
export const ERIK_WARNING='Erik hay alguien mirando por el balcón, acaba de salir una foto mía por la impresora';
export const ALERT_PET='¿Qué pasa, Lola? ¿Qué miras ahí...?';
type Ports={
 thought:(line:string)=>void;clock:(time:string)=>void;initialMessage:()=>void;warningMessage:()=>void;
 atmosphere:(mood:Atmosphere)=>void;pour:()=>void;doorBrush:()=>void;stairCut:()=>void;paper:()=>void;
 dogEat:()=>void;dogAlert:()=>void;fillBowl:(filled:boolean)=>void;latch:()=>void;intercom:()=>void;
 peephole:(first:boolean)=>void;print:(progress:number)=>void;printerSound:()=>void;makePhoto:()=>void;readPhoto:()=>void;
};
export class StoryManager{
 phase:StoryPhase='ROUTINE';private started=false;private age=0;private food:'none'|'served'|'done'='none';private locked=false;private growlStarted=false;private noticedLola=false;
 constructor(private ports:Ports){}
 start(){if(this.started)return;this.started=true;this.ports.atmosphere('calm');this.ports.clock('21:30');this.ports.initialMessage();}
 restoreAfterPhoto(){this.started=true;this.food='done';this.locked=true;this.growlStarted=this.noticedLola=true;this.enter('ALERT');}
 restartAct(time:'21:30'|'21:42'){
  this.started=false;this.growlStarted=this.noticedLola=false;
  if(time==='21:30'){this.food='none';this.locked=false;this.enter('ROUTINE');this.start();return;}
  this.started=true;this.food='done';this.locked=true;this.enter('BUZZED');const p=this.ports;p.clock(time);p.intercom();p.atmosphere('uneasy');p.thought('¿Un toque a estas horas...? Si Erik y papá tienen llaves.');
 }
 private enter(phase:StoryPhase){this.phase=phase;this.age=0;}
 label(action:StoryAction){switch(action){case 'bowl':return this.food==='none'?'Servir pienso a Lola':'Mirar el cuenco';case 'latch':return this.locked?'Comprobar el pestillo':'Echar el pestillo';case 'peephole':return 'Mirar por la mirilla';case 'printer':return this.phase==='PHOTO_READY'?'Coger la hoja':'Inspeccionar impresora';}}
 use(action:StoryAction){
  const p=this.ports;
  if(action==='bowl'){if(this.food!=='none'){p.thought(this.food==='served'?'Ahí tienes, Lola.':'Ya ha cenado.');return;}this.food='served';p.fillBowl(true);p.pour();p.dogEat();p.thought('A cenar, Lola.');return;}
  if(action==='latch'){if(this.locked){p.thought('El pestillo está echado.');return;}this.locked=true;p.latch();p.thought('Listo, pestillo echado.');this.checkRoutine();return;}
  if(action==='peephole'){
   if(this.phase==='PEEPHOLE')return;
   if(this.phase==='BUZZED'){this.enter('PEEPHOLE');p.doorBrush();p.peephole(true);}
   else if(this.phase==='WAIT_PRINT'||this.phase==='PRINTING'||this.phase==='PHOTO_READY'||this.phase==='ALERT'){p.doorBrush();p.peephole(false);}
   else p.thought('No se ve a nadie en el rellano.');return;
  }
  if(this.phase==='PHOTO_READY'){this.enter('ALERT');p.paper();p.atmosphere('photo');p.readPhoto();p.dogAlert();p.warningMessage();p.thought('¿Qué es esto...? Esta foto está hecha desde el balcón de la cocina...');}
  else if(this.phase==='PRINTING')p.thought('La impresora está sacando una hoja...');
  else p.thought(this.phase==='ALERT'?'La hoja salió de esta impresora.':'La impresora está apagada.');
 }
 fed(){if(this.food!=='served')return;this.food='done';this.ports.fillBowl(false);this.checkRoutine();}
 private checkRoutine(){if(this.phase==='ROUTINE'&&this.locked&&this.food==='done')this.enter('QUIET');}
 observeLola(staring:boolean,distance:number,examiningPhoto:boolean){
  if(this.phase!=='ALERT'||!staring)return;
  if(!this.growlStarted){this.growlStarted=true;this.ports.atmosphere('alert');}
  if(!this.noticedLola&&!examiningPhoto&&distance<=2.2){this.noticedLola=true;this.ports.thought('Lola nunca gruñe así... ¿qué estás mirando?');}
 }
 tick(dt:number,inLiving:boolean){
  if(!this.started)return;this.age+=dt;const p=this.ports;
  if(this.phase==='QUIET'&&this.age>=10){this.enter('BUZZED');p.clock('21:42');p.intercom();p.atmosphere('uneasy');p.thought('¿Un toque a estas horas...? Si Erik y papá tienen llaves.');}
  else if(this.phase==='PEEPHOLE'&&this.age>=1.5){this.enter('WAIT_PRINT');p.stairCut();p.thought('¿Qué...? Juraría que había alguien ahí fuera...');}
  else if(this.phase==='WAIT_PRINT'&&(this.age>=5.2||(inLiving&&this.age>=1))){this.enter('PRINTING');p.makePhoto();p.print(0);p.printerSound();p.thought('¿Y ese ruido? La impresora se ha encendido sola...');}
  else if(this.phase==='PRINTING'){p.print(Math.min(1,this.age/3.15));if(this.age>=3.15)this.enter('PHOTO_READY');}
 }
}

export type InvasionPhase='OFF'|'ENTRY'|'SEARCH'|'ESCAPE'|'CAUGHT'|'EPILOGUE';
export class InvasionStory{
 phase:InvasionPhase='OFF';private age=0;calmed=false;dark=false;private opened=false;private barked=false;private hiddenSeconds=0;
 constructor(private io:{clock:(time:string)=>void;key:()=>void;cut:()=>void;enter:()=>void;calm:()=>void;thought:(line:string)=>void;bark:()=>void;caught:()=>void;rescue:()=>void;ending:()=>void}){}
 reset(){this.phase='OFF';this.age=0;this.calmed=this.dark=this.opened=this.barked=false;this.hiddenSeconds=0;}
 start(){this.reset();this.phase='ENTRY';this.io.clock('21:50');this.io.key();this.io.thought('Esa es la cerradura… Lola, ven. Tengo que escondernos bajo la litera.');}
 restartEnding(){this.phase='ESCAPE';this.age=0;this.io.clock('21:56');this.io.rescue();}
 quiet(){if(this.calmed||!(this.phase==='ENTRY'||this.phase==='SEARCH'))return;this.calmed=true;this.io.calm();this.io.thought('Shhh, Lola, ven conmigo en silencio...');}
 tick(dt:number){this.age+=dt;if(this.phase==='ENTRY'){
  if(!this.dark&&this.age>=1){this.dark=true;this.io.cut();}
  if(!this.opened&&this.age>=1.65){this.opened=true;this.age=0;this.io.enter();}
  else if(this.opened&&this.age>=4){this.phase='SEARCH';this.age=0;}
 }else if(this.phase==='ESCAPE'&&this.age>=3){this.phase='EPILOGUE';this.io.ending();}}
 resumeSearch(){if(this.phase==='CAUGHT')this.phase='SEARCH';}
 shelter(dt:number,hidden:boolean){
  if(this.phase!=='ENTRY'&&this.phase!=='SEARCH'&&this.phase!=='CAUGHT')return false;
  this.hiddenSeconds=hidden?this.hiddenSeconds+dt:0;
  if(this.hiddenSeconds+1e-8<20)return false;
  this.restartEnding();return true;
 }
 inspect({visible,central,hidden}:{visible:boolean;central:boolean;hidden:boolean}){
  if(this.phase!=='SEARCH')return;
  if(central&&!this.calmed&&!this.barked){this.barked=true;this.io.bark();}
  if(visible&&!hidden){this.phase='CAUGHT';this.io.caught();}
 }
}
