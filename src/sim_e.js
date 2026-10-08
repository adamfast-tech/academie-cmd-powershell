
/* =========================================================
   PowerShell 5.1 : objets, affichage
   ========================================================= */
function mk(type,props,extra){const o=Object.assign({},props);Object.defineProperty(o,'__t',{value:type,enumerable:false,writable:true});if(extra)for(const k of Object.keys(extra))Object.defineProperty(o,k,{value:extra[k],enumerable:false,writable:true});return o;}
const isObj=v=>v!=null&&typeof v==='object'&&!Array.isArray(v)&&!(v instanceof Date);
const isHt=v=>isObj(v)&&v.__t==='System.Collections.Hashtable';
const isSb=v=>isObj(v)&&v.__sb!=null;
function typeOf(v){if(v==null)return null;if(Array.isArray(v))return'System.Object[]';if(typeof v==='string')return'System.String';if(typeof v==='number')return Number.isInteger(v)&&Math.abs(v)<2147483648?'System.Int32':Number.isInteger(v)?'System.Int64':'System.Double';if(typeof v==='boolean')return'System.Boolean';if(v instanceof Date)return'System.DateTime';if(isSb(v))return'System.Management.Automation.ScriptBlock';return v.__t||'System.Management.Automation.PSCustomObject';}
const numFr=v=>{if(Number.isInteger(v))return String(v);let s=String(+v.toPrecision(15));return s.replace('.',',');};
const invDate=d=>`${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
function toStr(v){
  if(v==null)return'';if(typeof v==='string')return v;if(typeof v==='number')return Number.isInteger(v)?String(v):String(+v.toPrecision(15));
  if(typeof v==='boolean')return v?'True':'False';if(v instanceof Date)return invDate(v);
  if(Array.isArray(v))return v.map(toStr).join(' ');
  if(isSb(v))return v.__sb;
  if(v.__s!=null)return typeof v.__s==='function'?v.__s():v.__s;
  if(isHt(v))return'System.Collections.Hashtable';
  if(!v.__t||v.__t==='System.Management.Automation.PSCustomObject'||/^Selected\./.test(v.__t)||/^Csv/.test(v.__t))return'@{'+Object.keys(v).map(k=>`${k}=${toStr(v[k])}`).join('; ')+'}';
  return v.__t;
}
function cell(v){
  if(v==null)return'';if(typeof v==='string')return v;if(typeof v==='number')return numFr(v);if(typeof v==='boolean')return v?'True':'False';
  if(v instanceof Date)return fdt(v);
  if(Array.isArray(v)){const s=v.slice(0,4).map(cell);return'{'+s.join(', ')+(v.length>4?'...':'')+'}';}
  if(isSb(v))return v.__sb.trim();
  if(v.__s!=null)return typeof v.__s==='function'?v.__s():v.__s;
  if(isHt(v))return'{'+Object.keys(v).join(', ')+'}';
  if(!v.__t||v.__t==='System.Management.Automation.PSCustomObject'||/^Selected\./.test(v.__t))return'@{'+Object.keys(v).map(k=>`${k}=${toStr(v[k])}`).join('; ')+'}';
  return v.__t;
}
function display(v){if(typeof v==='number')return numFr(v);if(v instanceof Date)return flong(v);if(typeof v==='boolean')return v?'True':'False';if(isSb(v))return v.__sb;return toStr(v);}
/* vues par défaut */
const VIEWS={
  'System.ServiceProcess.ServiceController':{t:[['Status','Status'],['Name','Name'],['DisplayName','DisplayName']]},
  'System.Management.Automation.PathInfo':{t:[['Path','Path']]},
  'System.Diagnostics.Eventing.Reader.EventLogRecord':{t:[['TimeCreated','TimeCreated'],['Id','Id',1],['LevelDisplayName','LevelDisplayName'],['Message',o=>String(o.Message).split('\n')[0]]]},
  'System.Diagnostics.EventLogEntry':{t:[['Index','Index',1],['Time',o=>`${MOIS[o.TimeGenerated.getMonth()].slice(0,4).replace(/é/,'e')}. ${pad(o.TimeGenerated.getDate())} ${ftime(o.TimeGenerated)}`],['EntryType','EntryType'],['Source','Source'],['InstanceID','InstanceID',1],['Message',o=>String(o.Message).split('\n')[0]]]},
  'Microsoft.PowerShell.Commands.GroupInfo':{t:[['Count','Count',1],['Name','Name'],['Group',o=>cell(o.Group)]]},
  'Microsoft.PowerShell.Commands.GroupInfoNoElement':{t:[['Count','Count',1],['Name','Name']]},
  'Microsoft.PowerShell.Commands.GenericMeasureInfo':{l:['Count','Average','Sum','Maximum','Minimum','Property']},
  'Microsoft.PowerShell.Commands.TextMeasureInfo':{t:[['Lines','Lines',1],['Words','Words',1],['Characters','Characters',1],['Property','Property']]},
  'System.Management.ManagementObject#root\\cimv2\\Win32_PingStatus':{t:[['Source','Source'],['Destination','Destination'],['IPV4Address','IPV4Address'],['IPV6Address','IPV6Address'],['Bytes','Bytes',1],['Time(ms)','ResponseTime',1]]},
  'System.Management.ManagementObject#root\\cimv2\\Win32_QuickFixEngineering':{t:[['Source','Source'],['Description','Description'],['HotFixID','HotFixID'],['InstalledBy','InstalledBy'],['InstalledOn',o=>o.InstalledOn?fdt(o.InstalledOn):'']]},
  'Microsoft.PowerShell.Commands.LocalUser':{t:[['Name','Name'],['Enabled','Enabled'],['Description','Description']]},
  'Microsoft.PowerShell.Commands.LocalGroup':{t:[['Name','Name'],['Description','Description']]},
  'Microsoft.PowerShell.Commands.LocalPrincipal':{t:[['ObjectClass','ObjectClass'],['Name','Name'],['PrincipalSource','PrincipalSource']]},
  'Microsoft.Management.Infrastructure.CimInstance#ROOT/StandardCimv2/MSFT_NetAdapter':{t:[['Name','Name'],['InterfaceDescription','InterfaceDescription'],['ifIndex','ifIndex',1],['Status','Status'],['MacAddress','MacAddress'],['LinkSpeed','LinkSpeed',1]]},
  'Microsoft.Management.Infrastructure.CimInstance#ROOT/StandardCimv2/MSFT_NetTCPConnection':{t:[['LocalAddress','LocalAddress'],['LocalPort','LocalPort',1],['RemoteAddress','RemoteAddress'],['RemotePort','RemotePort',1],['State','State'],['AppliedSetting','AppliedSetting'],['OwningProcess','OwningProcess',1]]},
  'Microsoft.Management.Infrastructure.CimInstance#ROOT/StandardCimv2/MSFT_DNSClientServerAddress':{t:[['InterfaceAlias','InterfaceAlias'],['Interface Index','InterfaceIndex',1],['Address Family','AddressFamily'],['ServerAddresses',o=>cell(o.ServerAddresses)]]},
  'Microsoft.Management.Infrastructure.CimInstance#ROOT/StandardCimv2/MSFT_NetFirewallProfile':{t:[['Name','Name'],['Enabled','Enabled']]},
  'Microsoft.DnsClient.Commands.DnsRecord':{t:[['Name','Name'],['Type','Type'],['TTL','TTL',1],['Section','Section'],['IPAddress',o=>o.IPAddress||o.NameExchange||o.NameTarget||o.NameHost||'']]},
  'System.Management.Automation.AliasInfo':{t:[['CommandType','CommandType'],['Name',o=>`${o.Name} -> ${o.Definition}`],['Version','Version'],['Source','Source']]},
  'System.Management.Automation.CmdletInfo':{t:[['CommandType','CommandType'],['Name','Name'],['Version','Version'],['Source','Source']]},
  'System.Management.Automation.PSModuleInfo':{t:[['ModuleType','ModuleType'],['Version','Version'],['Name','Name'],['ExportedCommands',o=>cell(o.ExportedCommands)]]},
  'System.Management.Automation.PSDriveInfo':{t:[['Name','Name'],['Used (GB)',o=>o.Used==null?'':numFr(Math.round(o.Used/1073741824*100)/100),1],['Free (GB)',o=>o.Free==null?'':numFr(Math.round(o.Free/1073741824*100)/100),1],['Provider','Provider'],['Root','Root'],['CurrentLocation','CurrentLocation',1]]},
  'Microsoft.Management.Infrastructure.CimInstance#ROOT/Microsoft/Windows/Storage/MSFT_Volume':{t:[['DriveLetter','DriveLetter'],['FriendlyName','FriendlyName'],['FileSystemType','FileSystemType'],['DriveType','DriveType'],['HealthStatus','HealthStatus'],['OperationalStatus','OperationalStatus'],['SizeRemaining',o=>gbStr(o.SizeRemaining),1],['Size',o=>gbStr(o.Size),1]]},
  'Microsoft.Management.Infrastructure.CimInstance#ROOT/Microsoft/Windows/Storage/MSFT_Disk':{t:[['Number','Number',1],['Friendly Name','FriendlyName'],['Serial Number','SerialNumber'],['HealthStatus','HealthStatus'],['OperationalStatus','OperationalStatus'],['Total Size',o=>gbStr(o.Size),1],['Partition Style','PartitionStyle']]},
  'Microsoft.Management.Infrastructure.CimInstance#ROOT/StandardCimv2/MSFT_Printer':{t:[['Name','Name'],['ComputerName','ComputerName'],['Type','Type'],['DriverName','DriverName'],['PortName','PortName'],['Shared','Shared'],['Published','Published']]},
  'Microsoft.Management.Infrastructure.CimInstance#ROOT/StandardCimv2/MSFT_PrintJob':{t:[['Id','Id',1],['ComputerName','ComputerName'],['PrinterName','PrinterName'],['DocumentName','DocumentName'],['SubmittedTime','SubmittedTime'],['JobStatus','JobStatus']]},
  'Microsoft.Management.Infrastructure.CimInstance#Root/Microsoft/Windows/TaskScheduler/MSFT_ScheduledTask':{t:[['TaskPath','TaskPath'],['TaskName','TaskName'],['State','State']]},
  'Microsoft.PowerShell.ExecutionPolicy':{t:[['Scope','Scope'],['ExecutionPolicy','ExecutionPolicy']]},
  'Microsoft.Management.Infrastructure.CimSession':{l:['Id','Name','InstanceId','ComputerName','Protocol']},
  'Microsoft.PowerShell.Commands.FileHashInfo':{t:[['Algorithm','Algorithm'],['Hash','Hash'],['Path','Path']]},
  'Microsoft.PowerShell.Commands.HistoryInfo':{t:[['Id','Id',1],['CommandLine','CommandLine']]},
  'System.Management.Automation.PSVariable':{t:[['Name','Name'],['Value',o=>cell(o.Value)]]},
  'System.Security.AccessControl.DirectorySecurity':{t:[['Path','Path'],['Owner','Owner'],['Access',o=>o.Access.map(a=>a.IdentityReference+' '+a.AccessControlType+'  '+a.FileSystemRights).join('\n')]]},
  'Microsoft.Dism.Commands.BasicCapabilityObject':{t:[['Name','Name'],['State','State']]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_LogicalDisk':{t:[['DeviceID','DeviceID'],['DriveType','DriveType',1],['ProviderName','ProviderName'],['VolumeName','VolumeName'],['Size','Size',1],['FreeSpace','FreeSpace',1]]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_OperatingSystem':{t:[['SystemDirectory','SystemDirectory'],['Organization','Organization'],['BuildNumber','BuildNumber'],['RegisteredUser','RegisteredUser'],['SerialNumber','SerialNumber'],['Version','Version']]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_ComputerSystem':{t:[['Name','Name'],['PrimaryOwnerName','PrimaryOwnerName'],['Domain','Domain'],['TotalPhysicalMemory','TotalPhysicalMemory',1],['Model','Model'],['Manufacturer','Manufacturer']]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_BIOS':{l:['SMBIOSBIOSVersion','Manufacturer','Name','SerialNumber','Version']},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_Processor':{t:[['DeviceID','DeviceID'],['Name','Name'],['Caption','Caption'],['MaxClockSpeed','MaxClockSpeed',1],['SocketDesignation','SocketDesignation'],['Manufacturer','Manufacturer']]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_QuickFixEngineering':{t:[['Source','Source'],['Description','Description'],['HotFixID','HotFixID'],['InstalledBy','InstalledBy'],['InstalledOn',o=>o.InstalledOn?fdt(o.InstalledOn):'']]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_Service':{t:[['ProcessId','ProcessId',1],['Name','Name'],['StartMode','StartMode'],['State','State'],['Status','Status'],['ExitCode','ExitCode',1]]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_StartupCommand':{t:[['Name','Name'],['Command','Command'],['Location','Location'],['User','User']]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_Printer':{t:[['Name','Name'],['ShareName','ShareName'],['SystemName','SystemName'],['Default','Default'],['PrinterStatus','PrinterStatus',1]]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_UserProfile':{t:[['LocalPath','LocalPath'],['LastUseTime','LastUseTime'],['Special','Special'],['Loaded','Loaded']]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_Product':{t:[['Name','Name'],['Version','Version'],['Vendor','Vendor'],['Caption','Caption']]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_NetworkAdapterConfiguration':{t:[['ServiceName','ServiceName'],['DHCPEnabled','DHCPEnabled'],['Index','Index',1],['Description','Description']]},
  'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_Process':{t:[['ProcessId','ProcessId',1],['Name','Name'],['HandleCount','HandleCount',1],['WorkingSetSize','WorkingSetSize',1],['VirtualSize','VirtualSize',1]]}
};
const gbStr=b=>b==null?'':(b>=1073741824?numFr(Math.round(b/1073741824*100)/100)+' GB':numFr(Math.round(b/1048576*100)/100)+' MB');
function viewFor(o){const t=o.__t;if(!t)return null;if(VIEWS[t])return VIEWS[t];if(/^Microsoft\.Management\.Infrastructure\.CimInstance#root\/cimv2\/Win32_LogicalDisk/i.test(t))return VIEWS['Microsoft.Management.Infrastructure.CimInstance#root/cimv2/Win32_LogicalDisk'];if(/Win32_/.test(t)){const k=Object.keys(VIEWS).find(x=>lc(x)===lc(t.replace(/^System\.Management\.ManagementObject#root\\cimv2\\/,'Microsoft.Management.Infrastructure.CimInstance#root/cimv2/')));if(k)return VIEWS[k];}return null;}
function propVal(o,p){if(typeof p==='function')return p(o);return getMember(o,p);}
function tableLines(rows,cols){
  const data=rows.map(r=>cols.map(c=>{const v=propVal(r,c[1]);return typeof v==='string'&&c[2]?v:cell(v);}));
  const numeric=cols.map((c,i)=>c[2]===1||rows.length&&rows.every(r=>{const v=propVal(r,c[1]);return v==null||typeof v==='number';})&&rows.some(r=>typeof propVal(r,c[1])==='number'));
  const w=cols.map((c,i)=>Math.max(c[0].length,...data.map(d=>Math.max(...String(d[i]).split('\n').map(x=>x.length)))));
  const cap=cols.map((c,i)=>i<cols.length-1?Math.min(w[i],48):w[i]);
  const fit=(s,i)=>{s=String(s).split('\n')[0];if(s.length>cap[i])s=s.slice(0,cap[i]-3)+'...';return numeric[i]?s.padStart(cap[i]):s.padEnd(cap[i]);};
  const out=[''];
  out.push(cols.map((c,i)=>numeric[i]?c[0].padStart(cap[i]):c[0].padEnd(cap[i])).join(' ').trimEnd());
  out.push(cols.map((c,i)=>{const d='-'.repeat(c[0].length);return numeric[i]?d.padStart(cap[i]):d.padEnd(cap[i]);}).join(' ').trimEnd());
  data.forEach(d=>out.push(d.map((x,i)=>fit(x,i)).join(' ').trimEnd()));
  out.push('');return out;
}
function listLines(rows,props){
  const out=[''];
  rows.forEach(r=>{const ps=props||Object.keys(r);const w=Math.max(...ps.map(p=>String(typeof p==='string'?p:p[0]).length),1);
    ps.forEach(p=>{const name=typeof p==='string'?p:p[0];const v=typeof p==='string'?getMember(r,p):propVal(r,p[1]);const s=v==null?'':typeof v==='string'?v:cell(v);
      const ls=s.split('\n');out.push(`${name.padEnd(w)} : ${ls[0]}`);ls.slice(1).forEach(x=>out.push(' '.repeat(w+3)+x));});
    out.push('');});
  return out;
}
function fileMode(n){const a=n.attr||'';return (n.d?'d':'-')+(a.includes('a')?'a':'-')+(a.includes('r')?'r':'-')+(a.includes('h')?'h':'-')+(a.includes('s')?'s':'-')+'-';}
function fsLines(items){
  const out=[];let cur=null;
  items.forEach(o=>{const par=o.__parent;if(par!==cur){if(cur!==null)out.push('');out.push('');out.push('');out.push(`    Répertoire : ${par}`);out.push('');out.push('');out.push('Mode                 LastWriteTime         Length Name');out.push('----                 -------------         ------ ----');cur=par;}
    const d=o.LastWriteTime;out.push(`${o.Mode.padEnd(6)}        ${fdate(d)}     ${ftime(d)}${(o.__isDir?'':String(o.Length)).padStart(15)} ${o.Name}`);});
  out.push('');out.push('');return out;
}
function procLines(items){
  const out=['','Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName','-------  ------    -----      -----     ------     --  -- -----------'];
  items.forEach(p=>out.push(String(p.Handles).padStart(7)+String(Math.round(p.NPM/1024)).padStart(8)+String(Math.round(p.PM/1024)).padStart(9)+String(Math.round(p.WS/1024)).padStart(11)+(p.CPU==null?'':numFr(Math.round(p.CPU*100)/100)).padStart(11)+String(p.Id).padStart(7)+String(p.SI).padStart(4)+' '+p.ProcessName));
  out.push('');return out;
}
function regKeyLines(items){
  const out=[];let cur=null;
  items.forEach(o=>{if(o.__hive!==cur){out.push('');out.push('');out.push(`    Hive : ${o.__hive}`);out.push('');out.push('');out.push('Name                           Property');out.push('----                           --------');cur=o.__hive;}
    const props=o.__props||[];out.push(`${o.PSChildName.padEnd(30).slice(0,30)} ${props[0]||''}`);props.slice(1).forEach(p=>out.push(' '.repeat(31)+p));});
  out.push('');return out;
}
function fmtOut(items){
  const out=[];let i=0;
  while(i<items.length){
    const v=items[i];
    if(v==null){i++;continue;}
    if(isObj(v)&&v.__fmt){v.lines.forEach(x=>out.push(x));i++;continue;}
    if(!isObj(v)){out.push(...display(v).split('\n'));i++;continue;}
    const t=v.__t;let j=i;while(j<items.length&&isObj(items[j])&&items[j].__t===t&&!items[j].__fmt)j++;
    const grp=items.slice(i,j);i=j;
    out.push(...formatGroup(grp,null,null));
  }
  return out;
}
function formatGroup(grp,force,props){
  const v=grp[0];const t=v.__t;
  if(!force&&!props){
    if(t==='System.IO.FileInfo'||t==='System.IO.DirectoryInfo'||v.__isFs)return fsLines(grp);
    if(t==='System.Diagnostics.Process')return procLines(grp);
    if(t==='Microsoft.Win32.RegistryKey')return regKeyLines(grp);
    if(isHt(v)){const rows=[];grp.forEach(h=>Object.keys(h).forEach(k=>rows.push({Name:k,Value:h[k]})));return tableLines(rows,[['Name','Name'],['Value','Value']]);}
    if(t==='Microsoft.PowerShell.Commands.MatchInfo')return['',...grp.map(o=>o.__s),''];
    if(t==='Microsoft.PowerShell.Commands.MemberDefinition'){const out=[];const types=[...new Set(grp.map(o=>o.TypeName))];types.forEach(tn=>{out.push('','   TypeName : '+tn);out.push(...tableLines(grp.filter(o=>o.TypeName===tn),[['Name','Name'],['MemberType','MemberType'],['Definition','Definition']]));});return out;}
    if(v.__lines)return grp.flatMap(o=>o.__lines());
  }
  const view=viewFor(v);
  if(props){
    const cols=props.map(p=>typeof p==='string'?[p,p]:[p.label,p.fn]);
    if(force==='list')return listLines(grp,cols.map(c=>[c[0],c[1]]));
    return tableLines(grp,cols);
  }
  if(force==='list'){return listLines(grp,view&&view.l?view.l:null);}
  if(force==='table'){if(view&&view.t)return tableLines(grp,view.t);const ks=Object.keys(v);return tableLines(grp,ks.slice(0,10).map(k=>[k,k]));}
  if(view&&view.t)return tableLines(grp,view.t);
  if(view&&view.l)return listLines(grp,view.l);
  const ks=Object.keys(v);
  if(ks.length<=4)return tableLines(grp,ks.map(k=>[k,k]));
  return listLines(grp,null);
}

/* ---------- membres & conversions ---------- */
function getMember(o,name){
  if(o==null)return null;
  if(typeof name!=='string')name=toStr(name);
  const n=lc(name);
  if(Array.isArray(o)){if(n==='count'||n==='length')return o.length;const r=[];o.forEach(x=>{const v=getMember(x,name);if(Array.isArray(v))r.push(...v);else if(v!==undefined&&v!==null)r.push(v);});return r.length?r:null;}
  if(typeof o==='string'){if(n==='length')return o.length;return null;}
  if(o instanceof Date){const M={year:o.getFullYear(),month:o.getMonth()+1,day:o.getDate(),hour:o.getHours(),minute:o.getMinutes(),second:o.getSeconds(),millisecond:o.getMilliseconds(),dayofweek:DAYS_EN[o.getDay()],dayofyear:Math.floor((o-new Date(o.getFullYear(),0,0))/864e5),date:new Date(o.getFullYear(),o.getMonth(),o.getDate()),ticks:o.getTime()*10000+621355968000000000};return n in M?M[n]:null;}
  if(typeof o==='number'||typeof o==='boolean')return null;
  if(isHt(o)){if(n==='keys')return Object.keys(o);if(n==='values')return Object.values(o);if(n==='count')return Object.keys(o).length;}
  const k=Object.getOwnPropertyNames(o).find(x=>lc(x)===n&&!x.startsWith('__'));
  if(k!=null)return o[k];
  if(o.__get&&o.__get[n]!=null)return typeof o.__get[n]==='function'?o.__get[n](o):o.__get[n];
  if(n==='pstypenames')return[o.__t];
  return null;
}
function setMember(o,name,val){if(!isObj(o))throw psErr(`La propriété « ${name} » est introuvable sur cet objet. Vérifiez qu’elle existe et qu’elle peut être définie.`,'InvalidOperation','PropertyAssignmentException');const k=Object.keys(o).find(x=>lc(x)===lc(name));if(k!=null)o[k]=val;else if(isHt(o)||!o.__t||o.__t==='System.Management.Automation.PSCustomObject')o[name]=val;else throw psErr(`La propriété « ${name} » est introuvable sur cet objet. Vérifiez qu’elle existe et qu’elle peut être définie.`,'InvalidOperation','PropertyNotFound');}
const truthy=v=>{if(v==null)return false;if(Array.isArray(v))return v.length===0?false:v.length===1?truthy(v[0]):true;if(typeof v==='string')return v.length>0;if(typeof v==='number')return v!==0;if(typeof v==='boolean')return v;return true;};
function toNum(v){if(typeof v==='number')return v;if(typeof v==='boolean')return v?1:0;if(v==null||v==='')return 0;if(typeof v==='string'){const s=v.trim().replace(/\s/g,'');if(/^-?\d+([.,]\d+)?(e[+-]?\d+)?$/i.test(s))return parseFloat(s.replace(',','.'));if(/^0x[0-9a-f]+$/i.test(s))return parseInt(s,16);const m=/^(-?\d+(?:\.\d+)?)(kb|mb|gb|tb)$/i.exec(s);if(m)return parseFloat(m[1])*{kb:1024,mb:1048576,gb:1073741824,tb:1099511627776}[lc(m[2])];}
  if(v instanceof Date)return v.getTime();throw psErr(`Impossible de convertir la valeur « ${toStr(v)} » en type « System.Int32 ». Erreur : « Le format de la chaîne d’entrée est incorrect. »`,'InvalidArgument','InvalidCastFromStringToInteger');}
function toDate(v){if(v instanceof Date)return v;if(typeof v==='string'){let m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(v.trim());if(m)return new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0),+(m[6]||0));m=/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(v.trim());if(m)return new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0),+(m[6]||0));}
  throw psErr(`Impossible de convertir la valeur « ${toStr(v)} » en type « System.DateTime ».`,'InvalidArgument','InvalidCastParseTargetInvocation');}
function looseEq(a,b){
  if(a==null||b==null)return a==null&&b==null;
  if(typeof a==='number'){try{return a===toNum(b);}catch(e){return false;}}
  if(typeof a==='boolean')return a===truthy(b);
  if(a instanceof Date){try{return a.getTime()===toDate(b).getTime();}catch(e){return false;}}
  if(typeof a==='string')return lc(a)===lc(toStr(b));
  return a===b;
}
function cmpVals(a,b){
  if(a==null&&b==null)return 0;if(a==null)return -1;if(b==null)return 1;
  if(typeof a==='number'){const nb=toNum(b);return a<nb?-1:a>nb?1:0;}
  if(a instanceof Date){const db=toDate(b);return a<db?-1:a>db?1:0;}
  const x=lc(toStr(a)),y=lc(toStr(b));return x.localeCompare(y,'fr');
}
function bankRound(x,d){const f=Math.pow(10,d||0);const v=x*f;const r=Math.round(v);const diff=Math.abs(v-Math.trunc(v));if(Math.abs(diff-0.5)<1e-9){const fl=Math.floor(v);return(fl%2===0?fl:fl+1)/f;}return r/f;}
function fmtNumSpec(v,spec){
  const m=/^([NnFfPpDdXxCcEeGg])(\d*)$/.exec(spec||'');
  if(v instanceof Date)return fmtDate(v,spec);
  if(!m){if(typeof v==='number')return numFr(v);return toStr(v);}
  const k=m[1].toUpperCase(),p=m[2]===''?null:+m[2];const n=toNum(v);
  const group=s=>s.replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  if(k==='N'){const d=p==null?2:p;const r=bankRound(Math.abs(n),d).toFixed(d);const [i,f]=r.split('.');return(n<0?'-':'')+group(i)+(f?','+f:'');}
  if(k==='F'){const d=p==null?2:p;return bankRound(n,d).toFixed(d).replace('.',',');}
  if(k==='P'){const d=p==null?2:p;return(n*100).toFixed(d).replace('.',',')+' %';}
  if(k==='D')return String(Math.trunc(n)).padStart(p||0,'0');
  if(k==='X')return Math.trunc(n).toString(16).toUpperCase().padStart(p||0,'0');
  if(k==='C'){const d=p==null?2:p;return group(Math.abs(n).toFixed(d).split('.')[0])+','+Math.abs(n).toFixed(d).split('.')[1]+' €';}
  return numFr(n);
}
function fmtDate(d,f){
  if(!f)return invDate(d);
  if(f==='d')return fdate(d);if(f==='D')return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;if(f==='t')return ftime(d);if(f==='T')return `${ftime(d)}:${pad(d.getSeconds())}`;if(f==='g')return fdate(d)+' '+ftime(d);if(f==='G')return fdt(d);if(f==='s')return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;if(f==='o'||f==='O')return d.toISOString();
  return f.replace(/yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|tt|fff|'[^']*'/g,t=>{switch(t){case'yyyy':return d.getFullYear();case'yy':return pad(d.getFullYear()%100);case'MMMM':return MOIS[d.getMonth()];case'MMM':return MOIS[d.getMonth()].slice(0,4)+'.';case'MM':return pad(d.getMonth()+1);case'M':return d.getMonth()+1;case'dddd':return JOURS[d.getDay()];case'ddd':return JOURS[d.getDay()].slice(0,3)+'.';case'dd':return pad(d.getDate());case'd':return d.getDate();case'HH':return pad(d.getHours());case'H':return d.getHours();case'hh':return pad(d.getHours()%12||12);case'h':return d.getHours()%12||12;case'mm':return pad(d.getMinutes());case'm':return d.getMinutes();case'ss':return pad(d.getSeconds());case's':return d.getSeconds();case'tt':return d.getHours()<12?'AM':'PM';case'fff':return pad(d.getMilliseconds(),3);default:return t.slice(1,-1);}});
}
function fmtF(fmt,args){
  args=Array.isArray(args)?args:[args];
  return String(fmt).replace(/\{\{|\}\}|\{(\d+)(?:,(-?\d+))?(?::([^}]*))?\}/g,(m,i,al,spec)=>{if(m==='{{')return'{';if(m==='}}')return'}';const v=args[+i];let s=spec!=null?fmtNumSpec(v,spec):(typeof v==='number'?numFr(v):v instanceof Date?fdt(v):toStr(v));if(al){const w=+al;s=w<0?s.padEnd(-w):s.padStart(w);}return s;});
}

/* ---------- erreurs ---------- */
class PSErr extends Error{constructor(msg,cat,fqid){super(msg);this.cat=cat||'NotSpecified';this.fqid=fqid||'RuntimeException';this.cmd=null;this.target='';}}
class PSFlow extends Error{constructor(kind,val){super(kind);this.kind=kind;this.val=val;}}
const psErr=(m,c,f)=>new PSErr(m,c,f);
function fqSuffix(cmd){const d=CMDLETS[lc(cmd)]||CMDLETS[ALIASES[lc(cmd)]];if(!d)return cmd;const n=d.name.replace('-','');if(/^Microsoft\.PowerShell/.test(d.mod))return 'Microsoft.PowerShell.Commands.'+n+'Command';if(d.mod==='ActiveDirectory')return 'Microsoft.ActiveDirectory.Management.Commands.'+n.replace(/^(Get|Set|New|Remove)AD/,'$1AD');return d.mod+'.'+n+'Command';}
function excName(e){if(e.exc)return e.exc;const f=e.fqid;if(/^CommandNotFound/.test(f))return'CommandNotFoundException';if(/PathNotFound|ItemNotFound/.test(f))return'ItemNotFoundException';if(/NoServiceFound/.test(f))return'ServiceCommandException';if(/NoProcessFound/.test(f))return'ProcessCommandException';if(/ParameterNotFound|MissingArgument|AmbiguousParameter|CannotConvert|ParameterArgument/.test(f))return'ParameterBindingException';if(/ADIdentityNotFound/.test(f))return'ADIdentityNotFoundException';if(/UnauthorizedAccess/.test(f))return'PSSecurityException';if(/ParserError/.test(e.cat))return'ParentContainsErrorRecordException';if(/ActiveDirectoryServer/.test(f))return'ADException';return /InvalidOperation/.test(e.cat)?'InvalidOperationException':'RuntimeException';}
function errLines(e,line){
  const cmd=e.cmd||'';let col=1;let len=Math.max(1,(line||'').trim().length);
  if(cmd&&line){const i=lc(line).indexOf(lc(cmd));if(i>=0){col=i+1;len=cmd.length;}}
  const L_=[];
  L_.push((cmd?cmd+' : ':'')+e.message);
  L_.push(`Au caractère Ligne:1 : ${col}`);
  L_.push('+ '+(line||'').replace(/\s+$/,''));
  L_.push('+ '+' '.repeat(col-1)+'~'.repeat(Math.min(len,80)));
  const nf_=e.fqid==='CommandNotFoundException'||e.fqid==='UnauthorizedAccess';
  L_.push(`    + CategoryInfo          : ${e.cat}: (${e.target||':'}) [${nf_?'':cmd||''}], ${excName(e)}`);
  L_.push(`    + FullyQualifiedErrorId : ${e.fqid}${cmd&&!nf_&&!/,/.test(e.fqid)?','+fqSuffix(cmd):''}`);
  L_.push('');
  return L_;
}

/* =========================================================
   PowerShell : analyse lexicale et syntaxique
   ========================================================= */
function scanDq(s,i){let j=i+1;while(j<s.length){const c=s[j];if(c==='`'){j+=2;continue;}if(c==='"'){if(s[j+1]==='"'){j+=2;continue;}return j+1;}if(c==='$'&&s[j+1]==='('){j=matchClose(s,j+1)+1;continue;}j++;}return s.length;}
function scanSq(s,i){let j=i+1;while(j<s.length){if(s[j]==="'"){if(s[j+1]==="'"){j+=2;continue;}return j+1;}j++;}return s.length;}
function matchClose(s,i){
  const open=s[i],close={'(':')','{':'}','[':']'}[open];let d=0;
  for(let j=i;j<s.length;j++){
    const c=s[j];
    if(c==='"'){j=scanDq(s,j)-1;continue;}
    if(c==="'"){j=scanSq(s,j)-1;continue;}
    if(c==='#'&&(j===0||/\s/.test(s[j-1]))&&open!=='['){while(j<s.length&&s[j]!=='\n')j++;continue;}
    if(c==='`'){j++;continue;}
    if(c==='('||c==='{'||c==='['){if(c===open)d++;else if(c!=='['){const e=matchClose(s,j);if(e<0)return s.length;j=e;continue;}}
    else if(c===close){d--;if(d===0)return j;}
  }
  throw psErr(`Accolade ou parenthèse fermante « ${close} » manquante.`,'ParserError','MissingEndCurlyBrace');
}
const CMPOPS=new Set(['-eq','-ne','-gt','-ge','-lt','-le','-like','-notlike','-match','-notmatch','-contains','-notcontains','-in','-notin','-replace','-split','-join','-is','-isnot','-as','-ieq','-ine','-igt','-ige','-ilt','-ile','-ilike','-inotlike','-imatch','-inotmatch','-ceq','-cne','-clike','-cmatch','-creplace','-ireplace','-band','-bor']);
function lexX(s){
  const T=[];let i=0;const n=s.length;
  const push=(t,v,a,b,ws)=>T.push({t,v,s:a,e:b,ws});
  while(i<n){
    let ws=false;while(i<n&&/\s/.test(s[i])){i++;ws=true;}
    if(i>=n)break;
    const c=s[i],r=s.slice(i);let m;const prev=T[T.length-1];
    if(c==='#')break;
    if(c==='"'){const e=scanDq(s,i);push('dq',s.slice(i+1,Math.max(i+1,e-1)),i,e,ws);i=e;continue;}
    if(c==="'"){const e=scanSq(s,i);push('sq',s.slice(i+1,Math.max(i+1,e-1)).replace(/''/g,"'"),i,e,ws);i=e;continue;}
    if(c==='@'&&s[i+1]==='('){const e=matchClose(s,i+1);push('arr',s.slice(i+2,e),i,e+1,ws);i=e+1;continue;}
    if(c==='@'&&s[i+1]==='{'){const e=matchClose(s,i+1);push('ht',s.slice(i+2,e),i,e+1,ws);i=e+1;continue;}
    if(c==='$'&&s[i+1]==='('){const e=matchClose(s,i+1);push('subx',s.slice(i+2,e),i,e+1,ws);i=e+1;continue;}
    if(c==='('){const e=matchClose(s,i);push('paren',s.slice(i+1,e),i,e+1,ws);i=e+1;continue;}
    if(c==='{'){const e=matchClose(s,i);push('sb',s.slice(i+1,e),i,e+1,ws);i=e+1;continue;}
    if((m=/^\$\{([^}]+)\}/.exec(r))||(m=/^\$((?:env|global|script|local|using|variable):[A-Za-z_][\w()]*|[A-Za-z_]\w*|_|\?|\^|\$)/i.exec(r))){push('var',m[1],i,i+m[0].length,ws);i+=m[0].length;continue;}
    if((m=/^0x[0-9a-f]+/i.exec(r))){push('num',parseInt(m[0],16),i,i+m[0].length,ws);i+=m[0].length;continue;}
    if(!(prev&&prev.t==='punct'&&prev.v==='.'&&!ws)&&(m=/^(\d+(?:\.\d+)?)(e[+-]?\d+)?(kb|mb|gb|tb|pb)?(?![\w])/i.exec(r))){let v=parseFloat(m[1]+(m[2]||''));const sf=lc(m[3]||'');v*={kb:1024,mb:1048576,gb:1073741824,tb:1099511627776,pb:1125899906842624}[sf]||1;push('num',v,i,i+m[0].length,ws);i+=m[0].length;continue;}
    if(c==='['){const idx=prev&&!ws&&['var','paren','subx','arr','dq','sq','word','ht'].includes(prev.t)||prev&&!ws&&prev.t==='punct'&&prev.v===']';
      if(!idx&&(m=/^\[\s*([A-Za-z_][\w.`]*(?:\[\])?)\s*\]/.exec(r))){push('type',m[1],i,i+m[0].length,ws);i+=m[0].length;continue;}
      push('punct','[',i,i+1,ws);i++;continue;}
    if((m=/^-([A-Za-z]+)(?![\w-])/.exec(r))&&CMPOPS.has('-'+lc(m[1]))||/^-(and|or|xor|not|f)(?![\w-])/i.test(r)){m=/^-([A-Za-z]+)/.exec(r);push('op','-'+lc(m[1]),i,i+m[0].length,ws);i+=m[0].length;continue;}
    if((m=/^(::|\.\.|\+=|-=|\*=|\/=|\+\+|--)/.exec(r))){push('punct',m[1],i,i+2,ws);i+=2;continue;}
    if('+-*/%!,.]=;|&<>'.includes(c)){push('punct',c,i,i+1,ws);i++;continue;}
    if((m=/^[A-Za-z_][\w-]*/.exec(r))){push('word',m[0],i,i+m[0].length,ws);i+=m[0].length;continue;}
    if((m=/^[^\s]+/.exec(r))){push('word',m[0],i,i+m[0].length,ws);i+=m[0].length;continue;}
  }
  return T;
}
function parseX(T,src){
  let p=0;const peek=()=>T[p],next=()=>T[p++];
  const isP=v=>T[p]&&T[p].t==='punct'&&T[p].v===v,isOp=v=>T[p]&&T[p].t==='op'&&T[p].v===v;
  const unexpected=t=>psErr(`Jeton inattendu « ${t?src.slice(t.s,t.e):'(fin)'} » dans l’expression ou l’instruction.`,'ParserError','UnexpectedToken');
  function pLogic(){let l=pCmp();while(T[p]&&T[p].t==='op'&&['-and','-or','-xor'].includes(T[p].v)){const op=next().v;const r=pCmp();l={k:'bin',op,l,r};}return l;}
  function pCmp(){let l=pAdd();while(T[p]&&T[p].t==='op'&&CMPOPS.has(T[p].v)){const op=next().v;const r=pAdd();l={k:'bin',op,l,r};}return l;}
  function pAdd(){let l=pMul();while(isP('+')||isP('-')){const op=next().v;const r=pMul();l={k:'bin',op,l,r};}return l;}
  function pMul(){let l=pFmt();while(isP('*')||isP('/')||isP('%')){const op=next().v;const r=pFmt();l={k:'bin',op,l,r};}return l;}
  function pFmt(){let l=pRange();while(isOp('-f')){next();const r=pRange();l={k:'bin',op:'-f',l,r};}return l;}
  function pRange(){let l=pNot();if(isP('..')){next();const r=pNot();l={k:'range',l,r};}return l;}
  function pNot(){if(isOp('-not')||isP('!')){next();return{k:'not',e:pNot()};}if(isOp('-split')||isOp('-join')){const op=next().v;return{k:'un',op,e:pNot()};}return pComma();}
  function pComma(){const items=[pUnary()];while(isP(',')){next();items.push(pUnary());}return items.length>1?{k:'list',items}:items[0];}
  function pUnary(){
    if(isP('-')){next();return{k:'neg',e:pUnary()};}
    if(isP('+')){next();return pUnary();}
    if(isP(',')){next();return{k:'list',items:[pUnary()]};}
    if(T[p]&&T[p].t==='type'){const ty=next().v;if(isP('::')){next();const nm=next();if(!nm)throw unexpected();let node={k:'static',type:ty,name:nm.v};if(T[p]&&T[p].t==='paren'&&!T[p].ws){node.args=next().v;}return pPostFrom(node);}
      if(!T[p]||T[p].t==='punct'&&[')',',',']',';','|'].includes(T[p].v)||T[p].t==='op')return{k:'type',v:ty};
      return{k:'cast',type:ty,e:pUnary()};}
    return pPostFrom(pPrim());
  }
  function pPostFrom(e){
    for(;;){const t=T[p];if(!t)break;
      if(t.t==='punct'&&t.v==='.'&&!t.ws){next();const nm=next();if(!nm)throw unexpected();const name=nm.t==='word'?nm.v:nm.t==='var'?{dynv:nm.v}:(nm.t==='dq'||nm.t==='sq')?nm.v:nm.t==='num'?String(nm.v):src.slice(nm.s,nm.e);
        const nt=T[p];if(nt&&nt.t==='paren'&&!nt.ws){next();e={k:'call',obj:e,name,args:nt.v};}else e={k:'mem',obj:e,name};continue;}
      if(t.t==='punct'&&t.v==='::'&&!t.ws){next();const nm=next();e={k:'smem',obj:e,name:nm.v};if(T[p]&&T[p].t==='paren'&&!T[p].ws){e.args=next().v;}continue;}
      if(t.t==='punct'&&t.v==='['&&!t.ws){next();let d=1,q=p;while(q<T.length){if(T[q].t==='punct'&&T[q].v==='[')d++;if(T[q].t==='punct'&&T[q].v===']'){d--;if(d===0)break;}q++;}
        const inner=T.slice(p,q);p=q+1;e={k:'idx',obj:e,idx:parseX(inner,src)};continue;}
      if((t.t==='punct'&&(t.v==='++'||t.v==='--'))&&!t.ws){next();e={k:'post',op:t.v,e};continue;}
      break;}
    return e;
  }
  function pPrim(){
    const t=next();if(!t)throw unexpected();
    switch(t.t){
      case'num':return{k:'lit',v:t.v};case'sq':return{k:'lit',v:t.v};case'dq':return{k:'dq',v:t.v};case'var':return{k:'var',n:t.v};
      case'paren':return{k:'paren',raw:t.v};case'subx':return{k:'subx',raw:t.v};case'arr':return{k:'arr',raw:t.v};case'ht':return{k:'ht',raw:t.v};case'sb':return{k:'sb',raw:t.v};
      case'word':return{k:'word',v:t.v};case'type':return{k:'type',v:t.v};
    }
    throw unexpected(t);
  }
  if(!T.length)return{k:'lit',v:null};
  const e=pLogic();if(p<T.length)throw unexpected(T[p]);return e;
}
