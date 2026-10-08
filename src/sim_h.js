
/* =========================================================
   Cmdlets : fichiers, registre, emplacements
   ========================================================= */
function gciFs(loc,node,P,ctx,out){
  const filt=P.Filter!=null?wildRx(toStr(P.Filter)):null;const inc=strs(P.Include),exc=strs(P.Exclude);
  const maxDepth=P.Depth!=null?toNum(P.Depth):(P.Recurse?99:0);
  const visit=(dl,dn,depth)=>{
    for(const k of sortKids(dn)){
      const hidden=k.attr.includes('h')||k.attr.includes('s');
      if(hidden&&!P.Force&&!P.Hidden)continue;
      if(P.Hidden&&!hidden&&!(k.d&&P.Recurse)){}
      const kl=childLoc(dl,k.name);
      let ok=true;
      if(filt&&!filt.test(k.name))ok=false;
      if(inc.length&&!inc.some(p=>wildRx(p).test(k.name)))ok=false;
      if(exc.length&&exc.some(p=>wildRx(p).test(k.name)))ok=false;
      if(P.File&&k.d)ok=false;if(P.Directory&&!k.d)ok=false;if(P.Hidden&&!hidden)ok=false;
      if(ok)out.push(P.Name?showLoc(kl).slice(showLoc(loc).replace(/\\$/,'').length+1):fsObj(k,kl));
      if(k.d&&depth<maxDepth&&(!hidden||P.Force))visit(kl,k,depth+1);
    }
  };
  visit(fixCase(loc),node,0);
}
def('Get-ChildItem',MODS.mgmt,'Path@LiteralPath:p0 Filter:p1 Include Exclude Recurse@s:sw Depth Force:sw Name:sw File:sw Directory@ad:sw Hidden@h:sw ReadOnly:sw System:sw Attributes',(P,inp,ctx)=>{
  const paths=P.Path!=null?strs(P.Path):(inp.length&&inp.every(x=>typeof x==='string')?inp:['.']);const out=[];
  for(const p of paths){
    const c=psClassify(p);
    if(c.kind==='env'){const ks=Object.keys(st.env).filter(k=>!c.name||wildRx(c.name).test(k)).sort((a,b)=>lc(a)<lc(b)?-1:1);ks.forEach(k=>out.push(mk('System.Collections.DictionaryEntry',{Name:k,Value:st.env[k]})));continue;}
    if(c.kind==='reg'){const hits=hasWild(c.rl.segs.join('\\'))?regWild(c.rl):[{node:regNode(c.rl),rl:c.rl}];
      if(!hits.length||!hits[0].node){ctx.err(notFound(`Impossible de trouver le chemin d’accès « ${c.rl.hive}:\\${c.rl.segs.join('\\')} », car il n’existe pas.`,'PathNotFound,Microsoft.PowerShell.Commands.GetChildItemCommand'));continue;}
      hits.forEach(h=>{const walkR=(node,rl,depth)=>{Object.keys(node.kids).forEach(k=>{const crl={hive:rl.hive,segs:rl.segs.concat([k])};out.push(regKeyObj(crl,node.kids[k]));if(P.Recurse&&depth<20)walkR(node.kids[k],crl,depth+1);});};walkR(h.node,h.rl,0);});continue;}
    let items;try{items=fsItems(p,ctx,{force:!!P.Force});}catch(e){ctx.err(notFound(e.message,'PathNotFound,Microsoft.PowerShell.Commands.GetChildItemCommand'));continue;}
    if(!items)continue;
    for(const it of items){
      if(it.n.d&&!it.viaWild){gciFs(it.loc,it.n,P,ctx,out);}
      else if(it.n.d&&it.viaWild){if(!P.File)out.push(P.Name?it.n.name:fsObj(it.n,it.loc));if(P.Recurse)gciFs(it.loc,it.n,P,ctx,out);}
      else{if(P.Directory)continue;if(P.Filter!=null&&!wildRx(toStr(P.Filter)).test(it.n.name))continue;out.push(P.Name?it.n.name:fsObj(it.n,it.loc));}
    }
  }
  return out;
},{alias:['gci','ls','dir']});
def('Get-Item',MODS.mgmt,'Path@LiteralPath:p0 Force:sw Stream',(P,inp,ctx)=>{const out=[];for(const p of strs(P.Path!=null?P.Path:inp)){const c=psClassify(p);
  if(c.kind==='env'){const v=envGet(c.name);if(v==null){ctx.err(notFound(`Impossible de trouver le chemin d’accès « Env:\\${c.name} », car il n’existe pas.`,'PathNotFound,Microsoft.PowerShell.Commands.GetItemCommand'));continue;}out.push(mk('System.Collections.DictionaryEntry',{Name:c.name,Value:v}));continue;}
  if(c.kind==='reg'){const n=regNode(c.rl);if(!n){ctx.err(notFound(`Impossible de trouver le chemin d’accès « ${c.rl.hive}:\\${c.rl.segs.join('\\')} », car il n’existe pas.`,'PathNotFound,Microsoft.PowerShell.Commands.GetItemCommand'));continue;}out.push(regKeyObj(c.rl,n));continue;}
  const its=fsItems(p,ctx,{force:true});(its||[]).forEach(x=>out.push(fsObj(x.n,x.loc)));}return out;},{alias:['gi']});
def('Get-ItemProperty',MODS.mgmt,'Path@LiteralPath:p0 Name:p1',(P,inp,ctx)=>{const out=[];const names=P.Name!=null?strs(P.Name):null;
  for(const p of strs(P.Path!=null?P.Path:inp.map(x=>isObj(x)&&x.PSPath?x.PSPath:x))){const c=psClassify(p);
    if(c.kind==='reg'){const hits=hasWild(c.rl.segs.join('\\'))?regWild(c.rl):(regNode(c.rl)?[{node:regNode(c.rl),rl:c.rl}]:[]);if(!hits.length){ctx.err(notFound(`Impossible de trouver le chemin d’accès « ${c.rl.hive}:\\${c.rl.segs.join('\\')} », car il n’existe pas.`,'PathNotFound,Microsoft.PowerShell.Commands.GetItemPropertyCommand'));continue;}
      hits.forEach(h=>{if(names&&!Object.keys(h.node.vals).some(k=>names.some(n=>wildRx(n).test(k)))){if(!hasWild(c.rl.segs.join('\\')))ctx.err(psErr(`La propriété ${names[0]} n’existe pas à l’emplacement ${regShow(regFix(h.rl))}.`,'InvalidArgument','System.Management.Automation.PSArgumentException,Microsoft.PowerShell.Commands.GetItemPropertyCommand'));return;}out.push(regValuesObj(h.rl,h.node,names));});continue;}
    const its=fsItems(p,ctx,{force:true});(its||[]).forEach(x=>{const o=fsObj(x.n,x.loc);if(names){const s={};names.forEach(n=>{const k=Object.keys(o).find(z=>lc(z)===lc(n));if(k)s[k]=o[k];});out.push(mk('System.Management.Automation.PSCustomObject',s));}else out.push(o);});}
  return out;},{alias:['gp']});
