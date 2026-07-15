#!/bin/sh
set -eu

ROOT=${1:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}
INSTALLER=$ROOT/install/universal/INSTALL-ZEROTOHERO.sh
make_temp_dir() {
  directory=$(mktemp -d)
  (CDPATH= cd -- "$directory" && pwd -P)
}
TARGET=$(make_temp_dir)
EMPTY_TARGET=$(make_temp_dir)
USER_AIDER_TARGET=$(make_temp_dir)
COLLISION_TARGET=$(make_temp_dir)
TAMPERED_TARGET=$(make_temp_dir)
COMMENTED_AIDER_TARGET=$(make_temp_dir)
MANIFEST_COLLISION_TARGET=$(make_temp_dir)
BACKUP_LINK_TARGET=$(make_temp_dir)
BACKUP_LINK_OUTSIDE=$(make_temp_dir)

cleanup() {
  rm -rf -- "$TARGET" "$EMPTY_TARGET" "$USER_AIDER_TARGET" "$COLLISION_TARGET" "$TAMPERED_TARGET" \
    "$COMMENTED_AIDER_TARGET" "$MANIFEST_COLLISION_TARGET" "$BACKUP_LINK_TARGET" "$BACKUP_LINK_OUTSIDE"
}
trap cleanup EXIT HUP INT TERM

printf 'user AGENTS instructions\n' > "$TARGET/AGENTS.md"
printf 'user GEMINI instructions\n' > "$TARGET/GEMINI.md"
printf 'read: [README.md]\nmodel: test\n' > "$TARGET/.aider.conf.yml"
sh "$INSTALLER" --target "$TARGET" >/dev/null
sh "$INSTALLER" --target "$TARGET" --verify >/dev/null
sh "$INSTALLER" --target "$TARGET" --uninstall >/dev/null
[ "$(cat "$TARGET/AGENTS.md")" = 'user AGENTS instructions' ]
[ "$(cat "$TARGET/GEMINI.md")" = 'user GEMINI instructions' ]
grep -Fqx 'read: [README.md]' "$TARGET/.aider.conf.yml"
grep -Fqx 'model: test' "$TARGET/.aider.conf.yml"
[ ! -e "$TARGET/ZEROTOHERO.md" ]
[ ! -e "$TARGET/zerotohero" ]
[ -d "$TARGET/.zerotohero-backups" ]

: > "$EMPTY_TARGET/AGENTS.md"
: > "$EMPTY_TARGET/GEMINI.md"
: > "$EMPTY_TARGET/.aider.conf.yml"
sh "$INSTALLER" --target "$EMPTY_TARGET" >/dev/null
sh "$INSTALLER" --target "$EMPTY_TARGET" --uninstall >/dev/null
[ -f "$EMPTY_TARGET/AGENTS.md" ] && [ ! -s "$EMPTY_TARGET/AGENTS.md" ]
[ -f "$EMPTY_TARGET/GEMINI.md" ] && [ ! -s "$EMPTY_TARGET/GEMINI.md" ]
[ -f "$EMPTY_TARGET/.aider.conf.yml" ] && [ ! -s "$EMPTY_TARGET/.aider.conf.yml" ]

printf 'read: [ZEROTOHERO.md]\nmodel: original\n' > "$USER_AIDER_TARGET/.aider.conf.yml"
sh "$INSTALLER" --target "$USER_AIDER_TARGET" >/dev/null
grep -Eq '"aider_entry_managed"[[:space:]]*:[[:space:]]*false' "$USER_AIDER_TARGET/zerotohero/.install-manifest.json"
printf 'model: user-updated\n' > "$USER_AIDER_TARGET/.aider.conf.yml"
sh "$INSTALLER" --target "$USER_AIDER_TARGET" --uninstall >/dev/null
grep -Fqx 'model: user-updated' "$USER_AIDER_TARGET/.aider.conf.yml"

printf '%s\n' \
  'other:' \
  '  - ZEROTOHERO.md' \
  'read: # keep this comment' \
  '  - README.md' \
  'model: test' > "$COMMENTED_AIDER_TARGET/.aider.conf.yml"
