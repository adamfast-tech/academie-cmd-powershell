(function(){
'use strict';
/* =========================================================
   Utilitaires
   ========================================================= */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const IC={
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  route:'<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/>',
  terminal:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="m7 9 3 3-3 3"/><path d="M13 15h4"/>',
  book:'<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v14H5.5A1.5 1.5 0 0 0 4 18.5z"/><path d="M4 18.5A1.5 1.5 0 0 0 5.5 20H20"/><path d="M8 7h8M8 10.5h6"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
  flame:'<path fill="currentColor" stroke="none" d="M12 22c4 0 7-2.7 7-6.8 0-3.6-2.4-5.6-4-8.2-.6 2-1.6 3-3 3.5.4-3.4-1-6.2-3.5-8.5C8.8 5.5 5 8.6 5 15.2 5 19.3 8 22 12 22z"/>',
  bolt:'<path fill="currentColor" stroke="none" d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  chev:'<path d="m9 6 6 6-6 6"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  warn:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>',
  brief:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
  trophy:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6"/>',
  refresh:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  play:'<path fill="currentColor" d="M7 4.5v15l12-7.5z"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  shield:'<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/>',
  server:'<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  network:'<rect x="9" y="2.5" width="6" height="5" rx="1"/><rect x="2.5" y="16.5" width="6" height="5" rx="1"/><rect x="15.5" y="16.5" width="6" height="5" rx="1"/><path d="M12 7.5v4.5M5.5 16.5V12h13v4.5"/>',
  star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  keyboard:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2c2 .7 3.5 2.6 3.5 5.8"/>',
  ticket:'<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v2M14 11v2M14 16v2"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  sync:'<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
};
const ic=(n,cls)=>`<svg ${cls?`class="${cls}" `:''}viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||''}</svg>`;

/* =========================================================
   Markdown léger + coloration syntaxique
   ========================================================= */
function fmt(h){return h.replace(/\*\*([^*]+?)\*\*/g,'<strong>$1</strong>');}
function inl(s){
  s=String(s==null?'':s);let o='',i=0;
  while(i<s.length){
    const j=s.indexOf('`',i);
    if(j<0){o+=fmt(esc(s.slice(i)));break;}
    o+=fmt(esc(s.slice(i,j)));
    let k=j;while(s[k]==='`')k++;const n=k-j;
    let p=k,end=-1;
    while(p<s.length){const q=s.indexOf('`',p);if(q<0)break;let r=q;while(s[r]==='`')r++;if(r-q===n){end=q;break;}p=r;}
    if(end<0){o+=esc(s.slice(j,k));i=k;continue;}
    let code=s.slice(k,end);
    if(code.length>2&&code[0]===' '&&code[code.length-1]===' '&&code.trim())code=code.slice(1,-1);
    o+='<code>'+esc(code)+'</code>';i=end+n;
  }
  return o;
}
const PS_KW=new Set('if elseif else foreach for while do until switch function param return try catch finally throw break continue in begin process end filter trap exit'.split(' '));
const CMD_KW=new Set('if else for in do goto call set setlocal endlocal echo exit not exist defined errorlevel equ neq lss leq gtr geq shift pause rem title cls start choice timeout'.split(' '));
function hl(src,sh){return String(src).split('\n').map(l=>hlLine(l,sh)).join('\n');}
function hlLine(line,sh){
  const ps=sh==='ps';
  if(!ps&&/^\s*@?(rem\b|::)/i.test(line))return `<span class="t-cm">${esc(line)}</span>`;
  let o='',i=0,cmdPos=true;const n=line.length;
  const sp=(c,t)=>`<span class="t-${c}">${esc(t)}</span>`;
  while(i<n){
    const rest=line.slice(i);let m;
    const prev=i===0?' ':line[i-1];
    const atStart=i===0||/[\s(|&;{=,]/.test(prev);
    if((m=/^\s+/.exec(rest))){o+=m[0];i+=m[0].length;continue;}
    if(ps&&rest.startsWith('<#')){o+=sp('cm',rest);break;}
    if(ps&&rest[0]==='#'&&atStart){o+=sp('cm',rest);break;}
    if(!ps&&rest[0]==='@'&&cmdPos){o+='@';i++;continue;}
    if((m=/^@"[\s\S]*|^@'[\s\S]*/.exec(rest))&&ps){o+=sp('str',m[0]);break;}
    if((m=/^"(?:[^"`]|`.|"")*"?/.exec(rest))){o+=sp('str',m[0]);i+=m[0].length;cmdPos=false;continue;}
    if(rest[0]==="'"&&(ps||!/^'[^']*$/.test(rest))&&(m=/^'(?:[^']|'')*'?/.exec(rest))){o+=sp('str',m[0]);i+=m[0].length;cmdPos=false;continue;}
    if(ps&&(m=/^\$(\{[^}]*\}|[A-Za-z_]\w*(:[\w]+)?|_|\?|\$)/.exec(rest))){o+=sp('var',m[0]);i+=m[0].length;cmdPos=false;continue;}
    if(!ps&&(m=/^(%%~?[a-z]+|%~[a-z]*\d|%[A-Za-z_][\w]*(:[^%]*)?%|%\d|%\*|![A-Za-z_]\w*!)/i.exec(rest))){o+=sp('var',m[0]);i+=m[0].length;cmdPos=false;continue;}
    if((m=/^(2>&1|>>|2>|1>|>|<|\|\||&&|\||&)/.exec(rest))){
      o+=sp('op',m[0]);i+=m[0].length;cmdPos=['|','||','&&','&'].includes(m[0]);continue;}
    if(rest[0]===';'){o+=sp('op',';');i++;cmdPos=true;continue;}
    if(ps&&atStart&&(m=/^-(eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|in|notin|and|or|not|xor|replace|split|join|is|isnot|f|band|bor|ceq|ieq|cne|clike|cmatch)\b/i.exec(rest))){o+=sp('op',m[0]);i+=m[0].length;continue;}
    if(atStart&&ps&&(m=/^-[A-Za-z][\w]*:?/.exec(rest))){o+=sp('sw',m[0]);i+=m[0].length;cmdPos=false;continue;}
    if(atStart&&!ps&&(m=/^\/[^\s"|<>&]+|^\/(?=\s|$)|^-[A-Za-z][\w]*/.exec(rest))){o+=sp('sw',m[0]);i+=m[0].length;cmdPos=false;continue;}
    if((m=/^(?:[A-Za-z]{1,4}:\\[^\s"'|<>,;)}]*|\\\\[^\s"'|<>,;)}]+|\.{1,2}\\[^\s"'|<>,;)}]*)/.exec(rest))&&atStart){o+=sp('path',m[0]);i+=m[0].length;cmdPos=false;continue;}
    if(ps&&(m=/^\[[A-Za-z_][\w.]*(\[\])?\]/.exec(rest))){o+=sp('type',m[0]);i+=m[0].length;continue;}
    if(atStart&&(m=/^\d+(\.\d+)?(KB|MB|GB|TB)?(?![\w.])/i.exec(rest))){o+=sp('num',m[0]);i+=m[0].length;cmdPos=false;continue;}
    if((m=/^[A-Za-z_][\w.\-]*/.exec(rest))){
      const w=m[0],lw=w.toLowerCase();let cls='';
      if(ps){
        if(/^[A-Za-z]+-[A-Za-z][\w]*$/.test(w)&&prev!=='.')cls='cmd';
        else if(PS_KW.has(lw)&&atStart)cls='kw';
        else if(cmdPos&&prev!=='.')cls='cmd';
      }else{
        if(cmdPos&&CMD_KW.has(lw))cls='kw';
        else if(cmdPos)cls='cmd';
        else if(/^(in|do|not|exist|defined|errorlevel|equ|neq|lss|leq|gtr|geq|else)$/i.test(w))cls='kw';
      }
      o+=cls?sp(cls,w):esc(w);i+=w.length;
      cmdPos=!ps&&cls==='kw'&&/^(do|else|not)$/i.test(w)?true:(!ps&&cls==='kw'&&/^(if)$/i.test(w)?false:false);
      continue;
    }
    if('({'.includes(rest[0])){o+=esc(rest[0]);i++;cmdPos=true;continue;}
    o+=esc(rest[0]);i++;
  }
  return o;
}

/* =========================================================
   Lecture des données (DSL)
   ========================================================= */
const splitF=s=>s.split('¦').map(x=>x.trim());
const splitL=s=>s.split(';;').map(x=>x.trim()).filter(x=>x.length);
function parseCourse(txt){
  const tracks=[];let T=null,C=null,L=null,K=null,fence=null,para=[];
  const flush=()=>{if(K&&para.length){pushText(K,para);}para=[];};
  function pushText(K,lines){
    let buf=[],list=null;
    const end=()=>{if(buf.length){K.body.push({k:'p',text:buf.join(' ')});buf=[];}if(list){K.body.push({k:'ul',items:list});list=null;}};
    for(const l of lines){
      if(/^- /.test(l)){if(buf.length){K.body.push({k:'p',text:buf.join(' ')});buf=[];}(list=list||[]).push(l.slice(2));}
      else{if(list){K.body.push({k:'ul',items:list});list=null;}buf.push(l);}
    }
    end();
  }
  const lines=txt.replace(/\r/g,'').split('\n');
  for(const raw of lines){
    if(fence){
      if(raw.trim()==='```'){
        const f=fence;fence=null;
        if(!K)continue;
        if(f.kind==='anatomy'){K.body.push({k:'anat',sh:f.arg||'cmd',parts:f.lines.filter(l=>l.trim()).map(l=>{const p=splitF(l);return{tok:p[0],kind:p[1]||'arg',ex:p[2]||''};})});}
        else if(f.kind==='table'){K.body.push({k:'tbl',rows:f.lines.filter(l=>l.trim()).map(splitF)});}
        else if(f.kind==='out'){
          if(K.t==='type')K.out=f.lines.join('\n');
          else{const last=K.body[K.body.length-1];if(last&&(last.k==='code'||last.k==='script'))last.out=f.lines.join('\n');else K.body.push({k:'code',sh:'cmd',src:'',out:f.lines.join('\n')});}
        }
        else if(f.kind==='code'||f.kind==='script'){K.body.push({k:f.kind,sh:f.arg||'cmd',file:f.arg2||'',src:f.lines.join('\n')});}
        continue;
      }
      fence.lines.push(raw);continue;
    }
    const line=raw.replace(/\s+$/,'');
    if(line.startsWith('```')){flush();const a=line.slice(3).trim().split(/\s+/);fence={kind:a[0],arg:a[1],arg2:a.slice(2).join(' '),lines:[]};continue;}
    if(line.startsWith('=== ')){flush();const f=splitF(line.slice(4));T={id:f[0],title:f[1],tape:f[2],desc:f[3]||'',chapters:[],lessons:[]};tracks.push(T);C=null;L=null;K=null;continue;}
    if(line.startsWith('--- ')){flush();C={title:line.slice(4).trim(),lessons:[]};T.chapters.push(C);L=null;K=null;continue;}
    if(line.startsWith('### ')){flush();const f=splitF(line.slice(4));const kid=f[0].split(/\s+/);
      L={id:kid[1],mission:kid[0]==='MISSION',title:f[1],level:+f[2]||1,desc:f[3]||'',cards:[],track:T,chapter:C};C.lessons.push(L);T.lessons.push(L);K=null;continue;}
    if(!L)continue;
    if(line.startsWith('@ticket ')){const f=splitF(line.slice(8));L.ticket={no:f[0],prio:f[1],svc:f[2],who:f[3],subj:f[4]||''};continue;}
    if(line.startsWith('>>> ')){flush();const head=line.slice(4);const ix=head.indexOf('¦');const left=(ix<0?head:head.slice(0,ix)).trim();const q=ix<0?'':head.slice(ix+1).trim();const a=left.split(/\s+/);
      K={t:a[0],sh:a[1]||null,q,body:[],opts:[],ans:[],re:[],tokens:[],extra:[],expl:[],hint:'',sol:'',out:''};L.cards.push(K);continue;}
    if(!K)continue;
    if(line.trim()===''){flush();continue;}
    let m;
    if((m=/^\+ (.*)$/.exec(line))){flush();K.opts.push({text:m[1],ok:true});continue;}
    if((m=/^\* (.*)$/.exec(line))){flush();K.opts.push({text:m[1],ok:false});continue;}
    if((m=/^=~ (.*)$/.exec(line))){flush();K.re.push(m[1]);continue;}
    if((m=/^= (.*)$/.exec(line))){flush();K.ans.push(...splitL(m[1]));continue;}
    if((m=/^~ (.*)$/.exec(line))){flush();K.tokens.push(...splitL(m[1]));continue;}
    if((m=/^x~ (.*)$/.exec(line))){flush();K.extra.push(...splitL(m[1]));continue;}
    if((m=/^\? (.*)$/.exec(line))){flush();K.expl.push(m[1]);continue;}
    if((m=/^!(tip|warn|it) (.*)$/.exec(line))){flush();K.body.push({k:'call',type:m[1],text:m[2]});continue;}
    if((m=/^hint: (.*)$/.exec(line))){flush();K.hint=m[1];continue;}
    if((m=/^sol: (.*)$/.exec(line))){flush();K.sol=m[1];continue;}
    para.push(line);
  }
  flush();
  return tracks;
}
function parseDict(txt){
  const D={cmd:[],ps:[],sym:[],eq:[]};let E=null;
  for(const raw of txt.replace(/\r/g,'').split('\n')){
    const line=raw.replace(/\s+$/,'');if(!line.trim())continue;
    if(line.startsWith('@@ ')){
      const sp=line.indexOf(' ',3);const kind=line.slice(3,sp);const f=splitF(line.slice(sp+1));
      if(kind==='eq'){D.eq.push({cmd:f[0],ps:f[1],d:f[2]||''});E=null;continue;}
      E={kind,n:f[0],cat:f[1]||'',d:f[2]||'',ety:f[3]||'',syn:[],sw:[],ex:[],notes:[],see:'',alias:'',adm:''};
      (D[kind]||(D[kind]=[])).push(E);continue;
    }
    if(!E)continue;
    let m;
    if((m=/^syn: (.*)$/.exec(line))){E.syn.push(m[1]);continue;}
    if((m=/^ex: (.*)$/.exec(line))){const f=splitF(m[1]);let c=f[0],sh=null;const pm=/^(ps|cmd)> (.*)$/.exec(c);if(pm){sh=pm[1];c=pm[2];}E.ex.push({c,d:f[1]||'',sh});continue;}
    if((m=/^note: (.*)$/.exec(line))){E.notes.push(m[1]);continue;}
    if((m=/^see: (.*)$/.exec(line))){E.see=m[1];continue;}
    if((m=/^alias: (.*)$/.exec(line))){E.alias=m[1];continue;}
    if((m=/^adm: (.*)$/.exec(line))){E.adm=m[1];continue;}
    if((m=/^sw: (.*)$/.exec(line))||/^[\/-]/.test(line)&&line.includes('¦')){const f=splitF(m?m[1]:line);E.sw.push({s:f[0],mn:f[1]||'',d:f[2]||''});continue;}
    E.notes.push(line);
  }
  return D;
}
const mnem=s=>esc(s).replace(/\[([^\]]+)\]/g,'<b>$1</b>');

/* =========================================================
   État, progression, synchronisation
   ========================================================= */
const KEY='academie-cmd-ps-v1';
const defState=()=>({v:1,xp:0,done:{},streak:{n:0,last:null},day:{d:null,xp:0},goal:30,badges:{},stats:{ans:0,ok:0,lessons:0,perfect:0,cmds:0},missions:{},theme:'system',updated:0});
function load(){try{const j=JSON.parse(localStorage.getItem(KEY));if(j&&j.v===1){const d=defState();return Object.assign(d,j,{stats:Object.assign(d.stats,j.stats||{})});}}catch(e){}return defState();}
let S=load();
function persist(){S.updated=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}Sync.push();try{Cloud.push();}catch(e){}}
const dstr=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>dstr(new Date());
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return dstr(d);};
function streakNow(){if(!S.streak.last)return 0;return(S.streak.last===today()||S.streak.last===yesterday())?S.streak.n:0;}
function dayXp(){return S.day.d===today()?S.day.xp:0;}
function addXp(n){
  S.xp+=n;const t=today();
  if(S.day.d!==t)S.day={d:t,xp:0};
  S.day.xp+=n;
  if(S.streak.last!==t){S.streak.n=(S.streak.last===yesterday())?S.streak.n+1:1;S.streak.last=t;}
}
function mergeRemote(R){
  if(!R||R.v!==1)return false;
  const before=JSON.stringify(S);
  S.xp=Math.max(S.xp,R.xp||0);
  for(const [k,v] of Object.entries(R.done||{})){const l=S.done[k];if(!l||(v.best||0)>(l.best||0))S.done[k]=Object.assign({},l||{},v);}
  if(R.streak&&R.streak.last&&(!S.streak.last||R.streak.last>S.streak.last||(R.streak.last===S.streak.last&&R.streak.n>S.streak.n)))S.streak=Object.assign({},R.streak);
  if(R.day&&R.day.d){if(!S.day.d||R.day.d>S.day.d)S.day=Object.assign({},R.day);else if(R.day.d===S.day.d)S.day.xp=Math.max(S.day.xp,R.day.xp);}
  Object.assign(S.badges,R.badges||{});Object.assign(S.missions,R.missions||{});
  for(const k of Object.keys(S.stats))S.stats[k]=Math.max(S.stats[k]||0,(R.stats||{})[k]||0);
  if((R.updated||0)>(S.updated||0)&&R.goal)S.goal=R.goal;
  return JSON.stringify(S)!==before;
}
const Sync={ref:null,on:false,writing:false,again:false,timer:null,
  async init(){
    try{
      if(!window.claude||typeof window.claude.use!=='function')return;
      const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
      if(!db||!user)return;
      const uid=await user.id();if(!uid)return;
      this.ref=db.doc('data/users/'+uid+'/progress');
      const snap=await this.ref.get();
      let remote=null;
      if(snap.exists){remote=snap.data();mergeRemote(remote);try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
      this.on=true;
      const local=JSON.stringify(stripLocal(S));
      if(!remote||JSON.stringify(stripLocal(remote))!==local){if(S.xp>0||Object.keys(S.done).length)this.push(true);}
      refresh();
    }catch(e){this.on=false;this.ref=null;}
  },
  push(now){if(!this.ref)return;clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),now?50:1500);},
  async flush(){
    if(!this.ref)return;
    if(this.writing){this.again=true;return;}
    this.writing=true;
    try{await this.ref.set(JSON.parse(JSON.stringify(stripLocal(S))));}
    catch(e){if(e&&e.code==='invalid_argument'){this.ref=null;this.on=false;refreshChrome();}}
    this.writing=false;
    if(this.again){this.again=false;this.flush();}
  }
};
function stripLocal(o){const c=Object.assign({},o);delete c.theme;delete c.owner;return c;}

/* ---------- Comptes en ligne (version web : Supabase Auth + Postgres) ---------- */
const IN_ARTIFACT=!!(window.claude&&typeof window.claude.use==='function');
const CFG=window.ACADEMIE_SUPABASE||null;
const AUTH={mode:'login',msg:'',err:'',busy:false,confirmDel:false,pwd:false};
function authErr(e){
  const m=String((e&&(e.message||e.error_description||e.msg))||e||'');const c=e&&e.code||'';
  if(/invalid login credentials/i.test(m)||c==='invalid_credentials')return 'Identifiant ou mot de passe incorrect.';
  if(/email not confirmed/i.test(m)||c==='email_not_confirmed')return 'Adresse pas encore confirmée : clique sur le lien reçu par e-mail, puis reconnecte-toi.';
  if(/already registered|already been registered/i.test(m)||c==='user_already_exists')return 'Un compte existe déjà avec cette adresse e-mail.';
  if(/rate limit|too many/i.test(m)||/rate_limit/.test(c))return 'Trop de tentatives ou d’e-mails envoyés. Réessaie dans quelques minutes.';
  if(/weak|at least|should be/i.test(m)&&/password/i.test(m))return 'Mot de passe trop faible : 8 caractères minimum.';
  if(/invalid.*email|email.*invalid|unable to validate email/i.test(m))return 'Adresse e-mail invalide.';
  if(/not authorized|address not authorized|email_address_not_authorized/i.test(m)||c==='email_address_not_authorized')return 'Le serveur refuse d’envoyer l’e-mail de confirmation à cette adresse (envoi d’e-mails non configuré).';
  if(/database error saving new user/i.test(m))return 'Inscription refusée par le serveur (nom d’utilisateur déjà pris ?).';
  if(/failed to fetch|networkerror|load failed/i.test(m))return 'Serveur injoignable : vérifie ta connexion Internet.';
  if(/same.*password|different from the old/i.test(m))return 'Le nouveau mot de passe doit être différent de l’ancien.';
  return m||'Une erreur est survenue.';
}
const Cloud={sb:null,user:null,profile:null,on:false,ready:false,timer:null,writing:false,again:false,history:[],lastSync:0,offline:false,
  available(){return !!(CFG&&CFG.url&&CFG.key&&window.supabase&&!IN_ARTIFACT);},
  name(){return (this.profile&&this.profile.username)||(this.user&&((this.user.user_metadata||{}).username||this.user.email))||'';},
  async init(){
    if(!this.available())return;
    try{
      this.sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'academie-auth'}});
      this.sb.auth.onAuthStateChange((ev,session)=>{
        if(ev==='PASSWORD_RECOVERY'){AUTH.mode='newpass';AUTH.msg='Choisis ton nouveau mot de passe.';AUTH.err='';setTimeout(()=>go('me'),0);}
        const u=session?session.user:null;const was=this.user&&this.user.id;this.user=u;
        if(u&&u.id!==was)setTimeout(()=>this.onLogin(),0);
        else if(!u&&was)setTimeout(()=>this.onLogout(),0);
      });
      await this.sb.auth.getSession();
    }catch(e){}
    this.ready=true;refresh();
  },
  async onLogin(){
    const uid=this.user&&this.user.id;if(!uid)return;
    try{
      const [p,g]=await Promise.all([
        this.sb.from('profiles').select('username,created_at').eq('id',uid).maybeSingle(),
        this.sb.from('progress').select('state,updated_at').eq('user_id',uid).maybeSingle()]);
      this.profile=p.data||null;
      if(S.owner&&S.owner!==uid){const th=S.theme;S=defState();S.theme=th;}
      const guest=!S.owner&&(S.xp>0||Object.keys(S.done).length>0);
      if(g.data&&g.data.state)mergeRemote(g.data.state);
      S.owner=uid;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}
      this.on=true;this.offline=false;
      await this.flush();
      if(guest)toast('Ta progression invité a été ajoutée à ton compte.');
      this.loadHistory();
    }catch(e){this.offline=true;}
    refresh();
  },
  onLogout(){
    this.on=false;this.profile=null;this.history=[];
    const th=S.theme;S=defState();S.theme=th;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}
    AUTH.mode='login';AUTH.confirmDel=false;AUTH.pwd=false;refresh();
  },
  async pull(){
    if(!this.on||!this.user)return;
    try{const g=await this.sb.from('progress').select('state').eq('user_id',this.user.id).maybeSingle();
      if(g.data&&g.data.state&&mergeRemote(g.data.state)){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}refresh();this.push();}}catch(e){}
  },
  push(now){if(!this.on)return;clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),now?50:1500);},
  async flush(){
    if(!this.on||!this.user)return;
    if(this.writing){this.again=true;return;}
    this.writing=true;
    try{const r=await this.sb.from('progress').upsert({user_id:this.user.id,state:JSON.parse(JSON.stringify(stripLocal(S)))},{onConflict:'user_id'});
      if(r.error)throw r.error;this.lastSync=Date.now();this.offline=false;}
    catch(e){this.offline=true;}
    this.writing=false;refreshChrome();
    if(this.again){this.again=false;this.flush();}
  },
  async log(lesson,mode,xp,acc){
    if(!this.on||!this.user)return;
    try{await this.sb.from('lesson_history').insert({lesson_id:String(lesson).toLowerCase().slice(0,16),mode,xp:Math.max(0,Math.min(100,xp|0)),accuracy:Math.max(0,Math.min(100,acc|0))});this.loadHistory();}catch(e){}
  },
  async loadHistory(){
    if(!this.on||!this.user)return;
    try{const r=await this.sb.from('lesson_history').select('lesson_id,mode,xp,accuracy,completed_at').order('completed_at',{ascending:false}).limit(12);
      if(!r.error){this.history=r.data||[];if(UI.view==='me')render();}}catch(e){}
  }
};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')Cloud.pull();else if(Cloud.on)Cloud.flush();});