def('Get-ItemPropertyValue',MODS.mgmt,'Path@LiteralPath:p0 Name:p1',(P,inp,ctx)=>{
  const names=strs(P.Name);const res=CMDLETS['get-itemproperty'].fn({Path:P.Path,Name:P.Name},inp,ctx)||[];const out=[];
  res.forEach(o=>names.forEach(n=>{const k=Object.keys(o).find(z=>lc(z)===lc(n));if(k)out.push(o[k]);}));return out;},{alias:['gpv']});
function setRegValue(P,ctx,create){const c=psClassify(toStr(P.Path));if(c.kind!=='reg'){if(c.kind==='fs'){const n=nodeAt(c.loc);if(!n)throw notFound(`Impossible de trouver le chemin d’accès « ${toStr(P.Path)} », car il n’existe pas.`,'PathNotFound');if(lc(toStr(P.Name))==='isreadonly'){if(truthy(P.Value)){if(!n.attr.includes('r'))n.attr+='r';}else n.attr=n.attr.replace('r','');}return[];}throw psErr('Fournisseur non pris en charge.','NotImplemented','NotSupported');}
  const n=regNode(c.rl);if(!n)throw notFound(`Impossible de trouver le chemin d’accès « ${c.rl.hive}:\\${c.rl.segs.join('\\')} », car il n’existe pas.`,'PathNotFound');
  const name=toStr(P.Name);const k=Object.keys(n.vals).find(x=>lc(x)===lc(name));
  if(create&&k&&!P.Force)throw psErr('La propriété existe déjà.','ResourceExists','System.IO.IOException');
  if(ctx.whatif){ctx.wi(create?'Nouvelle propriété':'Définir la propriété',`Élément : ${regShow(regFix(c.rl))} Propriété : ${name}`);return[];}
  const typ=P.PropertyType!=null?toStr(P.PropertyType):P.Type!=null?toStr(P.Type):(k?n.vals[k].type:(typeof P.Value==='number'?'DWord':'String'));
  const t={dword:'REG_DWORD',string:'REG_SZ',expandstring:'REG_EXPAND_SZ',qword:'REG_QWORD',multistring:'REG_MULTI_SZ',binary:'REG_BINARY',reg_dword:'REG_DWORD',reg_sz:'REG_SZ'}[lc(typ)]||typ;
  n.vals[k||name]={type:t,data:t==='REG_DWORD'?toNum(P.Value):toStr(P.Value)};
  return create||P.PassThru?[regValuesObj(c.rl,n,[name])]:[];}
