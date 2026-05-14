/**
 * This file is used to override vulnerable transitive dependency versions
 * that cannot be fixed via pnpm.overrides alone due to exact version pinning.
 */
function readPackage(pkg, context) {
  // Force postcss to a safe version when requested by next.js (which pins 8.4.31)
  if (pkg.name === 'next' && pkg.dependencies && pkg.dependencies.postcss) {
    pkg.dependencies.postcss = '^8.5.10';
    context.log('Overriding postcss in next to ^8.5.10');
  }

  // Force esbuild to a safe version for @esbuild-kit/core-utils (which pins ~0.18.20)
  if (pkg.name === '@esbuild-kit/core-utils' && pkg.dependencies && pkg.dependencies.esbuild) {
    pkg.dependencies.esbuild = '^0.25.0';
    context.log('Overriding esbuild in @esbuild-kit/core-utils to ^0.25.0');
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
