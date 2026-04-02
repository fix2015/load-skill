'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  getAllSkills,
  findSkill,
  searchSkills,
  filterSkills,
  getAllTags,
  getSources,
} = require('../src/registry');

describe('Registry', () => {
  it('should load all skills', () => {
    const skills = getAllSkills();
    assert.ok(skills.length > 0, 'Should have at least one skill');
  });

  it('should find skill by exact name', () => {
    const skill = findSkill('react-expert');
    assert.ok(skill, 'Should find react-expert');
    assert.strictEqual(skill.name, 'react-expert');
  });

  it('should find skill case-insensitively', () => {
    const skill = findSkill('React-Expert');
    assert.ok(skill, 'Should find skill regardless of case');
  });

  it('should return null for unknown skill', () => {
    const skill = findSkill('nonexistent-skill-xyz');
    assert.strictEqual(skill, undefined);
  });

  it('should search by keyword in name', () => {
    const results = searchSkills('react');
    assert.ok(results.length > 0, 'Should find react-related skills');
    assert.ok(results.some(s => s.name.includes('react')));
  });

  it('should search by keyword in description', () => {
    const results = searchSkills('testing');
    assert.ok(results.length > 0, 'Should find testing-related skills');
  });

  it('should filter by tag', () => {
    const results = searchSkills('', { tag: 'frontend' });
    assert.ok(results.length > 0);
    assert.ok(results.every(s => s.tags.includes('frontend')));
  });

  it('should filter by source', () => {
    const results = filterSkills({ source: 'anthropics' });
    assert.ok(results.length > 0);
    assert.ok(results.every(s => s.source === 'anthropics'));
  });

  it('should filter by tool', () => {
    const results = filterSkills({ tool: 'claude-code' });
    assert.ok(results.length > 0);
    assert.ok(results.every(s => s.compatible.includes('claude-code')));
  });

  it('should get all tags with counts', () => {
    const tags = getAllTags();
    assert.ok(tags.length > 0);
    assert.ok(tags[0].tag);
    assert.ok(tags[0].count > 0);
    // Should be sorted by count descending
    for (let i = 1; i < tags.length; i++) {
      assert.ok(tags[i].count <= tags[i - 1].count, 'Tags should be sorted by count desc');
    }
  });

  it('should get sources', () => {
    const sources = getSources();
    assert.ok(sources.length > 0);
    assert.ok(sources[0].id);
    assert.ok(sources[0].repo);
  });

  it('every skill should have required fields', () => {
    const skills = getAllSkills();
    for (const skill of skills) {
      assert.ok(skill.name, `Skill missing name`);
      assert.ok(skill.description, `Skill ${skill.name} missing description`);
      assert.ok(Array.isArray(skill.tags), `Skill ${skill.name} tags should be array`);
      assert.ok(skill.source, `Skill ${skill.name} missing source`);
      assert.ok(Array.isArray(skill.compatible), `Skill ${skill.name} compatible should be array`);
    }
  });
});
