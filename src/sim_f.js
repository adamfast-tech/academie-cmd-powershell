
/* =========================================================
   PowerShell : évaluation
   ========================================================= */
const GLOBAL={vars:new Map(),parent:null};
function newScope(parent,vars){const s={vars:new Map(),parent};if(vars)for(const k of Object.keys(vars))s.vars.set(lc(k),vars[k]);return s;}
function findVarScope(name,scope){let s=scope;while(s){if(s.vars.has(name))return s;s=s.parent;}return null;}
function psVersionTable(){return mk('System.Management.Automation.PSVersionHashTable',{PSVersion:'5.1.26100.2161',PSEdition:'Desktop',PSCompatibleVersions:'{1.0, 2.0, 3.0, 4.0...}',BuildVersion:'10.0.26100.2161',CLRVersion:'4.0.30319.42000',WSManStackVersion:'3.0',PSRemotingProtocolVersion:'2.3',SerializationVersion:'1.1.0.1'},{__lines:function(){return tableLines(Object.keys(this).map(k=>({Name:k,Value:this[k]})),[['Name','Name'],['Value','Value']]);},__s:'System.Management.Automation.PSVersionHashTable'});}
function getVar(name,scope){
  let n=lc(name).replace(/^(global|script|local|using|variable):/,'');
  if(n.startsWith('env:')){const v=envGet(name.slice(4));return v==null?null:v;}
  switch(n){
    case'true':return true;case'false':return false;case'null':return null;
    case'psitem':n='_';break;
    case'home':return ME.home;case'pwd':return mk('System.Management.Automation.PathInfo',{Path:psLocStr()},{__s:psLocStr()});
    case'psversiontable':return psVersionTable();case'pshome':return 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0';
    case'profile':return 'C:\\Users\\it.tech\\Documents\\WindowsPowerShell\\Microsoft.PowerShell_profile.ps1';
    case'error':return st.errors.slice().reverse();case'lastexitcode':return st.lastExit;case'?':return st.ok;case'host':return mk('System.Management.Automation.Internal.Host.InternalHost',{Name:'ConsoleHost',Version:'5.1.26100.2161',CurrentCulture:'fr-FR',CurrentUICulture:'fr-FR'});
    case'pid':return 9140;case'executioncontext':return mk('System.Management.Automation.EngineIntrinsics',{});case'ismacos':case'islinux':case'iswindows':return null;
    case'erroractionpreference':{const s=findVarScope(n,scope);return s?s.vars.get(n):'Continue';}
    case'ofs':{const s=findVarScope(n,scope);return s?s.vars.get(n):null;}
  }
  const s=findVarScope(n,scope);return s?s.vars.get(n):null;
}
function setVar(name,val,scope){
  let n=lc(name);
  if(n.startsWith('env:')){envSet(name.slice(4),val==null?'':toStr(val));return;}
  if(/^global:/.test(n)){GLOBAL.vars.set(n.slice(7),val);return;}
  n=n.replace(/^(script|local):/,'');
  if(['true','false','null','home','pshome','psversiontable','pid'].includes(n))throw psErr(`Impossible de remplacer la variable ${name}, car elle est en lecture seule ou constante.`,'WriteError','VariableNotWritable');
  const s=findVarScope(n,scope);(s&&s!==GLOBAL&&scope!==GLOBAL?s:scope).vars.set(n,val);
}
function expandStr(raw,scope){
  let o='';let i=0;const s=raw;
  while(i<s.length){
    const c=s[i];
    if(c==='`'&&i+1<s.length){const e=s[i+1];o+={n:'\n',t:'\t',r:'',0:'','`':'`','"':'"','$':'$',a:'',b:'',e:'\u001b'}[e]!=null?{n:'\n',t:'\t',r:'',0:'','`':'`','"':'"','$':'$',a:'',b:'',e:''}[e]:e;i+=2;continue;}
    if(c==='"'&&s[i+1]==='"'){o+='"';i+=2;continue;}
    if(c==='$'&&s[i+1]==='('){const e=matchClose(s,i+1);const inner=s.slice(i+2,e);const v=runStatementsRaw(inner,scope);o+=v.map(toStr).join(' ');i=e+1;continue;}
    if(c==='$'){const m=/^\$\{([^}]+)\}/.exec(s.slice(i))||/^\$((?:env|global|script):[A-Za-z_][\w()]*|[A-Za-z_]\w*|_)/i.exec(s.slice(i));if(m){const v=getVar(m[1],scope);o+=Array.isArray(v)?v.map(toStr).join(' '):toStr(v);i+=m[0].length;continue;}}
    o+=c;i++;
  }
  return o;
}
function evalText(src,scope){return evalNode(parseX(lexX(src),src),scope);}
function unwrap(a){if(!Array.isArray(a))return a;return a.length===0?null:a.length===1?a[0]:a;}
function parseHt(raw,scope){
  const o=mk('System.Collections.Hashtable',{});
  for(const part of splitTopLevel(raw,[';','\n'])){const t=part.trim();if(!t)continue;const ei=findTopEq(t);if(ei<0)throw psErr('Signe égal manquant après la clé dans le littéral de hachage.','ParserError','MissingEqualsInHashLiteral');
    let k=t.slice(0,ei).trim();k=/^["']/.test(k)?evalText(k,scope):k;const v=unwrap(runStatementsRaw(t.slice(ei+1).trim(),scope));o[toStr(k)]=v;}
  return o;
}
function findTopEq(t){let q=null,d=0;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c===q)q=null;continue;}if(c==='"'||c==="'"){q=c;continue;}if('({['.includes(c))d++;if(')}]'.includes(c))d--;if(c==='='&&d===0&&t[i+1]!=='='&&!'!<>'.includes(t[i-1]))return i;}return -1;}
function evalNode(n,scope){
  switch(n.k){
    case'lit':return n.v;
    case'dq':return expandStr(n.v,scope);
    case'var':return getVar(n.n,scope);
    case'paren':return unwrap(runStatementsRaw(n.raw,scope));
    case'subx':return unwrap(runStatementsRaw(n.raw,scope));
    case'arr':return runStatementsRaw(n.raw,scope);
    case'ht':return parseHt(n.raw,scope);
    case'sb':return mk('System.Management.Automation.ScriptBlock',{},{__sb:n.raw,__scope:scope});
    case'word':{if(scope&&scope.filterObj){const v=getMember(scope.filterObj,n.v);return v;}if(/^\$?(true|false)$/i.test(n.v))return /true/i.test(n.v);return n.v;}
    case'type':return mk('System.RuntimeType',{Name:n.v.split('.').pop(),FullName:n.v},{__type:n.v,__s:n.v});
    case'list':return n.items.map(x=>evalNode(x,scope));
    case'range':{const a=Math.trunc(toNum(evalNode(n.l,scope))),b=Math.trunc(toNum(evalNode(n.r,scope)));const r=[];if(Math.abs(b-a)>10000)throw psErr('La plage est trop grande pour le simulateur.','InvalidOperation','RangeTooBig');for(let i=a;a<=b?i<=b:i>=b;a<=b?i++:i--)r.push(i);return r;}
    case'not':return !truthy(evalNode(n.e,scope));
    case'neg':{const v=evalNode(n.e,scope);return -toNum(v);}
    case'un':{const v=evalNode(n.e,scope);if(n.op==='-split')return toStr(v).trim().split(/\s+/);return Array.isArray(v)?v.map(toStr).join(''):toStr(v);}
    case'post':{const v=evalNode(n.e,scope);if(n.e.k==='var')setVar(n.e.n,toNum(v)+(n.op==='++'?1:-1),scope);return undefined;}
    case'cast':return castTo(n.type,evalNode(n.e,scope),scope);
    case'mem':{const o=evalNode(n.obj,scope);const nm=typeof n.name==='object'?toStr(getVar(n.name.dynv,scope)):n.name;const v=getMember(o,nm);return v===undefined?null:v;}
    case'call':{const o=evalNode(n.obj,scope);const args=splitTopLevel(n.args,[',']).filter(x=>x.trim()).map(a=>unwrap(runStatementsRaw(a,scope)));return callMethod(o,n.name,args);}
    case'idx':{const o=evalNode(n.obj,scope);const ix=evalNode(n.idx,scope);if(o==null)return null;
      if(isHt(o)||isObj(o)&&!Array.isArray(o)){if(Array.isArray(ix))return ix.map(k=>getMember(o,k));return getMember(o,toStr(ix));}
      const arr=typeof o==='string'?o.split(''):Array.isArray(o)?o:[o];
      const one=i=>{i=Math.trunc(toNum(i));if(i<0)i=arr.length+i;return arr[i]===undefined?null:arr[i];};
      return Array.isArray(ix)?ix.map(one):one(ix);}
    case'static':return callStatic(n.type,n.name,n.args!=null?splitTopLevel(n.args,[',']).filter(x=>x.trim()).map(a=>unwrap(runStatementsRaw(a,scope))):null);
    case'smem':{const o=evalNode(n.obj,scope);if(o&&o.__type)return callStatic(o.__type,n.name,n.args!=null?splitTopLevel(n.args,[',']).filter(x=>x.trim()).map(a=>unwrap(runStatementsRaw(a,scope))):null);return null;}
    case'bin':return binop(n.op,n.l,n.r,scope);
  }
  throw psErr('Expression non prise en charge par le simulateur.','NotImplemented','NotImplemented');
}
function wildRx(p,cs){return new RegExp('^'+String(p).replace(/[.+^${}()|\\]/g,'\\$&').replace(/\*/g,'[\\s\\S]*').replace(/\?/g,'.')+'$',cs?'':'i');}
function binop(op,ln,rn,scope){
  if(op==='-and')return truthy(evalNode(ln,scope))&&truthy(evalNode(rn,scope));
  if(op==='-or')return truthy(evalNode(ln,scope))||truthy(evalNode(rn,scope));
  const a=evalNode(ln,scope),b=evalNode(rn,scope);
  const o=op.replace(/^-i/,'-');
  if(o==='-xor')return truthy(a)!==truthy(b);
  if(o==='+'){if(Array.isArray(a))return a.concat(Array.isArray(b)?b:[b]);if(isHt(a)&&isHt(b))return mk('System.Collections.Hashtable',Object.assign({},a,b));if(typeof a==='string')return a+toStr(b);if(a instanceof Date){if(b&&b.__ts!=null)return new Date(a.getTime()+b.__ts);return new Date(a.getTime()+toNum(b)/10000);}if(a==null)return b;return toNum(a)+toNum(b);}
  if(o==='-'){if(a instanceof Date&&b instanceof Date)return timespan(a-b);if(a instanceof Date&&b&&b.__ts!=null)return new Date(a.getTime()-b.__ts);return toNum(a)-toNum(b);}
  if(o==='*'){if(typeof a==='string')return a.repeat(Math.max(0,Math.trunc(toNum(b))));if(Array.isArray(a)){let r=[];for(let i=0;i<toNum(b);i++)r=r.concat(a);return r;}return toNum(a)*toNum(b);}
  if(o==='/'){const d=toNum(b);if(d===0)throw psErr('Tentative de division par zéro.','NotSpecified','RuntimeException');return toNum(a)/d;}
  if(o==='%')return toNum(a)%toNum(b);
  if(o==='-f')return fmtF(toStr(a),b);
  if(o==='-join'){return(Array.isArray(a)?a:[a]).map(toStr).join(toStr(b));}
  if(o==='-split'||o==='-csplit'){let pat=b,max=0;if(Array.isArray(b)){pat=b[0];max=b[1]||0;}try{return toStr(a).split(new RegExp(toStr(pat),o==='-csplit'?'':'i'));}catch(e){throw psErr(`Le modèle d’expression régulière ${toStr(pat)} n’est pas valide.`,'InvalidOperation','InvalidRegularExpression');}}
  if(o==='-replace'||o==='-creplace'){const [pat,rep]=Array.isArray(b)?b:[b,''];let rx;try{rx=new RegExp(toStr(pat),o==='-creplace'?'g':'gi');}catch(e){throw psErr(`Le modèle d’expression régulière ${toStr(pat)} n’est pas valide.`,'InvalidOperation','InvalidRegularExpression');}const f=x=>toStr(x).replace(rx,toStr(rep));return Array.isArray(a)?a.map(f):f(a);}
  if(o==='-is'){const t=b&&b.__type?lc(b.__type):lc(toStr(b));const at=lc(typeOf(a)||'');return at===t||at.endsWith('.'+t)||(t==='int'&&at==='system.int32')||(t==='string'&&at==='system.string')||(t==='datetime'&&at==='system.datetime')||(t==='array'&&Array.isArray(a));}
  if(o==='-isnot')return !binop('-is',ln,rn,scope);
  if(o==='-as'){try{return castTo(b&&b.__type?b.__type:toStr(b),a,scope);}catch(e){return null;}}
  if(o==='-contains'||o==='-notcontains'){const arr=Array.isArray(a)?a:[a];const r=arr.some(x=>looseEq(x,b));return o==='-contains'?r:!r;}
  if(o==='-in'||o==='-notin'){const arr=Array.isArray(b)?b:[b];const r=arr.some(x=>looseEq(x,a));return o==='-in'?r:!r;}
  const cs=/^-c/.test(op);
  const test=x=>{
    switch(o.replace(/^-c/,'-')){
      case'-eq':return cs?toStr(x)===toStr(b):looseEq(x,b);case'-ne':return cs?toStr(x)!==toStr(b):!looseEq(x,b);
      case'-gt':return cmpVals(x,b)>0;case'-ge':return cmpVals(x,b)>=0;case'-lt':return cmpVals(x,b)<0;case'-le':return cmpVals(x,b)<=0;
      case'-like':return wildRx(toStr(b),cs).test(toStr(x));case'-notlike':return !wildRx(toStr(b),cs).test(toStr(x));
      case'-match':{let rx;try{rx=new RegExp(toStr(b),cs?'':'i');}catch(e){throw psErr(`Le modèle d’expression régulière ${toStr(b)} n’est pas valide.`,'InvalidOperation','InvalidRegularExpression');}const m=rx.exec(toStr(x));if(m&&!Array.isArray(a)){const ht=mk('System.Collections.Hashtable',{});m.forEach((g,i)=>ht[i]=g);if(m.groups)Object.assign(ht,m.groups);GLOBAL.vars.set('matches',ht);}return !!m;}
      case'-notmatch':{let rx;try{rx=new RegExp(toStr(b),cs?'':'i');}catch(e){return true;}return !rx.test(toStr(x));}
    }
    throw psErr(`Opérateur ${op} non pris en charge par le simulateur.`,'NotImplemented','NotImplemented');
  };
  if(Array.isArray(a))return a.filter(x=>test(x));
  return test(a);
}
function timespan(ms){const neg=ms<0;const a=Math.abs(ms);const d=Math.floor(a/864e5),h=Math.floor(a%864e5/36e5),m=Math.floor(a%36e5/6e4),s=Math.floor(a%6e4/1e3),msx=Math.floor(a%1e3);const sg=neg?-1:1;
  return mk('System.TimeSpan',{Days:d*sg,Hours:h*sg,Minutes:m*sg,Seconds:s*sg,Milliseconds:msx*sg,Ticks:ms*10000,TotalDays:ms/864e5,TotalHours:ms/36e5,TotalMinutes:ms/6e4,TotalSeconds:ms/1e3,TotalMilliseconds:ms},{__ts:ms,__s:`${neg?'-':''}${d?d+'.':''}${pad(h)}:${pad(m)}:${pad(s)}`});}
