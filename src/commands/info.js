'use strict';

const chalk = require('chalk');
const { findSkill, searchSkills } = require('../registry');

module.exports = function info(name, options = {}) {
  let skill = findSkill(name);

  if (!skill) {
    const matches = searchSkills(name);
    if (matches.length === 1) {
      skill = matches[0];
    } else if (matches.length > 1) {
      console.log(chalk.yellow(`Multiple matches for "${name}":`));
      matches.slice(0, 5).forEach(s => {
        console.log(`  ${chalk.cyan(s.name)}`);
      });
      return;
    } else {
      console.log(chalk.red(`Skill "${name}" not found.`));
      return;
    }
  }

  if (options.json) {
    console.log(JSON.stringify(skill, null, 2));
    return;
  }

  console.log('');
  console.log(chalk.bold.cyan(`  ${skill.name}`));
  console.log(chalk.gray('  ' + '─'.repeat(50)));
  console.log(`  ${chalk.bold('Description:')}  ${skill.description}`);
  console.log(`  ${chalk.bold('Source:')}       ${skill.source}`);
  console.log(`  ${chalk.bold('Tags:')}         ${skill.tags.join(', ')}`);
  console.log(`  ${chalk.bold('Compatible:')}   ${skill.compatible.join(', ')}`);
  console.log(`  ${chalk.bold('Repo:')}         ${chalk.underline(skill.repo_url)}`);
  if (skill.raw_url) {
    console.log(`  ${chalk.bold('Raw URL:')}      ${chalk.underline(skill.raw_url)}`);
  }
  console.log('');
  console.log(chalk.gray(`  Install: load-skill install ${skill.name}`));
  console.log(chalk.gray(`  Install for Cursor: load-skill install ${skill.name} --tool cursor`));
  console.log('');
};
