'use strict';

const chalk = require('chalk');
const Table = require('cli-table3');
const { filterSkills } = require('../registry');

module.exports = function list(options = {}) {
  const skills = filterSkills({
    source: options.source,
    tag: options.tag,
    tool: options.tool,
  });

  if (options.json) {
    console.log(JSON.stringify(skills, null, 2));
    return;
  }

  if (skills.length === 0) {
    console.log(chalk.yellow('No skills found matching your filters.'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('Name'),
      chalk.cyan('Description'),
      chalk.cyan('Source'),
      chalk.cyan('Tags'),
    ],
    colWidths: [25, 50, 14, 25],
    wordWrap: true,
    style: { head: [], border: [] },
  });

  for (const skill of skills) {
    table.push([
      chalk.bold(skill.name),
      skill.description.slice(0, 80),
      chalk.gray(skill.source),
      chalk.gray(skill.tags.slice(0, 3).join(', ')),
    ]);
  }

  console.log(`\n${chalk.bold(`Available Skills (${skills.length})`)}:\n`);
  console.log(table.toString());
  console.log(chalk.gray(`\nInstall: load-skill install <name>`));
  console.log(chalk.gray(`Details: load-skill info <name>`));
};
