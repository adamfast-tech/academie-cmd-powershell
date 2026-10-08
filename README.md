# Académie CMD & PowerShell

Apprendre **CMD**, **PowerShell** et **Active Directory** comme un administrateur système, à la manière de Mimo :
leçons courtes, quiz, commandes à taper, terminal simulé et tickets de support réalistes (domaine fictif `contoso.local`).

**Site : https://adamfast-tech.github.io/academie-cmd-powershell/** (installable sur iPhone / Android : *Partager → Sur l’écran d’accueil*).

## Contenu
- 78 leçons, 630 exercices, du débutant à l’expert : fondamentaux, CMD et scripts batch, PowerShell et scripts .ps1, Active Directory, 10 tickets réels.
- Mémo : chaque commutateur décodé lettre par lettre (`/s` = **S**ubdirectories…), symboles (`\ / - | > 2>&1 %~dp0 $_ @{}`…), équivalences CMD ↔ PowerShell.
- Terminal simulé CMD + Windows PowerShell 5.1 (fichiers, services, réseau, registre, AD, journaux) avec défis.
- Administration à distance enseignée **sans WinRM** : partages d’administration, `sc \\PC`, CIM en DCOM, PsExec, RDP shadow.

## Comptes et progression
Comptes par e-mail + mot de passe + nom d’utilisateur (Supabase Auth). La progression (XP, leçons, série, badges)
et l’historique des leçons sont enregistrés dans Postgres, protégés par RLS : chacun ne lit et n’écrit que ses propres lignes.
Sans compte, la progression reste dans le navigateur ; elle est fusionnée dans le compte à la première connexion.

Schéma : [`supabase/schema.sql`](supabase/schema.sql). Suppression de compte : Edge Function [`delete-account`](supabase/functions/delete-account/index.ts).

## Structure
| Chemin | Rôle |
|---|---|
| `index.html` | Site généré (GitHub Pages) |
| `src/` | Sources : interface (`shell.html`, `app.js`), simulateur (`sim_*.js`), cours (`course_*.txt`), mémo (`dict_*.txt`) |
| `build.py` | Assemble `index.html` (et `academie.html`, version fichier unique hors ligne) |
| `vendor/` | supabase-js 2.117.0 (licence MIT) |

Reconstruire après une modification des sources : `python3 build.py`, puis publier : `git push origin main main:gh-pages` (GitHub Pages sert la branche `gh-pages`).