def('Set-ItemProperty',MODS.mgmt,'Path:p0 Name:p1 Value:p2 Type PassThru:sw Force:sw',(P,inp,ctx)=>setRegValue(P,ctx,false),{alias:['sp']});
def('New-ItemProperty',MODS.mgmt,'Path:p0 Name:p1 Value:p2 PropertyType@Type Force:sw',(P,inp,ctx)=>setRegValue(P,ctx,true));
def('Remove-ItemProperty',MODS.mgmt,'Path:p0 Name:p1 Force:sw',(P,inp,ctx)=>{const c=psClassify(toStr(P.Path));const n=c.kind==='reg'?regNode(c.rl):null;if(!n)throw notFound('Chemin introuvable.','PathNotFound');strs(P.Name).forEach(nm=>{const k=Object.keys(n.vals).find(x=>lc(x)===lc(nm));if(!k)ctx.err(psErr(`La propriété ${nm} n’existe pas à l’emplacement ${regShow(regFix(c.rl))}.`,'InvalidArgument','System.Management.Automation.PSArgumentException'));else if(ctx.whatif)ctx.wi('Supprimer la propriété',`Élément : ${regShow(regFix(c.rl))} Propriété : ${k}`);else delete n.vals[k];});return[];},{alias:['rp']});
def('Get-Location',MODS.mgmt,'Stack:sw',()=>mk('System.Management.Automation.PathInfo',{Path:psLocStr()},{__s:psLocStr()}),{alias:['gl','pwd']});
function psSetLocation(p,ctx){
  p=toStr(p);if(p==='-'||p==='+'){return;}
  const c=psClassify(p);
  if(c.kind==='env')throw psErr('Le simulateur ne permet pas de se placer dans Env:. Utilise Get-ChildItem Env:.','InvalidOperation','NotSupported');
  if(c.kind==='reg'){if(!regNode(c.rl))throw notFound(`Impossible de trouver le chemin d’accès « ${c.rl.hive}:\\${c.rl.segs.join('\\')} », car il n’existe pas.`,'PathNotFound,Microsoft.PowerShell.Commands.SetLocationCommand');st.regLoc=regFix(c.rl);return;}
  const n=nodeAt(c.loc);if(!n)throw notFound(`Impossible de trouver le chemin d’accès « ${showLoc(c.loc)} », car il n’existe pas.`,'PathNotFound,Microsoft.PowerShell.Commands.SetLocationCommand');
  if(!n.d)throw psErr(`Impossible de trouver le chemin d’accès « ${showLoc(c.loc)} », car il n’existe pas.`,'ObjectNotFound','PathNotFound');
  const fx=fixCase(c.loc);st.regLoc=null;
  if(fx.pre.startsWith('\\\\')){st.uncLoc={root:fx.root,pre:fx.pre,segs:fx.segs};return;}
  st.uncLoc=null;const dl=fx.pre[0];st.drive=dl;st.dcwd[dl]=fx.segs;
}
def('Set-Location',MODS.mgmt,'Path@LiteralPath:p0 PassThru:sw StackName',(P,inp,ctx)=>{const p=P.Path!=null?toStr(P.Path):ME.home;psSetLocation(p,ctx);return P.PassThru?[mk('System.Management.Automation.PathInfo',{Path:psLocStr()})]:[];},{alias:['cd','sl','chdir']});
def('Push-Location',MODS.mgmt,'Path:p0',(P,inp,ctx)=>{st.psDirStack.push({regLoc:st.regLoc,uncLoc:st.uncLoc,drive:st.drive,segs:(st.dcwd[st.drive]||[]).slice()});if(P.Path!=null)psSetLocation(P.Path,ctx);return[];},{alias:['pushd']});
def('Pop-Location',MODS.mgmt,'',()=>{const p=st.psDirStack.pop();if(p){st.regLoc=p.regLoc||null;st.uncLoc=p.uncLoc||null;if(p.drive){st.drive=p.drive;st.dcwd[p.drive]=p.segs;}}return[];},{alias:['popd']});
function mkItem(path,type,value,force,ctx){
  const c=psClassify(path);
  if(c.kind==='reg'){const exists_=regNode(c.rl);if(exists_&&!force)throw psErr('Une clé existe déjà dans ce chemin d’accès.','ResourceExists','System.IO.IOException,Microsoft.PowerShell.Commands.NewItemCommand');const par=regNode({hive:c.rl.hive,segs:c.rl.segs.slice(0,-1)});if(!par)throw notFound('Impossible de trouver une partie du chemin d’accès.','PathNotFound');const n=regNode(c.rl,true);return regKeyObj(c.rl,n);}
  const loc=c.loc;const ex=nodeAt(loc);const isDir=/^(dir|directory|d)/i.test(type||'');
  if(ex){if(force&&ex.d&&isDir)return fsObj(ex,loc);if(!force||ex.d)throw psErr(`Un élément avec le nom spécifié ${showLoc(loc)} existe déjà.`,'ResourceExists',isDir?'DirectoryExist,Microsoft.PowerShell.Commands.NewItemCommand':'NewItemIOError,Microsoft.PowerShell.Commands.NewItemCommand');}
  if(ctx.whatif){ctx.wi(isDir?'Créer le répertoire':'Créer le fichier',`Destination : ${showLoc(loc)}`);return null;}
  if(isDir){let n=loc.root;for(const s of loc.segs){let k=n.kids.get(lc(s));if(!k){k=D(s,[],{t:new Date(),c:new Date()});n.kids.set(lc(s),k);}n=k;}return fsObj(n,loc);}
  const par=nodeAt(parentOf(loc));
  if(!par){if(!force)throw notFound(`Impossible de trouver une partie du chemin d’accès « ${showLoc(loc)} ».`,'NewItemIOError,Microsoft.PowerShell.Commands.NewItemCommand','WriteError');mkItem(showLoc(parentOf(loc)),'Directory',null,true,ctx);}
  const f=writeFile(showLoc(loc),value!=null?toStr(value):'');f.c=new Date();return fsObj(f,loc);
}
def('New-Item',MODS.mgmt,'Path:p0 Name ItemType@Type Value Force:sw',(P,inp,ctx)=>{
  const bases=P.Path!=null?strs(P.Path):['.'];const out=[];
  for(const b of bases){const path=P.Name!=null?(b.replace(/\\$/,'')+'\\'+toStr(P.Name)):b;const r_=mkItem(path,P.ItemType!=null?toStr(P.ItemType):'File',P.Value,!!P.Force,ctx);if(r_)out.push(r_);}
  return out;
},{alias:['ni']});
def('mkdir',MODS.mgmt,'Path:p0 Name Force:sw',(P,inp,ctx)=>{const out=[];for(const b of strs(P.Path)){const r_=mkItem(P.Name!=null?b+'\\'+toStr(P.Name):b,'Directory',null,!!P.Force,ctx);if(r_)out.push(r_);}return out;},{alias:['md'],type:'Function'});
def('Remove-Item',MODS.mgmt,'Path@LiteralPath:p0 Recurse:sw Force:sw Include Exclude Filter',(P,inp,ctx)=>{
  const paths=P.Path!=null?strs(P.Path):inp.map(x=>isObj(x)&&x.FullName?x.FullName:isObj(x)&&x.PSPath?x.PSPath:toStr(x));
  for(const p of paths){
    const c=psClassify(p);
    if(c.kind==='env'){if(ctx.whatif)ctx.wi('Supprimer l’élément',`Élément : ${c.name}`);else envSet(c.name,'');continue;}
    if(c.kind==='reg'){const n=regNode(c.rl);if(!n){ctx.err(notFound(`Impossible de trouver le chemin d’accès « ${c.rl.hive}:\\${c.rl.segs.join('\\')} », car il n’existe pas.`,'PathNotFound,Microsoft.PowerShell.Commands.RemoveItemCommand'));continue;}if(ctx.whatif){ctx.wi('Supprimer la clé',`Élément : ${regShow(regFix(c.rl))}`);continue;}const par=regNode({hive:c.rl.hive,segs:c.rl.segs.slice(0,-1)});const k=Object.keys(par.kids).find(x=>lc(x)===lc(c.rl.segs[c.rl.segs.length-1]));delete par.kids[k];continue;}
    let items=fsItems(p,ctx,{force:!!P.Force});if(!items)continue;
    const filt=P.Filter!=null?wildRx(toStr(P.Filter)):null,inc=strs(P.Include),exc=strs(P.Exclude);
    items=items.filter(x=>(!filt||filt.test(x.n.name))&&(!inc.length||inc.some(q=>wildRx(q).test(x.n.name)))&&!exc.some(q=>wildRx(q).test(x.n.name)));
    for(const it of items){
      const full=showLoc(fixCase(it.loc));
      if(sameOrInside(it.loc,curLoc())&&!st.regLoc){ctx.err(psErr(`Impossible de supprimer l’élément ${full} : Le processus ne peut pas accéder au fichier « ${full} », car il est en cours d’utilisation par un autre processus.`,'WriteError','RemoveFileSystemItemIOError,Microsoft.PowerShell.Commands.RemoveItemCommand'));continue;}
      if(ctx.whatif){ctx.wi(it.n.d?'Supprimer le répertoire':'Supprimer le fichier',full);continue;}
      if(!it.n.d&&(it.n.attr.includes('r')||it.n.attr.includes('h')||it.n.attr.includes('s'))&&!P.Force){ctx.err(psErr(`Impossible de supprimer l’élément ${full} : Vous ne disposez pas d’autorisations suffisantes pour effectuer cette opération.`,'PermissionDenied','RemoveFileSystemItemUnAuthorizedAccess,Microsoft.PowerShell.Commands.RemoveItemCommand'));continue;}
      if(it.n.d&&it.n.kids.size&&!P.Recurse){host(L('Confirmer'));host(L(`L’élément situé à ${full} a des enfants et le paramètre Recurse n’a pas été spécifié. Si vous continuez,`));host(L('tous les enfants seront supprimés avec l’élément. Voulez-vous vraiment continuer ?'));host(L('[O] Oui  [T] Oui pour tout  [N] Non  [U] Non pour tout  [S] Suspendre  [?] Aide (la valeur par défaut est « O ») : N'));host(L('(Simulation : réponse N. Ajoute -Recurse pour supprimer le dossier et son contenu.)','t-warn'));continue;}
      const par=nodeAt(parentOf(it.loc));par.kids.delete(lc(it.n.name));par.t=new Date();
    }
  }
  return[];
},{alias:['rm','del','ri','erase','rd','rmdir']});
function copyMove(P,ctx,move){
  const dest=P.Destination!=null?toStr(P.Destination):'.';const out=[];
  let dl;try{dl=resolve(dest);}catch(e){throw notFound(e.message,'PathNotFound');}
  for(const p of strs(P.Path)){
    const its=fsItems(p,ctx,{force:!!P.Force});if(!its)continue;
    for(const it of its){
      const dn=nodeAt(dl);let tdir,tname;
      if(dn&&dn.d){tdir=dn;tname=it.n.name;}else{tdir=nodeAt(parentOf(dl));tname=dl.segs[dl.segs.length-1];}
      if(!tdir){ctx.err(notFound(`Impossible de trouver une partie du chemin d’accès « ${showLoc(dl)} ».`,'System.IO.DirectoryNotFoundException,Microsoft.PowerShell.Commands.'+(move?'MoveItemCommand':'CopyItemCommand'),'WriteError'));continue;}
      const full=showLoc(fixCase(it.loc));const tfull=showLoc(dn&&dn.d?childLoc(dl,tname):dl);
      if(ctx.whatif){ctx.wi(move?'Déplacer l’élément':(it.n.d?'Copier le répertoire':'Copier le fichier'),`Élément : ${full} Destination : ${tfull}`);continue;}
      if(move){if(tdir.kids.get(lc(tname))&&!P.Force){ctx.err(psErr('Impossible de créer un fichier déjà existant.','WriteError','MoveFileInfoItemIOError,Microsoft.PowerShell.Commands.MoveItemCommand'));continue;}const par=nodeAt(parentOf(it.loc));par.kids.delete(lc(it.n.name));it.n.name=tname;tdir.kids.set(lc(tname),it.n);if(P.PassThru)out.push(fsObj(it.n,dn&&dn.d?childLoc(dl,tname):dl));continue;}
      let c;
      if(it.n.d&&!P.Recurse){c=tdir.kids.get(lc(tname))||D(tname,[],{t:new Date()});tdir.kids.set(lc(tname),c);if(it.n.kids.size)host(L('(Copy-Item sans -Recurse copie le dossier VIDE : son contenu n’a pas été copié.)','t-warn'));}
      else{const ex=tdir.kids.get(lc(tname));if(ex&&ex.attr.includes('r')&&!P.Force){ctx.err(psErr(`L’accès au chemin d’accès « ${tfull} » est refusé.`,'PermissionDenied','CopyFileInfoItemUnauthorizedAccessError'));continue;}
        if(ex&&ex.d&&it.n.d){for(const k of it.n.kids.values())ex.kids.set(lc(k.name),cloneNode(k));c=ex;}else{c=cloneNode(it.n);c.name=tname;tdir.kids.set(lc(tname),c);}}
      tdir.t=new Date();if(P.PassThru)out.push(fsObj(c,dn&&dn.d?childLoc(dl,tname):dl));
    }
  }
  return out;
}
def('Copy-Item',MODS.mgmt,'Path@LiteralPath:p0 Destination:p1 Recurse:sw Force:sw Container:sw PassThru:sw Filter Include Exclude ToSession FromSession',(P,inp,ctx)=>{if(P.ToSession||P.FromSession)throw psErr('Copy-Item -ToSession utilise une session PowerShell (WinRM), désactivée ici. Copie via le partage administratif : Copy-Item fichier \\\\PC\\C$\\Temp\\','OpenError','WinRMDisabled');if(P.Path==null)P.Path=inp.map(x=>isObj(x)&&x.FullName?x.FullName:toStr(x));return copyMove(P,ctx,false);},{alias:['cp','copy','cpi']});
def('Move-Item',MODS.mgmt,'Path@LiteralPath:p0 Destination:p1 Force:sw PassThru:sw',(P,inp,ctx)=>{if(P.Path==null)P.Path=inp.map(x=>isObj(x)&&x.FullName?x.FullName:toStr(x));return copyMove(P,ctx,true);},{alias:['mv','move','mi']});
def('Rename-Item',MODS.mgmt,'Path@LiteralPath:p0 NewName:p1 Force:sw PassThru:sw',(P,inp,ctx)=>{
  const items=P.Path!=null?[toStr(P.Path)]:inp.map(x=>isObj(x)&&x.FullName?x.FullName:toStr(x));const out=[];
  for(const p of items){const its=fsItems(p,ctx,{force:true});if(!its)continue;for(const it of its){let nn=isSb(P.NewName)?toStr(unwrap(callSb(P.NewName,fsObj(it.n,it.loc)))):toStr(P.NewName);
    if(/[\\\/]/.test(nn)&&!/^[A-Za-z]:/.test(nn)){ctx.err(psErr('Impossible de renommer l’élément spécifié, car le nouveau nom contient un chemin. Utilise Move-Item.','InvalidArgument','Argument,Microsoft.PowerShell.Commands.RenameItemCommand'));continue;}
    const par=nodeAt(parentOf(it.loc));if(par.kids.get(lc(nn))&&lc(nn)!==lc(it.n.name)){ctx.err(psErr('Impossible de créer un fichier déjà existant.','WriteError','RenameItemIOError,Microsoft.PowerShell.Commands.RenameItemCommand'));continue;}
    if(ctx.whatif){ctx.wi('Renommer le fichier',`Élément : ${showLoc(fixCase(it.loc))} Destination : ${showLoc(childLoc(parentOf(it.loc),nn))}`);continue;}
    par.kids.delete(lc(it.n.name));it.n.name=nn;par.kids.set(lc(nn),it.n);if(P.PassThru)out.push(fsObj(it.n,childLoc(parentOf(it.loc),nn)));}}
  return out;},{alias:['ren','rni']});