function castTo(type,v,scope){
  const t=lc(type).replace(/^system\./,'');
  if(t==='int'||t==='int32'||t==='int64'||t==='long'){if(Array.isArray(v))throw psErr('Impossible de convertir « System.Object[] » en type « System.Int32 ».','InvalidArgument','ConvertToFinalInvalidCastException');return bankRound(toNum(v),0);}
  if(t==='double'||t==='decimal'||t==='single'||t==='float')return toNum(v);
  if(t==='string')return Array.isArray(v)?v.map(toStr).join(' '):toStr(v);
  if(t==='bool'||t==='boolean')return truthy(v);
  if(t==='datetime')return toDate(v);
  if(t==='array'||t==='object[]'||t==='string[]'||t==='int[]')return Array.isArray(v)?(t==='int[]'?v.map(x=>bankRound(toNum(x),0)):t==='string[]'?v.map(toStr):v):v==null?[]:[t==='int[]'?bankRound(toNum(v),0):t==='string[]'?toStr(v):v];
  if(t==='pscustomobject'||t==='management.automation.pscustomobject'){if(isHt(v)){return mk('System.Management.Automation.PSCustomObject',Object.assign({},v));}return v;}
  if(t==='ordered'){return v;}
  if(t==='void')return undefined;
  if(t==='char')return typeof v==='number'?String.fromCharCode(v):toStr(v)[0];
  if(t==='timespan')return v&&v.__ts!=null?v:timespan(toNum(v)/10000);
  if(t==='regex')return toStr(v);
  if(t==='securestring'||t==='security.securestring')return mk('System.Security.SecureString',{Length:toStr(v).length},{__s:'System.Security.SecureString'});
  if(t==='hashtable'||t==='collections.hashtable')return v;
  if(t==='guid')return toStr(v);
  if(t==='ipaddress'||t==='net.ipaddress'){if(!isIp(toStr(v)))throw psErr(`Impossible de convertir la valeur « ${toStr(v)} » en type « System.Net.IPAddress ».`,'InvalidArgument','InvalidCastParseTargetInvocation');return mk('System.Net.IPAddress',{Address:toStr(v),AddressFamily:'InterNetwork',IPAddressToString:toStr(v)},{__s:toStr(v)});}
  if(t==='xml'||t==='xml.xmldocument')return toStr(v);
  return v;
}
function callStatic(type,name,args){
  const t=lc(type).replace(/^system\./,''),n=lc(name);args=args||[];
  if(t==='math'){const a=args.map(toNum);switch(n){case'round':return bankRound(a[0],a[1]||0);case'floor':return Math.floor(a[0]);case'ceiling':return Math.ceil(a[0]);case'abs':return Math.abs(a[0]);case'max':return Math.max(a[0],a[1]);case'min':return Math.min(a[0],a[1]);case'pow':return Math.pow(a[0],a[1]);case'sqrt':return Math.sqrt(a[0]);case'truncate':return Math.trunc(a[0]);case'pi':return Math.PI;}}
  if(t==='datetime'){if(n==='now')return new Date();if(n==='today'){const d=new Date();d.setHours(0,0,0,0);return d;}if(n==='parse'||n==='parseexact')return toDate(args[0]);if(n==='daysinmonth')return new Date(toNum(args[0]),toNum(args[1]),0).getDate();}
  if(t==='environment'){switch(n){case'machinename':return curHostName();case'username':return 'it.tech';case'userdomainname':return 'CONTOSO';case'osversion':return mk('System.OperatingSystem',{Platform:'Win32NT',ServicePack:'',Version:'10.0.26100.0',VersionString:'Microsoft Windows NT 10.0.26100.0'});case'newline':return '\n';case'processorcount':return 20;case'is64bitoperatingsystem':return true;case'currentdirectory':return psLocStr();case'getenvironmentvariable':return envGet(toStr(args[0]))||null;case'setenvironmentvariable':envSet(toStr(args[0]),toStr(args[1]));return undefined;case'getfolderpath':return {desktop:'C:\\Users\\it.tech\\Desktop',mydocuments:'C:\\Users\\it.tech\\Documents'}[lc(toStr(args[0]))]||'C:\\Users\\it.tech';}}
  if(t==='net.dns'&&n==='gethostname')return curHostName();
  if(t==='net.dns'&&(n==='gethostaddresses'||n==='gethostentry')){const h=findHost(toStr(args[0]));if(!h)throw psErr('Exception lors de l’appel de « GetHostAddresses » avec « 1 » argument(s) : « Hôte inconnu »','NotSpecified','SocketException');return mk('System.Net.IPAddress',{IPAddressToString:h.ip,AddressFamily:'InterNetwork'},{__s:h.ip});}
  if(t==='guid'&&n==='newguid'){const g=guid(String(Math.random()));return mk('System.Guid',{Guid:g},{__s:g});}
  if(t==='string'){if(n==='isnullorempty')return args[0]==null||toStr(args[0])==='';if(n==='isnullorwhitespace')return args[0]==null||toStr(args[0]).trim()==='';if(n==='join')return(Array.isArray(args[1])?args[1]:args.slice(1)).map(toStr).join(toStr(args[0]));if(n==='empty')return '';if(n==='format')return fmtF(toStr(args[0]),args.slice(1));}
  if(t==='int'||t==='int32'){if(n==='maxvalue')return 2147483647;if(n==='minvalue')return -2147483648;if(n==='parse')return Math.trunc(toNum(args[0]));}
  if(t==='io.path'){const p=toStr(args[0]);switch(n){case'getextension':return(p.match(/\.[^.\\]*$/)||[''])[0];case'getfilename':return p.split('\\').pop();case'getfilenamewithoutextension':return p.split('\\').pop().replace(/\.[^.]*$/,'');case'getdirectoryname':return p.split('\\').slice(0,-1).join('\\');case'combine':return args.map(toStr).join('\\').replace(/\\\\+/g,'\\');case'gettempfilename':return 'C:\\Users\\it.tech\\AppData\\Local\\Temp\\tmp'+fakeHash(String(Math.random()),4)+'.tmp';case'gettemppath':return 'C:\\Users\\it.tech\\AppData\\Local\\Temp\\';}}
  if(t==='io.file'){if(n==='exists')return exists(toStr(args[0]));if(n==='readalltext')return readFile(toStr(args[0]));}
  if(t==='convert'){if(n==='tobase64string')return btoaSafe(toStr(args[0]));if(n==='toint32')return Math.trunc(toNum(args[0]));if(n==='tostring')return toStr(args[0]);}
  if(t==='text.encoding'&&n==='utf8')return mk('System.Text.UTF8Encoding',{});
  if(t==='security.principal.windowsidentity'&&n==='getcurrent')return mk('System.Security.Principal.WindowsIdentity',{Name:'CONTOSO\\it.tech',AuthenticationType:'Kerberos',IsAuthenticated:true,IsSystem:false,User:DOM.sid+'-1115'});
  if(t==='web.security.membership'&&n==='generatepassword'){const len=toNum(args[0])||12;const ch='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';let s='';for(let i=0;i<len;i++)s+=ch[Math.random()*ch.length|0];return s;}
  if(t==='net.servicepointmanager'){return undefined;}
  throw psErr(`Impossible de trouver le type [${type}] ou le membre « ${name} » dans le simulateur.`,'InvalidOperation','TypeNotFound');
}
function btoaSafe(s){try{return btoa(unescape(encodeURIComponent(s)));}catch(e){return '';}}
function callMethod(o,name,args){
  const n=lc(name);
  if(o==null)throw psErr('Impossible d’appeler une méthode dans une expression Null.','InvalidOperation','InvokeMethodOnNull');
  if(n==='gettype'){const tn=typeOf(o);return mk('System.RuntimeType',{IsPublic:true,IsSerial:true,Name:tn.split('.').pop().replace(/^.*#/,''),BaseType:Array.isArray(o)?'System.Array':typeof o==='string'?'System.Object':'System.Object'},{__s:tn,__get:{fullname:tn}});}
  if(n==='tostring'){if(typeof o==='number'&&args[0]!=null)return fmtNumSpec(o,toStr(args[0]));if(o instanceof Date&&args[0]!=null)return fmtDate(o,toStr(args[0]));if(o instanceof Date)return fdt(o);return toStr(o);}
  if(n==='equals')return looseEq(o,args[0]);
  if(typeof o==='string'){const a=args.map(toStr);switch(n){
    case'toupper':return o.toUpperCase();case'tolower':return o.toLowerCase();case'trim':return a[0]?o.replace(new RegExp('^['+a[0].replace(/[\]\\^-]/g,'\\$&')+']+|['+a[0].replace(/[\]\\^-]/g,'\\$&')+']+$','g'),''):o.trim();case'trimend':return a[0]?o.replace(new RegExp('['+a[0].replace(/[\]\\^-]/g,'\\$&')+']+$'),''):o.trimEnd();case'trimstart':return a[0]?o.replace(new RegExp('^['+a[0].replace(/[\]\\^-]/g,'\\$&')+']+'),''):o.trimStart();
    case'replace':return o.split(a[0]).join(a[1]==null?'':a[1]);case'split':return a.length?o.split(new RegExp('['+a.join('').replace(/[\]\\^-]/g,'\\$&')+']')):o.split(/\s/);
    case'contains':return o.includes(a[0]);case'startswith':return lc(o).startsWith(lc(a[0]))&&o.startsWith(a[0])||o.startsWith(a[0]);case'endswith':return o.endsWith(a[0]);
    case'substring':{const s=toNum(args[0]);if(s>o.length)throw psErr('Exception lors de l’appel de « Substring » avec « 1 » argument(s) : « startIndex ne peut pas être supérieur à la longueur de la chaîne. »','NotSpecified','ArgumentOutOfRangeException');return args.length>1?o.substr(s,toNum(args[1])):o.slice(s);}
    case'indexof':return o.indexOf(a[0]);case'lastindexof':return o.lastIndexOf(a[0]);case'padleft':return o.padStart(toNum(args[0]),a[1]||' ');case'padright':return o.padEnd(toNum(args[0]),a[1]||' ');
    case'insert':return o.slice(0,toNum(args[0]))+a[1]+o.slice(toNum(args[0]));case'remove':return o.slice(0,toNum(args[0]))+(args.length>1?o.slice(toNum(args[0])+toNum(args[1])):'');case'tochararray':return o.split('');case'normalize':return o.normalize('NFC');}}
  if(o instanceof Date){const a=args.map(x=>toNum(x));const d=new Date(o);switch(n){
    case'adddays':d.setTime(d.getTime()+a[0]*864e5);return d;case'addhours':d.setTime(d.getTime()+a[0]*36e5);return d;case'addminutes':d.setTime(d.getTime()+a[0]*6e4);return d;case'addseconds':d.setTime(d.getTime()+a[0]*1e3);return d;
    case'addmonths':d.setMonth(d.getMonth()+a[0]);return d;case'addyears':d.setFullYear(d.getFullYear()+a[0]);return d;case'toshortdatestring':return fdate(o);case'tolongdatestring':return fmtDate(o,'D');case'toshorttimestring':return ftime(o);case'tostring':return fdt(o);case'subtract':return args[0] instanceof Date?timespan(o-args[0]):new Date(o.getTime()-(args[0]&&args[0].__ts||0));case'touniversaltime':return new Date(o.getTime()-o.getTimezoneOffset()*-60000);case'tofiletime':return o.getTime()*10000+116444736000000000;}}
  if(Array.isArray(o)&&o.__al){if(n==='add'){o.push(args[0]);return o.length-1;}if(n==='remove'){const i=o.findIndex(x=>looseEq(x,args[0]));if(i>=0)o.splice(i,1);return undefined;}if(n==='addrange'){o.push(...arr(args[0]));return undefined;}if(n==='clear'){o.length=0;return undefined;}}
  if(Array.isArray(o)){switch(n){case'contains':return o.some(x=>toStr(x)===toStr(args[0]));case'indexof':return o.findIndex(x=>looseEq(x,args[0]));case'add':throw psErr('Exception lors de l’appel de « Add » avec « 1 » argument(s) : « La collection était d’une taille fixe. »','NotSpecified','NotSupportedException');case'foreach':return o.map(x=>unwrap(callSb(args[0],x)));case'where':return o.filter(x=>truthy(unwrap(callSb(args[0],x))));case'clone':return o.slice();}}
  if(isHt(o)){switch(n){case'add':if(Object.keys(o).some(k=>lc(k)===lc(toStr(args[0]))))throw psErr(`Exception lors de l’appel de « Add » avec « 2 » argument(s) : « L’élément a déjà été ajouté. Clé dans le dictionnaire : '${toStr(args[0])}' »`,'NotSpecified','ArgumentException');o[toStr(args[0])]=args[1];return undefined;case'remove':delete o[Object.keys(o).find(k=>lc(k)===lc(toStr(args[0])))];return undefined;case'containskey':return Object.keys(o).some(k=>lc(k)===lc(toStr(args[0])));case'containsvalue':return Object.values(o).some(v=>looseEq(v,args[0]));case'clear':Object.keys(o).forEach(k=>delete o[k]);return undefined;}}
  if(o.__methods&&o.__methods[n])return o.__methods[n](...args);
  if(typeof o==='number'){if(n==='compareto')return cmpVals(o,args[0]);}
  throw psErr(`L’appel de la méthode a échoué parce que [${typeOf(o)}] ne contient pas de méthode nommée « ${name} ».`,'InvalidOperation','MethodNotFound');
}
function callSb(sb,item,extra){
  if(!sb||sb.__sb==null){if(sb==null)return[];return[getMember(item,toStr(sb))];}
  const s=newScope(sb.__scope||GLOBAL);s.vars.set('_',item);if(extra)for(const k of Object.keys(extra))s.vars.set(lc(k),extra[k]);
  try{return runStatementsRaw(sb.__sb,s);}catch(e){if(e instanceof PSFlow&&e.kind==='return')return flowOut(e).concat(e.val||[]);throw e;}
}

