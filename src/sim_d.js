
/* =========================================================
   Commandes CMD : réseau
   ========================================================= */
function curHostName(){return st.psctx&&st.psctx.host?st.psctx.host:'PC-IT-01';}
function curIp(){if(st.psctx&&st.psctx.host){const h=findHost(st.psctx.host);return h?h.ip:ME.ip;}return ME.ip;}
CMD.ipconfig=function(args,ctx){
  const o=sw(args);const all=o.has('all');const out=s=>ctx.out.push(L(s));
  if(o.has('flushdns')){out('');out('Configuration IP de Windows');out('');out('Cache de résolution DNS vidé.');st.dnsCache=false;return 0;}
  if(o.has('registerdns')){out('');out('Configuration IP de Windows');out('');out('L’inscription des enregistrements de ressources DNS pour toutes les cartes de cet ordinateur a été initialisée. Toute erreur sera signalée dans l’Observateur d’événements dans 15 minutes.');return 0;}
  if(o.has('displaydns')){out('');out('Configuration IP de Windows');out('');if(st.dnsCache===false){out('Impossible d’afficher le cache de résolution DNS.');return 0;}
    [['srv-fichiers.contoso.local','192.168.10.10'],['outlook.office365.com','52.97.211.162'],['srv-ad01.contoso.local','192.168.10.5']].forEach(([n,ip])=>{out(`    ${n}`);out('    ----------------------------------------');out(`    Nom d’enregistrement . . . . . : ${n}`);out('    Type d’enregistrement . . . . : 1');out('    Durée de vie . . . . . . . . . : 1174');out('    Longueur de données . . . . . : 4');out('    Section . . . . . . . . . . . : Réponse');out(`    Enregistrement A (hôte). . . . : ${ip}`);out('');});return 0;}
  if(o.has('release')){st.ipOk=false;}
  if(o.has('renew')){st.ipOk=true;}
  const ip=curIp();const rem=!!(st.psctx&&st.psctx.host);
  out('');out('Configuration IP de Windows');out('');
  if(all){out(`   Nom de l’hôte . . . . . . . . . . : ${curHostName()}`);out('   Suffixe DNS principal . . . . . . : contoso.local');out('   Type de noeud. . . . . . . . . .  : Hybride');out('   Routage IP activé . . . . . . . . : Non');out('   Proxy WINS activé . . . . . . . . : Non');out('   Liste de recherche du suffixe DNS.: contoso.local');out('');}
  out('Carte Ethernet Ethernet :');out('');
  out('   Suffixe DNS propre à la connexion. . . : '+(st.ipOk?'contoso.local':''));
  if(all){out('   Description. . . . . . . . . . . . . . : Intel(R) Ethernet Connection (17) I219-LM');out(`   Adresse physique . . . . . . . . . . . : ${rem?'00-15-5D-'+fakeHash(ip,6).match(/../g).join('-'):ME.mac}`);out('   DHCP activé. . . . . . . . . . . . . . : Oui');out('   Configuration automatique activée. . . : Oui');}
  out(`   Adresse IPv6 de liaison locale. . . . .: fe80::4c1a:9b2e:7d3f:21a5%12${all?'(préféré)':''}`);
  if(st.ipOk||rem){
    out(`   Adresse IPv4. . . . . . . . . . . . . .: ${ip}${all?'(préféré)':''}`);
    out(`   Masque de sous-réseau. . . . . . . . . : ${ME.mask}`);
    if(all){out(`   Bail obtenu. . . . . . . . . . . . . . : ${flong(ago(0,7,58,41)).replace(/ (\d\d:)/,' $1')}`);out(`   Bail expirant. . . . . . . . . . . . . : ${flong(ago(-8,7,58,41))}`);}
    out(`   Passerelle par défaut. . . . . . . . . : ${ME.gw}`);
    if(all){out('   Serveur DHCP . . . . . . . . . . . . . : 192.168.10.5');out('   IAID DHCPv6 . . . . . . . . . . . : 114590167');out('   DUID de client DHCPv6. . . . . . . . : 00-01-00-01-2D-4B-1A-9C-D4-81-D7-3A-6E-2C');out('   Serveurs DNS. . .  . . . . . . . . . . : 192.168.10.5');out('                                       192.168.10.6');out('   NetBIOS sur Tcpip. . . . . . . . . . . : Activé');}
  }else{
    out('   Passerelle par défaut. . . . . . . . . : ');
    if(all)out('   NetBIOS sur Tcpip. . . . . . . . . . . : Activé');
  }
  out('');out('Carte réseau sans fil Wi-Fi :');out('');out('   Statut du média. . . . . . . . . . . . : Média déconnecté');out('   Suffixe DNS propre à la connexion. . . : ');
  if(all){out('   Description. . . . . . . . . . . . . . : Intel(R) Wi-Fi 6E AX211 160MHz');out('   Adresse physique . . . . . . . . . . . : 70-A8-D3-11-42-9B');out('   DHCP activé. . . . . . . . . . . . . . : Oui');out('   Configuration automatique activée. . . : Oui');}
  return 0;
};
function lanUp(h){return st.ipOk&&h&&h.up;}
CMD.ping=function(args,ctx){
  const o=sw(args,['n','l','w','i']);const out=s=>ctx.out.push(L(s));
  const target=o.pos.map(unq).find(x=>x);
  if(!target){outLines('ping_usage').forEach(out);return 1;}
  if(!st.ipOk&&!/^127\.|^localhost$/i.test(target)){if(isIp(target)){out('');out(`Envoi d’une requête 'Ping'  ${target} avec 32 octets de données :`);for(let i=0;i<4;i++)out('PING : échec de la transmission. Défaillance générale.');out('');out(`Statistiques Ping pour ${target}:`);out('    Paquets : envoyés = 4, reçus = 0, perdus = 4 (perte 100%),');return 1;}
    out(`La requête Ping n’a pas pu trouver l’hôte ${target}. Vérifiez le nom et essayez à nouveau.`);return 1;}
  const h=findHost(target);
  if(!h&&!isIp(target)){out(`La requête Ping n’a pas pu trouver l’hôte ${target}. Vérifiez le nom et essayez à nouveau.`);return 1;}
  const ip=h?h.ip:target;const n=o.m.t?(o.m.t===true?6:6):(+o.m.n||4);const size=+o.m.l||32;
  const label=isIp(target)?(o.has('a')&&h?`${fqdnOf(h)} [${ip}]`:ip):`${h.ext?h.n:fqdnOf(h)} [${ip}]`;
  out('');out(`Envoi d’une requête 'Ping'  ${label} avec ${size} octets de données :`);
  let rec=0,times=[];const lan=h&&!h.ext;
  const ttl=h?(h.ext?117:(h.n==='passerelle'||h.n==='IMP-RECEP'?64:128)):128;
  for(let i=0;i<n;i++){
    if(h&&h.up){const t=h.self?0:h.ext?11+((i*7+hash32(ip))%5):(h.n==='passerelle'?0:(i===0?1:0));times.push(t);rec++;out(`Réponse de ${ip} : octets=${size} temps${t<1?'<1ms':'='+t+' ms'} TTL=${ttl}`);}
    else if(lan||(!h&&/^192\.168\.10\./.test(ip))){rec++;out(`Réponse de ${ME.ip} : Impossible de joindre l’hôte de destination.`);}
    else out('Délai d’attente de la demande dépassé.');
  }
  if(o.m.t)out('Control-C');
  out('');out(`Statistiques Ping pour ${ip}:`);out(`    Paquets : envoyés = ${n}, reçus = ${rec}, perdus = ${n-rec} (perte ${Math.round((n-rec)/n*100)}%),`);
  if(times.length){out('Durée approximative des boucles en millisecondes :');out(`    Minimum = ${Math.min(...times)}ms, Maximum = ${Math.max(...times)}ms, Moyenne = ${Math.round(times.reduce((a,b)=>a+b,0)/times.length)}ms`);}
  if(o.m.t)out('^C');
  if(!ctx.batch&&h&&!h.up&&(lan||/^192\.168\.10\./.test(ip)))ctx.out.push(L('(Piège classique : « Impossible de joindre l’hôte » compte comme « reçu ». Le poste est bien injoignable.)','t-warn'));
  return h&&h.up?0:1;
};
CMD.tracert=function(args,ctx){
  const o=sw(args,['h','w']);const t=o.pos.map(unq)[0];const out=s=>ctx.out.push(L(s));const nd=o.has('d');
  if(!t){out('Usage : tracert [-d] [-h sauts_maxi] [-j liste_hôtes] [-w délai] nom_cible');return 1;}
  const h=findHost(t);if(!h&&!isIp(t)){out(`Impossible de résoudre le nom du système cible ${t}.`);return 1;}
  const ip=h?h.ip:t;out('');out(`Détermination de l’itinéraire vers ${h&&!isIp(t)?(h.ext?h.n:fqdnOf(h))+' ['+ip+']':ip}`);out('avec un maximum de 30 sauts :');out('');
  const hop=(i,ms,name,addr)=>out(`${String(i).padStart(3)}  ${ms.map(x=>x==null?'    *   ':(x<1?'   <1 ms':String(x).padStart(5)+' ms')).join(' ')}  ${name&&!nd?name+' ['+addr+']':addr}`);
  if(!st.ipOk){out('Échec de la transmission. Défaillance générale.');return 1;}
  if(h&&!h.ext){if(h.up)hop(1,[0,0,0],fqdnOf(h),ip);else for(let i=1;i<=4;i++)out(`${String(i).padStart(3)}     *        *        *     Délai d’attente de la demande dépassé.`);}
  else{hop(1,[0,0,0],'passerelle.contoso.local','192.168.10.1');hop(2,[3,2,3],null,'80.10.236.1');hop(3,[4,4,5],'ae51-0.nrmar201.Marseille.francetelecom.net','193.252.101.86');out('  4     *        *        *     Délai d’attente de la demande dépassé.');hop(5,[11,11,12],null,'72.14.211.26');hop(6,[12,12,12],null,'142.250.234.41');
    if(h&&h.up)hop(7,[12,12,13],h.n==='google.com'?'par21s23-in-f14.1e100.net':h.n,ip);else for(let i=7;i<=9;i++)out(`${String(i).padStart(3)}     *        *        *     Délai d’attente de la demande dépassé.`);}
  out('');out('Itinéraire déterminé.');return 0;
};
CMD.pathping=function(args,ctx){CMD.tracert(args.filter(a=>!/^-[nqp]/.test(a)),ctx);ctx.out.push(L(''));ctx.out.push(L('Calcul des statistiques pendant 175 secondes...'));ctx.out.push(L('(Simulation) Perte de paquets par saut : 0 % sur tous les nœuds répondants.','t-warn'));return 0;};
const MX={'contoso-hotels.com':'contoso-hotels-com.mail.protection.outlook.com','contoso.local':null,'google.com':'smtp.google.com'};
CMD.nslookup=function(args,ctx){
  const out=s=>ctx.out.push(L(s));let type='a';const pos=[];
  for(const a0 of args){const a=unq(a0);const m=/^-(?:type|q|querytype)=(\w+)$/i.exec(a);if(m)type=lc(m[1]);else pos.push(a);}
  if(!pos.length){out('Serveur par défaut :   srv-ad01.contoso.local');out('Address:  192.168.10.5');out('');out('(nslookup interactif non simulé : tape « nslookup nom » directement.)');return 0;}
  const name=pos[0];const srvQ=pos[1];
  const srv=srvQ?findHost(srvQ)||{n:srvQ,ip:srvQ,up:true,ext:true}:HOSTS[2];
  if(!st.ipOk){out('DNS request timed out.');out('    timeout was 2 seconds.');out('Serveur :   UnKnown');out(`Address:  ${srv.ip}`);out('');out(`*** Le délai d’attente de la requête vers UnKnown a expiré`);return 1;}
  out(`Serveur :   ${srv.ext?(srv.n==='dns.google'||srv.n==='one.one.one.one'?srv.n:'UnKnown'):fqdnOf(srv)}`);out(`Address:  ${srv.ip}`);out('');
  if(type==='mx'){const d=lc(name).replace(/\.$/,'');if(MX[d]){if(!/contoso\.local$/.test(d))out('Réponse ne faisant pas autorité :');out(`${d}\tMX preference = 0, mail exchanger = ${MX[d]}`);return 0;}out(`*** ${srv.n} ne parvient pas à trouver ${name} : Non-existent domain`);return 1;}
  if(type==='srv'){if(/_ldap\._tcp\.dc\._msdcs\.contoso\.local/i.test(name)){['srv-ad01','srv-ad02'].forEach((d,i)=>{out(`${name}\tSRV service location:`);out('\t  priority       = 0');out('\t  weight         = 100');out('\t  port           = 389');out(`\t  svr hostname   = ${d}.contoso.local`);});out('srv-ad01.contoso.local\tinternet address = 192.168.10.5');out('srv-ad02.contoso.local\tinternet address = 192.168.10.6');return 0;}out(`*** ${fqdnOf(srv)} ne parvient pas à trouver ${name} : Non-existent domain`);return 1;}
  if(isIp(name)){const h=findHost(name);if(h&&!h.ext){out(`Nom :    ${fqdnOf(h)}`);out(`Address:  ${h.ip}`);return 0;}out(`*** ${fqdnOf(srv)} ne parvient pas à trouver ${name} : Non-existent domain`);return 1;}
  const h=findHost(name);
  if(!h||h.self&&h.n==='localhost'){out(`*** ${srv.ext?'UnKnown':fqdnOf(srv)} ne parvient pas à trouver ${name} : Non-existent domain`);return 1;}
  if(h.ext||srv.ext)out('Réponse ne faisant pas autorité :');
  out(`Nom :    ${h.ext?h.n:fqdnOf(h)}`);
  if(h.ext){out(`Addresses:  2a00:1450:4007:80c::200e`);out(`          ${h.ip}`);}else out(`Address:  ${h.ip}`);
  out('');return 0;
};
const CONNS=[['TCP','0.0.0.0:135','0.0.0.0:0','LISTENING',1240],['TCP','0.0.0.0:445','0.0.0.0:0','LISTENING',4],['TCP','0.0.0.0:3389','0.0.0.0:0','LISTENING',1316],['TCP','0.0.0.0:5040','0.0.0.0:0','LISTENING',2144],
  ['TCP','192.168.10.42:139','0.0.0.0:0','LISTENING',4],['TCP','192.168.10.42:50112','192.168.10.10:445','ESTABLISHED',4],['TCP','192.168.10.42:50231','52.97.211.162:443','ESTABLISHED',7344],
  ['TCP','192.168.10.42:50240','142.250.201.174:443','ESTABLISHED',6216],['TCP','192.168.10.42:50288','52.113.194.132:443','ESTABLISHED',5888],['TCP','192.168.10.42:50301','192.168.10.5:389','ESTABLISHED',924],
  ['TCP','192.168.10.42:50330','185.199.110.153:443','TIME_WAIT',0],['TCP','192.168.10.42:50412','192.168.10.12:9100','SYN_SENT',8920],['TCP','192.168.10.42:50419','192.168.10.12:445','ESTABLISHED',4],
  ['UDP','0.0.0.0:123','*:*','',1876],['UDP','0.0.0.0:5353','*:*','',1612],['UDP','192.168.10.42:137','*:*','',4]];
