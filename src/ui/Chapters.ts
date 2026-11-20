import {slideMenu} from './MenuSlide';
export type StartChapter='21:30'|'21:42'|'21:50'|'21:56';
export class Chapters{
 private button=document.getElementById('home-chapters')!;
 private panel=document.getElementById('chapters-menu')!;
 constructor(select:(chapter:StartChapter)=>void,private pulse:()=>void){
  this.button.onclick=()=>this.show();
  this.panel.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach(b=>{b.onclick=()=>{if(!this.open)return;this.close(false);select(b.dataset.chapter as StartChapter);};});
  this.panel.querySelector<HTMLButtonElement>('.chapters-back')!.onclick=()=>this.close();
 }
 get open(){return !this.panel.hidden;}
 show(){this.panel.hidden=false;document.body.classList.add('chapters-open');slideMenu(this.panel,true);this.pulse();this.panel.querySelector('button')!.focus();}
 close(focus=true){const wasOpen=this.open;this.panel.hidden=true;document.body.classList.remove('chapters-open');if(wasOpen&&focus){slideMenu(this.panel,false);this.pulse();this.button.focus();}}
}
