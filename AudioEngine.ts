export type Atmosphere='calm'|'uneasy'|'photo'|'alert'|'ending';
export class AudioEngine{
 private volume=1;private sfxLevel=1;private musicLevel=1;private duck=1;private game?:GainNode;private sfxBus?:GainNode;private musicBus?:GainNode;
 private ctx?:AudioContext;private master?:GainNode;private hum?:GainNode;private noise?:AudioBuffer;private growlBus?:GainNode;private growlPan?:StereoPannerNode;private ambience?:{calm:GainNode;drone:GainNode;metal:GainNode;wind:GainNode};private mood:Atmosphere='calm';
 start(){try{if(this.ctx){void this.ctx.resume().catch(()=>{});return;}const c=this.ctx=new AudioContext();this.master=c.createGain();this.master.gain.value=.48*this.volume;const limiter=c.createDynamicsCompressor();limiter.threshold.value=-9;limiter.knee.value=8;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.11;this.master.connect(limiter).connect(c.destination);this.game=c.createGain();this.game.gain.value=this.duck;this.game.connect(this.master);this.sfxBus=c.createGain();this.sfxBus.gain.value=this.sfxLevel;this.sfxBus.connect(this.game);this.musicBus=c.createGain();this.musicBus.gain.value=this.musicLevel;this.musicBus.connect(this.game);this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const a=this.noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const room=c.createBufferSource();room.buffer=this.noise;room.loop=true;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=340;const quiet=c.createGain();quiet.gain.value=.031;room.connect(lp).connect(quiet).connect(this.musicBus);room.start();const o=c.createOscillator(),o2=c.createOscillator(),g=this.hum=c.createGain();o.frequency.value=49.8;o.type='sine';o2.frequency.value=99.6;o2.type='triangle';const sub=c.createGain();sub.gain.value=.22;g.gain.value=0;o.connect(g);o2.connect(sub).connect(g);g.connect(this.musicBus);o.start();o2.start();this.buildAtmosphere(c);this.atmosphere(this.mood);void c.resume().catch(()=>{});}catch{/* Audio no disponible: el juego sigue funcionando. */}}
 setVolume(volume:number){this.volume=Math.max(0,Math.min(1,volume));if(this.master&&this.ctx)this.master.gain.setTargetAtTime(.48*this.volume,this.ctx.currentTime,.055);}
 mix(sfx:number,music:number){this.sfxLevel=sfx;this.musicLevel=music;if(this.ctx){this.sfxBus?.gain.setTargetAtTime(sfx,this.ctx.currentTime,.06);this.musicBus?.gain.setTargetAtTime(music,this.ctx.currentTime,.06);}}
 menu(active:boolean){this.duck=active?.24:1;if(this.ctx)this.game?.gain.setTargetAtTime(this.duck,this.ctx.currentTime,.14);}
 private introLayer?:{gain:GainNode;tones:OscillatorNode[]};
 introStart(){
  if(this.introLayer||!this.ctx||!this.musicBus)return;const c=this.ctx,gain=c.createGain(),t=c.currentTime;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.13,t+.55);gain.connect(this.musicBus);
  const tones=[43.6,46.1,87.3].map((f,i)=>{const o=c.createOscillator(),mix=c.createGain();o.frequency.value=f;o.type='sine';mix.gain.value=[.66,.31,.085][i];o.connect(mix).connect(gain);o.start();return o;});this.introLayer={gain,tones};
 }
 introPulse(){this.tone(69,36,.23,.11,'sine');this.puff(.16,150,.055,'lowpass');}
 introEnd(){const layer=this.introLayer;if(!layer||!this.ctx)return;this.introLayer=undefined;const t=this.ctx.currentTime;layer.gain.gain.cancelAndHoldAtTime(t);layer.gain.gain.linearRampToValueAtTime(0,t+.55);layer.tones.forEach(o=>o.stop(t+.56));layer.tones[0].onended=()=>layer.gain.disconnect();}
 uiHover(){this.puff(.027,1680,.10,'bandpass',0,this.master);this.tone(530,244,.043,.042,'triangle',.002,this.master);}
 uiTape(){this.puff(.09,885,.14,'bandpass',0,this.master);this.tone(220,84,.13,.055,'triangle',.008,this.master);}

 inspect(){this.puff(.13,425,.033,'lowpass');this.tone(182,126,.17,.018,'sine',.022);}
 tapeCue(){this.puff(.085,792,.15);this.tone(190,91,.135,.071,'triangle',.015);this.puff(.12,472,.10,'lowpass',.07);}
 heartbeat(strength:number,interval:number){this.tone(65,36,.114,.31*strength);this.puff(.086,128,.09*strength,'lowpass');this.tone(56,31,.098,.185*strength,'sine',interval);this.puff(.072,120,.06*strength,'lowpass',interval);}
 private dread?:GainNode;private threat=0;
 tension(amount:number){this.threat=amount;if(this.ctx&&this.dread)this.dread.gain.setTargetAtTime(amount*.18,this.ctx.currentTime,amount===0?.045:.78);}
 private buildAtmosphere(c:AudioContext){
  const bus=(gain:number)=>{const g=c.createGain();g.gain.value=gain;g.connect(this.musicBus!);return g;};
  const voice=(dest:AudioNode|AudioParam,freq:number,amp:number,type:OscillatorType='sine')=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.value=amp;o.connect(g);if(dest instanceof AudioParam)g.connect(dest);else g.connect(dest);o.start();return o;};
  const pulse=(param:AudioParam,hz:number,depth:number)=>voice(param,hz,depth);
  const calm=bus(0),drone=bus(0),metal=bus(0),wind=bus(0);this.ambience={calm,drone,metal,wind};
  voice(calm,50,.50);voice(calm,150,.051);for(const [freq,hz] of [[110,.043],[164.8,.071],[220,.059]]){const soft=c.createGain();soft.gain.value=.04;soft.connect(calm);voice(soft,freq,.7);pulse(soft.gain,hz,.037);}
  const throb=c.createGain();throb.gain.value=.63;throb.connect(drone);pulse(throb.gain,.62,.23);pulse(throb.gain,.113,.09);
  voice(throb,36.7,.66);voice(throb,38.25,.31);voice(throb,73.4,.135,'triangle');
  const resonate=c.createBiquadFilter();resonate.type='lowpass';resonate.frequency.value=235;resonate.connect(metal);for(const [hz,amp] of [[93.4,.23],[126.9,.14],[186.3,.1],[217.8,.064]])voice(resonate,hz,amp,'triangle');
  const dread=this.dread=bus(0),surge=c.createGain();surge.gain.value=.53;surge.connect(dread);pulse(surge.gain,1.21,.40);pulse(surge.gain,.17,.09);voice(surge,34.4,.61);voice(surge,36,.37);voice(surge,69.7,.13,'triangle');
  const ring=c.createGain();ring.gain.value=.055;ring.connect(dread);pulse(ring.gain,.19,.042);for(const freq of [140.3,149.9,221.2,237.1])voice(ring,freq,.22,'triangle');this.tension(this.threat);
  const gust=c.createGain();gust.gain.value=.57;gust.connect(wind);pulse(gust.gain,.15,.28);pulse(gust.gain,.067,.15);
  const source=c.createBufferSource(),filter=c.createBiquadFilter();source.buffer=this.noise!;source.loop=true;filter.type='bandpass';filter.frequency.value=176;filter.Q.value=.62;source.connect(filter).connect(gust);source.start();
 }
 atmosphere(mood:Atmosphere){this.mood=mood;if(!this.ctx||!this.ambience)return;const [calm,drone,metal,wind]={calm:[.023,0,0,.088],uneasy:[.009,.076,.030,.073],photo:[.006,.126,.061,.064],alert:[.004,.154,.083,.060],ending:[.11,0,.022,.065]}[mood];
  const now=this.ctx.currentTime;for(const [key,gain] of Object.entries({calm,drone,metal,wind})){const p=this.ambience[key as keyof typeof this.ambience].gain;p.cancelScheduledValues(now);p.setTargetAtTime(gain,now,mood==='ending'&&(key==='drone'||key==='metal')?.035:mood==='uneasy'?2.6:1.35);}
 }
 proximity(distance:number){if(this.ctx&&this.hum)this.hum.gain.setTargetAtTime(.025*Math.max(0,1-distance/3.6)**2,this.ctx.currentTime,.27);}
 private puff(duration:number,frequency:number,volume:number,type:BiquadFilterType='bandpass',delay=0,bus:AudioNode|undefined=this.sfxBus){if(!this.ctx||!this.master||!this.noise)return;const c=this.ctx,t=c.currentTime+delay,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;f.type=type;f.frequency.value=frequency;f.Q.value=.85;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.014);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f).connect(g).connect(bus??this.master);s.start(t,Math.random()*Math.max(0,this.noise.duration-duration-.02));s.stop(t+duration+.015);}
 private tone(freq:number,end:number,length:number,volume:number,type:OscillatorType='sine',delay=0,bus:AudioNode|undefined=this.sfxBus){if(!this.ctx||!this.master)return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(end,t+length);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.014);g.gain.exponentialRampToValueAtTime(.0001,t+length);o.connect(g).connect(bus??this.master);o.start(t);o.stop(t+length+.01);}
 land(impact:number,hard=false){const v=Math.max(.01,Math.min(1,impact/4.4));this.puff(.16,hard?670:330,.29*v);this.tone(105,36,.15,.24*v,'triangle');this.puff(.077,hard?1840:810,.115*v,'bandpass',.036);this.cloth(.37*v,.068);}
 step(hard:boolean,running:boolean,crouched=false){const v=(crouched?.24:running?1.28:.84)*(.82+Math.random()*.36),f=.88+Math.random()*.25;this.puff(.09,(hard?750:290)*f,.22*v);this.tone((hard?126:95)*f,45,.093,.12*v);this.puff(.049,(hard?2200:1040)*f,.11*v,'bandpass',.031);if(!hard)this.tone(213*f,165,.078,.025*v,'triangle',.025);}
 cloth(v=.34,delay=0){this.puff(.112,870,.083*v,'bandpass',delay);this.puff(.074,1900,.057*v,'bandpass',delay+.043);}
 jump(){this.cloth(.76);this.puff(.078,280,.084,'bandpass',.015);}
 phoneMove(open:boolean){this.cloth(.78);this.puff(.065,open?1460:820,.065,'bandpass',.044);}
 click(){this.puff(.037,1770,.23);this.tone(920,530,.038,.07,'triangle');this.puff(.032,795,.145,'bandpass',.029);}
 door(open=true){this.puff(.047,1900,.20);this.tone(187,85,.089,.105,'triangle');if(open){this.tone(283,348,.28,.031,'triangle',.042);this.tone(488,392,.22,.018,'triangle',.075);this.puff(.25,555,.115,'bandpass',.049);}else{this.puff(.115,255,.26,'lowpass',.23);this.tone(103,47,.13,.22,'triangle',.23);this.puff(.049,1580,.18,'bandpass',.267);}}
 notify(){this.tone(660,660,.155,.14);this.tone(881,881,.27,.15,'sine',.114);this.tone(1320,1316,.12,.054,'sine',.116);for(const t of [0,.122]){this.tone(154,143,.087,.055,'triangle',t);this.puff(.075,210,.055,'bandpass',t);}}
 pet(){this.puff(.23,520,.29,'bandpass');this.puff(.17,760,.23,'bandpass',.25);this.tone(155,111,.19,.034,'sine',.02);for(let i=0;i<4;i++)this.puff(.055,1540+i*95,.038,'bandpass',.045+i*.092);}
 kibble(){
  this.puff(.28,715,.105,'lowpass');
  for(let i=0;i<26;i++){const t=i*.021+Math.random()*.019;this.puff(.024+Math.random()*.027,1100+Math.random()*2800,(.115+Math.random()*.19)*(1-i/39),'bandpass',t);if(i%4===0)this.tone(1720+Math.random()*800,1420,.032,.046,'sine',t);}
 }
 latch(){
  this.puff(.135,470,.225);this.puff(.082,1710,.24,'bandpass',.026);this.tone(870,410,.116,.124,'triangle',.024);
  this.puff(.077,960,.29,'bandpass',.157);this.tone(146,82,.087,.21,'sine',.156);this.tone(1850,1370,.101,.092,'triangle',.164);
 }
 intercom(){for(const [f,v] of [[100,.17],[124,.09],[200,.08]])this.tone(f,f*.98,.282,v,'square');this.puff(.286,640,.22);this.puff(.035,1700,.19,'bandpass',.27);}
 peephole(){this.puff(.32,335,.15,'lowpass');this.puff(.19,670,.13,'bandpass',.063);}
 stairCut(){this.puff(.036,2300,.23);this.tone(300,78,.057,.08,'triangle');this.puff(.034,1150,.14,'bandpass',.033);}
 chew(distance=0){const v=1/(1+distance*distance*.33);this.puff(.087,730,.17*v);this.puff(.051,1620,.135*v,'bandpass',.017);this.puff(.073,1100,.115*v,'bandpass',.11);}
 printer(){
  this.puff(.040,1840,.26);this.tone(227,94,.12,.12,'triangle',.019);
  this.tone(94,132,.31,.088,'sawtooth',.14);this.puff(.35,830,.12,'bandpass',.216);
  for(let i=0;i<7;i++){const t=.61+i*.31;this.tone(i%2?185:159,112,.22,.084,'triangle',t);this.puff(.185,1180+i%3*395,.15,'bandpass',t);this.puff(.048,520,.16,'bandpass',t+.209);}
  this.tone(126,60,.19,.076,'triangle',2.82);this.puff(.15,900,.13,'bandpass',2.9);
 }
 paper(){this.puff(.23,1140,.17);for(let i=0;i<5;i++)this.puff(.047+(i%2)*.028,1630+i%3*410,.16-i*.019,'bandpass',.04+i*.046);}
 flashlight(on:boolean){this.puff(.037,on?2040:1470,.22);this.tone(on?830:690,370,.031,.043,'triangle',.006);}
 unlock(){this.puff(.045,1270,.13);this.tone(650,550,.071,.044,'sine',.024);}
 sendMessage(){for(let i=0;i<3;i++)this.puff(.027,1480+i*320,.092,'bandpass',i*.036);this.tone(620,880,.078,.05,'sine',.135);}
 keys(){for(let i=0;i<5;i++){this.puff(.044,2100+i*173,.16,'bandpass',i*.052);this.tone(1900+i*115,1510,.064,.057,'triangle',i*.052);}this.puff(.17,760,.23,'bandpass',.38);this.latchDelayed(.57);}
 private latchDelayed(delay:number){this.tone(204,89,.123,.19,'triangle',delay);this.puff(.068,1020,.26,'bandpass',delay+.035);}
 breaker(){this.puff(.083,670,.28);this.tone(87,37,.17,.23,'triangle');this.puff(.053,2200,.20,'bandpass',.007);this.puff(.22,194,.095,'lowpass',.044);}
 intruderStep(distance:number,pan:number,fast=false){
  if(!this.ctx||!this.master||!this.noise||distance>13)return;const c=this.ctx,t=c.currentTime,n=c.createBufferSource(),o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),p=c.createStereoPanner();
  p.pan.value=pan;n.buffer=this.noise;f.type='lowpass';f.frequency.value=440;o.frequency.setValueAtTime(fast?109:85,t);o.frequency.exponentialRampToValueAtTime(39,t+.13);o.type='triangle';g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.42/(1+distance*distance*.135),t+.013);g.gain.exponentialRampToValueAtTime(.0001,t+.155);n.connect(f);o.connect(f);f.connect(g).connect(p).connect(this.sfxBus??this.master);n.start(t,Math.random());o.start(t);n.stop(t+.16);o.stop(t+.16);
 }
 bark(){for(let i=0;i<2;i++){this.puff(.175,375,.55,'bandpass',i*.26);this.tone(191,100,.18,.27,'sawtooth',i*.26);}}
 caught(){
  if(!this.ctx||!this.sfxBus)return;const c=this.ctx,t=c.currentTime,clip=c.createWaveShaper(),trim=c.createGain();
  clip.curve=Float32Array.from({length:1024},(_,i)=>Math.tanh((i/511.5-1)*4.8));clip.oversample='2x';trim.gain.setValueAtTime(.42,t);trim.gain.setValueAtTime(.42,t+.32);trim.gain.linearRampToValueAtTime(0,t+.35);clip.connect(trim).connect(this.sfxBus);
  this.tone(95,28,.35,.66,'sawtooth',0,clip);this.tone(1690,634,.29,.17,'triangle',.036,clip);this.tone(2230,983,.27,.11,'triangle',.025,clip);this.puff(.33,2350,.51,'bandpass',.014,clip);this.puff(.18,4100,.18,'highpass',.045,clip);
  window.setTimeout(()=>{clip.disconnect();trim.disconnect();},430);
 }

 epilogue(){this.tension(0);this.atmosphere('ending');for(const [i,f] of [164.8,196,246.94,220,164.8,146.83,196].entries())this.tone(f,f,3.6,.029,'sine',i*1.42,this.musicBus);}
 growl(distance:number,pan=0,aggressive=false){
  if(!this.ctx||!this.master)return;const c=this.ctx;
  if(!this.growlBus&&Number.isFinite(distance)){
   const g=this.growlBus=c.createGain();g.gain.value=0;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=365;f.Q.value=1.8;const p=this.growlPan=c.createStereoPanner();f.connect(g).connect(p).connect(this.sfxBus??this.master);
   for(const [freq,amp] of [[46.2,.64],[55.8,.48],[94.4,.18]]){const a=c.createOscillator(),b=c.createGain();a.type='triangle';a.frequency.value=freq;b.gain.value=amp;const wobble=c.createOscillator(),depth=c.createGain();wobble.frequency.value=3.1+freq*.014;depth.gain.value=freq*.024;wobble.connect(depth).connect(a.frequency);wobble.start();a.connect(b).connect(f);a.start();}
   if(this.noise){const n=c.createBufferSource(),g2=c.createGain();n.buffer=this.noise;n.loop=true;g2.gain.value=.30;n.connect(g2).connect(f);n.start();}
  }
  this.growlPan?.pan.setTargetAtTime(Math.max(-1,Math.min(1,pan)),c.currentTime,.14);
  this.growlBus?.gain.setTargetAtTime(Number.isFinite(distance)?(aggressive?.39:.21)/(1+distance*distance*.20):0,c.currentTime,.16);
 }

}
