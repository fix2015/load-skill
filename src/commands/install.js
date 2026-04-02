'use strict';

const chalk = require('chalk');
const ora = require('ora');
const { findSkill, searchSkills } = require('../registry');
const { installSkill } = require('../installer');

module.exports = async function install(name, options = {}) {
  const spinner = ora(`Searching for skill "${name}"...`).start();

  try {
    let skill = findSkill(name);

    if (!skill) {
      // Try fuzzy search
      const matches = searchSkills(name);
      if (matches.length === 0) {
        spinner.fail(chalk.red(`Skill "${name}" not found.`));
        console.log(chalk.yellow('\nTry:'));
        console.log(`  load-skill search ${name}`);
        console.log('  load-skill --list');
        process.exit(1);
      }
      if (matches.length === 1) {
        skill = matches[0];
        spinner.info(chalk.yellow(`Exact match not found. Using: ${skill.name}`));
      } else {
        spinner.warn(chalk.yellow(`Multiple matches found for "${name}":`));
        console.log('');
        matches.slice(0, 10).forEach(s => {
          console.log(`  ${chalk.cyan(s.name.padEnd(30))} ${chalk.gray(s.description.slice(0, 60))}`);
        });
        if (matches.length > 10) {
          console.log(chalk.gray(`  ... and ${matches.length - 10} more`));
        }
        console.log(chalk.yellow(`\nSpecify the exact name: load-skill install <name>`));
        process.exit(1);
      }
    }

    const tool = options.tool || 'claude-code';
    spinner.text = `Installing ${chalk.cyan(skill.name)} for ${chalk.green(tool)}...`;
    spinner.start();

    const result = await installSkill(skill, options);

    spinner.succeed(
      chalk.green(`Installed ${chalk.bold(skill.name)} → ${chalk.underline(result.installPath)}`)
    );
    console.log(chalk.gray(`  Source: ${skill.source} | Size: ${(result.size / 1024).toFixed(1)}KB`));
    console.log(chalk.gray(`  Tags: ${skill.tags.join(', ')}`));
  } catch (err) {
    spinner.fail(chalk.red(`Installation failed: ${err.message}`));
    process.exit(1);
  }
};