def('Get-Content',MODS.mgmt,'Path@LiteralPath@PSPath:p0 TotalCount@First@Head Tail@Last Raw:sw Wait:sw Encoding ReadCount',(P,inp,ctx)=>{
  const paths=P.Path!=null?strs(P.Path):inp.map(x=>isObj(x)&&x.FullName?x.FullName:toStr(x));const out=[];
  for(const p of paths){const c=psClassify(p);if(c.kind==='env'){const v=envGet(c.name);if(v!=null)out.push(v);continue;}
    const its=fsItems(p,ctx,{force:true});if(!its)continue;
    for(const it of its){if(it.n.d){ctx.err(psErr(`Impossible de trouver le chemin d’accès « ${showLoc(fixCase(it.loc))} », car il s’agit d’un répertoire.`,'ObjectNotFound','GetContentReaderUnauthorizedAccessError,Microsoft.PowerShell.Commands.GetContentCommand'));continue;}
      if(it.n.bin){out.push('MZ\u0090\u0003\u0004 ÿÿ ¸ @ (contenu binaire illisible)');continue;}
      if(P.Raw){out.push(it.n.content);continue;}
      let lines=it.n.content.split('\n');if(lines.length&&lines[lines.length-1]==='')lines.pop();
      if(P.TotalCount!=null)lines=lines.slice(0,toNum(P.TotalCount));if(P.Tail!=null)lines=lines.slice(-toNum(P.Tail));
      out.push(...lines);if(P.Wait)host(L('(-Wait suivrait le fichier en continu, comme tail -f ; Ctrl+C pour arrêter.)','t-warn'));}}
  return out;
},{alias:['gc','cat','type']});
function setContent(P,inp,ctx,append){
  const val=P.Value!=null?arr(P.Value):inp;const txt=val.map(v=>isObj(v)&&v.__fmt?v.lines.join('\n'):toStr(v)).join('\n');
  for(const p of strs(P.Path)){if(ctx.whatif){ctx.wi(append?'Ajouter le contenu':'Définir le contenu',`Chemin d’accès : ${showLoc(resolve(p))}`);continue;}
    try{writeFile(p,txt,append);}catch(e){ctx.err(notFound(`Impossible de trouver une partie du chemin d’accès « ${showLoc(resolve(p))} ».`,'GetContentWriterDirectoryNotFoundError,Microsoft.PowerShell.Commands.'+(append?'AddContentCommand':'SetContentCommand')));}}
  if(lc(ctx.called)==='sc'&&!append)host(L(`(Attention : dans Windows PowerShell 5.1, « sc » est l’alias de Set-Content. Tu viens d’écrire dans le fichier « ${strs(P.Path)[0]} ». Pour le gestionnaire de services : sc.exe)`,'t-warn'));
  return P.PassThru?val:[];
}
def('Set-Content',MODS.mgmt,'Path@LiteralPath:p0 Value:p1 PassThru:sw Encoding NoNewline:sw Force:sw',(P,inp,ctx)=>setContent(P,inp,ctx,false),{alias:['sc']});
def('Add-Content',MODS.mgmt,'Path@LiteralPath:p0 Value:p1 PassThru:sw Encoding NoNewline:sw Force:sw',(P,inp,ctx)=>setContent(P,inp,ctx,true),{alias:['ac']});
def('Clear-Content',MODS.mgmt,'Path:p0',(P,inp,ctx)=>{strs(P.Path).forEach(p=>{try{writeFile(p,'');}catch(e){ctx.err(notFound(e.message,'PathNotFound'));}});return[];},{alias:['clc']});
def('Test-Path',MODS.mgmt,'Path@LiteralPath:p0 PathType IsValid:sw',(P)=>strs(P.Path).map(p=>{let c;try{c=psClassify(p);}catch(e){return false;}
  if(P.IsValid)return true;
  if(c.kind==='env')return envGet(c.name)!=null;
  if(c.kind==='reg')return !!regNode(c.rl);
  const n=hasWild(c.loc.segs.join('\\'))?((fsItems(p,{err(){}},{force:true})||[])[0]||{}).n:nodeAt(c.loc);
  if(!n)return false;const t=lc(toStr(P.PathType||'any'));return t==='leaf'?!n.d:t==='container'?n.d:true;}));
