const seenKey='turno_de_noche_trailer_visto_v1';
export function initTrailer(){
 const dialog=document.querySelector<HTMLDialogElement>('#trailer-overlay')!;
 const video=document.querySelector<HTMLVideoElement>('#trailer-video')!;
 const play=document.querySelector<HTMLButtonElement>('#trailer-play')!;
 const skip=document.querySelector<HTMLButtonElement>('#trailer-skip')!;
 const watch=document.querySelector<HTMLButtonElement>('#watch-trailer')!;
 let seen=false,attempt=0;
 try{seen=localStorage.getItem(seenKey)==='1';}catch{/* Storage may be unavailable in private embeds. */}
 const remember=()=>{seen=true;try{localStorage.setItem(seenKey,'1');}catch{/* Keep state for this page. */}};
 const finish=()=>{
  if(!dialog.open)return;
  ++attempt;remember();video.pause();video.removeAttribute('src');video.load();dialog.close();
  document.documentElement.classList.remove('trailer-pending');watch.hidden=false;
  document.querySelector<HTMLButtonElement>('#start')?.focus({preventScroll:true});
 };
 const start=(gesture=false)=>{
  const token=++attempt;play.hidden=true;
  void video.play().then(()=>{if(dialog.open&&token===attempt)remember();}).catch(()=>{
   if(!dialog.open||token!==attempt||video.error)return;
   play.hidden=false;play.focus({preventScroll:true});
  });
  if(gesture)remember();
 };
 const open=()=>{
  if(dialog.open)return;
  watch.hidden=true;dialog.showModal();video.muted=false;
  video.src=`${import.meta.env.BASE_URL}trailer-yasmin.mp4`;start();
 };
 play.onclick=()=>start(true);skip.onclick=finish;watch.onclick=open;
 video.addEventListener('ended',finish);video.addEventListener('error',finish);
 dialog.addEventListener('cancel',e=>{e.preventDefault();finish();});
 dialog.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();finish();}});
 if(seen){watch.hidden=false;document.documentElement.classList.remove('trailer-pending');}else open();
}
