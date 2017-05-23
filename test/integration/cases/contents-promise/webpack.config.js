'use strict';

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const VirtualModulePlugin = require('../../../../index');

function contents() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('a');
    }, 10);
  });
}

module.exports = function webpackConfig() {
  return {
    entry: './index',
    plugins: [
      new VirtualModulePlugin({
        moduleName: './a.txt',
        contents,
      }),
      new ExtractTextPlugin('file.txt'),
    ],
  };
};
