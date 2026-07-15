#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
output_arg=${1:-release-assets}

case "$output_arg" in
  /*) output=$output_arg ;;
  *) output=$root/$output_arg ;;
esac

output_parent=$(dirname -- "$output")
mkdir -p "$output_parent"
output_parent=$(CDPATH= cd -- "$output_parent" && pwd)
output=$output_parent/$(basename -- "$output")

if [ -e "$output" ]; then
  echo "Release output already exists: $output" >&2
  exit 1
fi

build_root=$(mktemp -d)
cleanup() {
  rm -rf -- "$build_root"
}
trap cleanup EXIT HUP INT TERM

assets=$build_root/release-assets
stages=$build_root/stages
mkdir -p "$assets" "$stages"

version=$(tr -d '\r\n ' < "$root/VERSION")
case "$version" in
  [0-9]*.[0-9]*.[0-9]*) ;;
  *) echo "Invalid VERSION: $version" >&2; exit 1 ;;
esac

make_zip() {
  archive=$1
  directory=$2
  if command -v zip >/dev/null 2>&1; then
    (cd "$directory" && zip -qr "$archive" .)
  elif command -v bsdtar >/dev/null 2>&1; then
    (cd "$directory" && bsdtar -a -cf "$archive" .)
  elif [ -x /c/Windows/System32/tar.exe ]; then
    (cd "$directory" && /c/Windows/System32/tar.exe -a -cf "$archive" .)
  else
    echo "A zip or bsdtar implementation is required" >&2
    exit 1
  fi
}

pack() {
  source=$1
  name=$2
  stage=$stages/$name
  mkdir -p "$stage"
  cp -a "$root/$source"/. "$stage"/
  if [ -f "$stage/README-ZEROTOHERO.md" ]; then
    sed -i "s/{version}/$version/g" "$stage/README-ZEROTOHERO.md"
  fi
  make_zip "$assets/zerotohero-$name-v$version.zip" "$stage"
}

pack install/universal universal
pack install/codex codex
pack install/claude-code claude-code
pack install/gemini-cli gemini-cli
pack install/github-copilot-cli github-copilot-cli
pack install/cursor cursor
pack install/windsurf windsurf
pack install/cline cline
pack install/roo-code roo-code
pack install/opencode opencode
pack install/kiro kiro
pack install/github-copilot-editor github-copilot-editor
pack install/aider aider

{
  cat "$root/zerotohero-copy-paste.md"
  printf '\n\n---\n\n## License\n\n'
  cat "$root/LICENSE"
  printf '\n\n'
  cat "$root/THIRD_PARTY_NOTICES.md"
} > "$assets/zerotohero-copy-paste-v$version.md"

sed "s/{version}/$version/g" "$root/dist/README.md" > "$assets/README-v$version.md"
cp "$root/LICENSE" "$assets/LICENSE-v$version.txt"
cp "$root/THIRD_PARTY_NOTICES.md" "$assets/THIRD_PARTY_NOTICES-v$version.md"

(cd "$assets" && sha256sum *) > "$build_root/SHA256SUMS"
mv "$build_root/SHA256SUMS" "$assets/SHA256SUMS"

for asset in universal codex claude-code gemini-cli github-copilot-cli cursor windsurf cline roo-code opencode kiro github-copilot-editor aider; do
  test -f "$assets/zerotohero-$asset-v$version.zip"
done
test -f "$assets/zerotohero-copy-paste-v$version.md"
test -f "$assets/LICENSE-v$version.txt"
test -f "$assets/THIRD_PARTY_NOTICES-v$version.md"
(cd "$assets" && sha256sum -c SHA256SUMS)

verify_entry() {
  archive=$1
  entry=$2
  listing=$build_root/archive-listing
  unzip -Z1 "$archive" | sed 's#^\./##' > "$listing"
  grep -Fxq "$entry" "$listing"
}

verify_product_metadata() {
  archive=$1
  prefix=$2
  verify_entry "$archive" "${prefix}LICENSE"
  verify_entry "$archive" "${prefix}THIRD_PARTY_NOTICES.md"
  verify_entry "$archive" "${prefix}VERSION"
}

verify_product_metadata "$assets/zerotohero-universal-v$version.zip" '.zerotohero-package/payload/zerotohero/'
verify_product_metadata "$assets/zerotohero-codex-v$version.zip" '.agents/skills/zerotohero/references/zerotohero/'
verify_product_metadata "$assets/zerotohero-claude-code-v$version.zip" '.claude/skills/zerotohero/references/zerotohero/'
verify_product_metadata "$assets/zerotohero-gemini-cli-v$version.zip" 'zerotohero/zerotohero/'
for asset in github-copilot-cli cursor windsurf cline roo-code opencode kiro github-copilot-editor aider; do
  verify_product_metadata "$assets/zerotohero-$asset-v$version.zip" 'zerotohero/'
done

for asset in universal codex claude-code gemini-cli github-copilot-cli cursor windsurf cline roo-code opencode kiro github-copilot-editor aider; do
  archive=$assets/zerotohero-$asset-v$version.zip
  verify_entry "$archive" 'README-ZEROTOHERO.md'
  readme_entry=$(unzip -Z1 "$archive" | grep -E '^(\./)?README-ZEROTOHERO\.md$')
  if unzip -p "$archive" "$readme_entry" | grep -Fq '{version}'; then
    echo "Unresolved version placeholder in $archive" >&2
    exit 1
  fi
done

grep -Fq 'MIT License' "$assets/zerotohero-copy-paste-v$version.md"
grep -Fq '# Third-Party Notices' "$assets/zerotohero-copy-paste-v$version.md"
cmp "$root/LICENSE" "$assets/LICENSE-v$version.txt"
cmp "$root/THIRD_PARTY_NOTICES.md" "$assets/THIRD_PARTY_NOTICES-v$version.md"

verify_entry "$assets/zerotohero-universal-v$version.zip" 'INSTALL-ZEROTOHERO.cmd'
verify_entry "$assets/zerotohero-universal-v$version.zip" 'INSTALL-ZEROTOHERO.ps1'
verify_entry "$assets/zerotohero-universal-v$version.zip" 'INSTALL-ZEROTOHERO.sh'
verify_entry "$assets/zerotohero-universal-v$version.zip" '.zerotohero-package/payload/.agents/skills/zerotohero/SKILL.md'
verify_entry "$assets/zerotohero-universal-v$version.zip" '.zerotohero-package/payload/.qoder/rules/zerotohero.md'
verify_entry "$assets/zerotohero-universal-v$version.zip" '.zerotohero-package/payload/.roo/rules/zerotohero.md'
verify_entry "$assets/zerotohero-codex-v$version.zip" '.agents/skills/zerotohero/SKILL.md'
verify_entry "$assets/zerotohero-claude-code-v$version.zip" '.claude/skills/zerotohero/SKILL.md'
verify_entry "$assets/zerotohero-gemini-cli-v$version.zip" 'zerotohero/GEMINI.md'
verify_entry "$assets/zerotohero-github-copilot-cli-v$version.zip" '.github/agents/zerotohero.agent.md'
verify_entry "$assets/zerotohero-github-copilot-cli-v$version.zip" '.github/instructions/zerotohero.instructions.md'
verify_entry "$assets/zerotohero-cursor-v$version.zip" '.cursor/rules/zerotohero.mdc'
verify_entry "$assets/zerotohero-windsurf-v$version.zip" '.windsurf/rules/zerotohero.md'
verify_entry "$assets/zerotohero-cline-v$version.zip" '.clinerules/zerotohero.md'
verify_entry "$assets/zerotohero-roo-code-v$version.zip" '.roo/rules/zerotohero.md'
verify_entry "$assets/zerotohero-opencode-v$version.zip" '.opencode/skills/zerotohero/SKILL.md'
verify_entry "$assets/zerotohero-kiro-v$version.zip" '.kiro/steering/zerotohero.md'
verify_entry "$assets/zerotohero-github-copilot-editor-v$version.zip" '.github/instructions/zerotohero.instructions.md'
verify_entry "$assets/zerotohero-aider-v$version.zip" 'AIDER-CONFIG-SNIPPET.yml'

install_test=$build_root/install-test
mkdir -p "$install_test/package" "$install_test/project"
unzip -q "$assets/zerotohero-universal-v$version.zip" -d "$install_test/package"
sh "$install_test/package/INSTALL-ZEROTOHERO.sh" --target "$install_test/project"
sh "$install_test/package/INSTALL-ZEROTOHERO.sh" --verify --target "$install_test/project"
sh "$install_test/package/INSTALL-ZEROTOHERO.sh" --uninstall --target "$install_test/project"
test ! -e "$install_test/project/ZEROTOHERO.md"
test ! -e "$install_test/project/zerotohero"

asset_count=$(find "$assets" -maxdepth 1 -type f | wc -l | tr -d ' ')
if [ "$asset_count" -ne 18 ]; then
  echo "Expected 18 release assets, found $asset_count" >&2
  exit 1
fi

mv "$assets" "$output"
echo "ok: 18 verified release assets for ZeroToHero $version -> $output"
