#!/usr/bin/env bash
# UserPromptSubmit hook: inject SimpleCachingServer/context/REPO_MAP.md into
# context whenever the prompt is about the SimpleCachingServer sub-project,
# or the session is working inside that directory.
set -u

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
MAP="$ROOT/SimpleCachingServer/context/REPO_MAP.md"
[ -f "$MAP" ] || exit 0

INPUT="$(cat)"
PROMPT="$(printf '%s' "$INPUT" | jq -r '.prompt // ""' 2>/dev/null)"
CWD="$(printf '%s' "$INPUT" | jq -r '.cwd // ""' 2>/dev/null)"

match=0
case "$CWD" in
  *"/SimpleCachingServer"*) match=1 ;;
esac
if [ "$match" -eq 0 ] && printf '%s' "$PROMPT" | grep -qiE \
  'simple ?caching ?server|caching[ -]server|cache[ -]server|simple[ -]cache|SimpleCachingServer|SimpeCachingServer|cache-server\.(pid|log)|/v1/(admin/)?cache'; then
  match=1
fi
[ "$match" -eq 1 ] || exit 0

echo "<simple-caching-server-repo-map>"
echo "Repo map for SimpleCachingServer. Paths under 'areas/' are relative to SimpleCachingServer/context/; code paths are relative to SimpleCachingServer/Project/Backend/. Open the matching area doc before working on a task."
echo
cat "$MAP"
echo "</simple-caching-server-repo-map>"
exit 0
