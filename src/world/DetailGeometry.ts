import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const cache=new Map<string,T.BufferGeometry>();
export function profile(w:number,h:number,d:number,soft=false){
 const r=Math.min(w,h,d)*(soft?.31:.13), k=[w,h,d,soft].join(':');let g=cache.get(k);
 if(!g){g=r>=.003?new RoundedBoxGeometry(w,h,d,1,r):new T.BoxGeometry(w,h,d);cache.set(k,g);}return g;
}
export function packStatic(scene:T.Scene,excluded:Set<T.Object3D>){
 scene.updateMatrixWorld(true);
 const piles=new Map<string,T.Mesh[]>();
 for(const obj of scene.children){if(!(obj instanceof T.Mesh)||excluded.has(obj)||Array.isArray(obj.material)||obj.material.transparent||obj.userData.live)continue;
  const p=obj.position,key=`${obj.material.uuid}/${Math.floor(p.x/2.4)}/${Math.floor(p.z/2.4)}/${Number(obj.castShadow)}/${obj.userData.balconySlat?"balcony":"base"}/${obj.userData.inspectId??""}`;const pile=piles.get(key);if(pile)pile.push(obj);else piles.set(key,[obj]);
 }
 for(const pile of piles.values()){if(pile.length<3)continue;
  const g=pile.map(m=>{const c=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();c.applyMatrix4(m.matrixWorld);
   if(m.matrixWorld.determinant()<0)for(const a of Object.values(c.attributes)){const raw=a.array;for(let i=0;i<raw.length;i+=a.itemSize*3)for(let j=0;j<a.itemSize;j++){const u=i+j+a.itemSize,v=u+a.itemSize;[raw[u],raw[v]]=[raw[v],raw[u]];}}return c;});
  const merged=mergeGeometries(g);g.forEach(c=>c.dispose());if(!merged)continue;
  merged.computeBoundingSphere();merged.computeBoundingBox();const base=pile[0],batch=new T.Mesh(merged,base.material);if(base.userData.balconySlat)batch.userData.balconySlat=true;if(base.userData.inspectId)batch.userData.inspectId=base.userData.inspectId;batch.castShadow=base.castShadow;batch.receiveShadow=true;scene.remove(...pile);scene.add(batch);
 }
}
