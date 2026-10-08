
/* =========================================================
   PowerShell : liaison des paramètres
   ========================================================= */
const COMMON={ErrorAction:{alias:['ea']},WarningAction:{alias:['wa']},InformationAction:{alias:['infa']},Verbose:{sw:true,alias:['vb']},Debug:{sw:true,alias:['db']},WhatIf:{sw:true,alias:['wi']},Confirm:{sw:true,alias:['cf']},OutVariable:{alias:['ov']},ErrorVariable:{alias:['ev']},OutBuffer:{alias:['ob']},PipelineVariable:{alias:['pv']}};
const CMDLETS={},ALIASES={};
function PS_(spec){const o={};String(spec||'').split(/\s+/).filter(Boolean).forEach(e=>{const [left,flags]=e.split(':');const [name,...al]=left.split('@');const p={alias:al};(flags||'').split(',').filter(Boolean).forEach(f=>{if(/^p\d+$/.test(f))p.pos=+f.slice(1);else p[f]=true;});o[name]=p;});return o;}
function def(name,mod,spec,fn,o){o=o||{};const d={name,mod,params:PS_(spec),fn,alias:o.alias||[],type:o.type||'Cmdlet',ver:o.ver||'3.1.0.0'};CMDLETS[lc(name)]=d;d.alias.forEach(a=>ALIASES[lc(a)]=lc(name));return d;}
function resolveParam(given,all,d){
  const g=lc(given);const names=Object.keys(all);
  let k=names.find(n=>lc(n)===g);if(k)return k;
  k=names.find(n=>(all[n].alias||[]).some(a=>lc(a)===g));if(k)return k;
  const pre=names.filter(n=>lc(n).startsWith(g));
  if(pre.length===1)return pre[0];
  const own=pre.filter(n=>!COMMON[n]);if(own.length===1)return own[0];
  if(pre.length>1){const e=psErr(`Impossible de traiter le paramètre, car le nom de paramètre « ${given} » est ambigu. Les correspondances possibles incluent : ${pre.map(x=>'-'+x).join(' ')}.`,'InvalidArgument','AmbiguousParameter');throw e;}
  const e=psErr(`Impossible de trouver un paramètre correspondant au nom « ${given} ».`,'InvalidArgument','NamedParameterNotFound');e.target=':';throw e;
}
function callCmdlet(d,toks,input,scope,called){
  const P={};const pos=[];const all=Object.assign({},d.params,COMMON);
  for(let i=0;i<toks.length;i++){
    const t=toks[i];const m=/^-([A-Za-z_][\w-]*)(?::([\s\S]*))?$/.exec(t);
    if(m&&!/^-\d/.test(t)){
      let key;try{key=resolveParam(m[1],all,d);}catch(e){e.cmd=called;throw e;}
      const sp=all[key];
      if(sp.sw){P[key]=m[2]!=null&&m[2]!==''?truthy(evalArg(m[2],scope)):true;}
      else{let vt=m[2]!=null&&m[2]!==''?m[2]:toks[++i];if(vt===undefined){const e=psErr(`Argument manquant pour le paramètre « ${key} ». Spécifiez un paramètre de type « System.String » et réessayez.`,'InvalidArgument','MissingArgument');e.cmd=called;throw e;}
        if(sp.rest){const vals=[evalArg(vt,scope)];while(i+1<toks.length&&!/^-[A-Za-z]/.test(toks[i+1]))vals.push(evalArg(toks[++i],scope));P[key]=vals.length===1?vals[0]:vals;}
        else P[key]=evalArg(vt,scope);}
      continue;
    }
    pos.push(t);
  }
  const posP=Object.keys(d.params).filter(k=>d.params[k].pos!=null&&!(k in P)).sort((a,b)=>d.params[a].pos-d.params[b].pos);
  let pi=0;
  for(let j=0;j<pos.length;j++){
    const k=posP[pi++];
    if(!k){const e=psErr(`Impossible de trouver un paramètre positionnel acceptant l’argument « ${toStr(evalArg(pos[j],scope))} ».`,'InvalidArgument','PositionalParameterNotFound');e.cmd=called;throw e;}
    if(d.params[k].rest){const vals=pos.slice(j).map(t=>evalArg(t,scope));P[k]=vals.length===1?vals[0]:vals;break;}
    P[k]=evalArg(pos[j],scope);
  }
  const eaRaw=P.ErrorAction!=null?toStr(P.ErrorAction):toStr(getVar('ErrorActionPreference',scope)||'Continue');
  const ctx={scope,name:d.name,called,P,ea:lc(eaRaw),whatif:!!P.WhatIf,
    err(e){if(!(e instanceof PSErr))e=psErr(String(e));if(!e.cmd)e.cmd=called;if(ctx.ea==='stop'||scope.inTry&&ctx.ea==='stop')throw e;if(ctx.ea!=='ignore')st.errors.push(errRecord(e));st.ok=false;if(ctx.ea==='silentlycontinue'||ctx.ea==='ignore')return;errLines(e,st.curLine).forEach(x=>host(L(x,'t-err')));if(e.hint)host(L(e.hint,'t-warn'));},
    warn(m){if(lc(toStr(P.WarningAction||''))==='silentlycontinue')return;host(L('AVERTISSEMENT : '+m,'t-warn'));},
    verbose(m){if(P.Verbose)host(L('COMMENTAIRES : '+m,'t-warn'));},
    wi(op,target){host(L(`WhatIf : Opération « ${op} » en cours sur la cible « ${target} ».`));}};
  let r;
  try{r=d.fn(P,input||[],ctx);}catch(e){if(e instanceof PSErr&&!e.cmd)e.cmd=called;throw e;}
  st.ok=st.ok!==false?true:st.ok;
  if(P.OutVariable!=null){setVar(toStr(P.OutVariable),unwrap(r||[]),scope);}
  return r==null?[]:Array.isArray(r)?r:[r];
}
const arr=v=>v==null?[]:Array.isArray(v)?v:[v];
const strs=v=>arr(v).map(toStr);
function nameMatch(name,pats){if(!pats||!pats.length)return true;return pats.some(p=>wildRx(p).test(name));}
function notFound(msg,id,cat){const e=psErr(msg,cat||'ObjectNotFound',id);return e;}

/* =========================================================
   Emplacements PowerShell (fichiers, registre, env:)
   ========================================================= */
