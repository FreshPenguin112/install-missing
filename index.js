const fs = require('fs');
const path = require('path');
const dependencyCheck = require('dependency-check');
const { spawnSync } = require('child_process');
const debug = require('debug');

class InstallMissingPlugin {
  constructor() {
    this.packageJson = path.join('~', 'package.json');
    this.log = {
      info: debug('install-missing:info'),
      error: debug('install-missing:error'),
    };
    this.log.info.log = console.log.bind(console);
    this.log.error.log = console.error.bind(console);
  }

  apply(compiler) {
    compiler.hooks.beforeRun.tapAsync('InstallMissingPlugin', (compiler, callback) => {
      this.installMissingPackages(callback);
    });
  }

  installMissingPackages(callback) {
    fs.stat(this.packageJson, (err) => {
      if (err) fs.writeFileSync(this.packageJson, '{}');
      dependencyCheck({ path: process.cwd(), entries: '', noDefaultEntries: true }, (err, installed) => {
        if (err) {
          this.log.error(err);
          return callback();
        }

        const missingPackages = dependencyCheck.missing(installed.package, installed.used);
        if (missingPackages.length === 0) {
          this.log.info('All modules are installed');
          return callback();
        }

        const pnpmArgs = ['-s', 'add', ...missingPackages];
        const pnpmOptions = {
          cwd: process.cwd(),
          stdio: 'inherit',
        };

        this.log.info('Installing missing modules:', missingPackages);
        const proc = spawnSync('pnpm', pnpmArgs, pnpmOptions);
        const error = proc.status !== 0 ? `pnpm install failed with code ${proc.status}` : null;
        if (error) this.log.error(error);
        else this.log.info('Installed and saved to package.json as dependencies');
        callback();
      });
    });
  }
}

module.exports = InstallMissingPlugin;
