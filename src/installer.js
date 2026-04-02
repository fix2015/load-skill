'use strict';

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const os = require('os');

const TOOL_PATHS = {
  'claude-code': {
    global: path.join(os.homedir(), '.claude', 'skills'),
    local: '.claude/skills',
  },
  'cursor': {
    global: path.join(os.homedir(), '.cursor', 'rules'),
    local: '.cursor/rules',
  },
  'codex': {
    global: path.join(os.homedir(), '.codex', 'skills'),
    local: '.codex/skills',
  },
  'gemini-cli': {
    global: path.join(os.homedir(), '.gemini', 'skills'),
    local: '.gemini/skills',
  },
};

async function fetchSkillContent(skill) {
  if (!skill.raw_url) {
    throw new Error(`No download URL available for skill "${skill.name}". Visit: ${skill.repo_url}`);
  }

  const response = await fetch(skill.raw_url);
  if (!response.ok) {
    throw new Error(`Failed to fetch skill: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function getInstallPath(skill, { tool = 'claude-code', global: isGlobal = false, output } = {}) {
  if (output) return output;

  const toolConfig = TOOL_PATHS[tool];
  if (!toolConfig) {
    throw new Error(`Unknown tool: ${tool}. Supported: ${Object.keys(TOOL_PATHS).join(', ')}`);
  }

  const base = isGlobal ? toolConfig.global : toolConfig.local;

  if (tool === 'cursor') {
    return path.join(base, `${skill.name}.md`);
  }

  return path.join(base, skill.name, 'SKILL.md');
}

async function installSkill(skill, options = {}) {
  const content = await fetchSkillContent(skill);
  const installPath = getInstallPath(skill, options);
  const dir = path.dirname(installPath);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(installPath, content, 'utf-8');

  return { installPath, size: content.length };
}

module.exports = {
  fetchSkillContent,
  getInstallPath,
  installSkill,
  TOOL_PATHS,
};
