const slides=[
 'En otoño de 2026, Yasmín, de 16 años, vivía con su padre y su hermano mayor Erik en un piso de Logroño.',
 'Era una noche tranquila entre semana. Hacía frío fuera y el bloque estaba prácticamente en silencio.',
 'Cerca de las nueve y media, su padre y Erik bajaron un momento a hacer un recado rápido.',
 'Yasmín se quedó sola en casa haciendo compañía a Lola, su perra.',
 'Todo parecía completamente normal... salvo por un detalle al que nadie le había dado importancia.',
 'Semanas atrás habían perdido una copia de las llaves del piso y nunca llegaron a cambiar la cerradura.',
 'Eran las 21:30 cuando cerró la puerta detrás de ellos.',
] as const;
const slideDuration=5300;
export class IntroSlides{
 private panel=document.getElementById('story-intro')!;
 private text=this.panel.querySelector('.intro-copy')!;
 private next=this.panel.querySelector<HTMLButtonElement>('button')!;
 private index=0;private slideTimer=0;private hideTimer=0;private playing=false;
 constructor(private pulse:()=>void,private done:()=>void){this.next.onclick=()=>this.advance();}
 get active(){return this.playing;}
 start(){if(this.playing)return;clearTimeout(this.hideTimer);this.playing=true;this.index=0;this.panel.hidden=false;this.panel.classList.remove('intro-exit');this.next.disabled=false;this.draw();this.next.focus({preventScroll:true});}
 advance(){if(!this.playing)return;clearTimeout(this.slideTimer);if(++this.index<slides.length){this.draw();return;}
  this.playing=false;this.next.disabled=true;this.panel.classList.add('intro-exit');
  // Start synchronously on the final gesture so Pointer Lock can use its activation.
  this.done();this.hideTimer=window.setTimeout(()=>{this.panel.hidden=true;},550);
 }
 private draw(){this.text.classList.remove('intro-slide');this.text.textContent=slides[this.index];void this.text.getBoundingClientRect();this.text.classList.add('intro-slide');this.pulse();this.slideTimer=window.setTimeout(()=>this.advance(),slideDuration);}
}
