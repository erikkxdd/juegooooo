const paragraphs=[
 'Al día siguiente, la policía revisó la cerradura de la entrada.',
 'No había señales de fuerza.',
 'El intruso tenía una copia exacta de la llave que se había perdido semanas atrás… y llevaba días vigilando cuándo se quedaba Yasmín sola en casa.',
];
export class FinalScreen{
 private panel=document.getElementById('final-screen')!;private typeTimer=0;private buttonTimer=0;
 get open(){return !this.panel.hidden;}
 close(){clearInterval(this.typeTimer);clearTimeout(this.buttonTimer);this.panel.hidden=true;this.panel.replaceChildren();}
 caught(retry:()=>void){
  this.close();this.panel.className='caught-screen';this.panel.hidden=false;
  this.panel.innerHTML='<div class="tape-snow"></div><div class="final-content" hidden><p>GAME OVER · SEÑAL PERDIDA</p><button type="button">Reintentar desde las 21:50</button></div>';
  this.panel.querySelector('button')!.onclick=retry;
  this.buttonTimer=window.setTimeout(()=>{const content=this.panel.querySelector<HTMLElement>('.final-content')!;content.hidden=false;content.querySelector('button')!.focus();},550);
 }
 ending(replay:()=>void){
  this.close();this.panel.className='ending-screen';this.panel.hidden=false;
  this.panel.innerHTML='<div class="tape-snow"></div><div class="final-content"><div class="epilogue-copy" aria-label="Epílogo"></div><button type="button" hidden>Volver a jugar</button></div>';
  const copy=this.panel.querySelector('.epilogue-copy')!,button=this.panel.querySelector('button')!;button.onclick=replay;
  const blocks=paragraphs.map(()=>{const p=document.createElement('p');copy.append(p);return p;});let line=0,index=0,pause=0;
  this.typeTimer=window.setInterval(()=>{if(pause>0){pause--;return;}blocks[line].textContent=paragraphs[line].slice(0,++index);if(index===paragraphs[line].length){line++;index=0;pause=19;if(line===paragraphs.length){clearInterval(this.typeTimer);button.hidden=false;}}},34);
 }
}
