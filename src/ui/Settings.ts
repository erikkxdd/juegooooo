export type Settings={mouse:number;invert:boolean;bob:'low'|'normal';volume:number;sfx:number;music:number;vhs:'high'|'medium'|'low';scan:boolean;exposure:number};
const defaults:Settings={mouse:.75,invert:false,bob:'normal',volume:100,sfx:100,music:100,vhs:'high',scan:true,exposure:1.25};
const key='turno-de-noche.settings.v1';
function load():Settings{try{const v=JSON.parse(localStorage.getItem(key)??'{}');const n=(k:keyof Settings,min:number,max:number)=>typeof v[k]==='number'&&Number.isFinite(v[k])?Math.max(min,Math.min(max,v[k])):defaults[k] as number;return {mouse:n('mouse',.2,2.5),invert:v.invert===true,bob:v.bob==='low'?'low':'normal',volume:n('volume',0,100),sfx:n('sfx',0,100),music:n('music',0,100),vhs:v.vhs==='low'||v.vhs==='medium'?v.vhs:'high',scan:v.scan!==false,exposure:n('exposure',.65,1.85)};}catch{return {...defaults};}}
export class SettingsMenu{
 readonly value=load();private panel=document.getElementById('settings-menu')!;private body=this.panel.querySelector<HTMLElement>('.settings-body')!;private tab=0;
 constructor(private changed:(value:Settings)=>void,private track:()=>void,private back:()=>void){
  this.panel.querySelectorAll<HTMLButtonElement>('[role=tab]').forEach((button,i)=>{button.onclick=()=>{if(i!==this.tab)this.select(i,true);};button.addEventListener('keydown',e=>{const next=e.key==='ArrowRight'?(i+1)%3:e.key==='ArrowLeft'?(i+2)%3:e.key==='Home'?0:e.key==='End'?2:-1;if(next<0)return;e.preventDefault();this.select(next,true);this.panel.querySelectorAll<HTMLButtonElement>('[role=tab]')[next].focus();});});
  this.panel.querySelector<HTMLButtonElement>('.settings-back')!.onclick=()=>this.back();this.changed(this.value);
 }
 get open(){return !this.panel.hidden;}
 show(){this.panel.hidden=false;this.select(0,true);this.panel.querySelector<HTMLButtonElement>('[role=tab]')!.focus();}
 close(){this.panel.hidden=true;}
 private commit(){try{localStorage.setItem(key,JSON.stringify(this.value));}catch{}this.changed(this.value);}
 private select(i:number,animate:boolean){this.tab=i;this.panel.querySelectorAll<HTMLButtonElement>('[role=tab]').forEach((el,index)=>{el.setAttribute('aria-selected',String(index===i));el.tabIndex=index===i?0:-1;});this.body.setAttribute('aria-labelledby',`settings-tab-${i}`);
  this.body.replaceChildren();
  if(i===0){this.range('mouse','Sensibilidad del ratón',.2,2.5,.05,(v)=>`${v.toFixed(2)}x`);this.choice('invert','Invertir eje Y',[[false,'No'],[true,'Sí']]);this.choice('bob','Balanceo al caminar',[['low','Bajo'],['normal','Normal']]);const keys=document.createElement('dl');keys.className='vhs-keys';for(const [key,action] of [['WASD','Moverse'],['Shift','Correr'],['C / Ctrl','Agacharse'],['Espacio','Saltar'],['E','Interactuar'],['Q','Calmar a Lola'],['F','Linterna'],['Tab','Móvil']]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=action;keys.append(dt,dd);}this.body.append(keys);}
  if(i===1){for(const [key,label] of [['volume','Volumen general'],['sfx','Volumen SFX'],['music','Volumen Música / Atmósfera']] as const)this.range(key,label,0,100,1,v=>`${v}%`);}
  if(i===2){this.grain();this.choice('scan','Líneas de escaneo CRT',[[true,'Activado'],[false,'Desactivado']]);this.range('exposure','Brillo / Exposición',.65,1.85,.05,v=>`${v.toFixed(2)}x`);}
  if(animate){this.panel.classList.remove('settings-track');void this.panel.offsetWidth;this.panel.classList.add('settings-track');this.track();}
 }
 private grain(){
  const levels=['low','medium','high'] as const;
  this.slider('vhs','Grano VHS',1,3,1,levels.indexOf(this.value.vhs)+1,n=>`${n} / 3`,n=>{this.value.vhs=levels[n-1];});
 }
 private range<K extends 'mouse'|'volume'|'sfx'|'music'|'exposure'>(k:K,text:string,min:number,max:number,step:number,format:(n:number)=>string){
  this.slider(k,text,min,max,step,this.value[k],format,n=>{this.value[k]=n;});
 }
 private slider(k:string,text:string,min:number,max:number,step:number,initial:number,format:(n:number)=>string,set:(n:number)=>void){
  const row=document.createElement('div');row.className='vhs-setting';const label=document.createElement('label'),input=document.createElement('input'),value=document.createElement('output');
  label.textContent=text;input.id=`option-${k}`;label.htmlFor=input.id;input.type='range';input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(initial);value.htmlFor=input.id;
  const update=()=>{const n=Number(input.value);input.style.setProperty('--signal',`${100*(n-min)/(max-min)}%`);value.textContent=format(n);input.setAttribute('aria-valuetext',value.textContent);};
  input.oninput=()=>{set(Number(input.value));update();this.commit();};update();const control=document.createElement('div');control.className='signal-control';control.append(input,value);row.append(label,control);this.body.append(row);
 }
 private choice<K extends keyof Settings>(k:K,text:string,options:[Settings[K],string][]){const row=document.createElement('fieldset'),legend=document.createElement('legend'),group=document.createElement('div');row.className='vhs-setting';legend.textContent=text;group.className='vhs-options';for(const [value,label] of options){const wrap=document.createElement('label'),input=document.createElement('input'),span=document.createElement('span');input.type='radio';input.name=k;input.checked=this.value[k]===value;span.textContent=label;input.onchange=()=>{if(input.checked){this.value[k]=value;this.commit();}};wrap.append(input,span);group.append(wrap);}row.append(legend,group);this.body.append(row);}
}
