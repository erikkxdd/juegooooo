import type {HouseBuilder} from './HouseBuilder';
export class VerticalMotion{
 feet=0;speed=0;grounded=true;
 reset(feet=0){this.feet=feet;this.speed=0;this.grounded=true;}
 jump(){if(!this.grounded)return;this.grounded=false;this.speed=4.56;}
 update(dt:number,house:HouseBuilder,x:number,z:number,radius:number,bodyHeight=1.80){
  const surface=house.support(x,z,radius,this.feet);
  if(this.grounded&&Math.abs(this.feet-surface)<.005){this.feet=surface;return 0;}
  this.grounded=false;let next=this.feet+this.speed*dt-4.4*dt*dt;this.speed-=8.8*dt;
  const limit=house.ceilingAt(x,z)-bodyHeight-.06;if(next>limit){next=limit;this.speed=Math.min(0,this.speed);}
  if(this.speed<=0&&next<=surface){const impact=-this.speed;this.reset(surface);return impact;}
  this.feet=next;return 0;
 }
}