const procName=pid=>{const p=st.procs.find(x=>x.Id===pid);return p?p.Name+(p.Name==='System'?'':'.exe'):'';};
CMD.netstat=function(args,ctx){
  const flags=args.map(a=>a.replace(/^[-\/]/,'')).join('').toLowerCase();const out=s=>ctx.out.push(L(s));
  if(flags.includes('r'))return CMD.route(['print'],ctx);
  if(flags.includes('e')){out('Statistiques de l’interface');out('');out('                           Reçus            Envoyés');out('Octets                    2412337124        412339021');out('Paquets unicast              2213450          1532311');out('Paquets non-unicast            41210             3321');out('Rejets                             0                0');out('Erreurs                            0                0');out('Protocoles inconnus                0');return 0;}
  const all=flags.includes('a'),num=flags.includes('n'),pid=flags.includes('o'),bin=flags.includes('b');
  const name=a=>{if(num)return a;return a.replace('0.0.0.0','0.0.0.0').replace('192.168.10.42','PC-IT-01').replace('192.168.10.10:445','srv-fichiers:microsoft-ds').replace('192.168.10.12:445','srv-impression:microsoft-ds').replace('192.168.10.5:389','srv-ad01:ldap').replace(':443',':https').replace(':445',':microsoft-ds').replace(':135',':epmap');};
  out('');out('Connexions actives');out('');out(`  Proto  Adresse locale         Adresse distante       État${pid?'           PID':''}`);
  CONNS.filter(c=>all||c[3]==='ESTABLISHED'||c[3]==='TIME_WAIT').forEach(c=>{out(`  ${c[0].padEnd(6)} ${name(c[1]).padEnd(22)} ${name(c[2]).padEnd(22)} ${c[3].padEnd(15)}${pid?String(c[4]).padStart(5):''}`.trimEnd());if(bin)out(c[4]===4?' Impossible d’obtenir les informations de propriétaire':` [${procName(c[4])}]`);});
  return 0;
};
CMD.arp=function(args,ctx){if(!/^[-\/]a$/i.test(args[0]||'')&&!/^[-\/]g$/i.test(args[0]||'')){if(/^[-\/]d$/i.test(args[0]||'')){ctx.out.push(L(''));return 0;}ctx.out.push(L('Affiche et modifie les tables de traduction d’adresses IP en adresses physiques (arp -a pour afficher).'));return 0;}outLines('arp').forEach(x=>ctx.out.push(L(x)));return 0;};
CMD.route=function(args,ctx){if(lc(args[0]||'')!=='print'){ctx.out.push(L('(Simulation) route add/delete modifie la table de routage ; seule « route print » est simulée.','t-warn'));return 0;}outLines('route').forEach(x=>ctx.out.push(L(x)));return 0;};
CMD.getmac=function(args,ctx){const o=sw(args);outLines(o.has('v')?'getmac_v':'getmac').forEach(x=>ctx.out.push(L(x)));return 0;};
CMD.netsh=function(args,ctx){
  const a=args.map(unq).join(' ').toLowerCase();const out=s=>ctx.out.push(L(s));
  if(/^wlan show profiles?$/.test(a)){outLines('netsh_wlan_profiles').forEach(out);return 0;}
  if(/^wlan show profiles? (name=)?.+key=clear/.test(a)){outLines('netsh_wlan_key').forEach(out);return 0;}
  if(/^wlan show profiles? (name=)?.+/.test(a)){outLines('netsh_wlan_key').filter(l=>!/Contenu de la clé/.test(l)).forEach(out);return 0;}
  if(/^wlan show interfaces?$/.test(a)){outLines('netsh_wlan_if').forEach(out);return 0;}
  if(/^(interface |int )?ip show (config|address)/.test(a)){outLines('netsh_ip_config').forEach(out);return 0;}
  if(/^interface show interface$/.test(a)){outLines('netsh_if').forEach(out);return 0;}
  if(/^advfirewall show (allprofiles|currentprofile)( state)?$/.test(a)){outLines('netsh_fw').forEach(out);return 0;}
  if(/^advfirewall set allprofiles state (on|off)$/.test(a)){out('Ok.');out('');if(/off$/.test(a))ctx.out.push(L('(Désactiver le pare-feu sur tous les profils est rarement une bonne idée : préfère une règle ciblée.)','t-warn'));return 0;}
  if(/^advfirewall firewall add rule/.test(a)){out('Ok.');out('');return 0;}
  if(/^winsock reset$/.test(a)){out('');out('Catalogue Winsock réinitialisé.');out('Vous devez redémarrer l’ordinateur pour terminer la réinitialisation.');out('');return 0;}
  if(/^(int|interface) (ip|ipv4) reset/.test(a)){out('Réinitialisation de Interface globale, OK !');out('Réinitialisation de Unicast Address, OK !');out('Réinitialisation de Route, OK !');out('Redémarrez l’ordinateur pour terminer cette action.');return 0;}
  if(/^interface (ip|ipv4) set (address|dns)/.test(a)){out('');return 0;}
  if(/^winhttp show proxy$/.test(a)){out('');out('Paramètres de proxy WinHTTP actuels :');out('');out('    Accès direct (pas de serveur proxy).');out('');return 0;}
  out('(Simulation) Contexte netsh non simulé. Essaie : netsh wlan show profiles, netsh interface ip show config, netsh advfirewall show allprofiles state.');return 0;
};

/* =========================================================
   Commandes CMD : système, processus, services
   ========================================================= */
