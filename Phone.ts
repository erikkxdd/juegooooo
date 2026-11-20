import type {StartChapter} from './Chapters';
import type {AudioEngine} from '../audio/AudioEngine';
import {ERIK_FIRST,ERIK_WARNING} from '../story/StoryManager';
const avatar=`${import.meta.env.BASE_URL}personajes/yasmin-perfil.jpg`;
const escapeText=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
type Contact='Erik'|'Papá';
const replies=['Sí, estoy con Lola.','Vale, avisadme cuando volváis.'];
export class Phone{
 visible=false;onWarningSent?:()=>void;private arrival=false;private current:'home'|'list'|Contact='home';private unread=false;private delivered=false;private sent:{text:string;time:string}[]=[];private timer=0;private due=0;private pending=0;private time='21:30';private canWarn=false;private warningSent=false;private routineReplied=false;private warningDraft=ERIK_WARNING;
 private phone=document.getElementById('phone')!;
 constructor(private audio:AudioEngine){this.phone.innerHTML=`<div class="phone-notch"></div><div class="phone-status"><b>21:30</b><span>▮▮▮ · 84%</span></div><div class="phone-page"></div><button class="phone-home" type="button" data-phone="home" aria-label="Ir a la pantalla de inicio"></button>`;this.phone.addEventListener('input',e=>{if(e.target instanceof HTMLTextAreaElement)this.warningDraft=e.target.value;});this.phone.addEventListener('click',e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button[data-phone]');if(!button)return;const a=button.dataset.phone;if(a==='home'||a==='list'||a==='Erik'||a==='Papá'){this.current=a;if(a==='Erik')this.unread=false;}else if(a?.startsWith('reply:')&&!this.routineReplied){const r=replies[Number(a.split(':')[1])];if(r){this.routineReplied=true;this.send(r);}}else if(a==='send-warning'&&this.canWarn&&!this.warningSent){const input=this.phone.querySelector<HTMLTextAreaElement>('.wa-compose textarea');const text=input?.value.trim();if(text){this.warningSent=true;this.unread=false;this.send(text);this.onWarningSent?.();}}this.render();});this.render();}
 private send(text:string){this.sent.push({text,time:this.time});this.audio.sendMessage();}
 setTime(time:string){this.time=time;this.phone.querySelector('.phone-status b')!.textContent=time;this.render();}
 private notify(){this.audio.notify();try{navigator.vibrate?.([80,50,110]);}catch{/* no disponible */}this.phone.classList.remove('buzz');void this.phone.offsetWidth;this.phone.classList.add('buzz');}
 start(){if(this.delivered||this.timer||this.pending)return;this.scheduleInitial(1300);}
 private scheduleInitial(ms:number){this.due=performance.now()+ms;this.timer=window.setTimeout(()=>{this.timer=0;this.delivered=true;this.unread=this.current!=='Erik'||!this.visible;this.notify();this.render();},ms);}
 pauseDelivery(){if(this.timer){clearTimeout(this.timer);this.timer=0;this.pending=Math.max(1,this.due-performance.now());}}
 resumeDelivery(){if(this.pending){const ms=this.pending;this.pending=0;this.scheduleInitial(ms);}}

 enableWarning(){if(this.canWarn)return;this.canWarn=true;this.unread=this.current!=='Erik'||!this.visible;this.notify();this.render();}

 checkpoint(){return {delivered:this.delivered,unread:this.unread,sent:this.sent.map(x=>({...x})),routineReplied:this.routineReplied};}
 restoreRoutine(snapshot:ReturnType<Phone['checkpoint']>){clearTimeout(this.timer);this.timer=this.pending=0;this.delivered=snapshot.delivered;this.unread=snapshot.unread;this.sent=snapshot.sent.map(x=>({...x}));this.routineReplied=snapshot.routineReplied;this.canWarn=this.warningSent=this.arrival=false;this.warningDraft=ERIK_WARNING;this.current='home';this.render();}
 resetForChapter(time:StartChapter){
  this.visible=false;this.phone.hidden=true;this.phone.classList.remove('buzz');
  try{navigator.vibrate?.(0);}catch{}
  this.restoreRoutine({delivered:time!=='21:30',unread:time==='21:42',sent:time==='21:50'||time==='21:56'?[{text:ERIK_WARNING,time:'21:42'}]:[],routineReplied:false});
  if(time==='21:50'||time==='21:56')this.canWarn=this.warningSent=true;this.setTime(time);
 }
 rewindArrival(){this.arrival=false;this.render();}
 receiveArrival(){if(this.arrival)return;this.arrival=true;this.unread=true;this.notify();this.render();}
 toggle(){this.visible=!this.visible;this.phone.hidden=!this.visible;if(this.visible){this.audio.unlock();if(this.current==='Erik')this.unread=false;this.render();}return this.visible;}
 private render(){const page=this.phone.querySelector('.phone-page')!;
  if(this.current==='home'){page.innerHTML=`<div class="phone-lock"><img src="${avatar}" alt="Foto de Yasmín"><div class="lock-content"><small>VIERNES · 20 DE NOVIEMBRE</small><strong>${this.time}</strong><div class="lock-user">Yasmín</div><button type="button" data-phone="list" class="open-wa"><span class="wa-dot">⌕</span> WhatsApp ${this.unread?'<b>1</b>':''}</button>${this.unread?(this.canWarn?'<p>WhatsApp · Avisar a Erik</p>':'<p>Erik · 1 mensaje nuevo</p>'):''}</div></div>`;return;}
  if(this.current==='list'){page.innerHTML=`<div class="wa-title"><button data-phone="home" aria-label="Volver">‹</button><span>WhatsApp<small>CHATS</small></span><img src="${avatar}" alt="Perfil de Yasmín"></div><button class="chat-row" data-phone="Erik"><i>E</i><span><b>Erik</b><small>${this.arrival?'Estamos subiendo ya por el portal':this.canWarn&&!this.warningSent?'Aviso listo para enviar':this.delivered?'Oye Yasmín, hay cola…':'Sin mensajes nuevos'}</small></span>${this.unread?'<em>1</em>':''}</button><button class="chat-row" data-phone="Papá"><i>P</i><span><b>Papá</b><small>Sin mensajes nuevos</small></span></button>`;return;}
  const erik=this.current==='Erik';page.innerHTML=`<div class="wa-title"><button data-phone="list" aria-label="Volver a los chats">‹</button><i>${this.current[0]}</i><span>${this.current}<small>CHAT PERSONAL</small></span></div><div class="wa-thread"><span class="wa-day">HOY</span>${erik&&this.delivered?`<div class="bubble in">${ERIK_FIRST}<small>21:30</small></div>`:'<p class="chat-empty">Todavía no hay mensajes.</p>'}${erik?this.sent.map(r=>`<div class="bubble out">${escapeText(r.text)}<small>${r.time} ✓✓</small></div>`).join(''):''}${erik&&this.arrival?'<div class="bubble in">Estamos subiendo ya por el portal<small>21:56</small></div>':''}</div>${erik&&this.canWarn&&!this.warningSent?`<label class="wa-compose"><span>AVISAR A ERIK</span><textarea maxlength="240" aria-label="Mensaje para Erik">${escapeText(this.warningDraft)}</textarea><button data-phone="send-warning">Enviar</button></label>`:erik&&this.delivered&&!this.routineReplied&&!this.canWarn?`<div class="quick"><span>RESPUESTA RÁPIDA</span>${replies.map((r,i)=>`<button data-phone="reply:${i}">${r}</button>`).join('')}</div>`:'<div class="wa-bottom">WhatsApp · Turno de Noche</div>'}`;
  const thread=page.querySelector('.wa-thread');if(thread)thread.scrollTop=thread.scrollHeight;
 }
}
