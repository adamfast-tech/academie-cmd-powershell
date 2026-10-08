
/* =========================================================
   Instance du simulateur
   ========================================================= */
function create(opts){
opts=opts||{};
const OUT=parseOut(opts.out!=null?opts.out:grabOut());
const helpProvider=opts.help||(()=>null);
const FS=buildFS(OUT);
const AD=baseAD();
const EV=baseEvents();
const REG=baseReg();
const st={
  shell:'cmd',stack:[],drive:'C',dcwd:{C:['Users','it.tech'],D:[]},
  uncLoc:null,regLoc:null,
  env:baseEnv(),errorlevel:0,echo:true,ipOk:true,
  services:baseServices(),procs:baseProcs(),events:[],
  mapped:{},remoteSvc:{},remoteFs:{},
  tasks:[{TaskName:'Sauvegarde nocturne',TaskPath:'\\',State:'Ready',Next:ago(-1,22,0),Last:ago(0,22,0),Result:0,Run:'C:\\Scripts\\sauvegarde.bat',User:'SYSTEM',Sched:'Tous les jours à 22:00'},
         {TaskName:'MicrosoftEdgeUpdateTaskMachineCore',TaskPath:'\\',State:'Ready',Next:ago(-1,9,12),Last:ago(0,9,12),Result:0,Run:'"C:\\Program Files (x86)\\Microsoft\\EdgeUpdate\\MicrosoftEdgeUpdate.exe" /c',User:'SYSTEM',Sched:'Tous les jours à 09:12'}],
  execPolicy:{MachinePolicy:'Undefined',UserPolicy:'Undefined',Process:'Undefined',CurrentUser:'Undefined',LocalMachine:'Restricted'},
  vars:{},hist:[],nextPid:9600,cim:[],printJobs:[{Id:12,PrinterName:'IMP-RECEP',DocumentName:'Facture_Chambre_214.pdf',JobStatus:'Error',SubmittedTime:ago(0,8,31),UserName:'kbenali',Size:1048576}],
  dnsCache:true,transcript:null,lastExit:0,ok:true,errors:[],psDirStack:[],localUsers:null,psctx:null
};
st.procs.push({Name:'ScanAssist',Id:8920,SessionName:'Console',SI:1,WS:61734912,CPU:812.6,Handles:530,Svc:'',Path:'C:\\Program Files (x86)\\ScanAssist\\ScanAssist.exe',Company:'ScanAssist Ltd'});
REG.HKCU.kids.Software.kids.Microsoft.kids.Windows.kids.CurrentVersion.kids.Run.vals.ScanAssist={type:'REG_SZ',data:'"C:\\Program Files (x86)\\ScanAssist\\ScanAssist.exe" /tray'};
st.localUsers=[{Name:'admin.local',Enabled:true,Description:'Compte administrateur local (mot de passe géré par LAPS)',FullName:''},{Name:'Administrateur',Enabled:false,Description:'Compte d’utilisateur d’administration',FullName:''},{Name:'DefaultAccount',Enabled:false,Description:'Compte utilisateur géré par le système.',FullName:''},{Name:'Invité',Enabled:false,Description:'Compte d’utilisateur invité',FullName:''},{Name:'WDAGUtilityAccount',Enabled:false,Description:'Compte d’utilisateur géré et utilisé par le système pour les scénarios Windows Defender Application Guard.',FullName:''}];
st.localGroups={'administrateurs':{name:'Administrateurs',desc:'Les membres du groupe Administrateurs disposent d’un accès complet et illimité à l’ordinateur et au domaine',members:[{n:'PC-IT-01\\admin.local',c:'Utilisateur',src:'Local'},{n:'PC-IT-01\\Administrateur',c:'Utilisateur',src:'Local'},{n:'CONTOSO\\Admins du domaine',c:'Groupe',src:'ActiveDirectory'},{n:'CONTOSO\\GG_IT',c:'Groupe',src:'ActiveDirectory'}]},
  'utilisateurs':{name:'Utilisateurs',desc:'Les utilisateurs ne peuvent pas effectuer de modifications accidentelles ou intentionnelles à l’échelle du système',members:[{n:'AUTORITE NT\\INTERACTIF',c:'Groupe',src:'Unknown'},{n:'AUTORITE NT\\Utilisateurs authentifiés',c:'Groupe',src:'Unknown'},{n:'CONTOSO\\Utilisateurs du domaine',c:'Groupe',src:'ActiveDirectory'}]},
  'utilisateurs du bureau à distance':{name:'Utilisateurs du Bureau à distance',desc:'Les membres de ce groupe disposent des droits pour ouvrir une session à distance',members:[{n:'CONTOSO\\GG_IT',c:'Groupe',src:'ActiveDirectory'}]}};

const L=(s,c)=>({s:String(s),c:c||''});
const tpl=(k,v)=>String(OUT[k]||'').replace(/\{\{(\w+)\}\}/g,(m,x)=>v&&v[x]!=null?v[x]:m);
const outLines=(k,v)=>tpl(k,v).split('\n');

/* ---------- emplacement & chemins ---------- */
const SHARES={'srv-fichiers':{compta:['Data','Compta'],rh:['Data','RH'],partage:['Data','Partage'],'users$':['Users']}};
function remoteRoot(host,share){
  const h=findHost(host);if(!h||!h.up||h.ext)return null;
  const sh=lc(share);
  if(h.self){if(sh==='c$')return{root:FS.C,pre:'\\\\'+h.n+'\\C$'};if(sh==='d$')return{root:FS.D,pre:'\\\\'+h.n+'\\D$'};if(sh==='admin$')return{root:FS.C.kids.get('windows'),pre:'\\\\'+h.n+'\\ADMIN$'};return null;}
  const sm=SHARES[lc(h.n)];
  if(sm&&sm[sh]){let n=FS.C;for(const s of sm[sh])n=n.kids.get(lc(s));return{root:n,pre:'\\\\'+h.n+'\\'+share};}
  if(sh==='c$'||sh==='admin$'){
    const key=lc(h.n);
    if(!st.remoteFs[key]){const hw=hostHw(h.n);const u=hw.user?hw.user.split('\\')[1]:'administrateur';
      st.remoteFs[key]=D('C$',[D('Users',[D(u,[D('Desktop',[F('raccourcis.txt','Raccourcis métier',{t:ago(10)})]),D('Documents',[F('suivi_'+u+'.xlsx','',{size:44032,bin:true,t:ago(1)})]),D('AppData',[D('Local',[D('Temp',[F('tmp01.tmp','',{size:1048576,bin:true}),F('tmp02.tmp','',{size:524288,bin:true})])])],{attr:'h'})]),D('Public',[])]),
        D('Windows',[D('Temp',[F('setup.log','',{size:20480})]),D('System32',[D('spool',[D('PRINTERS',[])])])]),D('Program Files',[D('Microsoft Office',[])]),D('Temp',[])],{t:ago(1)});}
    const root=st.remoteFs[key];
    return sh==='admin$'?{root:root.kids.get('windows'),pre:'\\\\'+h.n+'\\ADMIN$'}:{root,pre:'\\\\'+h.n+'\\C$'};
  }
  return null;
}
function driveRoot(letter){letter=letter.toUpperCase();if(letter==='C')return FS.C;if(letter==='D')return FS.D;if(st.mapped[letter])return st.mapped[letter].root;return null;}
function curLoc(){
  if(st.uncLoc)return{root:st.uncLoc.root,pre:st.uncLoc.pre,segs:st.uncLoc.segs.slice()};
  return{root:driveRoot(st.drive),pre:st.drive+':',segs:(st.dcwd[st.drive]||[]).slice()};
}
const showLoc=l=>l.segs.length?l.pre+'\\'+l.segs.join('\\'):l.pre+'\\';
function cwdStr(){return showLoc(curLoc());}
class SimErr extends Error{constructor(code,msg){super(msg);this.code=code;}}
function resolve(p){
  p=String(p==null?'':p).trim().replace(/^"(.*)"$/,'$1').replace(/\//g,'\\');
  if(p==='')p='.';
  if(p==='~'||p.startsWith('~\\'))p=ME.home+p.slice(1);
  p=p.replace(/^Microsoft\.PowerShell\.Core\\FileSystem::/i,'');
  let m,base,rest;
  if((m=/^\\\\([^\\]+)\\([^\\]+)(.*)$/.exec(p))){const rr=remoteRoot(m[1],m[2]);if(!rr)throw new SimErr('NET','Le chemin réseau n’a pas été trouvé.');base={root:rr.root,pre:rr.pre,segs:[]};rest=m[3]||'';}
  else if((m=/^([A-Za-z]):(.*)$/.exec(p))){const dl=m[1].toUpperCase();const root=driveRoot(dl);if(!root)throw new SimErr('DRIVE','Le chemin d’accès spécifié est introuvable.');rest=m[2];
    if(rest.startsWith('\\'))base={root,pre:dl+':',segs:[]};else base={root,pre:dl+':',segs:(st.dcwd[dl]||[]).slice()};}
  else if(p.startsWith('\\')){const c=curLoc();base={root:c.root,pre:c.pre,segs:[]};rest=p;}
  else{base=curLoc();rest=p;}
  const segs=base.segs.slice();
  for(const s0 of rest.split('\\')){const s=s0.replace(/[. ]+$/,'')||s0;if(!s0||s0==='.')continue;if(s0==='..'){segs.pop();continue;}segs.push(s);}
  return{root:base.root,pre:base.pre,segs};
}
function nodeAt(loc){let n=loc.root;for(const s of loc.segs){if(!n||!n.d)return null;n=n.kids.get(lc(s));}return n||null;}
function fixCase(loc){let n=loc.root;const out=[];for(const s of loc.segs){const k=n&&n.d?n.kids.get(lc(s)):null;out.push(k?k.name:s);n=k;}return{root:loc.root,pre:loc.pre,segs:out};}
const parentOf=loc=>({root:loc.root,pre:loc.pre,segs:loc.segs.slice(0,-1)});
const childLoc=(loc,name)=>({root:loc.root,pre:loc.pre,segs:loc.segs.concat([name])});
function sameOrInside(a,b){if(a.root!==b.root)return false;if(a.segs.length>b.segs.length)return false;return a.segs.every((s,i)=>lc(s)===lc(b.segs[i]));}
function exists(p){try{return !!nodeAt(resolve(p));}catch(e){return false;}}
function readFile(p){try{const n=nodeAt(resolve(p));return n&&!n.d?n.content:null;}catch(e){return null;}}
function writeFile(p,content,append){
  const loc=resolve(p);const par=nodeAt(parentOf(loc));
  if(!par||!par.d)throw new SimErr('PATH','Le chemin d’accès spécifié est introuvable.');
  const name=loc.segs[loc.segs.length-1];if(!name)throw new SimErr('PATH','Accès refusé.');
  let f=par.kids.get(lc(name));
  if(f&&f.d)throw new SimErr('ISDIR','Accès refusé.');
  if(f&&f.attr.includes('r'))throw new SimErr('RO','Accès refusé.');
  if(!f){f=F(name,'');par.kids.set(lc(name),f);}
  f.content=append&&f.content?f.content+(f.content.endsWith('\n')?'':'\n')+content:content;f.size=utf8len(f.content);f.t=new Date();f.bin=false;
  par.t=new Date();return f;
}
function listMatch(loc){
  const name=loc.segs[loc.segs.length-1]||'';
  if(hasWild(name)){const par=nodeAt(parentOf(loc));if(!par||!par.d)return null;const rx=wild(name);return{dir:parentOf(loc),items:[...par.kids.values()].filter(k=>rx.test(k.name)||(name==='*.*'))};}
  const n=nodeAt(loc);if(!n)return null;return{single:n,loc};
}
function walk(node,loc,fn,depth){depth=depth||0;for(const k of sortKids(node)){const kl=childLoc(loc,k.name);fn(k,kl,depth);if(k.d)walk(k,kl,fn,depth+1);}}
const sortKids=n=>[...n.kids.values()].sort((a,b)=>lc(a.name)<lc(b.name)?-1:lc(a.name)>lc(b.name)?1:0);
function treeSize(n){if(!n.d)return n.size;let s=0;for(const k of n.kids.values())s+=treeSize(k);return s;}
function cloneNode(n){if(!n.d)return Object.assign({},n,{t:n.t});const c=D(n.name,[],{t:n.t,attr:n.attr});for(const k of n.kids.values())c.kids.set(lc(k.name),cloneNode(k));return c;}
const FREE={C:41234567168,D:657123456000};
function freeBytes(pre){const m=/^([A-Z]):/.exec(pre);return m&&FREE[m[1]]?FREE[m[1]]:120034222080;}

/* ---------- variables d'environnement ---------- */
function envGet(k){const key=Object.keys(st.env).find(x=>lc(x)===lc(k));return key?st.env[key]:undefined;}
function envSet(k,v){const key=Object.keys(st.env).find(x=>lc(x)===lc(k))||k;if(v===''||v==null)delete st.env[key];else st.env[key]=v;}
function dynVar(name){
  const n=lc(name);
  if(n==='cd')return cwdStr();
  if(n==='date')return fdate(new Date());
  if(n==='time'){const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())},${pad(Math.floor(d.getMilliseconds()/10))}`;}
  if(n==='random')return String(Math.floor(Math.random()*32768));
  if(n==='errorlevel')return String(st.errorlevel);
  if(n==='cmdcmdline')return 'C:\\Windows\\system32\\cmd.exe';
  return envGet(name);
}
function expandVars(line,batch){
  return line.replace(/%([A-Za-z_#$@(){}\[\]'.~+\-][\w#$@(){}\[\]'.~+\-]*?)(:~(-?\d+)(?:,(-?\d+))?|:([^%=]*)=([^%]*))?%/g,(m,name,mod,a,b,from,to)=>{
    let v=dynVar(name);
    if(v==null)return batch?'':m;
    if(mod&&a!=null){const len=v.length;let s=+a;if(s<0)s=Math.max(0,len+s);let e=b==null?len:(+b<0?len+(+b):s+(+b));v=v.slice(s,Math.max(s,e));}
    else if(mod&&from!=null){v=v.split(from).join(to);}
    return v;
  });
}

/* ---------- découpage des lignes CMD ---------- */
function splitChain(s){
  const out=[];let cur='',q=false,depth=0,op=null;
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(c==='^'&&!q&&i+1<s.length){cur+=c+s[i+1];i++;continue;}
    if(c==='"'){q=!q;cur+=c;continue;}
    if(!q&&c==='(')depth++;
    if(!q&&c===')')depth=Math.max(0,depth-1);
    if(!q&&depth===0){
      if(c==='&'&&s[i+1]==='&'){out.push({op,seg:cur});cur='';op='&&';i++;continue;}
      if(c==='|'&&s[i+1]==='|'){out.push({op,seg:cur});cur='';op='||';i++;continue;}
      if(c==='&'&&s[i-1]!=='>'&&s[i-1]!=='<'){out.push({op,seg:cur});cur='';op='&';continue;}
    }
    cur+=c;
  }
  out.push({op,seg:cur});
  return out.filter(x=>x.seg.trim()||x.op===null);
}
function splitPipe(s){const out=[];let cur='',q=false,depth=0;for(let i=0;i<s.length;i++){const c=s[i];if(c==='^'&&!q&&i+1<s.length){cur+=c+s[i+1];i++;continue;}if(c==='"')q=!q;if(!q&&c==='(')depth++;if(!q&&c===')')depth=Math.max(0,depth-1);if(c==='|'&&!q&&depth===0){out.push(cur);cur='';continue;}cur+=c;}out.push(cur);return out;}
function parseRedir(s){
  const r={out:null,app:false,err:null,errApp:false,merge:false,inp:null};let rest='',q=false;
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(c==='^'&&!q&&i+1<s.length){rest+=c+s[i+1];i++;continue;}
    if(c==='"'){q=!q;rest+=c;continue;}
    if(!q&&(c==='>'||c==='<')){
      let fd=1;if(c==='>'&&/[12]$/.test(rest)&&(rest.length===1||/\s/.test(rest[rest.length-2]))){fd=+rest[rest.length-1];rest=rest.slice(0,-1);}
      let j=i+1,app=false;if(c==='>'&&s[j]==='>'){app=true;j++;}
      if(c==='>'&&s[j]==='&'&&/[12]/.test(s[j+1]||'')){if(fd===2&&s[j+1]==='1')r.merge=true;i=j+1;continue;}
      while(s[j]===' ')j++;
      let k=j,qq=false;while(k<s.length&&(qq||!/[\s<>|&]/.test(s[k]))){if(s[k]==='"')qq=!qq;k++;}
      const target=s.slice(j,k).replace(/"/g,'');i=k-1;
      if(c==='<')r.inp=target;else if(fd===2){r.err=target;r.errApp=app;}else{r.out=target;r.app=app;}
      continue;
    }
    rest+=c;
  }
  return{r,rest};
}
function tokCmd(s){const out=[];let cur='',q=false,has=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='^'&&!q&&i+1<s.length){cur+=s[++i];has=true;continue;}if(c==='"'){q=!q;cur+=c;has=true;continue;}if(/\s/.test(c)&&!q){if(has){out.push(cur);cur='';has=false;}continue;}cur+=c;has=true;}if(has)out.push(cur);return out;}
const unq=s=>String(s).replace(/"/g,'');
/* commutateurs : /a:h, /ah, /S, -n 4 */
function sw(args,withVal){
  const o={pos:[],has:k=>k in o.m,get:k=>o.m[k],m:{}};
  for(let i=0;i<args.length;i++){
    const a=args[i];
    if(/^\/./.test(a)&&!/^\/\//.test(a)){const b=a.slice(1);const ci=b.indexOf(':');const k=lc(ci<0?b:b.slice(0,ci));let v=ci<0?true:unq(b.slice(ci+1));if(v===true&&withVal&&withVal.includes(k)&&i+1<args.length&&!/^\/./.test(args[i+1]))v=unq(args[++i]);o.m[k]=v;}
    else if(withVal&&/^-[A-Za-z]/.test(a)){const k=lc(a.slice(1));if(withVal.includes(k)&&i+1<args.length){o.m[k]=unq(args[++i]);}else o.m[k]=true;}
    else o.pos.push(a);
  }
  return o;
}

/* ---------- exécution CMD ---------- */
function runCmdLine(line,ctxIn){
  const res={lines:[],clear:false,exit:false};
  if(!line.trim())return res;
  const ex=expandVars(line,ctxIn&&ctxIn.batch);
  for(const part of splitChain(ex)){
    if(part.op==='&&'&&st.errorlevel!==0)continue;
    if(part.op==='||'&&st.errorlevel===0)continue;
    if(!part.seg.trim())continue;
    const code=runPipeline(part.seg,res,ctxIn);
    st.errorlevel=code;
    if(res.exit)break;
  }
  return res;
}
function runPipeline(seg,res,ctxIn){
  const stages=splitPipe(seg);let stdin=null,code=0;
  for(let i=0;i<stages.length;i++){
    const {r,rest}=parseRedir(stages[i]);
    let input=stdin;
    if(r.inp){const c=readFile(r.inp);if(c==null){res.lines.push(L('Le fichier spécifié est introuvable.','t-err'));return 1;}input=c.split('\n');}
    const ctx={out:[],err:[],stdin:input,res,batch:ctxIn&&ctxIn.batch,last:i===stages.length-1,pipedOut:i<stages.length-1||!!r.out};
    try{code=runOne(rest.trim(),ctx);}catch(e){if(e instanceof SimErr){ctx.err.push(e.message);code=1;}else throw e;}
    if(r.merge){ctx.out=ctx.out.concat(ctx.err.map(s=>L(typeof s==='string'?s:s.s)));ctx.err=[];}
    if(r.err){if(lc(r.err)!=='nul'){try{writeFile(r.err,ctx.err.map(x=>typeof x==='string'?x:x.s).join('\n'),r.errApp);}catch(e){}}ctx.err=[];}
    ctx.err.forEach(e=>res.lines.push(typeof e==='string'?L(e,'t-err'):e));
    if(r.out){if(lc(r.out)!=='nul'){try{writeFile(r.out,ctx.out.map(x=>x.s).join('\n'),r.app);}catch(e){res.lines.push(L(e.message||'Accès refusé.','t-err'));}}stdin=[];}
    else if(i<stages.length-1){stdin=ctx.out.map(x=>x.s);}
    else{ctx.out.forEach(x=>res.lines.push(x));}
  }
  return code;
}
const CMD={};
const CMD_ALIAS={chdir:'cd',mkdir:'md',rmdir:'rd',erase:'del',rename:'ren','query':'query'};
function runOne(s,ctx){
  let toks=tokCmd(s);if(!toks.length)return 0;
  let name=toks[0].replace(/^@/,'');
  let m;
  if((m=/^(cd|chdir|dir|md|rd|echo|type|cls|del)([.\\\/:,(].*)$/i.exec(name))&&!/^[a-z]:$/i.test(name)){
    if(/^echo$/i.test(m[1])){const raw=s.replace(/^\s*@?echo/i,'');CMD.echo(raw,ctx,true);return st.errorlevel;}
    toks=[m[1],m[2]].concat(toks.slice(1));name=m[1];
  }
  if(/^[A-Za-z]:$/.test(name)&&toks.length===1){const dl=name[0].toUpperCase();if(!driveRoot(dl)){ctx.err.push('Le chemin d’accès spécifié est introuvable.');return 1;}st.drive=dl;st.uncLoc=null;if(!st.dcwd[dl])st.dcwd[dl]=[];return 0;}
  const key=lc(name).replace(/\.(exe|com)$/,'');
  const k=CMD_ALIAS[key]||key;
  const args=toks.slice(1);
  if(args.includes('/?')){const h=helpProvider(k,'cmd');if(h){h.forEach(x=>ctx.out.push(L(x)));return 0;}}
  if(/\.(bat|cmd)$/i.test(name)||(k==='call'&&args[0]&&/\.(bat|cmd)$/i.test(args[0]))){
    const file=k==='call'?args[0]:name;const bargs=k==='call'?args.slice(1):args;return runBatch(unq(file),bargs.map(unq),ctx);}
  if(/\.ps1$/i.test(name)){ctx.err.push(`'${name}' n’est pas reconnu en tant que commande interne`);ctx.err.push('ou externe, un programme exécutable ou un fichier de commandes.');ctx.out.push(L('(Un script .ps1 se lance depuis PowerShell, ou : powershell -ExecutionPolicy Bypass -File '+name+')','t-warn'));return 9009;}
  if(CMD[k]){const raw=s.replace(/^\s*@?\S+\s?/,'');const rv=CMD[k](args,ctx,raw);return rv===undefined?st.errorlevel:(rv||0);}
  if(KNOWN_GUI[k]){ctx.out.push(L(KNOWN_GUI[k],'t-warn'));return 0;}
  ctx.err.push(`'${name}' n’est pas reconnu en tant que commande interne`);
  ctx.err.push('ou externe, un programme exécutable ou un fichier de commandes.');
  if(k==='wmic')ctx.out.push(L('(WMIC est désactivé par défaut depuis Windows 11 24H2 : utilise Get-CimInstance dans PowerShell.)','t-warn'));
  else if(/^[a-z]+-[a-z]+$/i.test(name))ctx.out.push(L('(Ça ressemble à une cmdlet PowerShell : tape powershell pour changer de shell.)','t-warn'));
  return 9009;
}
const KNOWN_GUI={notepad:'(Simulation) Le Bloc-notes s’ouvre.',calc:'(Simulation) La Calculatrice s’ouvre.',explorer:'(Simulation) L’Explorateur de fichiers s’ouvre.',taskmgr:'(Simulation) Le Gestionnaire des tâches s’ouvre.',
  'services.msc':'(Simulation) La console Services s’ouvre.','compmgmt.msc':'(Simulation) La Gestion de l’ordinateur s’ouvre.','eventvwr':'(Simulation) L’Observateur d’événements s’ouvre.','eventvwr.msc':'(Simulation) L’Observateur d’événements s’ouvre.',
  'dsa.msc':'(Simulation) Utilisateurs et ordinateurs Active Directory s’ouvre.','gpmc.msc':'(Simulation) La Gestion des stratégies de groupe s’ouvre.','devmgmt.msc':'(Simulation) Le Gestionnaire de périphériques s’ouvre.','diskmgmt.msc':'(Simulation) La Gestion des disques s’ouvre.',
  'ncpa.cpl':'(Simulation) Les Connexions réseau s’ouvrent.','appwiz.cpl':'(Simulation) Programmes et fonctionnalités s’ouvre.','control':'(Simulation) Le Panneau de configuration s’ouvre.','mmc':'(Simulation) Une console MMC vide s’ouvre.','regedit':'(Simulation) L’Éditeur du Registre s’ouvre.',
  'msinfo32':'(Simulation) Informations système s’ouvre.','perfmon':'(Simulation) L’Analyseur de performances s’ouvre.','resmon':'(Simulation) Le Moniteur de ressources s’ouvre.','winver':'(Simulation) À propos de Windows : version 24H2 (build 26100.2033).','lusrmgr.msc':'(Simulation) Utilisateurs et groupes locaux s’ouvre.','printmanagement.msc':'(Simulation) La Gestion de l’impression s’ouvre.','quickassist':'(Simulation) Assistance rapide s’ouvre : le collaborateur te donne son code de sécurité.','sysdm.cpl':'(Simulation) Propriétés système s’ouvre.','firewall.cpl':'(Simulation) Pare-feu Windows Defender s’ouvre.','dcdiag':null};
Object.keys(KNOWN_GUI).forEach(k=>{if(KNOWN_GUI[k]==null)delete KNOWN_GUI[k];});

/* ---------- scripts batch ---------- */
function runBatch(file,bargs,ctx){
  let loc;try{loc=resolve(file);}catch(e){loc=null;}
  const n=loc?nodeAt(loc):null;
  if(!n||n.d){ctx.err.push(`'${file}' n’est pas reconnu en tant que commande interne`);ctx.err.push('ou externe, un programme exécutable ou un fichier de commandes.');return 9009;}
  const dir=showLoc(fixCase(parentOf(loc)))+(parentOf(loc).segs.length?'\\':'');
  const lines=n.content.replace(/\r/g,'').split('\n');
  const labels={};lines.forEach((l,i)=>{const m=/^\s*:(\w+)/.exec(l);if(m&&!/^\s*::/.test(l))labels[lc(m[1])]=i;});
  const saveEcho=st.echo;let pc=0,steps=0,code=0;
  const sub=l=>l.replace(/%~dp0/gi,dir).replace(/%~nx0/gi,n.name).replace(/%~0|%0/g,showLoc(loc)).replace(/%\*/g,bargs.join(' ')).replace(/%~?([1-9])/g,(m,d)=>bargs[+d-1]||'').replace(/%%/g,'%');
  while(pc<lines.length&&steps<400){
    steps++;let l=lines[pc];pc++;
    if(!l.trim()||/^\s*(rem\b|::)/i.test(l)||/^\s*:\w/.test(l))continue;
    let depth=(l.match(/\(/g)||[]).length-(l.match(/\)/g)||[]).length;
    while(depth>0&&pc<lines.length){const nx=lines[pc++];l+=' & '+nx.trim();depth+=(nx.match(/\(/g)||[]).length-(nx.match(/\)/g)||[]).length;}
    l=l.replace(/\(\s*&\s*/g,'( ').replace(/\s*&\s*\)/g,' )');
    const at=/^\s*@/.test(l);
    const body=sub(l.replace(/^\s*@/,''));
    if(/^\s*echo\s+off\s*$/i.test(body)){st.echo=false;continue;}
    if(/^\s*echo\s+on\s*$/i.test(body)){st.echo=true;continue;}
    if(st.echo&&!at){ctx.out.push(L(''));ctx.out.push(L(cwdStr()+'>'+body.trim()));}
    let m;
    if((m=/^\s*goto\s+:?(\w+)/i.exec(body))){const t=lc(m[1]);if(t==='eof')break;if(labels[t]==null){ctx.err.push('Le nom d’étiquette spécifié est introuvable - '+m[1]);break;}pc=labels[t]+1;continue;}
    if(/^\s*exit\s+\/b/i.test(body)){const mm=/\/b\s+(\d+)/i.exec(body);code=mm?+mm[1]:st.errorlevel;break;}
    if(/^\s*exit\s*$/i.test(body))break;
    st.batchExit=false;
    const r=runCmdLine(body,{batch:true});
    r.lines.forEach(x=>ctx.out.push(x));
    code=st.errorlevel;
    if(r.clear)ctx.res.clear=true;
    if(st.batchExit){st.batchExit=false;break;}
  }
  st.echo=saveEcho;
  return code;
}