/* =========================================================
   PowerShell : instructions et pipeline
   ========================================================= */
function splitTopLevel(s,seps){
  const out=[];let cur='',d=0,q=null;
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(q){cur+=c;if(c==='`'&&q==='"'&&i+1<s.length){cur+=s[++i];continue;}if(c===q){if(s[i+1]===q){cur+=s[++i];continue;}q=null;}continue;}
    if(c==='"'||c==="'"){q=c;cur+=c;continue;}
    if(c==='`'&&i+1<s.length){cur+=c+s[++i];continue;}
    if(c==='#'&&(i===0||/\s/.test(s[i-1]))&&d===0){while(i<s.length&&s[i]!=='\n')i++;i--;continue;}
    if('({['.includes(c))d++;else if(')}]'.includes(c))d=Math.max(0,d-1);
    if(d===0&&seps.includes(c)){if(c==='|'&&s[i+1]==='|'){cur+='||';i++;continue;}out.push(cur);cur='';continue;}
    cur+=c;
  }
  out.push(cur);return out;
}
function preprocess(src){
  src=String(src).replace(/\r/g,'').replace(/<#[\s\S]*?#>/g,'');
  src=src.replace(/`\n/g,' ');
  src=src.replace(/\|\s*\n\s*/g,'| ');
  src=src.replace(/\n\s*\|/g,' |');
  return src;
}
function splitStatements(src){
  const parts=splitTopLevel(preprocess(src),[';','\n']).map(x=>x.trim()).filter(Boolean);
  const out=[];
  for(const p of parts){if(out.length&&/^(else|elseif|catch|finally)\b/i.test(p))out[out.length-1]+=' '+p;else if(out.length&&/^\{/.test(p)&&/(\)|\b(else|try|finally|do|catch(\s*\[[^\]]*\])?))\s*$/i.test(out[out.length-1]))out[out.length-1]+=' '+p;else if(out.length&&/^(while|until)\s*\(/i.test(p)&&/^do\b/i.test(out[out.length-1]))out[out.length-1]+=' '+p;else out.push(p);}
  return out;
}
function runStatementsRaw(src,scope){let all=[];for(const s of splitStatements(src)){let r;try{r=runStatement(s,scope);}catch(e){if(e instanceof PSFlow)e.partial=all.concat(e.partial||[]);throw e;}if(r&&r.length)all=all.concat(r);}return all;}
const flowOut=e=>e.partial||[];
function readParen(s,i){while(s[i]===' ')i++;if(s[i]!=='(')throw psErr('Parenthèse ouvrante manquante.','ParserError','MissingOpenParenthesis');const e=matchClose(s,i);return{inner:s.slice(i+1,e),end:e+1};}
function readBrace(s,i){while(/\s/.test(s[i]||''))i++;if(s[i]!=='{')throw psErr('Accolade ouvrante « { » manquante dans le bloc d’instructions.','ParserError','MissingOpenBraceInStatementBlock');const e=matchClose(s,i);return{inner:s.slice(i+1,e),end:e+1};}
function runStatement(stmt,scope){
  stmt=stmt.trim();if(!stmt)return[];
  let m;
  if((m=/^if\s*\(/i.exec(stmt))){
    let i=2;let done=false;let out=[];
    for(;;){const c=readParen(stmt,i);const b=readBrace(stmt,c.end);i=b.end;
      if(!done&&truthy(unwrap(runStatementsRaw(c.inner,scope)))){out=runStatementsRaw(b.inner,scope);done=true;}
      const rest=stmt.slice(i).trim();
      if(/^elseif\b/i.test(rest)){i=stmt.length-rest.length+6;continue;}
      if(/^else\b/i.test(rest)){const e=readBrace(stmt,stmt.length-rest.length+4);if(!done)out=runStatementsRaw(e.inner,scope);i=e.end;}
      break;}
    return out;
  }
  if((m=/^foreach\s*\(\s*\$(\w+)\s+in\s+/i.exec(stmt))){
    const c=readParen(stmt,stmt.indexOf('('));const mm=/^\s*\$(\w+)\s+in\s+([\s\S]+)$/i.exec(c.inner);const b=readBrace(stmt,c.end);
    let coll=unwrap(runStatementsRaw(mm[2],scope));if(coll==null)return[];if(!Array.isArray(coll))coll=[coll];
    let out=[];let n=0;for(const it of coll){if(++n>2000)break;scope.vars.set(lc(mm[1]),it);try{out=out.concat(runStatementsRaw(b.inner,scope));}catch(e){if(e instanceof PSFlow&&(e.kind==='break'||e.kind==='continue')){out=out.concat(flowOut(e));if(e.kind==='break')break;continue;}throw e;}}
    return out;
  }
  if((m=/^for\s*\(/i.exec(stmt))){const c=readParen(stmt,3);const [ini,cond,step]=splitTopLevel(c.inner,[';']);const b=readBrace(stmt,c.end);let out=[];if(ini&&ini.trim())runStatement(ini,scope);let n=0;
    while(n++<2000&&(!cond||!cond.trim()||truthy(unwrap(runStatementsRaw(cond,scope))))){try{out=out.concat(runStatementsRaw(b.inner,scope));}catch(e){if(e instanceof PSFlow&&(e.kind==='break'||e.kind==='continue')){out=out.concat(flowOut(e));if(e.kind==='break')break;}else throw e;}if(step&&step.trim())runStatementsRaw(step,scope);}return out;}
  if((m=/^while\s*\(/i.exec(stmt))){const c=readParen(stmt,5);const b=readBrace(stmt,c.end);let out=[];let n=0;while(n++<2000&&truthy(unwrap(runStatementsRaw(c.inner,scope)))){try{out=out.concat(runStatementsRaw(b.inner,scope));}catch(e){if(e instanceof PSFlow&&(e.kind==='break'||e.kind==='continue')){out=out.concat(flowOut(e));if(e.kind==='break')break;}else throw e;}}if(n>=2000)host(L('(Boucle interrompue par le simulateur après 2000 tours.)','t-warn'));return out;}
  if((m=/^do\s*\{/i.exec(stmt))){const b=readBrace(stmt,2);const rest=stmt.slice(b.end).trim();const w=/^(while|until)/i.exec(rest);if(!w)throw psErr('Mot clé while ou until manquant dans la boucle do.','ParserError','MissingWhileOrUntilInDoWhile');const c=readParen(rest,w[0].length);let out=[];let n=0;
    do{try{out=out.concat(runStatementsRaw(b.inner,scope));}catch(e){if(e instanceof PSFlow&&(e.kind==='break'||e.kind==='continue')){out=out.concat(flowOut(e));if(e.kind==='break')break;}else throw e;}const t=truthy(unwrap(runStatementsRaw(c.inner,scope)));if(lc(w[1])==='while'?!t:t)break;}while(n++<2000);return out;}
  if((m=/^switch\b/i.exec(stmt))){
    let i=6;const flags=[];let mm;while((mm=/^\s*-(\w+)/.exec(stmt.slice(i)))){flags.push(lc(mm[1]));i+=mm[0].length;}
    const c=readParen(stmt,i);const b=readBrace(stmt,c.end);let val=unwrap(runStatementsRaw(c.inner,scope));const vals=Array.isArray(val)?val:[val];
    const body=b.inner;const cases=[];let j=0;
    while(j<body.length){while(/[\s;]/.test(body[j]||''))j++;if(j>=body.length)break;let k=j;let cond;
      if(body[k]==='{'){const e=matchClose(body,k);cond={sb:body.slice(k+1,e)};k=e+1;}
      else if(body[k]==='"'||body[k]==="'"){const e=body[k]==='"'?scanDq(body,k):scanSq(body,k);cond={v:evalText(body.slice(k,e),scope)};k=e;}
      else{const mw=/^[^\s{]+/.exec(body.slice(k));cond=lc(mw[0])==='default'?{def:true}:{v:mw[0]};k+=mw[0].length;}
      const blk=readBrace(body,k);cases.push({cond,blk:blk.inner});j=blk.end;}
    let out=[];
    for(const v of vals){let hit=false;for(const cs of cases){if(cs.cond.def)continue;let ok=false;if(cs.cond.sb)ok=truthy(unwrap(callSb(mk('sb',{},{__sb:cs.cond.sb,__scope:scope}),v)));else if(flags.includes('wildcard'))ok=wildRx(toStr(cs.cond.v)).test(toStr(v));else if(flags.includes('regex'))ok=new RegExp(toStr(cs.cond.v),'i').test(toStr(v));else ok=looseEq(v,cs.cond.v);
        if(ok){hit=true;const s2=newScope(scope);s2.vars.set('_',v);try{out=out.concat(runStatementsRaw(cs.blk,s2));}catch(e){if(e instanceof PSFlow&&e.kind==='break'){return out.concat(flowOut(e));}throw e;}}}
      if(!hit){const d=cases.find(c=>c.cond.def);if(d){const s2=newScope(scope);s2.vars.set('_',v);out=out.concat(runStatementsRaw(d.blk,s2));}}}
    return out;
  }
  if((m=/^function\s+([\w-]+)\s*/i.exec(stmt))){
    let i=m[0].length;let params=[];
    if(stmt[i]==='('){const c=readParen(stmt,i);params=parseParams(c.inner);i=c.end;}
    const b=readBrace(stmt,i);let body=b.inner.trim();let cb=false;
    const pm=/^(\[CmdletBinding\([^)]*\)\]\s*)?param\s*\(/i.exec(body);if(pm){cb=!!pm[1];const c=readParen(body,pm[0].length-1);params=parseParams(c.inner);body=body.slice(c.end);}
    st.funcs[lc(m[1])]={name:m[1],params,body,cb};return[];
  }
  if((m=/^try\s*\{/i.exec(stmt))){
    const t=readBrace(stmt,3);let rest=stmt.slice(t.end).trim();let catches=[],fin=null;
    while(rest){const c=/^catch\s*(\[[^\]]+\]\s*)?/i.exec(rest);if(c){const b=readBrace(rest,c[0].length);catches.push(b.inner);rest=rest.slice(b.end).trim();continue;}const f=/^finally\s*/i.exec(rest);if(f){const b=readBrace(rest,f[0].length);fin=b.inner;rest=rest.slice(b.end).trim();continue;}break;}
    let out=[];
    try{const s2=newScope(scope);s2.inTry=true;out=runStatementsRaw(t.inner,s2);}
    catch(e){if(e instanceof PSFlow)throw e;if(!catches.length)throw e;const pe=e instanceof PSErr?e:psErr(e.message);const rec=errRecord(pe);st.errors.push(rec);const s2=newScope(scope);s2.vars.set('_',rec);out=runStatementsRaw(catches[0],s2);}
    finally{if(fin!=null)out=out.concat(runStatementsRaw(fin,scope));}
    return out;
  }
  if((m=/^(return|break|continue|exit)\b\s*(.*)$/i.exec(stmt))){const k=lc(m[1]);const v=m[2]?runStatementsRaw(m[2],scope):[];if(k==='exit')throw new PSFlow('exit',v);throw new PSFlow(k,v);}
  if((m=/^throw\b\s*(.*)$/i.exec(stmt))){const v=m[1]?unwrap(runStatementsRaw(m[1],scope)):'ScriptHalted';const e=psErr(toStr(v),'OperationStopped','');e.fqid=toStr(v);e.thrown=true;throw e;}
  if((m=/^param\s*\(/i.exec(stmt))){return[];}
  if(/^\[CmdletBinding/i.test(stmt))return[];
  /* affectation */
  const ai=findAssign(stmt);
  if(ai){
    const {target,op,rhs}=ai;
    let val=unwrap(runStatementsRaw(rhs,scope));
    if(/^\$null$/i.test(target)||/^\[void\]/i.test(target))return[];
    const tm=/^(\[[^\]]+\]\s*)?\$(\{[^}]+\}|(?:env|global|script|local):[\w()]+|\w+)$/i.exec(target);
    if(tm){const name=tm[2].replace(/^\{|\}$/g,'');if(tm[1]){val=castTo(tm[1].replace(/[\[\]\s]/g,''),val,scope);}
      if(op!=='='){const cur=getVar(name,scope);const opn=op[0];val=opn==='+'?(Array.isArray(cur)?cur.concat(Array.isArray(val)?val:[val]):typeof cur==='string'?cur+toStr(val):isHt(cur)&&isHt(val)?mk('System.Collections.Hashtable',Object.assign({},cur,val)):toNum(cur)+toNum(val)):opn==='-'?toNum(cur)-toNum(val):opn==='*'?toNum(cur)*toNum(val):toNum(cur)/toNum(val);}
      setVar(name,val,scope);return[];}
    const pm2=/^(.*)\.(\w+)$/.exec(target);
    if(pm2){const o=evalText(pm2[1],scope);setMember(o,pm2[2],val);return[];}
    const im=/^(.*)\[(.+)\]$/.exec(target);
    if(im){const o=evalText(im[1],scope);const k=evalText(im[2],scope);if(Array.isArray(o)){let i=Math.trunc(toNum(k));if(i<0)i+=o.length;if(i>=o.length)throw psErr('L’index était hors limites du tableau.','OperationStopped','IndexOutOfRangeException');o[i]=val;}else if(isObj(o))o[toStr(k)]=val;return[];}
    throw psErr('L’expression de gauche d’une affectation doit être une variable ou une propriété.','ParserError','InvalidLeftHandSide');
  }
  return psPipeline(stmt,scope);
}
function findAssign(s){
  let q=null,d=0;
  for(let i=0;i<s.length;i++){const c=s[i];
    if(q){if(c==='`'&&q==='"'){i++;continue;}if(c===q)q=null;continue;}
    if(c==='"'||c==="'"){q=c;continue;}
    if('({['.includes(c))d++;else if(')}]'.includes(c))d--;
    if(d===0&&c==='|')return null;
    if(d===0&&c==='='&&s[i+1]!=='='){const prev=s[i-1];let op='=',st_=i;if('+-*/'.includes(prev)){op=prev+'=';st_=i-1;}else if('!<>'.includes(prev))continue;
      const target=s.slice(0,st_).trim();if(!/^(\[[^\]]+\]\s*)?\$/.test(target))return null;if(/\s-\w+\s*$/.test(target))return null;
      return{target,op,rhs:s.slice(i+1).trim()};}
    if(d===0&&/\s/.test(c)&&s[0]!=='$'&&s[0]!=='[')return null;
  }
  return null;
}
function parseParams(src){
  return splitTopLevel(src,[',']).map(p=>{p=p.trim();if(!p)return null;const mand=/Mandatory/i.test(p);const vs=/ValidateSet\(([^)]*)\)/i.exec(p);const pipe=/ValueFromPipeline/i.test(p);
    const t=/\[(string|int|switch|datetime|string\[\]|int\[\]|bool|pscredential|object|array)\]/i.exec(p.replace(/\[Parameter\([^)]*\)\]|\[Validate\w+\([^)]*\)\]|\[Alias\([^)]*\)\]/gi,''));
    const m=/\$(\w+)\s*(?:=\s*([\s\S]+))?$/.exec(p);if(!m)return null;return{name:m[1],def:m[2]||null,mand,type:t?lc(t[1]):null,set:vs?vs[1].split(',').map(x=>x.trim().replace(/^['"]|['"]$/g,'')):null,pipe};}).filter(Boolean);
}
function errRecord(e){const r=mk('System.Management.Automation.ErrorRecord',{Exception:mk('System.Management.Automation.RuntimeException',{Message:e.message},{__s:e.message}),CategoryInfo:e.cat,FullyQualifiedErrorId:e.fqid,TargetObject:e.target||null},{__s:e.message});return r;}

/* ---------- pipeline ---------- */
let HOSTBUF=null;
function host(l){if(HOSTBUF)HOSTBUF.push(l);}
function isExprStart(t){t=t.trim();return /^[$("'@\[0-9{]/.test(t)||/^[-+](?=[\d$(."'\[])/.test(t)||/^-not\b/i.test(t)||/^-(split|join)\b/i.test(t)||/^!/.test(t)||/^\.\d/.test(t);}
function psPipeline(stmt,scope){
  const els=splitTopLevel(stmt,['|']).map(x=>x.trim());
  if(els.some(e=>!e))throw psErr('Un élément de canal vide n’est pas autorisé.','ParserError','EmptyPipeElement');
  if(els.some(e=>e==='||'||/^\|/.test(e)))throw psErr('Le jeton « || » n’est pas un séparateur d’instruction valide dans cette version.','ParserError','InvalidEndOfLine');
  let data=null;
  for(let i=0;i<els.length;i++){
    const el=els[i];
    if(i===0&&isExprStart(el)&&!/^\.\\|^&/.test(el)){
      const v=evalText(el,scope);
      data=v===undefined?[]:Array.isArray(v)?v:[v];
      continue;
    }
    data=invoke(el,data,scope,i===0);
  }
  return data||[];
}
function splitArgs(s){
  const out=[];let cur='',d=0,q=null,has=false;
  for(let i=0;i<s.length;i++){const c=s[i];
    if(q){cur+=c;if(c==='`'&&q==='"'){cur+=s[++i]||'';continue;}if(c===q){if(s[i+1]===q){cur+=s[++i];continue;}q=null;}continue;}
    if(c==='"'||c==="'"){q=c;cur+=c;has=true;continue;}
    if(c==='`'&&i+1<s.length){cur+=c+s[++i];has=true;continue;}
    if('({['.includes(c)){d++;}else if(')}]'.includes(c))d=Math.max(0,d-1);
    if(/\s/.test(c)&&d===0){if(has){out.push(cur);cur='';has=false;}continue;}
    cur+=c;has=true;}
  if(has)out.push(cur);
  const merged=[];for(const t of out){if(merged.length&&(/,$/.test(merged[merged.length-1])||/^,/.test(t)))merged[merged.length-1]+=t;else merged.push(t);}
  return merged;
}
function evalArg(tok,scope){
  if(/^\{/.test(tok)&&matchClose(tok,0)===tok.length-1)return mk('System.Management.Automation.ScriptBlock',{},{__sb:tok.slice(1,-1),__scope:scope});
  const parts=splitTopLevel(tok,[',']);
  if(parts.length>1&&parts.every(p=>p.length))return parts.map(p=>evalArg(p,scope));
  if(/^[$("'@\[]/.test(tok)||/^-?\d+(\.\d+)?(kb|mb|gb|tb)?$/i.test(tok)||/^\$/.test(tok)){const v=evalText(tok,scope);return v;}
  if(/\$/.test(tok))return expandStr(tok,scope);
  return tok.replace(/`(.)/g,'$1');
}
function invoke(el,input,scope,first){
  const toks=splitArgs(el);
  let name=toks.shift();let callOp=false;
  if(name==='&'||name==='.'){callOp=name==='&';name=toStr(evalArg(toks.shift()||'',scope));}
  else if(/^["']/.test(name)){name=toStr(evalArg(name,scope));}
  const ln=lc(name);
  if(st.funcs[ln])return callFunction(st.funcs[ln],toks,input,scope);
  const ci=CMDLETS[ln]||CMDLETS[ALIASES[ln]];
  if(ci)return callCmdlet(ci,toks,input,scope,name);
  if(/\.ps1$/i.test(name))return runScriptFile(name,toks,scope);
  if(/\.(bat|cmd)$/i.test(name)){const r_=runCmdLine([name,...toks].join(' '));r_.lines.forEach(x=>host(x));return[];}
  const nk=ln.replace(/\.(exe|com)$/,'');
  if(CMD[nk]&&!['dir','cd','md','rd','del','copy','move','ren','type','echo','set','cls','if','for','erase','rename','mkdir','rmdir','chdir','call','goto','pushd','popd','start','title','color','prompt','rem','pause','shift','setlocal','endlocal','exit','ver','date','time','help','mklink','choice'].includes(nk)||nk==='cmd'||/\.exe$/i.test(name)&&CMD[nk]){
    const argStr=toks.map(t=>/^\$|^\(/.test(t)?toStr(evalArg(t,scope)):t.replace(/^'(.*)'$/,'"$1"')).join(' ');
    if(nk==='sc'&&!/\.exe$/i.test(name)){}
    const ctx={out:[],err:[],stdin:input?input.map(toStr):null,res:{lines:[]},pipedOut:true};
    let code;try{code=runOne(nk+' '+argStr,ctx);}catch(e){if(e instanceof SimErr){ctx.err.push(e.message);code=1;}else throw e;}
    st.lastExit=code;st.ok=code===0;st.errorlevel=code;
    ctx.err.forEach(e=>host(typeof e==='string'?L(e,'t-err'):e));
    if(ctx.res.pushCmd){st.stack.push('ps');st.shell='cmd';}
    return ctx.out.map(x=>x.s);
  }
  if(KNOWN_GUI[nk]){host(L(KNOWN_GUI[nk],'t-warn'));return[];}
  if(ln==='sc'||ln==='where'){}
  const e=psErr(`Le terme «${name}» n'est pas reconnu comme nom d'applet de commande, fonction, fichier de script ou programme exécutable. Vérifiez l'orthographe du nom, ou si un chemin d'accès existe, vérifiez que le chemin d'accès est correct et réessayez.`,'ObjectNotFound','CommandNotFoundException');e.target=name+':String';e.cmd=name;
  if(nk==='wmic')e.hint='(WMIC est désactivé par défaut depuis Windows 11 24H2 : utilise Get-CimInstance.)';
  if(nk==='pwsh')e.hint='(PowerShell 7 n’est pas installé sur ce poste : tu es dans Windows PowerShell 5.1.)';
  throw e;
}
function callFunction(f,toks,input,scope){
  const s=newScope(GLOBAL);const named={},pos=[];
  for(let i=0;i<toks.length;i++){const t=toks[i];const pm=/^-(\w+)(?::(.*))?$/.exec(t);if(pm&&!/^-\d/.test(t)){const p=f.params.find(x=>lc(x.name)===lc(pm[1]))||f.params.find(x=>lc(x.name).startsWith(lc(pm[1])));if(!p){const e=psErr(`Impossible de trouver un paramètre correspondant au nom « ${pm[1]} ».`,'InvalidArgument','NamedParameterNotFound');e.cmd=f.name;throw e;}
      if(p.type==='switch'){named[p.name]=pm[2]!=null?truthy(evalArg(pm[2],scope)):true;}else{named[p.name]=evalArg(pm[2]!=null?pm[2]:toks[++i],scope);}}else pos.push(evalArg(t,scope));}
  const free=f.params.filter(p=>!(p.name in named)&&p.type!=='switch');
  free.forEach((p,i)=>{if(i<pos.length)named[p.name]=pos[i];});
  const extra=pos.slice(free.length);
  if(input&&input.length){const pp=f.params.find(p=>p.pipe);if(pp&&!(pp.name in named)){let out=[];for(const it of input){const s2=newScope(GLOBAL);f.params.forEach(p=>s2.vars.set(lc(p.name),p.name===pp.name?it:(p.name in named?named[p.name]:(p.def?unwrap(runStatementsRaw(p.def,s2)):(p.type==='switch'?false:null)))));s2.vars.set('_',it);out=out.concat(runFnBody(f,s2));}return out;}}
  for(const p of f.params){let v;if(p.name in named)v=named[p.name];else if(p.def)v=unwrap(runStatementsRaw(p.def,s));else if(p.mand){const e=psErr(`Impossible de lier l’argument au paramètre « ${p.name} », car il s’agit d’un paramètre obligatoire et aucune valeur n’a été fournie. (Le simulateur ne peut pas demander de saisie.)`,'InvalidData','ParameterArgumentValidationErrorNullNotAllowed');e.cmd=f.name;throw e;}else v=p.type==='switch'?false:null;
    if(p.set&&v!=null&&!p.set.some(x=>lc(x)===lc(toStr(v)))){const e=psErr(`Impossible de valider l’argument sur le paramètre « ${p.name} ». L’argument « ${toStr(v)} » n’appartient pas au jeu « ${p.set.join(',')} » spécifié par l’attribut ValidateSet.`,'InvalidData','ParameterArgumentValidationError');e.cmd=f.name;throw e;}
    if(p.type==='int'&&v!=null)v=castTo('int',v);if(p.type==='string'&&v!=null)v=toStr(v);if(p.type==='string[]'&&v!=null)v=Array.isArray(v)?v.map(toStr):[toStr(v)];
    s.vars.set(lc(p.name),v);}
  s.vars.set('args',extra);s.vars.set('input',input||[]);
  return runFnBody(f,s);
}
function runFnBody(f,s){
  const stream=st.streamOK&&!st.callDepth;st.callDepth=(st.callDepth||0)+1;
  try{
    if(stream){for(const stm of splitStatements(f.body)){let r_;try{r_=runStatement(stm,s);}catch(e){if(e instanceof PSFlow&&e.kind==='return'){fmtOut(flowOut(e).concat(e.val||[])).forEach(x=>host(L(x)));return[];}if(e instanceof PSFlow&&e.partial){fmtOut(e.partial).forEach(x=>host(L(x)));e.partial=null;}throw e;}fmtOut(r_).forEach(x=>host(L(x)));}return[];}
    return runStatementsRaw(f.body,s);
  }catch(e){if(e instanceof PSFlow&&e.kind==='return')return flowOut(e).concat(e.val||[]);throw e;}
  finally{st.callDepth--;}
}
function effectivePolicy(){for(const k of['MachinePolicy','UserPolicy','Process','CurrentUser','LocalMachine'])if(st.execPolicy[k]!=='Undefined')return st.execPolicy[k];return 'Restricted';}
function runScriptFile(name,toks,scope){
  let loc;try{loc=resolve(name);}catch(e){loc=null;}const n=loc?nodeAt(loc):null;
  if(!n||n.d){const e=psErr(`Le terme «${name}» n'est pas reconnu comme nom d'applet de commande, fonction, fichier de script ou programme exécutable. Vérifiez l'orthographe du nom, ou si un chemin d'accès existe, vérifiez que le chemin d'accès est correct et réessayez.`,'ObjectNotFound','CommandNotFoundException');e.cmd=name;e.target=name+':String';throw e;}
  if(!/[\\\/]/.test(name)){const e=psErr(`Le terme «${name}» n'est pas reconnu comme nom d'applet de commande, fonction, fichier de script ou programme exécutable. Vérifiez l'orthographe du nom, ou si un chemin d'accès existe, vérifiez que le chemin d'accès est correct et réessayez.`,'ObjectNotFound','CommandNotFoundException');e.cmd=name;e.target=name+':String';e.hint=`(Suggestion [3,General] : la commande ${name} n’a pas été trouvée, mais elle existe à l’emplacement actuel. Windows PowerShell ne charge pas de commandes depuis l’emplacement actuel par défaut. Tape « .\\${name} ».)`;throw e;}
  const pol=effectivePolicy();
  if(pol==='Restricted'||pol==='AllSigned'||(pol==='RemoteSigned'&&n.zone)){const e=psErr(`Impossible de charger le fichier ${showLoc(fixCase(loc))}, car l’exécution de scripts est désactivée sur ce système. Pour plus d’informations, consultez about_Execution_Policies à l’adresse https://go.microsoft.com/fwlink/?LinkID=135170.`,'Erreur de sécurité','UnauthorizedAccess');e.cmd=name;e.target=':';throw e;}
  const f={name,params:[],body:n.content};
  const content=n.content.replace(/\r/g,'').replace(/<#[\s\S]*?#>/g,'');f.body=content;
  const pm=/^\s*(?:#.*\n|\s)*(\[CmdletBinding\([^)]*\)\]\s*)?param\s*\(/i.exec(content);
  if(pm){const c=readParen(content,pm[0].length-1);f.params=parseParams(c.inner);f.body=content.slice(c.end);}
  try{return callFunction(f,toks,null,scope);}catch(e){if(e instanceof PSFlow&&e.kind==='exit')return e.val||[];throw e;}
}
