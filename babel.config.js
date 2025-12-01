export default {
  presets: [
    ['@babel/preset-env', {
      useBuiltIns: 'usage',
      corejs: 3,
      targets: '> 0.25%, not dead',
      modules: false
    }]
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-runtime', {
      regenerator: true
    }]
  ]
}