/* niveaux & badges */
const LEVELS=[[0,'Stagiaire'],[60,'Support N1'],[150,'Support N1+'],[300,'Technicien N2'],[500,'Technicien N2+'],[800,'Admin système'],[1200,'Admin système+'],[1700,'Ingénieur N3'],[2400,'Architecte'],[3200,'Gourou du prompt']];
function levelOf(xp){let i=0;for(let k=0;k<LEVELS.length;k++)if(xp>=LEVELS[k][0])i=k;const cur=LEVELS[i],nxt=LEVELS[i+1];return{i:i+1,name:cur[1],from:cur[0],to:nxt?nxt[0]:null,next:nxt?nxt[1]:null};}
const BADGES=[
  {id:'first',ico:'play',t:'Hello, World',d:'Terminer une première leçon.'},
  {id:'five',ico:'star',t:'Rodé',d:'Terminer 5 leçons.'},
  {id:'twenty',ico:'server',t:'Pilier du support',d:'Terminer 20 leçons.'},
  {id:'fifty',ico:'network',t:'Encyclopédie vivante',d:'Terminer 50 leçons.'},
  {id:'perfect',ico:'target',t:'Zéro faute',d:'Finir une leçon sans aucune erreur.'},
  {id:'streak3',ico:'flame',t:'Régulier',d:'3 jours de suite.'},
  {id:'streak7',ico:'flame',t:'Astreinte',d:'7 jours de suite.'},
  {id:'base',ico:'layers',t:'Fondations solides',d:'Terminer la piste Fondamentaux.'},
  {id:'cmd',ico:'terminal',t:'Maître du prompt',d:'Terminer la piste CMD.'},
  {id:'ps',ico:'bolt',t:'Pipeline humain',d:'Terminer la piste PowerShell.'},
  {id:'ad',ico:'users',t:"Gardien de l'annuaire",d:'Terminer la piste Active Directory.'},
  {id:'ticket',ico:'ticket',t:'Ticket clos',d:'Résoudre une première mission.'},
  {id:'ms',ico:'trophy',t:'Zéro ticket en attente',d:'Résoudre toutes les missions.'},
  {id:'tinker',ico:'keyboard',t:'Bidouilleur',d:'Taper 50 commandes dans le terminal.'},
  {id:'sandbox',ico:'shield',t:'Mains dans le cambouis',d:'Réussir 5 défis du bac à sable.'}
];
function checkBadges(){
  const got=[];const give=id=>{if(!S.badges[id]){S.badges[id]=today();got.push(BADGES.find(b=>b.id===id));}};
  const n=Object.keys(S.done).length;
  if(n>=1)give('first');if(n>=5)give('five');if(n>=20)give('twenty');if(n>=50)give('fifty');
  if(S.stats.perfect>=1)give('perfect');
  const st=streakNow();if(st>=3)give('streak3');if(st>=7)give('streak7');
  for(const T of TRACKS){const all=T.lessons.length&&T.lessons.every(l=>S.done[l.id]);if(all)give(T.id);}
  const ms=TRACKS.find(t=>t.id==='ms');if(ms&&ms.lessons.some(l=>S.done[l.id]))give('ticket');
  if(S.stats.cmds>=50)give('tinker');
  if(Object.keys(S.missions).length>=5)give('sandbox');
  return got.filter(Boolean);
}