CMD.whoami=function(args,ctx){
  const o=sw(args);const out=s=>ctx.out.push(L(s));
  if(st.psctx&&st.psctx.system){out('nt authority\\system');return 0;}
  if(o.has('upn')){out('it.tech@contoso.local');return 0;}
  if(o.has('fqdn')){out('CN=IT Tech,OU=Informatique,OU=Utilisateurs,DC=contoso,DC=local');return 0;}
  if(o.has('user')||o.has('all')){outLines('whoami_user').forEach(out);}
  if(o.has('groups')||o.has('all')){outLines('whoami_groups').forEach(out);}
  if(o.has('priv')||o.has('all')){outLines('whoami_priv').forEach(out);}
  if(!Object.keys(o.m).length)out('contoso\\it.tech');
  return 0;
};
function systeminfoLines(host){
  const hw=hostHw(host||'PC-IT-01');const n=(host||'PC-IT-01').toUpperCase();
  const isSrv=/^SRV/.test(n);
  return [
    '',
    `Nom de l’hôte:                              ${n}`,
    `Nom du système d’exploitation:              ${hw.os}`,
    `Version du système:                         ${hw.ver} N/A version ${hw.build}`,
    'Fabricant du système d’exploitation:        Microsoft Corporation',
    `Configuration du système d’exploitation:    ${/srv-ad/i.test(n)?'Contrôleur principal de domaine':isSrv?'Serveur membre':'Station de travail membre'}`,
    'Type de version du système d’exploitation:  Multiprocessor Free',
    'Propriétaire enregistré:                    Contoso Hôtels',
    'Organisation enregistrée:                   Contoso Hôtels',
    'Identificateur de produit:                  00330-80000-00000-AA412',
    `Date d’installation originale:              ${fdate(hw.install)}, ${ftime(hw.install)}:33`,
    `Heure de démarrage du système:              ${fdate(hw.boot)}, ${ftime(hw.boot)}:10`,
    `Fabricant du système:                       ${hw.man}`,
    `Modèle du système:                          ${hw.model}`,
    'Type du système:                            x64-based PC',
    'Processeur(s):                              1 processeur(s) installé(s).',
    `                                            [01] : Intel64 Family 6 Model 191 Stepping 2 GenuineIntel ~2500 MHz`,
    `Version du BIOS:                            ${hw.man} 1.21.0, 14/05/2026`,
    'Répertoire Windows:                         C:\\Windows',
    'Répertoire système:                         C:\\Windows\\system32',
    'Périphérique d’amorçage:                    \\Device\\HarddiskVolume1',
    'Option régionale du système:                fr;Français (France)',
    'Paramètres régionaux d’entrée:              fr;Français (France)',
    'Fuseau horaire:                             (UTC+01:00) Bruxelles, Copenhague, Madrid, Paris',
    `Mémoire physique totale:                    ${nf(hw.ram*1024-278)} Mo`,
    `Mémoire physique disponible:                ${nf(hw.ram*1024*0.46)} Mo`,
    `Mémoire virtuelle : taille maximale:        ${nf(hw.ram*1024*1.25)} Mo`,
    `Mémoire virtuelle : disponible:             ${nf(hw.ram*1024*0.55)} Mo`,
    `Mémoire virtuelle : en cours d’utilisation: ${nf(hw.ram*1024*0.7)} Mo`,
    'Emplacements des fichiers d’échange:        C:\\pagefile.sys',
    'Domaine:                                    contoso.local',
    'Serveur d’ouverture de session:             \\\\SRV-AD01',
    'Correctif(s):                               3 Correctif(s) installé(s).',
    '                                            [01]: KB5043080',
    '                                            [02]: KB5044284',
    '                                            [03]: KB5043937',
    'Carte(s) réseau:                            1 carte(s) réseau installée(s).',
    '                                            [01]: Intel(R) Ethernet Connection (17) I219-LM',
    '                                                  Nom de la connexion : Ethernet',
    '                                                  DHCP activé :         Oui',
    '                                                  Serveur DHCP :        192.168.10.5',
    '                                                  Adresse(s) IP',
    `                                                  [01]: ${host?(findHost(host)||{}).ip||'':ME.ip}`,
    'Configuration requise pour Hyper-V:         Un hyperviseur a été détecté. Les fonctionnalités nécessaires à Hyper-V ne seront pas affichées.'
  ];
}
CMD.systeminfo=function(args,ctx){const o=sw(args);let host=o.m.s&&o.m.s!==true?o.m.s.replace(/^\\\\/,''):null;
  if(host){const h=findHost(host);if(!h||!h.up){ctx.err.push('ERREUR : le serveur RPC n’est pas disponible.');return 1;}host=h.n;}
  if(!o.has('fo'))ctx.out.push(L('Chargement des informations du correctif 3/3.'));
  const lines=systeminfoLines(host||(st.psctx&&st.psctx.host));
  if(o.m.fo&&lc(o.m.fo)==='csv'){const pairs=lines.filter(l=>/^\S.*:\s{2,}/.test(l)).map(l=>{const i=l.indexOf(':');return[l.slice(0,i).trim(),l.slice(i+1).trim()];});ctx.out.push(L(pairs.map(p=>`"${p[0]}"`).join(',')));ctx.out.push(L(pairs.map(p=>`"${p[1]}"`).join(',')));return 0;}
  lines.forEach(x=>ctx.out.push(L(x)));return 0;};
