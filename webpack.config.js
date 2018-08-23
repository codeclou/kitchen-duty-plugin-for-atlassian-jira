const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './_page/js/main.js',
  output: {
    path: path.resolve(__dirname, 'build/generated'),
    filename: 'bundle.js'
  },
  performance: { hints: false },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
    })
  ]
};