/* =========================================================
   Données du cours
   ========================================================= */
const grab=type=>$$(`script[type="${type}"]`).map(s=>s.textContent).join('\n');
const TRACKS=parseCourse(grab('text/x-course'));
const DICT=parseDict(grab('text/x-dict'));
const ALL=[];TRACKS.forEach(T=>T.lessons.forEach(L=>ALL.push(L)));
const byId=Object.fromEntries(ALL.map(L=>[L.id,L]));
const TAPE={base:['','Bases'],cmd:['cmd','CMD'],ps:['ps','PowerShell'],ad:['ad','Active Directory'],ms:['ms','Tickets']};
const tapeOf=T=>{const t=TAPE[T.tape]||TAPE.base;return `<span class="tape ${t[0]}">${esc(t[1])}</span>`;};
const LVL=['','Débutant','Intermédiaire','Avancé','Expert'];
const KIND={info:'Cours',qcm:'Quiz',fill:'Complète',order:'Assemble',type:'Tape la commande'};
const isEx=c=>c.t!=='info';
function nextLesson(after){
  let i=after?ALL.indexOf(after)+1:0;
  for(;i<ALL.length;i++)if(!S.done[ALL[i].id])return ALL[i];
  if(after){for(let k=0;k<ALL.length;k++)if(!S.done[ALL[k].id])return ALL[k];}
  return null;
}
const trackProgress=T=>{const d=T.lessons.filter(l=>S.done[l.id]).length;return{d,n:T.lessons.length,p:T.lessons.length?d/T.lessons.length:0};};

/* =========================================================
   Composants d'affichage
   ========================================================= */
