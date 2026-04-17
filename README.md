# load-skill

> CLI tool to discover, search, and install AI coding skills for Claude Code, Cursor, Codex, Gemini CLI, and more.

[![npm version](https://img.shields.io/npm/v/load-skill.svg)](https://www.npmjs.com/package/load-skill)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**load-skill** aggregates skills from multiple sources into a single searchable registry, letting you install any skill with one command. No more cloning repos or manually copying files.

## Quick Start

```bash
# Install a skill instantly (no install needed)
npx load-skill install react-expert

# Or install globally
npm install -g load-skill
load-skill install playwright-expert
```

## Features

- **1,175 skills** from official and community sources, pre-indexed and ready to install
- **Multi-tool support** — install skills for Claude Code, Cursor, Codex, or Gemini CLI
- **Fast search** — find skills by name, description, or tags
- **Auto-scraper** — update the registry from GitHub sources with `load-skill update`
- **Programmatic API** — use as a library in your own tools

## Commands

### Install a skill

```bash
load-skill install <name>              # Install for Claude Code (default)
load-skill install <name> --tool cursor  # Install for Cursor
load-skill install <name> --global       # Install globally (~/.claude/skills/)
load-skill install <name> -o ./my-path   # Custom output path
load-skill <name>                        # Shorthand for install
```

### Search & browse

```bash
load-skill list                    # List all skills
load-skill list --source anthropics  # Filter by source
load-skill list --tag testing        # Filter by tag
load-skill list --tool cursor        # Filter by compatible tool

load-skill search react              # Search by keyword
load-skill search "api design" --tag backend

load-skill info react-expert         # Detailed info about a skill
load-skill tags                      # Show all tags with counts
load-skill sources                   # Show all skill sources
```

### Update registry

```bash
load-skill update                    # Fetch latest skills from GitHub
GITHUB_TOKEN=ghp_xxx load-skill update  # Use token for higher rate limits
```

### JSON output

```bash
load-skill list --json               # Machine-readable output
load-skill search react --json
load-skill info react-expert --json
```

## Supported Tools

| Tool | Install Location (local) | Install Location (global) |
|------|-------------------------|--------------------------|
| Claude Code | `.claude/skills/<name>/SKILL.md` | `~/.claude/skills/<name>/SKILL.md` |
| Cursor | `.cursor/rules/<name>.md` | `~/.cursor/rules/<name>.md` |
| Codex | `.codex/skills/<name>/SKILL.md` | `~/.codex/skills/<name>/SKILL.md` |
| Gemini CLI | `.gemini/skills/<name>/SKILL.md` | `~/.gemini/skills/<name>/SKILL.md` |

## Skill Sources

| Source | Repository | Type | Skills |
|--------|-----------|------|--------|
| Anthropic | [anthropics/skills](https://github.com/anthropics/skills) | Official | 17 |
| Microsoft | [microsoft/skills](https://github.com/microsoft/skills) | Official | 132 |
| Jeff Allan | [jeffallan/claude-skills](https://github.com/jeffallan/claude-skills) | Community | 66 |
| Alireza Rezvani | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | Community | 223 |
| Composio | [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Curated | 70+ |
| Antigravity | [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) | Community | 1340+ |
| Useful Skills | [fix2015/useful-skills](https://github.com/fix2015/useful-skills) | Community | 1 |

## Programmatic API

```javascript
const { findSkill, searchSkills, installSkill } = require('load-skill');

// Search
const results = searchSkills('react', { tag: 'frontend' });

// Get skill info
const skill = findSkill('react-expert');

// Install programmatically
await installSkill(skill, { tool: 'claude-code', global: true });
```

## Rebuild the Registry

The scraper fetches skill metadata from all configured GitHub sources:

```bash
npm run scrape                          # Rebuild from GitHub
GITHUB_TOKEN=ghp_xxx npm run scrape     # With auth for higher rate limits
```

## Contributing

1. Fork the repo
2. Add skills to `data/skills-registry.json` or add a new source in `src/scraper/index.js`
3. Submit a PR

### Adding a new skill source

Add an entry to the `SOURCES` array in `src/scraper/index.js`:

```javascript
{
  id: 'your-source',
  repo: 'owner/repo',
  path: 'skills',
  type: 'community',
  url: 'https://github.com/owner/repo',
  compatible: ['claude-code', 'cursor'],
}
```

## Related Tools

| Package | Description | Install |
|---------|-------------|---------|
| [load-rules](https://github.com/fix2015/load-rules) | AI coding rules for Cursor, Copilot, Claude Code | `npx load-rules` |
| [load-agents](https://github.com/fix2015/load-agents) | AI agent definitions for Claude Code, Codex, Copilot | `npx load-agents` |
| [load-hooks](https://github.com/fix2015/load-hooks) | Hooks for Claude Code and AI coding tools | `npx load-hooks` |
| [load-mcp](https://github.com/fix2015/load-mcp) | MCP servers for Claude Code, Cursor, and more | `npx load-mcp` |

## License

MIT
