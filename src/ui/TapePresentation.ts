import type {AudioEngine} from '../audio/AudioEngine';
const chapters:Record<string,string>={'21:30':'EN CASA','21:42':'ALGO NO CUADRA','21:50':'COPIA DE LLAVE','21:56':'DE VUELTA'};
export class TapePresentation{
 private caption=document.getElementById('chapter-caption')!;private vignette=document.getElementById('heartbeat-vignette')!;
 private seconds=0;private since=0;private phase=0;private opacity=0;
 constructor(private audio:AudioEngine){}
 reset(){this.seconds=0;this.caption.hidden=true;this.caption.textContent='';this.clearHeart();}
 chapter(time:string){const title=chapters[time];if(!title)return;this.caption.textContent=`${time} — ${title}`;this.seconds=3.5;this.caption.hidden=false;this.audio.tapeCue();}
 tick(dt:number){if(this.seconds>0){this.seconds-=dt;this.caption.hidden=this.seconds<=0;}}
 heart(dt:number,distance:number,lightDistance=distance){
  const strength=Math.max(0,1-distance/4.5);const hurry=Math.max(0,1-lightDistance/4.5);
  if(strength>0){const hz=(63+84*hurry)/60;this.phase+=dt*hz;this.since+=dt;
   if(this.phase>=1){this.phase%=1;this.since=0;this.audio.heartbeat(.20+.80*strength,Math.min(.16,.26/hz));}
  }else{this.phase=0;this.since=1;}
  const pulse=(t:number)=>t<0?0:Math.exp(-t*10)*Math.min(1,t*50);
  const target=strength*(.12*pulse(this.since)+.082*pulse(this.since-Math.min(.16,.26/((63+84*hurry)/60))));
  const old=this.opacity;this.opacity+=(target-this.opacity)*(1-Math.exp(-dt*17));if(this.opacity<.0005&&target===0)this.opacity=0;
  if(this.opacity!==old)this.vignette.style.opacity=this.opacity.toFixed(4);
 }
 clearHeart(){this.phase=0;this.since=1;this.opacity=0;this.vignette.style.opacity='0';}
}
