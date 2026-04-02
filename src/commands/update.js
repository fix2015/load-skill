'use strict';

const chalk = require('chalk');
const ora = require('ora');
const fetch = require('node-fetch');
const fs = require('fs');
const { REGISTRY_PATH, clearCache, loadRegistry } = require('../registry');

const GITHUB_API = 'https://api.github.com';

const SOURCES = [
  {
    id: 'anthropics',
    repo: 'anthropics/skills',
    path: 'skills',
    type: 'official',
  },
  {
    id: 'jeffallan',
    repo: 'jeffallan/claude-skills',
    path: 'skills',
    type: 'community',
  },
  {
    id: 'microsoft',
    repo: 'microsoft/skills',
    path: 'skills',
    type: 'official',
  },
];

async function fetchRepoSkills(source) {
  const url = `${GITHUB_API}/repos/${source.repo}/contents/${source.path}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'load-skill-cli',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error for ${source.repo}: ${response.status}`);
  }

  const items = await response.json();
  return items
    .filter(item => item.type === 'dir')
    .map(item => item.name);
}

module.exports = async function update() {
  const spinner = ora('Checking for registry updates...').start();

  try {
    let newSkillsFound = 0;
    const registry = loadRegistry();
    const existingNames = new Set(registry.skills.map(s => s.name));

    for (const source of SOURCES) {
      spinner.text = `Scanning ${chalk.cyan(source.repo)}...`;
      try {
        const skillNames = await fetchRepoSkills(source);
        for (const name of skillNames) {
          if (!existingNames.has(name)) {
            registry.skills.push({
              name,
              description: `Skill from ${source.repo} (run "load-skill info ${name}" after next update)`,
              tags: [],
              source: source.id,
              compatible: ['claude-code'],
              raw_url: `https://raw.githubusercontent.com/${source.repo}/main/${source.path}/${name}/SKILL.md`,
              repo_url: `https://github.com/${source.repo}/tree/main/${source.path}/${name}`,
            });
            existingNames.add(name);
            newSkillsFound++;
          }
        }
      } catch (err) {
        spinner.warn(chalk.yellow(`Failed to scan ${source.repo}: ${err.message}`));
        spinner.start();
      }
    }

    registry.updated_at = new Date().toISOString().split('T')[0];
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
    clearCache();

    if (newSkillsFound > 0) {
      spinner.succeed(chalk.green(`Registry updated! Found ${newSkillsFound} new skill(s). Total: ${registry.skills.length}`));
    } else {
      spinner.succeed(chalk.green(`Registry is up to date. Total skills: ${registry.skills.length}`));
    }
  } catch (err) {
    spinner.fail(chalk.red(`Update failed: ${err.message}`));
    process.exit(1);
  }
};
