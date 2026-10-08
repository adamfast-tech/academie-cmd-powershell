
/* =========================================================
   API du simulateur
   ========================================================= */
st.funcs={};
CMDLETS['clear-host'].fn=()=>{st.clear=true;if(HOSTBUF)HOSTBUF.length=0;return[];};
const PS_BANNER=['Windows PowerShell','Copyright (C) Microsoft Corporation. Tous droits réservés.','','Installez la dernière version de PowerShell pour de nouvelles fonctionnalités et améliorations ! https://aka.ms/PSWindows',''];
const CMD_BANNER=['Microsoft Windows [version 10.0.26100.2033]','(c) Microsoft Corporation. Tous droits réservés.',''];
function prompt(){return st.shell==='ps'?'PS '+psLocStr()+'> ':cwdStr()+'>';}
function psExec(src,withFormat){
  const saved=HOSTBUF;HOSTBUF=[];st.clear=false;st.curLine=src;
  try{
    for(const s of splitStatements(src)){
      let out;
      st.callDepth=0;st.streamOK=splitTopLevel(s,['|']).length===1&&!findAssign(s);
      try{out=runStatement(s,GLOBAL);st.streamOK=false;}
      catch(e){
        st.streamOK=false;
        if(e instanceof PSFlow){if(e.partial)fmtOut(e.partial).forEach(x=>HOSTBUF.push(L(x)));if(e.kind==='exit'){HOSTBUF.exit=true;break;}continue;}
        throw e;
      }
      if(withFormat)fmtOut(out).forEach(x=>HOSTBUF.push(L(x)));
    }
  }catch(e){
    if(e instanceof PSErr){st.ok=false;st.errors.push(errRecord(e));errLines(e,src.split('\n')[0]).forEach(x=>HOSTBUF.push(L(x,'t-err')));if(e.hint)HOSTBUF.push(L(e.hint,'t-warn'));}
    else if(e instanceof RangeError){HOSTBUF.push(L('Le simulateur a interrompu une récursion trop profonde.','t-err'));}
    else{HOSTBUF.push(L('Le simulateur ne sait pas encore interpréter cette syntaxe : '+(e&&e.message||e),'t-err'));}
  }
  const lines=HOSTBUF;HOSTBUF=saved;return lines;
}
function runPsCapture(src){const prev=st.shell;const lines=psExec(src,true);return lines.filter(x=>x);}
function runPsScript(file,ep){
  const pol=ep&&/bypass|unrestricted/i.test(ep);const save=st.execPolicy.Process;if(pol)st.execPolicy.Process='Bypass';
  const lines=psExec('& "'+file.replace(/"/g,'')+'"',true);st.execPolicy.Process=save;return lines;
}
function addTranscript(line,lines){if(!st.transcript)return;try{writeFile(st.transcript,['PS>'+line,...lines.map(l=>l.s)].join('\n'),true);}catch(e){}}
function run(line){
  const res={lines:[],clear:false};
  if(line.trim())st.hist.push(line);
  if(st.shell==='cmd'){
    const r_=runCmdLine(line);
    res.clear=r_.clear;res.lines=r_.lines;
    if(r_.pushPs){st.stack.push('cmd');st.shell='ps';PS_BANNER.forEach(x=>res.lines.push(L(x)));return res;}
    if(r_.pop){st.shell=st.stack.pop()||'cmd';return res;}
    if(!res.clear||res.lines.length)res.lines.push(L(''));
    return res;
  }
  const t=line.trim();
  if(!t)return res;
  if(/^exit$/i.test(t)){if(st.stack.length){st.shell=st.stack.pop();res.lines.push(L(''));}else res.lines.push(L('(exit fermerait la fenêtre. Ici, le simulateur reste ouvert.)','t-warn'));return res;}
  if(/^(cmd|cmd\.exe)$/i.test(t)){st.stack.push('ps');st.shell='cmd';CMD_BANNER.forEach(x=>res.lines.push(L(x)));return res;}
  if(/^(powershell|powershell\.exe)$/i.test(t)){PS_BANNER.forEach(x=>res.lines.push(L(x)));return res;}
  const lines=psExec(line,true);
  res.lines=lines.filter(Boolean);res.clear=st.clear;
  if(st.shell==='cmd'&&!res.clear){}
  addTranscript(line,res.lines);
  return res;
}
function switchTo(sh){
  const res={lines:[]};if(sh===st.shell)return res;
  st.stack=[];st.shell=sh;
  res.lines.push(L(''));(sh==='ps'?PS_BANNER:CMD_BANNER).forEach(x=>res.lines.push(L(x,'t-warn')));
  return res;
}
const CMD_NAMES=()=>Object.keys(CMD).filter(k=>!/^(rem|shift|setlocal|endlocal)$/.test(k)).concat(Object.keys(KNOWN_GUI));
function complete(line){
  const m=/^(.*?)([^\s"]*|"[^"]*)$/.exec(line);const before=m[1],tok=m[2].replace(/^"/,'');
  const first=!before.trim();const out=[];
  const q=s=>/\s/.test(s)?'"'+s+'"':s;
  if(first){
    const names=st.shell==='ps'?Object.values(CMDLETS).map(d=>d.name).concat(Object.keys(ALIASES)):CMD_NAMES();
    [...new Set(names)].filter(n=>lc(n).startsWith(lc(tok))).sort((a,b)=>a.length-b.length||a.localeCompare(b)).slice(0,40).forEach(n=>out.push(before+n));
    if(out.length)return out;
  }
  if(st.shell==='ps'&&/^-/.test(tok)){
    const cmdName=lc(before.trim().split(/\s+/).filter(x=>!/^-/.test(x)).slice(-1)[0]||before.trim().split(/\s+/)[0]||'');
    const segs=before.split('|');const cur=lc((segs[segs.length-1].trim().split(/\s+/)[0])||cmdName);
    const d=CMDLETS[cur]||CMDLETS[ALIASES[cur]];
    if(d)Object.keys(d.params).concat(Object.keys(COMMON)).filter(p=>lc('-'+p).startsWith(lc(tok))).forEach(p=>out.push(before+'-'+p));
    return out;
  }
  try{
    const ix=Math.max(tok.lastIndexOf('\\'),tok.lastIndexOf('/'));
    const dirPart=ix>=0?tok.slice(0,ix+1):'';const pre=ix>=0?tok.slice(ix+1):tok;
    const loc=resolve(dirPart||'.');const n=nodeAt(loc);
    if(n&&n.d)sortKids(n).filter(k=>lc(k.name).startsWith(lc(pre))&&!k.attr.includes('h')).forEach(k=>out.push(before+q((dirPart||(st.shell==='ps'?'.\\':''))+k.name+(k.d?'\\':''))));
  }catch(e){}
  return out;
}
const api={
  run,switchTo,complete,prompt,
  shell:()=>st.shell,
  banner:()=>CMD_BANNER.map(x=>L(x)),
  cwd:()=>cwdStr(),
  exists:p=>exists(p),
  read:p=>readFile(p),
  events:()=>st.events.slice(),
  svcStatus:n=>{const s=st.services.find(x=>lc(x.Name)===lc(n));return s?s.Status:null;},
  adUser:sam=>adUser(sam)
};
return api;
}
return{create};
})();