function procsOf(host){if(!host||findHost(host).self)return st.procs;return baseProcs().filter(p=>!/OUTLOOK|EXCEL|chrome/.test(p.Name)||p.Id%2===0);}
function parseFi(f){const m=/^\s*(\w+)\s+(eq|ne|gt|lt|ge|le)\s+(.+?)\s*$/i.exec(f||'');return m?{k:lc(m[1]),op:lc(m[2]),v:m[3]}:null;}
CMD.tasklist=function(args,ctx){
  const fis=[];let fo='table',svc=false,host=null,v=false;
  for(let i=0;i<args.length;i++){const a=lc(args[i]);if(a==='/fi')fis.push(parseFi(unq(args[++i]||'')));else if(a==='/fo')fo=lc(unq(args[++i]||'table'));else if(a==='/svc')svc=true;else if(a==='/v')v=true;else if(a==='/s')host=unq(args[++i]||'').replace(/^\\\\/,'');else if(a==='/nh'){}}
  if(host){const h=findHost(host);if(!h||!h.up){ctx.err.push('ERREUR : le serveur RPC n’est pas disponible.');return 1;}}
  let list=procsOf(host).slice();
  for(const f of fis){if(!f)continue;list=list.filter(p=>{const img=lc(p.Name)+(p.Name==='System'||p.Name==='System Idle Process'?'':'.exe');let val;if(f.k==='imagename'){val=img;const ok=wild(lc(f.v)).test(val);return f.op==='ne'?!ok:ok;}if(f.k==='pid'){const a=p.Id,b=+f.v;return f.op==='eq'?a===b:f.op==='ne'?a!==b:f.op==='gt'?a>b:f.op==='lt'?a<b:f.op==='ge'?a>=b:a<=b;}if(f.k==='memusage'){const a=p.WS/1024,b=+f.v;return f.op==='gt'?a>b:f.op==='lt'?a<b:f.op==='ge'?a>=b:a<=b;}if(f.k==='status')return f.op==='eq'?/running/i.test(f.v):true;if(f.k==='services')return wild(lc(f.v)).test(lc(p.Svc||''));if(f.k==='username')return true;return true;});}
  const img=p=>p.Name+(p.Name==='System'||p.Name==='System Idle Process'||p.Name==='Registry'?'':'.exe');
  if(!list.length){ctx.out.push(L('INFORMATION : aucune tâche en service ne correspond aux critères spécifiés.'));return 0;}
  const out=s=>ctx.out.push(L(s));
  if(fo==='csv'){out(svc?'"Nom de l’image","PID","Services"':'"Nom de l’image","PID","Nom de la session","Numéro de session","Utilisation de la mémoire"');list.forEach(p=>out(svc?`"${img(p)}","${p.Id}","${p.Svc||'N/A'}"`:`"${img(p)}","${p.Id}","${p.SessionName}","${p.SI}","${nf(p.WS/1024)} Ko"`));return 0;}
  if(fo==='list'){list.forEach(p=>{out('');out(`Nom de l’image :         ${img(p)}`);out(`PID :                    ${p.Id}`);out(`Nom de la session :      ${p.SessionName}`);out(`Numéro de session :      ${p.SI}`);out(`Utilisation de la mémoire : ${nf(p.WS/1024)} Ko`);});return 0;}
  out('');
  if(svc){out('Nom de l’image                 PID Services');out('========================= ======== ============================================');list.forEach(p=>out(`${img(p).padEnd(25).slice(0,25)} ${String(p.Id).padStart(8)} ${p.Svc||'N/A'}`));return 0;}
  out('Nom de l’image                 PID Nom de la sessio Numéro de s Utilisation');out('========================= ======== ================ =========== ============');
  list.forEach(p=>out(`${img(p).padEnd(25).slice(0,25)} ${String(p.Id).padStart(8)} ${p.SessionName.padEnd(16)} ${String(p.SI).padStart(11)} ${(nf(p.WS/1024)+' Ko').padStart(12)}`));
  return 0;
};
CMD.taskkill=function(args,ctx){
  const ims=[],pids=[],fis=[];let force=false,tree=false,host=null;
  for(let i=0;i<args.length;i++){const a=lc(args[i]);if(a==='/im')ims.push(lc(unq(args[++i]||'')));else if(a==='/pid')pids.push(+unq(args[++i]||''));else if(a==='/f')force=true;else if(a==='/t')tree=true;else if(a==='/fi')fis.push(parseFi(unq(args[++i]||'')));else if(a==='/s')host=unq(args[++i]||'');}
  if(!ims.length&&!pids.length&&!fis.length){ctx.err.push('ERREUR : syntaxe incorrecte. Le paramètre /PID ou /IM est requis.');ctx.err.push('Entrez « TASKKILL /? » pour afficher la syntaxe.');return 1;}
  if(host){const h=findHost(host.replace(/^\\\\/,''));if(!h||!h.up){ctx.err.push('ERREUR : le serveur RPC n’est pas disponible.');return 1;}ims.concat(pids).forEach(x=>ctx.out.push(L(`OPÉRATION RÉUSSIE : le processus « ${x} » a été arrêté sur ${h.n}.`)));return 0;}
  let code=0;
  const kill=p=>{const img=p.Name+'.exe';
    if(p.sys){ctx.err.push(`ERREUR : le processus « ${img} » de PID ${p.Id} n’a pas pu être arrêté.`);ctx.err.push('Raison : Accès refusé.');code=1;return;}
    if(!force&&/svchost|spoolsv|VeeamAgent/.test(p.Name)){ctx.err.push(`ERREUR : le processus « ${img} » de PID ${p.Id} n’a pas pu être arrêté.`);ctx.err.push('Raison : Ce processus ne peut être arrêté qu’avec l’option /F.');code=1;return;}
    st.procs=st.procs.filter(x=>x!==p);
    if(p.Svc){p.Svc.split(',').map(s=>s.trim()).forEach(sv=>{const s=st.services.find(x=>lc(x.Name)===lc(sv));if(s){s.Status='Stopped';st.events.push({svc:lc(s.Name),a:'stop'});}});}
    ctx.out.push(L(force?`Opération réussie : le processus « ${img} » de PID ${p.Id} a été arrêté.`:`Opération réussie : un signal d’arrêt a été envoyé au processus « ${img} » de PID ${p.Id}.`));
  };
  for(const im of ims){const rx=wild(im.replace(/\.exe$/,''));const list=st.procs.filter(p=>rx.test(p.Name));if(!list.length){ctx.err.push(`ERREUR : le processus « ${im} » est introuvable.`);code=128;continue;}list.slice().forEach(kill);}
  for(const pid of pids){const p=st.procs.find(x=>x.Id===pid);if(!p){ctx.err.push(`ERREUR : le processus « ${pid} » est introuvable.`);code=128;continue;}kill(p);}
  return code;
};
function svcList(host){if(!host)return st.services;const k=lc(host);if(!st.remoteSvc[k])st.remoteSvc[k]=baseServices();return st.remoteSvc[k];}
function findSvc(list,name){const n=lc(unq(name));return list.find(s=>lc(s.Name)===n)||list.find(s=>lc(s.DisplayName)===n)||null;}
const SC_STATE={Running:'4  RUNNING',Stopped:'1  STOPPED'};
function scBlock(s,ex,ctx){const out=x=>ctx.out.push(L(x));out('');out(`NOM_SERVICE : ${s.Name}`);out(`AFFICHER_NOM : ${s.DisplayName}`);out('        TYPE               : 30  WIN32');out(`        ÉTAT               : ${SC_STATE[s.Status]||'1  STOPPED'}`);out(`                                (${s.Status==='Running'?'STOPPABLE, NOT_PAUSABLE, ACCEPTS_SHUTDOWN':'NOT_STOPPABLE, NOT_PAUSABLE, IGNORES_SHUTDOWN'})`);out('        WIN32_EXIT_CODE    : 0  (0x0)');out('        SERVICE_EXIT_CODE  : 0  (0x0)');out('        POINT_CONTRÔLE     : 0x0');out('        WAIT_HINT          : 0x0');if(ex){const p=st.procs.find(x=>x.Svc&&x.Svc.split(',').map(y=>lc(y.trim())).includes(lc(s.Name)));out(`        PID                : ${s.Status==='Running'?(p?p.Id:1876):0}`);out('        INDICATEURS        :');}}
CMD.sc=function(args,ctx){
  let a=args.map(unq);let host=null;if(a[0]&&a[0].startsWith('\\\\')){host=a.shift().slice(2);const h=findHost(host);if(!h||!h.up){ctx.err.push('[SC] OpenSCManager échec(s) 1722 :');ctx.err.push('');ctx.err.push('Le serveur RPC n’est pas disponible.');return 1722;}if(h.self)host=null;else host=h.n;}
  const list=svcList(host);const verb=lc(a[0]||'');const out=s=>ctx.out.push(L(s));
  const raw=a.slice(1).join(' ');
  if(/\b(state|type|start)=\S/i.test(raw)){ctx.err.push('[SC] Erreur de syntaxe : sc exige un ESPACE après le signe égal. Exemple : sc query state= all   (et pas state=all).');return 1639;}
  if(!verb){outLines('sc_usage').forEach(out);return 0;}
  const get=n=>{const s=findSvc(list,n);if(!s){ctx.err.push(`[SC] ${verb==='query'||verb==='queryex'?'EnumQueryServicesStatus:OpenService':verb==='qc'?'OpenService':verb==='start'?'StartService: OpenService':'OpenService'} échec(s) 1060 :`);ctx.err.push('');ctx.err.push('Le service spécifié n’existe pas en tant que service installé.');ctx.err.push('');}return s;};
  if(verb==='query'||verb==='queryex'){
    const name=a.slice(1).find((x,i,arr)=>!/=$/.test(x)&&!/=$/.test(arr[i-1]||''));
    if(name){const s=get(name);if(!s)return 1060;scBlock(s,verb==='queryex',ctx);return 0;}
    const all=/state=\s*all/i.test(raw)||/state= all/i.test(a.join(' '));const ina=/state=\s*inactive/i.test(a.join(' '));
    list.filter(s=>all?true:ina?s.Status!=='Running':s.Status==='Running').forEach(s=>scBlock(s,verb==='queryex',ctx));return 0;}
  if(verb==='qc'){const s=get(a[1]);if(!s)return 1060;const st_={Automatic:'2   AUTO_START',Manual:'3   DEMAND_START',Disabled:'4   DISABLED'};out('[SC] QueryServiceConfig réussite(s)');out('');out(`NOM_SERVICE : ${s.Name}`);out('        TYPE               : 110  WIN32_OWN_PROCESS');out(`        TYPE_DÉMARRAGE     : ${st_[s.StartType]||'3   DEMAND_START'}`);out('        CONTRÔLE_ERREUR    : 1   NORMAL');out(`        NOM_CHEMIN_BINAIRE : ${s.Name==='Spooler'?'C:\\Windows\\System32\\spoolsv.exe':'C:\\Windows\\system32\\svchost.exe -k netsvcs -p'}`);out('        GROUPE_ORDRE_CHARGEMENT :');out('        BALISE             : 0');out(`        NOM_AFFICHAGE      : ${s.DisplayName}`);out('        DÉPENDANCES        : RPCSS');out('        NOM_DÉMARRAGE_SERVICE : LocalSystem');return 0;}
  if(verb==='start'){const s=get(a[1]);if(!s)return 1060;if(s.StartType==='Disabled'){ctx.err.push('[SC] StartService échec(s) 1058 :');ctx.err.push('');ctx.err.push('Le service ne peut pas être démarré parce qu’il est désactivé ou qu’aucun périphérique activé ne lui est associé.');return 1058;}
    if(s.Status==='Running'){ctx.err.push('[SC] StartService échec(s) 1056 :');ctx.err.push('');ctx.err.push('Une instance du service est déjà en cours d’exécution.');return 1056;}
    s.Status='Running';st.events.push({svc:lc(s.Name),a:'start',host});out('');out(`NOM_SERVICE : ${s.Name}`);out('        TYPE               : 110  WIN32_OWN_PROCESS');out('        ÉTAT               : 2  START_PENDING');out('                                (NOT_STOPPABLE, NOT_PAUSABLE, IGNORES_SHUTDOWN)');out('        WIN32_EXIT_CODE    : 0  (0x0)');out('        SERVICE_EXIT_CODE  : 0  (0x0)');out('        POINT_CONTRÔLE     : 0x0');out('        WAIT_HINT          : 0x7d0');out(`        PID                : ${st.nextPid+=4}`);out('        INDICATEURS        :');return 0;}
  if(verb==='stop'){const s=get(a[1]);if(!s)return 1060;if(s.Status!=='Running'){ctx.err.push('[SC] ControlService échec(s) 1062 :');ctx.err.push('');ctx.err.push('Le service n’a pas été démarré.');return 1062;}
    if(lc(s.Name)==='windefend'){ctx.err.push('[SC] OpenService échec(s) 5 :');ctx.err.push('');ctx.err.push('Accès refusé.');return 5;}
    if(lc(s.Name)==='lanmanserver'){ctx.err.push('[SC] ControlService échec(s) 1051 :');ctx.err.push('');ctx.err.push('Un contrôle d’arrêt a été envoyé à un service dont dépendent d’autres services en cours d’exécution.');return 1051;}
    s.Status='Stopped';st.events.push({svc:lc(s.Name),a:'stop',host});out('');out(`NOM_SERVICE : ${s.Name}`);out('        TYPE               : 110  WIN32_OWN_PROCESS');out('        ÉTAT               : 3  STOP_PENDING');out('                                (STOPPABLE, NOT_PAUSABLE, ACCEPTS_SHUTDOWN)');out('        WIN32_EXIT_CODE    : 0  (0x0)');out('        SERVICE_EXIT_CODE  : 0  (0x0)');out('        POINT_CONTRÔLE     : 0x0');out('        WAIT_HINT          : 0x0');return 0;}
  if(verb==='config'){const s=get(a[1]);if(!s)return 1060;const i=a.findIndex(x=>/^start=$/i.test(x));if(i>=0){const v=lc(a[i+1]||'');s.StartType=v==='auto'||v==='delayed-auto'?'Automatic':v==='demand'?'Manual':v==='disabled'?'Disabled':s.StartType;}out('[SC] ChangeServiceConfig réussite(s)');return 0;}
  if(verb==='description'){out('[SC] ChangeServiceConfig2 réussite(s)');return 0;}
  if(verb==='failure'){out('[SC] ChangeServiceConfig2 réussite(s)');return 0;}
  if(verb==='delete'){const s=get(a[1]);if(!s)return 1060;out('[SC] DeleteService réussite(s)');list.splice(list.indexOf(s),1);return 0;}
  outLines('sc_usage').forEach(out);return 0;
};
/* net */
function adUser(sam){return AD.users.find(u=>lc(u.SamAccountName)===lc(sam))||null;}
function adGroup(n){return AD.groups.find(g=>lc(g.Name)===lc(n)||lc(g.SamAccountName)===lc(n))||null;}
function adComputer(n){n=lc(n).replace(/\$$/,'');return AD.computers.find(c=>lc(c.Name)===n)||null;}
CMD.net=function(args,ctx){
  const a=args.map(unq);const verb=lc(a[0]||'');const rest=a.slice(1);const out=s=>ctx.out.push(L(s));
  const ok=()=>out('La commande s’est terminée correctement.');
  const flag=f=>rest.some(x=>lc(x).startsWith(f));
  const pos=rest.filter(x=>!x.startsWith('/'));
  if(!verb){outLines('net_usage').forEach(out);return 1;}
  if(verb==='helpmsg'){const M={'2':'Le fichier spécifié est introuvable.','3':'Le chemin d’accès spécifié est introuvable.','5':'Accès refusé.','53':'Le chemin réseau n’a pas été trouvé.','67':'Le nom réseau est introuvable.','85':'Le nom de périphérique local est déjà utilisé.','86':'Le mot de passe réseau spécifié est incorrect.','1326':'Nom d’utilisateur ou mot de passe incorrect.','1909':'Le compte référencé est actuellement verrouillé et il se peut qu’il ne soit pas possible de s’y connecter.','2182':'Le service demandé a déjà été démarré.','2221':'Le nom d’utilisateur est introuvable.','3521':'Le service n’est pas lancé.'};out('');out(M[pos[0]]||'Le message demandé est introuvable.');return 0;}
  if(verb==='start'||verb==='stop'){
    if(!pos.length){if(verb==='start'){out('Ces services Windows sont démarrés :');out('');st.services.filter(s=>s.Status==='Running').sort((x,y)=>x.DisplayName<y.DisplayName?-1:1).forEach(s=>out('   '+s.DisplayName));out('');ok();return 0;}ctx.err.push('La syntaxe de cette commande est :');ctx.err.push('NET STOP service');return 1;}
    const s=findSvc(st.services,pos.join(' '));
    if(!s){ctx.err.push('Le nom de service n’est pas valide.');ctx.err.push('');ctx.err.push('Vous obtiendrez une aide supplémentaire en entrant NET HELPMSG 2185.');return 2;}
    if(verb==='start'){if(s.Status==='Running'){ctx.err.push('Le service demandé a déjà été démarré.');ctx.err.push('');ctx.err.push('Vous obtiendrez une aide supplémentaire en entrant NET HELPMSG 2182.');return 2;}
      if(s.StartType==='Disabled'){ctx.err.push('Erreur système 1058.');ctx.err.push('');ctx.err.push('Le service ne peut pas être démarré parce qu’il est désactivé ou qu’aucun périphérique activé ne lui est associé.');return 2;}
      s.Status='Running';st.events.push({svc:lc(s.Name),a:'start'});out(`Le service ${s.DisplayName} démarre.`);out(`Le service ${s.DisplayName} a démarré.`);out('');return 0;}
    if(s.Status!=='Running'){ctx.err.push(`Le service ${s.DisplayName} n’est pas lancé.`);ctx.err.push('');ctx.err.push('Vous obtiendrez une aide supplémentaire en entrant NET HELPMSG 3521.');return 2;}
    if(lc(s.Name)==='lanmanserver'){out('Les services suivants dépendent du service Serveur.');out('L’arrêt du service Serveur arrêtera également ces services.');out('');out('   Explorateur d’ordinateurs');out('');out('Voulez-vous continuer cette opération ? (O/N) [N] : N');ctx.out.push(L('(Simulation : réponse N, rien n’a été arrêté. Ajoute /y pour répondre Oui automatiquement.)','t-warn'));return 2;}
    if(lc(s.Name)==='windefend'){ctx.err.push('Erreur système 5.');ctx.err.push('');ctx.err.push('Accès refusé.');return 2;}
    s.Status='Stopped';st.events.push({svc:lc(s.Name),a:'stop'});out(`Le service ${s.DisplayName} s’arrête.`);out(`Le service ${s.DisplayName} a été arrêté.`);out('');return 0;
  }
  if(verb==='user'){
    const dom=flag('/domain');const name=pos[0];
    if(!name){if(dom){out('La demande sera traitée sur un contrôleur de domaine pour le domaine contoso.local.');out('');out('comptes d’utilisateurs de \\\\SRV-AD01.contoso.local');out('');out('-------------------------------------------------------------------------------');const n=['Administrateur','Invité','krbtgt',...AD.users.map(u=>u.SamAccountName)];for(let i=0;i<n.length;i+=3)out(n.slice(i,i+3).map(x=>x.padEnd(25)).join('').trimEnd());ok();return 0;}
      out('');out('comptes d’utilisateurs de \\\\PC-IT-01');out('');out('-------------------------------------------------------------------------------');const n=st.localUsers.map(u=>u.Name);for(let i=0;i<n.length;i+=3)out(n.slice(i,i+3).map(x=>x.padEnd(25)).join('').trimEnd());ok();return 0;}
    if(dom){
      out('La demande sera traitée sur un contrôleur de domaine pour le domaine contoso.local.');out('');
      const u=adUser(name);
      if(flag('/add')){if(u){ctx.err.push('Le compte existe déjà.');return 2;}ok();return 0;}
      if(!u){ctx.err.push('Le nom d’utilisateur est introuvable.');ctx.err.push('');ctx.err.push('Vous obtiendrez une aide supplémentaire en entrant NET HELPMSG 2221.');return 2;}
      const act=rest.find(x=>/^\/active:/i.test(x));
      if(act){u.Enabled=/yes|oui/i.test(act.split(':')[1]);ok();return 0;}
      if(pos[1]){if(pos[1]==='*'){out('Tapez un mot de passe pour l’utilisateur : ');out('Retapez le mot de passe pour confirmer : ');}u.PasswordLastSet=new Date();u.PasswordExpired=false;ok();return 0;}
      const W=s=>s.padEnd(47);
      out(W('Nom d’utilisateur')+u.SamAccountName);out(W('Nom complet')+u.Name);out(W('Commentaire')+(u.Description||''));out(W('Commentaires utilisateur'));out(W('Code du pays ou de la région')+'000 (Valeur par défaut du système)');
      out(W('Compte : actif')+(u.Enabled?(u.LockedOut?'Verrouillé':'Oui'):'Non'));out(W('Le compte expire')+'Jamais');out('');
      out(W('Mot de passe : dernier changmt.')+fdt(u.PasswordLastSet));out(W('Mot de passe expire')+(u.PasswordNeverExpires?'Jamais':fdt(new Date(u.PasswordLastSet.getTime()+90*864e5))));out(W('Mot de passe modifiable')+fdt(new Date(u.PasswordLastSet.getTime()+864e5)));out(W('Mot de passe exigé')+'Oui');out(W('L’utilisateur peut changer de mot de passe')+'Oui');out('');
      out(W('Stations autorisées')+'Tout');out(W('Script d’ouverture de session'));out(W('Profil d’utilisateur'));out(W('Répertoire de base')+(u.HomeDirectory||''));out(W('Dernier accès')+(u.LastLogonDate?fdt(u.LastLogonDate):'Jamais'));out('');out(W('Heures d’accès autorisé')+'Tout');out('');
      const gs=AD.groups.filter(g=>g.members.some(m=>lc(m)===lc(u.SamAccountName))).map(g=>'*'+g.Name);
      out(W('Appartient aux groupes locaux'));let first=true;for(let i=0;i<gs.length;i+=2){out(W(first?'Appartient aux groupes globaux':'')+gs.slice(i,i+2).map(x=>x.padEnd(21)).join('').trimEnd());first=false;}
      ok();return 0;
    }
    const lu=st.localUsers.find(x=>lc(x.Name)===lc(name));
    if(flag('/add')){if(lu){ctx.err.push('Le compte existe déjà.');return 2;}st.localUsers.push({Name:name,Enabled:true,Description:'',FullName:''});ok();return 0;}
    if(flag('/delete')){if(!lu){ctx.err.push('Le nom d’utilisateur est introuvable.');return 2;}st.localUsers=st.localUsers.filter(x=>x!==lu);ok();return 0;}
    if(!lu){ctx.err.push('Le nom d’utilisateur est introuvable.');ctx.err.push('');ctx.err.push('Vous obtiendrez une aide supplémentaire en entrant NET HELPMSG 2221.');if(adUser(name))ctx.out.push(L('(C’est un compte du DOMAINE : ajoute /domain.)','t-warn'));return 2;}
    const act=rest.find(x=>/^\/active:/i.test(x));if(act){lu.Enabled=/yes|oui/i.test(act.split(':')[1]);ok();return 0;}
    if(pos[1]){ok();return 0;}
    const W=s=>s.padEnd(30);out(W('Nom d’utilisateur')+lu.Name);out(W('Nom complet')+lu.FullName);out(W('Commentaire')+lu.Description);out(W('Compte : actif')+(lu.Enabled?'Oui':'Non'));out(W('Le compte expire')+'Jamais');out('');out(W('Appartient aux groupes locaux')+(lc(lu.Name)==='admin.local'||lc(lu.Name)==='administrateur'?'*Administrateurs':'*Utilisateurs'));out(W('Appartient aux groupes globaux')+'*Aucun');ok();return 0;
  }
  if(verb==='localgroup'){
    const g=pos[0];
    if(!g){out('');out('Alias pour \\\\PC-IT-01');out('');out('-------------------------------------------------------------------------------');['*Administrateurs','*Lecteurs des journaux d’événements','*Opérateurs de sauvegarde','*Utilisateurs','*Utilisateurs de l’Analyseur de performances','*Utilisateurs du Bureau à distance','*Utilisateurs du modèle COM distribué'].forEach(out);ok();return 0;}
    const G=st.localGroups[lc(g)];if(!G){ctx.err.push('Le groupe local spécifié n’existe pas.');ctx.err.push('');ctx.err.push('Vous obtiendrez une aide supplémentaire en entrant NET HELPMSG 3780.');return 2;}
    if(flag('/add')){pos.slice(1).forEach(m=>G.members.push({n:m.includes('\\')?m:'CONTOSO\\'+m,c:'Utilisateur',src:'ActiveDirectory'}));ok();return 0;}
    if(flag('/delete')){pos.slice(1).forEach(m=>{G.members=G.members.filter(x=>lc(x.n)!==lc(m)&&!lc(x.n).endsWith('\\'+lc(m)));});ok();return 0;}
    out(`Nom alias     ${G.name}`);out(`Commentaire   ${G.desc}`);out('');out('Membres');out('');out('-------------------------------------------------------------------------------');G.members.forEach(m=>out(m.n.replace(/^PC-IT-01\\/,'')));ok();return 0;
  }
  if(verb==='group'){
    if(!flag('/domain')){ctx.err.push('Cette commande ne peut être utilisée que sur un contrôleur de domaine Windows.');ctx.err.push('');ctx.out.push(L('(Ajoute /domain pour interroger le domaine.)','t-warn'));return 2;}
    out('La demande sera traitée sur un contrôleur de domaine pour le domaine contoso.local.');out('');
    const g=pos[0];if(!g){out('');out('Comptes de groupe pour \\\\SRV-AD01.contoso.local');out('');out('-------------------------------------------------------------------------------');AD.groups.forEach(x=>out('*'+x.Name));ok();return 0;}
    const G=adGroup(g);if(!G){ctx.err.push('Le nom de groupe est introuvable.');ctx.err.push('');ctx.err.push('Vous obtiendrez une aide supplémentaire en entrant NET HELPMSG 2220.');return 2;}
    if(G.GroupScope==='DomainLocal'){ctx.err.push('Le nom de groupe est introuvable.');ctx.out.push(L('(net group ne voit que les groupes globaux. Pour un groupe de domaine local : net localgroup "'+G.Name+'" /domain, ou Get-ADGroupMember.)','t-warn'));return 2;}
    if(flag('/add')){pos.slice(1).forEach(m=>{if(!G.members.includes(m))G.members.push(m);});ok();return 0;}
    if(flag('/delete')){pos.slice(1).forEach(m=>{G.members=G.members.filter(x=>lc(x)!==lc(m));});ok();return 0;}
    out(`Nom de groupe     ${G.Name}`);out(`Commentaire       ${G.Description||''}`);out('');out('Membres');out('');out('-------------------------------------------------------------------------------');for(let i=0;i<G.members.length;i+=3)out(G.members.slice(i,i+3).map(x=>x.padEnd(25)).join('').trimEnd());ok();return 0;
  }
  if(verb==='use'){
    if(pos[0]==='*'&&flag('/delete')){const ks=Object.keys(st.mapped);if(!ks.length){out('Il n’y a pas d’entrée dans la liste.');return 0;}out('Vous avez ces connexions à distance :');out('');ks.forEach(k=>out(`    ${k}:        ${st.mapped[k].unc}`));out('Continuer cette opération ? (O/N) [N] : O');ks.forEach(k=>delete st.mapped[k]);ok();return 0;}
    if(!pos.length){out('Les nouvelles connexions seront mémorisées.');out('');out('');out('État         Local     Distant                   Réseau');out('');out('-------------------------------------------------------------------------------');Object.keys(st.mapped).sort().forEach(k=>out(`OK           ${(k+':').padEnd(9)} ${st.mapped[k].unc.padEnd(25)} Microsoft Windows Network`));out('                       \\\\SRV-IMPRESSION\\IMP-RECEP Microsoft Windows Network');ok();return 0;}
    let drive=null,unc=null;for(const p of pos){if(/^[a-z]:$/i.test(p))drive=p[0].toUpperCase();else if(p.startsWith('\\\\'))unc=p;}
    if(drive&&flag('/delete')){if(!st.mapped[drive]){ctx.err.push('La connexion réseau est introuvable.');ctx.err.push('');ctx.err.push('Vous obtiendrez une aide supplémentaire en entrant NET HELPMSG 2250.');return 2;}delete st.mapped[drive];out(`${drive}: a été supprimé.`);out('');return 0;}
    if(!unc){ctx.err.push('La syntaxe de cette commande est :');ctx.err.push('NET USE [lecteur: | *] [\\\\ordinateur\\partage] [/PERSISTENT:{YES | NO}]');return 1;}
    if(drive&&(st.mapped[drive]||drive==='C'||drive==='D')){ctx.err.push('Erreur système 85.');ctx.err.push('');ctx.err.push('Le nom de périphérique local est déjà utilisé.');return 2;}
    let loc;try{loc=resolve(unc);}catch(e){ctx.err.push('Erreur système 53.');ctx.err.push('');ctx.err.push('Le chemin réseau n’a pas été trouvé.');return 2;}
    if(!nodeAt(loc)){ctx.err.push('Erreur système 67.');ctx.err.push('');ctx.err.push('Le nom réseau est introuvable.');return 2;}
    if(!drive){drive=['Z','Y','X','W','V'].find(l=>!st.mapped[l]);out(`Le lecteur ${drive}: est maintenant connecté à ${unc}.`);out('');}
    st.mapped[drive]={root:nodeAt(loc),unc:loc.pre+(loc.segs.length?'\\'+loc.segs.join('\\'):'')};st.dcwd[drive]=[];ok();return 0;
  }
  if(verb==='share'){if(pos[0]&&pos[0].includes('=')){ok();return 0;}out('');out('Nom          Ressource                       Remarque');out('');out('-------------------------------------------------------------------------------');out('C$           C:\\                             Partage par défaut');out('D$           D:\\                             Partage par défaut');out('IPC$                                         IPC distant');out('ADMIN$       C:\\Windows                      Administration à distance');ok();return 0;}
  if(verb==='view'){const t=(pos[0]||'').replace(/^\\\\/,'');if(!t){out('Nom du serveur            Remarque');out('');out('-------------------------------------------------------------------------------');ctx.err.push('Erreur système 6118.');ctx.err.push('');ctx.err.push('La liste des serveurs de ce groupe de travail n’est pas disponible actuellement.');return 2;}
    const h=findHost(t);if(!h||!h.up){ctx.err.push('Erreur système 53.');ctx.err.push('');ctx.err.push('Le chemin réseau n’a pas été trouvé.');return 2;}
    out(`Ressources partagées de \\\\${h.n}`);out('');out('');out('Nom du partage  Type    Utilisé comme  Commentaire');out('');out('-------------------------------------------------------------------------------');
    const sh=SHARES[lc(h.n)];if(sh)Object.keys(sh).filter(k=>!k.endsWith('$')).forEach(k=>out(`${(k[0].toUpperCase()+k.slice(1)).padEnd(16)}Disque${Object.values(st.mapped).some(m=>lc(m.unc)===lc('\\\\'+h.n+'\\'+k))?'  Z:':''}`));
    else if(/IMPRESSION/.test(h.n)){out('IMP-RECEP       Impr.           HP LaserJet Pro - Réception');out('IMP-COMPTA      Impr.           Canon iR-ADV - Comptabilité');}
    else if(h.dc){out('NETLOGON        Disque          Partage de serveur d’accès');out('SYSVOL          Disque          Partage de serveur d’accès');}
    ok();return 0;}
  if(verb==='accounts'){outLines('net_accounts').forEach(out);ok();return 0;}
  if(verb==='session'){out('Il n’y a pas d’entrée dans la liste.');out('');return 0;}
  if(verb==='time'){const t=(pos[0]||'\\\\SRV-AD01');out(`L’heure actuelle à ${t} est ${fdt(new Date())}`);out('');ok();return 0;}
  if(verb==='config'){out('Les services suivants en cours d’exécution peuvent être contrôlés :');out('');out('   Serveur');out('   Station de travail');out('');ok();return 0;}
  outLines('net_usage').forEach(out);return 1;
};
CMD.gpupdate=function(args,ctx){const o=sw(args);const out=s=>ctx.out.push(L(s));const tgt=lc(o.m.target||'');out('Mise à jour de la stratégie...');out('');
  if(tgt!=='user')out('La mise à jour de la stratégie d’ordinateur s’est terminée sans erreur.');if(tgt!=='computer')out('La mise à jour de la stratégie utilisateur s’est terminée sans erreur.');
  if(o.has('boot')){out('');out('Certaines stratégies d’ordinateur ne s’appliquent qu’au démarrage. OK pour redémarrer ? (O/N) N');}
  if(o.has('logoff')){out('');out('Certaines stratégies utilisateur ne s’appliquent qu’à l’ouverture de session. OK pour fermer la session ? (O/N) N');}
  out('');return 0;};
