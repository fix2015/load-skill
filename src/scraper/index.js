#!/usr/bin/env node

'use strict';

/**
 * Scraper that fetches skills from GitHub repositories and rebuilds
 * the local skills-registry.json. Run with: npm run scrape
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', '..', 'data', 'skills-registry.json');
const GITHUB_API = 'https://api.github.com';

const SOURCES = [
  {
    id: 'anthropics',
    repo: 'anthropics/skills',
    path: 'skills',
    type: 'official',
    url: 'https://github.com/anthropics/skills',
    compatible: ['claude-code'],
  },
  {
    id: 'microsoft',
    repo: 'microsoft/skills',
    path: 'skills',
    type: 'official',
    url: 'https://github.com/microsoft/skills',
    compatible: ['claude-code', 'codex', 'cursor'],
  },
  {
    id: 'jeffallan',
    repo: 'jeffallan/claude-skills',
    path: 'skills',
    type: 'community',
    url: 'https://github.com/jeffallan/claude-skills',
    compatible: ['claude-code', 'cursor', 'codex'],
  },
  {
    id: 'alirezarezvani',
    repo: 'alirezarezvani/claude-skills',
    path: 'skills',
    type: 'community',
    url: 'https://github.com/alirezarezvani/claude-skills',
    compatible: ['claude-code', 'cursor', 'codex', 'gemini-cli'],
  },
  {
    id: 'composio',
    repo: 'ComposioHQ/awesome-claude-skills',
    path: '',
    type: 'curated',
    url: 'https://github.com/ComposioHQ/awesome-claude-skills',
    compatible: ['claude-code'],
  },
  {
    id: 'antigravity',
    repo: 'sickn33/antigravity-awesome-skills',
    path: 'skills',
    type: 'community',
    url: 'https://github.com/sickn33/antigravity-awesome-skills',
    compatible: ['claude-code', 'cursor', 'codex', 'gemini-cli'],
  },
  {
    id: 'useful-skills',
    repo: 'fix2015/useful-skills',
    path: 'skills',
    type: 'community',
    url: 'https://github.com/fix2015/useful-skills',
    compatible: ['claude-code', 'cursor', 'codex', 'gemini-cli'],
  },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function githubFetch(url) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'load-skill-scraper',
  };

  // Use GITHUB_TOKEN if available for higher rate limits
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });

  if (response.status === 403) {
    const resetTime = response.headers.get('x-ratelimit-reset');
    if (resetTime) {
      const waitMs = (parseInt(resetTime) * 1000) - Date.now() + 1000;
      console.log(`  Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s...`);
      await sleep(waitMs);
      return githubFetch(url);
    }
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchSkillDirs(source) {
  if (!source.path) return [];

  const url = `${GITHUB_API}/repos/${source.repo}/contents/${source.path}`;
  try {
    const items = await githubFetch(url);
    return items.filter(item => item.type === 'dir').map(item => item.name);
  } catch (err) {
    console.error(`  Error fetching ${source.repo}: ${err.message}`);
    return [];
  }
}

function parseYamlFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result = {};
  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

function inferTags(name, description = '') {
  const text = `${name} ${description}`.toLowerCase();
  const tagMap = {
    'frontend': ['react', 'vue', 'angular', 'svelte', 'css', 'html', 'frontend', 'ui', 'nextjs', 'tailwind'],
    'backend': ['api', 'server', 'backend', 'express', 'fastapi', 'django', 'rails', 'spring', 'nestjs', 'laravel'],
    'testing': ['test', 'playwright', 'jest', 'cypress', 'qa', 'e2e', 'tdd'],
    'devops': ['devops', 'ci', 'cd', 'docker', 'kubernetes', 'deploy', 'terraform', 'ansible'],
    'database': ['database', 'sql', 'postgres', 'mysql', 'mongo', 'redis', 'db'],
    'ai': ['ai', 'ml', 'llm', 'rag', 'embedding', 'fine-tun', 'prompt', 'claude', 'gpt', 'agent'],
    'security': ['security', 'owasp', 'auth', 'crypto', 'vulnerability', 'forensic'],
    'mobile': ['mobile', 'ios', 'android', 'react-native', 'flutter', 'swift', 'kotlin'],
    'cloud': ['cloud', 'aws', 'azure', 'gcp', 'serverless'],
    'python': ['python', 'django', 'fastapi', 'flask', 'pandas'],
    'javascript': ['javascript', 'js', 'node', 'typescript', 'ts', 'react', 'vue', 'angular', 'svelte', 'nextjs'],
    'go': ['golang', 'go-'],
    'rust': ['rust'],
    'java': ['java', 'spring', 'jvm'],
    'document': ['pdf', 'docx', 'xlsx', 'pptx', 'document', 'word', 'excel', 'spreadsheet'],
    'creative': ['art', 'design', 'gif', 'canvas', 'generative', 'visualization'],
    'workflow': ['workflow', 'agile', 'scrum', 'planning', 'requirements'],
    'architecture': ['architect', 'microservice', 'monolith', 'design-pattern'],
    'mcp': ['mcp'],
  };

  const tags = new Set();
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some(k => text.includes(k))) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

async function fetchSkillMetadata(source, skillName) {
  const rawUrl = `https://raw.githubusercontent.com/${source.repo}/main/${source.path}/${skillName}/SKILL.md`;

  try {
    const response = await fetch(rawUrl, {
      headers: { 'User-Agent': 'load-skill-scraper' },
    });
    if (!response.ok) return null;

    const content = await response.text();
    const frontmatter = parseYamlFrontmatter(content);
    return {
      description: frontmatter.description || '',
      name: frontmatter.name || skillName,
    };
  } catch {
    return null;
  }
}

async function scrapeAll() {
  console.log('🔍 Scraping skills from GitHub repositories...\n');

  const skills = [];
  const seenNames = new Set();

  for (const source of SOURCES) {
    console.log(`📦 Scanning ${source.repo}...`);

    const dirs = await fetchSkillDirs(source);
    console.log(`   Found ${dirs.length} skill directories`);

    for (const name of dirs) {
      if (seenNames.has(name)) {
        console.log(`   Skipping duplicate: ${name}`);
        continue;
      }

      // Fetch metadata for first few sources, infer for the rest
      let description = '';
      let meta = null;

      if (['anthropics', 'jeffallan', 'microsoft'].includes(source.id)) {
        meta = await fetchSkillMetadata(source, name);
        if (meta?.description) description = meta.description;
        await sleep(100); // Rate limit courtesy
      }

      const tags = inferTags(name, description);

      skills.push({
        name,
        description: description || `${name.replace(/-/g, ' ')} skill from ${source.repo}`,
        tags,
        source: source.id,
        compatible: source.compatible,
        raw_url: `https://raw.githubusercontent.com/${source.repo}/main/${source.path}/${name}/SKILL.md`,
        repo_url: `https://github.com/${source.repo}/tree/main/${source.path}/${name}`,
      });

      seenNames.add(name);
    }

    console.log('');
  }

  const registry = {
    version: '1.0.0',
    updated_at: new Date().toISOString().split('T')[0],
    sources: SOURCES.map(({ id, repo, path: p, type, url }) => ({ id, repo, path: p, type, url })),
    skills,
  };

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
  console.log(`✅ Saved ${skills.length} skills to ${REGISTRY_PATH}`);
}

// Run if executed directly
if (require.main === module) {
  scrapeAll().catch(err => {
    console.error('Scraper failed:', err);
    process.exit(1);
  });
}

module.exports = { scrapeAll, inferTags, parseYamlFrontmatter };
