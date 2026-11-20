import * as T from 'three';
export const MIRROR_HEAD_LAYER=1;
const ball=new T.SphereGeometry(1,18,12);
const loader=new T.TextureLoader();
export const characterTexture=(name:string)=>{const t=loader.load(`${import.meta.env.BASE_URL}personajes/${name}.jpg`);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;};
export function shape(parent:T.Object3D,mat:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,g:T.BufferGeometry=ball){const m=new T.Mesh(g,mat);m.position.set(x,y,z);m.scale.set(w/2,h/2,d/2);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
const m=(color:number,roughness=.9)=>new T.MeshStandardMaterial({color,roughness});
export class YasminPlayer{
 readonly root=new T.Group();readonly head=new T.Group();private upper=new T.Group();
 private arms:T.Group[]=[];private legs:T.Group[]=[];private pet=0;private heading=0;
 constructor(parent:T.Scene){
  this.root.name='Yasmín · personaje';this.root.add(this.upper,this.head);parent.add(this.root);
  const skin=m(0xae7966,.88), hair=m(0x251c19), charcoal=m(0x24242a), shoes=m(0x302e32,.64), knit=m(0xd3d0c9);knit.map=characterTexture('yasmin-sudadera');const tee=m(0xe1d7c8);
  shape(this.upper,knit,0,1.129,-.057,.384,.515,.245);shape(this.upper,knit,0,1.29,-.045,.429,.254,.236);
  shape(this.upper,knit,0,1.012,.046,.196,.160,.080);shape(this.upper,charcoal,0,.902,-.053,.332,.221,.237);
  shape(this.upper,tee,0,1.375,.018,.179,.103,.139);shape(this.upper,skin,0,1.413,-.024,.107,.183,.108);
  const hood=shape(this.upper,knit,0,1.356,-.119,.263,.158,.149);hood.rotation.x=-.26;
  for(const s of [-1,1]){
   const arm=new T.Group();arm.position.set(s*.195,1.297,-.041);this.upper.add(arm);this.arms.push(arm);
   shape(arm,knit,s*.027,-.133,.004,.137,.338,.135).rotation.z=s*.12;shape(arm,knit,s*.047,-.347,.027,.106,.246,.106).rotation.x=-.10;
   shape(arm,skin,s*.052,-.488,.039,.081,.113,.061);shape(arm,skin,s*.024,-.48,.064,.036,.051,.037);
   const leg=new T.Group();leg.position.set(s*.086,.893,-.051);this.root.add(leg);this.legs.push(leg);
   shape(leg,charcoal,0,-.191,-.003,.165,.441,.175);shape(leg,charcoal,0,-.575,-.014,.13,.392,.145);
   shape(leg,shoes,0,-.83,.052,.142,.119,.288);shape(leg,tee,0,-.875,.055,.142,.029,.29);
  }
  // Rostro proyectado en la parte frontal de una cabeza volumétrica; perfil y nuca son geometría.
  const headGeo=new T.SphereGeometry(1,32,22),pos=headGeo.attributes.position,uv=headGeo.attributes.uv;
  headGeo.clearGroups();const index=headGeo.index!;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);uv.setXY(i,.5+x*.51,.50+y*.53);pos.setX(i,x*(.91+.09*T.MathUtils.smoothstep(y,-.8,.3)));}
  for(let i=0;i<index.count;i+=3){const z=(pos.getZ(index.getX(i))+pos.getZ(index.getX(i+1))+pos.getZ(index.getX(i+2)))/3;headGeo.addGroup(i,3,z>.25?0:1);} // agrupar tramos contiguos
  const groups=headGeo.groups.slice();headGeo.clearGroups();for(const g of groups){const p=headGeo.groups.at(-1);if(p&&p.materialIndex===g.materialIndex)p.count+=g.count;else headGeo.addGroup(g.start,g.count,g.materialIndex);}
  headGeo.computeVertexNormals();const face=m(0xffffff,.85);face.map=characterTexture('yasmin-cara');
  const skull=new T.Mesh(headGeo,[face,skin]);skull.scale.set(.086,.114,.080);skull.position.set(0,.018,.008);skull.castShadow=true;this.head.add(skull);
  const tip=shape(this.head,skin,0,-.009,.077,.041,.046,.037);tip.visible=false; // la nariz está en el mapa facial
  for(const s of [-1,1]){shape(this.head,skin,s*.081,.008,-.005,.036,.062,.039);shape(this.head,hair,s*.070,.003,-.041,.056,.201,.076).rotation.z=s*.11;shape(this.head,hair,s*.073,-.139,-.067,.062,.251,.062).rotation.z=s*.13;}
  shape(this.head,hair,0,.044,-.045,.181,.198,.145);shape(this.head,charcoal,0,.104,.002,.198,.107,.182);shape(this.head,charcoal,0,.076,.086,.198,.022,.118).rotation.x=-.14;
  this.root.traverse(o=>o.layers.set(MIRROR_HEAD_LAYER));
 }
 resetPose(camera:T.PerspectiveCamera){this.pet=0;this.root.scale.set(1,1,1);this.update(camera,0,0,1);}
 petLola(){this.pet=.75;}
 update(camera:T.PerspectiveCamera,speed:number,phase:number,dt:number,crouched=false,feet=0){
  this.root.position.set(camera.position.x,feet,camera.position.z);this.root.scale.y=T.MathUtils.damp(this.root.scale.y,crouched?.54:1,12,dt);const view=camera.getWorldDirection(new T.Vector3());
  if(view.x*view.x+view.z*view.z>.005)this.heading=Math.atan2(view.x,view.z);
  this.root.rotation.y=this.heading;this.head.position.y=(camera.position.y-feet-.027)/this.root.scale.y;this.head.rotation.x=-Math.asin(T.MathUtils.clamp(view.y,-1,1))*.8;
  this.pet=Math.max(0,this.pet-dt);const gain=T.MathUtils.clamp(speed/1.55,0,1.55), reach=Math.sin(this.pet/.75*Math.PI);
  this.upper.rotation.x=reach*.17;this.upper.position.y=crouched?0:(camera.position.y-feet-1.64)*.65;
  for(let i=0;i<2;i++){const s=i===0?1:-1;this.legs[i].rotation.x=Math.sin(phase)*s*.435*gain;this.arms[i].rotation.x=-Math.sin(phase)*s*.28*gain-(i===1?reach*1.07:0);this.arms[i].rotation.z=s*.045;}
 }
}
