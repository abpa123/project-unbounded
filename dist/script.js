(() => {
  const canvas = document.getElementById('landscape');
  const ctx = canvas.getContext('2d', {alpha:false});
  const sections = [...document.querySelectorAll('.panel')];
  const fill = document.getElementById('route-progress-fill');
  const dot = document.getElementById('route-progress-dot');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w=0,h=0,dpr=1,desired=0,position=0,pointerX=0,pointerY=0;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function resize(){
    dpr=Math.min(devicePixelRatio||1,1.75);w=innerWidth;h=innerHeight;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function scroll(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    desired=clamp(scrollY/max,0,1);
    fill.style.height=`${desired*100}%`;
    dot.style.top=`${desired*100}%`;
  }
  addEventListener('resize',()=>{resize();scroll()});
  addEventListener('scroll',scroll,{passive:true});
  addEventListener('pointermove',e=>{pointerX=(e.clientX/w-.5)*2;pointerY=(e.clientY/h-.5)*2},{passive:true});
  resize();scroll();
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}
  }),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

  function cloud(x,y,size,tint){
    ctx.save();ctx.translate(x,y);ctx.scale(size,size);
    ctx.fillStyle='rgba(95,156,128,.08)';
    ctx.beginPath();ctx.ellipse(8,22,82,16,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=tint;
    for(const [cx,cy,r] of [[-43,1,30],[-12,-14,41],[27,-3,32],[53,7,21]]){
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function hillPath(base,amp,phase){
    ctx.beginPath();ctx.moveTo(0,h);
    for(let x=0;x<=w+12;x+=12){
      const y=base+Math.sin(x/w*7+phase)*amp+Math.sin(x/w*15+phase*.7)*amp*.25;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(w,h);ctx.closePath();
  }
  function sphere(x,y,r,color){
    ctx.save();
    const shadow=ctx.createRadialGradient(x+r*.25,y+r*.4,r*.1,x+r*.25,y+r*.4,r*1.25);
    shadow.addColorStop(0,'rgba(59,91,62,.2)');shadow.addColorStop(1,'rgba(59,91,62,0)');
    ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(x+r*.3,y+r*.9,r*1.2,r*.45,0,0,Math.PI*2);ctx.fill();
    const grad=ctx.createRadialGradient(x-r*.35,y-r*.45,r*.05,x,y,r);
    grad.addColorStop(0,'#fff6d8');grad.addColorStop(.27,color);grad.addColorStop(.76,color);grad.addColorStop(1,'#b76c4d');
    ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(x-r*.28,y-r*.39,r*.19,r*.11,-.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function render(now){
    position+=(desired-position)*(reduced?1:.065);
    const travel=position*75;
    const time=reduced?0:now*.001;
    const mobile=w<600;
    const horizon=h*(mobile?.49:.43);
    const sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#e8f6f0');sky.addColorStop(.43,'#f7fbde');sky.addColorStop(1,'#fff1d7');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    // Rounded clouds shift gently while the journey advances.
    cloud(w*.78+Math.sin(time*.24)*12,h*.19,1.1,'rgba(255,255,255,.85)');
    cloud(w*.44-Math.sin(time*.17)*9,h*.32,.5,'rgba(255,255,255,.68)');
    cloud(w*1.05-Math.sin(time*.14)*17,h*.1,.7,'rgba(255,255,255,.7)');
    hillPath(horizon+5,h*.037,travel*.016);ctx.fillStyle='#cfe3b6';ctx.fill();
    hillPath(horizon+h*.045,h*.05,travel*.021+1.2);ctx.fillStyle='#acd49f';ctx.fill();
    hillPath(horizon+h*.13,h*.042,travel*.026+3.3);ctx.fillStyle='#82b98f';ctx.fill();
    const field=ctx.createLinearGradient(0,horizon,0,h);
    field.addColorStop(0,'#80ba8a');field.addColorStop(1,'#5fa676');
    hillPath(horizon+h*.19,h*.035,travel*.03+2.6);ctx.fillStyle=field;ctx.fill();
    // A road drawn from projected world points; scroll advances the camera along it.
    const project=(z,lane=0)=>{
      const depth=1+z*.18;
      const world=z+travel;
      const bend=Math.sin(world*.18)*.58+Math.sin(world*.068+.7)*.52;
      const parallax=reduced?0:pointerX*.008;
      const cx=w*(mobile?.62:.73)+w*(mobile?.28:.23)*(bend+lane+parallax)/depth;
      return {x:cx,y:horizon+h*.9/depth,scale:1/depth};
    };
    // Direction lines in the grass make the depth readable without a map grid.
    ctx.strokeStyle='rgba(232,249,218,.24)';ctx.lineWidth=1;
    for(const lane of [-3.6,-2.6,2.6,3.6]){
      ctx.beginPath();for(let z=0;z<=45;z+=.5){const p=project(z,lane);if(z===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}ctx.stroke();
    }
    for(let z=45;z>=0;z-=.45){
      const far=project(z+.45),near=project(z);
      const fw=w*(mobile?.26:.28)*far.scale,nw=w*(mobile?.26:.28)*near.scale;
      ctx.beginPath();ctx.moveTo(far.x-fw,far.y);ctx.lineTo(far.x+fw,far.y);ctx.lineTo(near.x+nw,near.y);ctx.lineTo(near.x-nw,near.y);ctx.closePath();
      ctx.fillStyle='rgba(46,98,60,.18)';ctx.save();ctx.translate(7*near.scale,12*near.scale);ctx.fill();ctx.restore();
      const road=ctx.createLinearGradient(near.x-nw,0,near.x+nw,0);
      road.addColorStop(0,'#e99164');road.addColorStop(.06,'#ffc494');road.addColorStop(.44,'#ffe2b4');road.addColorStop(.76,'#ffd3a4');road.addColorStop(1,'#e78c64');
      ctx.fillStyle=road;ctx.fill();
    }
    // Raised edges and a dashed center stripe follow the bend in perspective.
    for(const lane of [-1,1]){
      ctx.beginPath();
      for(let z=0;z<=45;z+=.3){const p=project(z);const x=p.x+lane*w*(mobile?.26:.28)*p.scale;if(z===0)ctx.moveTo(x,p.y);else ctx.lineTo(x,p.y)}
      ctx.lineWidth=mobile?2.5:3.5;ctx.strokeStyle='#d97d5e';ctx.stroke();
      ctx.lineWidth=1;ctx.strokeStyle='rgba(255,245,212,.65)';ctx.stroke();
    }
    for(let z=.2;z<44;z+=3.7){
      const phase=(z+travel)%3.7;if(phase>2.5)continue;
      const a=project(z),b=project(z+1.6);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
      ctx.strokeStyle='rgba(255,255,232,.9)';ctx.lineWidth=Math.max(1,6*a.scale);ctx.lineCap='round';ctx.stroke();
    }
    // Soft waypoints approach and pass as the page scrolls.
    for(let i=0;i<9;i++){
      const z=((i*9.5-travel+1000)%72)+.5;if(z>42)continue;
      const side=i%2?1:-1;const p=project(z,side*1.65);
      const r=clamp(w*.12*p.scale,mobile?5:6,mobile?43:64);
      const floatY=Math.sin(time*1.7+i)*r*.07;
      sphere(p.x,p.y-r*.55+floatY,r,i%3===0?'#ffa86f':i%3===1?'#fbc784':'#ffcba9');
    }
    // A gentle sun gives each stop a shared horizon.
    const sunX=w*(mobile?.8:.79),sunY=horizon-h*.23;
    const sun=ctx.createRadialGradient(sunX,sunY,5,sunX,sunY,w*.2);
    sun.addColorStop(0,'rgba(255,240,177,.22)');sun.addColorStop(1,'rgba(255,240,177,0)');
    ctx.fillStyle=sun;ctx.fillRect(0,0,w,h);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