function psLocStr(){if(st.regLoc)return st.regLoc.hive+':\\'+st.regLoc.segs.join('\\');return st.uncLoc?'Microsoft.PowerShell.Core\\FileSystem::'+showLoc(curLoc()):cwdStr();}
function psClassify(p){
  p=toStr(p).trim().replace(/^Microsoft\.PowerShell\.Core\\Registry::/i,'Registry::');
  let m;
  if((m=/^(HKLM|HKCU):\\?(.*)$/i.exec(p)))return{kind:'reg',rl:{hive:m[1].toUpperCase(),segs:normRegSegs(m[2])}};
  if((m=/^Registry::(HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKLM|HKCU)\\?(.*)$/i.exec(p)))return{kind:'reg',rl:{hive:/LOCAL|HKLM/i.test(m[1])?'HKLM':'HKCU',segs:normRegSegs(m[2])}};
  if((m=/^env:\\?(.*)$/i.exec(p)))return{kind:'env',name:m[1]};
  if(st.regLoc&&!/^[A-Za-z]:|^\\\\|^~/.test(p)){const segs=st.regLoc.segs.slice();for(const s of p.split('\\')){if(!s||s==='.')continue;if(s==='..')segs.pop();else segs.push(s);}return{kind:'reg',rl:{hive:st.regLoc.hive,segs}};}
  return{kind:'fs',loc:resolve(p)};
}
function normRegSegs(s){const out=[];for(const x of String(s).split('\\')){if(!x||x==='.')continue;if(x==='..')out.pop();else out.push(x);}return out;}
function fsObj(node,loc){
  const fx=fixCase(loc);const full=showLoc(fx);const parent=showLoc(parentOf(fx));const isDir=node.d;
  const attrs=[];if(node.attr.includes('r'))attrs.push('ReadOnly');if(node.attr.includes('h'))attrs.push('Hidden');if(node.attr.includes('s'))attrs.push('System');if(isDir)attrs.push('Directory');if(node.attr.includes('a'))attrs.push('Archive');
  const base={Name:node.name};
  if(!isDir)Object.assign(base,{Length:node.size,DirectoryName:parent,Directory:parent,IsReadOnly:node.attr.includes('r')});
  Object.assign(base,{FullName:full,Extension:isDir?'':(node.name.match(/\.[^.]*$/)||[''])[0],BaseName:isDir?node.name:node.name.replace(/\.[^.]*$/,''),Mode:fileMode(node),CreationTime:node.c,LastWriteTime:node.t,LastAccessTime:node.t,Attributes:attrs.join(', ')||'Normal',PSIsContainer:isDir,PSPath:'Microsoft.PowerShell.Core\\FileSystem::'+full,PSParentPath:'Microsoft.PowerShell.Core\\FileSystem::'+parent,PSChildName:node.name});
  if(isDir){base.Parent=parentOf(fx).segs.slice(-1)[0]||parent;base.Root=fx.pre+'\\';base.Exists=true;}
  return mk(isDir?'System.IO.DirectoryInfo':'System.IO.FileInfo',base,{__parent:parent,__isDir:isDir,__isFs:true,__node:node,__loc:fx,__s:node.name,__methods:{delete:()=>{const par=nodeAt(parentOf(fx));par.kids.delete(lc(node.name));},copyto:(dst)=>{writeFile(toStr(dst),node.content||'');return undefined;}}});
}
function regKeyObj(rl,node){
  const fx=regFix(rl);const name=fx.segs[fx.segs.length-1]||fx.hive;const parentShow=regShow({hive:fx.hive,segs:fx.segs.slice(0,-1)});
  const props=Object.entries(node.vals).map(([k,v])=>[k,v]);const w=Math.max(0,...props.map(p=>p[0].length));
  return mk('Microsoft.Win32.RegistryKey',{Name:regShow(fx),Property:props.map(p=>p[0]),PSChildName:name,SubKeyCount:Object.keys(node.kids).length,ValueCount:props.length,PSPath:'Microsoft.PowerShell.Core\\Registry::'+regShow(fx)},{__hive:parentShow,__props:props.map(p=>`${p[0].padEnd(w)} : ${p[1].type==='REG_DWORD'?p[1].data:p[1].data}`),__s:regShow(fx)});
}
function regValuesObj(rl,node,names){
  const fx=regFix(rl);const o={};
  Object.entries(node.vals).forEach(([k,v])=>{if(!names||names.some(n=>wildRx(n).test(k)))o[k]=v.type==='REG_DWORD'?Number(v.data):v.data;});
  Object.assign(o,{PSPath:'Microsoft.PowerShell.Core\\Registry::'+regShow(fx),PSParentPath:'Microsoft.PowerShell.Core\\Registry::'+regShow({hive:fx.hive,segs:fx.segs.slice(0,-1)}),PSChildName:fx.segs[fx.segs.length-1]||'',PSDrive:fx.hive,PSProvider:'Microsoft.PowerShell.Core\\Registry'});
  return mk('System.Management.Automation.PSCustomObject',o);
}
function regWild(rl){
  let res=[{node:REG[rl.hive],segs:[]}];
  for(const s of rl.segs){const nx=[];for(const r_ of res){const rx=wildRx(s);for(const k of Object.keys(r_.node.kids)){if(hasWild(s)?rx.test(k):lc(k)===lc(s))nx.push({node:r_.node.kids[k],segs:r_.segs.concat([k])});}}res=nx;}
  return res.map(r_=>({node:r_.node,rl:{hive:rl.hive,segs:r_.segs}}));
}
function fsItems(p,ctx,opts){
  opts=opts||{};let loc;
  try{loc=resolve(p);}catch(e){ctx.err(notFound(`Impossible de trouver le chemin d’accès « ${p} », car il n’existe pas.`,'PathNotFound'));return null;}
  const name=loc.segs[loc.segs.length-1]||'';
  if(hasWild(name)){const dl=parentOf(loc);const dn=nodeAt(dl);if(!dn||!dn.d)return[];const rx=wildRx(name);return sortKids(dn).filter(k=>rx.test(k.name)&&(opts.force||!k.attr.includes('h'))).map(k=>({n:k,loc:childLoc(dl,k.name),viaWild:true}));}
  const n=nodeAt(loc);
  if(!n){ctx.err(notFound(`Impossible de trouver le chemin d’accès « ${showLoc(loc)} », car il n’existe pas.`,'PathNotFound'));return null;}
  return[{n,loc}];
}

/* =========================================================
   Cmdlets : aide, découverte, objets
   ========================================================= */