commented_before=$(cksum "$COMMENTED_AIDER_TARGET/.aider.conf.yml")
sh "$INSTALLER" --target "$COMMENTED_AIDER_TARGET" >/dev/null
grep -Fqx 'read: # keep this comment' "$COMMENTED_AIDER_TARGET/.aider.conf.yml"
grep -Fqx '  - ZEROTOHERO.md' "$COMMENTED_AIDER_TARGET/.aider.conf.yml"
sh "$INSTALLER" --target "$COMMENTED_AIDER_TARGET" --uninstall >/dev/null
[ "$(cksum "$COMMENTED_AIDER_TARGET/.aider.conf.yml")" = "$commented_before" ]

printf 'project-owned collision\n' > "$COLLISION_TARGET/ZEROTOHERO.md"
if sh "$INSTALLER" --target "$COLLISION_TARGET" >/dev/null 2>&1; then
  echo 'namespace collision unexpectedly installed' >&2
  exit 1
fi
grep -Fqx 'project-owned collision' "$COLLISION_TARGET/ZEROTOHERO.md"
[ ! -e "$COLLISION_TARGET/zerotohero" ]

mkdir -p "$MANIFEST_COLLISION_TARGET/zerotohero"
printf 'project-owned control file\n' > "$MANIFEST_COLLISION_TARGET/zerotohero/.install-manifest.json"
if sh "$INSTALLER" --target "$MANIFEST_COLLISION_TARGET" >/dev/null 2>&1; then
  echo 'manifest collision unexpectedly installed' >&2
  exit 1
fi
grep -Fqx 'project-owned control file' "$MANIFEST_COLLISION_TARGET/zerotohero/.install-manifest.json"
[ ! -e "$MANIFEST_COLLISION_TARGET/ZEROTOHERO.md" ]
[ ! -e "$MANIFEST_COLLISION_TARGET/.zerotohero-backups" ]

mkdir -p "$BACKUP_LINK_TARGET/.zerotohero-backups"
ln -s "$BACKUP_LINK_OUTSIDE" "$BACKUP_LINK_TARGET/.zerotohero-backups/run-known"
printf 'project instructions\n' > "$BACKUP_LINK_TARGET/AGENTS.md"
sh "$INSTALLER" --target "$BACKUP_LINK_TARGET" >/dev/null
[ -z "$(ls -A "$BACKUP_LINK_OUTSIDE")" ]
found_random_backup=0
for candidate in "$BACKUP_LINK_TARGET"/.zerotohero-backups/run-*; do
  [ -e "$candidate" ] || continue
  [ "$(basename -- "$candidate")" != 'run-known' ] || continue
  [ -d "$candidate" ] && [ ! -L "$candidate" ]
  suffix=$(basename -- "$candidate")
  suffix=${suffix#run-}
  [ "${#suffix}" -ge 16 ]
  found_random_backup=1
done
[ "$found_random_backup" -eq 1 ]

sh "$INSTALLER" --target "$TAMPERED_TARGET" >/dev/null
printf '\nuser modification\n' >> "$TAMPERED_TARGET/zerotohero/SKILL.md"
agents_before=$(cksum "$TAMPERED_TARGET/AGENTS.md")
if sh "$INSTALLER" --target "$TAMPERED_TARGET" --uninstall >/dev/null 2>&1; then
  echo 'tampered uninstall unexpectedly succeeded' >&2
  exit 1
fi
[ -f "$TAMPERED_TARGET/zerotohero/SKILL.md" ]
[ "$(cksum "$TAMPERED_TARGET/AGENTS.md")" = "$agents_before" ]

if sh "$INSTALLER" --target "$TARGET" --verify --migrate-legacy >/dev/null 2>&1; then
  echo 'verify plus migrate unexpectedly succeeded' >&2
  exit 1
fi
if sh "$INSTALLER" --target "$TARGET" --uninstall --migrate-legacy >/dev/null 2>&1; then
  echo 'uninstall plus migrate unexpectedly succeeded' >&2
  exit 1
fi

echo 'ok: POSIX install, verify, uninstall, and ownership safety'