CMD.gpresult=function(args,ctx){const o=sw(args,['h','x','scope','s','user','u','p']);const out=s=>ctx.out.push(L(s));
  if(o.m.h&&o.m.h!==true||o.m.x&&o.m.x!==true){const f=o.m.h&&o.m.h!==true?o.m.h:o.m.x;try{writeFile(f,'<html><head><title>Rapport RSoP</title></head><body>Rapport des stratégies de groupe pour CONTOSO\\it.tech sur PC-IT-01</body></html>');}catch(e){ctx.err.push(e.message);return 1;}if(!ctx.batch)ctx.out.push(L(`(Rapport écrit dans ${f} : ouvre-le dans un navigateur.)`,'t-warn'));return 0;}
  if(!o.has('r')&&!o.has('z')&&!o.has('v')){outLines('gpresult_usage').forEach(out);return 1;}
  const sc=lc(o.m.scope||'');const lines=outLines('gpresult_r',{DATE:fdate(new Date()),HEURE:ftime(new Date())});
  let mode='all';lines.forEach(l=>{if(/^PARAMÈTRES DE L’ORDINATEUR/.test(l))mode='computer';if(/^PARAMÈTRES UTILISATEUR/.test(l))mode='user';if(sc&&mode!=='all'&&mode!==sc)return;out(l);});
  if(o.has('z'))outLines('gpresult_z').forEach(out);return 0;};