const SHNAME={cmd:'Invite de commandes',ps:'Windows PowerShell'};
function consoleHtml(src,sh,opts={}){
  sh=sh==='ps'?'ps':'cmd';
  const prompt=opts.prompt!==false;
  const pr=sh==='ps'?'PS C:\\&gt; ':'C:\\&gt;';
  const lines=String(src||'').split('\n');
  const body=src?lines.map(l=>(prompt&&l.trim()&&!/^\s*(#|rem\b|::)/i.test(l)?`<span class="pr">${pr}</span>`:'')+hlLine(l,sh)).join('\n'):'';
  const id='c'+Math.random().toString(36).slice(2,8);
  return `<div class="console ${sh}"><div class="bar"><span class="ttl">${esc(opts.title||SHNAME[sh])}</span>${src&&opts.copy!==false?`<button type="button" data-copy="${id}">Copier</button>`:''}${src&&opts.tryit?`<button type="button" data-try="${id}" data-sh="${sh}">Essayer</button>`:''}</div>${src?`<pre id="${id}" data-raw="${esc(src)}">${body}</pre>`:''}${opts.out?`<pre class="out">${esc(opts.out)}</pre>`:''}</div>`;
}
const KINDFR={cmd:'commande',sw:'commutateur',path:'chemin',arg:'argument',op:'opérateur',var:'variable',str:'texte',kw:'mot-clé',num:'nombre',val:'valeur',param:'paramètre',sb:'bloc de script',type:'type',cm:'commentaire'};
const KCLS={cmd:'t-cmd',sw:'t-sw',param:'t-sw',path:'t-path',op:'t-op',var:'t-var',str:'t-str',val:'t-str',kw:'t-kw',num:'t-num',sb:'t-kw',type:'t-type',cm:'t-cm',arg:''};
function anatHtml(b){
  const id='a'+Math.random().toString(36).slice(2,8);
  const sh=b.sh==='ps'?'ps':'cmd';
  return `<div class="anat" data-anat="${id}"><div class="console ${sh}"><div class="bar"><span class="ttl">Anatomie — touche un morceau</span></div><div class="anat-line">${b.parts.map((p,i)=>`<button type="button" class="anat-tok ${KCLS[p.kind]||''}" data-tok="${i}" aria-pressed="${i===0}">${esc(p.tok)}<sup>${i+1}</sup></button>`).join('')}</div></div><div class="anat-list">${b.parts.map((p,i)=>`<div class="anat-item${i===0?' on':''}" data-item="${i}"><span class="k ${KCLS[p.kind]||''}" style="color:${p.kind==='arg'?'#F2F2F2':''}">${esc(p.tok)}</span><div><span class="kind">${i+1} · ${esc(KINDFR[p.kind]||p.kind)}</span>${inl(p.ex)}</div></div>`).join('')}</div></div>`;
}
function bodyHtml(items){
  return items.map(b=>{
    if(b.k==='p')return `<p>${inl(b.text)}</p>`;
    if(b.k==='ul')return `<ul>${b.items.map(i=>`<li>${inl(i)}</li>`).join('')}</ul>`;
    if(b.k==='code')return consoleHtml(b.src,b.sh,{out:b.out,tryit:!!b.src});
    if(b.k==='script')return consoleHtml(b.src,b.sh,{out:b.out,prompt:false,title:b.file||(b.sh==='ps'?'script.ps1':'script.bat')});
    if(b.k==='anat')return anatHtml(b);
    if(b.k==='tbl')return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${b.rows[0].map(c=>`<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.slice(1).map(r=>`<tr>${r.map(c=>`<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if(b.k==='call'){const m={tip:['bulb','Astuce'],warn:['warn','Attention'],it:['brief','En entreprise']}[b.type];return `<div class="callout ${b.type}">${ic(m[0])}<div><span class="lbl">${m[1]}</span>${inl(b.text)}</div></div>`;}
    return '';
  }).join('');
}
function wireCommon(root){
  root.addEventListener('click',e=>{
    const cp=e.target.closest('[data-copy]');
    if(cp){const pre=document.getElementById(cp.dataset.copy);const raw=pre?pre.dataset.raw:'';copyText(raw,cp);return;}
    const tr=e.target.closest('[data-try]');
    if(tr){const pre=document.getElementById(tr.dataset.try);const raw=pre?pre.dataset.raw.split('\n').find(l=>l.trim()&&!/^\s*(#|rem|::)/i.test(l)):'';tryInTerminal(raw||'',tr.dataset.sh);return;}
    const tk=e.target.closest('[data-tok]');
    if(tk){const a=tk.closest('[data-anat]');const i=tk.dataset.tok;
      $$('[data-tok]',a).forEach(b=>b.setAttribute('aria-pressed',b.dataset.tok===i));
      $$('[data-item]',a).forEach(b=>b.classList.toggle('on',b.dataset.item===i));
      const it=$(`[data-item="${i}"]`,a);if(it&&it.scrollIntoView){const r=it.getBoundingClientRect();if(r.bottom>window.innerHeight-120||r.top<60)it.scrollIntoView({block:'nearest',behavior:reduceMotion?'auto':'smooth'});}
    }
  });
}
function copyText(t,btn){
  const done=()=>{if(btn){const o=btn.textContent;btn.textContent='Copié';setTimeout(()=>btn.textContent=o,1200);}};
  try{navigator.clipboard.writeText(t).then(done,()=>fallback());}catch(e){fallback();}
  function fallback(){const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){toast('Sélectionne le texte pour le copier.');}ta.remove();}
}
let toastT=null;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600);}

/* =========================================================
   Navigation
   ========================================================= */
const NAV=[{id:'home',label:'Accueil',icon:'home'},{id:'path',label:'Parcours',icon:'route'},{id:'term',label:'Terminal',icon:'terminal'},{id:'memo',label:'Mémo',icon:'book'},{id:'me',label:'Profil',icon:'user'}];
const UI={view:'home',track:'base',level:0,memoTab:'cmd',memoQ:'',memoCat:'',termTab:'cmd'};
const main=$('#main');
function renderNav(){
  const h=NAV.map(n=>`<button type="button" data-nav="${n.id}" ${UI.view===n.id?'aria-current="page"':''}>${ic(n.icon)}<span>${n.label}</span></button>`).join('');
  $('#railNav').innerHTML=h;$('#tabbar').innerHTML=h;
  refreshChrome();
}
function refreshChrome(){
  const f=$('#railFoot');if(!f)return;
  const on=Sync.on||Cloud.on;
  const label=Cloud.on?(Cloud.offline?'Hors ligne · '+esc(Cloud.name()):'Synchronisé · '+esc(Cloud.name())):Sync.on?'Progression synchronisée':Cloud.available()?'Invité · <a href="#me" data-nav="me" class="link">se connecter</a>':'Progression sur cet appareil';
  f.innerHTML=`<div style="display:flex;align-items:center;gap:8px"><span class="sync-dot ${on&&!Cloud.offline?'on':''}"></span><span>${label}</span></div>`;
}
function go(v,opt){UI.view=v;if(opt)Object.assign(UI,opt);renderNav();render();window.scrollTo(0,0);}
document.addEventListener('click',e=>{const n=e.target.closest('[data-nav]');if(n){go(n.dataset.nav);}});
function render(){
  if(UI.view==='home')main.innerHTML=viewHome();
  else if(UI.view==='path')main.innerHTML=viewPath();
  else if(UI.view==='term'){main.innerHTML=viewTerm();mountTerm();}
  else if(UI.view==='memo'){main.innerHTML=viewMemo();memoFill();}
  else if(UI.view==='me')main.innerHTML=viewMe();
}
function refresh(){renderNav();if(UI.view!=='term')render();}

/* ---------------- Accueil ---------------- */
const TIPS=[
  'Dans CMD, tape une commande suivie de `/?` pour afficher son aide : `robocopy /?`.',
  'Dans PowerShell, `Get-Help Get-Service -Examples` montre des exemples prêts à copier.',
  'La touche Tab complète les noms de commandes et de chemins, dans CMD comme dans PowerShell.',
  'Flèche haut = commande précédente. F7 dans CMD affiche tout l’historique.',
  '`Ctrl+C` interrompt une commande qui tourne (un `ping -t`, par exemple).',
  'Dans PowerShell, `sc` n’est pas sc.exe : c’est l’alias de Set-Content (5.1). Tape `sc.exe`.',
  '`where` dans PowerShell est l’alias de Where-Object. Pour l’outil CMD, tape `where.exe`.',
  'Ajoute `-WhatIf` à une commande PowerShell destructive pour voir ce qu’elle ferait, sans rien faire.',
  'Robocopy renvoie 0 à 7 quand tout va bien. 8 et plus = au moins un échec.',
  'Export-Csv avec `-Delimiter \';\'` ouvre proprement dans un Excel français.',
  'Une adresse en 169.254.x.x (APIPA) signifie que le poste n’a pas obtenu de bail DHCP.',
  'Win+R puis Ctrl+Maj+Entrée ouvre l’outil tapé en tant qu’administrateur.',
  '`whoami /groups | findstr /i "niveau"` indique si ton invite est élevée (Niveau obligatoire élevé).',
  'L’événement 4740 sur le contrôleur PDC indique quel poste a verrouillé un compte.',
  '`gpresult /h C:\\Temp\\gpo.html` génère un rapport GPO lisible dans un navigateur.',
  '`%~dp0` dans un .bat = le dossier où se trouve le script, quel que soit le dossier courant.',
  'Dans PowerShell, les guillemets doubles remplacent les variables, les simples non : "$env:USERNAME" ≠ \'$env:USERNAME\'.',
  '`Get-Member` (alias gm) liste toutes les propriétés et méthodes d’un objet.',
  'Format-Table et Format-List se placent toujours en fin de pipeline : après, il n’y a plus d’objets.',
  'Le chemin `\\\\PC-COMPTA-02\\C$` ouvre le disque C: d’un poste à distance (partage administratif).'
];
function viewHome(){
  const nx=nextLesson();const st=streakNow();const lv=levelOf(S.xp);
  const h=new Date().getHours();const hi=h<5||h>=18?'Bonsoir':'Bonjour';
  const g=dayXp();const gp=clamp(g/S.goal,0,1);
  const tip=TIPS[(new Date().getDate()+new Date().getMonth()*31)%TIPS.length];
  const cont=nx?`<div class="continue">
      <div class="prompt">PS C:\\Academie&gt; <b>Start-Lecon</b> <i>-Id</i> ${esc(nx.id)}<span class="cursor"></span></div>
      <div class="meta">${tapeOf(nx.track)}<span>${esc(nx.chapter.title)}</span><span>·</span><span>${LVL[nx.level]}</span></div>
      <h2>${esc(nx.title)}</h2>
      <p style="color:#B9C7DE">${esc(nx.desc)}</p>
      <button class="btn primary" data-act="open" data-id="${nx.id}">${ic('play')}${Object.keys(S.done).length?'Continuer':'Commencer'}</button>
    </div>`:`<div class="continue"><div class="prompt">PS C:\\Academie&gt; <b>Get-Lecon</b> <i>-Restantes</i></div><h2>Toutes les leçons sont terminées.</h2><p style="color:#B9C7DE">Révise, relève les défis du terminal, ou refais une piste pour garder le niveau.</p><button class="btn primary" data-act="review">${ic('refresh')}Révision express</button></div>`;
  return `<div class="view">
    <div class="topbar"><div class="brand" style="display:flex"><span class="brand-mark">C:\\<b>&gt;</b>_</span><span>Académie</span></div>
      <div class="chips-row"><span class="stat-chip streak" title="Série de jours">${ic('flame')}${st}</span><span class="stat-chip xp" title="Points d’expérience">${ic('bolt')}<span class="tnum">${S.xp}</span> XP</span></div></div>
    <div class="hello"><h1>${hi}, <span>${esc(Cloud.on&&Cloud.name()?Cloud.name():lv.name.toLowerCase())}</span>.</h1><p class="muted" style="margin-top:6px">CMD et PowerShell pour l’admin du quotidien : postes, réseau, domaine, scripts. Des leçons de 3 à 6 minutes.</p></div>
    ${Cloud.available()&&Cloud.ready&&!Cloud.user?`<div class="panel acct-cta"><div><b>Crée ton compte gratuit</b><span class="small muted">Retrouve ta progression sur téléphone, tablette et ordinateur.</span></div><button class="btn primary sm" data-act="acct-go" data-id="signup">Créer un compte</button></div>`:''}
    ${cont}
    <div class="panel goal"><div class="goal-top"><span class="eyebrow">Objectif du jour</span><span><b class="tnum">${g}</b> / ${S.goal} XP</span></div><div class="meter tape"><i style="width:${gp*100}%"></i></div><span class="small muted">${g>=S.goal?'Objectif atteint. La série continue demain.':'Une leçon rapporte 10 à 20 XP.'}</span></div>
    <div class="quick">
      <button data-act="nav" data-to="term">${ic('terminal')}<b>Terminal</b><span>Simulateur CMD et PowerShell + défis</span></button>
      <button data-act="review">${ic('refresh')}<b>Révision</b><span>8 questions tirées de tes leçons</span></button>
      <button data-act="nav" data-to="memo">${ic('book')}<b>Mémo</b><span>Chaque commutateur, lettre par lettre</span></button>
    </div>
    <div class="section-h"><h2>Pistes</h2><span class="small muted">${ALL.length} leçons</span></div>
    <div class="tracks">${TRACKS.map(T=>{const p=trackProgress(T);return `<button class="track-card" data-act="track" data-id="${T.id}">${tapeOf(T)}<h3>${esc(T.title)}</h3><p>${esc(T.desc)}</p><div class="meter ok"><i style="width:${p.p*100}%"></i></div><div class="row"><span class="tnum">${p.d}/${p.n} leçons</span><span>${p.p>=1?'Terminée':''}</span></div></button>`;}).join('')}</div>
    <div class="tip-card"><span class="eyebrow">Le saviez-vous ?</span><p>${inl(tip)}</p></div>
  </div>`;
}

/* ---------------- Parcours ---------------- */
function viewPath(){
  const T=TRACKS.find(t=>t.id===UI.track)||TRACKS[0];const p=trackProgress(T);const nx=nextLesson();
  return `<div class="view">
    <div class="scroller" role="group" aria-label="Pistes">${TRACKS.map(t=>`<button class="chip" data-act="track" data-id="${t.id}" aria-pressed="${t.id===T.id}">${esc(t.title)}</button>`).join('')}</div>
    <div class="track-head"><div class="row">${tapeOf(T)}<span class="small muted tnum">${p.d}/${p.n} terminées</span></div><h1>${esc(T.title)}</h1><p class="muted">${esc(T.desc)}</p><div class="meter ok"><i style="width:${p.p*100}%"></i></div></div>
    <div class="scroller" role="group" aria-label="Niveau">${['Tous',...LVL.slice(1)].map((l,i)=>`<button class="chip" data-act="level" data-lv="${i}" aria-pressed="${UI.level===i}">${l}</button>`).join('')}</div>
    ${T.chapters.map(C=>{const ls=C.lessons.filter(l=>!UI.level||l.level===UI.level);if(!ls.length)return '';
      return `<section class="chapter"><div class="chapter-h"><h3>${esc(C.title)}</h3><span class="rule"></span></div><div class="cable">${ls.map(L=>{
        const d=S.done[L.id];const isN=nx&&nx.id===L.id;
        return `<button class="lesson-row ${d?'done':''} ${isN?'next':''}" data-act="open" data-id="${L.id}"><span class="keycap">${d?ic('check'):(L.mission?ic('ticket'):esc(L.id.toUpperCase()))}</span><span class="lr-body"><b>${esc(L.title)}</b><span>${esc(L.desc)}</span><span class="lr-meta">${L.ticket?`<span class="ticket-no">${esc(L.ticket.no)}</span>`:''}<span class="tape lvl">${LVL[L.level]}</span>${isN?'<span class="tape">Suivante</span>':''}${d&&d.best===1?'<span class="tape ok">Parfait</span>':''}</span></span></button>`;}).join('')}</div></section>`;}).join('')}
  </div>`;
}

/* ---------------- Mémo ---------------- */
function viewMemo(){
  const tabs=[['cmd','CMD'],['ps','PowerShell'],['sym','Symboles'],['eq','CMD ↔ PS']];
  return `<div class="view">
    <div><span class="eyebrow">Référence</span><h1 style="margin-top:4px">Mémo des commandes</h1><p class="muted" style="margin-top:6px">Chaque commutateur décodé : la lettre, le mot anglais d’origine, ce qu’elle fait. Touche « Essayer » pour lancer l’exemple dans le simulateur.</p></div>
    <div class="seg" role="group" aria-label="Catégorie">${tabs.map(t=>`<button data-act="memotab" data-id="${t[0]}" aria-pressed="${UI.memoTab===t[0]}">${t[1]}</button>`).join('')}</div>
    <label class="search">${ic('search')}<span class="sr">Rechercher</span><input id="memoQ" type="search" placeholder="Rechercher : robocopy, /s, -Filter, pipe…" value="${esc(UI.memoQ)}" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
    <div id="memoCats"></div>
    <div id="memoList" class="entries"></div>
  </div>`;
}
function memoFill(){
  const list=$('#memoList');if(!list)return;
  const q=UI.memoQ.trim().toLowerCase();
  const tab=UI.memoTab;
  if(tab==='eq'){
    $('#memoCats').innerHTML='';
    const rows=DICT.eq.filter(r=>!q||(r.cmd+' '+r.ps+' '+r.d).toLowerCase().includes(q));
    list.innerHTML=rows.length?rows.map(r=>`<div class="eq-row"><div class="d">${inl(r.d)}</div><div class="c">${consoleHtml(r.cmd,'cmd',{title:'CMD',tryit:true})}</div><div class="c">${consoleHtml(r.ps,'ps',{title:'PowerShell',tryit:true})}</div></div>`).join(''):`<p class="empty">Aucun résultat pour « ${esc(UI.memoQ)} ».</p>`;
    return;
  }
  const all=DICT[tab]||[];
  const cats=[...new Set(all.map(e=>e.cat))].filter(Boolean);
  $('#memoCats').innerHTML=`<div class="scroller" role="group" aria-label="Thème"><button class="chip" data-act="memocat" data-id="" aria-pressed="${!UI.memoCat}">Tout</button>${cats.map(c=>`<button class="chip" data-act="memocat" data-id="${esc(c)}" aria-pressed="${UI.memoCat===c}">${esc(c)}</button>`).join('')}</div>`;
  const hit=e=>{if(!q)return true;const hay=(e.n+' '+e.d+' '+e.ety+' '+e.alias+' '+e.cat+' '+e.sw.map(s=>s.s+' '+s.mn+' '+s.d).join(' ')+' '+e.notes.join(' ')).toLowerCase();return hay.includes(q);};
  const score=e=>{if(!q)return 0;const n=e.n.toLowerCase();const al=String(e.alias||'').toLowerCase().split(/\s*,\s*/);return n===q||al.includes(q)?0:n.startsWith(q)?1:n.includes(q)?2:3;};
  const rows=all.filter(e=>(!UI.memoCat||e.cat===UI.memoCat)&&hit(e)).map((e,i)=>({e,i,s:score(e)})).sort((a,b)=>a.s-b.s||a.i-b.i).map(x=>x.e);
  const sh=tab==='ps'?'ps':'cmd';
  list.innerHTML=rows.length?rows.map(e=>{
    const open=q&&(rows.length<=3||score(e)===0);
    return `<details class="entry"${open?' open':''}><summary><span class="nm">${esc(e.n)}</span><span class="ds">${inl(e.d)}</span>${ic('chev','chev')}</summary><div class="entry-body">
      ${e.ety?`<div class="ety mn">${tab==='sym'?'Nom : ':'Origine : '}${mnem(e.ety)}</div>`:''}
      ${e.alias?`<div class="ety">Alias : <code class="inline-code">${esc(e.alias)}</code></div>`:''}
      ${e.adm?`<span class="flag">${ic('shield')}${esc(e.adm)}</span>`:''}
      ${e.syn.length?`<div class="syn">${esc(e.syn.join('\n'))}</div>`:''}
      ${e.sw.length?`<div class="sw-list">${e.sw.map(s=>`<div class="sw-row"><div><span class="s">${esc(s.s)}</span>${s.mn?`<span class="mn">${mnem(s.mn)}</span>`:''}</div><div>${inl(s.d)}</div></div>`).join('')}</div>`:''}
      ${e.ex.length?`<div class="ex-list">${e.ex.map(x=>`<div class="ex">${consoleHtml(x.c,x.sh||(tab==='sym'?(/^\s*(\$|Get-|Set-|New-|\[)/.test(x.c)||/\|\s*(Where|Select|ForEach|Sort)/i.test(x.c)?'ps':'cmd'):sh),{tryit:true})}${x.d?`<div class="d">${inl(x.d)}</div>`:''}</div>`).join('')}</div>`:''}
      ${e.notes.map(n=>`<div class="callout tip">${ic('bulb')}<div>${inl(n)}</div></div>`).join('')}
      ${e.see?`<div class="ety">Voir aussi : ${inl(e.see)}</div>`:''}
    </div></details>`;}).join(''):`<p class="empty">Aucun résultat pour « ${esc(UI.memoQ)} ».</p>`;
}

/* ---------------- Profil ---------------- */
function accountPanel(){
  if(!Cloud.available())return '';
  if(!Cloud.ready)return `<div class="panel acct"><span class="small muted">Connexion au serveur de comptes…</span></div>`;
  const msg=`<div id="acctMsg" role="status" aria-live="polite">${acctMsgHtml()}</div>`;
  if(Cloud.user){
    const last=Cloud.lastSync?new Date(Cloud.lastSync).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'';
    const nm=Cloud.name();
    return `<div class="panel acct">
      <div class="acct-head"><span class="avatar sm" aria-hidden="true">${esc(nm.slice(0,2).toUpperCase())}</span><div class="acct-id"><b>${esc(nm)}</b><span class="small muted">${esc(Cloud.user.email||'')}</span></div><span class="pill ${Cloud.offline?'bad':'ok'}">${Cloud.offline?'Hors ligne':'Synchronisé'+(last?' · '+last:'')}</span></div>
      ${msg}
      ${AUTH.mode==='newpass'||AUTH.pwd?`<form class="auth-form" data-form="newpass" novalidate><label>Nouveau mot de passe<span class="pw"><input type="password" name="password" autocomplete="new-password" minlength="8" required><button type="button" class="pw-eye" aria-label="Afficher le mot de passe">Afficher</button></span></label><label>Confirmer<span class="pw"><input type="password" name="password2" autocomplete="new-password" minlength="8" required><button type="button" class="pw-eye" aria-label="Afficher le mot de passe">Afficher</button></span></label><div class="chips-row"><button class="btn primary sm" type="submit">Enregistrer</button><button class="btn sm" type="button" data-act="acct-cancel">Annuler</button></div></form>`:''}
      <div class="chips-row">${AUTH.pwd||AUTH.mode==='newpass'?'':'<button class="btn sm" data-act="acct-pwd">Changer le mot de passe</button>'}<button class="btn sm" data-act="acct-logout">Se déconnecter</button>${AUTH.confirmDel?'':'<button class="btn sm" data-act="acct-del">Supprimer le compte…</button>'}</div>
      ${AUTH.confirmDel?`<div class="confirm"><b>Supprimer définitivement le compte « ${esc(nm)} » ?</b><span class="small">Profil, progression et historique seront effacés du serveur.</span><div class="chips-row"><button class="btn sm bad" data-act="acct-del-yes">Oui, supprimer</button><button class="btn sm" data-act="acct-del-no">Annuler</button></div></div>`:''}
    </div>`;
  }
  const m=AUTH.mode==='signup'||AUTH.mode==='forgot'?AUTH.mode:'login';
  const tabs=`<div class="seg" role="group" aria-label="Compte"><button data-act="acct-mode" data-id="login" aria-pressed="${m==='login'}">Connexion</button><button data-act="acct-mode" data-id="signup" aria-pressed="${m==='signup'}">Créer un compte</button></div>`;
  let form='';
  if(m==='login')form=`<form class="auth-form" data-form="login" novalidate>
      <label>E-mail ou nom d’utilisateur<input type="text" name="login" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" required></label>
      <label>Mot de passe<span class="pw"><input type="password" name="password" autocomplete="current-password" required><button type="button" class="pw-eye" aria-label="Afficher le mot de passe">Afficher</button></span></label>
      <button class="btn primary" type="submit">Se connecter</button>
      <button class="link-btn" type="button" data-act="acct-mode" data-id="forgot">Mot de passe oublié ?</button></form>`;
  else if(m==='signup')form=`<form class="auth-form" data-form="signup" novalidate>
      <label>Nom d’utilisateur<input type="text" name="username" autocomplete="username" autocapitalize="off" spellcheck="false" minlength="3" maxlength="24" pattern="[A-Za-z0-9._\-]{3,24}" required><span class="hint-s">3 à 24 caractères : lettres sans accent, chiffres, . _ -</span></label>
      <label>Adresse e-mail<input type="email" name="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" required></label>
      <label>Mot de passe<span class="pw"><input type="password" name="password" autocomplete="new-password" minlength="8" required><button type="button" class="pw-eye" aria-label="Afficher le mot de passe">Afficher</button></span><span class="hint-s">8 caractères minimum</span></label>
      <label>Confirme le mot de passe<span class="pw"><input type="password" name="password2" autocomplete="new-password" minlength="8" required><button type="button" class="pw-eye" aria-label="Afficher le mot de passe">Afficher</button></span></label>
      <button class="btn primary" type="submit">Créer mon compte</button>
      ${S.xp>0||Object.keys(S.done).length?'<span class="small muted">Ta progression actuelle sera ajoutée à ton nouveau compte.</span>':''}</form>`;
  else form=`<form class="auth-form" data-form="forgot" novalidate>
      <p class="small muted">Saisis l’<b>adresse e-mail</b> utilisée à l’inscription (pas le nom d’utilisateur) : tu recevras un lien pour choisir un nouveau mot de passe. L’envoi peut prendre une ou deux minutes.</p>
      <label>Adresse e-mail<input type="email" name="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" required></label>
      <button class="btn primary" type="submit">Envoyer le lien</button>
      <button class="link-btn" type="button" data-act="acct-mode" data-id="login">Retour à la connexion</button></form>`;
  return `<div class="panel acct"><div class="acct-top"><div><span class="eyebrow">Compte</span><h2 style="margin-top:2px">${m==='signup'?'Crée ton compte':m==='forgot'?'Mot de passe oublié':'Connecte-toi'}</h2><p class="small muted">Ta progression te suit sur tous tes appareils.</p></div>${m==='forgot'?'':tabs}</div>${msg}${form}</div>`;
}
function acctMsgHtml(){return AUTH.err?`<div class="callout warn">${ic('warn')}<div>${esc(AUTH.err)}</div></div>`:AUTH.msg?`<div class="callout tip">${ic('check')}<div>${esc(AUTH.msg)}</div></div>`:'';}
function acctSay(err,msg){AUTH.err=err||'';AUTH.msg=msg||'';const el=$('#acctMsg');if(el)el.innerHTML=acctMsgHtml();}
function historyPanel(){
  if(!Cloud.on||!Cloud.history.length)return '';
  const fmt=d=>new Date(d).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  return `<div class="section-h"><h2>Historique</h2><span class="small muted">Enregistré sur ton compte</span></div>
    <div class="panel hist">${Cloud.history.map(h=>{const L=byId[h.lesson_id];return `<div class="hist-row"><span class="tape ${h.mode==='mission'?'ms':h.mode==='review'?'lvl':''}">${h.mode==='mission'?'Ticket':h.mode==='review'?'Révision':'Leçon'}</span><span class="hist-t">${esc(L?L.title:(h.mode==='review'?'Révision express':h.lesson_id))}</span><span class="small muted tnum">${h.accuracy!=null?h.accuracy+'% · ':''}+${h.xp} XP · ${fmt(h.completed_at)}</span></div>`;}).join('')}</div>`;
}
async function acctAction(act,id){
  if(act==='acct-go'){AUTH.mode=id||'signup';AUTH.err='';AUTH.msg='';go('me');return;}
  if(act==='acct-mode'){AUTH.mode=id;AUTH.err='';AUTH.msg='';render();return;}
  if(act==='acct-pwd'){AUTH.pwd=true;AUTH.err='';AUTH.msg='';render();return;}
  if(act==='acct-cancel'){AUTH.pwd=false;if(AUTH.mode==='newpass')AUTH.mode='login';AUTH.err='';AUTH.msg='';render();return;}
  if(act==='acct-del'){AUTH.confirmDel=true;render();return;}
  if(act==='acct-del-no'){AUTH.confirmDel=false;render();return;}
  if(!Cloud.sb)return;
  if(act==='acct-logout'){try{await Cloud.flush();}catch(e){}await Cloud.sb.auth.signOut();toast('Déconnecté.');return;}
  if(act==='acct-del-yes'){
    const r=await Cloud.sb.functions.invoke('delete-account',{method:'POST'});
    if(r.error||!(r.data&&r.data.ok)){AUTH.confirmDel=false;render();acctSay(authErr((r.data&&r.data.error)||r.error));return;}
    Cloud.on=false;await Cloud.sb.auth.signOut();toast('Compte supprimé.');return;
  }
}
main.addEventListener('click',e=>{const b=e.target.closest('.pw-eye');if(!b)return;const i=b.previousElementSibling;if(!i)return;const show=i.type==='password';i.type=show?'text':'password';b.textContent=show?'Masquer':'Afficher';b.setAttribute('aria-label',show?'Masquer le mot de passe':'Afficher le mot de passe');});
main.addEventListener('submit',async e=>{
  const f=e.target.closest('form[data-form]');if(!f)return;
  e.preventDefault();if(!Cloud.sb||AUTH.busy)return;
  const kind=f.dataset.form;const fd=new FormData(f);const v=k=>String(fd.get(k)||'').trim();
  const btn=f.querySelector('button[type="submit"]');const label=btn?btn.textContent:'';
  const busy=b=>{AUTH.busy=b;if(btn){btn.disabled=b;btn.textContent=b?'Patiente…':label;}};
  const redirect=location.origin+location.pathname;
  acctSay('','');busy(true);
  try{
    if(kind==='login'){
      const id=v('login'),pwd=String(fd.get('password')||'');
      if(!id||!pwd){acctSay('Renseigne ton e-mail (ou nom d’utilisateur) et ton mot de passe.');return;}
      let email=id;
      if(!id.includes('@')){
        const q=await Cloud.sb.rpc('resolve_login',{p_login:id,p_password:pwd});
        if(q.error){acctSay(authErr(q.error));return;}
        if(!q.data){acctSay('Identifiant ou mot de passe incorrect. Après 10 essais, ce nom d’utilisateur est bloqué 15 minutes.');return;}
        email=q.data;
      }
      const r=await Cloud.sb.auth.signInWithPassword({email,password:pwd});
      if(r.error){acctSay(authErr(r.error));return;}
      AUTH.mode='login';toast('Connecté. Progression synchronisée.');
    }else if(kind==='signup'){
      const u=v('username'),em=v('email'),pw=String(fd.get('password')||'');
      if(!/^[A-Za-z0-9._-]{3,24}$/.test(u)){acctSay('Nom d’utilisateur : 3 à 24 caractères, lettres sans accent, chiffres, point, tiret ou soulignement.');return;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){acctSay('Adresse e-mail invalide.');return;}
      if(pw.length<8){acctSay('Mot de passe : 8 caractères minimum.');return;}
      if(pw!==String(fd.get('password2')||'')){acctSay('Les deux mots de passe ne correspondent pas.');return;}
      const a=await Cloud.sb.rpc('username_available',{p_username:u});
      if(a.error){acctSay(authErr(a.error));return;}
      if(a.data===false){acctSay('Ce nom d’utilisateur est déjà pris.');return;}
      const r=await Cloud.sb.auth.signUp({email:em,password:pw,options:{data:{username:u},emailRedirectTo:redirect}});
      if(r.error){acctSay(authErr(r.error));return;}
      if(r.data&&r.data.user&&Array.isArray(r.data.user.identities)&&r.data.user.identities.length===0){acctSay('Un compte existe déjà avec cette adresse e-mail.');return;}
      if(!r.data.session){AUTH.mode='login';render();acctSay('','Compte créé. Ouvre le lien de confirmation reçu par e-mail, puis connecte-toi ici.');return;}
      toast('Compte créé. Bienvenue, '+u+' !');
    }else if(kind==='forgot'){
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))){acctSay('Adresse e-mail invalide.');return;}
      const r=await Cloud.sb.auth.resetPasswordForEmail(v('email'),{redirectTo:redirect});
      if(r.error){acctSay(authErr(r.error));return;}
      acctSay('','Si un compte existe pour cette adresse, un lien vient d’être envoyé. Pense à vérifier les indésirables.');
    }else if(kind==='newpass'){
      const p1=String(fd.get('password')||''),p2=String(fd.get('password2')||'');
      if(p1.length<8){acctSay('Mot de passe : 8 caractères minimum.');return;}
      if(p1!==p2){acctSay('Les deux mots de passe ne correspondent pas.');return;}
      const r=await Cloud.sb.auth.updateUser({password:p1});
      if(r.error){acctSay(authErr(r.error));return;}
      AUTH.pwd=false;AUTH.mode='login';render();acctSay('','Mot de passe modifié.');
    }
  }catch(err){acctSay(authErr(err));}
  finally{busy(false);}
});
let confirmReset=false;
function viewMe(){
  const lv=levelOf(S.xp);const n=Object.keys(S.done).length;const acc=S.stats.ans?Math.round(S.stats.ok/S.stats.ans*100):0;
  const pp=lv.to?clamp((S.xp-lv.from)/(lv.to-lv.from),0,1):1;
  return `<div class="view">
    <div class="profile-head"><div class="avatar">&gt;_</div><div><span class="eyebrow">Niveau ${lv.i}${Cloud.on&&Cloud.name()?' · '+esc(Cloud.name()):''}</span><h1 style="margin:2px 0 6px">${esc(lv.name)}</h1><div class="meter tape" style="max-width:360px"><i style="width:${pp*100}%"></i></div><p class="small muted" style="margin-top:6px">${lv.to?`${lv.to-S.xp} XP avant « ${esc(lv.next)} »`:'Niveau maximum atteint.'}</p></div></div>
    ${accountPanel()}
    <div class="stat-grid">
      <div class="stat"><b class="tnum">${S.xp}</b><span>XP au total</span></div>
      <div class="stat"><b class="tnum">${streakNow()}</b><span>Jours de suite</span></div>
      <div class="stat"><b class="tnum">${n}<small class="muted" style="font-size:.9rem">/${ALL.length}</small></b><span>Leçons terminées</span></div>
      <div class="stat"><b class="tnum">${acc}%</b><span>Bonnes réponses</span></div>
      <div class="stat"><b class="tnum">${S.stats.cmds}</b><span>Commandes tapées</span></div>
      <div class="stat"><b class="tnum">${Object.keys(S.missions).length}</b><span>Défis du terminal</span></div>
    </div>
    ${historyPanel()}
    <div class="section-h"><h2>Badges</h2><span class="small muted tnum">${Object.keys(S.badges).length}/${BADGES.length}</span></div>
    <div class="badges">${BADGES.map(b=>`<div class="badge ${S.badges[b.id]?'got':''}"><span class="ico">${ic(b.ico)}</span><b>${esc(b.t)}</b><span>${esc(b.d)}</span></div>`).join('')}</div>
    <div class="section-h"><h2>Réglages</h2></div>
    <div class="panel settings">
      <div class="set-row"><span class="lbl">Thème</span><div class="seg" role="group" aria-label="Thème">${[['system','Système'],['light','Clair'],['dark','Sombre']].map(t=>`<button data-act="theme" data-id="${t[0]}" aria-pressed="${S.theme===t[0]}">${t[1]}</button>`).join('')}</div></div>
      <div class="set-row"><span class="lbl">Objectif quotidien</span><div class="seg" role="group" aria-label="Objectif">${[10,20,30,50].map(g=>`<button data-act="goal" data-id="${g}" aria-pressed="${S.goal===g}">${g} XP</button>`).join('')}</div></div>
      <div class="set-row"><span class="lbl">Synchronisation</span><span class="small" style="display:flex;align-items:center;gap:8px"><span class="sync-dot ${Sync.on?'on':''}"></span>${Sync.on||Cloud.on?'Active : ta progression suit ton compte sur téléphone et ordinateur.':'Locale : la progression reste dans ce navigateur.'}</span></div>
      <div class="set-row"><span class="lbl">Réinitialiser</span>${confirmReset?'':'<button class="btn sm" data-act="reset">Tout effacer…</button>'}</div>
      ${confirmReset?`<div class="confirm"><b>Effacer XP, leçons, badges et série ?</b><span class="small">Cette action est définitive${Sync.on||Cloud.on?', y compris sur tes autres appareils':''}.</span><div class="chips-row"><button class="btn sm bad" data-act="reset-yes">Oui, tout effacer</button><button class="btn sm" data-act="reset-no">Annuler</button></div></div>`:''}
    </div>
  </div>`;
}
function applyTheme(){const r=document.documentElement;if(S.theme==='light'||S.theme==='dark')r.setAttribute('data-theme',S.theme);else r.removeAttribute('data-theme');}

/* actions de la vue principale */
main.addEventListener('click',e=>{
  const a=e.target.closest('[data-act]');if(!a)return;
  const act=a.dataset.act,id=a.dataset.id;
  if(act==='open'){const L=byId[id];if(L)openLesson(L);}
  else if(act==='track'){UI.track=id;UI.level=0;go('path');}
  else if(act==='level'){UI.level=+a.dataset.lv;render();}
  else if(act==='nav'){go(a.dataset.to);}
  else if(act==='review'){openReview();}
  else if(act==='memotab'){UI.memoTab=id;UI.memoCat='';render();}
  else if(act==='memocat'){UI.memoCat=id;memoFill();}
  else if(act==='theme'){S.theme=id;applyTheme();persist();render();}
  else if(act==='goal'){S.goal=+id;persist();render();}
  else if(act==='reset'){confirmReset=true;render();}
  else if(act==='reset-no'){confirmReset=false;render();}
  else if(act==='reset-yes'){const th=S.theme,ow=S.owner;S=defState();S.theme=th;if(ow)S.owner=ow;confirmReset=false;persist();Sync.push(true);Cloud.push(true);render();toast('Progression effacée.');}
  else if(act&&act.startsWith('acct-')){acctAction(act,id);}
  else if(act==='shell'){setShell(id);}
  else if(act==='termclear'){T_.lines=[];paintTerm();}
});
main.addEventListener('input',e=>{if(e.target.id==='memoQ'){UI.memoQ=e.target.value;memoFill();}});
wireCommon(main);

/* =========================================================
   Lecteur de leçon
   ========================================================= */
const player=$('#player'),pBody=$('#pBody'),pFoot=$('#pFoot'),pFb=$('#pFb'),pAct=$('#pActions'),pBar=$('#pBar'),pXp=$('#pXp');
$('#pClose').innerHTML=ic('x');
wireCommon(pBody);
const P={L:null,queue:[],idx:0,total:0,done:0,exN:0,firstOk:0,errors:0,mode:'lesson',ctrl:null,state:'',quit:false,t0:0,seen:new Set()};
function openLesson(L,mode){
  P.L=L;P.mode=mode||'lesson';P.queue=L.cards.map((c,i)=>({c,i,tries:0}));P.idx=0;P.total=L.cards.length;P.done=0;
  P.exN=L.cards.filter(isEx).length;P.firstOk=0;P.errors=0;P.quit=false;P.t0=Date.now();P.seen=new Set();P.sim=null;
  player.hidden=false;document.body.style.overflow='hidden';
  renderCard();
}
function openReview(){
  let pool=[];const src=ALL.filter(l=>S.done[l.id]);const base=src.length>=3?src:ALL.slice(0,Math.max(6,src.length));
  base.forEach(L=>L.cards.forEach(c=>{if(c.t==='qcm'||c.t==='fill'||c.t==='order')pool.push(Object.assign({},c,{_from:L}));}));
  pool=shuffle(pool).slice(0,8);
  if(!pool.length){toast('Termine une leçon d’abord.');return;}
  const R={id:'review',title:'Révision express',level:1,desc:'',cards:pool,track:{id:'base',tape:'base'},chapter:{title:'Révision'}};
  openLesson(R,'review');
}
function closePlayer(){player.hidden=true;document.body.style.overflow='';pBody.innerHTML='';render();}
$('#pClose').addEventListener('click',()=>{
  if(P.state==='result'||P.done===0){closePlayer();return;}
  P.quit=true;showQuit();
});
function showQuit(){
  pFoot.className='pfoot';
  pFb.innerHTML=`<div class="fb"><div class="fb-h">${ic('warn')}Quitter la leçon ?</div><div class="fb-b">Ta progression dans cette leçon sera perdue.</div></div>`;
  pAct.innerHTML=`<button class="btn" data-p="stay">Rester</button><button class="btn bad" data-p="quit">Quitter</button>`;
}
function setBar(){pBar.style.width=(P.total?P.done/P.total*100:0)+'%';pXp.textContent=P.mode==='review'?'Révision':'';}
function renderCard(){
  setBar();P.quit=false;
  const item=P.queue[P.idx];
  if(!item){return finish();}
  const c=item.c;P.state='answer';
  pFoot.className='pfoot';pFb.innerHTML='';
  const L=c._from||P.L;
  let head=`<div class="kind-row">${tapeOf(L.track)}<span class="tape lvl">${KIND[c.t]||c.t}</span>${item.tries?'<span class="tape" title="Question revue">À revoir</span>':''}${c._from?`<span class="small muted">${esc(c._from.title)}</span>`:''}</div>`;
  if(item.i===0&&!item.tries&&P.L.ticket&&P.mode==='lesson'){const t=P.L.ticket;head+=`<div class="ticket"><div class="t-top"><span>${ic('ticket','')} ${esc(t.no)}</span><span class="prio">${esc(t.prio)}</span></div><div class="t-body"><b>${esc(t.subj||P.L.title)}</b><dl><dt>Service</dt><dd>${esc(t.svc)}</dd><dt>Demandeur</dt><dd>${esc(t.who)}</dd></dl></div></div>`;}
  pBody.innerHTML=`<div class="pcard" id="pcard">${head}</div>`;
  pBody.scrollTop=0;
  const root=$('#pcard');
  P.ctrl=(R[c.t]||R.info)(c,root);
  footAnswer();
}
function footAnswer(){
  const c=P.queue[P.idx].c;
  if(c.t==='info'){pAct.innerHTML=`<button class="btn primary block" data-p="next">Continuer</button>`;}
  else{pAct.innerHTML=`<button class="btn primary block" data-p="check" ${P.ctrl.ready()?'':'disabled'}>Vérifier</button>`;}
}
function updReady(){const b=pAct.querySelector('[data-p="check"]');if(b)b.disabled=!P.ctrl.ready();}
pFoot.addEventListener('click',e=>{
  const b=e.target.closest('[data-p]');if(!b)return;const a=b.dataset.p;
  if(a==='next'){advance(true);}
  else if(a==='check'){doCheck();}
  else if(a==='cont'){advance(P.lastOk);}
  else if(a==='stay'){P.quit=false;if(P.state==='feedback'){showFeedbackAgain();}else{pFb.innerHTML='';footAnswer();}}
  else if(a==='quit'){closePlayer();}
  else if(a==='res-next'){const n=P.nextL;closePlayer();if(n)openLesson(n);}
  else if(a==='res-close'){closePlayer();}
  else if(a==='res-again'){const L=P.L;closePlayer();if(P.mode==='review')openReview();else openLesson(L);}
});
let lastFb=null;
function doCheck(){
  if(!P.ctrl.ready())return;
  const item=P.queue[P.idx];const r=P.ctrl.check();
  S.stats.ans++;if(r.ok)S.stats.ok++;
  P.lastOk=r.ok;
  if(r.ok){if(!item.tries)P.firstOk++;}
  else{P.errors++;}
  P.state='feedback';
  const c=item.c;
  const expl=c.expl.length?c.expl.map(x=>`<p>${inl(x)}</p>`).join(''):'';
  lastFb={ok:r.ok,html:r.ok?`<div class="fb ok"><div class="fb-h">${ic('check')}${pick(['Exact !','Bien vu !','Parfait.','Juste !','Validé.'])}</div>${expl?`<div class="fb-b">${expl}</div>`:''}</div>`:`<div class="fb bad"><div class="fb-h">${ic('x')}Pas tout à fait</div>${r.answer?`<div class="fb-ans">${esc(r.answer)}</div>`:''}${expl?`<div class="fb-b">${expl}</div>`:''}</div>`};
  showFeedbackAgain();
  if(navigator.vibrate&&!r.ok){try{navigator.vibrate(60);}catch(e){}}
}
function showFeedbackAgain(){
  pFoot.className='pfoot '+(lastFb.ok?'state-ok':'state-bad');
  pFb.innerHTML=lastFb.html;
  pAct.innerHTML=`<button class="btn ${lastFb.ok?'ok':'bad'} block" data-p="cont">Continuer</button>`;
  const btn=pAct.querySelector('button');if(btn&&!('ontouchstart' in window))btn.focus({preventScroll:true});
}
const pick=a=>a[Math.random()*a.length|0];
function advance(ok){
  const item=P.queue[P.idx];
  if(ok||item.c.t==='info'||item.tries>=2){P.done++;}
  else{P.queue.push({c:item.c,i:item.i,tries:item.tries+1});}
  P.idx++;renderCard();
}
function finish(){
  P.state='result';setBar();pBar.style.width='100%';
  const L=P.L;const acc=P.exN?Math.round(P.firstOk/P.exN*100):100;const perfect=P.errors===0;
  let xp=0;
  if(P.mode==='review'){xp=P.firstOk*2+3;}
  else{
    const first=!S.done[L.id];
    xp=first?(L.mission?15:10)+(perfect?5:0):4;
    const prev=S.done[L.id];const best=Math.max(prev?prev.best||0:0,P.exN?P.firstOk/P.exN:1);
    S.done[L.id]={best:Math.round(best*100)/100,d:today()};
    if(first)S.stats.lessons++;
    if(perfect)S.stats.perfect++;
  }
  addXp(xp);
  try{Cloud.log(P.mode==='review'?'review':L.id,P.mode==='review'?'review':(L.mission?'mission':'lesson'),xp,acc);}catch(e){}
  const nb=checkBadges();persist();
  const secs=Math.round((Date.now()-P.t0)/1000);const mm=Math.floor(secs/60),ss=secs%60;
  P.nextL=P.mode==='review'?null:nextLesson(L);
  pFoot.className='pfoot';pFb.innerHTML='';
  pBody.innerHTML=`<div class="result">
    <div class="trophy">${ic(perfect?'trophy':'check')}</div>
    <div><span class="eyebrow">${P.mode==='review'?'Révision terminée':(L.mission?'Ticket résolu':'Leçon terminée')}</span><h2 style="margin-top:6px">${esc(L.title)}</h2></div>
    <div class="big tnum" id="xpCount">+0 XP</div>
    <div class="res-stats"><div><b class="tnum">${acc}%</b><span>Justes du 1er coup</span></div><div><b class="tnum">${mm}:${String(ss).padStart(2,'0')}</b><span>Durée</span></div><div><b class="tnum">${streakNow()}</b><span>Jours de suite</span></div></div>
    ${nb.length?`<div class="panel" style="width:100%;display:grid;gap:8px;text-align:left"><span class="eyebrow">Nouveau badge</span>${nb.map(b=>`<div style="display:flex;gap:10px;align-items:center"><span class="badge got" style="padding:0;border:0;background:none"><span class="ico">${ic(b.ico)}</span></span><div><b>${esc(b.t)}</b><div class="small muted">${esc(b.d)}</div></div></div>`).join('')}</div>`:''}
  </div>`;
  pAct.innerHTML=P.nextL?`<button class="btn" data-p="res-close">Fermer</button><button class="btn primary" data-p="res-next">Leçon suivante</button>`:`<button class="btn" data-p="res-again">Recommencer</button><button class="btn primary" data-p="res-close">Terminer</button>`;
  const el=$('#xpCount');let v=0;const step=()=>{v=Math.min(xp,v+Math.max(1,Math.ceil(xp/20)));el.textContent='+'+v+' XP';if(v<xp)requestAnimationFrame(step);};
  if(reduceMotion)el.textContent='+'+xp+' XP';else requestAnimationFrame(step);
}

/* ---------------- Rendus des cartes ---------------- */
const SYMS={cmd:['\\','/','..','*','|','>','>>','"','%','&&',':','-','.','?','^','2>nul','Tab'],ps:['-','$','$_','|','{','}','(',')','"',"'",'\\','.','*','@',',','=',';','`','Tab']};
function symbarHtml(sh){return `<div class="symbar" role="toolbar" aria-label="Symboles">${SYMS[sh].filter(s=>s!=='Tab').map(s=>`<button type="button" data-sym="${esc(s)}" class="${s.length>2?'wordy':''}">${esc(s)}</button>`).join('')}</div>`;}
function insertAt(inp,txt){
  const s=inp.selectionStart!=null?inp.selectionStart:inp.value.length,e=inp.selectionEnd!=null?inp.selectionEnd:inp.value.length;
  inp.value=inp.value.slice(0,s)+txt+inp.value.slice(e);const p=s+txt.length;
  try{inp.setSelectionRange(p,p);}catch(_){}
  inp.dispatchEvent(new Event('input',{bubbles:true}));
}
const PS_ALIAS={where:'where-object','?':'where-object',select:'select-object',sort:'sort-object',foreach:'foreach-object','%':'foreach-object',ft:'format-table',fl:'format-list',gci:'get-childitem',ls:'get-childitem',dir:'get-childitem',gsv:'get-service',gps:'get-process',ps:'get-process',gm:'get-member',measure:'measure-object',group:'group-object',cd:'set-location',sl:'set-location',chdir:'set-location',cat:'get-content',gc:'get-content',type:'get-content',echo:'write-output',write:'write-output',cls:'clear-host',clear:'clear-host',rm:'remove-item',del:'remove-item',ri:'remove-item',erase:'remove-item',rd:'remove-item',rmdir:'remove-item',cp:'copy-item',copy:'copy-item',cpi:'copy-item',mv:'move-item',move:'move-item',mi:'move-item',ni:'new-item',gcm:'get-command',help:'get-help',man:'get-help',gal:'get-alias',pwd:'get-location',gl:'get-location',sls:'select-string',epcsv:'export-csv',ipcsv:'import-csv',gcim:'get-ciminstance',kill:'stop-process',spps:'stop-process',sasv:'start-service',spsv:'stop-service',tnc:'test-netconnection',ogv:'out-gridview',gi:'get-item',gp:'get-itemproperty',sp:'set-itemproperty',ren:'rename-item',rni:'rename-item',iwr:'invoke-webrequest',gwmi:'get-wmiobject'};
function normCmd(s,sh){
  s=String(s).replace(/[’‘´]/g,"'").replace(/[“”«»]/g,'"').trim().replace(/\s+/g,' ');
  s=s.replace(/\s*([|;,(){}=])\s*/g,'$1').replace(/;+$/,'').toLowerCase().replace(/'/g,'"');
  if(sh==='ps'){
    s=s.replace(/\$psitem\b/g,'$_');
    s=s.replace(/(^|[|(;])([^\s|(;{]+)/g,(m,a,w)=>a+(PS_ALIAS[w]||w));
  }else{
    s=s.replace(/^cd\.\./,'cd ..').replace(/^cd\\/,'cd \\');
  }
  return s;
}
function anyMatch(val,c,sh){
  const n=normCmd(val,sh);
  if(c.ans.some(a=>normCmd(a,sh)===n))return true;
  const col=String(val).trim().replace(/\s+/g,' ');
  return c.re.some(r=>{try{return new RegExp(r,'i').test(col);}catch(e){return false;}});
}
const R={
  info(c,root){root.insertAdjacentHTML('beforeend',`<h2>${inl(c.q)}</h2><div class="prose">${bodyHtml(c.body)}</div>`);return{ready:()=>true,check:()=>({ok:true})};},
  qcm(c,root){
    const opts=shuffle(c.opts);let sel=-1;
    root.insertAdjacentHTML('beforeend',`<h2>${inl(c.q)}</h2>${c.body.length?`<div class="prose">${bodyHtml(c.body)}</div>`:''}<div class="opts" role="radiogroup">${opts.map((o,i)=>`<button type="button" class="opt" role="radio" aria-checked="false" aria-pressed="false" data-o="${i}"><span class="letter">${'ABCDEF'[i]}</span><span class="txt">${inl(o.text)}</span></button>`).join('')}</div>`);
    const box=root.querySelector('.opts');
    const choose=i=>{if(P.state!=='answer')return;sel=i;$$('.opt',box).forEach(b=>{const on=+b.dataset.o===i;b.setAttribute('aria-pressed',on);b.setAttribute('aria-checked',on);});updReady();};
    box.addEventListener('click',e=>{const b=e.target.closest('.opt');if(b)choose(+b.dataset.o);});
    return{ready:()=>sel>=0,choose,n:opts.length,check:()=>{
      const ok=opts[sel].ok;
      $$('.opt',box).forEach(b=>{const o=opts[+b.dataset.o];b.disabled=true;if(o.ok)b.classList.add('right');else if(+b.dataset.o===sel)b.classList.add('wrong');});
      return{ok,answer:ok?'':opts.filter(o=>o.ok).map(o=>o.text.replace(/`/g,'')).join(' / ')};}};
  },
  fill(c,root){
    const sh=c.sh==='ps'?'ps':'cmd';
    const code=(c.body.find(b=>b.k==='code'||b.k==='script')||{src:''}).src;
    const other=c.body.filter(b=>!(b.k==='code'||b.k==='script'));
    const parts=code.split('___');const nb=parts.length-1;
    const pool=shuffle([...c.ans,...[...new Set(c.tokens)].filter(t=>!c.ans.includes(t))]);
    const fill=new Array(nb).fill(null);let active=0;
    const pr=sh==='ps'?'PS C:\\&gt; ':'C:\\&gt;';
    root.insertAdjacentHTML('beforeend',`<h2>${inl(c.q)}</h2>${other.length?`<div class="prose">${bodyHtml(other)}</div>`:''}<div class="console ${sh}"><div class="bar"><span class="ttl">${SHNAME[sh]}</span></div><pre class="fillcode"></pre></div><div class="tok-pool" id="fpool"></div>`);
    const pre=root.querySelector('.fillcode'),poolEl=root.querySelector('#fpool');
    function paint(){
      let h='';for(let i=0;i<parts.length;i++){
        let seg=parts[i];
        h+=seg.split('\n').map((l,k)=>((i===0||k>0)&&l.trim()&&!/^\s*(#|rem\b|::)/i.test(l)&&c.body.some(b=>b.k==='code')?`<span class="pr">${pr}</span>`:'')+hlLine(l,sh)).join('\n');
        if(i<nb)h+=`<button type="button" class="blank ${fill[i]!=null?'filled':''} ${active===i&&fill[i]==null?'active':''}" data-b="${i}">${fill[i]!=null?esc(pool[fill[i]]):'&nbsp;'}</button>`;
      }
      pre.innerHTML=h;
      poolEl.innerHTML=pool.map((t,i)=>`<button type="button" class="tok ${fill.includes(i)?'used':''}" data-t="${i}">${esc(t)}</button>`).join('');
      updReady();
    }
    root.addEventListener('click',e=>{
      if(P.state!=='answer')return;
      const b=e.target.closest('[data-b]');if(b){const i=+b.dataset.b;if(fill[i]!=null){fill[i]=null;}active=i;paint();return;}
      const t=e.target.closest('[data-t]');if(t){const ti=+t.dataset.t;let slot=fill[active]==null?active:fill.indexOf(null);if(slot<0)return;fill[slot]=ti;const nx=fill.indexOf(null);active=nx<0?slot:nx;paint();}
    });
    paint();
    return{ready:()=>fill.every(v=>v!=null),check:()=>{
      const ok=fill.every((v,i)=>String(pool[v]).trim().toLowerCase()===String(c.ans[i]).trim().toLowerCase());
      let i=0;const ans=code.replace(/___/g,()=>c.ans[i++]||'');
      return{ok,answer:ok?'':ans};}};
  },
  order(c,root){
    const sh=c.sh==='ps'?'ps':'cmd';
    const toks=shuffle([...c.tokens,...c.extra].map((t,i)=>({t,i})));const seq=[];
    const pr=sh==='ps'?'PS C:\\&gt;':'C:\\&gt;';
    root.insertAdjacentHTML('beforeend',`<h2>${inl(c.q)}</h2>${c.body.length?`<div class="prose">${bodyHtml(c.body)}</div>`:''}<div class="answer-line ${sh}" id="oline"></div><div class="tok-pool" id="opool"></div>`);
    const line=root.querySelector('#oline'),pool=root.querySelector('#opool');
    function paint(){
      line.innerHTML=`<span class="pr">${pr}</span>`+(seq.length?seq.map((k,j)=>`<button type="button" class="tok" data-s="${j}">${esc(toks[k].t)}</button>`).join(''):'<span class="ph-txt">Touche les blocs dans l’ordre…</span>');
      pool.innerHTML=toks.map((x,k)=>`<button type="button" class="tok ${seq.includes(k)?'used':''}" data-k="${k}">${esc(x.t)}</button>`).join('');
      updReady();
    }
    root.addEventListener('click',e=>{
      if(P.state!=='answer')return;
      const s=e.target.closest('[data-s]');if(s){seq.splice(+s.dataset.s,1);paint();return;}
      const k=e.target.closest('[data-k]');if(k){const i=+k.dataset.k;if(!seq.includes(i)){seq.push(i);paint();}}
    });
    paint();
    return{ready:()=>seq.length===c.tokens.length,check:()=>{
      const got=seq.map(k=>toks[k].t);const ok=got.length===c.tokens.length&&got.every((t,i)=>t===c.tokens[i]);
      return{ok,answer:ok?'':c.tokens.join(' ')};}};
  },
  type(c,root){
    const sh=c.sh==='ps'?'ps':'cmd';
    const pr=sh==='ps'?'PS C:\\Users\\it.tech&gt;':'C:\\Users\\it.tech&gt;';
    root.insertAdjacentHTML('beforeend',`<h2>${inl(c.q)}</h2>${c.body.length?`<div class="prose">${bodyHtml(c.body)}</div>`:''}
      <div class="console ${sh} typebox"><div class="bar"><span class="ttl">${SHNAME[sh]} — à toi de taper</span></div>
      <label class="line"><span class="pr">${pr}</span><input id="tin" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="Commande à taper"></label>
      ${symbarHtml(sh)}<pre class="out" id="tout" hidden></pre></div>
      ${c.hint?`<div class="hint" id="hintBox"><button type="button" class="hint-btn" id="hintBtn">Afficher un indice</button></div>`:''}`);
    const inp=root.querySelector('#tin');
    inp.addEventListener('input',updReady);
    inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(P.state==='answer')doCheck();else if(P.state==='feedback')advance(P.lastOk);}});
    root.querySelector('.symbar').addEventListener('click',e=>{const b=e.target.closest('[data-sym]');if(b&&P.state==='answer'){insertAt(inp,b.dataset.sym);inp.focus();}});
    const hb=root.querySelector('#hintBtn');if(hb)hb.addEventListener('click',()=>{$('#hintBox').innerHTML=`<span>${ic('bulb')}</span> ${inl(c.hint)}`;});
    if(!('ontouchstart' in window))setTimeout(()=>inp.focus({preventScroll:true}),50);
    return{ready:()=>inp.value.trim().length>0,check:()=>{
      const ok=anyMatch(inp.value,c,sh);inp.readOnly=true;
      const out=root.querySelector('#tout');
      if(ok&&c.out){out.hidden=false;out.textContent='';typeOut(out,c.out);}
      else if(ok){try{if(!P.sim&&window.AcademieSim){P.sim=window.AcademieSim.create({help:helpFromDict});}const sm=P.sim;if(sm){if(sm.shell()!==sh)sm.switchTo(sh);const r=sm.run(inp.value);const ls=(r.lines||[]).filter(l=>l.s!=null);if(ls.length&&!ls.some(l=>l.c==='t-err')){const txt=ls.map(l=>l.s).join('\n').replace(/^\n+|\n+$/g,'');if(txt.trim()){out.classList.add('live');out.hidden=false;out.textContent='';typeOut(out,txt);}}}}catch(e){}}
      return{ok,answer:ok?'':(c.sol||c.ans[0]||'')};}};
  }
};
function typeOut(el,txt){
  if(reduceMotion||txt.length>1400){el.textContent=txt;return;}
  const lines=txt.split('\n');let i=0;
  const step=()=>{el.textContent=lines.slice(0,i+1).join('\n');i++;if(i<lines.length)setTimeout(step,18);};
  step();
}
document.addEventListener('keydown',e=>{
  if(player.hidden)return;
  if(e.key==='Escape'){$('#pClose').click();return;}
  const tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea')return;
  if(e.key==='Enter'){const b=pAct.querySelector('.btn.primary:not(:disabled),.btn.ok,.btn.bad');if(b&&!(document.activeElement===b)){e.preventDefault();b.click();}}
  else if(/^[1-6]$/.test(e.key)&&P.state==='answer'&&P.ctrl&&P.ctrl.choose){const i=+e.key-1;if(i<P.ctrl.n)P.ctrl.choose(i);}
});

/* =========================================================
   Terminal (bac à sable)
   ========================================================= */
const SANDBOX=[
  {id:'s1',sh:'cmd',t:'Affiche ta configuration IP complète (MAC, DNS, DHCP…).',sol:'ipconfig /all',test:x=>/^ipconfig\s+\/all\b/i.test(x.line)},
  {id:'s2',sh:'cmd',t:'Va dans C:\\Logs puis liste uniquement les fichiers .log.',sol:'cd /d C:\\Logs   puis   dir *.log',test:x=>x.sim.cwd().toLowerCase()==='c:\\logs'&&/^dir\b.*\*\.log/i.test(x.line)},
  {id:'s3',sh:'cmd',t:'Crée le dossier C:\\Temp\\Audit.',sol:'md C:\\Temp\\Audit',test:x=>x.sim.exists('C:\\Temp\\Audit')},
  {id:'s4',sh:'cmd',t:'Trouve les lignes contenant « ERREUR » dans les journaux de sauvegarde de C:\\Logs.',sol:'findstr /i "erreur" C:\\Logs\\backup_*.log',test:x=>/(findstr|find|select-string|sls)\b/i.test(x.line)&&/erreur/i.test(x.line)&&x.lines.some(l=>/ERREUR/.test(l))},
  {id:'s5',sh:'cmd',t:'Redémarre le spouleur d’impression : arrêt, puis démarrage.',sol:'net stop spooler && net start spooler',test:x=>x.sim.events().some(e=>e.svc==='spooler'&&e.a==='stop')&&x.sim.svcStatus('spooler')==='Running'},
  {id:'s6',sh:'cmd',t:'Vérifie que le serveur SRV-FICHIERS répond au ping.',sol:'ping srv-fichiers',test:x=>/^ping\b.*srv-fichiers/i.test(x.line)||/test-connection.*srv-fichiers/i.test(x.line)},
  {id:'s7',sh:'cmd',t:'Enregistre la sortie de ipconfig /all dans C:\\Temp\\diag.txt.',sol:'ipconfig /all > C:\\Temp\\diag.txt',test:x=>{const c=x.sim.read('C:\\Temp\\diag.txt');return !!c&&/Configuration IP/i.test(c);}},
  {id:'s8',sh:'cmd',t:'Liste les comptes du groupe local Administrateurs.',sol:'net localgroup administrateurs',test:x=>/net\s+localgroup\s+administrateurs/i.test(x.line)||/get-localgroupmember/i.test(x.line)},
  {id:'s9',sh:'ps',t:'Liste uniquement les services arrêtés.',sol:"Get-Service | Where-Object Status -eq 'Stopped'",test:x=>/(get-service|gsv)/i.test(x.line)&&/stopped/i.test(x.line)&&/(where|\?)/i.test(x.line)&&x.shell==='ps'},
  {id:'s10',sh:'ps',t:'Trouve les comptes Active Directory verrouillés.',sol:'Search-ADAccount -LockedOut',test:x=>/search-adaccount\b.*-locked/i.test(x.line)},
  {id:'s11',sh:'ps',t:'Déverrouille le compte de Marie Lefèvre (mlefevre).',sol:'Unlock-ADAccount -Identity mlefevre',test:x=>{const u=x.sim.adUser('mlefevre');return u&&!u.LockedOut;}},
  {id:'s12',sh:'ps',t:'Affiche les 5 processus qui consomment le plus de mémoire.',sol:'Get-Process | Sort-Object WS -Descending | Select-Object -First 5',test:x=>/(get-process|gps|^ps\b)/i.test(x.line)&&/sort/i.test(x.line)&&/-desc/i.test(x.line)&&/-first\s+5/i.test(x.line)},
  {id:'s13',sh:'ps',t:'Exporte la liste des ordinateurs AD dans C:\\Temp\\parc.csv.',sol:"Get-ADComputer -Filter * | Export-Csv C:\\Temp\\parc.csv -NoTypeInformation -Delimiter ';' -Encoding UTF8",test:x=>{const c=x.sim.read('C:\\Temp\\parc.csv');return !!c&&/PC-/i.test(c);}},
  {id:'s14',sh:'ps',t:'Importe C:\\Data\\nouveaux.csv (séparateur ;) et affiche seulement les prénoms.',sol:"Import-Csv C:\\Data\\nouveaux.csv -Delimiter ';' | Select-Object Prenom",test:x=>/import-csv/i.test(x.line)&&/prenom/i.test(x.line)&&x.lines.some(l=>/Léa/.test(l))},
  {id:'s15',sh:'ps',t:'Affiche l’espace libre du disque C: en Go.',sol:"Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='C:'\" | Select-Object DeviceID, @{n='LibreGo';e={[math]::Round($_.FreeSpace/1GB,1)}}",test:x=>/1gb/i.test(x.line)&&/(freespace|sizeremaining)/i.test(x.line)},
  {id:'s16',sh:'ps',t:'Teste si le port RDP (3389) de SRV-FICHIERS est ouvert.',sol:'Test-NetConnection SRV-FICHIERS -Port 3389',test:x=>/(test-netconnection|tnc)/i.test(x.line)&&/3389/.test(x.line)},
  {id:'s17',sh:'ps',t:'Récupère le numéro de série (BIOS) de PC-COMPTA-02 sans WinRM, via une session CIM en DCOM.',sol:"$s = New-CimSession -ComputerName PC-COMPTA-02 -SessionOption (New-CimSessionOption -Protocol Dcom)   puis   Get-CimInstance Win32_BIOS -CimSession $s",test:x=>/win32_bios/i.test(x.line)&&/-cimsession/i.test(x.line)&&x.lines.some(l=>/SerialNumber/i.test(l))},
  {id:'s18',sh:'ps',t:'Trouve qui a verrouillé un compte : événements 4740 du journal Security du contrôleur SRV-AD01.',sol:"Get-WinEvent -ComputerName SRV-AD01 -FilterHashtable @{LogName='Security'; Id=4740}",test:x=>/get-winevent/i.test(x.line)&&/4740/.test(x.line)}
];
const T_={sim:null,lines:[],hist:[],hi:-1,tab:null};
function helpFromDict(name,shell){
  const n=String(name||'').toLowerCase().replace(/\.exe$/,'');
  const strip=t=>String(t||'').replace(/\*\*/g,'').replace(/`/g,'').replace(/\[([^\]]+)\]/g,'$1');
  if(shell==='cmd'){
    const e=DICT.cmd.find(x=>x.n.toLowerCase()===n);if(!e)return null;
    const out=[strip(e.d),''];
    if(e.ety)out.push('Origine du nom : '+strip(e.ety),'');
    if(e.syn.length){e.syn.forEach(t=>out.push(t));out.push('');}
    if(e.sw.length){const w=Math.min(18,Math.max(...e.sw.map(x=>x.s.length))+2);e.sw.forEach(x=>out.push('  '+x.s.padEnd(w)+strip(x.d)+(x.mn?'   ← '+strip(x.mn):'')));}
    if(e.ex.length){out.push('','Exemples :');e.ex.forEach(x=>{out.push('  '+x.c);if(x.d)out.push('        '+strip(x.d));});}
    if(e.notes.length){out.push('');e.notes.forEach(t=>out.push(strip(t)));}
    if(e.adm)out.push('','⚠ '+e.adm);
    out.push('','(Aide pédagogique du simulateur — détail des lettres dans l’onglet Mémo.)');
    return out;
  }
  const e=DICT.ps.find(x=>x.n.toLowerCase()===n)||DICT.ps.find(x=>String(x.alias||'').toLowerCase().split(/\s*,\s*/).includes(n));
  if(!e)return null;
  const out=['','NOM','    '+e.n,'','SYNOPSIS','    '+strip(e.d),''];
  if(e.syn.length){out.push('SYNTAXE');e.syn.forEach(t=>out.push('    '+t));out.push('');}
  if(e.ety||e.notes.length){out.push('DESCRIPTION');if(e.ety)out.push('    Nom : '+strip(e.ety));e.notes.forEach(t=>out.push('    '+strip(t)));out.push('');}
  out.push('ALIAS','    '+(e.alias||'Aucun(e)'),'');
  if(e.sw.length){out.push('PARAMÈTRES');e.sw.forEach(x=>{out.push('    '+x.s);out.push('        '+strip(x.d)+(x.mn?'  ('+strip(x.mn)+')':''));out.push('');});}
  if(e.ex.length){out.push('EXEMPLES');e.ex.forEach((x,i)=>{out.push('    -------------------------- EXEMPLE '+(i+1)+' --------------------------','','    PS C:\\> '+x.c,'');if(x.d)out.push('    '+strip(x.d),'');});}
  return out;
}
function getSim(){if(!T_.sim&&window.AcademieSim){T_.sim=window.AcademieSim.create({help:helpFromDict});T_.lines=T_.sim.banner().map(x=>x);}return T_.sim;}
function viewTerm(){
  const sim=getSim();const sh=sim?sim.shell():'cmd';
  const done=SANDBOX.filter(m=>S.missions[m.id]).length;
  return `<div class="view wide">
    <div class="topbar"><div><span class="eyebrow">Bac à sable</span><h1 style="margin-top:4px">Terminal</h1></div>
      <div class="seg" role="group" aria-label="Shell"><button data-act="shell" data-id="cmd" aria-pressed="${sh==='cmd'}">CMD</button><button data-act="shell" data-id="ps" aria-pressed="${sh==='ps'}">PowerShell</button></div></div>
    <p class="muted" style="max-width:70ch">Un poste simulé du domaine <b>contoso.local</b> (PC-IT-01, session CONTOSO\\it.tech, invite élevée). Rien n’est réel : supprime, arrête, déverrouille sans risque. Tape <code class="inline-code">help</code> (CMD) ou <code class="inline-code">Get-Command</code> (PowerShell).</p>
    <div class="term-layout">
      <div class="console ${sh} term" id="termBox">
        <div class="bar"><span class="ttl" id="termTitle">${sh==='ps'?'Administrateur : Windows PowerShell':'Administrateur : Invite de commandes'}</span><button type="button" data-act="termclear">Effacer</button></div>
        <div class="scr" id="scr" aria-live="polite"></div>
        <form class="inrow" id="termForm" autocomplete="off"><span class="pr" id="tPrompt"></span><input id="tInput" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Commande"></form>
        <div id="tSym"></div>
      </div>
      <aside class="missions" aria-label="Défis">
        <div class="section-h"><h2>Défis</h2><span class="small muted tnum">${done}/${SANDBOX.length}</span></div>
        <div class="meter ok"><i style="width:${done/SANDBOX.length*100}%"></i></div>
        ${SANDBOX.map(m=>`<div class="mission ${S.missions[m.id]?'done':''}" data-m="${m.id}"><span class="box">${S.missions[m.id]?ic('check'):''}</span><div><div class="mh"><span class="tape ${m.sh}">${m.sh==='ps'?'PS':'CMD'}</span></div>${inl(m.t)}<details><summary>Solution</summary><code>${esc(m.sol)}</code></details></div></div>`).join('')}
      </aside>
    </div>
  </div>`;
}
function lineHtml(l){return `<div class="ln${l.c?' '+l.c:''}">${l.h!=null?l.h:esc(l.s)}</div>`;}
function paintTerm(){
  const scr=$('#scr');if(!scr)return;
  if(T_.lines.length>700)T_.lines=T_.lines.slice(-600);
  scr.innerHTML=T_.lines.map(lineHtml).join('');scr.scrollTop=scr.scrollHeight;
  const sim=getSim();if(!sim)return;
  $('#tPrompt').textContent=sim.prompt();
}
function mountTerm(){
  const sim=getSim();
  if(!sim){$('#scr').textContent='Simulateur indisponible.';return;}
  const sh=sim.shell();
  $('#tSym').innerHTML=`<div class="symbar" style="border-top:1px solid rgba(255,255,255,.08)">${['Tab','↑',...SYMS[sh].filter(s=>s!=='Tab')].map(s=>`<button type="button" data-sym="${esc(s)}" class="${s.length>2?'wordy':''}">${esc(s)}</button>`).join('')}</div>`;
  paintTerm();
  const inp=$('#tInput');
  if(T_.pending){inp.value=T_.pending;T_.pending=null;}
  if(!('ontouchstart' in window))setTimeout(()=>inp.focus({preventScroll:true}),30);
  $('#termForm').addEventListener('submit',e=>{e.preventDefault();runTerm(inp.value);inp.value='';});
  inp.addEventListener('keydown',e=>{
    if(e.key==='ArrowUp'){e.preventDefault();histMove(-1);}
    else if(e.key==='ArrowDown'){e.preventDefault();histMove(1);}
    else if(e.key==='Tab'){e.preventDefault();complete();}
    else if((e.key==='c'||e.key==='C')&&e.ctrlKey&&inp.selectionStart===inp.selectionEnd){e.preventDefault();const sim=getSim();T_.lines.push({h:`<span class="pr">${esc(sim.prompt())}</span>${esc(inp.value)}^C`});inp.value='';paintTerm();}
    else T_.tab=null;
  });
  $('#tSym').addEventListener('click',e=>{const b=e.target.closest('[data-sym]');if(!b)return;const s=b.dataset.sym;if(s==='Tab')complete();else if(s==='↑')histMove(-1);else{insertAt(inp,s);}inp.focus();});
  $('#scr').addEventListener('click',()=>{if(!window.getSelection||!String(window.getSelection()))inp.focus({preventScroll:true});});
}
function histMove(d){
  const inp=$('#tInput');if(!T_.hist.length)return;
  if(T_.hi<0)T_.hi=T_.hist.length;
  T_.hi=clamp(T_.hi+d,0,T_.hist.length);
  inp.value=T_.hi>=T_.hist.length?'':T_.hist[T_.hi];
  try{inp.setSelectionRange(inp.value.length,inp.value.length);}catch(e){}
}
function complete(){
  const inp=$('#tInput');const sim=getSim();
  if(!T_.tab){T_.tab={base:inp.value,list:sim.complete(inp.value),i:-1};}
  const t=T_.tab;if(!t.list.length)return;
  t.i=(t.i+1)%t.list.length;inp.value=t.list[t.i];
}
function runTerm(line){
  const sim=getSim();T_.tab=null;
  const pr=sim.prompt();const sh0=sim.shell();
  T_.lines.push({h:`<span class="pr">${esc(pr)}</span>${hlLine(line,sh0)}`});
  if(line.trim()){T_.hist.push(line);if(T_.hist.length>100)T_.hist.shift();}
  T_.hi=-1;
  let res;try{res=sim.run(line);}catch(err){res={lines:[{s:'Erreur interne du simulateur : '+err.message,c:'t-err'}]};}
  if(res.clear)T_.lines=[];
  (res.lines||[]).forEach(l=>T_.lines.push(l));
  if(line.trim()){S.stats.cmds++;}
  const sh1=sim.shell();
  // défis
  const ctx={line:line.trim(),sim,shell:sh0,lines:(res.lines||[]).map(l=>l.s||'')};
  let won=[];
  SANDBOX.forEach(m=>{if(!S.missions[m.id]){let ok=false;try{ok=m.test(ctx);}catch(e){}if(ok){S.missions[m.id]=today();won.push(m);}}});
  if(won.length){addXp(won.length*5);toast(`Défi réussi : +${won.length*5} XP`);}
  const nb=checkBadges();if(nb.length)toast('Nouveau badge : '+nb.map(b=>b.t).join(', '));
  if(line.trim())persist();
  if(sh1!==sh0||won.length){render();}else paintTerm();
}
function setShell(sh){const sim=getSim();if(!sim||sim.shell()===sh)return;const r=sim.switchTo(sh);(r.lines||[]).forEach(l=>T_.lines.push(l));render();}
function tryInTerminal(cmd,sh){
  const sim=getSim();if(sim&&sh&&sim.shell()!==sh){const r=sim.switchTo(sh);(r.lines||[]).forEach(l=>T_.lines.push(l));}
  T_.pending=cmd;if(!player.hidden){player.hidden=true;document.body.style.overflow='';}
  go('term');
}

/* =========================================================
   Démarrage
   ========================================================= */
applyTheme();
const hash=(location.hash||'').slice(1);
if(['path','term','memo','me'].includes(hash))UI.view=hash;
renderNav();render();
Sync.init();
Cloud.init();
window.addEventListener('storage',e=>{if(e.key===KEY){S=load();refresh();}});
})();