def('Resolve-Path',MODS.mgmt,'Path:p0 Relative:sw',(P,inp,ctx)=>{const out=[];strs(P.Path).forEach(p=>{const its=fsItems(p,ctx,{force:true});(its||[]).forEach(x=>{const s=showLoc(fixCase(x.loc));out.push(P.Relative?'.\\'+s.slice(cwdStr().replace(/\\$/,'').length+1):mk('System.Management.Automation.PathInfo',{Path:s},{__s:s}));});});return out;},{alias:['rvpa']});
def('Split-Path',MODS.mgmt,'Path:p0 Parent:sw Leaf:sw LeafBase:sw Extension:sw Qualifier:sw NoQualifier:sw IsAbsolute:sw Resolve:sw',(P)=>strs(P.Path).map(p=>{const parts=p.replace(/\\+$/,'').split('\\');const leaf=parts[parts.length-1];
  if(P.Leaf)return leaf;if(P.LeafBase)return leaf.replace(/\.[^.]*$/,'');if(P.Extension)return(leaf.match(/\.[^.]*$/)||[''])[0];if(P.Qualifier){const m=/^[A-Za-z]+:/.exec(p);if(!m)throw psErr('Impossible de diviser l’argument, car il n’a pas de qualificateur.','InvalidArgument','ParameterArgumentValidationError');return m[0];}if(P.NoQualifier)return p.replace(/^[A-Za-z]+:/,'');if(P.IsAbsolute)return /^[A-Za-z]:\\|^\\\\/.test(p);
  const par=parts.slice(0,-1).join('\\');return /^[A-Za-z]:$/.test(par)?par+'\\':par;}));
def('Join-Path',MODS.mgmt,'Path:p0 ChildPath:p1 AdditionalChildPath:p2,rest Resolve:sw',(P)=>strs(P.Path).map(p=>[p,...strs(P.ChildPath),...strs(P.AdditionalChildPath)].map((x,i)=>i?x.replace(/^\\+/,''):x.replace(/\\+$/,'')).join('\\')));
def('Invoke-Item',MODS.mgmt,'Path:p0',(P)=>{strs(P.Path).forEach(p=>host(L(`(Simulation) Ouverture de ${p} avec l’application associée.`,'t-warn')));return[];},{alias:['ii']});
def('Get-PSDrive',MODS.mgmt,'Name:p0 PSProvider',(P)=>{
  const D_=[['Alias',null,null,'Alias',''],['C',FREE.C>0?511e9-FREE.C:0,FREE.C,'FileSystem','C:\\'],['Cert',null,null,'Certificate','\\'],['D',1e12-FREE.D,FREE.D,'FileSystem','D:\\'],['Env',null,null,'Environment',''],['Function',null,null,'Function',''],['HKCU',null,null,'Registry','HKEY_CURRENT_USER'],['HKLM',null,null,'Registry','HKEY_LOCAL_MACHINE'],['Variable',null,null,'Variable',''],['WSMan',null,null,'WSMan','']];
  Object.keys(st.mapped).forEach(k=>D_.push([k,3.2e12,1.1e12,'FileSystem',st.mapped[k].unc]));
  return D_.filter(d=>nameMatch(d[0],strs(P.Name))&&(!P.PSProvider||nameMatch(d[3],strs(P.PSProvider)))).sort((a,b)=>a[0].localeCompare(b[0])).map(d=>mk('System.Management.Automation.PSDriveInfo',{Name:d[0],Used:d[1],Free:d[2],Provider:d[3],Root:d[4],CurrentLocation:d[0]===st.drive&&!st.regLoc?(st.dcwd[d[0]]||[]).join('\\'):(st.regLoc&&st.regLoc.hive===d[0]?st.regLoc.segs.join('\\'):'')}));},{alias:['gdr']});
def('New-PSDrive',MODS.mgmt,'Name:p0 PSProvider:p1 Root:p2 Persist:sw Credential Scope',(P,inp,ctx)=>{const n=toStr(P.Name).toUpperCase();let loc;try{loc=resolve(toStr(P.Root));}catch(e){throw psErr('Le chemin réseau n’a pas été trouvé.','InvalidOperation','CouldNotMapNetworkDrive');}if(!nodeAt(loc))throw psErr('Le chemin réseau n’a pas été trouvé.','InvalidOperation','CouldNotMapNetworkDrive');
  if(/^[A-Z]$/.test(n)){st.mapped[n]={root:nodeAt(loc),unc:showLoc(loc)};st.dcwd[n]=[];}return mk('System.Management.Automation.PSDriveInfo',{Name:n,Used:null,Free:null,Provider:'FileSystem',Root:showLoc(loc),CurrentLocation:''});},{alias:['ndr','mount']});
