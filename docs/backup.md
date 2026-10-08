# Sauvegarde locale MyStay (spec 081)

Toutes les heures de 9 h à 22 h, une tâche launchd copie dans
`~/Backups/mystay` :

| Dossier | Contenu |
|---|---|
| `db/mystay-AAAA-MM-JJ-HHMM.dump` | Base Postgres Supabase (schémas `public`, `auth`, `storage`), format `pg_dump -Fc`, vérifiée à chaque fois. 30 jours conservés. |
| `storage/<bucket>/…` | Fichiers Supabase Storage (photos…), copie incrémentale. Un fichier supprimé chez Supabase reste ici. |
| `logs/` | Journal de chaque exécution. Une notification macOS signale tout échec. |
| `last-success.json` | Date de la dernière sauvegarde réussie. |

Les identifiants sont lus dans `.env.local` du projet (`DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`). Le script est en lecture seule côté Supabase.

## Planning

Une sauvegarde **toutes les heures de 9 h à 22 h** (le Mac dort la nuit). Hors de ce créneau
(rattrapage launchd au réveil, par exemple à 7 h) la tâche s'arrête sans rien faire.
Pour sauvegarder tout de suite, quelle que soit l'heure : `bash scripts/backup/backup.sh --force`.
Si le réseau n'est pas encore là, la sauvegarde l'attend jusqu'à 60 min (`MYSTAY_BACKUP_NETWORK_WAIT_MIN`).
Après une modification du planning : `bash scripts/backup/install-launchd.sh`.

## Commandes

```bash
./scripts/backup/backup.sh                          # sauvegarde immédiate
./scripts/backup/install-launchd.sh                 # (ré)installe la tâche quotidienne
./scripts/backup/install-launchd.sh --uninstall     # la retire
launchctl kickstart gui/$(id -u)/city.mystay.backup # déclenche la tâche installée
cat ~/Backups/mystay/last-success.json              # dernière réussite
```

Options (variables d'environnement à l'installation) : `MYSTAY_BACKUP_DIR`, `MYSTAY_BACKUP_HOUR`,
`MYSTAY_BACKUP_RETENTION_DAYS`.

Le Mac doit être allumé (même en veille) pour que la sauvegarde ait lieu. En cas de nouveau
projet ou de changement de version de Node / Postgres, relancer `install-launchd.sh`.

## Restaurer

> ⚠️ Ne jamais restaurer directement en production sans avoir vérifié le dump en local.
> Ne jamais utiliser `prisma migrate diff --shadow-database-url` ni `db push --accept-data-loss`
> sur la base de production.

### 1. Vérifier le dump dans une base locale jetable

```bash
BIN=/opt/homebrew/opt/postgresql@17/bin
DUMP=$(ls -t ~/Backups/mystay/db/*.dump | head -1)
$BIN/initdb -D /tmp/mystay-restore -U postgres --auth=trust
$BIN/pg_ctl -D /tmp/mystay-restore -o "-p 55432" -l /tmp/mystay-restore.log start
$BIN/createdb -h 127.0.0.1 -p 55432 -U postgres restore_test
$BIN/pg_restore -h 127.0.0.1 -p 55432 -U postgres -d restore_test --no-owner --no-privileges --schema=public "$DUMP"
$BIN/psql -h 127.0.0.1 -p 55432 -U postgres -d restore_test -c 'select count(*) from "City";'
$BIN/pg_ctl -D /tmp/mystay-restore stop && rm -rf /tmp/mystay-restore
```

### 2. Restaurer les données dans Supabase

Sur une base Supabase vide mais au schéma à jour (`npx prisma migrate deploy`), restaurer les
**données** du schéma `public` :

```bash
pg_restore --data-only --no-owner --no-privileges --schema=public --disable-triggers \
  --dbname="$DIRECT_URL" "$DUMP"
```

Les comptes de connexion (`auth.users`) se restaurent de la même façon avec
`--schema=auth --data-only`. Les fichiers de
`storage/<bucket>/` se ré-importent dans les buckets du même nom (tableau de bord Supabase ou
script `@supabase/supabase-js`).
