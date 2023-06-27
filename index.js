const childProcess = require('child_process');
const path = require('path');

class InstallMissingPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('InstallMissingPackagesPlugin', (compilation) => {
      const { chunks } = compilation.getStats().toJson();

      // Extract all imported or required modules from chunks
      const modules = chunks.reduce((acc, chunk) => {
        return [
          ...acc,
          ...chunk.modules.reduce((moduleAcc, module) => {
            const { rawRequest } = module;

            if (rawRequest && !moduleAcc.includes(rawRequest)) {
              return [...moduleAcc, rawRequest];
            }

            return moduleAcc;
          }, []),
        ];
      }, []);

      // Filter out packages already listed in package.json
      const missingPackages = modules.filter((module) => {
        try {
          require.resolve(module);
          return false;
        } catch (error) {
          return true;
        }
      });

      // Install missing packages using pnpm
      if (missingPackages.length > 0) {
        const command = `pnpm add ${missingPackages.join(' ')}`;

        try {
          const cwd = path.resolve('/home/runner/work/penguinmod.github.io/penguinmod.github.io');
          childProcess.execSync(command, {
            encoding: 'utf-8',
            stdio: 'inherit',
            cwd, // Set the current working directory
          });
        } catch (error) {
          console.error(`Failed to install missing packages: ${missingPackages.join(', ')}`);
          console.error(error);
        }
      }
    });
  }
}

module.exports = InstallMissingPlugin;
