#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TARGET=$SCRIPT_DIR
VERIFY=0
UNINSTALL=0
MIGRATE_LEGACY=0
POSITIONAL_TARGET=0
PREVIOUS_INSTALL_VALID=0
AIDER_ENTRY_MANAGED=0
AIDER_READ_CREATED=0
CREATED_AGENTS=0
CREATED_GEMINI=0
CREATED_AIDER=0
LEGACY_ZTH_MANIFEST_VALID=0
LEGACY_ZTH_AIDER_ENTRY_MANAGED=0
LEGACY_ZTH_AIDER_READ_CREATED=0
LEGACY_ZTH_CREATED_AGENTS=0
LEGACY_ZTH_CREATED_GEMINI=0
LEGACY_ZTH_CREATED_AIDER=0
LEGACY_ZTH_PATHS=
LEGACY_ZTH_HAS_MARKERS=0
LEGACY_ZTH_REMOVE_AIDER=0
LEGACY_ZTH_DETECTED=0

usage() {
  echo "usage: $0 [--target PROJECT | PROJECT] [--verify | --uninstall | --migrate-legacy]" >&2
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --target)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      TARGET=$2
      POSITIONAL_TARGET=1
      shift 2
      ;;
    --verify)
      VERIFY=1
      shift
      ;;
    --uninstall)
      UNINSTALL=1
      shift
      ;;
    --migrate-legacy)
      MIGRATE_LEGACY=1
      shift
      ;;
    --*)
      usage
      exit 2
      ;;
    *)
      [ "$POSITIONAL_TARGET" -eq 0 ] || { usage; exit 2; }
      TARGET=$1
      POSITIONAL_TARGET=1
      shift
      ;;
  esac
done

MODE_COUNT=$((VERIFY + UNINSTALL + MIGRATE_LEGACY))
[ "$MODE_COUNT" -le 1 ] || { echo "--verify, --uninstall, and --migrate-legacy cannot be combined" >&2; exit 2; }

PACKAGE_ROOT=$SCRIPT_DIR/.fp-package
PAYLOAD_ROOT=$PACKAGE_ROOT/payload
FRAGMENT_ROOT=$PACKAGE_ROOT/fragments
[ -d "$PAYLOAD_ROOT" ] || { echo "invalid FP package: missing $PAYLOAD_ROOT" >&2; exit 1; }
VERSION=unknown
[ ! -f "$PACKAGE_ROOT/VERSION" ] || VERSION=$(tr -d '\r\n ' < "$PACKAGE_ROOT/VERSION")
BACKUP_ROOT=

topology_error() {
  echo "unsafe target topology: $1. No installation files were changed." >&2
  exit 1
}

assert_no_symlink_chain() {
  current=$1
  while [ -n "$current" ]; do
    [ ! -L "$current" ] || topology_error "$current is a symbolic link"
    parent=$(dirname -- "$current")
    [ "$parent" != "$current" ] || break
    current=$parent
  done
}

assert_target_path() {
  relative=$1
  expected=$2
  case "$relative" in
    ''|/*|../*|*/../*|*/..|.) topology_error "invalid managed relative path $relative" ;;
  esac
  parent_relative=$(dirname -- "$relative")
  current=$TARGET
  old_ifs=$IFS
  IFS=/
  for segment in $parent_relative; do
    [ "$segment" = "." ] && continue
    current=$current/$segment
    [ ! -L "$current" ] || topology_error "$relative has symbolic-link ancestor $current"
    if [ -e "$current" ] && [ ! -d "$current" ]; then
      topology_error "$relative requires directory $current but a non-directory exists"
    fi
  done
  IFS=$old_ifs
  leaf=$TARGET/$relative
  [ ! -L "$leaf" ] || topology_error "$relative is a symbolic link"
  if [ -e "$leaf" ]; then
    if [ "$expected" = "file" ] && [ -d "$leaf" ]; then
      topology_error "$relative must be a file but is a directory"
    fi
    if [ "$expected" = "directory" ] && [ ! -d "$leaf" ]; then
      topology_error "$relative must be a directory but is a file"
    fi
  fi
}

