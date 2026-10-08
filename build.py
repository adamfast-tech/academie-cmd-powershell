#!/usr/bin/env python3
"""Assemble le site.

- index.html    : version web (GitHub Pages) avec comptes Supabase, installable sur téléphone.
- academie.html : version « tout en un » sans dépendance (artifact Claude, ouverture hors ligne).
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'

COURSES = ['course_base.txt', 'course_cmd1.txt', 'course_cmd2.txt',
           'course_ps1.txt', 'course_ps2.txt', 'course_ad.txt', 'course_ms.txt']
DICTS = ['dict_cmd.txt', 'dict_ps.txt', 'dict_sym.txt']
SIMS = ['sim_%s.js' % c for c in 'abcdefghijk']

# Clé publiable : conçue pour être publique, l'accès aux données est protégé par la RLS Postgres.
SUPABASE = {
    'url': 'https://cfcygkmrpxcjideljxxo.supabase.co',
    'key': 'sb_publishable_i68zVFGjYsUyKef3b3p4Zw_x_COmUOS',
}
SUPABASE_JS = 'vendor/supabase-2.117.0.min.js'


def read(name):
    t = (SRC / name).read_text(encoding='utf-8')
    if re.search(r'</script', t, re.I) or '<!--' in t:
        sys.exit('Séquence interdite dans ' + name)
    return t


def data_block(kind, names):
    return '\n'.join('<script type="%s">\n%s\n</script>' % (kind, read(n)) for n in names)


def body(extra_head_scripts=''):
    shell = (SRC / 'shell.html').read_text(encoding='utf-8')
    data = '\n'.join([
        '<script type="text/x-course">\n' + '\n'.join(read(n) for n in COURSES) + '\n</script>',
        data_block('text/x-dict', DICTS),
        data_block('text/x-simout', ['simout.txt']),
    ])
    js = '\n'.join(read(n) for n in SIMS)
    scripts = extra_head_scripts + '<script>\n' + js + '\n</script>\n<script>\n' + read('app.js') + '\n</script>'
    return shell.replace('<!--DATA-->', data).replace('<!--SCRIPTS-->', scripts)


# 1) Artifact / fichier unique
art = body()
(ROOT / 'academie.html').write_text(art, encoding='utf-8')

# 2) Version web
cfg = '<script>window.ACADEMIE_SUPABASE=' + json.dumps(SUPABASE) + ';</script>\n'
cfg += '<script src="%s"></script>\n' % SUPABASE_JS
sw = ("<script>if('serviceWorker' in navigator&&location.protocol==='https:'){"
      "var hadCtl=!!navigator.serviceWorker.controller,reloaded=false;"
      "navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadCtl&&!reloaded){reloaded=true;location.reload();}});"
      "window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(function(r){r.update();}).catch(function(){});});}</script>\n")
head = '''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Apprends CMD, PowerShell et Active Directory comme un admin système : leçons interactives, terminal simulé, tickets réels.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Académie">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
'''
web = head + body(cfg + sw) + '\n</body>\n</html>\n'
(ROOT / 'index.html').write_text(web, encoding='utf-8')
print('OK academie.html', len(art.encode()), 'octets ; index.html', len(web.encode()), 'octets')
