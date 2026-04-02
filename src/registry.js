'use strict';

const path = require('path');
const fs = require('fs');

const REGISTRY_PATH = path.join(__dirname, '..', 'data', 'skills-registry.json');

let _cache = null;

function loadRegistry() {
  if (_cache) return _cache;
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  _cache = JSON.parse(raw);
  return _cache;
}

function getAllSkills() {
  return loadRegistry().skills;
}

function getSources() {
  return loadRegistry().sources;
}

function getVersion() {
  return loadRegistry().version;
}

function getUpdatedAt() {
  return loadRegistry().updated_at;
}

function findSkill(name) {
  const skills = getAllSkills();
  // Exact match first
  const exact = skills.find(s => s.name === name);
  if (exact) return exact;
  // Case-insensitive
  const lower = name.toLowerCase();
  return skills.find(s => s.name.toLowerCase() === lower);
}

function searchSkills(query, { tag, tool } = {}) {
  let skills = getAllSkills();

  if (tag) {
    skills = skills.filter(s => s.tags.includes(tag.toLowerCase()));
  }
  if (tool) {
    skills = skills.filter(s => s.compatible.includes(tool.toLowerCase()));
  }

  if (!query) return skills;

  const q = query.toLowerCase();
  return skills.filter(s => {
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.includes(q))
    );
  });
}

function filterSkills({ source, tag, tool } = {}) {
  let skills = getAllSkills();
  if (source) {
    skills = skills.filter(s => s.source === source);
  }
  if (tag) {
    skills = skills.filter(s => s.tags.includes(tag.toLowerCase()));
  }
  if (tool) {
    skills = skills.filter(s => s.compatible.includes(tool.toLowerCase()));
  }
  return skills;
}

function getAllTags() {
  const skills = getAllSkills();
  const tagMap = {};
  for (const skill of skills) {
    for (const tag of skill.tags) {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    }
  }
  return Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}

function clearCache() {
  _cache = null;
}

module.exports = {
  loadRegistry,
  getAllSkills,
  getSources,
  getVersion,
  getUpdatedAt,
  findSkill,
  searchSkills,
  filterSkills,
  getAllTags,
  clearCache,
  REGISTRY_PATH,
};
