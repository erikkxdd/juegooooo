import * as T from 'three';
const loader=new T.TextureLoader();
const sources=Array.from({length:13},(_,i)=>loader.load(`${import.meta.env.BASE_URL}fotos-casa/${String(i+1).padStart(2,'0')}.jpeg`));
const kitchenFloorSource=loader.load(`${import.meta.env.BASE_URL}texturas-casa/suelo-cocina.jpg`);
const crops:Record<string,[number,number,number,number,number]>={
 plushBrown:[10,.735,.561,.041,.052],plushCream:[10,.748,.479,.035,.029],plushBear:[10,.033,.431,.032,.022],plushWhite:[5,.826,.593,.040,.030],plushDog:[5,.801,.518,.049,.028],plushRed:[10,.459,.490,.069,.031],plushDark:[10,.472,.557,.035,.011],plushOrange:[10,.457,.576,.023,.018],printerLabel:[6,.206,.690,.043,.024],cabinetSheets:[12,.871,.229,.072,.128],cabinetCalendar:[12,.876,.559,.074,.101],balconyTile:[4,.513,.465,.037,.024],balconyRail:[4,.354,.359,.012,.036],fridgePhoto:[4,.912,.067,.083,.098],fridgeCalendar:[4,.931,.333,.069,.082],fridgeNotes:[4,.911,.442,.075,.081],tileTrim:[1,.791,.377,.103,.064],sleevePaper:[3,.473,.307,.052,.029],kitchenFloor:[4,.435,.816,.235,.142],hallFloor:[7,.41,.77,.22,.15],kidsFloor:[5,.34,.79,.23,.15],parentsFloor:[8,.43,.68,.15,.20],kidsWall:[10,.641,.125,.044,.14],parentsWall:[8,.095,.405,.16,.14],wallKitchen:[1,.754,.227,.118,.111],wallStone:[2,.24,.10,.40,.16],kitchenTile:[1,.335,.28,.06,.046],stone:[2,.24,.10,.40,.16],botanical:[3,.68,.05,.31,.29],cabinet:[4,.705,.13,.08,.15],wardrobe:[5,.40,.82,.24,.12],parquet:[6,.475,.62,.12,.13],door:[7,.35,.25,.15,.17],floral:[8,.08,.26,.15,.24],violet:[9,.54,.07,.19,.05],mural:[10,.735,.14,.25,.43],upholstery:[11,.095,.375,.24,.155],curtain:[12,.24,.193,.083,.168],bathFloor:[13,.49,.86,.14,.115],orange:[11,.24,.13,.13,.10],creamWall:[6,.76,.31,.13,.11],worktop:[4,.684,.391,.052,.022],cover:[3,.36,.63,.17,.11],darkCurtain:[3,.185,.08,.079,.25],striped:[10,.43,.65,.21,.135],artFamily:[11,.585,.03,.152,.164],artPortrait:[11,.38,.028,.105,.136],artLarge:[11,0,0,.218,.151],artTall:[12,.192,.231,.044,.088],entryArtA:[7,.033,.041,.105,.175],entryArtB:[7,.14,.08,.072,.153],childPoster:[5,.37,.082,.169,.20],childCalendar:[5,.526,.127,.153,.176],childPets:[5,.704,.217,.241,.073],parentsArt:[3,.544,.194,.045,.066],shelfArt:[6,.783,.163,.116,.035],mirrorStars:[13,.216,.025,.042,.34]
};
const defaultRoughness:Record<string,number>={wallKitchen:.35,wallStone:.35,stone:.35,kitchenFloor:.48,kitchenTile:.35,bathFloor:.35,door:.65,cabinet:.65,wardrobe:.65,parquet:.68,worktop:.55,upholstery:.95,cover:.95,curtain:.95,darkCurtain:.95,striped:.95};
const artKeys=/^(art|plush|printerLabel|cabinetSheets|cabinetCalendar|fridge|sleevePaper|entryArt|childPoster|childCalendar|childPets|parentsArt|shelfArt|mirrorStars|mural|botanical|floral)/;
const solids=new Map<string,T.MeshStandardMaterial>();
export function solid(color:number,roughness=.91,metalness=0){const key=`${color}:${roughness}:${metalness}`;let m=solids.get(key);if(!m){m=new T.MeshStandardMaterial({color,roughness,metalness});solids.set(key,m);}return m;}
// Visible corners in the original photos (mapped from a 600 × 800 reference view).
// Order: top left, top right, bottom right, bottom left.
const livingArt:Record<string,{corners:number[][];aspect:number}>={
 artLarge:{corners:[[4,4],[109,4],[109,96],[4,84]],aspect:1.19},
 artPortrait:{corners:[[247,42],[271,45],[269,93],[245,89]],aspect:.60},
 artFamily:{corners:[[362,26],[436,37],[417,151],[350,148]],aspect:.67},
 shelfArt:{corners:[[457,139],[539,134],[540,157],[456,162]],aspect:3.27}
};
export const cropAspect=(name:string)=>livingArt[name]?.aspect??crops[name][3]/crops[name][4]*.75;
function rectify(ctx:CanvasRenderingContext2D,image:HTMLImageElement,name:string){
 const [A,B,C,D]=livingArt[name].corners.map(([x,y])=>[x/600*image.width,y/800*image.height]);
 const ax=B[0]-C[0],bx=D[0]-C[0],cx=A[0]-B[0]+C[0]-D[0];
 const ay=B[1]-C[1],by=D[1]-C[1],cy=A[1]-B[1]+C[1]-D[1];
 const det=ax*by-bx*ay,g=(cx*by-bx*cy)/det,h=(ax*cy-cx*ay)/det;
 const src=document.createElement('canvas');src.width=image.width;src.height=image.height;const sc=src.getContext('2d',{willReadFrequently:true})!;sc.drawImage(image,0,0);
 const xmin=Math.floor(Math.min(A[0],B[0],C[0],D[0])),ymin=Math.floor(Math.min(A[1],B[1],C[1],D[1]));
 const sw=Math.ceil(Math.max(A[0],B[0],C[0],D[0]))-xmin+2,sh=Math.ceil(Math.max(A[1],B[1],C[1],D[1]))-ymin+2;
 const input=sc.getImageData(xmin,ymin,sw,sh).data, {width:w,height:d}=ctx.canvas,out=ctx.createImageData(w,d);
 for(let y=0;y<d;y++)for(let x=0;x<w;x++){
  const u=(x+.5)/w,v=(y+.5)/d,t=1+g*u+h*v;
  const xx=(A[0]+((1+g)*B[0]-A[0])*u+((1+h)*D[0]-A[0])*v)/t-xmin;
  const yy=(A[1]+((1+g)*B[1]-A[1])*u+((1+h)*D[1]-A[1])*v)/t-ymin;
  const ix=Math.floor(xx),iy=Math.floor(yy),fx=xx-ix,fy=yy-iy,k=(iy*sw+ix)*4,n=(y*w+x)*4;
  for(let ch=0;ch<3;ch++)out.data[n+ch]=((1-fx)*input[k+ch]+fx*input[k+4+ch])*(1-fy)+((1-fx)*input[k+4*sw+ch]+fx*input[k+4*sw+4+ch])*fy;
  out.data[n+3]=255;
 }ctx.putImageData(out,0,0);
}
const cache=new Map<string,T.MeshStandardMaterial>();
export function photo(name:string,u=1,v=1){
 const key=`${name}:${u}:${v}`; const saved=cache.get(key); if(saved)return saved;
 const [id,x,y,w,h]=crops[name],img=sources[id-1], artwork=artKeys.test(name);const c=document.createElement('canvas');const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=artwork?T.ClampToEdgeWrapping:T.RepeatWrapping;tex.repeat.set(u,v);tex.anisotropy=4;
 const ceramic=/^(stone|kitchenTile|bathFloor|kitchenFloor)$/.test(name);const m=new T.MeshStandardMaterial({color:artwork?0xc3bcc1:0xaaa5a8,roughness:defaultRoughness[name]??.90});
 if(name==='kitchenFloor'){
  const t=kitchenFloorSource.clone();t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(u,v);t.anisotropy=4;t.needsUpdate=true;
  m.map=t;m.bumpMap=t;m.bumpScale=.006;cache.set(key,m);return m;
 }
 function ready(){const image=img.image as HTMLImageElement;c.width=artwork?384:256;c.height=artwork?Math.round(T.MathUtils.clamp(c.width/(livingArt[name]?.aspect??(w*image.width/(h*image.height))),80,700)):256;const ctx=c.getContext('2d')!;if(livingArt[name]){rectify(ctx,image,name);}else if(artwork||ceramic){ctx.drawImage(image,x*image.width,y*image.height,w*image.width,h*image.height,0,0,c.width,c.height);}else{for(let j=0;j<2;j++)for(let k=0;k<2;k++){ctx.save();ctx.translate(k*c.width,j*c.height);ctx.scale(k?-1:1,j?-1:1);ctx.drawImage(image,x*image.width,y*image.height,w*image.width,h*image.height,0,0,c.width/2,c.height/2);ctx.restore();}}
 if(ceramic){ctx.strokeStyle='#776e626c';ctx.lineWidth=3;ctx.strokeRect(.5,.5,c.width-1,c.height-1);ctx.strokeStyle='#f5ede999';ctx.lineWidth=1;ctx.strokeRect(2.5,2.5,c.width-5,c.height-5);}
 tex.needsUpdate=true;m.map=tex;if(ceramic||['cover','upholstery','parquet','door','worktop'].includes(name)){m.bumpMap=tex;m.bumpScale=ceramic?.012:.019;}m.needsUpdate=true;}
 if(img.image)ready();else {const timer=setInterval(()=>{if(img.image){clearInterval(timer);ready();}},70);setTimeout(()=>clearInterval(timer),20000);}cache.set(key,m);return m;
}
const quilts=new Map<string,T.MeshStandardMaterial>();
export function quilt(name:'padres'|'alta'|'baja'){
 const existing=quilts.get(name);if(existing)return existing;
 const map=loader.load(`${import.meta.env.BASE_URL}texturas-casa/colcha-${name}.jpg`);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 const fabric=new T.MeshStandardMaterial({color:name==='padres'?0xe1dbd5:0xffffff,map,bumpMap:map,bumpScale:.006,roughness:.96});quilts.set(name,fabric);return fabric;
}
