#!/usr/bin/env bash
# Vercel CLI's dependency tree does not support Node 25+ yet (see EBADENGINE on @renovatebot/pep440).
# Prefer Homebrew node@22 for `npx vercel` when available.
set -euo pipefail
if command -v brew >/dev/null 2>&1; then
  brew_prefix="$(brew --prefix node@22 2>/dev/null || true)"
  if [[ -n "${brew_prefix}" && -x "${brew_prefix}/bin/node" ]]; then
    export PATH="${brew_prefix}/bin:${PATH}"
  fi
fi
exec npx vercel "$@"