CMD.shutdown=function(args,ctx){const o=sw(args,['t','m','c']);const out=s=>ctx.out.push(L(s,'t-warn'));
  if(o.has('a')){if(!st.shutdownPending){ctx.err.push('Impossible d’annuler l’arrêt du système car aucun arrêt n’était en cours.(1116)');return 1116;}st.shutdownPending=false;out('(Simulation) Arrêt planifié annulé. Une notification « La déconnexion est annulée » s’affiche.');return 0;}
  const t=o.m.t!=null&&o.m.t!==true?+o.m.t:30;const m=o.m.m&&o.m.m!==true?o.m.m.replace(/^\\\\/,''):null;const what=o.has('r')?'redémarré':o.has('s')?'arrêté':o.has('l')?'déconnecté (fermeture de session)':o.has('h')?'mis en veille prolongée':null;
  if(!what){outLines('shutdown_usage').forEach(x=>ctx.out.push(L(x)));return 0;}
  if(m){const h=findHost(m);if(!h||!h.up){ctx.err.push(`${m} : Le chemin réseau n’a pas été trouvé.(53)`);return 53;}}
  st.shutdownPending=t>0;
  out(`(Simulation) ${m?'\\\\'+m:'Ce poste'} sera ${what} dans ${t} s${o.has('f')?', applications fermées de force (/f)':''}.${o.m.c&&o.m.c!==true?' Message affiché : « '+o.m.c+' »':''}${t>0?' — shutdown /a pour annuler.':''}`);return 0;};
CMD.sfc=function(args,ctx){const o=sw(args);if(o.has('scannow')||o.has('verifyonly')){outLines(o.has('verifyonly')?'sfc_verify':'sfc_scan').forEach(x=>ctx.out.push(L(x)));return 0;}outLines('sfc_usage').forEach(x=>ctx.out.push(L(x)));return 0;};
CMD.dism=function(args,ctx){const a=args.join(' ').toLowerCase();const out=s=>ctx.out.push(L(s));
  if(!/\/online/.test(a)&&!/\/image:/.test(a)){out('');out('Outil Gestion et maintenance des images de déploiement');out('Version : 10.0.26100.1');out('');ctx.err.push('Erreur : 87');ctx.err.push('');ctx.err.push('L’option cleanup-image n’est pas reconnue dans ce contexte. Ajoute /Online pour cibler le Windows en cours d’exécution.');return 87;}
  if(/\/checkhealth/.test(a))outLines('dism_check').forEach(out);
  else if(/\/scanhealth/.test(a))outLines('dism_scan').forEach(out);
  else if(/\/restorehealth/.test(a))outLines('dism_restore').forEach(out);
  else if(/\/startcomponentcleanup/.test(a))outLines('dism_cleanup').forEach(out);
  else if(/\/get-features|\/get-capabilities/.test(a))outLines('dism_caps').forEach(out);
  else{out('(Simulation) Option DISM non simulée. Essaie /Online /Cleanup-Image /RestoreHealth.');}
  return 0;};
CMD.chkdsk=function(args,ctx){const o=sw(args);const drv=(o.pos[0]||'C:').toUpperCase();const out=s=>ctx.out.push(L(s));
  if(o.has('f')||o.has('r')||o.has('x')){if(/^C:?$/.test(drv)){out('Le type du système de fichiers est NTFS.');out('Impossible de verrouiller le lecteur actif.');out('');out('Chkdsk ne peut pas s’exécuter car le volume est en cours d’utilisation par un autre');out('processus. Voulez-vous que ce volume soit vérifié au prochain');out('redémarrage du système ? (O/N) O');out('');out('Ce volume sera vérifié au prochain redémarrage du système.');return 0;}}
  outLines('chkdsk').forEach(out);return 0;};