def('Remove-PSDrive',MODS.mgmt,'Name:p0',(P)=>{strs(P.Name).forEach(n=>delete st.mapped[n.toUpperCase()]);return[];},{alias:['rdr']});
def('Get-Acl',MODS.sec,'Path:p0',(P,inp,ctx)=>{const out=[];strs(P.Path).forEach(p=>{const its=fsItems(p,ctx,{force:true});(its||[]).forEach(it=>{const acl=it.n.acl||[['AUTORITE NT\\Système','(I)(OI)(CI)(F)'],['BUILTIN\\Administrateurs','(I)(OI)(CI)(F)'],['BUILTIN\\Utilisateurs','(I)(OI)(CI)(RX)'],['AUTORITE NT\\Utilisateurs authentifiés','(I)(OI)(CI)(M)']];
  const rights=s=>s.includes('(F)')?'FullControl':s.includes('(M)')?'Modify, Synchronize':s.includes('(RX)')?'ReadAndExecute, Synchronize':s.includes('(R)')?'Read, Synchronize':s.includes('(W)')?'Write, Synchronize':'Special';
  out.push(mk('System.Security.AccessControl.DirectorySecurity',{Path:showLoc(fixCase(it.loc)),Owner:'BUILTIN\\Administrateurs',Group:'CONTOSO\\Utilisateurs du domaine',Access:acl.map(a=>mk('System.Security.AccessControl.FileSystemAccessRule',{FileSystemRights:rights(a[1]),AccessControlType:a[1].includes('DENY')?'Deny':'Allow',IdentityReference:a[0],IsInherited:a[1].includes('(I)'),InheritanceFlags:a[1].includes('(OI)')?'ContainerInherit, ObjectInherit':'None',PropagationFlags:'None'})),Sddl:'O:BAG:DUD:AI(A;OICIID;FA;;;SY)(A;OICIID;FA;;;BA)'}));});});return out;});
def('Set-Acl',MODS.sec,'Path:p0 AclObject:p1',(P,inp,ctx)=>{if(ctx.whatif)ctx.wi('Set-Acl',toStr(P.Path));return[];});
def('Get-FileHash',MODS.util,'Path@LiteralPath:p0 Algorithm',(P,inp,ctx)=>{const a=(P.Algorithm!=null?toStr(P.Algorithm):'SHA256').toUpperCase();const len={MD5:32,SHA1:40,SHA256:64,SHA384:96,SHA512:128}[a]||64;const out=[];
  const paths=P.Path!=null?strs(P.Path):inp.map(x=>isObj(x)&&x.FullName?x.FullName:toStr(x));paths.forEach(p=>{const its=fsItems(p,ctx,{force:true});(its||[]).filter(x=>!x.n.d).forEach(x=>out.push(mk('Microsoft.PowerShell.Commands.FileHashInfo',{Algorithm:a,Hash:fakeHash(x.n.name+x.n.size+(x.n.content||''),len),Path:showLoc(fixCase(x.loc))})));});return out;});
def('Compress-Archive',MODS.arch,'Path:p0 DestinationPath:p1 CompressionLevel Update:sw Force:sw',(P,inp,ctx)=>{const dst=toStr(P.DestinationPath).replace(/(\.zip)?$/i,'.zip');let total=0;strs(P.Path).forEach(p=>{const its=fsItems(p,ctx,{force:true});(its||[]).forEach(x=>total+=treeSize(x.n));});
  if(exists(dst)&&!P.Force&&!P.Update)throw psErr(`L’archive ${showLoc(resolve(dst))} existe déjà. Utilise -Force pour la remplacer ou -Update pour la mettre à jour.`,'InvalidArgument','ArchiveFileExists,Compress-Archive');
  const f=writeFile(dst,'');f.bin=true;f.size=Math.max(22,Math.round(total*0.38));return[];});
def('Expand-Archive',MODS.arch,'Path:p0 DestinationPath:p1 Force:sw',(P,inp,ctx)=>{const src=toStr(P.Path);if(!exists(src))throw notFound(`Le chemin ${src} n’existe pas ou n’est pas un chemin d’accès de système de fichiers valide.`,'ArgumentException,Expand-Archive','InvalidArgument');const dst=P.DestinationPath!=null?toStr(P.DestinationPath):src.replace(/\.zip$/i,'');mkItem(dst,'Directory',null,true,ctx);writeFile(dst.replace(/\\$/,'')+'\\contenu_extrait.txt','(fichiers extraits — simulation)');return[];});
def('Unblock-File',MODS.util,'Path:p0',(P,inp,ctx)=>{strs(P.Path!=null?P.Path:inp.map(x=>x.FullName||toStr(x))).forEach(p=>{const n=nodeAt(resolve(p));if(n)n.zone=false;});return[];});

/* =========================================================
   Cmdlets : processus et services
   ========================================================= */
