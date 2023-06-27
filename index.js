const childProcess = require('child_process');

class InstallMissingPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('InstallMissingPlugin', (compilation) => {
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
          childProcess.execSync(command, {
            encoding: 'utf-8',
            stdio: 'inherit',
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