CMD.schtasks=function(args,ctx){
  const a=args.map(unq);const out=s=>ctx.out.push(L(s));const get=k=>{const i=a.findIndex(x=>lc(x)==='/'+k);return i>=0?a[i+1]:null;};const has=k=>a.some(x=>lc(x)==='/'+k);
  const verb=lc(a[0]||'/query');
  if(verb==='/create'){const tn=get('tn'),tr=get('tr'),sc=get('sc');if(!tn||!tr||!sc){ctx.err.push('ERREUR : syntaxe incorrecte. Valeur attendue pour /TN, /TR et /SC.');return 1;}
    if(st.tasks.some(t=>lc(t.TaskName)===lc(tn))&&!has('f')){ctx.err.push(`AVERTISSEMENT : la tâche « ${tn} » existe déjà. Utilise /F pour la remplacer.`);return 1;}
    st.tasks=st.tasks.filter(t=>lc(t.TaskName)!==lc(tn));const stt=get('st')||'00:00';const d=new Date();const [hh,mm]=stt.split(':').map(Number);d.setHours(hh||0,mm||0,0,0);if(d<new Date())d.setDate(d.getDate()+1);
    st.tasks.push({TaskName:tn,TaskPath:'\\',State:'Ready',Next:d,Last:null,Result:267011,Run:tr,User:get('ru')||'CONTOSO\\it.tech',Sched:`${sc} ${stt}`});out(`OPÉRATION RÉUSSIE : la tâche planifiée « ${tn} » a été créée.`);return 0;}
  if(verb==='/delete'){const tn=get('tn');const t=st.tasks.find(x=>lc(x.TaskName)===lc(tn||''));if(!t){ctx.err.push('ERREUR : le système ne parvient pas à trouver le fichier spécifié.');return 1;}if(!has('f'))out(`AVERTISSEMENT : voulez-vous vraiment supprimer la tâche « ${t.TaskName} » (O/N) ? O`);st.tasks=st.tasks.filter(x=>x!==t);out(`OPÉRATION RÉUSSIE : la tâche planifiée « ${t.TaskName} » a été supprimée.`);return 0;}
  if(verb==='/run'||verb==='/end'){const tn=get('tn');const t=st.tasks.find(x=>lc(x.TaskName)===lc(tn||''));if(!t){ctx.err.push('ERREUR : le système ne parvient pas à trouver le fichier spécifié.');return 1;}if(verb==='/run'){t.Last=new Date();t.Result=0;out(`OPÉRATION RÉUSSIE : tentative d’exécution de la tâche planifiée « ${t.TaskName} ».`);}else out(`OPÉRATION RÉUSSIE : la tâche planifiée « ${t.TaskName} » a été arrêtée.`);return 0;}
  if(verb==='/change'){const tn=get('tn');const t=st.tasks.find(x=>lc(x.TaskName)===lc(tn||''));if(!t){ctx.err.push('ERREUR : le système ne parvient pas à trouver le fichier spécifié.');return 1;}if(has('disable'))t.State='Disabled';if(has('enable'))t.State='Ready';out(`OPÉRATION RÉUSSIE : les paramètres de la tâche planifiée « ${t.TaskName} » ont été modifiés.`);return 0;}
  const tn=get('tn');let list=st.tasks;if(tn)list=list.filter(t=>lc(t.TaskName)===lc(tn));if(tn&&!list.length){ctx.err.push('ERREUR : le système ne parvient pas à trouver le fichier spécifié.');return 1;}
  const fo=lc(get('fo')||'table');
  if(fo==='list'||has('v')){list.forEach(t=>{out('');out(`Nom de l’hôte :                         PC-IT-01`);out(`Nom de la tâche :                       \\${t.TaskName}`);out(`Prochaine exécution :                   ${t.Next?fdt(t.Next):'N/A'}`);out(`État :                                  ${t.State==='Ready'?'Prêt':'Désactivé'}`);if(has('v')){out(`Dernière exécution :                    ${t.Last?fdt(t.Last):'N/A'}`);out(`Dernier résultat :                      ${t.Result}`);out(`Tâche à exécuter :                      ${t.Run}`);out(`Exécuter en tant qu’utilisateur :       ${t.User}`);out(`Planification :                         ${t.Sched}`);}});return 0;}
  out('');out('Dossier : \\');out('Nom de la tâche                          Prochaine exécution    Statut');out('======================================== ====================== ===============');list.forEach(t=>out(`${t.TaskName.padEnd(40).slice(0,40)} ${(t.Next?fdt(t.Next):'N/A').padEnd(22)} ${t.State==='Ready'?'Prêt':'Désactivé'}`));return 0;};
/* registre */
const HIVES={hklm:'HKLM',hkey_local_machine:'HKLM',hkcu:'HKCU',hkey_current_user:'HKCU'};
function regLoc(path){const p=String(path).replace(/^Registry::/i,'').replace(/:\\?/,'\\').replace(/\\+$/,'');const parts=p.split('\\').filter(Boolean);const hive=HIVES[lc(parts[0]||'')];if(!hive)return null;return{hive,segs:parts.slice(1)};}
function regNode(loc,create){let n=REG[loc.hive];for(const s of loc.segs){const k=Object.keys(n.kids).find(x=>lc(x)===lc(s));if(!k){if(!create)return null;n.kids[s]={vals:{},kids:{}};n=n.kids[s];}else n=n.kids[k];}return n;}
const regShow=loc=>({HKLM:'HKEY_LOCAL_MACHINE',HKCU:'HKEY_CURRENT_USER'}[loc.hive])+(loc.segs.length?'\\'+loc.segs.join('\\'):'');
function regFix(loc){let n=REG[loc.hive];const out=[];for(const s of loc.segs){const k=Object.keys(n.kids).find(x=>lc(x)===lc(s));out.push(k||s);n=k?n.kids[k]:null;if(!n)break;}return{hive:loc.hive,segs:out};}
CMD.reg=function(args,ctx){
  const a=args.map(unq);const verb=lc(a[0]||'');const out=s=>ctx.out.push(L(s));const get=k=>{const i=a.findIndex(x=>lc(x)==='/'+k);return i>=0?a[i+1]:null;};const has=k=>a.some(x=>lc(x)==='/'+k);
  let keyPath=a[1]||'';let remote=null;let m=/^\\\\([^\\]+)\\(.*)$/.exec(keyPath);if(m){remote=m[1];keyPath=m[2];const h=findHost(remote);if(!h||!h.up){ctx.err.push('ERREUR : le chemin réseau n’a pas été trouvé.');return 1;}ctx.out.push(L('(Le registre à distance exige le service RemoteRegistry démarré sur la cible.)','t-warn'));}
  const loc=regLoc(keyPath);if(!verb||!loc){if(['query','add','delete','export'].includes(verb)){ctx.err.push('ERREUR : nom de clé non valide.');ctx.err.push('Tapez « REG '+verb.toUpperCase()+' /? » pour l’aide.');return 1;}outLines('reg_usage').forEach(out);return 1;}
  if(verb==='query'){const n=regNode(loc);if(!n){ctx.err.push('ERREUR : le système n’a pas trouvé la clé ou la valeur de Registre spécifiée.');return 1;}
    const v=get('v');const fx=regFix(loc);
    const show=(node,l,rec)=>{out('');out(regShow(l));Object.entries(node.vals).forEach(([k,val])=>{if(v&&lc(k)!==lc(v))return;out(`    ${k}    ${val.type}    ${val.type==='REG_DWORD'?'0x'+Number(val.data).toString(16):val.data}`);});if(!v)Object.keys(node.kids).forEach(k=>{if(!rec)out(regShow({hive:l.hive,segs:l.segs.concat([k])}));});
      if(rec)Object.keys(node.kids).forEach(k=>show(node.kids[k],{hive:l.hive,segs:l.segs.concat([k])},true));};
    if(v&&!Object.keys(n.vals).some(k=>lc(k)===lc(v))){ctx.err.push('ERREUR : le système n’a pas trouvé la clé ou la valeur de Registre spécifiée.');return 1;}
    show(n,fx,has('s'));out('');return 0;}
  if(verb==='add'){const n=regNode(loc,true);const v=get('v');if(v){const t=(get('t')||'REG_SZ').toUpperCase();let d=get('d')||'';if(t==='REG_DWORD')d=parseInt(d)||0;const exists_=Object.keys(n.vals).find(k=>lc(k)===lc(v));if(exists_&&!has('f'))out(`La valeur ${v} existe. Voulez-vous la remplacer (Oui/Non) ? Oui`);n.vals[exists_||v]={type:t,data:d};}out('L’opération a réussi.');return 0;}
  if(verb==='delete'){const n=regNode(loc);if(!n){ctx.err.push('ERREUR : le système n’a pas trouvé la clé ou la valeur de Registre spécifiée.');return 1;}const v=get('v');if(!has('f'))out(`Voulez-vous vraiment supprimer ${v?'la valeur '+v:'la clé de Registre '+regShow(regFix(loc))} (Oui/Non) ? Oui`);
    if(v){const k=Object.keys(n.vals).find(x=>lc(x)===lc(v));if(!k){ctx.err.push('ERREUR : le système n’a pas trouvé la clé ou la valeur de Registre spécifiée.');return 1;}delete n.vals[k];}else{const par=regNode({hive:loc.hive,segs:loc.segs.slice(0,-1)});const k=Object.keys(par.kids).find(x=>lc(x)===lc(loc.segs[loc.segs.length-1]));delete par.kids[k];}
    out('L’opération a réussi.');return 0;}
  if(verb==='export'){const n=regNode(loc);if(!n){ctx.err.push('ERREUR : le système n’a pas trouvé la clé ou la valeur de Registre spécifiée.');return 1;}const f=a[2];if(!f){ctx.err.push('ERREUR : syntaxe incorrecte.');return 1;}const lines=['Windows Registry Editor Version 5.00','',`[${regShow(regFix(loc))}]`];Object.entries(n.vals).forEach(([k,v])=>lines.push(`"${k}"=${v.type==='REG_DWORD'?'dword:'+Number(v.data).toString(16).padStart(8,'0'):'"'+String(v.data).replace(/\\/g,'\\\\')+'"'}`));try{writeFile(f,lines.join('\n'));}catch(e){ctx.err.push(e.message);return 1;}out('L’opération a réussi.');return 0;}
  outLines('reg_usage').forEach(out);return 1;
};
/* sessions, Kerberos, temps, domaine */
const SESSIONS={'pc-it-01':[['>it.tech','console','1','Actif','aucun',ago(0,7,58)]],'pc-compta-02':[['jrobert','console','2','Actif','12',ago(0,8,5)]],'pc-compta-01':[['jdupont','console','1','Actif','.',ago(1,8,10)]],'pc-recep-01':[['kbenali','console','1','Actif','3',ago(0,6,55)],['cmoreau','','2','Déco','5+02:11',ago(5,7,0)]],'pc-rh-01':[['mlefevre','console','1','Actif','.',ago(0,8,40)]],'pc-dir-01':[['smartin','console','1','Actif','1:05',ago(3,9,2)]],'srv-fichiers':[['it.tech','rdp-tcp#4','3','Actif','45',ago(0,9,30)],['lbernard','','4','Déco','2+04:10',ago(2,16,0)]]};
CMD.query=function(args,ctx){const a=args.map(unq);if(!/^(user|session)$/i.test(a[0]||'')){ctx.out.push(L('QUERY { PROCESS | SESSION | TERMSERVER | USER }'));return 1;}return CMD.quser(a.slice(1),ctx);};
CMD.quser=function(args,ctx){
  const s=(args.find(x=>/^\/server:/i.test(x))||'').split(':')[1];const host=s?findHost(s):HOSTS[0];
  if(!host||!host.up){ctx.err.push(`Erreur 0x000006BA lors de l’énumération des noms de sessions`);ctx.err.push('Erreur [1722] : Le serveur RPC n’est pas disponible.');return 1;}
  const ses=SESSIONS[lc(host.n)]||[];if(!ses.length){ctx.err.push('Aucun utilisateur n’existe pour *');return 1;}
  ctx.out.push(L(' UTILISATEUR           NOM DE SESSION     ID  ÉTAT    TEMPS INACT DATE OUVERTURE'));
  ses.forEach(x=>ctx.out.push(L(`${(x[0].startsWith('>')?x[0]:' '+x[0]).padEnd(22)} ${x[1].padEnd(18)} ${x[2].padStart(2)}  ${x[3].padEnd(7)} ${x[4].padStart(10)}  ${fdate(x[5])} ${ftime(x[5])}`)));return 0;};
