window.AcademieSim=(function(){
'use strict';
/* =========================================================
   Simulateur pédagogique CMD / Windows PowerShell 5.1
   Poste PC-IT-01, domaine contoso.local, session CONTOSO\it.tech (élevée)
   ========================================================= */
const r=String.raw;
const NOW=new Date();
const ago=(days,h,m,s)=>{const d=new Date(NOW);d.setDate(d.getDate()-days);d.setHours(h==null?9:h,m==null?0:m,s==null?0:s,0);return d;};
const minsAgo=n=>new Date(NOW.getTime()-n*60000);
const pad=(n,w)=>String(n).padStart(w||2,'0');
const fdate=d=>`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
const ftime=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fdt=d=>`${fdate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const JOURS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MOIS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const DAYS_EN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const flong=d=>`${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const nf=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const lc=s=>String(s).toLowerCase();
const utf8len=s=>{let n=0;for(const ch of String(s)){const c=ch.codePointAt(0);n+=c<128?1:c<2048?2:c<65536?3:4;}return n;};
const hash32=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const fakeHash=(s,len)=>{let o='';let h=hash32(s);while(o.length<len){h=Math.imul(h^(h>>>15),2246822507)>>>0;h=Math.imul(h^(h>>>13),3266489909)>>>0;o+=h.toString(16).toUpperCase().padStart(8,'0');}return o.slice(0,len);};
const guid=s=>{const h=fakeHash('g'+s,32).toLowerCase();return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;};
const wild=p=>new RegExp('^'+String(p).replace(/[.+^${}()|\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$','i');
const hasWild=s=>/[*?]/.test(s);

/* ---------- textes statiques ---------- */
function parseOut(txt){const o={};let k=null,buf=[];for(const l of String(txt||'').replace(/\r/g,'').split('\n')){const m=/^@@ (.+)$/.exec(l);if(m){if(k)o[k]=buf.join('\n').replace(/\n+$/,'');k=m[1].trim();buf=[];}else if(k)buf.push(l);}if(k)o[k]=buf.join('\n').replace(/\n+$/,'');return o;}
function grabOut(){try{return Array.from(document.querySelectorAll('script[type="text/x-simout"]')).map(s=>s.textContent).join('\n');}catch(e){return '';}}

/* ---------- environnement ---------- */
const ME={user:'it.tech',dom:'CONTOSO',fqdn:'contoso.local',pc:'PC-IT-01',ip:'192.168.10.42',mask:'255.255.255.0',gw:'192.168.10.1',dns:['192.168.10.5','192.168.10.6'],mac:'D4-81-D7-3A-6E-2C',home:r`C:\Users\it.tech`};
function baseEnv(){return{
  ALLUSERSPROFILE:r`C:\ProgramData`,APPDATA:r`C:\Users\it.tech\AppData\Roaming`,CommonProgramFiles:r`C:\Program Files\Common Files`,
  COMPUTERNAME:'PC-IT-01',ComSpec:r`C:\Windows\system32\cmd.exe`,HOMEDRIVE:'C:',HOMEPATH:r`\Users\it.tech`,
  LOCALAPPDATA:r`C:\Users\it.tech\AppData\Local`,LOGONSERVER:r`\\SRV-AD01`,NUMBER_OF_PROCESSORS:'20',OS:'Windows_NT',
  Path:r`C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Program Files\7-Zip;C:\Tools\Sysinternals`,
  PATHEXT:'.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC;.CPL',PROCESSOR_ARCHITECTURE:'AMD64',
  PROCESSOR_IDENTIFIER:'Intel64 Family 6 Model 191 Stepping 2, GenuineIntel',ProgramData:r`C:\ProgramData`,
  ProgramFiles:r`C:\Program Files`,'ProgramFiles(x86)':r`C:\Program Files (x86)`,PROMPT:'$P$G',PSModulePath:r`C:\Users\it.tech\Documents\WindowsPowerShell\Modules;C:\Program Files\WindowsPowerShell\Modules;C:\Windows\system32\WindowsPowerShell\v1.0\Modules`,
  PUBLIC:r`C:\Users\Public`,SESSIONNAME:'Console',SystemDrive:'C:',SystemRoot:r`C:\Windows`,
  TEMP:r`C:\Users\it.tech\AppData\Local\Temp`,TMP:r`C:\Users\it.tech\AppData\Local\Temp`,
  USERDNSDOMAIN:'CONTOSO.LOCAL',USERDOMAIN:'CONTOSO',USERDOMAIN_ROAMINGPROFILE:'CONTOSO',USERNAME:'it.tech',USERPROFILE:r`C:\Users\it.tech`,windir:r`C:\Windows`
};}

/* ---------- système de fichiers ---------- */
function D(name,kids,o){o=o||{};const n={d:true,name,kids:new Map(),t:o.t||ago(25,10,12),c:o.c||ago(300),attr:o.attr||'',acl:o.acl||null};(kids||[]).forEach(k=>n.kids.set(lc(k.name),k));return n;}
function F(name,content,o){o=o||{};content=content==null?'':content;return{d:false,name,content,size:o.size!=null?o.size:utf8len(content),t:o.t||ago(3,14,20),c:o.c||ago(40),attr:o.attr!=null?o.attr:'a',bin:!!o.bin};}
function buildFS(OUT){
  const t=k=>OUT['file:'+k]||'';
  const C=D('C:',[
    D('Data',[
      D('Compta',[F('bilan_2025.xlsx','',{size:248320,bin:true,t:ago(12,17,4)}),F('factures_septembre.pdf','',{size:1843211,bin:true,t:ago(8,11,32)}),F('notes_de_frais.xlsx','',{size:56320,bin:true,t:ago(2,9,15)}),D('Archives',[F('bilan_2024.xlsx','',{size:231424,bin:true,t:ago(280)})],{t:ago(280)})],{t:ago(2,9,15)}),
      D('RH',[F('planning_octobre.xlsx','',{size:88064,bin:true,t:ago(4,16,2)}),D('Contrats',[F('modele_CDI.docx','',{size:41210,bin:true,t:ago(90)})],{t:ago(90)})],{t:ago(4,16,2)}),
      D('Partage',[F('procedure_imprimante.pdf','',{size:412330,bin:true,t:ago(30)}),F('lisezmoi.txt',t('lisezmoi.txt'),{t:ago(60)})],{t:ago(30)}),
      F('nouveaux.csv',t('nouveaux.csv'),{t:ago(1,10,5)}),
      F('utilisateurs_a_creer.csv',t('utilisateurs_a_creer.csv'),{t:ago(1,10,7)})
    ],{t:ago(1,10,7)}),
    D('Logs',[F('backup_2026-10-06.log',t('backup_2026-10-06.log'),{t:ago(2,23,47)}),F('backup_2026-10-07.log',t('backup_2026-10-07.log'),{t:ago(1,23,52)}),F('app.log',t('app.log'),{t:ago(0,8,40)}),F('install.log',t('install.log'),{t:ago(15)})],{t:ago(0,8,40)}),
    D('PerfLogs',[],{t:ago(400)}),
    D('Program Files',[D('7-Zip',[F('7z.exe','',{size:572416,bin:true})]),D('Google',[D('Chrome',[D('Application',[F('chrome.exe','',{size:2934272,bin:true})])])]),D('Microsoft Office',[D('root',[D('Office16',[F('OUTLOOK.EXE','',{size:43129344,bin:true}),F('EXCEL.EXE','',{size:69458432,bin:true})])])]),D('WindowsPowerShell',[D('Modules',[])])],{t:ago(40)}),
    D('Program Files (x86)',[D('Microsoft',[])],{t:ago(120)}),
    D('ProgramData',[],{attr:'h',t:ago(1)}),
    D('Scripts',[F('sauvegarde.bat',t('sauvegarde.bat'),{t:ago(30)}),F('inventaire.ps1',t('inventaire.ps1'),{t:ago(20)}),F('diag_reseau.bat',t('diag_reseau.bat'),{t:ago(45)}),F('nettoyage_temp.ps1',t('nettoyage_temp.ps1'),{t:ago(10)})],{t:ago(10)}),
    D('Temp',[F('install_imprimante.log',t('install_imprimante.log'),{t:ago(6)}),F('~DF8E21.tmp','',{size:65536,bin:true,t:ago(9)}),F('~DF9A03.tmp','',{size:131072,bin:true,t:ago(9)}),D('cache',[F('a1.dat','',{size:2048000,bin:true}),F('a2.dat','',{size:1048576,bin:true})],{t:ago(9)})],{t:ago(6)}),
    D('Tools',[D('Sysinternals',[F('PsExec.exe','',{size:716176,bin:true}),F('PsExec64.exe','',{size:833472,bin:true}),F('Autoruns64.exe','',{size:2340216,bin:true}),F('procexp64.exe','',{size:2601840,bin:true})])],{t:ago(70)}),
    D('Users',[
      D('smartin',[D('Documents',[D('Fichiers Outlook',[F('Sophie_Martin.pst','',{size:4509715660,bin:true,t:ago(1)})],{t:ago(1)})])],{t:ago(1)}),
      D('it.tech',[
        D('AppData',[D('Local',[D('Temp',[F('chrome_installer.log','',{size:5120}),F('tmp4F2A.tmp','',{size:204800,bin:true})])]),D('Roaming',[])],{attr:'h'}),
        D('Desktop',[F('notes.txt',t('notes.txt'),{t:ago(0,9,12)}),F('Raccourci SRV-FICHIERS.lnk','',{size:1450,bin:true})],{t:ago(0,9,12)}),
        D('Documents',[F('rapport_parc.xlsx','',{size:73216,bin:true,t:ago(5)}),F('procedure_vpn.docx','',{size:184320,bin:true,t:ago(33)}),F('mots_de_passe.txt','',{size:0,t:ago(200)}),D('WindowsPowerShell',[])],{t:ago(5)}),
        D('Downloads',[F('setup_imprimante.exe','',{size:48234496,bin:true,t:ago(6)}),F('Win11_24H2_French_x64.iso','',{size:5819484160,bin:true,t:ago(50)}),F('rapport_incident.pdf','',{size:308224,bin:true,t:ago(1)})],{t:ago(1)}),
        F('NTUSER.DAT','',{size:3407872,attr:'ahs',bin:true})
      ],{t:ago(0,9,12)}),
      D('jdupont',[D('Desktop',[]),D('Documents',[F('budget_2026.xlsx','',{size:120320,bin:true}),D('Fichiers Outlook',[F('archives_2024.pst','',{size:1932735283,bin:true,t:ago(300)})],{t:ago(300)})])],{t:ago(1)}),
      D('Public',[D('Desktop',[])],{t:ago(200)})
    ],{t:ago(0,9,12)}),
    D('Windows',[
      D('System32',[D('drivers',[D('etc',[F('hosts',t('hosts'),{t:ago(400)})])]),D('spool',[D('PRINTERS',[F('FP00012.SHD','',{size:4096,bin:true,t:ago(0,8,31)}),F('FP00012.SPL','',{size:1048576,bin:true,t:ago(0,8,31)})])]),F('cmd.exe','',{size:323584,bin:true}),F('notepad.exe','',{size:201216,bin:true}),F('ipconfig.exe','',{size:35840,bin:true}),F('ping.exe','',{size:22528,bin:true}),F('robocopy.exe','',{size:135168,bin:true}),F('tasklist.exe','',{size:94208,bin:true})],{t:ago(2)}),
      D('Temp',[F('MpCmdRun.log','',{size:18432})]),
      D('Logs',[D('CBS',[F('CBS.log','',{size:10485760})])])
    ],{t:ago(2)}),
    F('pagefile.sys','',{size:4294967296,attr:'ahs',bin:true}),
    F('hiberfil.sys','',{size:6442450944,attr:'ahs',bin:true})
  ],{t:ago(1)});
  const Dd=D('D:',[
    D('Backup',[D('Compta',[F('bilan_2025.xlsx','',{size:248320,bin:true,t:ago(12,17,4)})],{t:ago(1,23,52)})],{t:ago(1,23,52)}),
    D('ISO',[F('Win11_23H2_French_x64.iso','',{size:6655213568,bin:true,t:ago(300)})]),
    D('Archives',[],{t:ago(100)})
  ],{t:ago(1)});
  return {C,D:Dd};
}

/* ---------- réseau ---------- */
const HOSTS=[
  {n:'PC-IT-01',ip:'192.168.10.42',up:true,self:true,ports:[135,445,3389]},
  {n:'passerelle',ip:'192.168.10.1',up:true,ports:[53,80,443]},
  {n:'SRV-AD01',ip:'192.168.10.5',up:true,dc:true,ports:[53,88,135,389,445,464,636,3268,3269,3389]},
  {n:'SRV-AD02',ip:'192.168.10.6',up:true,dc:true,ports:[53,88,135,389,445,464,636,3268,3269,3389]},
  {n:'SRV-FICHIERS',ip:'192.168.10.10',up:true,ports:[135,445,3389]},
  {n:'SRV-IMPRESSION',ip:'192.168.10.12',up:true,ports:[135,445,3389]},
  {n:'SRV-APP01',ip:'192.168.10.20',up:false,ports:[]},
  {n:'PC-COMPTA-01',ip:'192.168.10.60',up:true,ports:[135,445]},
  {n:'PC-COMPTA-02',ip:'192.168.10.61',up:true,ports:[135,445,3389]},
  {n:'PC-RECEP-01',ip:'192.168.10.71',up:true,ports:[135,445]},
  {n:'PC-RECEP-02',ip:'192.168.10.73',up:false,ports:[]},
  {n:'PC-RH-01',ip:'192.168.10.80',up:true,ports:[135,445]},
  {n:'PC-DIR-01',ip:'192.168.10.90',up:true,ports:[135,445,3389]},
  {n:'LAP-VENTES-01',ip:'192.168.10.112',up:true,ports:[135,445]},
  {n:'PC-SPA-01',ip:'192.168.10.130',up:false,ports:[]},
  {n:'IMP-RECEP',ip:'192.168.10.150',up:true,ports:[80,443,631,9100]},
  {n:'google.com',ip:'142.250.201.174',up:true,ext:true,ports:[80,443]},
  {n:'www.google.com',ip:'142.250.201.164',up:true,ext:true,ports:[80,443]},
  {n:'microsoft.com',ip:'20.76.201.171',up:false,ext:true,icmpBlocked:true,ports:[80,443]},
  {n:'www.microsoft.com',ip:'23.55.112.39',up:true,ext:true,ports:[80,443]},
  {n:'outlook.office365.com',ip:'52.97.211.162',up:true,ext:true,ports:[443]},
  {n:'dns.google',ip:'8.8.8.8',up:true,ext:true,ports:[53,443]},
  {n:'one.one.one.one',ip:'1.1.1.1',up:true,ext:true,ports:[53,443]},
  {n:'localhost',ip:'127.0.0.1',up:true,self:true,ports:[135,445]}
];
function findHost(q){
  if(q==null)return null;q=lc(String(q).replace(/^\\\\/,'').replace(/\.$/,''));
  if(q==='127.0.0.1'||q==='localhost'||q==='::1')return HOSTS.find(h=>h.n==='localhost');
  if(q==='.')return HOSTS[0];
  const short=q.replace(/\.contoso\.local$/,'');
  return HOSTS.find(h=>lc(h.n)===short||h.ip===q||lc(h.n)===q)||null;
}
const isIp=s=>/^\d{1,3}(\.\d{1,3}){3}$/.test(s);
const fqdnOf=h=>h.ext?h.n:(h.n==='passerelle'?'passerelle.contoso.local':h.n+'.contoso.local');

/* ---------- services ---------- */
function baseServices(){return[
  ['AudioSrv','Audio Windows','Running','Automatic'],
  ['BITS','Service de transfert intelligent en arrière-plan','Running','Manual'],
  ['Dhcp','Client DHCP','Running','Automatic'],
  ['Dnscache','Client DNS','Running','Automatic'],
  ['EventLog','Journal d’événements Windows','Running','Automatic'],
  ['LanmanServer','Serveur','Running','Automatic'],
  ['LanmanWorkstation','Station de travail','Running','Automatic'],
  ['MpsSvc','Pare-feu Windows Defender','Running','Automatic'],
  ['Netlogon','Netlogon','Running','Automatic'],
  ['RemoteRegistry','Registre à distance','Stopped','Manual'],
  ['Schedule','Planificateur de tâches','Running','Automatic'],
  ['Spooler','Spouleur d’impression','Running','Automatic'],
  ['SysMain','SysMain','Running','Automatic'],
  ['TermService','Services Bureau à distance','Running','Manual'],
  ['VSS','Cliché instantané des volumes','Stopped','Manual'],
  ['W32Time','Temps Windows','Running','Manual'],
  ['WinDefend','Service Antivirus Microsoft Defender','Running','Automatic'],
  ['WinRM','Gestion à distance de Windows (Gestion WSM)','Stopped','Manual'],
  ['wuauserv','Windows Update','Stopped','Manual'],
  ['wscsvc','Centre de sécurité','Running','Automatic'],
  ['VeeamAgent','Veeam Agent for Microsoft Windows','Running','Automatic'],
  ['AnyDesk','AnyDesk Service','Stopped','Disabled']
].map(a=>({Name:a[0],DisplayName:a[1],Status:a[2],StartType:a[3]}));}
const SVC_DEPS={lanmanserver:['Browser (Explorateur d’ordinateurs)'],};

/* ---------- processus ---------- */
function baseProcs(){
  const P=(Name,Id,ses,WS,CPU,Handles,extra)=>Object.assign({Name,Id,SessionName:ses,SI:ses==='Console'?1:0,WS,CPU,Handles,Svc:''},extra||{});
  return[
    P('System Idle Process',0,'Services',8192,0,0,{sys:true}),P('System',4,'Services',1630208,612.4,6234,{sys:true}),
    P('smss',512,'Services',1196032,0.1,57,{sys:true}),P('csrss',740,'Services',5779456,4.2,812,{sys:true}),
    P('wininit',836,'Services',6762496,0.2,165,{sys:true}),P('services',904,'Services',11534336,18.6,1102,{sys:true}),
    P('lsass',924,'Services',26681344,22.9,1630,{sys:true}),
    P('svchost',1088,'Services',33521664,41.2,1430,{Svc:'BrokerInfrastructure, DcomLaunch, PlugPlay, Power'}),
    P('svchost',1240,'Services',18284544,9.8,1210,{Svc:'RpcEptMapper, RpcSs'}),
    P('svchost',1612,'Services',22097920,6.1,620,{Svc:'Dnscache'}),
    P('svchost',1876,'Services',15671296,3.4,480,{Svc:'EventLog'}),
    P('svchost',2032,'Services',9314304,1.2,210,{Svc:'Dhcp'}),
    P('svchost',2144,'Services',12201984,2.8,350,{Svc:'Schedule'}),
    P('spoolsv',2280,'Services',17829888,3.5,560,{Svc:'Spooler',Path:r`C:\Windows\System32\spoolsv.exe`}),
    P('svchost',2416,'Services',24719360,12.6,640,{Svc:'LanmanServer'}),
    P('MsMpEng',3104,'Services',268435456,1180.5,1450,{Svc:'WinDefend',sys:true}),
    P('VeeamAgent',3320,'Services',95420416,64.1,720,{Svc:'VeeamAgent'}),
    P('explorer',5120,'Console',189054976,233.8,3420,{Path:r`C:\Windows\explorer.exe`,Company:'Microsoft Corporation'}),
    P('ms-teams',5888,'Console',412041216,522.4,1510,{Path:r`C:\Program Files\WindowsApps\MSTeams\ms-teams.exe`,Company:'Microsoft Corporation'}),
    P('OUTLOOK',7344,'Console',356524032,318.2,4210,{Path:r`C:\Program Files\Microsoft Office\root\Office16\OUTLOOK.EXE`,Company:'Microsoft Corporation'}),
    P('EXCEL',7820,'Console',158334976,48.9,1360,{Path:r`C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE`,Company:'Microsoft Corporation'}),
    P('chrome',6216,'Console',298139648,402.7,2210,{Path:r`C:\Program Files\Google\Chrome\Application\chrome.exe`,Company:'Google LLC'}),
    P('chrome',6480,'Console',142606336,96.3,410,{Path:r`C:\Program Files\Google\Chrome\Application\chrome.exe`,Company:'Google LLC'}),
    P('chrome',6744,'Console',88342528,31.1,330,{Path:r`C:\Program Files\Google\Chrome\Application\chrome.exe`,Company:'Google LLC'}),
    P('notepad',8812,'Console',19410944,0.4,240,{Path:r`C:\Windows\System32\notepad.exe`,Company:'Microsoft Corporation'}),
    P('powershell',9140,'Console',87031808,3.1,690,{Path:r`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`,Company:'Microsoft Corporation'}),
    P('cmd',9300,'Console',5341184,0.1,74,{Path:r`C:\Windows\System32\cmd.exe`,Company:'Microsoft Corporation'}),
    P('conhost',9312,'Console',16871424,0.6,260,{Path:r`C:\Windows\System32\conhost.exe`,Company:'Microsoft Corporation'})
  ];
}

/* ---------- Active Directory ---------- */
const DOM={dns:'contoso.local',nb:'CONTOSO',dn:'DC=contoso,DC=local',sid:'S-1-5-21-3623811015-3361044348-30300820',pdc:'SRV-AD01.contoso.local'};
const OUDN=o=>`OU=${o},OU=Utilisateurs,${DOM.dn}`;
function baseAD(){
  let rid=1100;
  const U=(sam,g,s,ou,dept,title,o)=>{o=o||{};rid++;const name=s?`${g} ${s}`:g;const dnou=o.ouDn||OUDN(ou);
    return Object.assign({SamAccountName:sam,GivenName:g,Surname:s||null,Name:name,DisplayName:name,UserPrincipalName:`${sam}@${DOM.dns}`,EmailAddress:o.noMail?null:`${sam.replace('.','-')}@contoso-hotels.com`,
      Department:dept,Title:title,Company:'Contoso Hôtels',Office:o.office||'Siège',telephoneNumber:o.tel||null,Description:o.desc||null,
      Enabled:o.enabled!==false,LockedOut:!!o.locked,PasswordExpired:!!o.pexp,PasswordNeverExpires:!!o.pnever,
      PasswordLastSet:o.pls||ago(26,8,41,12),LastLogonDate:o.lld===null?null:(o.lld||ago(0,8,2,45)),BadLogonCount:o.bad||0,
      LastBadPasswordAttempt:o.lbpa||null,whenCreated:o.wc||ago(700),AccountExpirationDate:o.exp||null,logonCount:o.lc||412,
      HomeDirectory:o.home===false?null:'\\\\SRV-FICHIERS\\Users$\\'+sam,MemberOf:[],Manager:o.mgr||null,
      DistinguishedName:`CN=${name},${dnou}`,ObjectClass:'user',ObjectGUID:guid(sam),SID:`${DOM.sid}-${rid}`},{});};
  const users=[
    U('jdupont','Jean','Dupont','Comptabilite','Comptabilité','Comptable',{tel:'04 93 00 12 10'}),
    U('mlefevre','Marie','Lefèvre','RH','Ressources humaines','Responsable RH',{locked:true,bad:5,lbpa:ago(0,8,47,3),tel:'04 93 00 12 20'}),
    U('smartin','Sophie','Martin','Direction','Direction','Directrice commerciale',{tel:'04 93 00 12 01'}),
    U('kbenali','Karim','Benali','Reception','Réception','Chef de réception',{office:'Hall',tel:'04 93 00 12 30'}),
    U('lbernard','Lucas','Bernard','Informatique','Informatique','Technicien support',{tel:'04 93 00 12 40'}),
    U('cmoreau','Camille','Moreau','Reception','Réception','Réceptionniste',{enabled:false,lld:ago(45,18,2),office:'Hall',desc:'Départ le '+fdate(ago(44))}),
    U('tpetit','Thomas','Petit','Maintenance','Maintenance','Technicien maintenance',{lld:ago(128,7,30)}),
    U('jrobert','Julie','Robert','Comptabilite','Comptabilité','Assistante comptable'),
    U('ngirard','Nicolas','Girard','Restauration','Restauration','Chef de cuisine',{lld:ago(95,10,11)}),
    U('eroux','Emma','Roux','Ventes','Ventes','Chargée de ventes',{pexp:true,pls:ago(96,9,0)}),
    U('hfontaine','Hugo','Fontaine','Securite','Sécurité','Agent de sécurité'),
    U('lchevalier','Léa','Chevalier','Spa','Spa','Responsable spa'),
    U('agarnier','Antoine','Garnier','Restauration','Restauration','Maître d’hôtel'),
    U('clambert','Chloé','Lambert','Marketing','Marketing','Chargée de communication'),
    U('it.tech','IT','Tech','Informatique','Informatique','Administrateur systèmes',{tel:'04 93 00 12 41'}),
    U('svc_backup','svc_backup',null,null,null,null,{ouDn:`OU=Comptes de service,${DOM.dn}`,pnever:true,desc:'Compte de service sauvegarde (Veeam)',noMail:true,home:false,pls:ago(410)}),
    U('stagiaire.ete','Stagiaire','Été','Desactives',null,'Stagiaire',{enabled:false,lld:ago(400),ouDn:`OU=Desactives,${DOM.dn}`})
  ];
  users.forEach(u=>{if(u.SamAccountName==='svc_backup'){u.Department=null;u.Title=null;u.GivenName=null;}});
  const G=(name,scope,members,desc)=>({Name:name,SamAccountName:name,GroupScope:scope,GroupCategory:'Security',members,Description:desc||null,
    DistinguishedName:`CN=${name},OU=Groupes,${DOM.dn}`,ObjectClass:'group',ObjectGUID:guid(name),SID:`${DOM.sid}-${(++rid)}`});
  const groups=[
    G('GG_Compta','Global',['jdupont','jrobert'],'Comptabilité'),
    G('GG_RH','Global',['mlefevre'],'Ressources humaines'),
    G('GG_Direction','Global',['smartin'],'Direction'),
    G('GG_Reception','Global',['kbenali','cmoreau'],'Réception'),
    G('GG_IT','Global',['lbernard','it.tech'],'Service informatique'),
    G('GG_Restauration','Global',['ngirard','agarnier'],'Restaurant et cuisine'),
    G('GG_VPN','Global',['smartin','eroux','lbernard'],'Accès VPN nomade'),
    G('GG_Postes_Reception','Global',['PC-RECEP-02$'],'Postes de l’accueil (filtrage GPO kiosque)'),
    G('DL_Partage_Compta_RW','DomainLocal',['GG_Compta','GG_Direction'],'Lecture/écriture sur \\\\SRV-FICHIERS\\Compta'),
    G('DL_Partage_RH_RW','DomainLocal',['GG_RH'],'Lecture/écriture sur \\\\SRV-FICHIERS\\RH'),
    G('Admins du domaine','Global',['it.tech','Administrateur'],'Administrateurs désignés du domaine'),
    G('Utilisateurs du domaine','Global',[],'Tous les utilisateurs du domaine')
  ];
  groups.forEach(g=>{if(/Admins du domaine|Utilisateurs du domaine/.test(g.Name))g.DistinguishedName=`CN=${g.Name},CN=Users,${DOM.dn}`;});
  const all=groups.find(g=>g.Name==='Utilisateurs du domaine');all.members=users.map(u=>u.SamAccountName);
  const C=(name,os,ver,lld,ip,o)=>{o=o||{};return{Name:name,SamAccountName:name+'$',DNSHostName:`${name}.${DOM.dns}`,OperatingSystem:os,OperatingSystemVersion:ver,LastLogonDate:lld,IPv4Address:ip,Enabled:o.enabled!==false,Description:o.desc||null,whenCreated:o.wc||ago(500),
    DistinguishedName:`CN=${name},${o.ou||`OU=Postes,OU=Ordinateurs,${DOM.dn}`}`,ObjectClass:'computer',ObjectGUID:guid(name),SID:`${DOM.sid}-${(++rid)}`,UserPrincipalName:null};};
  const W11='Windows 11 Professionnel',W10='Windows 10 Professionnel',S22='Windows Server 2022 Standard',S19='Windows Server 2019 Standard',S16='Windows Server 2016 Standard';
  const SRV=`OU=Serveurs,OU=Ordinateurs,${DOM.dn}`,DCOU=`OU=Domain Controllers,${DOM.dn}`;
  const computers=[
    C('PC-IT-01',W11,'10.0 (26100)',ago(0,7,58),'192.168.10.42'),
    C('PC-COMPTA-01',W11,'10.0 (22631)',ago(1,8,10),'192.168.10.60'),
    C('PC-COMPTA-02',W11,'10.0 (26100)',ago(0,8,5),'192.168.10.61'),
    C('PC-RECEP-01',W11,'10.0 (26100)',ago(0,6,55),'192.168.10.71'),
    C('PC-RECEP-02',W10,'10.0 (19045)',ago(2,6,58),'192.168.10.73'),
    C('PC-RH-01',W11,'10.0 (26100)',ago(0,8,40),'192.168.10.80'),
    C('PC-DIR-01',W11,'10.0 (26100)',ago(3,9,2),'192.168.10.90'),
    C('LAP-VENTES-01',W11,'10.0 (22631)',ago(6,14,20),'192.168.10.112'),
    C('PC-SPA-01',W10,'10.0 (19045)',ago(140,10,0),'192.168.10.130'),
    C('PC-OLD-ACCUEIL',W10,'10.0 (19044)',ago(400,9,0),null,{desc:'Ancien poste accueil'}),
    C('SRV-AD01',S22,'10.0 (20348)',ago(0,3,1),'192.168.10.5',{ou:DCOU,desc:'Contrôleur de domaine (PDC)'}),
    C('SRV-AD02',S22,'10.0 (20348)',ago(0,3,4),'192.168.10.6',{ou:DCOU,desc:'Contrôleur de domaine'}),
    C('SRV-FICHIERS',S19,'10.0 (17763)',ago(0,2,30),'192.168.10.10',{ou:SRV,desc:'Serveur de fichiers'}),
    C('SRV-IMPRESSION',S19,'10.0 (17763)',ago(0,2,35),'192.168.10.12',{ou:SRV,desc:'Serveur d’impression'}),
    C('SRV-APP01',S16,'10.0 (14393)',ago(200,4,0),'192.168.10.20',{ou:SRV,desc:'Ancien serveur applicatif'})
  ];
  const memberOf=(sam)=>groups.filter(g=>g.members.some(m=>lc(m)===lc(sam))).map(g=>g.DistinguishedName);
  users.forEach(u=>{u.MemberOf=memberOf(u.SamAccountName).filter(dn=>!/Utilisateurs du domaine/.test(dn));});
  const ous=['Utilisateurs','Comptabilite','RH','Direction','Reception','Informatique','Maintenance','Restauration','Ventes','Securite','Spa','Marketing'].map(n=>n==='Utilisateurs'?`OU=Utilisateurs,${DOM.dn}`:OUDN(n))
    .concat([`OU=Groupes,${DOM.dn}`,`OU=Ordinateurs,${DOM.dn}`,`OU=Postes,OU=Ordinateurs,${DOM.dn}`,SRV,`OU=Comptes de service,${DOM.dn}`,`OU=Desactives,${DOM.dn}`,DCOU]);
  return{users,groups,computers,ous};
}

/* profil matériel par machine (CIM) */
const MODELS=[['Dell Inc.','OptiPlex 7010'],['Dell Inc.','OptiPlex 3080'],['HP','EliteDesk 800 G6'],['Lenovo','ThinkCentre M70q'],['Dell Inc.','Latitude 5440']];
function hostHw(name){
  const n=lc(name);
  if(n==='pc-it-01')return{man:'Dell Inc.',model:'OptiPlex 7010',serial:'8H2KLM3',ram:16,cpu:'13th Gen Intel(R) Core(TM) i5-13500',cores:14,lp:20,os:'Microsoft Windows 11 Professionnel',ver:'10.0.26100',build:'26100',boot:ago(2,7,58,10),install:new Date(2025,2,14,10,12,33),c:{size:511,free:38.4},user:'CONTOSO\\it.tech'};
  const h=hash32(n);const m=n.startsWith('srv')?['HPE','ProLiant DL360 Gen10']:n.startsWith('lap')?MODELS[4]:MODELS[h%4];
  const ad=findHost(name);const isSrv=n.startsWith('srv');
  const users={'pc-compta-02':'CONTOSO\\jrobert','pc-compta-01':'CONTOSO\\jdupont','pc-recep-01':'CONTOSO\\kbenali','pc-rh-01':'CONTOSO\\mlefevre','pc-dir-01':'CONTOSO\\smartin','lap-ventes-01':'CONTOSO\\eroux'};
  const os={'srv-ad01':['Microsoft Windows Server 2022 Standard','10.0.20348','20348'],'srv-ad02':['Microsoft Windows Server 2022 Standard','10.0.20348','20348'],'srv-fichiers':['Microsoft Windows Server 2019 Standard','10.0.17763','17763'],'srv-impression':['Microsoft Windows Server 2019 Standard','10.0.17763','17763'],'pc-recep-02':['Microsoft Windows 10 Professionnel','10.0.19045','19045'],'pc-compta-01':['Microsoft Windows 11 Professionnel','10.0.22631','22631']}[n]||['Microsoft Windows 11 Professionnel','10.0.26100','26100'];
  return{man:m[0],model:m[1],serial:isSrv?'CZ'+fakeHash(n,8):fakeHash(n,7).replace(/[0-9]/g,d=>'0123456789'[(+d)]).slice(0,7),ram:isSrv?64:[8,16,16,32][h%4],cpu:isSrv?'Intel(R) Xeon(R) Silver 4210R CPU @ 2.40GHz':['Intel(R) Core(TM) i5-10500 CPU @ 3.10GHz','12th Gen Intel(R) Core(TM) i5-12500','Intel(R) Core(TM) i7-10700 CPU @ 2.90GHz'][h%3],cores:isSrv?10:6,lp:isSrv?20:12,os:os[0],ver:os[1],build:os[2],boot:ago(h%9,6,30),install:ago(300+h%400),c:{size:isSrv?127:237,free:isSrv?(n==='srv-fichiers'?3.1:41.7):(20+h%90)},user:users[n]||null,ip:ad?ad.ip:null};
}

/* ---------- registre ---------- */
function baseReg(){
  const K=(vals,kids)=>({vals:vals||{},kids:kids||{}});
  const V=(type,data)=>({type,data});
  const unin=(name,ver,pub,date,size)=>K({DisplayName:V('REG_SZ',name),DisplayVersion:V('REG_SZ',ver),Publisher:V('REG_SZ',pub),InstallDate:V('REG_SZ',date),EstimatedSize:V('REG_DWORD',size)});
  return{
    HKLM:K({},{
      SOFTWARE:K({},{
        Microsoft:K({},{
          'Windows NT':K({},{CurrentVersion:K({ProductName:V('REG_SZ','Windows 10 Pro'),DisplayVersion:V('REG_SZ','24H2'),CurrentBuild:V('REG_SZ','26100'),EditionID:V('REG_SZ','Professional'),RegisteredOwner:V('REG_SZ','Contoso Hôtels'),InstallationType:V('REG_SZ','Client')})}),
          Windows:K({},{CurrentVersion:K({ProgramFilesDir:V('REG_SZ',r`C:\Program Files`)},{
            Run:K({SecurityHealth:V('REG_EXPAND_SZ',r`%windir%\system32\SecurityHealthSystray.exe`),VeeamTray:V('REG_SZ',r`"C:\Program Files\Veeam\Endpoint Backup\Veeam.EndPoint.Tray.exe"`)}),
            Uninstall:K({},{
              '7-Zip':unin('7-Zip 24.08 (x64)','24.08','Igor Pavlov','20250314',5800),
              '{23170F69-40C1-2702-2408-000001000000}':unin('Google Chrome','129.0.6668.90','Google LLC','20260930',112000),
              'O365ProPlusRetail - fr-fr':unin('Microsoft 365 Apps for enterprise - fr-fr','16.0.18025.20140','Microsoft Corporation','20260912',2350000),
              '{AC76BA86-7AD7-1036-7B44-AC0F074E4100}':unin('Adobe Acrobat (64-bit)','24.003.20180','Adobe','20260801',780000),
              'VeeamAgent':unin('Veeam Agent for Microsoft Windows','6.2.0.121','Veeam Software Group GmbH','20260611',350000)
            })
          })})
        }),
        Policies:K({},{Microsoft:K({},{Windows:K({},{WindowsUpdate:K({WUServer:V('REG_SZ','http://srv-wsus:8530')},{AU:K({NoAutoUpdate:V('REG_DWORD',0),AUOptions:V('REG_DWORD',4)})})})})})
      }),
      SYSTEM:K({},{CurrentControlSet:K({},{
        Services:K({},{Spooler:K({Start:V('REG_DWORD',2),ImagePath:V('REG_EXPAND_SZ',r`%SystemRoot%\System32\spoolsv.exe`),DisplayName:V('REG_SZ','Spouleur d’impression')}),WinRM:K({Start:V('REG_DWORD',3),ImagePath:V('REG_EXPAND_SZ',r`%SystemRoot%\System32\svchost.exe -k NetworkService -p`)})}),
        Control:K({},{'Terminal Server':K({fDenyTSConnections:V('REG_DWORD',0)}),ComputerName:K({},{ComputerName:K({ComputerName:V('REG_SZ','PC-IT-01')})})})
      })})
    }),
    HKCU:K({},{
      Software:K({},{Microsoft:K({},{Windows:K({},{CurrentVersion:K({},{Run:K({OneDrive:V('REG_SZ',r`"C:\Program Files\Microsoft OneDrive\OneDrive.exe" /background`),'com.squirrel.Teams.Teams':V('REG_SZ','ms-teams.exe')})})})})}),
      'Control Panel':K({},{Desktop:K({Wallpaper:V('REG_SZ',r`C:\Windows\Web\Wallpaper\Contoso\fond.jpg`),ScreenSaveTimeOut:V('REG_SZ','600')})}),
      Environment:K({TEMP:V('REG_EXPAND_SZ',r`%USERPROFILE%\AppData\Local\Temp`)})
    })
  };
}

/* ---------- journaux d'événements ---------- */
function baseEvents(){
  const E=(log,d,Id,lvl,prov,msg)=>({LogName:log,TimeCreated:d,Id,LevelDisplayName:lvl,ProviderName:prov,Message:msg,MachineName:'PC-IT-01.contoso.local'});
  const L={
    System:[
      E('System',minsAgo(12),7036,'Information','Service Control Manager','Le service Windows Update est entré dans l’état : arrêté.'),
      E('System',minsAgo(75),7036,'Information','Service Control Manager','Le service Windows Update est entré dans l’état : en cours d’exécution.'),
      E('System',ago(0,8,31,2),7031,'Erreur','Service Control Manager','Le service Spouleur d’impression s’est arrêté de façon inattendue. Ceci s’est produit 1 fois(s). L’action corrective suivante va être effectuée dans 5000 millisecondes : Redémarrer le service.'),
      E('System',ago(0,8,0,12),10016,'Avertissement','Microsoft-Windows-DistributedCOM','Les paramètres d’autorisation propres à l’application n’accordent pas l’autorisation Activation locale pour l’application serveur COM avec le CLSID {2593F8B9-4EAF-457C-B68A-50F6B8EA6B54}.'),
      E('System',ago(2,7,58,40),6013,'Information','EventLog','La durée de fonctionnement du système est de 22 secondes.'),
      E('System',ago(2,7,58,31),6005,'Information','EventLog','Le service Journal des événements a été démarré.'),
      E('System',ago(2,7,58,30),6008,'Erreur','EventLog',`L’arrêt système précédent à ${ftime(ago(2,7,41))}:12 le ${fdate(ago(2))} n’était pas prévu.`),
      E('System',ago(2,7,58,29),41,'Critique','Microsoft-Windows-Kernel-Power','Le système a redémarré sans s’arrêter correctement au préalable. Cette erreur peut se produire si le système ne répond plus, s’est bloqué ou a perdu son alimentation de manière inattendue.'),
      E('System',ago(4,19,2,11),1074,'Information','User32','Le processus C:\\Windows\\system32\\shutdown.exe (PC-IT-01) a lancé l’opération Redémarrer pour le compte de l’utilisateur CONTOSO\\it.tech pour la raison suivante : Aucun titre pour cette raison.'),
      E('System',ago(4,19,2,15),6006,'Information','EventLog','Le service Journal des événements a été arrêté.'),
      E('System',ago(5,10,14,2),7000,'Erreur','Service Control Manager','Le service AnyDesk Service n’a pas pu démarrer en raison de l’erreur : Le service ne peut pas être démarré parce qu’il est désactivé ou qu’aucun périphérique activé ne lui est associé.')
    ],
    Application:[
      E('Application',ago(0,10,22,8),1000,'Erreur','Application Error','Nom de l’application défaillante OUTLOOK.EXE, version : 16.0.18025.20140, horodatage : 0x66f2a1c3\nNom du module défaillant : mso20win32client.dll\nCode d’exception : 0xc0000005'),
      E('Application',ago(0,10,22,9),1001,'Information','Windows Error Reporting','Compartiment d’erreurs , type 0\nNom d’événement : APPCRASH\nRéponse : Non disponible'),
      E('Application',ago(1,16,5,40),11707,'Information','MsiInstaller','Produit : Pilote imprimante Contoso -- Installation terminée avec succès.'),
      E('Application',ago(1,23,52,1),190,'Information','Veeam Agent','La tâche de sauvegarde « Postes - Quotidien » s’est terminée avec succès.'),
      E('Application',ago(2,23,47,5),190,'Avertissement','Veeam Agent','La tâche de sauvegarde « Postes - Quotidien » s’est terminée avec des avertissements : 1 fichier ignoré.')
    ],
    Security:[
      E('Security',ago(0,8,2,40),4624,'Information','Microsoft-Windows-Security-Auditing','Un compte a été correctement connecté.\n\nType d’ouverture de session :\t\t2\nNom du compte :\t\tit.tech\nDomaine du compte :\t\tCONTOSO'),
      E('Security',ago(0,7,59,2),4625,'Information','Microsoft-Windows-Security-Auditing','Échec d’ouverture de session d’un compte.\n\nNom du compte :\t\tit.tech\nRaison de l’échec :\t\tNom d’utilisateur inconnu ou mot de passe incorrect.'),
      E('Security',ago(0,7,58,50),4672,'Information','Microsoft-Windows-Security-Auditing','Privilèges spéciaux attribués à la nouvelle ouverture de session.\nNom du compte :\t\tit.tech')
    ]
  };
  const DC=[
    E('Security',ago(0,8,47,3),4740,'Information','Microsoft-Windows-Security-Auditing','Un compte d’utilisateur a été verrouillé.\n\nObjet :\n\tID de sécurité :\t\tS-1-5-18\n\tNom du compte :\t\tSRV-AD01$\n\tDomaine du compte :\t\tCONTOSO\n\nCompte verrouillé :\n\tID de sécurité :\t\tCONTOSO\\mlefevre\n\tNom du compte :\t\tmlefevre\n\nInformations supplémentaires :\n\tNom de l’ordinateur appelant :\tPC-RECEP-02'),
    E('Security',ago(0,8,46,58),4625,'Information','Microsoft-Windows-Security-Auditing','Échec d’ouverture de session d’un compte.\n\nNom du compte :\t\tmlefevre\nNom de la station de travail :\tPC-RECEP-02\nRaison de l’échec :\t\tNom d’utilisateur inconnu ou mot de passe incorrect.'),
    E('Security',ago(0,8,46,40),4625,'Information','Microsoft-Windows-Security-Auditing','Échec d’ouverture de session d’un compte.\n\nNom du compte :\t\tmlefevre\nNom de la station de travail :\tPC-RECEP-02\nRaison de l’échec :\t\tNom d’utilisateur inconnu ou mot de passe incorrect.'),
    E('Security',ago(3,9,12,0),4767,'Information','Microsoft-Windows-Security-Auditing','Un compte d’utilisateur a été déverrouillé.\n\nCompte cible :\n\tNom du compte :\t\tjdupont'),
    E('Security',ago(1,14,2,0),4720,'Information','Microsoft-Windows-Security-Auditing','Un compte d’utilisateur a été créé.\n\nNouveau compte :\n\tNom du compte :\t\tclambert'),
    E('Security',ago(1,14,3,0),4728,'Information','Microsoft-Windows-Security-Auditing','Un membre a été ajouté à un groupe global de sécurité.\n\nMembre : CN=Chloé Lambert\nGroupe : GG_VPN')
  ];
  DC.forEach(e=>e.MachineName='SRV-AD01.contoso.local');
  return{L,DC};
}
