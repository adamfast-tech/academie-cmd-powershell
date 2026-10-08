
/* =========================================================
   Commandes CMD : fichiers
   ========================================================= */
const VOL={C:['OS','7A3C-91F2'],D:['DATA','B2E1-0C44']};
function volHeader(pre){const m=/^([A-Z]):/.exec(pre);if(m&&VOL[m[1]])return[L(` Le volume dans le lecteur ${m[1]} s’appelle ${VOL[m[1]][0]}`),L(` Le numéro de série du volume est ${VOL[m[1]][1]}`)];return[L(` Le volume dans le lecteur ${pre} s’appelle Data`),L(' Le numéro de série du volume est 3F10-AB7E')];}
const dirLine=(n,name,tf)=>{const d=tf==='c'?n.c:n.t;return `${fdate(d)}  ${ftime(d)}    `+(n.d?'<DIR>          ':nf(n.size).padStart(14)+' ')+name;};
CMD.dir=function(args,ctx){
  const o=sw(args);let attr=null,order=null,tf='w';
  for(const k of Object.keys(o.m)){
    const v=o.m[k];
    if(k==='a')attr=v===true?'':lc(v);else if(k[0]==='a'&&/^a[-dhsrali]+$/.test(k))attr=k.slice(1);
    if(k==='o')order=v===true?'gn':lc(v);else if(k[0]==='o'&&/^o[-nsedg]+$/.test(k))order=k.slice(1);
    if(k==='t')tf=lc(v===true?'w':v);else if(/^t[caw]$/.test(k))tf=k[1];
  }
  const bare=o.has('b'),rec=o.has('s'),wide=o.has('w'),lower=o.has('l');
  const attrOk=n=>{if(attr===null)return !(n.attr.includes('h')||n.attr.includes('s'));if(attr==='')return true;let ok=true;for(let i=0;i<attr.length;i++){let neg=false,ch=attr[i];if(ch==='-'){neg=true;ch=attr[++i];}if(!ch)break;const has=ch==='d'?n.d:n.attr.includes(ch);if(neg?has:!has)ok=false;}return ok;};
  const sorter=list=>{if(!order)return list;let l=list.slice();const keys=[];for(let i=0;i<order.length;i++){let neg=false,ch=order[i];if(ch==='-'){neg=true;ch=order[++i];}keys.push([ch,neg]);}
    l.sort((a,b)=>{for(const [ch,neg] of keys){let r=0;if(ch==='n')r=lc(a.name)<lc(b.name)?-1:lc(a.name)>lc(b.name)?1:0;else if(ch==='s')r=(a.d?0:a.size)-(b.d?0:b.size);else if(ch==='d')r=a.t-b.t;else if(ch==='e'){const ea=(a.name.split('.').pop()||''),eb=(b.name.split('.').pop()||'');r=ea<eb?-1:ea>eb?1:0;}else if(ch==='g')r=(b.d?1:0)-(a.d?1:0);if(r)return neg?-r:r;}return 0;});return l;};
  const paths=o.pos.length?o.pos.map(unq):['.'];
  let code=0;const fmtName=s=>lower?lc(s):s;
  let gFiles=0,gBytes=0,gDirs=0,first=true;
  for(const p of paths){
    let loc;try{loc=resolve(p);}catch(e){ctx.err.push(e.message);code=1;continue;}
    let dirLoc,pattern;
    const n=nodeAt(loc);
    if(n&&n.d){dirLoc=loc;pattern='*';}
    else{dirLoc=parentOf(loc);pattern=loc.segs[loc.segs.length-1]||'*';}
    const dn=nodeAt(dirLoc);
    if(!bare&&first){volHeader(dirLoc.pre).forEach(x=>ctx.out.push(x));first=false;}
    const rx=wild(pattern==='*.*'?'*':pattern);
    let found=0;
    const block=(dl,dnode)=>{
      const items=sorter(sortKids(dnode).filter(k=>rx.test(k.name)&&attrOk(k)));
      const fx=showLoc(fixCase(dl));
      if(bare){items.forEach(k=>ctx.out.push(L(rec?fmtName(fx.replace(/\\$/,'')+'\\'+k.name):fmtName(k.name))));found+=items.length;return;}
      if(!items.length&&rec)return;
      ctx.out.push(L(''));ctx.out.push(L(` Répertoire de ${fx}`));ctx.out.push(L(''));
      let fc=0,fb=0,dc=0;
      const showDots=pattern==='*'&&dl.segs.length>0&&(attr===null||attr===''||/d/.test(attr)&&!/-d/.test(attr));
      if(wide){
        const names=[];if(showDots){names.push('[.]','[..]');dc+=2;}
        items.forEach(k=>{names.push(k.d?`[${fmtName(k.name)}]`:fmtName(k.name));if(k.d)dc++;else{fc++;fb+=k.size;}});
        const w=Math.min(40,Math.max(...names.map(x=>x.length),4)+2);const per=Math.max(1,Math.floor(79/w));
        for(let i=0;i<names.length;i+=per)ctx.out.push(L(names.slice(i,i+per).map(x=>x.padEnd(w)).join('').trimEnd()));
      }else{
        if(showDots){ctx.out.push(L(dirLine(dnode,'.',tf)));ctx.out.push(L(dirLine(dnode,'..',tf)));dc+=2;}
        items.forEach(k=>{ctx.out.push(L(dirLine(k,fmtName(k.name),tf)));if(k.d)dc++;else{fc++;fb+=k.size;}});
      }
      found+=items.length;
      ctx.out.push(L(`${String(fc).padStart(16)} fichier(s) ${nf(fb).padStart(14)} octets`));
      if(!rec)ctx.out.push(L(`${String(dc).padStart(16)} Rép(s) ${nf(freeBytes(dirLoc.pre)).padStart(15)} octets libres`));
      gFiles+=fc;gBytes+=fb;gDirs+=dc;
    };
    if(!dn||!dn.d){if(!bare){ctx.out.push(L(''));ctx.out.push(L(` Répertoire de ${showLoc(fixCase(dirLoc))}`));ctx.out.push(L(''));}ctx.err.push('Fichier introuvable');code=1;continue;}
    block(dirLoc,dn);
    if(rec){walk(dn,dirLoc,(k,kl)=>{if(k.d&&(attr===''||!(k.attr.includes('h')||k.attr.includes('s'))))block(kl,k);});}
    if(!found&&(pattern!=='*'||bare)){if(!bare&&!rec){ctx.out.pop();ctx.out.pop();}ctx.err.push('Fichier introuvable');code=1;}
    if(rec&&!bare&&found){ctx.out.push(L(''));ctx.out.push(L('     Total des fichiers listés :'));ctx.out.push(L(`${String(gFiles).padStart(16)} fichier(s) ${nf(gBytes).padStart(14)} octets`));ctx.out.push(L(`${String(gDirs).padStart(16)} Rép(s) ${nf(freeBytes(dirLoc.pre)).padStart(15)} octets libres`));}
  }
  return code;
};
CMD.cd=function(args,ctx){
  const o=sw(args);const target=o.pos.map(unq).join(' ').trim();
  if(!target){ctx.out.push(L(cwdStr()));return 0;}
  if(/^[a-z]:$/i.test(target)){const dl=target[0].toUpperCase();if(!driveRoot(dl)){ctx.err.push('Le chemin d’accès spécifié est introuvable.');return 1;}ctx.out.push(L(dl+':\\'+(st.dcwd[dl]||[]).join('\\')));return 0;}
  if(target.startsWith('\\\\')){ctx.err.push(`"${target}"`);ctx.err.push('CMD ne prend pas en charge les chemins d’accès UNC comme répertoires en cours.');ctx.out.push(L('(Astuce : pushd '+target+' monte le partage sur une lettre temporaire, ou net use Z: '+target+')','t-warn'));return 1;}
  let loc;try{loc=resolve(target);}catch(e){ctx.err.push('Le chemin d’accès spécifié est introuvable.');return 1;}
  const n=nodeAt(loc);if(!n){ctx.err.push('Le chemin d’accès spécifié est introuvable.');return 1;}
  if(!n.d){ctx.err.push('Nom de répertoire non valide.');return 1;}
  const fx=fixCase(loc);const dl=fx.pre[0];
  st.dcwd[dl]=fx.segs;
  if(st.uncLoc&&!o.has('d')&&!/^[A-Z]:/.test(target)){st.uncLoc.segs=fx.segs;return 0;}
  if(o.has('d')||dl===st.drive||st.uncLoc){st.drive=dl;st.uncLoc=null;}
  return 0;
};
CMD.pushd=function(args,ctx){
  const t=args.map(unq).join(' ');st.psDirStack.push({drive:st.drive,segs:(st.dcwd[st.drive]||[]).slice()});
  if(!t){return 0;}
  if(t.startsWith('\\\\')){let loc;try{loc=resolve(t);}catch(e){ctx.err.push('Le chemin réseau n’a pas été trouvé.');return 1;}
    const free=['Z','Y','X','W'].find(l=>!st.mapped[l]);st.mapped[free]={root:loc.root,unc:loc.pre,temp:true};st.drive=free;st.dcwd[free]=loc.segs.slice();st.uncLoc=null;return 0;}
  return CMD.cd(['/d',...args],ctx);
};
CMD.popd=function(args,ctx){const p=st.psDirStack.pop();if(!p)return 0;const cur=st.mapped[st.drive];if(cur&&cur.temp)delete st.mapped[st.drive];st.drive=p.drive;st.dcwd[p.drive]=p.segs;return 0;};
CMD.md=function(args,ctx){
  let code=0;const list=args.length?args:[];if(!list.length){ctx.err.push('La syntaxe de la commande n’est pas correcte.');return 1;}
  for(const a of list){
    let loc;try{loc=resolve(unq(a));}catch(e){ctx.err.push(e.message);code=1;continue;}
    if(nodeAt(loc)){ctx.err.push(`Un sous-répertoire ou un fichier ${unq(a)} existe déjà.`);code=1;continue;}
    let n=loc.root;for(const s of loc.segs){let k=n.kids.get(lc(s));if(!k){k=D(s,[],{t:new Date(),c:new Date()});n.kids.set(lc(s),k);n.t=new Date();}else if(!k.d){ctx.err.push('Un sous-répertoire ou un fichier existe déjà.');code=1;break;}n=k;}
  }
  return code;
};
CMD.rd=function(args,ctx){
  const o=sw(args);let code=0;
  for(const a of o.pos){
    let loc;try{loc=resolve(unq(a));}catch(e){ctx.err.push(e.message);code=2;continue;}
    const n=nodeAt(loc);
    if(!n){ctx.err.push('Le fichier spécifié est introuvable.');code=2;continue;}
    if(!n.d){ctx.err.push('Nom de répertoire non valide.');code=267;continue;}
    if(sameOrInside(loc,curLoc())){ctx.err.push('Le processus ne peut pas accéder au fichier car ce fichier est utilisé par un autre processus.');code=32;continue;}
    if(n.kids.size&&!o.has('s')){ctx.err.push('Le répertoire n’est pas vide.');code=145;continue;}
    if(o.has('s')&&!o.has('q'))ctx.out.push(L(`${unq(a)}, Êtes-vous sûr (O/N) ? O`));
    const par=nodeAt(parentOf(loc));par.kids.delete(lc(loc.segs[loc.segs.length-1]));par.t=new Date();
  }
  return code;
};
CMD.del=function(args,ctx){
  const o=sw(args);let code=0;const af=o.m.a;
  if(!o.pos.length){ctx.err.push('La syntaxe de la commande n’est pas correcte.');return 1;}
  for(const a of o.pos){
    let loc;try{loc=resolve(unq(a));}catch(e){ctx.err.push(e.message);code=1;continue;}
    let n=nodeAt(loc);let dirLoc,pat;
    if(n&&n.d){dirLoc=loc;pat='*';}else{dirLoc=parentOf(loc);pat=loc.segs[loc.segs.length-1]||'*';}
    const dn=nodeAt(dirLoc);
    if(!dn||!dn.d){ctx.err.push(`Impossible de trouver ${showLoc(loc)}`);code=1;continue;}
    if((pat==='*'||pat==='*.*')&&!o.has('q'))ctx.out.push(L(`${showLoc(fixCase(dirLoc)).replace(/\\$/,'')}\\*, Êtes-vous sûr (O/N) ? O`));
    const rx=wild(pat==='*.*'?'*':pat);const targets=[];
    const collect=(dl,dnode)=>{for(const k of sortKids(dnode)){if(!k.d&&rx.test(k.name))targets.push({dl,k,parent:dnode});}if(o.has('s'))for(const k of sortKids(dnode))if(k.d)collect(childLoc(dl,k.name),k);};
    collect(fixCase(dirLoc),dn);
    const visible=targets.filter(t=>{if(af!=null&&af!==true)return lc(af).split('').every(c=>c==='-'||t.k.attr.includes(c));return !(t.k.attr.includes('h')||t.k.attr.includes('s'));});
    if(!visible.length){ctx.err.push(`Impossible de trouver ${showLoc(fixCase(loc))}`);code=1;continue;}
    for(const t of visible){
      const path=showLoc(t.dl).replace(/\\$/,'')+'\\'+t.k.name;
      if(t.k.attr.includes('r')&&!o.has('f')){ctx.err.push('Accès refusé - '+path);code=1;continue;}
      if(o.has('p'))ctx.out.push(L(`${path}, Supprimer (O/N) ? O`));
      t.parent.kids.delete(lc(t.k.name));t.parent.t=new Date();
      if(o.has('s'))ctx.out.push(L('Fichier supprimé - '+path));
    }
  }
  return code;
};
CMD.erase=CMD.del;
function copyInto(dirLoc,dirNode,f,newName){const c=cloneNode(f);c.name=newName||f.name;dirNode.kids.set(lc(c.name),c);dirNode.t=new Date();return c;}
CMD.copy=function(args,ctx){
  const o=sw(args);const src=o.pos[0],dst=o.pos[1]||'.';
  if(!src){ctx.err.push('La syntaxe de la commande n’est pas correcte.');return 1;}
  if(lc(unq(src))==='nul'){try{writeFile(unq(dst),'');}catch(e){ctx.err.push(e.message);return 1;}ctx.out.push(L('        1 fichier(s) copié(s).'));return 0;}
  let sl;try{sl=resolve(unq(src));}catch(e){ctx.err.push(e.message);return 1;}
  let files=[];const sn=nodeAt(sl);
  if(sn&&sn.d)files=sortKids(sn).filter(k=>!k.d&&!k.attr.includes('h'));
  else if(sn)files=[sn];
  else{const m=listMatch(sl);if(m&&m.items)files=m.items.filter(k=>!k.d);}
  if(!files.length){ctx.err.push('Le fichier spécifié est introuvable.');ctx.out.push(L('        0 fichier(s) copié(s).'));return 1;}
  let dl;try{dl=resolve(unq(dst));}catch(e){ctx.err.push(e.message);return 1;}
  const dn=nodeAt(dl);let count=0;const multi=files.length>1||hasWild(unq(src));
  for(const f of files){
    let tdir,tname;
    if(dn&&dn.d){tdir=dn;tname=f.name;}else{tdir=nodeAt(parentOf(dl));tname=dl.segs[dl.segs.length-1];}
    if(!tdir||!tdir.d){ctx.err.push('Le chemin d’accès spécifié est introuvable.');ctx.out.push(L('        0 fichier(s) copié(s).'));return 1;}
    if(multi)ctx.out.push(L(f.name));
    if(tdir.kids.get(lc(tname))&&!o.has('y')){ctx.out.push(L(`Remplacer ${showLoc(fixCase(dn&&dn.d?childLoc(dl,tname):dl))} (Oui/Non/Tous) : O`));}
    copyInto(null,tdir,f,tname);count++;
  }
  ctx.out.push(L(`        ${count} fichier(s) copié(s).`));return 0;
};
CMD.xcopy=function(args,ctx){
  const o=sw(args);const src=o.pos[0],dst=o.pos[1]||'.';
  if(!src){ctx.err.push('Nombre de paramètres non valide');return 4;}
  let sl,dl;try{sl=resolve(unq(src));dl=resolve(unq(dst));}catch(e){ctx.err.push(e.message);return 4;}
  let sdir,pat='*';const sn=nodeAt(sl);
  if(sn&&sn.d){sdir=sl;}else{sdir=parentOf(sl);pat=sl.segs[sl.segs.length-1];}
  const sd=nodeAt(sdir);if(!sd||!sd.d){ctx.err.push('Fichier introuvable - '+unq(src));ctx.out.push(L('0 fichier(s) copié(s)'));return 4;}
  let dn=nodeAt(dl);
  if(!dn){
    if(!o.has('i')&&!(sn&&sn.d))ctx.out.push(L(`${unq(dst)} désigne-t-il un nom de fichier`),L('ou un nom de répertoire de la destination'),L('(F = fichier, R = répertoire) ? R'));
    else if(!o.has('i'))ctx.out.push(L(`${unq(dst)} désigne-t-il un nom de fichier`),L('ou un nom de répertoire de la destination'),L('(F = fichier, R = répertoire) ? R'));
    if(!o.has('l')){CMD.md(['"'+showLoc(dl)+'"'],{err:[],out:[]});dn=nodeAt(dl);}
  }
  const rx=wild(pat==='*.*'?'*':pat);let count=0;let all=o.has('y');
  const rec=(sloc,snode,dloc,dnode)=>{
    for(const k of sortKids(snode)){
      if(k.attr.includes('h')&&!o.has('h'))continue;
      if(!k.d&&rx.test(k.name)){
        const sp=showLoc(fixCase(childLoc(sloc,k.name)));
        if(dnode&&dnode.kids.get(lc(k.name))&&!all&&!o.has('l')){ctx.out.push(L(`Remplacer ${showLoc(childLoc(dloc,k.name))} (Oui/Non/Tous) ? T`));all=true;}
        if(!o.has('q'))ctx.out.push(L(o.has('f')?`${sp} -> ${showLoc(childLoc(dloc,k.name))}`:sp));
        if(!o.has('l'))copyInto(null,dnode,k);count++;
      }
    }
    if(o.has('s')||o.has('e'))for(const k of sortKids(snode)){
      if(!k.d)continue;if(k.attr.includes('h')&&!o.has('h'))continue;
      const has=(function anyFile(n){for(const c of n.kids.values()){if(!c.d)return true;if(anyFile(c))return true;}return false;})(k);
      if(!has&&!o.has('e'))continue;
      let sub=dnode?dnode.kids.get(lc(k.name)):null;
      if(!sub&&!o.has('l')){sub=D(k.name,[],{t:new Date()});dnode.kids.set(lc(k.name),sub);}
      rec(childLoc(sloc,k.name),k,childLoc(dloc,k.name),sub);
    }
  };
  rec(fixCase(sdir),sd,fixCase(dl),dn);
  ctx.out.push(L(`${count} fichier(s) ${o.has('l')?'':'copié(s)'}`.trim()));
  return count?0:1;
};
const rsz=b=>b<1024?String(b):b<1048576?(b/1024).toFixed(1)+' k':b<1073741824?(b/1048576).toFixed(2)+' m':(b/1073741824).toFixed(3)+' g';
CMD.robocopy=function(args,ctx){
  if(args.length<2&&!args.includes('/?')){ctx.out.push(...outLines('robocopy_usage').map(x=>L(x)));return 16;}
  const pos=[],opt={};let mode=null;const xf=[],xd=[];
  for(const a0 of args){const a=unq(a0);
    if(/^\//.test(a)){mode=null;const b=a.slice(1);const ci=b.indexOf(':');const k=lc(ci<0?b:b.slice(0,ci));const v=ci<0?true:b.slice(ci+1);opt[k]=v;if(k==='xf'||k==='xd')mode=k;continue;}
    if(mode==='xf'){xf.push(a);continue;}if(mode==='xd'){xd.push(a);continue;}
    pos.push(a);}
  const [src,dst,...pats]=pos;const files=pats.length?pats:['*.*'];
  const list=!!opt.l,mir=!!opt.mir,purge=mir||!!opt.purge,recurse=mir||!!opt.e||!!opt.s,empty=mir||!!opt.e,mov=!!opt.mov||!!opt.move;
  const start=new Date();
  const H=[];const P=s=>H.push(L(s));
  let sl,dl;try{sl=resolve(src);dl=resolve(dst);}catch(e){ctx.err.push(e.message);return 16;}
  const sd=nodeAt(sl);
  const optsShown=['*.*'].concat(Object.keys(opt).map(k=>'/'+k.toUpperCase()+(opt[k]===true?'':':'+opt[k])));
  P('');P('-------------------------------------------------------------------------------');P('   ROBOCOPY     ::     Copie robuste de fichiers pour Windows');P('-------------------------------------------------------------------------------');P('');
  P(`  Début : ${flong(start)}`);P(`   Source : ${showLoc(fixCase(sl)).replace(/\\?$/,'\\')}`);P(`     Dest : ${showLoc(dl).replace(/\\?$/,'\\')}`);P('');P(`    Fichiers : ${files.join(' ')}`);P('');
  if(xf.length)P(`  Exc. fichiers : ${xf.join(' ')}`);if(xd.length)P(`     Exc. rép. : ${xd.join(' ')}`);
  P(`  Options : ${optsShown.join(' ')}${opt.r?'':' /R:1000000'}${opt.w?'':' /W:30'}`);P('');P('------------------------------------------------------------------------------');P('');
  if(!sd||!sd.d){P(`${start.getFullYear()}/${pad(start.getMonth()+1)}/${pad(start.getDate())} ${ftime(start)}:${pad(start.getSeconds())} ERREUR 2 (0x00000002) Accès au répertoire source ${showLoc(sl)}\\`);P('Le fichier spécifié est introuvable.');P('');H.forEach(x=>ctx.out.push(x));return 16;}
  const fx=files.map(p=>wild(p==='*.*'?'*':p)),xfx=xf.map(wild),xdx=xd.map(wild);
  const C={dT:0,dC:0,dS:0,dX:0,fT:0,fC:0,fS:0,fX:0,bT:0,bC:0,bS:0,bX:0};
  const showFiles=!opt.nfl,showDirs=!opt.ndl;
  const rec=(sloc,snode,dloc,dnode,lvl)=>{
    C.dT++;
    const sfiles=sortKids(snode).filter(k=>!k.d&&fx.some(r=>r.test(k.name))&&!xfx.some(r=>r.test(k.name)));
    let created=false;
    if(!dnode&&!list){dnode=D(dloc.segs[dloc.segs.length-1]||'x',[],{t:snode.t});const par=nodeAt(parentOf(dloc));if(par){par.kids.set(lc(dnode.name),dnode);created=true;}}
    else if(!dnode)created=true;
    if(created)C.dC++;else C.dS++;
    if(showDirs)P(`\t${(created?'  Nouveau rép. ':'')}${String(sfiles.length).padStart(created?6:20)}\t${showLoc(fixCase(sloc)).replace(/\\?$/,'\\')}`);
    for(const f of sfiles){
      C.fT++;C.bT+=f.size;
      const ex=dnode?dnode.kids.get(lc(f.name)):null;
      let st_='Nouveau fichier';
      if(ex&&!ex.d){if(ex.size===f.size&&+ex.t===+f.t){C.fS++;C.bS+=f.size;continue;}if(opt.xo&&ex.t>f.t){C.fS++;C.bS+=f.size;continue;}st_=ex.t>f.t?'Plus ancien':'Plus récent';}
      C.fC++;C.bC+=f.size;
      if(showFiles)P(`\t    ${st_.padEnd(16)}\t${rsz(f.size).padStart(10)}\t${f.name}`+(opt.np||list?'':'  100%'));
      if(!list){const c=copyInto(null,dnode,f);c.t=f.t;}
      if(mov&&!list)snode.kids.delete(lc(f.name));
    }
    if(purge&&dnode){for(const k of sortKids(dnode)){const s=snode.kids.get(lc(k.name));if(!s||(s.d!==k.d)){if(k.d){C.dX++;if(showDirs)P(`\t*RÉP. SUPPLÉMENTAIRE        -1\t${showLoc(childLoc(dloc,k.name))}\\`);}else{if(fx.some(r=>r.test(k.name))){C.fX++;C.bX+=k.size;if(showFiles)P(`\t    *FICHIER SUPPLÉMENTAIRE\t${rsz(k.size).padStart(10)}\t${k.name}`);}else continue;}if(!list)dnode.kids.delete(lc(k.name));}}}
    if(recurse)for(const k of sortKids(snode)){if(!k.d||xdx.some(r=>r.test(k.name)))continue;
      const hasF=(function any(n){for(const c of n.kids.values()){if(!c.d)return true;if(any(c))return true;}return false;})(k);
      if(!hasF&&!empty)continue;
      rec(childLoc(sloc,k.name),k,childLoc(dloc,k.name),dnode?dnode.kids.get(lc(k.name)):null,lvl+1);}
  };
  let dn=nodeAt(dl);
  if(!dn&&!list){const par=nodeAt(parentOf(dl));if(!par){CMD.md(['"'+showLoc(dl)+'"'],{err:[],out:[]});dn=nodeAt(dl);}}
  rec(fixCase(sl),sd,dl,dn,0);
  const end=new Date();
  P('');P('------------------------------------------------------------------------------');P('');
  P('               Total    Copié   Ignoré  Discordance      ÉCHEC    Extras');
  P(`    Rép :  ${String(C.dT).padStart(9)} ${String(C.dC).padStart(9)} ${String(C.dS).padStart(9)} ${String(0).padStart(9)} ${String(0).padStart(9)} ${String(C.dX).padStart(9)}`);
  P(`Fichiers : ${String(C.fT).padStart(9)} ${String(C.fC).padStart(9)} ${String(C.fS).padStart(9)} ${String(0).padStart(9)} ${String(0).padStart(9)} ${String(C.fX).padStart(9)}`);
  P(`  Octets : ${rsz(C.bT).padStart(9)} ${rsz(C.bC).padStart(9)} ${rsz(C.bS).padStart(9)} ${String(0).padStart(9)} ${String(0).padStart(9)} ${rsz(C.bX).padStart(9)}`);
  P(`   Heures :   0:00:00   0:00:00                       0:00:00   0:00:00`);
  P(`   Fin : ${flong(end)}`);P('');
  const code=(C.fC>0?1:0)+((C.fX+C.dX)>0?2:0);
  const logFile=opt['log+']||opt.log;
  if(logFile&&logFile!==true){try{writeFile(logFile,H.map(x=>x.s).join('\n'),!!opt['log+']);}catch(e){}ctx.out.push(L(''));ctx.out.push(L(` Fichier journal : ${showLoc(resolve(logFile))}`));if(opt.tee)H.forEach(x=>ctx.out.push(x));}
  else H.forEach(x=>ctx.out.push(x));
  if(ctx.res&&!ctx.batch)ctx.out.push(L(`(Code de sortie robocopy : ${code} — ${code<8?'succès':'échec'}${list?', mode liste /L : rien n’a été copié':''})`,'t-warn'));
  return code;
};
CMD.move=function(args,ctx){
  const o=sw(args);const src=o.pos[0],dst=o.pos[1];
  if(!src||!dst){ctx.err.push('La syntaxe de la commande n’est pas correcte.');return 1;}
  let sl,dl;try{sl=resolve(unq(src));dl=resolve(unq(dst));}catch(e){ctx.err.push(e.message);return 1;}
  const sn=nodeAt(sl);let items=[];let fromDir;
  if(sn){items=[sn];fromDir=nodeAt(parentOf(sl));}else{const m=listMatch(sl);if(m&&m.items){items=m.items;fromDir=nodeAt(m.dir);}}
  if(!items.length){ctx.err.push('Le fichier spécifié est introuvable.');return 1;}
  const dn=nodeAt(dl);let nf_=0,nd=0;
  for(const it of items){
    let tdir,tname;if(dn&&dn.d){tdir=dn;tname=it.name;}else{tdir=nodeAt(parentOf(dl));tname=dl.segs[dl.segs.length-1];}
    if(!tdir){ctx.err.push('Le chemin d’accès spécifié est introuvable.');return 1;}
    if(tdir.kids.get(lc(tname))&&!it.d&&!o.has('y'))ctx.out.push(L(`Remplacer ${showLoc(dn&&dn.d?childLoc(dl,tname):dl)} (Oui/Non/Tous) : O`));
    fromDir.kids.delete(lc(it.name));it.name=tname;tdir.kids.set(lc(tname),it);if(it.d)nd++;else nf_++;
  }
  ctx.out.push(L(nd&&!nf_?`        ${nd} répertoire(s) déplacé(s).`:`        ${nf_+nd} fichier(s) déplacé(s).`));return 0;
};
CMD.ren=function(args,ctx){
  const a=args.map(unq);if(a.length<2){ctx.err.push('La syntaxe de la commande n’est pas correcte.');return 1;}
  if(/[\\:]/.test(a[1])){ctx.err.push('La syntaxe de la commande n’est pas correcte.');ctx.out.push(L('(Le nouveau nom ne doit contenir que le nom, pas de chemin.)','t-warn'));return 1;}
  let sl;try{sl=resolve(a[0]);}catch(e){ctx.err.push(e.message);return 1;}
  const par=nodeAt(parentOf(sl));let items=[];const sn=nodeAt(sl);
  if(sn)items=[sn];else{const m=listMatch(sl);if(m&&m.items)items=m.items;}
  if(!items.length){ctx.err.push('Le fichier spécifié est introuvable.');return 1;}
  for(const it of items){
    let nn=a[1];
    if(hasWild(nn)){const base=it.name.replace(/\.[^.]*$/,''),ext=(it.name.match(/\.[^.]*$/)||[''])[0];nn=nn.replace(/^\*\./,base+'.').replace(/^\*$/,it.name).replace(/\.\*$/,ext);}
    if(par.kids.get(lc(nn))&&lc(nn)!==lc(it.name)){ctx.err.push('Il existe un fichier en double, ou le fichier est introuvable.');return 1;}
    par.kids.delete(lc(it.name));it.name=nn;par.kids.set(lc(nn),it);
  }
  return 0;
};
CMD.rename=CMD.ren;
CMD.type=function(args,ctx){
  if(!args.length){ctx.err.push('La syntaxe de la commande n’est pas correcte.');return 1;}
  let code=0;
  for(const a0 of args){const a=unq(a0);if(lc(a)==='nul')continue;
    let loc;try{loc=resolve(a);}catch(e){ctx.err.push(e.message);code=1;continue;}
    const n=nodeAt(loc);let files=[];
    if(n&&n.d){ctx.err.push('Accès refusé.');code=1;continue;}
    if(n)files=[n];else{const m=listMatch(loc);if(m&&m.items)files=m.items.filter(k=>!k.d);}
    if(!files.length){ctx.err.push('Le fichier spécifié est introuvable.');code=1;continue;}
    const multi=files.length>1||args.length>1;
    for(const f of files){
      if(multi){ctx.err.push(L(''));ctx.err.push(L(f.name));ctx.err.push(L(''));ctx.err.push(L(''));}
      if(f.bin)ctx.out.push(L('MZ\u2400\u2401  ÿÿ  ¸       @   (fichier binaire)'));
      else f.content.split('\n').forEach(x=>ctx.out.push(L(x)));
    }
  }
  return code;
};
CMD.more=function(args,ctx){if(ctx.stdin){ctx.stdin.forEach(x=>ctx.out.push(L(x)));return 0;}return CMD.type(args.filter(a=>!/^[\/+]/.test(a)),ctx);};
CMD.echo=function(args,ctx,raw){
  if(typeof args==='string'){const r_=args;if(/^[.,:;\/\\(\[+]/.test(r_)){ctx.out.push(L(r_.slice(1)));return;}raw=r_.replace(/^\s/,'');}
  const t=(raw||'').trim();
  if(!t){ctx.out.push(L(st.echo?'ECHO est activé.':'ECHO est désactivé.'));return;}
  if(/^off$/i.test(t)){st.echo=false;return;}if(/^on$/i.test(t)){st.echo=true;return;}
  ctx.out.push(L((raw||'').replace(/\s+$/,'')));return;
};
CMD.attrib=function(args,ctx){
  const mods=[],paths=[];let s=false,d=false;
  for(const a of args){if(/^[+-][rahsi]$/i.test(a))mods.push(lc(a));else if(/^\/s$/i.test(a))s=true;else if(/^\/d$/i.test(a))d=true;else paths.push(unq(a));}
  if(!paths.length)paths.push('*');
  let code=0;
  for(const p of paths){
    let loc;try{loc=resolve(p);}catch(e){ctx.err.push(e.message);code=1;continue;}
    let items=[];const n=nodeAt(loc);
    if(n&&(!n.d||d||mods.length))items=[{n,loc}];
    else{const dirLoc=n&&n.d?loc:parentOf(loc);const pat=n&&n.d?'*':loc.segs[loc.segs.length-1];const rx=wild(pat);const dn=nodeAt(dirLoc);
      if(dn&&dn.d){const go=(dl,dnode)=>{for(const k of sortKids(dnode)){if(rx.test(k.name)&&(!k.d||d))items.push({n:k,loc:childLoc(dl,k.name)});if(s&&k.d)go(childLoc(dl,k.name),k);}};go(fixCase(dirLoc),dn);}}
    if(!items.length){ctx.err.push('Fichier introuvable - '+showLoc(loc));code=1;continue;}
    for(const it of items){
      if(mods.length){for(const m_ of mods){const c=m_[1];if(m_[0]==='+'){if(!it.n.attr.includes(c))it.n.attr+=c;}else it.n.attr=it.n.attr.replace(c,'');}}
      else{const a=it.n.attr;ctx.out.push(L(`${a.includes('a')?'A':' '}    ${a.includes('s')?'S':' '}${a.includes('h')?'H':' '}${a.includes('r')?'R':' '}             ${showLoc(fixCase(it.loc))}`));}
    }
  }
  return code;
};
CMD.tree=function(args,ctx){
  const o=sw(args);const p=o.pos[0]?unq(o.pos[0]):'.';
  let loc;try{loc=resolve(p);}catch(e){ctx.err.push(e.message);return 1;}
  const n=nodeAt(loc);if(!n||!n.d){ctx.err.push('Chemin non valide - '+p.toUpperCase());ctx.out.push(L('Aucun sous-dossier'));return 1;}
  const asc=o.has('a');const B=asc?['+---','\\---','|   ','    ']:['├───','└───','│   ','    '];
  ctx.out.push(L('Structure du dossier pour le volume OS'));ctx.out.push(L('Le numéro de série du volume est 7A3C-91F2'));ctx.out.push(L(showLoc(fixCase(loc)).toUpperCase()));
  let lines=0;
  const go=(node,prefix)=>{
    const kids=sortKids(node).filter(k=>!k.attr.includes('h'));const dirs=kids.filter(k=>k.d),files=kids.filter(k=>!k.d);
    if(o.has('f')){files.forEach(f=>{ctx.out.push(L(prefix+(dirs.length?B[2]:B[3])+f.name));lines++;});if(files.length)ctx.out.push(L(prefix+(dirs.length?B[2]:B[3]).trimEnd()));}
    dirs.forEach((dd,i)=>{if(lines>400)return;const last=i===dirs.length-1;ctx.out.push(L(prefix+(last?B[1]:B[0])+dd.name));lines++;go(dd,prefix+(last?B[3]:B[2]));});
  };
  go(n,'');
  if(!lines)ctx.out.push(L('Aucun sous-dossier'));
  return 0;
};
function readInputs(paths,ctx,o){
  const res=[];
  for(const p0 of paths){const p=unq(p0);let loc;try{loc=resolve(p);}catch(e){ctx.err.push(e.message);continue;}
    const n=nodeAt(loc);let files=[];
    if(n&&!n.d)files=[{n,loc}];
    else{const dirLoc=parentOf(loc);const rx=wild(loc.segs[loc.segs.length-1]||'*');const dn=nodeAt(dirLoc);
      if(dn&&dn.d){const go=(dl,dnode)=>{for(const k of sortKids(dnode)){if(!k.d&&rx.test(k.name))files.push({n:k,loc:childLoc(dl,k.name)});if(o&&o.has('s')&&k.d)go(childLoc(dl,k.name),k);}};go(fixCase(dirLoc),dn);}}
    if(!files.length)ctx.err.push(`Impossible d’ouvrir ${p}`);
    files.forEach(f=>res.push({name:showLoc(fixCase(f.loc)),lines:f.n.bin?[]:f.n.content.split('\n')}));
  }
  return res;
}
CMD.find=function(args,ctx){
  const o=sw(args);const pos=o.pos.slice();const qi=pos.findIndex(a=>/^".*"$/.test(a));
  if(qi<0){ctx.err.push('FIND : format de paramètre incorrect');return 2;}
  const needle=unq(pos.splice(qi,1)[0]);const ci=o.has('i');
  const test=l=>{const h=ci?lc(l):l,n=ci?lc(needle):needle;const has=h.includes(n);return o.has('v')?!has:has;};
  const run=(lines,head)=>{const hits=[];lines.forEach((l,i)=>{if(test(l))hits.push(o.has('n')?`[${i+1}]${l}`:l);});
    if(head!=null){if(o.has('c')){ctx.out.push(L(`---------- ${head.toUpperCase()}: ${hits.length}`));}else{ctx.out.push(L(''));ctx.out.push(L(`---------- ${head.toUpperCase()}`));hits.forEach(h=>ctx.out.push(L(h)));}}
    else{if(o.has('c'))ctx.out.push(L(String(hits.length)));else hits.forEach(h=>ctx.out.push(L(h)));}return hits.length;};
  let total=0;
  if(pos.length)readInputs(pos,ctx).forEach(f=>total+=run(f.lines,f.name));
  else total=run(ctx.stdin||[],null);
  return total?0:1;
};
CMD.findstr=function(args,ctx){
  const o=sw(args);let pats=[];const pos=o.pos.slice();
  args.forEach(a=>{const m=/^\/c:(.*)$/i.exec(a);if(m)pats.push(unq(m[1]));});
  if(!pats.length){if(!pos.length){ctx.err.push('FINDSTR : mauvais argument de ligne de commande');return 2;}pats=unq(pos.shift()).split(/\s+/).filter(Boolean);}
  const ci=o.has('i'),re=o.has('r');
  const mk=p=>{try{if(re){let s=p.replace(/\\</g,'\\b').replace(/\\>/g,'\\b');return new RegExp(s,ci?'i':'');}}catch(e){}const s=p.replace(/[.+^${}()|[\]\\*?]/g,'\\$&');return new RegExp(o.has('b')?'^'+s:o.has('e')?s+'$':o.has('x')?'^'+s+'$':s,ci?'i':'');};
  const rxs=pats.map(mk);
  const test=l=>{const hit=rxs.some(r=>r.test(l));return o.has('v')?!hit:hit;};
  let total=0;
  if(pos.length){
    const files=readInputs(pos,ctx,o);const multi=files.length>1||o.has('s');
    for(const f of files){let c=0;f.lines.forEach((l,i)=>{if(test(l)){c++;if(!o.has('m'))ctx.out.push(L((multi?f.name+':':'')+(o.has('n')?(i+1)+':':'')+l));}});if(c&&o.has('m'))ctx.out.push(L(f.name));total+=c;}
  }else{(ctx.stdin||[]).forEach((l,i)=>{if(test(l)){total++;ctx.out.push(L((o.has('n')?(i+1)+':':'')+l));}});}
  return total?0:1;
};
CMD.sort=function(args,ctx){const o=sw(args);let lines=ctx.stdin||[];if(o.pos.length){const f=readInputs(o.pos,ctx);lines=f.length?f[0].lines:[];}const s=lines.slice().sort((a,b)=>lc(a)<lc(b)?-1:lc(a)>lc(b)?1:0);if(o.has('r'))s.reverse();s.forEach(x=>ctx.out.push(L(x)));return 0;};
const EXE_PATH={ping:'C:\\Windows\\System32\\PING.EXE',ipconfig:'C:\\Windows\\System32\\ipconfig.exe',robocopy:'C:\\Windows\\System32\\Robocopy.exe',notepad:'C:\\Windows\\System32\\notepad.exe\nC:\\Windows\\notepad.exe',powershell:'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',psexec:'C:\\Tools\\Sysinternals\\PsExec.exe',cmd:'C:\\Windows\\System32\\cmd.exe',nslookup:'C:\\Windows\\System32\\nslookup.exe',tasklist:'C:\\Windows\\System32\\tasklist.exe',gpupdate:'C:\\Windows\\System32\\gpupdate.exe',whoami:'C:\\Windows\\System32\\whoami.exe',findstr:'C:\\Windows\\System32\\findstr.exe',sc:'C:\\Windows\\System32\\sc.exe',net:'C:\\Windows\\System32\\net.exe','7z':'C:\\Program Files\\7-Zip\\7z.exe',chrome:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'};
CMD.where=function(args,ctx){const o=sw(args);let code=0;for(const a of o.pos){const k=lc(unq(a)).replace(/\.(exe|com)$/,'');if(EXE_PATH[k])EXE_PATH[k].split('\n').forEach(x=>ctx.out.push(L(x)));else if(CMD[k]&&!['dir','cd','md','rd','del','copy','move','ren','type','echo','set','cls','if','for'].includes(k))ctx.out.push(L(`C:\\Windows\\System32\\${k}.exe`));else{ctx.err.push('INFORMATION : impossible de trouver des fichiers pour le(s) modèle(s) spécifié(s).');code=1;}}return code;};
CMD.fc=function(args,ctx){const o=sw(args);if(o.pos.length<2){ctx.err.push('FC : nombre de fichiers non valide');return 2;}const a=readFile(unq(o.pos[0])),b=readFile(unq(o.pos[1]));if(a==null||b==null){ctx.err.push('FC : impossible d’ouvrir '+unq(a==null?o.pos[0]:o.pos[1])+' - Aucun fichier ou dossier de ce type');return 2;}
  ctx.out.push(L(`Comparaison des fichiers ${unq(o.pos[0]).toUpperCase()} et ${unq(o.pos[1]).toUpperCase()}`));const A=a.split('\n'),B=b.split('\n');const ci=o.has('c');let diff=0;
  for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||'',y=B[i]||'';if(ci?lc(x)!==lc(y):x!==y){diff++;ctx.out.push(L(`***** ${unq(o.pos[0]).toUpperCase()}`),L(x),L(`***** ${unq(o.pos[1]).toUpperCase()}`),L(y),L('*****'),L(''));if(diff>5)break;}}
  if(!diff)ctx.out.push(L('FC : aucune différence trouvée'));return diff?1:0;};
CMD.certutil=function(args,ctx){const o=sw(args,['hashfile']);const i=args.findIndex(a=>/^-hashfile$/i.test(a));if(i<0){ctx.out.push(L('(Simulation) certutil : seule l’option -hashfile est simulée.','t-warn'));return 0;}const f=unq(args[i+1]||'');const algo=(args[i+2]||'SHA1').toUpperCase();const loc=resolve(f);const n=nodeAt(loc);if(!n||n.d){ctx.err.push('CertUtil: -hashfile La commande a échoué : 0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)');ctx.err.push('CertUtil: Le fichier spécifié est introuvable.');return 2;}
  const len={MD5:32,SHA1:40,SHA256:64,SHA384:96,SHA512:128}[algo]||40;ctx.out.push(L(`${algo} hachage de ${showLoc(fixCase(loc))} :`));ctx.out.push(L(fakeHash(n.name+n.size+(n.content||''),len).toLowerCase()));ctx.out.push(L('CertUtil: -hashfile La commande s’est terminée correctement.'));return 0;};
CMD.icacls=function(args,ctx){
  const o=args.map(unq);const p=o[0];if(!p){ctx.out.push(...outLines('icacls_usage').map(x=>L(x)));return 87;}
  let loc;try{loc=resolve(p);}catch(e){ctx.err.push(e.message);return 2;}
  const n=nodeAt(loc);if(!n){ctx.err.push(p+': Le fichier spécifié est introuvable.');ctx.out.push(L('1 fichiers correctement traités ; échec du traitement de 1 fichiers'));return 2;}
  if(!n.acl)n.acl=[['AUTORITE NT\\Système','(I)(OI)(CI)(F)'],['BUILTIN\\Administrateurs','(I)(OI)(CI)(F)'],['BUILTIN\\Utilisateurs','(I)(OI)(CI)(RX)'],['AUTORITE NT\\Utilisateurs authentifiés','(I)(OI)(CI)(M)']];
  const rest=o.slice(1);
  if(!rest.length||rest.every(a=>/^\/[tcql]$/i.test(a))){const fx=showLoc(fixCase(loc));n.acl.forEach((a,i)=>ctx.out.push(L((i===0?fx+' ':' '.repeat(fx.length+1))+a[0]+':'+a[1])));ctx.out.push(L(''));ctx.out.push(L('1 fichiers correctement traités ; échec du traitement de 0 fichiers'));return 0;}
  for(let i=0;i<rest.length;i++){const a=lc(rest[i]);
    if(a==='/grant'||a==='/grant:r'){const g=rest[++i]||'';const m=/^(.+?):(.+)$/.exec(g);if(m){if(a==='/grant:r')n.acl=n.acl.filter(x=>lc(x[0])!==lc(m[1]));n.acl.push([m[1],m[2]]);}}
    else if(a==='/remove'||a==='/remove:g'){const who=rest[++i]||'';n.acl=n.acl.filter(x=>lc(x[0])!==lc(who));}
    else if(a==='/deny'){const g=rest[++i]||'';const m=/^(.+?):(.+)$/.exec(g);if(m)n.acl.unshift([m[1],'(DENY)'+m[2]]);}
    else if(/^\/inheritance:r$/.test(a)){n.acl=n.acl.filter(x=>!x[1].includes('(I)'));}
    else if(/^\/inheritance:d$/.test(a)){n.acl=n.acl.map(x=>[x[0],x[1].replace('(I)','')]);}
    else if(a==='/reset'){n.acl=null;}
  }
  ctx.out.push(L('fichier traité : '+showLoc(fixCase(loc))));ctx.out.push(L('1 fichiers correctement traités ; échec du traitement de 0 fichiers'));return 0;
};
CMD.takeown=function(args,ctx){const o=sw(args);const f=o.m.f;if(!f||f===true){ctx.err.push('ERREUR : syntaxe incorrecte. Tapez « TAKEOWN /? » pour l’aide.');return 1;}if(!exists(f)){ctx.err.push(`ERREUR : le fichier (ou dossier) « ${f} » est introuvable.`);return 1;}ctx.out.push(L(''));ctx.out.push(L(`OPÉRATION RÉUSSIE : le fichier (ou dossier) « ${showLoc(fixCase(resolve(f)))} » appartient maintenant à l’utilisateur « CONTOSO\\it.tech ».`));return 0;};
CMD.mklink=function(args,ctx){const o=sw(args);if(o.pos.length<2){ctx.err.push('La syntaxe de la commande n’est pas correcte.');return 1;}ctx.out.push(L(`${o.has('j')?'Jonction':'Lien symbolique'} créé(e) pour ${unq(o.pos[0])} <<===>> ${unq(o.pos[1])}`));return 0;};

/* ---------- variables, environnement, divers ---------- */
function setA(expr){
  let i=0;const s=expr;const sp=()=>{while(i<s.length&&/\s/.test(s[i]))i++;};
  const num=()=>{sp();let m=/^(0x[0-9a-f]+|\d+)/i.exec(s.slice(i));if(m){i+=m[0].length;return parseInt(m[0]);}m=/^[A-Za-z_][\w]*/.exec(s.slice(i));if(m){i+=m[0].length;const v=parseInt(envGet(m[0])||'0');return isNaN(v)?0:v;}if(s[i]==='('){i++;const v=assign();sp();if(s[i]===')')i++;return v;}if(s[i]==='-'){i++;return -num();}if(s[i]==='!'){i++;return num()?0:1;}if(s[i]==='~'){i++;return ~num();}throw new Error('Opérande manquant.');};
  const mul=()=>{let v=num();for(;;){sp();const c=s[i];if((c==='*'||c==='/'||c==='%')&&s[i+1]!=='='){i++;const r_=num();if((c==='/'||c==='%')&&r_===0)throw new Error('Division par zéro.');v=c==='*'?v*r_:c==='/'?Math.trunc(v/r_):v%r_;}else return v|0;}};
  const add=()=>{let v=mul();for(;;){sp();const c=s[i];if((c==='+'||c==='-')&&s[i+1]!=='='){i++;const r_=mul();v=c==='+'?v+r_:v-r_;}else return v|0;}};
  const assign=()=>{sp();const m=/^([A-Za-z_][\w]*)\s*([+\-*\/%]?=)(?!=)/.exec(s.slice(i));if(m){i+=m[0].length;const r_=assign();const cur=parseInt(envGet(m[1])||'0')||0;const v=m[2]==='='?r_:m[2]==='+='?cur+r_:m[2]==='-='?cur-r_:m[2]==='*='?cur*r_:m[2]==='/='?Math.trunc(cur/r_):cur%r_;envSet(m[1],String(v|0));return v|0;}return add();};
  let last=0;for(;;){last=assign();sp();if(s[i]===','){i++;continue;}break;}
  return last;
}
CMD.set=function(args,ctx,raw){
  raw=(raw||'').trim();
  if(!raw){Object.keys(st.env).sort((a,b)=>lc(a)<lc(b)?-1:1).forEach(k=>ctx.out.push(L(`${k}=${st.env[k]}`)));return 0;}
  if(/^\/a\b/i.test(raw)){try{const v=setA(raw.replace(/^\/a\s*/i,'').replace(/"/g,''));if(!ctx.batch)ctx.out.push(L(String(v)));return 0;}catch(e){ctx.err.push(e.message);return 1;}}
  if(/^\/p\b/i.test(raw)){const m=/^\/p\s*"?([^=]+)=(.*?)"?$/i.exec(raw);if(m){ctx.out.push(L(m[2]+'(saisie simulée : réponse vide — set /p attend normalement une frappe clavier)','t-warn'));}return 0;}
  const s=raw.replace(/^"(.*)"$/,'$1');const i=s.indexOf('=');
  if(i<0){const ks=Object.keys(st.env).filter(k=>lc(k).startsWith(lc(s))).sort();if(!ks.length){ctx.err.push(`La variable d’environnement ${s} n’est pas définie.`);return 1;}ks.forEach(k=>ctx.out.push(L(`${k}=${st.env[k]}`)));return 0;}
  envSet(s.slice(0,i),s.slice(i+1));return 0;
};
CMD.setx=function(args,ctx){if(args.length<2){ctx.err.push('ERREUR : syntaxe incorrecte.');return 1;}ctx.out.push(L(''));ctx.out.push(L('OPÉRATION RÉUSSIE : la valeur spécifiée a été enregistrée.'));if(!ctx.batch)ctx.out.push(L('(setx écrit dans le registre : la valeur n’apparaîtra que dans les NOUVELLES fenêtres, pas dans celle-ci.)','t-warn'));return 0;};
CMD.setlocal=()=>{};CMD.endlocal=()=>{};CMD.title=()=>{};CMD.color=()=>{};CMD.prompt=()=>{};CMD.rem=()=>{};
CMD.cls=function(args,ctx){ctx.res.clear=true;ctx.out.length=0;return 0;};
CMD.ver=function(args,ctx){ctx.out.push(L(''));ctx.out.push(L('Microsoft Windows [version 10.0.26100.2033]'));return 0;};
CMD.hostname=function(args,ctx){ctx.out.push(L(st.psctx&&st.psctx.host?st.psctx.host:'PC-IT-01'));return 0;};
CMD.date=function(args,ctx){const o=sw(args);ctx.out.push(L(o.has('t')?fdate(new Date()):'La date du jour est : '+fdate(new Date())));if(!o.has('t'))ctx.out.push(L('Entrez la nouvelle date : (jj-mm-aa) (non modifiable dans le simulateur)','t-warn'));return 0;};
CMD.time=function(args,ctx){const o=sw(args);ctx.out.push(L(o.has('t')?ftime(new Date()):'L’heure actuelle est : '+dynVar('time')));return 0;};
CMD.pause=function(args,ctx){ctx.out.push(L('Appuyez sur une touche pour continuer...'));};
CMD.timeout=function(args,ctx){const o=sw(args,['t']);const n=+(o.m.t||o.pos[0]||0);ctx.out.push(L(''));ctx.out.push(L(`Attente de ${n} secondes, appuyez sur une touche pour continuer ...0`));return 0;};
CMD.choice=function(args,ctx){const o=sw(args,['c','m','t','d']);ctx.out.push(L((o.m.m&&o.m.m!==true?o.m.m:'')+` [${(o.m.c&&o.m.c!==true?o.m.c:'ON').split('').join(',')}]?${(o.m.c&&o.m.c!==true?o.m.c:'ON')[0]}`));return 1;};
CMD.goto=function(args,ctx){ctx.out.push(L('(goto ne fonctionne que dans un fichier .bat)','t-warn'));return 0;};
CMD.shift=()=>0;
CMD.chcp=function(args,ctx){ctx.out.push(L('Page de codes active : '+(args[0]||'850')));return 0;};
CMD.exit=function(args,ctx){if(ctx.batch&&/^\/b$/i.test(args[0]||'')){st.batchExit=true;return +(args[1]||st.errorlevel);}if(ctx.batch){st.batchExit=true;return 0;}if(st.stack.length){ctx.res.exit=true;ctx.res.pop=true;return 0;}ctx.out.push(L('(exit fermerait la fenêtre. Ici, le simulateur reste ouvert.)','t-warn'));return 0;};
CMD.help=function(args,ctx){if(args[0]){const h=helpProvider(lc(args[0]),'cmd');if(h){h.forEach(x=>ctx.out.push(L(x)));return 0;}ctx.out.push(L('Cette commande n’est pas prise en charge par l’utilitaire d’aide. Essayez « '+args[0]+' /? ».'));return 1;}outLines('help').forEach(x=>ctx.out.push(L(x)));return 0;};
CMD.start=function(args,ctx){const a=args.map(unq).filter(x=>!/^\//.test(x));let t=a[0]||'';if(a.length>1&&args[0]&&args[0].startsWith('"'))t=a[1];
  if(!t){ctx.out.push(L('(Simulation) Une nouvelle fenêtre d’invite de commandes s’ouvre.','t-warn'));return 0;}
  if(/^https?:/i.test(t)){ctx.out.push(L(`(Simulation) Ouverture de ${t} dans le navigateur par défaut.`,'t-warn'));return 0;}
  const k=lc(t).replace(/\.exe$/,'');if(['notepad','calc','mspaint','chrome','excel','winword','outlook'].includes(k)){st.procs.push({Name:k==='calc'?'CalculatorApp':k,Id:st.nextPid+=8,SessionName:'Console',SI:1,WS:24117248,CPU:0.2,Handles:210,Svc:''});ctx.out.push(L(`(Simulation) ${t} démarre (PID ${st.nextPid}).`,'t-warn'));return 0;}
  if(KNOWN_GUI[k]||KNOWN_GUI[lc(t)]){ctx.out.push(L(KNOWN_GUI[k]||KNOWN_GUI[lc(t)],'t-warn'));return 0;}
  if(exists(t)){ctx.out.push(L(`(Simulation) Ouverture de ${t}.`,'t-warn'));return 0;}
  ctx.err.push(`Windows ne parvient pas à trouver '${t}'. Vérifiez que vous avez entré le nom correctement et réessayez.`);return 1;};
CMD.mstsc=function(args,ctx){const v=(args.find(a=>/^\/v:/i.test(a))||'').slice(3);const sh=args.find(a=>/^\/shadow:/i.test(a));
  if(sh){const id=sh.split(':')[1];const h=findHost(v);if(!h||!h.up){ctx.out.push(L(`(Simulation) Impossible de joindre ${v||'?'} pour le contrôle à distance.`,'t-err'));return 1;}ctx.out.push(L(`(Simulation) ${args.some(a=>/^\/control$/i.test(a))?'Contrôle':'Observation'} de la session ${id} sur ${h.n}${args.some(a=>/^\/noconsentprompt$/i.test(a))?' sans demande de consentement (si la GPO l’autorise)':' : l’utilisateur doit accepter la demande'}.`,'t-warn'));return 0;}
  ctx.out.push(L(v?`(Simulation) Connexion Bureau à distance vers ${v}…`:'(Simulation) La Connexion Bureau à distance s’ouvre.','t-warn'));return 0;};
CMD.runas=function(args,ctx){const u=(args.find(a=>/^\/user:/i.test(a))||'').slice(6);const prog=unq(args[args.length-1]||'');ctx.out.push(L(`Entrez le mot de passe de ${u} : `));ctx.out.push(L(`Tentative de lancement de ${prog} en tant qu’utilisateur « ${u} »...`));return 0;};
CMD.format=function(args,ctx){ctx.out.push(L('(Le simulateur refuse de formater un lecteur. Pour info : format D: /fs:NTFS /q /v:DATA efface TOUT le volume D:.)','t-warn'));return 1;};
CMD.diskpart=function(args,ctx){ctx.out.push(L('(diskpart ouvre un interpréteur interactif : list disk, select disk 1, clean… Non simulé : clean efface la table de partitions.)','t-warn'));return 0;};
CMD.cipher=function(args,ctx){ctx.out.push(L('(Simulation) cipher /w efface l’espace libre ; non exécuté dans le bac à sable.','t-warn'));return 0;};
CMD.cleanmgr=function(args,ctx){ctx.out.push(L('(Simulation) Le Nettoyage de disque s’ouvre (cleanmgr /sageset:1 puis /sagerun:1 pour l’automatiser).','t-warn'));return 0;};
CMD.cmd=function(args,ctx,raw){
  const m=/^\/[ck]\s+(.*)$/i.exec((raw||'').trim());
  if(m){let inner=m[1].trim().replace(/^"(.*)"$/,'$1');const r_=runCmdLine(inner);r_.lines.forEach(x=>ctx.out.push(x));return st.errorlevel;}
  ctx.out.push(L('Microsoft Windows [version 10.0.26100.2033]'));ctx.out.push(L('(c) Microsoft Corporation. Tous droits réservés.'));
  if(st.shell==='ps'){ctx.res.pushCmd=true;}
  return 0;
};
CMD.powershell=function(args,ctx,raw){
  const r0=(raw||'').trim();
  const mC=/(?:^|\s)-(?:c|command)\s+(.*)$/i.exec(r0);
  const mF=/(?:^|\s)-(?:f|file)\s+("?)([^"]+)\1/i.exec(r0);
  const ep=/-(?:ep|executionpolicy)\s+(\w+)/i.exec(r0);
  if(mC){let c=mC[1].trim().replace(/^"(.*)"$/,'$1').replace(/^\{(.*)\}$/,'$1');const out=runPsCapture(c);out.forEach(x=>ctx.out.push(x));return st.lastExit;}
  if(mF){const out=runPsScript(mF[2].trim(),ep?ep[1]:null);out.forEach(x=>ctx.out.push(x));return 0;}
  ctx.res.pushPs=true;return 0;
};
CMD.pwsh=function(args,ctx,raw){ctx.out.push(L('(PowerShell 7 n’est pas installé sur ce poste : on lance Windows PowerShell 5.1.)','t-warn'));return CMD.powershell(args,ctx,raw);};

/* ---------- if / for ---------- */
function splitBlock(s){s=s.trim();if(s.startsWith('(')){let d=0,q=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"')q=!q;if(q)continue;if(c==='(')d++;else if(c===')'){d--;if(d===0)return{block:s.slice(1,i).trim(),rest:s.slice(i+1).trim()};}}return{block:s.slice(1),rest:''};}return{block:s,rest:''};}
function runInner(cmd,ctx){const r_=runCmdLine(cmd,{batch:ctx.batch});r_.lines.forEach(x=>ctx.out.push(x));if(r_.clear)ctx.res.clear=true;if(r_.exit){ctx.res.exit=true;ctx.res.pop=r_.pop;}return st.errorlevel;}
CMD.if=function(args,ctx,raw){
  let s=(raw||'').trim();let ci=false,neg=false,cond=false,m;
  if(/^\/i\s/i.test(s)){ci=true;s=s.slice(3).trim();}
  if(/^not\s/i.test(s)){neg=true;s=s.slice(4).trim();}
  if((m=/^exist\s+("[^"]*"|\S+)\s+(.*)$/i.exec(s))){cond=exists(unq(m[1]));s=m[2];}
  else if((m=/^defined\s+(\S+)\s+(.*)$/i.exec(s))){cond=envGet(m[1])!=null;s=m[2];}
  else if((m=/^errorlevel\s+(\d+)\s+(.*)$/i.exec(s))){cond=st.errorlevel>=+m[1];s=m[2];}
  else if((m=/^("[^"]*"|[^\s=]+)\s*==\s*("[^"]*"|\S+)\s+(.*)$/.exec(s))){const a=m[1],b=m[2];cond=ci?lc(a)===lc(b):a===b;s=m[3];}
  else if((m=/^("[^"]*"|\S+)\s+(equ|neq|lss|leq|gtr|geq)\s+("[^"]*"|\S+)\s+(.*)$/i.exec(s))){let a=unq(m[1]),b=unq(m[3]);const na=/^-?\d+$/.test(a)&&/^-?\d+$/.test(b);let x=na?+a:(ci?lc(a):a),y=na?+b:(ci?lc(b):b);const op=lc(m[2]);cond=op==='equ'?x===y:op==='neq'?x!==y:op==='lss'?x<y:op==='leq'?x<=y:op==='gtr'?x>y:x>=y;s=m[4];}
  else{ctx.err.push('La syntaxe de la commande n’est pas correcte.');return 1;}
  if(neg)cond=!cond;
  const b1=splitBlock(s);let thenCmd=b1.block,elseCmd=null;
  if(/^else\b/i.test(b1.rest)){elseCmd=splitBlock(b1.rest.replace(/^else\s*/i,'')).block;}
  else if(!s.trim().startsWith('(')){const em=/^(.*?)\s+else\s+(.*)$/i.exec(s);if(em){thenCmd=em[1];elseCmd=em[2];}}
  if(cond)return runInner(thenCmd,ctx);if(elseCmd)return runInner(elseCmd,ctx);return;
};
CMD.for=function(args,ctx,raw){
  const s=(raw||'').trim();
  const m=/^(?:(\/[dlrf])\s+)?(?:(?:("[^"]*"|[^%\s][^\s]*)\s+))?%%?(~?[A-Za-z])\s+in\s*\((.*)\)\s*do\s+(.+)$/i.exec(s);
  if(!m){ctx.err.push('La syntaxe de la commande n’est pas correcte.');return 1;}
  const flag=lc(m[1]||''),extra=m[2]?unq(m[2]):null,v=m[3],set=m[4].trim(),cmd=m[5];
  let items=[];
  if(flag==='/l'){const n=set.split(/[\s,]+/).map(Number);const[a,step,b]=n;if(step)for(let i=a;step>0?i<=b:i>=b;i+=step){items.push(String(i));if(items.length>500)break;}}
  else if(flag==='/f'){
    let opts={tokens:[1],delims:[' ','\t'],skip:0,eol:';'};
    if(extra){const tm=/tokens=([\d,\-*]+)/i.exec(extra);if(tm){const t=[];tm[1].split(',').forEach(x=>{if(x==='*')t.push('*');else if(x.includes('-')){const[a,b]=x.split('-').map(Number);for(let i=a;i<=b;i++)t.push(i);}else t.push(+x);});opts.tokens=t;}
      const dm=/delims=(.*?)(?=\s+\w+=|$)/i.exec(extra);if(dm)opts.delims=dm[1].split('');const sk=/skip=(\d+)/i.exec(extra);if(sk)opts.skip=+sk[1];}
    let lines=[];const src=set.trim();
    if(/^'.*'$/.test(src)){const r_=runCmdLine(src.slice(1,-1));lines=r_.lines.map(x=>x.s);}
    else if(/^".*"$/.test(src)&&!(extra&&/usebackq/i.test(extra)))lines=[unq(src)];
    else{const c=readFile(unq(src));if(c==null){ctx.err.push(`Le fichier ${unq(src)} est introuvable.`);return 1;}lines=c.split('\n');}
    lines=lines.slice(opts.skip).filter(l=>l.trim()&&!l.startsWith(opts.eol));
    const letters='abcdefghijklmnopqrstuvwxyz';const base=letters.indexOf(lc(v.replace('~','')));
    for(const l of lines){const parts=opts.delims.length?l.split(new RegExp('['+opts.delims.map(d=>d.replace(/[\]\\^-]/g,'\\$&')).join('')+']+')).filter(x=>x!==''):[l];
      const map={};opts.tokens.forEach((t,ti)=>{const val=t==='*'?parts.slice(opts.tokens[ti-1]||0).join(' '):parts[t-1];map[letters[base+ti]]=val==null?'':val;});items.push(map);}
  }
  else if(flag==='/d'||flag==='/r'||!flag){
    const pats=set.split(/\s+/).filter(Boolean);
    for(const p0 of pats){const p=unq(p0);
      if(!hasWild(p)&&flag!=='/r'){items.push(p);continue;}
      const baseLoc=flag==='/r'?resolve(extra||'.'):null;
      const visit=(dl,dn)=>{for(const k of sortKids(dn)){const ok=flag==='/d'?k.d:!k.d;if(ok&&wild(hasWild(p)?p:'*').test(k.name))items.push(showLoc(fixCase(childLoc(dl,k.name))));}if(flag==='/r')for(const k of sortKids(dn))if(k.d&&!k.attr.includes('h'))visit(childLoc(dl,k.name),k);};
      if(flag==='/r'){const n=nodeAt(baseLoc);if(n)visit(fixCase(baseLoc),n);}
      else{const loc=resolve(p);const dl=parentOf(loc);const dn=nodeAt(dl);if(dn&&dn.d){const rx=wild(loc.segs[loc.segs.length-1]);for(const k of sortKids(dn)){if((flag==='/d'?k.d:!k.d)&&rx.test(k.name)&&!k.attr.includes('h'))items.push(/[\\:]/.test(p)?showLoc(fixCase(childLoc(dl,k.name))):k.name);}}}
    }
  }
  const letter=v.replace('~','');let code=0;
  for(const it of items){
    let c=cmd;const map=typeof it==='object'?it:{[lc(letter)]:it};
    c=c.replace(/%%?~([fdpnxsz]+)([A-Za-z])/g,(mm,mods,l)=>{const val=map[lc(l)];if(val==null)return mm;let full;try{full=showLoc(fixCase(resolve(val)));}catch(e){full=val;}const n=nodeAt(resolve(val));const base_=full.split('\\').pop();let o='';if(mods.includes('f'))return full;if(mods.includes('d'))o+=full.slice(0,2);if(mods.includes('p'))o+=full.slice(2,full.length-base_.length);if(mods.includes('n'))o+=base_.replace(/\.[^.]*$/,'');if(mods.includes('x'))o+=(base_.match(/\.[^.]*$/)||[''])[0];if(mods.includes('z'))o+=n?n.size:'';return o;});
    c=c.replace(/%%?~([A-Za-z])/g,(mm,l)=>map[lc(l)]!=null?unq(map[lc(l)]):mm);
    c=c.replace(/%%?([A-Za-z])/g,(mm,l)=>map[lc(l)]!=null&&(map===it||lc(l) in map)?map[lc(l)]:mm);
    if(!ctx.batch&&st.echo&&!/^\s*\(?\s*@/.test(c)){ctx.out.push(L(''));ctx.out.push(L(cwdStr()+'>'+c.replace(/^\(\s*|\s*\)$/g,'')));}
    code=runInner(splitBlock(c).block,ctx);
  }
  return code;
};
CMD.call=function(args,ctx,raw){const r_=runCmdLine(raw||'',{batch:ctx.batch});r_.lines.forEach(x=>ctx.out.push(x));return st.errorlevel;};
