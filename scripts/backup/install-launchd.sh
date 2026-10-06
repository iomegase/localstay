#!/bin/bash
# Spec 081 AC-02-01 : installe (ou retire avec --uninstall) la sauvegarde quotidienne launchd.
# launchd rattrape l'exécution au réveil si le Mac dormait à l'heure prévue.
set -euo pipefail

LABEL="city.mystay.backup"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
DOMAIN="gui/$(id -u)"
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
BACKUP_DIR="${MYSTAY_BACKUP_DIR:-$HOME/Backups/mystay}"
HOUR="${MYSTAY_BACKUP_HOUR:-3}"

launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true

if [[ "${1:-}" == "--uninstall" ]]; then
  rm -f "$PLIST"
  echo "Sauvegarde quotidienne retirée."
  exit 0
fi

NODE_DIR="$(dirname "$(command -v node)")"
PG_DIR="$(dirname "$(command -v pg_dump)")"
mkdir -p "$HOME/Library/LaunchAgents" "$BACKUP_DIR/logs"

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$PROJECT_DIR/scripts/backup/backup.sh</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$NODE_DIR:$PG_DIR:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>MYSTAY_BACKUP_DIR</key><string>$BACKUP_DIR</string>
  </dict>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>$HOUR</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>StandardOutPath</key><string>$BACKUP_DIR/logs/launchd.out.log</string>
  <key>StandardErrorPath</key><string>$BACKUP_DIR/logs/launchd.err.log</string>
</dict>
</plist>
PLIST

plutil -lint "$PLIST" >/dev/null
launchctl bootstrap "$DOMAIN" "$PLIST"
echo "Sauvegarde quotidienne installée : tous les jours à ${HOUR}h00 → $BACKUP_DIR"
echo "Lancer maintenant : launchctl kickstart $DOMAIN/$LABEL"
