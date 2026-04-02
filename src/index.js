'use strict';

const { findSkill, searchSkills, filterSkills, getAllSkills, getAllTags } = require('./registry');
const { installSkill, fetchSkillContent } = require('./installer');

module.exports = {
  findSkill,
  searchSkills,
  filterSkills,
  getAllSkills,
  getAllTags,
  installSkill,
  fetchSkillContent,
};
