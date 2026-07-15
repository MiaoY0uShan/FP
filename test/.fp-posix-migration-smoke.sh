#!/bin/sh
set -eu

repo=/mnt/c/Users/fp/Desktop/github/zerotoheroskill/Xskill-p0
work=$(mktemp -d /tmp/fp-posix-smoke-XXXXXXXX)
case "$work" in
  /tmp/fp-posix-smoke-*) ;;
  *) echo "unexpected smoke-test path: $work" >&2; exit 99 ;;
esac
cleanup() { rm -rf -- "$work"; }
trap cleanup EXIT HUP INT TERM

old_installer=$work/old-installer
mkdir -p "$old_installer"
git -C "$repo" archive v0.3.1:install/universal | tar -xf - -C "$old_installer"

target=$work/user-project
mkdir -p "$target"
printf 'user AGENTS instructions\n' > "$target/AGENTS.md"
printf 'user GEMINI instructions\n' > "$target/GEMINI.md"
printf 'read: [README.md]\nmodel: test\n' > "$target/.aider.conf.yml"
sh "$old_installer/INSTALL-ZEROTOHERO.sh" --target "$target" >/dev/null
if sh "$repo/install/universal/INSTALL-FP.sh" --target "$target" >"$work/default.out" 2>&1; then exit 1; fi
grep -q 'ZeroToHero v0.3.x state would create two routers' "$work/default.out"
sh "$repo/install/universal/INSTALL-FP.sh" --target "$target" --migrate-legacy >/dev/null
sh "$repo/install/universal/INSTALL-FP.sh" --target "$target" --verify >/dev/null
grep -q '^user AGENTS instructions$' "$target/AGENTS.md"
grep -q '^user GEMINI instructions$' "$target/GEMINI.md"
grep -q 'README.md' "$target/.aider.conf.yml"
grep -q 'FP.md' "$target/.aider.conf.yml"
if grep -q 'ZEROTOHERO.md' "$target/.aider.conf.yml"; then exit 1; fi
test ! -e "$target/zerotohero"
test ! -e "$target/ZEROTOHERO.md"
find "$target/.fp-backups" -path '*/legacy-zerotohero/AGENTS.md' -type f | grep -q .
find "$target/.fp-backups" -path '*/legacy-zerotohero/.aider.conf.yml' -type f | grep -q .

tampered=$work/tampered-project
mkdir -p "$tampered"
sh "$old_installer/INSTALL-ZEROTOHERO.sh" --target "$tampered" >/dev/null
printf 'project README\n' > "$tampered/README.md"
sed -i '0,/\.agents\/rules\/zerotohero\.md/s//README.md/' "$tampered/zerotohero/.install-manifest.json"
readme_before=$(cksum "$tampered/README.md")
if sh "$repo/install/universal/INSTALL-FP.sh" --target "$tampered" --migrate-legacy >"$work/tampered.out" 2>&1; then exit 1; fi
grep -q 'manifest is invalid' "$work/tampered.out"
test "$readme_before" = "$(cksum "$tampered/README.md")"
test -f "$tampered/zerotohero/SKILL.md"
test ! -e "$tampered/fp"
test ! -e "$tampered/.fp-backups"

echo "POSIX user-state and tampered-manifest migration smoke passed"