aider_analysis() {
  file=$1
  entry=${2:-FP.md}
  [ -f "$file" ] || { echo '0|none|0'; return 0; }
  awk -v target_entry="$entry" '
    function trim(value) { gsub(/^[[:space:]]+|[[:space:]]+$/, "", value); return value }
    function is_entry(value) {
      value = trim(value)
      gsub(/^["\047]|["\047]$/, "", value)
      return value == target_entry
    }
    BEGIN { count = 0; shape = "none"; entries = 0; block = 0 }
    { sub(/\r$/, "") }
    /^read[[:space:]]*:/ {
      count++
      block = 0
      rest = $0
      sub(/^read[[:space:]]*:[[:space:]]*/, "", rest)
      candidate = rest
      sub(/[[:space:]]+#.*$/, "", candidate)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", candidate)
      if (candidate ~ /^#/) candidate = ""
      if (candidate ~ /^[[:space:]]*$/) {
        shape = "block"
        block = 1
      } else if (candidate ~ /^\[[^]]*\]$/) {
        shape = "inline"
        items = candidate
        sub(/^\[/, "", items)
        sub(/\]$/, "", items)
        item_count = split(items, parts, /,/)
        for (i = 1; i <= item_count; i++) if (is_entry(parts[i])) entries++
      } else {
        value = candidate
        if (value ~ /^[>|{&*!\[]/) shape = "unsupported"
        else {
          shape = "scalar"
          if (is_entry(value)) entries++
        }
      }
      next
    }
    block && /^[^[:space:]#]/ { block = 0 }
    block {
      if ($0 ~ /^[[:space:]]*($|#)/) next
      if ($0 !~ /^[[:space:]]*-[[:space:]]+/) {
        shape = "unsupported"
        block = 0
        next
      }
      item = $0
      sub(/^[[:space:]]*-[[:space:]]+/, "", item)
      sub(/[[:space:]]+#.*$/, "", item)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", item)
      if (item == "" || item ~ /^[>|{&*!\[]/ || item ~ /:[[:space:]]/) {
        shape = "unsupported"
        block = 0
        next
      }
      if (is_entry(item)) entries++
      next
    }
    END { printf "%d|%s|%d\n", count, shape, entries }
  ' "$file"
}

marker_preflight() {
  relative=$1
  marker_prefix=${2:-fp}
  file=$TARGET/$relative
  [ -f "$file" ] || return 0
  start="<!-- $marker_prefix:start -->"
  end="<!-- $marker_prefix:end -->"
  starts=$(awk -v marker="$start" 'sub(/\r$/, ""); $0 == marker { count++ } END { print count + 0 }' "$file")
  ends=$(awk -v marker="$end" 'sub(/\r$/, ""); $0 == marker { count++ } END { print count + 0 }' "$file")
  raw_starts=$(awk -v marker="$start" 'index($0, marker) { count++ } END { print count + 0 }' "$file")
  raw_ends=$(awk -v marker="$end" 'index($0, marker) { count++ } END { print count + 0 }' "$file")
  if [ "$starts" -ne "$ends" ] || [ "$starts" -gt 1 ] || [ "$raw_starts" -ne "$starts" ] || [ "$raw_ends" -ne "$ends" ]; then
    echo "$relative has corrupt or duplicate $marker_prefix managed markers; no installation files were changed" >&2
    exit 1
  fi
  if [ "$starts" -eq 1 ]; then
    start_line=$(awk -v marker="$start" 'sub(/\r$/, ""); $0 == marker { print NR }' "$file")
    end_line=$(awk -v marker="$end" 'sub(/\r$/, ""); $0 == marker { print NR }' "$file")
    [ "$start_line" -lt "$end_line" ] || { echo "$relative has reversed $marker_prefix markers; no installation files were changed" >&2; exit 1; }
  fi
}

legacy_paths() {
  for relative in \
    xskill \
    .agents/skills/xskill \
    .agents/rules/xskill.md \
    .codex/skills/xskill \
    .claude/skills/xskill \
    .opencode/skills/xskill \
    .openclaw/skills/xskill \
    .cursor/rules/xskill.mdc \
    .windsurf/rules/xskill.md \
    .clinerules/xskill.md \
    .roo/rules/xskill.md \
    .github/agents/xskill.agent.md \
    .github/instructions/xskill.instructions.md \
    .kiro/steering/xskill.md \
    .qoder/rules/xskill.md \
    .junie/xskill.md \
    XSKILL.md
  do
    [ ! -e "$TARGET/$relative" ] || printf '%s\n' "$relative"
  done
}

manifest_array_values() {
  key=$1
  file=$2
  awk -v key="\"$key\"" '
    function emit(line, count, parts, i, value) {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
      if (line == "") return
      count = split(line, parts, /,/)
      for (i = 1; i <= count; i++) {
        value = parts[i]
        gsub(/^[[:space:]]*"|"[[:space:]]*$/, "", value)
        if (value != "") print value
      }
    }
    index($0, key) {
      line = $0
      sub(/^.*\[/, "", line)
      if (line ~ /\]/) {
        sub(/\].*$/, "", line)
        emit(line)
        exit
      }
      inside = 1
      next
    }
    inside && /\]/ { exit }
    inside {
      line = $0
      sub(/^[[:space:]]*"/, "", line)
      sub(/",?[[:space:]]*$/, "", line)
      if (line != "") print line
    }
  ' "$file"
}

expected_owned_files() {
  { cd "$PAYLOAD_ROOT" && find . -type f -print | sed 's#^\./##'; printf '%s\n' FP.md; } | LC_ALL=C sort
}

reserved_owned_paths() {
  { expected_owned_files; printf '%s\n' fp/.install-manifest.json; } | LC_ALL=C sort -u
}

expected_zerotohero_owned_files() {
  {
    cd "$PAYLOAD_ROOT"
    find . -type f -print | sed 's#^\./##; s/FP/ZEROTOHERO/g; s/fp/zerotohero/g'
    printf '%s\n' ZEROTOHERO.md
  } | LC_ALL=C sort -u
}

legacy_zerotohero_manifest_error() {
  echo "legacy ZeroToHero v0.3.x manifest is invalid or does not match the known package ownership set. No installation files were changed." >&2
  exit 1
}

recognize_legacy_zerotohero() {
  manifest=$TARGET/zerotohero/.install-manifest.json
  if [ -e "$manifest" ]; then
    assert_target_path zerotohero/.install-manifest.json file
    [ -f "$manifest" ] || legacy_zerotohero_manifest_error
    grep -Eq '"product"[[:space:]]*:[[:space:]]*"ZeroToHero"[[:space:]]*,?[[:space:]]*$' "$manifest" || legacy_zerotohero_manifest_error
    grep -Eq '"version"[[:space:]]*:[[:space:]]*"0\.3\.[0-9]+"[[:space:]]*,?[[:space:]]*$' "$manifest" || legacy_zerotohero_manifest_error
    grep -Eq '"aider_entry_managed"[[:space:]]*:[[:space:]]*(true|false)[[:space:]]*,?[[:space:]]*$' "$manifest" || legacy_zerotohero_manifest_error
    grep -Eq '"aider_read_created"[[:space:]]*:[[:space:]]*(true|false)[[:space:]]*,?[[:space:]]*$' "$manifest" || legacy_zerotohero_manifest_error

    expected=$(mktemp)
    actual=$(mktemp)
    expected_zerotohero_owned_files > "$expected"
    manifest_array_values owned_files "$manifest" | LC_ALL=C sort > "$actual"
    if ! cmp -s "$expected" "$actual"; then
      rm -f "$expected" "$actual"
      legacy_zerotohero_manifest_error
    fi
    printf '%s\n' .aider.conf.yml AGENTS.md GEMINI.md | LC_ALL=C sort > "$expected"
    manifest_array_values managed_files "$manifest" | LC_ALL=C sort > "$actual"
    if ! cmp -s "$expected" "$actual"; then
      rm -f "$expected" "$actual"
      legacy_zerotohero_manifest_error
    fi
    rm -f "$expected" "$actual"

    created=$(manifest_array_values created_managed_files "$manifest" || true)
    invalid_created=$(printf '%s\n' "$created" | awk 'NF && $0 != "AGENTS.md" && $0 != "GEMINI.md" && $0 != ".aider.conf.yml" { print }')
    [ -z "$invalid_created" ] || legacy_zerotohero_manifest_error
    printf '%s\n' "$created" | grep -Fqx AGENTS.md && LEGACY_ZTH_CREATED_AGENTS=1 || true
    printf '%s\n' "$created" | grep -Fqx GEMINI.md && LEGACY_ZTH_CREATED_GEMINI=1 || true
    printf '%s\n' "$created" | grep -Fqx .aider.conf.yml && LEGACY_ZTH_CREATED_AIDER=1 || true
    grep -Eq '"aider_entry_managed"[[:space:]]*:[[:space:]]*true' "$manifest" && LEGACY_ZTH_AIDER_ENTRY_MANAGED=1 || true
    grep -Eq '"aider_read_created"[[:space:]]*:[[:space:]]*true' "$manifest" && LEGACY_ZTH_AIDER_READ_CREATED=1 || true
    LEGACY_ZTH_MANIFEST_VALID=1
    LEGACY_ZTH_PATHS=$( { expected_zerotohero_owned_files; printf '%s\n' zerotohero/.install-manifest.json; } | while IFS= read -r relative; do
      [ ! -e "$TARGET/$relative" ] || printf '%s\n' "$relative"
    done)
    return 0
  fi

  LEGACY_ZTH_PATHS=$(expected_zerotohero_owned_files | while IFS= read -r relative; do
    [ ! -e "$TARGET/$relative" ] || printf '%s\n' "$relative"
  done)
}

recognize_previous_install() {
  manifest=$TARGET/fp/.install-manifest.json
  [ -f "$manifest" ] || return 0
  grep -Fqx '  "product": "FP",' "$manifest" || return 0
  grep -Eq '"aider_entry_managed"[[:space:]]*:[[:space:]]*(true|false)' "$manifest" || return 0
  grep -Eq '"aider_read_created"[[:space:]]*:[[:space:]]*(true|false)' "$manifest" || return 0
  expected=$(mktemp)
  actual=$(mktemp)
  printf '%s\n' .aider.conf.yml AGENTS.md GEMINI.md | LC_ALL=C sort > "$expected"
  manifest_array_values managed_files "$manifest" | LC_ALL=C sort > "$actual"
  if ! cmp -s "$expected" "$actual"; then rm -f "$expected" "$actual"; return 0; fi
  expected_owned_files > "$expected"
  manifest_array_values owned_files "$manifest" | LC_ALL=C sort > "$actual"
  if cmp -s "$expected" "$actual"; then PREVIOUS_INSTALL_VALID=1; fi
  rm -f "$expected" "$actual"
  [ "$PREVIOUS_INSTALL_VALID" -eq 1 ] || return 0

  created=$(manifest_array_values created_managed_files "$manifest" || true)
  invalid_created=$(printf '%s\n' "$created" | awk 'NF && $0 != "AGENTS.md" && $0 != "GEMINI.md" && $0 != ".aider.conf.yml" { print }')
  if [ -n "$invalid_created" ]; then PREVIOUS_INSTALL_VALID=0; return 0; fi
  printf '%s\n' "$created" | grep -Fqx AGENTS.md && CREATED_AGENTS=1 || true
  printf '%s\n' "$created" | grep -Fqx GEMINI.md && CREATED_GEMINI=1 || true
  printf '%s\n' "$created" | grep -Fqx .aider.conf.yml && CREATED_AIDER=1 || true
  grep -Eq '"aider_entry_managed"[[:space:]]*:[[:space:]]*true' "$manifest" && AIDER_ENTRY_MANAGED=1 || true
  grep -Eq '"aider_read_created"[[:space:]]*:[[:space:]]*true' "$manifest" && AIDER_READ_CREATED=1 || true
}

preflight() {
  assert_no_symlink_chain "$TARGET"
  assert_target_path .fp-backups directory
  for relative in AGENTS.md GEMINI.md .aider.conf.yml FP.md fp/.install-manifest.json; do
    assert_target_path "$relative" file
  done
  (cd "$PAYLOAD_ROOT" && find . -type f -print) | while IFS= read -r relative; do
    assert_target_path "${relative#./}" file
  done
  if [ "$PREVIOUS_INSTALL_VALID" -eq 0 ]; then
    reserved_owned_paths | while IFS= read -r relative; do
      [ ! -f "$TARGET/$relative" ] || {
        echo "FP-owned path already exists without a valid install manifest: $relative. Move it aside before installing; no installation files were changed." >&2
        exit 1
      }
    done
  fi
  marker_preflight AGENTS.md
  marker_preflight GEMINI.md
  marker_preflight AGENTS.md zerotohero
  marker_preflight GEMINI.md zerotohero
  analysis=$(aider_analysis "$TARGET/.aider.conf.yml")
  count=${analysis%%|*}
  remainder=${analysis#*|}
  shape=${remainder%%|*}
  if [ "$count" -gt 1 ] || [ "$shape" = "unsupported" ]; then
    echo ".aider.conf.yml uses duplicate or unsupported read YAML; use a block list, inline list, or simple scalar. No installation files were changed." >&2
    exit 1
  fi

  legacy_marker_count=0
  for relative in AGENTS.md GEMINI.md; do
    [ ! -f "$TARGET/$relative" ] || legacy_marker_count=$((legacy_marker_count + $(awk 'sub(/\r$/, ""); $0 == "<!-- zerotohero:start -->" { count++ } END { print count + 0 }' "$TARGET/$relative")))
  done
  [ "$legacy_marker_count" -eq 0 ] || LEGACY_ZTH_HAS_MARKERS=1
  legacy_aider=$(aider_analysis "$TARGET/.aider.conf.yml" ZEROTOHERO.md)
  legacy_entries=${legacy_aider##*|}
  if [ "$legacy_entries" -gt 1 ]; then
    echo ".aider.conf.yml has duplicate legacy ZEROTOHERO.md read entries. No installation files were changed." >&2
    exit 1
  fi
  if [ "$legacy_entries" -eq 1 ] && { [ "$LEGACY_ZTH_MANIFEST_VALID" -eq 0 ] || [ "$LEGACY_ZTH_AIDER_ENTRY_MANAGED" -eq 1 ]; }; then
    LEGACY_ZTH_REMOVE_AIDER=1
  fi

  if [ -n "$LEGACY_ZTH_PATHS" ]; then
    printf '%s\n' "$LEGACY_ZTH_PATHS" | while IFS= read -r relative; do
      [ -n "$relative" ] || continue
      assert_target_path "$relative" file
      assert_no_symlink_chain "$TARGET/$relative"
    done
  fi
  if [ -n "$LEGACY_ZTH_PATHS" ] || [ "$LEGACY_ZTH_HAS_MARKERS" -eq 1 ] || [ "$LEGACY_ZTH_REMOVE_AIDER" -eq 1 ]; then
    LEGACY_ZTH_DETECTED=1
  fi

  LEGACY_PATHS=$(legacy_paths)
  if [ -n "$LEGACY_PATHS" ]; then
    printf '%s\n' "$LEGACY_PATHS" | while IFS= read -r relative; do
      [ -n "$relative" ] || continue
      assert_no_symlink_chain "$TARGET/$relative"
    done
  fi
  if { [ -n "$LEGACY_PATHS" ] || [ "$LEGACY_ZTH_DETECTED" -eq 1 ]; } && [ "$UNINSTALL" -eq 0 ] && { [ "$MIGRATE_LEGACY" -eq 0 ] || [ "$VERIFY" -eq 1 ]; }; then
    echo "Legacy Xskill and/or ZeroToHero v0.3.x state would create two routers." >&2
    echo "Rerun with --migrate-legacy to back it up and remove it before installing FP." >&2
    exit 1
  fi
}

reserve_backup_run() {
  [ -z "$BACKUP_ROOT" ] || return 0
  backup_base=$TARGET/.fp-backups
  assert_target_path .fp-backups directory
  old_umask=$(umask)
  umask 077
  mkdir -p -- "$backup_base"
  assert_no_symlink_chain "$backup_base"
  candidate=$(mktemp -d "$backup_base/run-XXXXXXXXXXXXXXXX") || {
    umask "$old_umask"
    topology_error "could not create a unique backup run directory"
  }
  assert_no_symlink_chain "$candidate"
  BACKUP_ROOT=$candidate
  umask "$old_umask"
}

backup_file() {
  relative=$1
  source_path=$TARGET/$relative
  [ -f "$source_path" ] || return 0
  reserve_backup_run
  mkdir -p "$BACKUP_ROOT/$(dirname -- "$relative")"
  cp "$source_path" "$BACKUP_ROOT/$relative"
}

backup_legacy_file() {
  legacy_backup_category=$1
  legacy_backup_relative=$2
  legacy_backup_source=$TARGET/$legacy_backup_relative
  [ -f "$legacy_backup_source" ] || return 0
  reserve_backup_run
  legacy_backup_destination=$BACKUP_ROOT/$legacy_backup_category/$legacy_backup_relative
  mkdir -p "$(dirname -- "$legacy_backup_destination")"
  cp "$legacy_backup_source" "$legacy_backup_destination"
}

migrate_legacy() {
  [ -n "$LEGACY_PATHS" ] || return 0
  reserve_backup_run
  printf '%s\n' "$LEGACY_PATHS" | while IFS= read -r relative; do
    [ -n "$relative" ] || continue
    source_path=$TARGET/$relative
    destination=$BACKUP_ROOT/legacy-xskill/$relative
    mkdir -p "$(dirname -- "$destination")"
    cp -R "$source_path" "$destination"
    rm -rf -- "$source_path"
  done
}

merge_markdown() {
  relative=$1
  fragment=$2
  destination=$TARGET/$relative
  start='<!-- fp:start -->'
  end='<!-- fp:end -->'
  temp=$(mktemp)
  if [ -f "$destination" ]; then
    awk -v start="$start" -v end="$end" '
      { sub(/\r$/, "") }
      $0 == start { skip = 1; next }
      skip && $0 == end { skip = 0; next }
      !skip { print }
    ' "$destination" > "$temp"
  fi
  awk '{ lines[NR] = $0 } END { last = NR; while (last > 0 && lines[last] == "") last--; for (i = 1; i <= last; i++) print lines[i] }' "$temp" > "$temp.trim"
  mv "$temp.trim" "$temp"
  [ ! -s "$temp" ] || printf '\n\n' >> "$temp"
  printf '%s\n' "$start" >> "$temp"
  cat "$fragment" >> "$temp"
  printf '\n%s\n' "$end" >> "$temp"
  if [ ! -f "$destination" ] || ! cmp -s "$temp" "$destination"; then
    backup_file "$relative"
    mkdir -p "$(dirname -- "$destination")"
    mv "$temp" "$destination"
  else
    rm -f "$temp"
  fi
}

merge_aider() {
  destination=$TARGET/.aider.conf.yml
  analysis=$(aider_analysis "$destination")
  remainder=${analysis#*|}
  shape=${remainder%%|*}
  has=${analysis##*|}
  [ "$has" -eq 0 ] || return 0
  temp=$(mktemp)

  if [ ! -s "$destination" ]; then
    printf 'read:\n  - FP.md\n' > "$temp"
  elif [ "$shape" = "none" ]; then
    cat "$destination" > "$temp"
    printf '\nread:\n  - FP.md\n' >> "$temp"
  else
    awk -v shape="$shape" '
      BEGIN { inserted = 0 }
      { sub(/\r$/, "") }
      shape == "block" && /^read[[:space:]]*:[[:space:]]*(#.*)?$/ && !inserted {
        print
        print "  - FP.md"
        inserted = 1
        next
      }
      shape == "inline" && /^read[[:space:]]*:[[:space:]]*\[[^]]*\][[:space:]]*(#.*)?$/ && !inserted {
        line = $0
        comment = ""
        if (match(line, /[[:space:]]+#.*/)) {
          comment = substr(line, RSTART)
          line = substr(line, 1, RSTART - 1)
        }
        if (line ~ /\[[[:space:]]*\][[:space:]]*$/) {
          sub(/\[[[:space:]]*\][[:space:]]*$/, "[\"FP.md\"]", line)
        } else {
          sub(/\][[:space:]]*$/, ", \"FP.md\"]", line)
        }
        print line comment
        inserted = 1
        next
      }
      shape == "scalar" && /^read[[:space:]]*:/ && !inserted {
        line = $0
        sub(/^read[[:space:]]*:[[:space:]]*/, "", line)
        comment = ""
        if (match(line, /[[:space:]]+#.*/)) {
          comment = substr(line, RSTART)
          line = substr(line, 1, RSTART - 1)
        }
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
        print "read:"
        print "  - " line comment
        print "  - FP.md"
        inserted = 1
        next
      }
      { print }
      END { if (!inserted) exit 3 }
    ' "$destination" > "$temp" || { rm -f "$temp"; echo "safe Aider merge failed before replacement" >&2; exit 1; }
  fi

  backup_file .aider.conf.yml
  mv "$temp" "$destination"
}

remove_markdown() {
  relative=$1
  created=$2
  marker_prefix=${3:-fp}
  backup_prefix=${4:-}
  marker_start="<!-- $marker_prefix:start -->"
  marker_end="<!-- $marker_prefix:end -->"
  destination=$TARGET/$relative
  temp=$(mktemp)
  awk -v start="$marker_start" -v end="$marker_end" '
    { sub(/\r$/, "") }
    $0 == start { skip = 1; next }
    skip && $0 == end { skip = 0; next }
    !skip { lines[++count] = $0 }
    END {
      while (count > 0 && lines[count] == "") count--
      for (i = 1; i <= count; i++) print lines[i]
    }
  ' "$destination" > "$temp"
  if [ -n "$backup_prefix" ]; then backup_legacy_file "$backup_prefix" "$relative"; else backup_file "$relative"; fi
  if [ ! -s "$temp" ]; then
    rm -f "$temp"
    if [ "$created" -eq 1 ]; then rm -f "$destination"; else : > "$destination"; fi
  else
    mv "$temp" "$destination"
  fi
}

remove_aider_entry() {
  aider_entry=${1:-FP.md}
  entry_managed=${2:-$AIDER_ENTRY_MANAGED}
  created_aider=${3:-$CREATED_AIDER}
  read_created=${4:-$AIDER_READ_CREATED}
  backup_prefix=${5:-}
  [ "$entry_managed" -eq 1 ] || return 0
  destination=$TARGET/.aider.conf.yml
  analysis=$(aider_analysis "$destination" "$aider_entry")
  remainder=${analysis#*|}
  shape=${remainder%%|*}
  entries=${analysis##*|}
  [ "$entries" -eq 1 ] || { echo "safe Aider uninstall requires exactly one managed read entry" >&2; exit 1; }
  temp=$(mktemp)
  awk -v shape="$shape" -v read_created="$read_created" -v target_entry="$aider_entry" '
    function trim(value) { gsub(/^[[:space:]]+|[[:space:]]+$/, "", value); return value }
    function is_entry(value) {
      value = trim(value)
      gsub(/^["\047]|["\047]$/, "", value)
      return value == target_entry
    }
    { sub(/\r$/, "") }
    /^read[[:space:]]*:/ && !handled {
      if (shape == "scalar") { handled = 1; next }
      if (shape == "inline") {
        line = $0
        comment = ""
        if (match(line, /[[:space:]]+#.*/)) {
          comment = substr(line, RSTART)
          line = substr(line, 1, RSTART - 1)
        }
        prefix = line
        sub(/\[.*/, "", prefix)
        items = line
        sub(/^[^[]*\[/, "", items)
        sub(/\].*$/, "", items)
        count = split(items, parts, /,/)
        joined = ""
        for (i = 1; i <= count; i++) {
          item = trim(parts[i])
          if (item == "" || is_entry(item)) continue
          joined = joined (joined == "" ? "" : ", ") item
        }
        lines[++out] = prefix "[" joined "]" comment
        handled = 1
        next
      }
      if (shape == "block") {
        in_read = 1
        handled = 1
        if (!read_created) lines[++out] = $0
        next
      }
    }
    in_read && /^[^[:space:]#]/ { in_read = 0 }
    in_read && /^[[:space:]]*-[[:space:]]+/ {
      item = $0
      sub(/^[[:space:]]*-[[:space:]]+/, "", item)
      sub(/[[:space:]]+#.*$/, "", item)
      if (is_entry(item)) next
    }
    { lines[++out] = $0 }
    END {
      for (i = 1; i <= out; i++) print lines[i]
    }
  ' "$destination" > "$temp" || { rm -f "$temp"; echo "safe Aider uninstall failed before replacement" >&2; exit 1; }

  trimmed=$(mktemp)
  awk '{ lines[NR] = $0 } END { last = NR; while (last > 0 && lines[last] == "") last--; for (i = 1; i <= last; i++) print lines[i] }' "$temp" > "$trimmed"
  rm -f "$temp"
  if [ -n "$backup_prefix" ]; then backup_legacy_file "$backup_prefix" .aider.conf.yml; else backup_file .aider.conf.yml; fi
  empty_after_remove=0
  if [ ! -s "$trimmed" ]; then
    empty_after_remove=1
  elif [ "$(wc -l < "$trimmed" | tr -d ' ')" -eq 1 ] && grep -Eq '^[[:space:]]*read[[:space:]]*:[[:space:]]*$' "$trimmed"; then
    empty_after_remove=1
  fi
  if [ "$empty_after_remove" -eq 1 ]; then
    rm -f "$trimmed"
    if [ "$created_aider" -eq 1 ]; then rm -f "$destination"; else : > "$destination"; fi
  else
    mv "$trimmed" "$destination"
  fi
}

remove_owned_directories() {
  list=$1
  while IFS= read -r relative; do
    directory=$(dirname -- "$relative")
    while [ "$directory" != "." ] && [ -n "$directory" ]; do
      rmdir -- "$TARGET/$directory" 2>/dev/null || break
      directory=$(dirname -- "$directory")
    done
  done < "$list"
}

migrate_zerotohero() {
  [ "$LEGACY_ZTH_DETECTED" -eq 1 ] || return 0
  reserve_backup_run

  for relative in AGENTS.md GEMINI.md; do
    [ -f "$TARGET/$relative" ] || continue
    grep -Fqx '<!-- zerotohero:start -->' "$TARGET/$relative" || continue
    case "$relative" in
      AGENTS.md) created=$LEGACY_ZTH_CREATED_AGENTS ;;
      GEMINI.md) created=$LEGACY_ZTH_CREATED_GEMINI ;;
    esac
    remove_markdown "$relative" "$created" zerotohero legacy-zerotohero
  done
  if [ "$LEGACY_ZTH_REMOVE_AIDER" -eq 1 ]; then
    remove_aider_entry ZEROTOHERO.md 1 "$LEGACY_ZTH_CREATED_AIDER" "$LEGACY_ZTH_AIDER_READ_CREATED" legacy-zerotohero
  fi

  owned=$(mktemp)
  : > "$owned"
  if [ -n "$LEGACY_ZTH_PATHS" ]; then
    printf '%s\n' "$LEGACY_ZTH_PATHS" > "$owned"
    while IFS= read -r relative; do
      [ -n "$relative" ] || continue
      backup_legacy_file legacy-zerotohero "$relative"
      rm -f -- "$TARGET/$relative"
    done < "$owned"
    remove_owned_directories "$owned"
  fi
  rm -f "$owned"
}

uninstall_zero_to_hero() {
  remove_markdown AGENTS.md "$CREATED_AGENTS"
  remove_markdown GEMINI.md "$CREATED_GEMINI"
  remove_aider_entry

  owned=$(mktemp)
  expected_owned_files > "$owned"
  while IFS= read -r relative; do
    assert_target_path "$relative" file
    rm -f -- "$TARGET/$relative"
  done < "$owned"
  rm -f -- "$TARGET/fp/.install-manifest.json"
  printf '%s\n' fp/.install-manifest.json >> "$owned"
  remove_owned_directories "$owned"
  rm -f "$owned"
  echo "Uninstalled FP $VERSION from $TARGET"
  echo "Project files were preserved and uninstall snapshots remain under .fp-backups."
}

verify_managed() {
  relative=$1
  fragment=$2
  destination=$TARGET/$relative
  [ -f "$destination" ] || return 1
  expected=$(mktemp)
  actual=$(mktemp)
  printf '%s\n' '<!-- fp:start -->' > "$expected"
  cat "$fragment" >> "$expected"
  printf '\n%s\n' '<!-- fp:end -->' >> "$expected"
  awk '{ sub(/\r$/, "") } /^<!-- fp:start -->$/ { capture = 1 } capture { print } /^<!-- fp:end -->$/ && capture { exit }' "$destination" > "$actual"
  cmp -s "$expected" "$actual"
  result=$?
  rm -f "$expected" "$actual"
  return "$result"
}

verify_install() {
  failures=''
  (cd "$PAYLOAD_ROOT" && find . -type f -print) | while IFS= read -r relative; do
    relative=${relative#./}
    [ -f "$TARGET/$relative" ] || { echo "missing $relative" >&2; exit 1; }
    cmp -s "$PAYLOAD_ROOT/$relative" "$TARGET/$relative" || { echo "changed $relative" >&2; exit 1; }
  done
  [ -f "$TARGET/FP.md" ] && cmp -s "$FRAGMENT_ROOT/CONVENTIONS.md" "$TARGET/FP.md" || failures="$failures changed-or-missing-FP.md"
  verify_managed AGENTS.md "$FRAGMENT_ROOT/AGENTS.md" || failures="$failures invalid-AGENTS.md"
  verify_managed GEMINI.md "$FRAGMENT_ROOT/GEMINI.md" || failures="$failures invalid-GEMINI.md"
  if [ "$VERIFY" -eq 1 ] || [ "$AIDER_ENTRY_MANAGED" -eq 1 ]; then
    analysis=$(aider_analysis "$TARGET/.aider.conf.yml")
    entries=${analysis##*|}
    [ "$entries" -ge 1 ] || failures="$failures missing-aider-read-entry"
    if [ "$AIDER_ENTRY_MANAGED" -eq 1 ] && [ "$entries" -ne 1 ]; then
      failures="$failures invalid-managed-aider-entry-count"
    fi
  fi
  manifest=$TARGET/fp/.install-manifest.json
  [ -f "$manifest" ] || failures="$failures missing-manifest"
  if [ -f "$manifest" ]; then
    grep -Fqx '  "product": "FP",' "$manifest" || failures="$failures invalid-manifest-product"
    grep -Fqx "  \"version\": \"$VERSION\"," "$manifest" || failures="$failures invalid-manifest-version"
    grep -Fq '"owned_files": [' "$manifest" || failures="$failures invalid-manifest-owned-files"
    grep -Eq '"aider_entry_managed"[[:space:]]*:[[:space:]]*(true|false)' "$manifest" || failures="$failures invalid-manifest-aider-ownership"
    grep -Eq '"aider_read_created"[[:space:]]*:[[:space:]]*(true|false)' "$manifest" || failures="$failures invalid-manifest-aider-read-ownership"
    expected_owned=$(mktemp)
    actual_owned=$(mktemp)
    expected_owned_files > "$expected_owned"
    manifest_array_values owned_files "$manifest" | LC_ALL=C sort > "$actual_owned"
    cmp -s "$expected_owned" "$actual_owned" || failures="$failures invalid-manifest-owned-files"
    printf '%s\n' .aider.conf.yml AGENTS.md GEMINI.md | LC_ALL=C sort > "$expected_owned"
    manifest_array_values managed_files "$manifest" | LC_ALL=C sort > "$actual_owned"
    cmp -s "$expected_owned" "$actual_owned" || failures="$failures invalid-manifest-managed-files"
    invalid_created=$(manifest_array_values created_managed_files "$manifest" | awk 'NF && $0 != "AGENTS.md" && $0 != "GEMINI.md" && $0 != ".aider.conf.yml" { print }')
    [ -z "$invalid_created" ] || failures="$failures invalid-manifest-created-files"
    rm -f "$expected_owned" "$actual_owned"
  fi
  [ -z "$failures" ] || { echo "FP verification failed:$failures" >&2; exit 1; }
  echo "FP $VERSION is installed in $TARGET"
}

write_manifest() {
  manifest=$TARGET/fp/.install-manifest.json
  temp=$(mktemp)
  {
    printf '{\n'
    printf '  "product": "FP",\n'
    printf '  "version": "%s",\n' "$VERSION"
    printf '  "installed_at": "%s",\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '  "target": "project-local",\n'
    printf '  "owned_files": [\n'
    first=1
    { cd "$PAYLOAD_ROOT" && find . -type f -print | sed 's#^\./##' | LC_ALL=C sort; printf '%s\n' FP.md; } | while IFS= read -r relative; do
      escaped=$(printf '%s' "$relative" | sed 's/\\/\\\\/g; s/"/\\"/g')
      if [ "$first" -eq 1 ]; then
        first=0
      else
        printf ',\n'
      fi
      printf '    "%s"' "$escaped"
    done
    printf '\n  ],\n'
    printf '  "managed_files": ["AGENTS.md", "GEMINI.md", ".aider.conf.yml"],\n'
    printf '  "created_managed_files": ['
    separator=''
    if [ "$CREATED_AIDER" -eq 1 ]; then printf '".aider.conf.yml"'; separator=', '; fi
    if [ "$CREATED_AGENTS" -eq 1 ]; then printf '%s"AGENTS.md"' "$separator"; separator=', '; fi
    if [ "$CREATED_GEMINI" -eq 1 ]; then printf '%s"GEMINI.md"' "$separator"; fi
    printf '],\n'
    if [ "$AIDER_ENTRY_MANAGED" -eq 1 ]; then
      printf '  "aider_entry_managed": true,\n'
    else
      printf '  "aider_entry_managed": false,\n'
    fi
    if [ "$AIDER_READ_CREATED" -eq 1 ]; then
      printf '  "aider_read_created": true\n'
    else
      printf '  "aider_read_created": false\n'
    fi
    printf '}\n'
  } > "$temp"
  mv "$temp" "$manifest"
}

[ -d "$TARGET" ] || { echo "FP target must already be an existing project directory: $TARGET" >&2; exit 1; }
case "$TARGET" in
  /*) ;;
  *) TARGET=$PWD/$TARGET ;;
esac
assert_no_symlink_chain "$TARGET"
TARGET=$(CDPATH= cd -- "$TARGET" && pwd -P)
BACKUP_ROOT=

recognize_legacy_zerotohero
recognize_previous_install
preflight

if [ "$VERIFY" -eq 1 ]; then
  TARGET=$(CDPATH= cd -- "$TARGET" && pwd)
  verify_install
  exit 0
fi

if [ "$UNINSTALL" -eq 1 ]; then
  manifest=$TARGET/fp/.install-manifest.json
  grep -Eq '"aider_entry_managed"[[:space:]]*:[[:space:]]*(true|false)' "$manifest" 2>/dev/null || {
    echo "install manifest lacks uninstall ownership metadata; reinstall before uninstalling" >&2
    exit 1
  }
  grep -Eq '"aider_read_created"[[:space:]]*:[[:space:]]*(true|false)' "$manifest" 2>/dev/null || {
    echo "install manifest lacks uninstall ownership metadata; reinstall before uninstalling" >&2
    exit 1
  }
  verify_install
  uninstall_zero_to_hero
  exit 0
fi

migrate_legacy
migrate_zerotohero

[ -f "$TARGET/AGENTS.md" ] || CREATED_AGENTS=1
[ -f "$TARGET/GEMINI.md" ] || CREATED_GEMINI=1
[ -f "$TARGET/.aider.conf.yml" ] || CREATED_AIDER=1
analysis=$(aider_analysis "$TARGET/.aider.conf.yml")
remainder=${analysis#*|}
shape=${remainder%%|*}
entries=${analysis##*|}
if [ "$entries" -eq 0 ]; then
  AIDER_ENTRY_MANAGED=1
  [ "$shape" != "none" ] || AIDER_READ_CREATED=1
fi

(cd "$PAYLOAD_ROOT" && find . -type f -print) | while IFS= read -r relative; do
  relative=${relative#./}
  mkdir -p "$TARGET/$(dirname -- "$relative")"
  if [ -f "$TARGET/$relative" ] && ! cmp -s "$PAYLOAD_ROOT/$relative" "$TARGET/$relative"; then backup_file "$relative"; fi
  cp "$PAYLOAD_ROOT/$relative" "$TARGET/$relative"
done

if [ -f "$TARGET/FP.md" ] && ! cmp -s "$FRAGMENT_ROOT/CONVENTIONS.md" "$TARGET/FP.md"; then backup_file FP.md; fi
cp "$FRAGMENT_ROOT/CONVENTIONS.md" "$TARGET/FP.md"
merge_markdown AGENTS.md "$FRAGMENT_ROOT/AGENTS.md"
merge_markdown GEMINI.md "$FRAGMENT_ROOT/GEMINI.md"
merge_aider
mkdir -p "$TARGET/fp"
write_manifest
verify_install

echo "Installed FP $VERSION in $TARGET"
echo "Installed namespaced project adapters plus AGENTS.md/Agent Skills compatibility entries."
echo "See README-FP.md and the source INSTALL.md for native, standard, and manual support tiers."
[ ! -d "$BACKUP_ROOT" ] || echo "Project-owned or legacy files changed safely; originals are in $BACKUP_ROOT"
echo "After verification, the extracted .fp-package and INSTALL-FP.* files may be removed or kept for the next update."
echo "Reload the AI tool and work normally. Optional trigger: FP: <task>"
