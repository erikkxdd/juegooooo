export type StartChapter='21:30'|'21:42'|'21:50';
const key='turno_noche_completed';
export class Chapters{
 private button=document.getElementById('home-chapters')!;
 private panel=document.getElementById('chapters-menu')!;
 private unlocked=false;
 constructor(select:(chapter:StartChapter)=>void){
  try{this.unlocked=localStorage.getItem(key)==='true';}catch{}
  this.button.hidden=!this.unlocked;this.button.onclick=()=>this.show();
  this.panel.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach(b=>{b.onclick=()=>{if(!this.open||!this.unlocked)return;this.close(false);select(b.dataset.chapter as StartChapter);};});
  this.panel.querySelector<HTMLButtonElement>('.chapters-back')!.onclick=()=>this.close();
 }
 get open(){return !this.panel.hidden;}
 complete(){this.unlocked=true;this.button.hidden=false;try{localStorage.setItem(key,'true');}catch{}}
 show(){if(!this.unlocked)return;this.panel.hidden=false;document.body.classList.add('chapters-open');this.panel.querySelector('button')!.focus();}
 close(focus=true){const wasOpen=this.open;this.panel.hidden=true;document.body.classList.remove('chapters-open');if(wasOpen&&focus)this.button.focus();}
}