const MODS={core:'Microsoft.PowerShell.Core',mgmt:'Microsoft.PowerShell.Management',util:'Microsoft.PowerShell.Utility',sec:'Microsoft.PowerShell.Security',ad:'ActiveDirectory',net:'NetTCPIP',dns:'DnsClient',cim:'CimCmdlets',print:'PrintManagement',sched:'ScheduledTasks',store:'Storage',smb:'SmbShare',fw:'NetSecurity',adapter:'NetAdapter',local:'Microsoft.PowerShell.LocalAccounts',dism:'Dism',appx:'Appx',arch:'Microsoft.PowerShell.Archive',psget:'PowerShellGet',diag:'Microsoft.PowerShell.Diagnostics'};
function helpLinesPS(name){
  const h=helpProvider(name,'ps');if(h)return h;
  const d=CMDLETS[lc(name)]||CMDLETS[ALIASES[lc(name)]];
  if(!d){const e=psErr(`Get-Help n’a pas pu trouver ${name} dans un fichier d’aide de cette session.`,'ResourceUnavailable','HelpNotFound');throw e;}
  const syn=d.name+' '+Object.keys(d.params).map(k=>{const p=d.params[k];const nm=p.pos!=null?`[-${k}]`:`-${k}`;return p.sw?`[-${k}]`:`[${nm} <${k==='Path'?'string[]':'Object'}>]`;}).join(' ')+' [<CommonParameters>]';
  const al=Object.keys(ALIASES).filter(a=>ALIASES[a]===lc(d.name));
  return['','NOM','    '+d.name,'','SYNTAXE','    '+syn,'','ALIAS','    '+(al.length?al.join(', '):'Aucun(e)'),'','REMARQUES','    (Aide résumée du simulateur. Dans la vraie console : Update-Help, puis Get-Help '+d.name+' -Examples.)',''];
}
def('Get-Help',MODS.core,'Name:p0 Examples:sw Full:sw Detailed:sw Online:sw Parameter Category ShowWindow:sw',(P,inp,ctx)=>{
  if(P.Name==null){outLinesTo(['','RUBRIQUE','    Système d’aide de Windows PowerShell','','DESCRIPTION COURTE','    Affiche de l’aide sur les applets de commande et les concepts de PowerShell.','','EXEMPLES','    Get-Help Get-Service','    Get-Help Get-Service -Examples','    Get-Help *service*','    Get-Command -Noun Service','']);return[];}
  const name=toStr(P.Name);
  if(P.Online){host(L(`(Simulation) Ouverture de https://learn.microsoft.com/fr-fr/powershell/module/?term=${name} dans le navigateur.`,'t-warn'));return[];}
  if(/^about_/i.test(name)){const t=OUT['ps_'+lc(name)];if(t){outLinesTo(t.split('\n'));return[];}throw psErr(`Get-Help n’a pas pu trouver ${name} dans un fichier d’aide de cette session.`,'ResourceUnavailable','HelpNotFound');}
  if(hasWild(name)){const list=Object.values(CMDLETS).filter(d=>wildRx(name).test(d.name));return list.map(d=>mk('HelpInfoShort',{Name:d.name,Category:'Cmdlet',Module:d.mod,Synopsis:''}));}
  let lines=helpLinesPS(name);
  if(P.Examples){const i=lines.findIndex(l=>/^EXEMPLES/.test(l));lines=i>=0?lines.slice(0,3).concat(lines.slice(i)):lines;}
  else if(!P.Full&&!P.Detailed&&!P.Parameter){const i=lines.findIndex(l=>/^(EXEMPLES|PARAMÈTRES)/.test(l));if(i>=0)lines=lines.slice(0,i).concat(['REMARQUES',`    Pour voir les exemples, tapez : "get-help ${name} -examples".`,`    Pour plus d’informations, tapez : "get-help ${name} -detailed".`,`    Pour obtenir des informations techniques, tapez : "get-help ${name} -full".`,'']);}
  if(P.Parameter){const pn=lc(toStr(P.Parameter));lines=lines.filter(l=>lc(l).includes('-'+pn)||/^NOM|^\s{4}\S+$/.test(l));}
  outLinesTo(lines);return[];
},{alias:['help','man']});
function outLinesTo(lines){lines.forEach(x=>host(L(x)));}
def('Get-Command',MODS.core,'Name:p0 Verb Noun Module CommandType',(P,inp,ctx)=>{
  const pats=strs(P.Name);let list=Object.values(CMDLETS).filter(d=>nameMatch(d.name,pats));
  if(P.Verb)list=list.filter(d=>nameMatch(d.name.split('-')[0],strs(P.Verb)));
  if(P.Noun)list=list.filter(d=>nameMatch(d.name.split('-').slice(1).join('-'),strs(P.Noun)));
  if(P.Module)list=list.filter(d=>nameMatch(d.mod,strs(P.Module)));
  let out=list.sort((a,b)=>a.name.localeCompare(b.name)).map(d=>mk('System.Management.Automation.CmdletInfo',{CommandType:d.type,Name:d.name,Version:d.ver,Source:d.mod},{__s:d.name}));
  if(pats.length&&!P.Verb&&!P.Noun){pats.forEach(p=>{Object.keys(ALIASES).filter(a=>wildRx(p).test(a)).forEach(a=>out.unshift(mk('System.Management.Automation.AliasInfo',{CommandType:'Alias',Name:a,Definition:CMDLETS[ALIASES[a]].name,Version:'',Source:''},{__s:a})));const k=lc(p).replace(/\.exe$/,'');if(!hasWild(p)&&CMD[k]&&EXE_PATH[k])out.push(mk('System.Management.Automation.CmdletInfo',{CommandType:'Application',Name:k+'.exe',Version:'10.0.26100.1',Source:EXE_PATH[k].split('\n')[0]},{__s:k}));});
    if(!out.length&&!pats.some(hasWild)){throw notFound(`Le terme «${pats[0]}» n'est pas reconnu comme nom d'applet de commande, fonction, fichier de script ou programme exécutable. Vérifiez l'orthographe du nom, ou si un chemin d'accès existe, vérifiez que le chemin d'accès est correct et réessayez.`,'CommandNotFoundException,Microsoft.PowerShell.Commands.GetCommandCommand');}}
  return out;
},{alias:['gcm']});
def('Get-Alias',MODS.util,'Name:p0 Definition',(P)=>{
  let ks=Object.keys(ALIASES);if(P.Name!=null){const pats=strs(P.Name);ks=ks.filter(a=>nameMatch(a,pats));if(!ks.length&&!pats.some(hasWild))throw notFound(`Cet alias ne peut pas être trouvé, car il n’existe pas d’alias avec le nom « ${pats[0]} ».`,'ItemNotFoundException,Microsoft.PowerShell.Commands.GetAliasCommand');}
  if(P.Definition!=null)ks=ks.filter(a=>nameMatch(CMDLETS[ALIASES[a]].name,strs(P.Definition)));
  return ks.sort().map(a=>mk('System.Management.Automation.AliasInfo',{CommandType:'Alias',Name:a,Definition:CMDLETS[ALIASES[a]].name,Version:'',Source:''},{__s:a}));
},{alias:['gal']});
const VERBS=[['Add','a','Common'],['Clear','cl','Common'],['Copy','cp','Common'],['Enter','et','Common'],['Exit','ex','Common'],['Find','fd','Common'],['Format','f','Common'],['Get','g','Common'],['Move','m','Common'],['New','n','Common'],['Remove','r','Common'],['Rename','rn','Common'],['Search','sr','Common'],['Select','sc','Common'],['Set','s','Common'],['Unlock','uk','Common'],['Export','ep','Data'],['Import','ip','Data'],['ConvertTo','ct','Data'],['ConvertFrom','cf','Data'],['Out','o','Data'],['Update','ud','Data'],['Test','t','Diagnostic'],['Measure','ms','Diagnostic'],['Resolve','rv','Diagnostic'],['Repair','rp','Diagnostic'],['Start','sa','Lifecycle'],['Stop','sp','Lifecycle'],['Restart','rt','Lifecycle'],['Enable','e','Lifecycle'],['Disable','d','Lifecycle'],['Install','is','Lifecycle'],['Invoke','i','Lifecycle'],['Register','rg','Lifecycle'],['Unregister','ur','Lifecycle'],['Wait','w','Lifecycle'],['Write','w','Communications'],['Read','rd','Communications'],['Send','sd','Communications'],['Connect','cc','Communications'],['Grant','gr','Security'],['Revoke','rk','Security'],['Protect','pt','Security'],['Unblock','ul','Security']];
def('Get-Verb',MODS.util,'Verb:p0',(P)=>VERBS.filter(v=>nameMatch(v[0],strs(P.Verb))).map(v=>mk('System.Management.Automation.VerbInfo',{Verb:v[0],AliasPrefix:v[1],Group:v[2]})));
const TYPEINFO={
  'System.String':{m:['Clone','CompareTo','Contains','EndsWith','Equals','GetHashCode','GetType','IndexOf','Insert','LastIndexOf','PadLeft','PadRight','Remove','Replace','Split','StartsWith','Substring','ToCharArray','ToLower','ToString','ToUpper','Trim','TrimEnd','TrimStart'],p:[['Chars','ParameterizedProperty','char Chars(int index) {get;}'],['Length','Property','int Length {get;}']]},
  'System.ServiceProcess.ServiceController':{m:['Close','Continue','Dispose','Equals','ExecuteCommand','GetHashCode','GetType','Pause','Refresh','Start','Stop','ToString','WaitForStatus'],a:[['Name','ServiceName'],['RequiredServices','ServicesDependedOn']]},
  'System.Diagnostics.Process':{m:['BeginErrorReadLine','CloseMainWindow','Dispose','Equals','GetType','Kill','Refresh','Start','ToString','WaitForExit','WaitForInputIdle'],a:[['Handles','Handlecount'],['Name','ProcessName'],['NPM','NonpagedSystemMemorySize64'],['PM','PagedMemorySize64'],['SI','SessionId'],['VM','VirtualMemorySize64'],['WS','WorkingSet64']]},
  'System.IO.FileInfo':{m:['AppendText','CopyTo','Create','Decrypt','Delete','Encrypt','Equals','GetAccessControl','GetType','MoveTo','Open','OpenRead','OpenText','OpenWrite','Refresh','Replace','SetAccessControl','ToString']},
  'System.IO.DirectoryInfo':{m:['Create','CreateSubdirectory','Delete','EnumerateDirectories','EnumerateFiles','Equals','GetDirectories','GetFiles','GetType','MoveTo','Refresh','ToString']},
  'System.DateTime':{m:['Add','AddDays','AddHours','AddMilliseconds','AddMinutes','AddMonths','AddSeconds','AddTicks','AddYears','CompareTo','Equals','GetType','IsDaylightSavingTime','Subtract','ToFileTime','ToLocalTime','ToLongDateString','ToLongTimeString','ToShortDateString','ToShortTimeString','ToString','ToUniversalTime'],p:[['Date','Property','datetime Date {get;}'],['Day','Property','int Day {get;}'],['DayOfWeek','Property','System.DayOfWeek DayOfWeek {get;}'],['DayOfYear','Property','int DayOfYear {get;}'],['Hour','Property','int Hour {get;}'],['Millisecond','Property','int Millisecond {get;}'],['Minute','Property','int Minute {get;}'],['Month','Property','int Month {get;}'],['Second','Property','int Second {get;}'],['Ticks','Property','long Ticks {get;}'],['Year','Property','int Year {get;}']]},
  'System.Int32':{m:['CompareTo','Equals','GetHashCode','GetType','GetTypeCode','ToString']},'System.Double':{m:['CompareTo','Equals','GetHashCode','GetType','GetTypeCode','ToString']},'System.Boolean':{m:['CompareTo','Equals','GetHashCode','GetType','ToString']},
  'System.Object[]':{m:['Add','Clear','Clone','Contains','CopyTo','Equals','Get','GetEnumerator','GetType','IndexOf','Insert','Remove','Set','ToString'],p:[['Count','AliasProperty','Count = Length'],['Length','Property','int Length {get;}']]},
  'System.Collections.Hashtable':{m:['Add','Clear','Clone','Contains','ContainsKey','ContainsValue','CopyTo','Equals','GetEnumerator','GetType','Remove','ToString'],p:[['Count','Property','int Count {get;}'],['Keys','Property','System.Collections.ICollection Keys {get;}'],['Values','Property','System.Collections.ICollection Values {get;}']]}
};
function jsType(v){if(v==null)return'System.Object';if(typeof v==='string')return'string';if(typeof v==='number')return Number.isInteger(v)?(Math.abs(v)>2147483647?'long':'int'):'double';if(typeof v==='boolean')return'bool';if(v instanceof Date)return'datetime';if(Array.isArray(v))return'System.Object[]';return typeOf(v);}
def('Get-Member',MODS.util,'Name:p0 MemberType@Type InputObject Static:sw Force:sw',(P,inp)=>{
  const items=P.InputObject!=null?[P.InputObject]:inp;
  if(!items.length)throw psErr('Vous devez spécifier un objet pour l’applet de commande Get-Member.','CloseError','NoObjectInGetMember,Microsoft.PowerShell.Commands.GetMemberCommand');
  const seen=new Set();const out=[];
  for(const it of items){const t=typeOf(it);if(seen.has(t))continue;seen.add(t);
    const ti=TYPEINFO[t]||{m:['Equals','GetHashCode','GetType','ToString']};const rows=[];
    (ti.a||[]).forEach(a=>rows.push([a[0],'AliasProperty',`${a[0]} = ${a[1]}`]));
    ti.m.forEach(m=>rows.push([m,'Method',`${m==='ToString'?'string':m==='Equals'?'bool':m==='GetType'?'type':m==='GetHashCode'?'int':'void'} ${m}(${m==='Equals'?'System.Object obj':''})`]));
    (ti.p||[]).forEach(p=>rows.push(p));
    if(isObj(it)){const note=!it.__t||it.__t==='System.Management.Automation.PSCustomObject'||/^Selected\.|^CSV/.test(it.__t);Object.keys(it).forEach(k=>{if((ti.a||[]).some(a=>a[0]===k))return;const v=it[k];rows.push([k,note?'NoteProperty':'Property',note?`${jsType(v)} ${k}=${cell(v)}`:`${jsType(v)} ${k} {get;${/Name|Status|Time|Path/.test(k)?'':'set;'}}`]);});}
    rows.sort((a,b)=>{const o=['AliasProperty','Event','Method','NoteProperty','ParameterizedProperty','Property','ScriptProperty'];const d=o.indexOf(a[1])-o.indexOf(b[1]);return d||a[0].localeCompare(b[0]);});
    rows.filter(r_=>(!P.MemberType||nameMatch(r_[1],strs(P.MemberType)))&&nameMatch(r_[0],strs(P.Name))).forEach(r_=>out.push(mk('Microsoft.PowerShell.Commands.MemberDefinition',{TypeName:t,Name:r_[0],MemberType:r_[1],Definition:r_[2]})));
  }
  return out;
},{alias:['gm']});
def('Get-History',MODS.core,'Id:p0 Count',(P)=>st.hist.map((h,i)=>mk('Microsoft.PowerShell.Commands.HistoryInfo',{Id:i+1,CommandLine:h},{__s:h})).slice(-(P.Count?toNum(P.Count):32)),{alias:['h','history','ghy']});
def('Clear-Host',MODS.core,'',()=>{st.clear=true;return[];},{alias:['cls','clear'],type:'Function'});
const COLORS={red:'t-err',darkred:'t-err',green:'t-ok',darkgreen:'t-ok',yellow:'t-warn',darkyellow:'t-warn',cyan:'t-sw',darkcyan:'t-sw',blue:'t-sw',darkblue:'t-sw',magenta:'t-kw',darkmagenta:'t-kw'};
def('Write-Host',MODS.util,'Object:p0,rest NoNewline:sw Separator ForegroundColor@fore BackgroundColor@back',(P)=>{const v=P.Object;const sep=P.Separator!=null?toStr(P.Separator):' ';const s=Array.isArray(v)?v.map(toStr).join(sep):toStr(v);host(L(s,COLORS[lc(toStr(P.ForegroundColor||''))]||''));return[];});
def('Write-Output',MODS.util,'InputObject:p0,rest NoEnumerate:sw',(P,inp)=>P.InputObject!=null?arr(P.InputObject):inp,{alias:['echo','write']});
def('Write-Warning',MODS.util,'Message:p0',(P,inp,ctx)=>{ctx.warn(toStr(P.Message));return[];});
def('Write-Verbose',MODS.util,'Message:p0',(P,inp,ctx)=>{if(P.Verbose||lc(toStr(getVar('VerbosePreference',ctx.scope)||''))==='continue')host(L('COMMENTAIRES : '+toStr(P.Message),'t-warn'));return[];});
def('Write-Debug',MODS.util,'Message:p0',()=>[]);
def('Write-Information',MODS.util,'MessageData:p0',(P)=>{host(L(toStr(P.MessageData)));return[];});
def('Write-Error',MODS.util,'Message:p0 Category ErrorId TargetObject',(P,inp,ctx)=>{const e=psErr(toStr(P.Message),'NotSpecified','Microsoft.PowerShell.Commands.WriteErrorException');e.cmd='Write-Error';ctx.err(e);return[];});
def('Write-Progress',MODS.util,'Activity:p0 Status:p1 PercentComplete Completed:sw',()=>[]);
let readHostWarned=false;
def('Read-Host',MODS.util,'Prompt:p0,rest AsSecureString:sw',(P)=>{const pr=P.Prompt!=null?toStr(P.Prompt)+': ':'';host(L(pr+(P.AsSecureString?'********':'')));if(!readHostWarned){host(L('(Read-Host attend une saisie clavier : le simulateur répond automatiquement.)','t-warn'));readHostWarned=true;}return P.AsSecureString?mk('System.Security.SecureString',{Length:12},{__s:'System.Security.SecureString'}):'';});
def('Get-Date',MODS.util,'Date:p0 Format UFormat Year Month Day Hour Minute Second DisplayHint',(P)=>{
  let d=P.Date!=null?toDate(P.Date):new Date();d=new Date(d);
  if(P.Year!=null)d.setFullYear(toNum(P.Year));if(P.Month!=null)d.setMonth(toNum(P.Month)-1);if(P.Day!=null)d.setDate(toNum(P.Day));if(P.Hour!=null)d.setHours(toNum(P.Hour));if(P.Minute!=null)d.setMinutes(toNum(P.Minute));if(P.Second!=null)d.setSeconds(toNum(P.Second));
  if(P.Format!=null)return fmtDate(d,toStr(P.Format));
  if(P.UFormat!=null)return toStr(P.UFormat).replace(/%([YmdHMSAaBbjVyeFTDu])/g,(m,c)=>({Y:d.getFullYear(),m:pad(d.getMonth()+1),d:pad(d.getDate()),H:pad(d.getHours()),M:pad(d.getMinutes()),S:pad(d.getSeconds()),A:JOURS[d.getDay()],a:JOURS[d.getDay()].slice(0,3)+'.',B:MOIS[d.getMonth()],b:MOIS[d.getMonth()].slice(0,4)+'.',j:pad(Math.floor((d-new Date(d.getFullYear(),0,0))/864e5),3),y:pad(d.getFullYear()%100),e:d.getDate(),F:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,T:`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,D:`${pad(d.getMonth()+1)}/${pad(d.getDate())}/${pad(d.getFullYear()%100)}`,u:d.getDay()||7,V:''})[c]);
  return d;
});
def('New-TimeSpan',MODS.util,'Start:p0 End:p1 Days Hours Minutes Seconds',(P)=>{if(P.Start!=null||P.End!=null){const a=P.Start!=null?toDate(P.Start):new Date(),b=P.End!=null?toDate(P.End):new Date();return timespan(b-a);}return timespan(((toNum(P.Days||0)*24+toNum(P.Hours||0))*60+toNum(P.Minutes||0))*60000+toNum(P.Seconds||0)*1000);});
def('Start-Sleep',MODS.util,'Seconds:p0 Milliseconds',()=>[],{alias:['sleep']});
def('Get-Random',MODS.util,'Maximum:p0 Minimum InputObject Count',(P,inp)=>{const list=P.InputObject!=null?arr(P.InputObject):inp;if(list.length){const s=shuffleArr(list);return P.Count?s.slice(0,toNum(P.Count)):s[0];}const mn=P.Minimum!=null?toNum(P.Minimum):0,mx=P.Maximum!=null?toNum(P.Maximum):2147483647;return Math.floor(mn+Math.random()*(mx-mn));});
function shuffleArr(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
def('Get-Variable',MODS.util,'Name:p0 ValueOnly:sw',(P,inp,ctx)=>{const all=[];let s=ctx.scope;const seen=new Set();while(s){for(const [k,v] of s.vars){if(!seen.has(k)){seen.add(k);all.push([k,v]);}}s=s.parent;}
  ['true','false','null','home','pshome','pwd','psversiontable','error','profile'].forEach(k=>{if(!seen.has(k))all.push([k,getVar(k,ctx.scope)]);});
  const pats=strs(P.Name);const sel=all.filter(x=>nameMatch(x[0],pats)).sort((a,b)=>a[0].localeCompare(b[0]));
  if(pats.length&&!sel.length&&!pats.some(hasWild))throw notFound(`Impossible de trouver une variable avec le nom « ${pats[0]} ».`,'VariableNotFound,Microsoft.PowerShell.Commands.GetVariableCommand');
  return P.ValueOnly?sel.map(x=>x[1]):sel.map(x=>mk('System.Management.Automation.PSVariable',{Name:x[0],Value:x[1]}));},{alias:['gv']});
def('Set-Variable',MODS.util,'Name:p0 Value:p1 Scope',(P,inp,ctx)=>{setVar(toStr(P.Name),P.Value,ctx.scope);return[];},{alias:['set','sv']});
def('New-Variable',MODS.util,'Name:p0 Value:p1 Scope',(P,inp,ctx)=>{setVar(toStr(P.Name),P.Value,ctx.scope);return[];},{alias:['nv']});
def('Remove-Variable',MODS.util,'Name:p0',(P,inp,ctx)=>{strs(P.Name).forEach(n=>{let s=ctx.scope;while(s){s.vars.delete(lc(n));s=s.parent;}});return[];},{alias:['rv']});
def('Get-Culture',MODS.util,'',()=>mk('System.Globalization.CultureInfo',{LCID:1036,Name:'fr-FR',DisplayName:'Français (France)'},{__s:'fr-FR'}));
def('Get-Host',MODS.util,'',()=>mk('System.Management.Automation.Internal.Host.InternalHost',{Name:'ConsoleHost',Version:'5.1.26100.2161',InstanceId:guid('host'),UI:'System.Management.Automation.Internal.Host.InternalHostUserInterface',CurrentCulture:'fr-FR',CurrentUICulture:'fr-FR',PrivateData:'Microsoft.PowerShell.ConsoleHost+ConsoleColorProxy',DebuggerEnabled:true,IsRunspacePushed:false,Runspace:'System.Management.Automation.Runspaces.LocalRunspace'}));
def('Invoke-Expression',MODS.util,'Command:p0',(P,inp,ctx)=>runStatementsRaw(toStr(P.Command),ctx.scope),{alias:['iex']});
def('Measure-Command',MODS.util,'Expression:p0',(P,inp,ctx)=>{if(P.Expression)callSb(P.Expression,null);return timespan(12+Math.round(Math.random()*40));});
def('Out-Null',MODS.core,'InputObject',()=>[]);
def('Out-Host',MODS.core,'InputObject Paging:sw',(P,inp)=>{fmtOut(P.InputObject!=null?arr(P.InputObject):inp).forEach(x=>host(L(x)));return[];},{alias:['oh']});
def('Out-Default',MODS.core,'InputObject',(P,inp)=>{fmtOut(P.InputObject!=null?arr(P.InputObject):inp).forEach(x=>host(L(x)));return[];});
def('Out-String',MODS.util,'InputObject Stream:sw Width',(P,inp)=>{const lines=fmtOut(P.InputObject!=null?arr(P.InputObject):inp);return P.Stream?lines:lines.join('\n')+'\n';},{alias:[]});
def('Out-GridView',MODS.util,'InputObject Title PassThru:sw OutputMode Wait:sw',(P,inp)=>{const items=P.InputObject!=null?arr(P.InputObject):inp;host(L('(Out-GridView ouvre une fenêtre filtrable — non disponible dans le simulateur. Aperçu :)','t-warn'));fmtOut(items).forEach(x=>host(L(x)));return P.PassThru?items:[];},{alias:['ogv']});
function textOf(items){return fmtOut(items).join('\n');}
def('Out-File',MODS.util,'FilePath@Path:p0 Encoding:p1 Append:sw Force:sw NoClobber:sw Width InputObject',(P,inp,ctx)=>{const items=P.InputObject!=null?arr(P.InputObject):inp;const f=toStr(P.FilePath);if(P.NoClobber&&exists(f))throw psErr(`Le fichier « ${f} » existe déjà.`,'ResourceExists','NoClobber,Microsoft.PowerShell.Commands.OutFileCommand');
  if(ctx.whatif){ctx.wi('Output to File',showLoc(resolve(f)));return[];}
  let txt=items.every(x=>typeof x==='string')?items.join('\n'):textOf(items);
  try{writeFile(f,txt,!!P.Append);}catch(e){throw psErr(`Impossible de trouver une partie du chemin d’accès « ${showLoc(resolve(f))} ».`,'OpenError','FileOpenFailure,Microsoft.PowerShell.Commands.OutFileCommand');}return[];});
def('Tee-Object',MODS.util,'FilePath@Path:p0 Variable Append:sw InputObject',(P,inp,ctx)=>{const items=P.InputObject!=null?arr(P.InputObject):inp;if(P.Variable!=null)setVar(toStr(P.Variable),unwrap(items),ctx.scope);if(P.FilePath!=null)writeFile(toStr(P.FilePath),items.every(x=>typeof x==='string')?items.join('\n'):textOf(items),!!P.Append);return items;},{alias:['tee']});

/* ---------- filtres, tri, sélection ---------- */
const WHERE_OPS=['EQ','NE','GT','GE','LT','LE','Like','NotLike','Match','NotMatch','Contains','NotContains','In','NotIn','CEQ','CNE','CLike','CMatch','Is','IsNot'];
def('Where-Object',MODS.core,'FilterScript@Property:p0 Value:p1 InputObject '+WHERE_OPS.map(o=>o+':sw').join(' '),(P,inp,ctx)=>{
  const items=P.InputObject!=null?arr(P.InputObject):inp;
  if(!items.length&&lc(ctx.called)==='where'){const prop=toStr(P.FilterScript);if(prop&&!isSb(P.FilterScript))host(L(`(Dans PowerShell, « where » est l’alias de Where-Object. Pour chercher l’emplacement d’un programme : where.exe ${prop})`,'t-warn'));}
  const fs=P.FilterScript;
  if(isSb(fs))return items.filter(x=>truthy(unwrap(callSb(fs,x))));
  const prop=toStr(fs);const op=WHERE_OPS.find(o=>P[o]);
  return items.filter(x=>{const v=prop?getMember(x,prop):x;if(!op)return truthy(v);const ln={k:'lit',v},rn={k:'lit',v:P.Value};return truthy(binop('-'+lc(op),ln,rn,ctx.scope));});
},{alias:['where','?']});
function selectProps(o,props){
  const out={};const extra={};
  for(const p of props){
    if(isHt(p)){const nk=Object.keys(p).find(k=>/^(n|name|l|label)$/i.test(k));const ek=Object.keys(p).find(k=>/^(e|expression)$/i.test(k));const name=nk?toStr(p[nk]):'?';const ex=ek?p[ek]:null;out[name]=isSb(ex)?unwrap(callSb(ex,o)):getMember(o,toStr(ex));continue;}
    const ps=toStr(p);
    if(hasWild(ps)){const ks=isObj(o)?Object.keys(o):[];ks.filter(k=>wildRx(ps).test(k)).forEach(k=>out[k]=o[k]);continue;}
    const v=getMember(o,ps);const k=isObj(o)?(Object.keys(o).find(x=>lc(x)===lc(ps))||ps):ps;out[k]=v;
  }
  return mk('Selected.'+(typeOf(o)||'System.Object'),out);
}
def('Select-Object',MODS.util,'Property:p0 ExcludeProperty ExpandProperty First Last Skip SkipLast Unique:sw Index InputObject Wait:sw',(P,inp)=>{
  let items=P.InputObject!=null?arr(P.InputObject):inp;
  if(P.Unique){const seen=new Set();items=items.filter(x=>{const k=isObj(x)?JSON.stringify(Object.values(x).map(toStr)):toStr(x);if(seen.has(k))return false;seen.add(k);return true;});}
  if(P.Skip!=null)items=items.slice(toNum(P.Skip));
  if(P.SkipLast!=null)items=items.slice(0,Math.max(0,items.length-toNum(P.SkipLast)));
  if(P.Index!=null)items=arr(P.Index).map(i=>items[toNum(i)]).filter(x=>x!==undefined);
  if(P.First!=null||P.Last!=null){let r=[];if(P.First!=null)r=r.concat(items.slice(0,toNum(P.First)));if(P.Last!=null)r=r.concat(items.slice(Math.max(0,items.length-toNum(P.Last))));items=r;}
  if(P.ExpandProperty!=null){const ep=toStr(P.ExpandProperty);const out=[];items.forEach(o=>{const v=getMember(o,ep);if(v==null&&!(isObj(o)&&Object.keys(o).some(k=>lc(k)===lc(ep))))throw psErr(`La propriété « ${ep} » est introuvable.`,'InvalidArgument','ExpandPropertyNotFound,Microsoft.PowerShell.Commands.SelectObjectCommand');if(Array.isArray(v))out.push(...v);else out.push(v);});return out;}
  if(P.Property==null)return items;
  const props=arr(P.Property);const ex=strs(P.ExcludeProperty);
  return items.map(o=>{const s=selectProps(o,props);ex.forEach(e=>Object.keys(s).filter(k=>wildRx(e).test(k)).forEach(k=>delete s[k]));return s;});
},{alias:['select']});
function sortKey(o,p){if(p==null){if(isObj(o)){const n=getMember(o,'Name');return n!=null?n:toStr(o);}return o;}if(isSb(p))return unwrap(callSb(p,o));if(isHt(p)){const ek=Object.keys(p).find(k=>/^(e|expression)$/i.test(k));return sortKey(o,ek?p[ek]:null);}return getMember(o,toStr(p));}
def('Sort-Object',MODS.util,'Property:p0 Descending:sw Unique:sw CaseSensitive:sw InputObject Top Bottom',(P,inp)=>{
  const items=(P.InputObject!=null?arr(P.InputObject):inp).map((x,i)=>({x,i}));const props=P.Property!=null?arr(P.Property):[null];
  items.sort((a,b)=>{for(const p of props){let desc=!!P.Descending;if(isHt(p)){const dk=Object.keys(p).find(k=>/^(d|desc|descending)$/i.test(k));if(dk)desc=truthy(p[dk]);const ak=Object.keys(p).find(k=>/^(a|asc|ascending)$/i.test(k));if(ak)desc=!truthy(p[ak]);}
    const r_=cmpVals(sortKey(a.x,p),sortKey(b.x,p));if(r_)return desc?-r_:r_;}return a.i-b.i;});
  let out=items.map(x=>x.x);if(P.Unique){const seen=new Set();out=out.filter(o=>{const k=lc(props.map(p=>toStr(sortKey(o,p))).join('|'));if(seen.has(k))return false;seen.add(k);return true;});}
  if(P.Top!=null)out=out.slice(0,toNum(P.Top));return out;
},{alias:['sort']});
def('Group-Object',MODS.util,'Property:p0 NoElement:sw AsHashTable:sw AsString:sw CaseSensitive:sw InputObject',(P,inp)=>{
  const items=P.InputObject!=null?arr(P.InputObject):inp;const props=P.Property!=null?arr(P.Property):[null];const groups=new Map();
  items.forEach(o=>{const vals=props.map(p=>sortKey(o,p));const key=vals.map(toStr).join(', ');const k=P.CaseSensitive?key:lc(key);if(!groups.has(k))groups.set(k,{Name:key,Values:vals,Group:[]});groups.get(k).Group.push(o);});
  if(P.AsHashTable){const h=mk('System.Collections.Hashtable',{});groups.forEach(g=>h[g.Name]=g.Group);return h;}
  return[...groups.values()].map(g=>mk(P.NoElement?'Microsoft.PowerShell.Commands.GroupInfoNoElement':'Microsoft.PowerShell.Commands.GroupInfo',P.NoElement?{Count:g.Group.length,Name:g.Name}:{Count:g.Group.length,Name:g.Name,Group:g.Group},{__get:{values:g.Values}}));
},{alias:['group']});
def('Measure-Object',MODS.util,'Property:p0 Sum:sw Average:sw Maximum:sw Minimum:sw Line:sw Word:sw Character:sw AllStats:sw InputObject',(P,inp)=>{
  const items=P.InputObject!=null?arr(P.InputObject):inp;
  if(P.Line||P.Word||P.Character){const txt=items.map(toStr);return mk('Microsoft.PowerShell.Commands.TextMeasureInfo',{Lines:P.Line?txt.reduce((a,s)=>a+s.split('\n').length,0):null,Words:P.Word?txt.reduce((a,s)=>a+s.split(/\s+/).filter(Boolean).length,0):null,Characters:P.Character?txt.reduce((a,s)=>a+s.length,0):null,Property:null});}
  const props=P.Property!=null?strs(P.Property):[null];const all=P.AllStats;
  return props.map(p=>{const vals=items.map(o=>p==null?o:getMember(o,p)).filter(v=>v!=null);
    if(p!=null&&items.length&&!vals.length)throw psErr(`La propriété « ${p} » est introuvable dans l’entrée d’aucun objet.`,'InvalidArgument','GenericMeasurePropertyNotFound,Microsoft.PowerShell.Commands.MeasureObjectCommand');
    const nums=()=>vals.map(v=>toNum(v));
    const sum=(P.Sum||P.Average||all)?nums().reduce((a,b)=>a+b,0):null;
    const isStr=vals.length&&vals.every(v=>typeof v==='string'&&isNaN(+v));
    const mx=(P.Maximum||all)&&vals.length?(isStr?vals.slice().sort((a,b)=>cmpVals(b,a))[0]:Math.max(...nums())):null;
    const mn=(P.Minimum||all)&&vals.length?(isStr?vals.slice().sort((a,b)=>cmpVals(a,b))[0]:Math.min(...nums())):null;
    return mk('Microsoft.PowerShell.Commands.GenericMeasureInfo',{Count:vals.length,Average:(P.Average||all)&&vals.length?sum/vals.length:null,Sum:(P.Sum||all)?sum:null,Maximum:mx,Minimum:mn,Property:p});});
},{alias:['measure']});
def('ForEach-Object',MODS.core,'Process:p0,rest Begin End MemberName InputObject ArgumentList',(P,inp,ctx)=>{
  const items=P.InputObject!=null?arr(P.InputObject):inp;let out=[];
  if(P.Begin)out=out.concat(callSb(P.Begin,null));
  const pr=P.Process!=null?arr(P.Process):[];
  if(pr.length&&!isSb(pr[0])){const mn=toStr(pr[0]);items.forEach(x=>{const v=getMember(x,mn);if(v!=null&&isObj(x)&&x.__methods&&x.__methods[lc(mn)]){}if(Array.isArray(v))out.push(...v);else if(v!=null)out.push(v);});return out;}
  if(P.MemberName!=null){const mn=toStr(P.MemberName);items.forEach(x=>{const v=getMember(x,mn);if(Array.isArray(v))out.push(...v);else if(v!=null)out.push(v);});return out;}
  let n=0;
  for(const x of items){if(++n>5000)break;for(const sb of pr){try{out=out.concat(callSb(sb,x));}catch(e){if(e instanceof PSFlow&&e.kind==='continue'){out=out.concat(flowOut(e));break;}if(e instanceof PSFlow&&e.kind==='break'){return out.concat(flowOut(e));}throw e;}}}
  if(P.End)out=out.concat(callSb(P.End,null));
  return out;
},{alias:['foreach','%']});
def('Compare-Object',MODS.util,'ReferenceObject:p0 DifferenceObject:p1 Property IncludeEqual:sw ExcludeDifferent:sw PassThru:sw CaseSensitive:sw',(P)=>{
  const A=arr(P.ReferenceObject),B=arr(P.DifferenceObject);const props=P.Property!=null?strs(P.Property):null;
  const key=o=>props?props.map(p=>lc(toStr(getMember(o,p)))).join('|'):lc(toStr(o));
  const ka=A.map(key),kb=B.map(key);const out=[];
  const mkr=(o,s)=>{if(P.PassThru)return o;const base=props?Object.fromEntries(props.map(p=>[p,getMember(o,p)])):{InputObject:o};base.SideIndicator=s;return mk('System.Management.Automation.PSCustomObject',base);};
  if(P.IncludeEqual)A.forEach((o,i)=>{if(kb.includes(ka[i]))out.push(mkr(o,'=='));});
  if(!P.ExcludeDifferent){B.forEach((o,i)=>{if(!ka.includes(kb[i]))out.push(mkr(o,'=>'));});A.forEach((o,i)=>{if(!kb.includes(ka[i]))out.push(mkr(o,'<='));});}
  return out;
},{alias:['compare','diff']});
def('Get-Unique',MODS.util,'InputObject AsString:sw',(P,inp)=>{const items=P.InputObject!=null?arr(P.InputObject):inp;return items.filter((x,i)=>i===0||toStr(items[i-1])!==toStr(x));},{alias:['gu']});
def('Select-String',MODS.util,'Pattern:p0 Path:p1 SimpleMatch:sw CaseSensitive:sw NotMatch:sw List:sw Quiet:sw AllMatches:sw Context InputObject Include Exclude Encoding',(P,inp,ctx)=>{
  const pats=strs(P.Pattern);const mkRx=p=>{try{return new RegExp(P.SimpleMatch?p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'):p,P.CaseSensitive?'':'i');}catch(e){throw psErr(`Le modèle d’expression régulière ${p} n’est pas valide.`,'InvalidArgument','InvalidRegex,Microsoft.PowerShell.Commands.SelectStringCommand');}};
  const rxs=pats.map(mkRx);const out=[];
  const scan=(lines,path,fname)=>{for(let i=0;i<lines.length;i++){const l=lines[i];const hit=rxs.some(r_=>r_.test(l));if(P.NotMatch?!hit:hit){const s=path?`${path}:${i+1}:${l}`:l;out.push(mk('Microsoft.PowerShell.Commands.MatchInfo',{IgnoreCase:!P.CaseSensitive,LineNumber:i+1,Line:l,Filename:fname||'InputStream',Path:path||'InputStream',Pattern:pats[0]},{__s:s,__lines:function(){return[this.__s];}}));if(P.List)break;}}};
  if(P.Path!=null){for(const p of strs(P.Path)){const its=fsItems(p,ctx);(its||[]).filter(x=>!x.n.d).forEach(x=>{if(x.n.bin)return;const fx=fixCase(x.loc);scan(x.n.content.split('\n'),showLoc(fx),x.n.name);});}}
  else{const items=P.InputObject!=null?arr(P.InputObject):inp;items.forEach(x=>{if(isObj(x)&&x.__isFs&&!x.__isDir){if(!x.__node.bin)scan(x.__node.content.split('\n'),x.FullName,x.Name);}else scan(toStr(x).split('\n'),null,null);});}
  if(P.Quiet)return out.length>0;
  return out;
},{alias:['sls']});
/* ---------- mise en forme ---------- */
const FL_VIEWS={'System.IO.FileInfo':['Name','Length','CreationTime','LastWriteTime','LastAccessTime','Mode'],'System.IO.DirectoryInfo':['Name','CreationTime','LastWriteTime','LastAccessTime','Mode'],'System.Diagnostics.Process':['Id','Handles','CPU','SI','Name'],'System.ServiceProcess.ServiceController':['Name','DisplayName','Status','DependentServices','ServicesDependedOn','CanPauseAndContinue','CanShutdown','CanStop','ServiceType'],'System.Diagnostics.Eventing.Reader.EventLogRecord':['TimeCreated','ProviderName','Id','Message']};
function fmtProps(P){return P.Property==null?null:arr(P.Property).flatMap(p=>{if(isHt(p)){const nk=Object.keys(p).find(k=>/^(n|name|l|label)$/i.test(k));const ek=Object.keys(p).find(k=>/^(e|expression)$/i.test(k));const ex=ek?p[ek]:null;return[{label:nk?toStr(p[nk]):'?',fn:o=>isSb(ex)?unwrap(callSb(ex,o)):getMember(o,toStr(ex))}];}return[toStr(p)];});}
function groupsOf(items){const g=[];items.forEach(x=>{const t=isObj(x)?x.__t:'__prim';if(g.length&&g[g.length-1].t===t)g[g.length-1].items.push(x);else g.push({t,items:[x]});});return g;}
def('Format-Table',MODS.util,'Property:p0 AutoSize:sw Wrap:sw GroupBy HideTableHeaders:sw InputObject',(P,inp)=>{
  const items=P.InputObject!=null?arr(P.InputObject):inp;let props=fmtProps(P);const lines=[];
  for(const g of groupsOf(items)){
    if(g.t==='__prim'){g.items.forEach(x=>lines.push(display(x)));continue;}
    let pp=props;if(pp&&pp.length===1&&pp[0]==='*')pp=Object.keys(g.items[0]);
    if(pp){const exp=pp.flatMap(p=>typeof p==='string'&&hasWild(p)?Object.keys(g.items[0]).filter(k=>wildRx(p).test(k)):[p]);lines.push(...formatGroup(g.items,'table',exp));}
    else lines.push(...formatGroup(g.items,'table',null));
  }
  if(P.HideTableHeaders){const i=lines.findIndex(l=>/^-+/.test(l));if(i>0)lines.splice(i-1,2);}
  return[mk('Microsoft.PowerShell.Commands.Internal.Format.FormatStartData',{},{__fmt:true,lines})];
},{alias:['ft']});
def('Format-List',MODS.util,'Property:p0 GroupBy InputObject',(P,inp)=>{
  const items=P.InputObject!=null?arr(P.InputObject):inp;const props=fmtProps(P);const lines=[];
  for(const g of groupsOf(items)){
    if(g.t==='__prim'){g.items.forEach(x=>lines.push(display(x)));continue;}
    let pp=props;
    if(pp&&pp.some(p=>p==='*')){lines.push(...listLines(g.items,null));continue;}
    if(pp){const exp=pp.flatMap(p=>typeof p==='string'&&hasWild(p)?Object.keys(g.items[0]).filter(k=>wildRx(p).test(k)):[p]);lines.push(...listLines(g.items,exp.map(p=>typeof p==='string'?p:[p.label,p.fn])));continue;}
    const fl=FL_VIEWS[g.t];const v=viewFor(g.items[0]);
    lines.push(...listLines(g.items,fl||(v&&v.l)||null));
  }
  return[mk('Microsoft.PowerShell.Commands.Internal.Format.FormatStartData',{},{__fmt:true,lines})];
},{alias:['fl']});
def('Format-Wide',MODS.util,'Property:p0 Column AutoSize:sw InputObject',(P,inp)=>{const items=P.InputObject!=null?arr(P.InputObject):inp;const p=P.Property!=null?toStr(P.Property):'Name';const names=items.map(o=>isObj(o)?toStr(getMember(o,p)):toStr(o));const col=P.Column?toNum(P.Column):2;const w=Math.floor(78/col);const lines=[''];for(let i=0;i<names.length;i+=col)lines.push(names.slice(i,i+col).map(n=>n.padEnd(w)).join('').trimEnd());lines.push('');return[mk('fmt',{},{__fmt:true,lines})];},{alias:['fw']});

/* ---------- import / export ---------- */
function csvVal(v){if(v==null)return'';if(Array.isArray(v))return'System.Object[]';if(v instanceof Date)return fdt(v);if(typeof v==='number')return numFr(v);if(typeof v==='boolean')return v?'True':'False';if(isObj(v))return toStr(v);return String(v);}
function toCsvLines(items,delim,noType){
  if(!items.length)return[];
  const first=items[0];
  if(isObj(first)&&first.__fmt)return['#TYPE Microsoft.PowerShell.Commands.Internal.Format.FormatStartData','"ClassId2e4f51ef21dd47e99d3c952918aff9cd","pageHeaderEntry","pageFooterEntry","autosizeInfo","shapeInfo","groupingEntry"','"033ecb2bc07a4d43b5ef94ed5a35d280",,,,"Microsoft.PowerShell.Commands.Internal.Format.TableHeaderInfo",'];
  const props=isObj(first)?Object.keys(first):['Length'];
  const lines=[];if(!noType)lines.push('#TYPE '+(typeOf(first)||'System.Object'));
  lines.push(props.map(p=>`"${p}"`).join(delim));
  items.forEach(o=>lines.push(props.map(p=>{const v=isObj(o)?getMember(o,p):(p==='Length'?toStr(o).length:null);return `"${csvVal(v).replace(/"/g,'""')}"`;}).join(delim)));
  return lines;
}
function parseCsv(text,delim,header){
  const rows=[];const lines=String(text).replace(/^﻿/,'').split('\n').filter(l=>l.trim()&&!/^#TYPE/.test(l));
  const parseLine=l=>{const out=[];let cur='',q=false;for(let i=0;i<l.length;i++){const c=l[i];if(q){if(c==='"'){if(l[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=c;}else{if(c==='"')q=true;else if(c===delim){out.push(cur);cur='';}else cur+=c;}}out.push(cur);return out;};
  let head=header?header:parseLine(lines.shift()||'');
  head=head.map((h,i)=>h.trim()||`H${i+1}`);
  for(const l of lines){const v=parseLine(l);const o={};head.forEach((h,i)=>o[h]=v[i]!=null?v[i]:null);rows.push(mk('System.Management.Automation.PSCustomObject',o,{__csv:true}));}
  if(!header&&lines.length&&head.length===1&&lines[0].includes(delim===','?';':','))host(L('(Une seule colonne détectée : le fichier utilise peut-être un autre séparateur. Essaie -Delimiter \';\'.)','t-warn'));
  return rows;
}
def('Export-Csv',MODS.util,'Path@LiteralPath:p0 Delimiter:p1 NoTypeInformation@nti:sw Encoding Append:sw UseCulture:sw Force:sw NoClobber:sw InputObject',(P,inp,ctx)=>{
  const items=P.InputObject!=null?arr(P.InputObject):inp;const delim=P.UseCulture?';':P.Delimiter!=null?toStr(P.Delimiter):',';
  const f=toStr(P.Path);if(ctx.whatif){ctx.wi('Export-Csv',showLoc(resolve(f)));return[];}
  let lines=toCsvLines(items,delim,!!P.NoTypeInformation);
  if(P.Append&&exists(f)){lines=lines.filter(l=>!/^#TYPE/.test(l)).slice(1);}
  try{writeFile(f,lines.join('\n'),!!P.Append);}catch(e){throw psErr(`Impossible de trouver une partie du chemin d’accès « ${showLoc(resolve(f))} ».`,'OpenError','FileOpenFailure,Microsoft.PowerShell.Commands.ExportCsvCommand');}
  return[];
},{alias:['epcsv']});
def('Import-Csv',MODS.util,'Path@LiteralPath:p0 Delimiter:p1 Header UseCulture:sw Encoding',(P,inp,ctx)=>{
  const out=[];for(const p of strs(P.Path)){const c=readFile(p);if(c==null){ctx.err(notFound(`Impossible de trouver le fichier « ${showLoc(resolve(p))} ».`,'FileOpenFailure,Microsoft.PowerShell.Commands.ImportCsvCommand','OpenError'));continue;}out.push(...parseCsv(c,P.UseCulture?';':P.Delimiter!=null?toStr(P.Delimiter):',',P.Header!=null?strs(P.Header):null));}
  return out;
},{alias:['ipcsv']});
def('ConvertTo-Csv',MODS.util,'InputObject:p0 Delimiter:p1 NoTypeInformation@nti:sw UseCulture:sw',(P,inp)=>toCsvLines(P.InputObject!=null?arr(P.InputObject):inp,P.UseCulture?';':P.Delimiter!=null?toStr(P.Delimiter):',',!!P.NoTypeInformation));
def('ConvertFrom-Csv',MODS.util,'InputObject:p0 Delimiter:p1 Header UseCulture:sw',(P,inp)=>parseCsv((P.InputObject!=null?arr(P.InputObject):inp).map(toStr).join('\n'),P.UseCulture?';':P.Delimiter!=null?toStr(P.Delimiter):',',P.Header!=null?strs(P.Header):null));
function toJson(v,depth,ind,compress){
  const sp=compress?'':'    '.repeat(ind+1),end=compress?'':'    '.repeat(ind),nl=compress?'':'\n',col=compress?':':':  ';
  if(v==null)return'null';if(typeof v==='string')return JSON.stringify(v);if(typeof v==='number'||typeof v==='boolean')return String(v);
  if(v instanceof Date)return `"\\/Date(${v.getTime()})\\/"`;
  if(depth<0)return JSON.stringify(toStr(v));
  if(Array.isArray(v))return v.length?'['+nl+v.map(x=>sp+toJson(x,depth-1,ind+1,compress)).join(','+nl)+nl+end+']':'[]';
  if(isSb(v))return JSON.stringify(v.__sb);
  const ks=Object.keys(v);return'{'+nl+ks.map(k=>`${sp}${JSON.stringify(k)}${col}${toJson(v[k],depth-1,ind+1,compress)}`).join(','+nl)+nl+end+'}';
}
def('ConvertTo-Json',MODS.util,'InputObject:p0 Depth Compress:sw',(P,inp,ctx)=>{const items=P.InputObject!=null?arr(P.InputObject):inp;const d=P.Depth!=null?toNum(P.Depth):2;const v=items.length===1?items[0]:items;if(d===2&&items.some(o=>isObj(o)&&Object.values(o).some(x=>isObj(x)&&Object.values(x).some(isObj))))ctx.warn('La sérialisation a été tronquée à la profondeur 2 (utilise -Depth).');return toJson(v,d,0,!!P.Compress);});
function fromJs(v){if(Array.isArray(v))return v.map(fromJs);if(v&&typeof v==='object'){const o={};Object.keys(v).forEach(k=>o[k]=fromJs(v[k]));return mk('System.Management.Automation.PSCustomObject',o);}return v;}
def('ConvertFrom-Json',MODS.util,'InputObject:p0',(P,inp)=>{const s=(P.InputObject!=null?arr(P.InputObject):inp).map(toStr).join('\n');try{return fromJs(JSON.parse(s));}catch(e){throw psErr('Objet JSON non valide transmis à ConvertFrom-Json.','NotSpecified','System.ArgumentException,Microsoft.PowerShell.Commands.ConvertFromJsonCommand');}});
def('ConvertTo-Html',MODS.util,'Property:p0 InputObject Title Head Body PreContent PostContent Fragment:sw As',(P,inp)=>{const items=P.InputObject!=null?arr(P.InputObject):inp;const props=P.Property!=null?strs(P.Property):(items[0]&&isObj(items[0])?Object.keys(items[0]):['*']);
  const rows=items.map(o=>'<tr>'+props.map(p=>`<td>${cell(getMember(o,p)).replace(/</g,'&lt;')}</td>`).join('')+'</tr>');
  const tbl=['<table>','<colgroup>'+props.map(()=>'<col/>').join('')+'</colgroup>','<tr>'+props.map(p=>`<th>${p}</th>`).join('')+'</tr>',...rows,'</table>'];
  if(P.Fragment)return tbl;return['<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">','<html xmlns="http://www.w3.org/1999/xhtml">','<head>',`<title>${P.Title!=null?toStr(P.Title):'HTML TABLE'}</title>`,'</head><body>',...(P.PreContent?[toStr(P.PreContent)]:[]),...tbl,...(P.PostContent?[toStr(P.PostContent)]:[]),'</body></html>'];});
def('New-Object',MODS.util,'TypeName:p0 ArgumentList:p1 Property ComObject',(P)=>{
  const t=lc(toStr(P.TypeName||'')).replace(/^system\./,'');
  if(P.ComObject!=null){const c=lc(toStr(P.ComObject));if(c==='wscript.shell')return mk('System.__ComObject',{},{__methods:{popup:()=>1,run:()=>0,createshortcut:(p)=>mk('IWshShortcut',{FullName:toStr(p),TargetPath:'',Arguments:''},{__methods:{save:()=>{writeFile(toStr(p),'[raccourci]');}}})}});throw psErr(`Impossible de créer l’objet COM ${P.ComObject} dans le simulateur.`,'ResourceUnavailable','NoCOMClassIdentified');}
  if(t==='psobject'||t==='pscustomobject'||t==='management.automation.psobject'||t==='object')return mk('System.Management.Automation.PSCustomObject',P.Property&&isHt(P.Property)?Object.assign({},P.Property):{});
  if(t==='collections.arraylist'||t==='collections.generic.list[string]'||t==='collections.generic.list[object]'){const a=[];Object.defineProperty(a,'__al',{value:true});return[a];}
  if(t==='management.automation.pscredential'||t==='pscredential'){const a=arr(P.ArgumentList);return mk('System.Management.Automation.PSCredential',{UserName:toStr(a[0]),Password:a[1]||null},{__s:'System.Management.Automation.PSCredential'});}
  if(t==='net.webclient')return mk('System.Net.WebClient',{},{__methods:{downloadfile:(u,f)=>{writeFile(toStr(f),'(contenu téléchargé simulé)');host(L('(Simulation : aucun accès Internet réel, fichier factice créé.)','t-warn'));},downloadstring:()=>'(contenu simulé)'}});
  if(t==='datetime'){const a=arr(P.ArgumentList).map(toNum);return new Date(a[0],(a[1]||1)-1,a[2]||1,a[3]||0,a[4]||0,a[5]||0);}
  if(t==='text.stringbuilder')return mk('System.Text.StringBuilder',{Length:0},{__methods:{append:function(s){this.__v=(this.__v||'')+toStr(s);return this;},tostring:function(){return this.__v||'';}}});
  throw psErr(`Impossible de trouver le type [${P.TypeName}] : vérifiez que l’assembly dans lequel il se trouve est chargé.`,'InvalidType','TypeNotFound,Microsoft.PowerShell.Commands.NewObjectCommand');
});
def('Add-Member',MODS.util,'MemberType@Type:p0 Name:p1 Value:p2 InputObject NotePropertyName NotePropertyValue NotePropertyMembers PassThru:sw Force:sw',(P,inp)=>{const items=P.InputObject!=null?arr(P.InputObject):inp;const name=toStr(P.NotePropertyName!=null?P.NotePropertyName:P.Name);const val=P.NotePropertyValue!=null?P.NotePropertyValue:P.Value;
  items.forEach(o=>{if(!isObj(o))return;if(P.NotePropertyMembers&&isHt(P.NotePropertyMembers))Object.assign(o,P.NotePropertyMembers);else if(name){if(Object.keys(o).some(k=>lc(k)===lc(name))&&!P.Force)throw psErr(`Impossible d’ajouter un membre portant le nom « ${name} », car un membre portant ce nom existe déjà.`,'InvalidOperation','MemberAlreadyExists,Microsoft.PowerShell.Commands.AddMemberCommand');o[name]=isSb(val)?unwrap(callSb(val,o)):val;}});return P.PassThru?items:[];});
def('Set-Clipboard',MODS.mgmt,'Value:p0 Append:sw',(P,inp)=>{st.clip=(P.Value!=null?arr(P.Value):inp).map(toStr).join('\n');return[];},{alias:['scb']});
def('Get-Clipboard',MODS.mgmt,'Raw:sw',()=>st.clip!=null?st.clip.split('\n'):[],{alias:['gcb']});
