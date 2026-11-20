const motion='cubic-bezier(0.22, 1, 0.36, 1)';
const animations=new Map<HTMLElement,Animation>();
function cancel(el:HTMLElement){animations.get(el)?.cancel();animations.delete(el);delete el.dataset.menuSlide;el.inert=false;}
export function slideMenu(panel:HTMLElement,opening:boolean,menu:HTMLElement=document.getElementById('menu')!){
 for(const el of [...animations.keys()])cancel(el);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 function move(el:HTMLElement,from:number,to:number,duration:number,enter:boolean){
  el.dataset.menuSlide=enter?'in':'out';el.inert=!enter;
  const animation=el.animate([{transform:`translateX(${from}px)`,opacity:enter?0:1},{transform:`translateX(${to}px)`,opacity:enter?1:0}],{duration,easing:motion});
  animations.set(el,animation);
  animation.onfinish=()=>{if(animations.get(el)===animation)cancel(el);};
 }
 if(opening){move(menu,0,60,320,false);move(panel,-60,0,380,true);}
 else{move(panel,0,-60,320,false);move(menu,60,0,380,true);}
}