function procObj(p,host_){return mk('System.Diagnostics.Process',{Handles:p.Handles,NPM:Math.round(p.WS*0.0004)+12000,PM:Math.round(p.WS*0.62),WS:p.WS,CPU:p.CPU,Id:p.Id,SI:p.SI,ProcessName:p.Name,Name:p.Name,Path:p.Path||(p.sys?null:'C:\\Windows\\System32\\'+p.Name+'.exe'),Company:p.Company!=null?p.Company:(p.sys?null:'Microsoft Corporation'),StartTime:p.sys?null:ago(p.Id%3,8,p.Id%60),MainWindowTitle:p.SessionName==='Console'&&!/svchost|conhost/.test(p.Name)?({OUTLOOK:'Boîte de réception - it.tech@contoso-hotels.com - Outlook',EXCEL:'rapport_parc.xlsx - Excel',notepad:'Sans titre - Bloc-notes',chrome:'Intranet Contoso - Google Chrome'}[p.Name]||''):'',MachineName:host_||'.',Description:p.Name},{__s:`System.Diagnostics.Process (${p.Name})`,__get:{workingset:p.WS,workingset64:p.WS,sessionid:p.SI,handlecount:p.Handles},__methods:{kill:()=>{const i=st.procs.findIndex(x=>x.Id===p.Id);if(i>=0)st.procs.splice(i,1);}}});}
def('Get-Process',MODS.mgmt,'Name@ProcessName:p0 Id@PID ComputerName@cn IncludeUserName:sw Module:sw FileVersionInfo:sw InputObject',(P,inp,ctx)=>{
  let hostN=null;if(P.ComputerName!=null){const h=findHost(toStr(P.ComputerName));if(!h||!h.up)throw psErr(`Impossible de se connecter à l’ordinateur distant ${toStr(P.ComputerName)}.`,'NotSpecified','System.InvalidOperationException,Microsoft.PowerShell.Commands.GetProcessCommand');if(!h.self)hostN=h.n;}
  const list=(hostN?procsOf(hostN):st.procs).slice().sort((a,b)=>a.Name.localeCompare(b.Name)||a.Id-b.Id);const out=[];
  if(P.Id!=null){arr(P.Id).forEach(id=>{const p=list.find(x=>x.Id===toNum(id));if(!p)ctx.err(notFound(`Impossible de trouver un processus ayant l’identificateur ${toNum(id)}.`,'NoProcessFoundForGivenId,Microsoft.PowerShell.Commands.GetProcessCommand'));else out.push(procObj(p,hostN));});return out;}
  const pats=strs(P.Name);
  if(pats.length){pats.forEach(pt=>{const m=list.filter(p=>wildRx(pt.replace(/\.exe$/i,'')).test(p.Name));if(!m.length&&!hasWild(pt))ctx.err(notFound(`Impossible de trouver un processus nommé « ${pt} ». Vérifiez le nom du processus et appelez à nouveau l’applet de commande.`,'NoProcessFoundForGivenName,Microsoft.PowerShell.Commands.GetProcessCommand'));m.forEach(p=>out.push(procObj(p,hostN)));});return out;}
  const r_=list.map(p=>procObj(p,hostN));
  if(P.IncludeUserName)return r_.map(o=>mk('System.Diagnostics.Process#IncludeUserName',{Handles:o.Handles,WS:o.WS,CPU:o.CPU,Id:o.Id,UserName:st.procs.find(x=>x.Id===o.Id&&x.SessionName==='Console')?'CONTOSO\\it.tech':'AUTORITE NT\\Système',ProcessName:o.ProcessName}));
  return r_;
},{alias:['gps','ps']});
VIEWS['System.Diagnostics.Process#IncludeUserName']={t:[['Handles','Handles',1],['WS(K)',o=>Math.round(o.WS/1024),1],['CPU(s)',o=>o.CPU==null?'':numFr(Math.round(o.CPU*100)/100),1],['Id','Id',1],['UserName','UserName'],['ProcessName','ProcessName']]};
def('Stop-Process',MODS.mgmt,'Id:p0 Name@ProcessName InputObject Force:sw PassThru:sw',(P,inp,ctx)=>{
  let targets=[];
  if(P.InputObject!=null||inp.length){(P.InputObject!=null?arr(P.InputObject):inp).forEach(o=>{const id=isObj(o)?toNum(getMember(o,'Id')):toNum(o);const p=st.procs.find(x=>x.Id===id);if(p)targets.push(p);});}
  if(P.Id!=null)arr(P.Id).forEach(id=>{const p=st.procs.find(x=>x.Id===toNum(id));if(!p)ctx.err(notFound(`Impossible de trouver un processus ayant l’identificateur ${toNum(id)}.`,'NoProcessFoundForGivenId,Microsoft.PowerShell.Commands.StopProcessCommand'));else targets.push(p);});
  if(P.Name!=null)strs(P.Name).forEach(n=>{const m=st.procs.filter(p=>wildRx(n.replace(/\.exe$/i,'')).test(p.Name));if(!m.length)ctx.err(notFound(`Impossible de trouver un processus nommé « ${n} ». Vérifiez le nom du processus et appelez à nouveau l’applet de commande.`,'NoProcessFoundForGivenName,Microsoft.PowerShell.Commands.StopProcessCommand'));targets.push(...m);});
  const out=[];
  for(const p of targets){
    if(ctx.whatif){ctx.wi('Stop-Process',`${p.Name} (${p.Id})`);continue;}
    if(p.sys){ctx.err(psErr(`Impossible d’arrêter le processus « ${p.Name} (${p.Id}) » en raison de l’erreur suivante : Accès refusé`,'CloseError','CouldNotStopProcess,Microsoft.PowerShell.Commands.StopProcessCommand'));continue;}
    if(p.SessionName==='Services'&&!P.Force){host(L('Confirmer'));host(L(`Voulez-vous vraiment effectuer l’action « Stop-Process » sur la cible « ${p.Name} (${p.Id}) » ?`));host(L('[O] Oui  [T] Oui pour tout  [N] Non  [U] Non pour tout  [S] Suspendre  [?] Aide (la valeur par défaut est « O ») : O'));}
    st.procs=st.procs.filter(x=>x!==p);
    if(p.Svc)p.Svc.split(',').map(s=>s.trim()).forEach(sv=>{const s=st.services.find(x=>lc(x.Name)===lc(sv));if(s){s.Status='Stopped';st.events.push({svc:lc(s.Name),a:'stop'});}});
    if(P.PassThru)out.push(procObj(p));
  }
  return out;
},{alias:['kill','spps']});
def('Start-Process',MODS.mgmt,'FilePath:p0 ArgumentList:p1 Verb WorkingDirectory Wait:sw PassThru:sw NoNewWindow:sw WindowStyle Credential RedirectStandardOutput',(P,inp,ctx)=>{
  const f=toStr(P.FilePath);const base=f.split('\\').pop().replace(/\.exe$/i,'');
  if(P.Verb&&lc(toStr(P.Verb))==='runas')host(L('(Simulation) Invite UAC : « Voulez-vous autoriser cette application à apporter des modifications à votre appareil ? » → Oui','t-warn'));
  if(/^https?:/i.test(f)){host(L(`(Simulation) Ouverture de ${f} dans le navigateur.`,'t-warn'));return[];}
  if(/\.(msc|cpl)$/i.test(f)||KNOWN_GUI[lc(f)]){host(L(KNOWN_GUI[lc(f)]||`(Simulation) ${f} s’ouvre.`,'t-warn'));return[];}
  const p={Name:base,Id:(st.nextPid+=12),SessionName:'Console',SI:1,WS:20971520,CPU:0.1,Handles:200,Svc:'',Path:f.includes('\\')?f:'C:\\Windows\\System32\\'+base+'.exe',Company:'Microsoft Corporation'};
  if(!/^(cmd|powershell|ping|ipconfig|robocopy|msiexec)$/i.test(base))st.procs.push(p);
  if(/^msiexec$/i.test(base))host(L(`(Simulation) msiexec ${toStr(P.ArgumentList||'')} : installation silencieuse terminée (code 0).`,'t-warn'));
  else if(!/\\|\.exe$/i.test(f)&&!['notepad','calc','mspaint','chrome','excel','outlook','winword','explorer','cmd','powershell','taskmgr','mstsc','regedit','ping','ipconfig','robocopy','msiexec'].includes(lc(base))&&!exists(f))throw psErr(`Impossible d’exécuter cette commande en raison de l’erreur : Le fichier spécifié est introuvable.`,'InvalidOperation','InvalidOperationException,Microsoft.PowerShell.Commands.StartProcessCommand');
  return P.PassThru?[procObj(p)]:[];
},{alias:['saps','start']});
function svcObj(s,machine){return mk('System.ServiceProcess.ServiceController',{Status:s.Status,Name:s.Name,DisplayName:s.DisplayName,StartType:s.StartType,ServiceName:s.Name,ServiceType:'Win32OwnProcess',CanStop:s.Status==='Running',CanPauseAndContinue:false,CanShutdown:s.Status==='Running',MachineName:machine||'.',DependentServices:lc(s.Name)==='lanmanserver'?['Browser']:[],ServicesDependedOn:['RPCSS']},{__s:'System.ServiceProcess.ServiceController',__svc:s,__methods:{stop:()=>{s.Status='Stopped';st.events.push({svc:lc(s.Name),a:'stop'});},start:()=>{s.Status='Running';st.events.push({svc:lc(s.Name),a:'start'});},refresh:()=>undefined,waitforstatus:()=>undefined}});}
function getSvcs(P,ctx,inp){
  let machine=null,list=st.services;
  if(P.ComputerName!=null){const h=findHost(toStr(arr(P.ComputerName)[0]));if(!h||!h.up)throw psErr(`Impossible d’ouvrir le Gestionnaire de contrôle des services sur l’ordinateur « ${toStr(arr(P.ComputerName)[0])} ». Cette opération peut nécessiter d’autres privilèges.`,'NotSpecified','System.InvalidOperationException,Microsoft.PowerShell.Commands.GetServiceCommand');if(!h.self){machine=h.n;list=svcList(h.n);}}
  if(P.InputObject!=null||(inp&&inp.length&&inp.every(x=>isObj(x)&&x.__svc))){return(P.InputObject!=null?arr(P.InputObject):inp).map(o=>({s:o.__svc||findSvc(list,toStr(getMember(o,'Name'))),machine}));}
  const out=[];
  if(P.DisplayName!=null){strs(P.DisplayName).forEach(dn=>{const m=list.filter(s=>wildRx(dn).test(s.DisplayName));if(!m.length&&!hasWild(dn))ctx.err(notFound(`Impossible de trouver un service assorti du nom d’affichage « ${dn} ».`,'NoServiceFoundForGivenDisplayName,Microsoft.PowerShell.Commands.'+ctx.name.replace('-','')+'Command'));m.forEach(s=>out.push({s,machine}));});return out;}
  const names=P.Name!=null?strs(P.Name):(inp&&inp.length&&inp.every(x=>typeof x==='string')?inp:null);
  if(!names){list.slice().sort((a,b)=>lc(a.Name)<lc(b.Name)?-1:1).forEach(s=>out.push({s,machine}));return out;}
  names.forEach(n=>{const m=list.filter(s=>wildRx(n).test(s.Name)||!hasWild(n)&&lc(s.DisplayName)===lc(n));if(!m.length&&!hasWild(n))ctx.err(notFound(`Impossible de trouver un service assorti du nom de service « ${n} ».`,'NoServiceFoundForGivenName,Microsoft.PowerShell.Commands.'+ctx.name.replace('-','')+'Command'));m.forEach(s=>out.push({s,machine}));});
  return out;
}
def('Get-Service',MODS.mgmt,'Name@ServiceName:p0 DisplayName ComputerName@cn Exclude Include DependentServices@DS:sw RequiredServices@SDO@ServicesDependedOn:sw InputObject',(P,inp,ctx)=>{
  let r_=getSvcs(P,ctx,inp);const ex=strs(P.Exclude),inc=strs(P.Include);
  r_=r_.filter(x=>x.s&&!ex.some(e=>wildRx(e).test(x.s.Name))&&(!inc.length||inc.some(e=>wildRx(e).test(x.s.Name))));
  if(P.DependentServices)return r_.flatMap(x=>lc(x.s.Name)==='lanmanserver'?[mk('System.ServiceProcess.ServiceController',{Status:'Running',Name:'Browser',DisplayName:'Explorateur d’ordinateurs'})]:[]);
  if(P.RequiredServices)return r_.flatMap(()=>[mk('System.ServiceProcess.ServiceController',{Status:'Running',Name:'RPCSS',DisplayName:'Appel de procédure distante (RPC)'})]);
  return r_.map(x=>svcObj(x.s,x.machine));
},{alias:['gsv']});
function svcAction(P,inp,ctx,act){
  const r_=getSvcs(P,ctx,inp);const out=[];
  for(const {s,machine} of r_){if(!s)continue;const label=`${s.DisplayName} (${s.Name})`;
    if(ctx.whatif){ctx.wi(ctx.name,label);continue;}
    if(act!=='start'){
      if(lc(s.Name)==='windefend'){ctx.err(psErr(`Le service « ${label} » ne peut pas être arrêté en raison de l’erreur suivante : Impossible d’ouvrir le service ${s.Name} sur l’ordinateur « . ».`,'CloseError','CouldNotStopService,Microsoft.PowerShell.Commands.StopServiceCommand'));continue;}
      if(lc(s.Name)==='lanmanserver'&&!P.Force){ctx.err(psErr(`Impossible d’arrêter le service « ${label} », car d’autres services en dépendent. Il ne peut être arrêté que si l’indicateur Force est défini.`,'InvalidOperation','ServiceHasDependentServices,Microsoft.PowerShell.Commands.StopServiceCommand'));continue;}
      if(s.Status==='Running'){s.Status='Stopped';st.events.push({svc:lc(s.Name),a:'stop',host:machine});}
    }
    if(act!=='stop'){
      if(s.StartType==='Disabled'){ctx.err(psErr(`Le service « ${label} » ne peut pas être démarré en raison de l’erreur suivante : Impossible de démarrer le service ${s.Name} sur l’ordinateur « . ».`,'OpenError','CouldNotStartService,Microsoft.PowerShell.Commands.'+(act==='start'?'StartServiceCommand':'RestartServiceCommand')));continue;}
      if(s.Status!=='Running'){s.Status='Running';st.events.push({svc:lc(s.Name),a:'start',host:machine});}
      if(act==='restart'&&lc(s.Name)==='spooler')host(L(`AVERTISSEMENT : En attente du démarrage du service « ${label} »...`,'t-warn'));
    }
    if(P.PassThru)out.push(svcObj(s,machine));
  }
  return out;
}
def('Start-Service',MODS.mgmt,'Name@ServiceName:p0 DisplayName InputObject PassThru:sw',(P,inp,ctx)=>svcAction(P,inp,ctx,'start'),{alias:['sasv']});
def('Stop-Service',MODS.mgmt,'Name@ServiceName:p0 DisplayName InputObject Force:sw PassThru:sw NoWait:sw',(P,inp,ctx)=>svcAction(P,inp,ctx,'stop'),{alias:['spsv']});
def('Restart-Service',MODS.mgmt,'Name@ServiceName:p0 DisplayName InputObject Force:sw PassThru:sw',(P,inp,ctx)=>svcAction(P,inp,ctx,'restart'));
def('Set-Service',MODS.mgmt,'Name@ServiceName:p0 ComputerName@cn StartupType@StartMode@SM@ST Status DisplayName Description InputObject PassThru:sw',(P,inp,ctx)=>{const r_=getSvcs(P,ctx,inp);const out=[];
  for(const {s,machine} of r_){if(!s)continue;if(ctx.whatif){ctx.wi('Set-Service',`${s.DisplayName} (${s.Name})`);continue;}
    if(P.StartupType!=null){const v=lc(toStr(P.StartupType));const map={automatic:'Automatic',auto:'Automatic',manual:'Manual',disabled:'Disabled',automaticdelayedstart:'Automatic'};if(!map[v])throw psErr(`Impossible de lier le paramètre « StartupType ». Impossible de convertir la valeur « ${toStr(P.StartupType)} » en type « Microsoft.PowerShell.Commands.ServiceStartupType ». Les valeurs d’énumération valides sont « Automatic, Manual, Disabled ».`,'InvalidArgument','CannotConvertArgumentNoMessage');s.StartType=map[v];}
    if(P.Status!=null){const v=lc(toStr(P.Status));if(v==='running'&&s.StartType!=='Disabled'){s.Status='Running';st.events.push({svc:lc(s.Name),a:'start'});}if(v==='stopped'){s.Status='Stopped';st.events.push({svc:lc(s.Name),a:'stop'});}}
    if(P.DisplayName!=null)s.DisplayName=toStr(P.DisplayName);if(P.PassThru)out.push(svcObj(s,machine));}return out;});
