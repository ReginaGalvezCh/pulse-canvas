module.exports = {
  packagerConfig: {
    asar: false,
    executableName: 'pulse-canvas',
    appBundleId: 'com.reginagalvez.pulsecanvas',
    extendInfo: {
      NSCameraUsageDescription: 'Pulse Canvas uses your camera only during a session to turn pulse signals into art.'
    },
    // Whitelist build output and production dependencies; exclude secrets and local captures.
    ignore: path => path !== '' && !/^\/(?:\.webpack|node_modules)(?:\/|$)/.test(path) && path !== '/package.json',
  },
  makers: [{ name: '@electron-forge/maker-zip', platforms: ['darwin'] }],
  plugins: [{ name: '@electron-forge/plugin-webpack', config: {
    mainConfig: './webpack.main.cjs',
    renderer: { config: './webpack.renderer.cjs', entryPoints: [{
      html: './src/renderer/index.html', js: './src/renderer/index.tsx',
      name: 'main_window', preload: { js: './src/preload/index.ts' }
    }] }
  } }]
};