CMD.logoff=function(args,ctx){const id=args.find(x=>/^\d+$/.test(x));const s=(args.find(x=>/^\/server:/i.test(x))||'').split(':')[1];if(!id){ctx.out.push(L('(Simulation) Ta propre session serait fermée.','t-warn'));return 0;}ctx.out.push(L(`(Simulation) Session ${id} fermée${s?' sur '+s:''}. Les documents non enregistrés de l’utilisateur sont perdus.`,'t-warn'));return 0;};
CMD.msg=function(args,ctx){return 0;};
CMD.klist=function(args,ctx){const a=lc(args[0]||'');const out=s=>ctx.out.push(L(s));if(a==='purge'){out('');out('ID d’ouverture de session actuel : 0:0x3e7a2f');out('\tSuppression de tous les tickets :');out('\tTicket(s) purgé(s) !');return 0;}outLines(a==='tgt'?'klist_tgt':'klist').forEach(out);return 0;};
CMD.w32tm=function(args,ctx){const a=args.map(lc).join(' ');const out=s=>ctx.out.push(L(s));if(/\/query\s+\/status/.test(a))outLines('w32tm_status',{T:fdt(minsAgo(14))}).forEach(out);else if(/\/query\s+\/source/.test(a))out('SRV-AD01.contoso.local');else if(/\/resync/.test(a)){out('Envoi de la commande de resynchronisation à l’ordinateur local');out('La commande s’est terminée correctement.');}else if(/\/query\s+\/peers/.test(a))outLines('w32tm_peers').forEach(out);else if(/\/stripchart/.test(a))outLines('w32tm_strip').forEach(out);else outLines('w32tm_usage').forEach(out);return 0;};
CMD.nltest=function(args,ctx){const a=args.map(lc).join(' ');const out=s=>ctx.out.push(L(s));
  if(/\/dsgetdc:/.test(a))outLines('nltest_dsgetdc').forEach(out);
  else if(/\/sc_verify:/.test(a))outLines('nltest_sc_verify').forEach(out);
  else if(/\/sc_query:/.test(a))outLines('nltest_sc_query').forEach(out);
  else if(/\/dclist:/.test(a))outLines('nltest_dclist').forEach(out);
  else if(/\/domain_trusts/.test(a))outLines('nltest_trusts').forEach(out);
  else{out('Utilisation : nltest [/server:<nom>] /dsgetdc:<domaine> | /sc_verify:<domaine> | /dclist:<domaine> | /domain_trusts');return 1;}return 0;};
CMD.dsquery=function(args,ctx){const a=args.map(unq);const t=lc(a[0]||'');const name=(()=>{const i=a.findIndex(x=>/^-name$/i.test(x));return i>=0?a[i+1]:'*';})();const rx=wild(name);
  if(t==='user'){const inact=a.findIndex(x=>/^-inactive$/i.test(x));let us=AD.users.filter(u=>rx.test(u.Name)||rx.test(u.SamAccountName));if(inact>=0){const w=+a[inact+1]||4;us=us.filter(u=>u.LastLogonDate&&(NOW-u.LastLogonDate)/864e5>w*7);}if(a.some(x=>/^-disabled$/i.test(x)))us=us.filter(u=>!u.Enabled);us.forEach(u=>ctx.out.push(L(`"${u.DistinguishedName}"`)));return 0;}
  if(t==='computer'){AD.computers.filter(c=>rx.test(c.Name)).forEach(c=>ctx.out.push(L(`"${c.DistinguishedName}"`)));return 0;}
  if(t==='group'){AD.groups.filter(g=>rx.test(g.Name)).forEach(g=>ctx.out.push(L(`"${g.DistinguishedName}"`)));return 0;}
  if(t==='ou'){AD.ous.forEach(o=>ctx.out.push(L(`"${o}"`)));return 0;}
  if(t==='server'){ctx.out.push(L('"CN=SRV-AD01,CN=Servers,CN=Default-First-Site-Name,CN=Sites,CN=Configuration,DC=contoso,DC=local"'));ctx.out.push(L('"CN=SRV-AD02,CN=Servers,CN=Default-First-Site-Name,CN=Sites,CN=Configuration,DC=contoso,DC=local"'));return 0;}
  ctx.out.push(L('dsquery { computer | contact | subnet | group | ou | site | server | user | quota | partition | * }'));return 1;};
CMD.cmdkey=function(args,ctx){const a=args.map(unq);const out=s=>ctx.out.push(L(s));const d=a.find(x=>/^\/delete:/i.test(x));if(d){out('');out('La suppression des informations d’identification a réussi.');st.credsCleared=true;return 0;}if(a.some(x=>/^\/add:/i.test(x))){out('');out('Les informations d’identification ont été ajoutées.');return 0;}
  if(st.credsCleared){out('');out('Actuellement stockés, informations d’identification :');out('');out('* NONE *');return 0;}outLines('cmdkey').forEach(out);return 0;};
CMD.psexec=function(args,ctx,raw){
  const a=args.map(unq);const out=s=>ctx.out.push(L(s));out('');out('PsExec v2.43 - Execute processes remotely');out('Copyright (C) 2001-2023 Mark Russinovich');out('Sysinternals - www.sysinternals.com');out('');
  if(!a.length){out('Usage: psexec [\\\\computer[,computer2[,...] | @file]][-u user [-p psswd]][-n s][-r servicename][-h][-l][-s|-e][-x][-i [session]][-c executable [-f|-v]][-w directory][-d][-<priority>][-a n,n,...] cmd [arguments]');return 1;}
  let i=0;let host=null;if(a[0].startsWith('\\\\')){host=a[0].slice(2);i=1;}
  let sys=false,inter=false,detach=false;
  while(i<a.length&&/^-/.test(a[i])){const f=lc(a[i]);if(f==='-s')sys=true;else if(f==='-i')inter=true;else if(f==='-d')detach=true;else if(f==='-u'||f==='-p'||f==='-w'||f==='-n')i++;i++;}
  const cmd=a.slice(i).join(' ');
  if(host){const h=findHost(host);if(!h||!h.up){out(`Couldn't access ${host}:`);out('Le chemin réseau n’a pas été trouvé.');out('');out('Make sure that the default admin$ share is enabled on '+host+'.');return 53;}host=h.n;}
  if(!cmd){out('(Indique la commande à lancer : psexec \\\\PC -s cmd)');return 1;}
  if(/^cmd(\.exe)?$/i.test(cmd)){out(`(Simulation) Invite de commandes ouverte sur ${host||'PC-IT-01'}${sys?' en tant que SYSTEM':''}. Tape exit pour revenir.`);return 0;}
  const save=st.psctx;st.psctx={host:host&&!findHost(host).self?host:null,system:sys};
  const r_=runCmdLine(cmd);st.psctx=save;r_.lines.forEach(x=>ctx.out.push(x));
  out(`${cmd.split(' ')[0]} exited on ${host||'PC-IT-01'} with error code ${st.errorlevel}.`);return st.errorlevel;
};
CMD.psexec64=CMD.psexec;
CMD['manage-bde']=function(args,ctx){outLines('managebde').forEach(x=>ctx.out.push(L(x)));return 0;};
CMD.powercfg=function(args,ctx){const a=args.map(lc).join(' ');if(/batteryreport/.test(a)){ctx.out.push(L('Rapport d’autonomie de la batterie enregistré dans le chemin de fichier C:\\Users\\it.tech\\battery-report.html.'));writeFile('C:\\Users\\it.tech\\battery-report.html','<html>Rapport batterie</html>');return 0;}if(/\/a\b|\/availablesleepstates/.test(a)){outLines('powercfg_a').forEach(x=>ctx.out.push(L(x)));return 0;}if(/\/energy/.test(a)){ctx.out.push(L('Rapport d’efficacité énergétique enregistré dans C:\\Windows\\system32\\energy-report.html (exécuter en administrateur).'));return 0;}if(/\/list|\/l\b/.test(a)){ctx.out.push(L(''));ctx.out.push(L('Modes de gestion de l’alimentation existants (* Actif)'));ctx.out.push(L('-----------------------------------'));ctx.out.push(L('GUID du mode de gestion de l’alimentation : 381b4222-f694-41f0-9685-ff5bb260df2e  (Utilisation normale) *'));return 0;}ctx.out.push(L('(Simulation) Essaie powercfg /a, /list, /batteryreport.'));return 0;};
CMD.driverquery=function(args,ctx){outLines('driverquery').forEach(x=>ctx.out.push(L(x)));return 0;};
CMD.dcdiag=function(args,ctx){const o=sw(args);if(o.has('?')){ctx.out.push(L('Syntaxe : dcdiag [/s:<contrôleur>] [/q] [/v] [/c] [/e] [/test:<test>]'));return 0;}if(o.has('q'))return 0;const srv=o.m.s&&o.m.s!==true?String(o.m.s).toUpperCase():null;if(srv){const h=findHost(srv);if(!h||!h.dc){ctx.err.push(`Le serveur ${srv} n’est pas un contrôleur de domaine joignable.`);return 1;}}outLines('dcdiag').forEach(x=>ctx.out.push(L(srv?x.replace(/SRV-AD01/g,srv):x)));return 0;};
CMD.repadmin=function(args,ctx){const a=args.map(lc).join(' ');outLines(/showrepl/.test(a)?'repadmin_showrepl':'repadmin_summary').forEach(x=>ctx.out.push(L(x)));return 0;};
CMD.netdom=function(args,ctx){const a=args.map(lc).join(' ');if(/query\s+fsmo/.test(a)){outLines('netdom_fsmo').forEach(x=>ctx.out.push(L(x)));return 0;}if(/resetpwd/.test(a)){ctx.out.push(L('Le mot de passe du compte ordinateur a été réinitialisé.'));ctx.out.push(L(''));ctx.out.push(L('La commande s’est terminée correctement.'));return 0;}ctx.out.push(L('(Simulation) netdom query fsmo / netdom resetpwd sont simulés.'));return 0;};
CMD.gpupdate.force=true;
