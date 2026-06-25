export type SeedSnippet = {
  title: string;
  content: string;
  category: "command" | "pipeline" | "script" | "loop" | "function";
  difficulty: "easy" | "medium" | "hard";
};

export const seedSnippets: SeedSnippet[] = [
  // Single commands (~20)
  { title: "list-long", content: "ls -la", category: "command", difficulty: "easy" },
  {
    title: "grep-recursive",
    content: 'grep -r "pattern" ./src',
    category: "command",
    difficulty: "easy",
  },
  {
    title: "find-by-name",
    content: 'find . -name "*.sh" -type f',
    category: "command",
    difficulty: "easy",
  },
  {
    title: "chmod-executable",
    content: "chmod +x deploy.sh",
    category: "command",
    difficulty: "easy",
  },
  {
    title: "curl-silent",
    content: "curl -fsSL https://example.com/install.sh | bash",
    category: "command",
    difficulty: "medium",
  },
  {
    title: "mkdir-parents",
    content: "mkdir -p logs/archive/2024",
    category: "command",
    difficulty: "easy",
  },
  {
    title: "tail-follow",
    content: "tail -f /var/log/nginx/access.log",
    category: "command",
    difficulty: "easy",
  },
  {
    title: "disk-usage",
    content: "du -sh * | sort -hr | head -10",
    category: "command",
    difficulty: "medium",
  },
  { title: "process-grep", content: "ps aux | grep node", category: "command", difficulty: "easy" },
  {
    title: "kill-process",
    content: 'kill -9 $(pgrep -f "next dev")',
    category: "command",
    difficulty: "medium",
  },
  {
    title: "env-export",
    content: "export NODE_ENV=production",
    category: "command",
    difficulty: "easy",
  },
  {
    title: "which-node",
    content: "which node && node --version",
    category: "command",
    difficulty: "easy",
  },
  {
    title: "tar-extract",
    content: "tar -xzf archive.tar.gz -C /tmp",
    category: "command",
    difficulty: "easy",
  },
  {
    title: "wget-quiet",
    content: "wget -qO- https://api.github.com/repos/vercel/next.js",
    category: "command",
    difficulty: "medium",
  },
  {
    title: "sed-replace",
    content: "sed -i 's/foo/bar/g' config.txt",
    category: "command",
    difficulty: "medium",
  },
  {
    title: "awk-print",
    content: "awk '{print $1, $NF}' access.log",
    category: "command",
    difficulty: "medium",
  },
  {
    title: "xargs-rm",
    content: 'find . -name "*.tmp" | xargs rm -f',
    category: "command",
    difficulty: "medium",
  },
  {
    title: "ssh-keygen",
    content: 'ssh-keygen -t ed25519 -C "user@host"',
    category: "command",
    difficulty: "medium",
  },
  {
    title: "rsync-sync",
    content: "rsync -avz --delete ./dist/ user@server:/var/www/",
    category: "command",
    difficulty: "hard",
  },
  {
    title: "jq-parse",
    content: "curl -s api.example.com/data | jq '.items[].name'",
    category: "command",
    difficulty: "medium",
  },

  // Pipelines (~15)
  {
    title: "pipe-grep-awk",
    content: "cat access.log | grep \"404\" | awk '{print $7}' | sort | uniq -c",
    category: "pipeline",
    difficulty: "medium",
  },
  {
    title: "pipe-ps-sort",
    content: "ps aux | sort -k3 -nr | head -5",
    category: "pipeline",
    difficulty: "medium",
  },
  {
    title: "pipe-git-log",
    content: "git log --oneline | head -20",
    category: "pipeline",
    difficulty: "easy",
  },
  {
    title: "pipe-wc-lines",
    content: 'find . -name "*.ts" | xargs wc -l | sort -n',
    category: "pipeline",
    difficulty: "medium",
  },
  {
    title: "pipe-cut-sort",
    content: "cut -d: -f1 /etc/passwd | sort",
    category: "pipeline",
    difficulty: "easy",
  },
  {
    title: "pipe-grep-v",
    content: 'grep -v "^#" .env | grep -v "^$"',
    category: "pipeline",
    difficulty: "medium",
  },
  {
    title: "pipe-tr-lower",
    content: "echo \"HELLO\" | tr '[:upper:]' '[:lower:]'",
    category: "pipeline",
    difficulty: "easy",
  },
  {
    title: "pipe-tee-log",
    content: "npm test 2>&1 | tee test-output.log",
    category: "pipeline",
    difficulty: "medium",
  },
  {
    title: "pipe-history",
    content: "history | grep git | tail -10",
    category: "pipeline",
    difficulty: "easy",
  },
  {
    title: "pipe-ls-grep",
    content: 'ls -la | grep "^d"',
    category: "pipeline",
    difficulty: "easy",
  },
  {
    title: "pipe-curl-jq",
    content: "curl -s https://api.github.com/users/octocat | jq '.login, .public_repos'",
    category: "pipeline",
    difficulty: "medium",
  },
  {
    title: "pipe-df-grep",
    content: "df -h | grep -v tmpfs | awk '{print $5, $6}'",
    category: "pipeline",
    difficulty: "medium",
  },
  {
    title: "pipe-netstat",
    content: "netstat -tuln | grep LISTEN",
    category: "pipeline",
    difficulty: "medium",
  },
  {
    title: "pipe-zgrep",
    content: 'zgrep -h "error" /var/log/*.gz | tail -50',
    category: "pipeline",
    difficulty: "hard",
  },
  {
    title: "pipe-git-diff",
    content: "git diff --stat HEAD~1 | tail -1",
    category: "pipeline",
    difficulty: "medium",
  },

  // Loops (~10)
  {
    title: "for-files",
    content: 'for f in *.sh; do echo "Processing $f"; done',
    category: "loop",
    difficulty: "easy",
  },
  {
    title: "while-read",
    content: 'while read line; do echo "$line"; done < input.txt',
    category: "loop",
    difficulty: "medium",
  },
  {
    title: "for-seq",
    content: 'for i in $(seq 1 10); do echo "Item $i"; done',
    category: "loop",
    difficulty: "easy",
  },
  {
    title: "for-c-style",
    content: "for ((i=0; i<5; i++)); do echo $i; done",
    category: "loop",
    difficulty: "medium",
  },
  {
    title: "while-true",
    content: "while true; do curl -s localhost:3000/health; sleep 5; done",
    category: "loop",
    difficulty: "medium",
  },
  {
    title: "for-args",
    content: 'for arg in "$@"; do echo "Arg: $arg"; done',
    category: "loop",
    difficulty: "medium",
  },
  {
    title: "while-count",
    content: "count=0; while [ $count -lt 3 ]; do echo $count; ((count++)); done",
    category: "loop",
    difficulty: "medium",
  },
  {
    title: "for-find-exec",
    content: 'for f in $(find . -name "*.log"); do gzip "$f"; done',
    category: "loop",
    difficulty: "hard",
  },
  {
    title: "until-loop",
    content: "until [ -f /tmp/ready ]; do sleep 1; done",
    category: "loop",
    difficulty: "medium",
  },
  {
    title: "for-array",
    content: 'arr=(one two three); for item in "${arr[@]}"; do echo $item; done',
    category: "loop",
    difficulty: "hard",
  },

  // Functions (~10)
  {
    title: "fn-log",
    content: 'log() { echo "[$(date +%H:%M:%S)] $*"; }',
    category: "function",
    difficulty: "medium",
  },
  {
    title: "fn-backup",
    content: 'backup() { tar czf "$1-$(date +%Y%m%d).tar.gz" "$1"; }',
    category: "function",
    difficulty: "medium",
  },
  {
    title: "fn-die",
    content: 'die() { echo "Error: $1" >&2; exit 1; }',
    category: "function",
    difficulty: "easy",
  },
  {
    title: "fn-retry",
    content: 'retry() { for i in 1 2 3; do "$@" && return; sleep 2; done; return 1; }',
    category: "function",
    difficulty: "hard",
  },
  {
    title: "fn-confirm",
    content: 'confirm() { read -p "$1 [y/N] " r; [[ $r =~ ^[Yy]$ ]]; }',
    category: "function",
    difficulty: "medium",
  },
  {
    title: "fn-abspath",
    content: 'abspath() { cd "$(dirname "$1")" && pwd)/$(basename "$1")"; }',
    category: "function",
    difficulty: "hard",
  },
  {
    title: "fn-mkcd",
    content: 'mkcd() { mkdir -p "$1" && cd "$1"; }',
    category: "function",
    difficulty: "easy",
  },
  {
    title: "fn-http-code",
    content: 'http_code() { curl -s -o /dev/null -w "%{http_code}" "$1"; }',
    category: "function",
    difficulty: "medium",
  },
  {
    title: "fn-is-port",
    content: 'is_port_open() { nc -z localhost "$1" 2>/dev/null; }',
    category: "function",
    difficulty: "medium",
  },
  {
    title: "fn-timestamp",
    content: 'timestamp() { date +"%Y-%m-%d_%H-%M-%S"; }',
    category: "function",
    difficulty: "easy",
  },

  // Git/shell combos (~10)
  {
    title: "git-stash",
    content: 'git stash push -m "wip: feature branch"',
    category: "command",
    difficulty: "easy",
  },
  {
    title: "git-rebase",
    content: "git rebase -i HEAD~3",
    category: "command",
    difficulty: "medium",
  },
  {
    title: "git-checkout-b",
    content: "git checkout -b feature/new-branch",
    category: "command",
    difficulty: "easy",
  },
  {
    title: "git-reset-soft",
    content: "git reset --soft HEAD~1",
    category: "command",
    difficulty: "medium",
  },
  {
    title: "git-cherry-pick",
    content: "git cherry-pick abc1234",
    category: "command",
    difficulty: "medium",
  },
  { title: "git-clean", content: "git clean -fd", category: "command", difficulty: "easy" },
  {
    title: "gh-pr-create",
    content: 'gh pr create --title "Fix bug" --body "Description"',
    category: "command",
    difficulty: "medium",
  },
  {
    title: "git-tag-push",
    content: "git tag v1.0.0 && git push origin v1.0.0",
    category: "command",
    difficulty: "medium",
  },
  {
    title: "git-bisect",
    content: "git bisect start && git bisect bad HEAD",
    category: "command",
    difficulty: "hard",
  },
  {
    title: "git-blame-line",
    content: "git blame -L 10,20 src/main.ts",
    category: "command",
    difficulty: "medium",
  },

  // Full scripts (~25)
  {
    title: "script-hello",
    content: '#!/bin/bash\necho "Hello, World!"',
    category: "script",
    difficulty: "easy",
  },
  {
    title: "script-check-root",
    content: '#!/bin/bash\nif [ "$EUID" -ne 0 ]; then echo "Run as root"; exit 1; fi',
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-env-check",
    content: '#!/bin/bash\n[ -z "$DATABASE_URL" ] && echo "Missing DATABASE_URL" && exit 1',
    category: "script",
    difficulty: "easy",
  },
  {
    title: "script-docker-prune",
    content: "#!/bin/bash\ndocker system prune -af --volumes",
    category: "script",
    difficulty: "easy",
  },
  {
    title: "script-rename-batch",
    content: '#!/bin/bash\nfor f in *.txt; do mv "$f" "${f%.txt}.md"; done',
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-log-rotate",
    content: '#!/bin/bash\nLOG=app.log\n[ -f "$LOG" ] && mv "$LOG" "${LOG}.$(date +%Y%m%d)"',
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-health-check",
    content: "#!/bin/bash\ncurl -sf http://localhost:3000/api/health || exit 1",
    category: "script",
    difficulty: "easy",
  },
  {
    title: "script-wait-port",
    content: '#!/bin/bash\nwhile ! nc -z localhost 5432; do sleep 1; done\necho "Postgres ready"',
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-backup-db",
    content: '#!/bin/bash\npg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql',
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-deploy",
    content:
      "#!/bin/bash\nset -euo pipefail\ngit pull origin main\npnpm install\npnpm build\npm2 restart app",
    category: "script",
    difficulty: "hard",
  },
  {
    title: "script-lint-all",
    content: "#!/bin/bash\nset -e\npnpm lint\npnpm format:check\npnpm build",
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-find-large",
    content: "#!/bin/bash\nfind . -type f -size +10M -exec ls -lh {} \\;",
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-count-lines",
    content:
      '#!/bin/bash\ntotal=0\nfor f in $(find . -name "*.ts"); do\n  lines=$(wc -l < "$f")\n  total=$((total + lines))\ndone\necho "Total: $total"',
    category: "script",
    difficulty: "hard",
  },
  {
    title: "script-serve-static",
    content: "#!/bin/bash\npython3 -m http.server 8080 --directory ./public",
    category: "script",
    difficulty: "easy",
  },
  {
    title: "script-kill-port",
    content: "#!/bin/bash\nPORT=3000\nlsof -ti:$PORT | xargs kill -9 2>/dev/null || true",
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-gen-env",
    content: '#!/bin/bash\ncp .env.example .env\necho "Created .env from example"',
    category: "script",
    difficulty: "easy",
  },
  {
    title: "script-watch-restart",
    content: "#!/bin/bash\nwhile inotifywait -e modify src/; do pnpm build; done",
    category: "script",
    difficulty: "hard",
  },
  {
    title: "script-ssl-check",
    content:
      "#!/bin/bash\necho | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates",
    category: "script",
    difficulty: "hard",
  },
  {
    title: "script-parallel-jobs",
    content: '#!/bin/bash\nfor url in url1 url2 url3; do curl -s "$url" & done\nwait',
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-temp-cleanup",
    content: '#!/bin/bash\nfind /tmp -name "bash-racer-*" -mtime +1 -delete',
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-node-version",
    content:
      '#!/bin/bash\nrequired="20"\ncurrent=$(node -v | cut -d. -f1 | tr -d v)\n[ "$current" -lt "$required" ] && exit 1',
    category: "script",
    difficulty: "medium",
  },
  {
    title: "script-git-hooks",
    content:
      "#!/bin/bash\ncp scripts/pre-commit .git/hooks/pre-commit\nchmod +x .git/hooks/pre-commit",
    category: "script",
    difficulty: "easy",
  },
  {
    title: "script-migrate-db",
    content: "#!/bin/bash\nset -e\npnpm drizzle-kit push\npnpm db:seed",
    category: "script",
    difficulty: "easy",
  },
  {
    title: "script-monitor-disk",
    content:
      '#!/bin/bash\nTHRESH=90\nusage=$(df / | tail -1 | awk \'{print $5}\' | tr -d \'%\')\n[ "$usage" -gt "$THRESH" ] && echo "Disk critical: ${usage}%"',
    category: "script",
    difficulty: "hard",
  },
  {
    title: "script-restart-on-change",
    content: '#!/bin/bash\nnodemon --watch src --ext ts --exec "pnpm dev"',
    category: "script",
    difficulty: "medium",
  },

  // Hard/multi-line (~10)
  {
    title: "hard-nested-if",
    content:
      'if [ -f .env ]; then\n  source .env\n  if [ -n "$API_KEY" ]; then\n    curl -H "Authorization: Bearer $API_KEY" api.example.com\n  fi\nfi',
    category: "script",
    difficulty: "hard",
  },
  {
    title: "hard-sed-multiline",
    content: "sed -n '/^## START/,/^## END/p' config.yaml | grep -v '^##'",
    category: "pipeline",
    difficulty: "hard",
  },
  {
    title: "hard-awk-sum",
    content: "awk '{sum+=$3} END {print \"Total bytes:\", sum}' netstat.log",
    category: "pipeline",
    difficulty: "hard",
  },
  {
    title: "hard-case-select",
    content:
      'case "$1" in\n  start) systemctl start app ;;\n  stop) systemctl stop app ;;\n  *) echo "Usage: $0 {start|stop}" ;;\nesac',
    category: "script",
    difficulty: "hard",
  },
  {
    title: "hard-trap-cleanup",
    content: "trap 'rm -f /tmp/work.$$' EXIT\ntmpfile=$(mktemp)\necho data > \"$tmpfile\"",
    category: "script",
    difficulty: "hard",
  },
  {
    title: "hard-parallel-xargs",
    content: "find . -name \"*.json\" -print0 | xargs -0 -P 4 -I {} jq '.version' {}",
    category: "pipeline",
    difficulty: "hard",
  },
  {
    title: "hard-getopts",
    content: 'while getopts ":hv" opt; do case $opt in h) echo help;; v) echo verbose;; esac; done',
    category: "script",
    difficulty: "hard",
  },
  {
    title: "hard-process-sub",
    content: "diff <(sort file1.txt) <(sort file2.txt)",
    category: "pipeline",
    difficulty: "hard",
  },
  {
    title: "hard-heredoc",
    content: "cat << 'EOF' > config.toml\n[server]\nport = 3000\nhost = \"0.0.0.0\"\nEOF",
    category: "script",
    difficulty: "medium",
  },
  {
    title: "hard-array-assoc",
    content: 'declare -A colors=([red]=\\#ff0000 [green]=\\#00ff00)\necho "${colors[red]}"',
    category: "script",
    difficulty: "hard",
  },
];
