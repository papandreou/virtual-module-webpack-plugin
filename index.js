/* eslint-disable no-underscore-dangle */

'use strict';

const VirtualStats = require('./virtual-stats');

class VirtualModulePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    const moduleName = this.options.moduleName;
    const ctime = VirtualModulePlugin.statsDate();
    let modulePath = this.options.path;
    let contents = this.options.contents;
    if (typeof contents === 'function') {
      contents = contents();
    }

    let injectionPromise;

    function resolverPlugin(request, cb) {
      // populate the file system cache with the virtual module
      const fs = this.fileSystem;

      // webpack 1.x compatibility
      if (typeof request === 'string') {
        request = cb;
        cb = null;
      }

      if (!modulePath) {
        modulePath = this.join(compiler.context, moduleName);
      }
      if (fs._readFileStorage.data[modulePath]) {
        // Not necessary now that we have _injectionPromise?
        if (cb) {
          setImmediate(cb);
        }
        return;
      }
      injectionPromise = injectionPromise || Promise.resolve(contents)
      .then((resolvedContents) => {
        if (typeof resolvedContents === 'object') {
          resolvedContents = JSON.stringify(resolvedContents);
        }
        VirtualModulePlugin.populateFilesystem({ fs, resolvedContents, modulePath, ctime });
      });

      injectionPromise.then(() => cb(), cb);
    }

    if (!compiler.resolvers.normal) {
      compiler.plugin('after-resolvers', () => {
        compiler.resolvers.normal.plugin('resolve', resolverPlugin);
      });
    } else {
      compiler.resolvers.normal.plugin('resolve', resolverPlugin);
    }
  }

  static populateFilesystem(options) {
    const fs = options.fs;
    const contents = options.contents;
    const modulePath = options.modulePath;
    const ctime = options.time;
    const stats = VirtualModulePlugin.createStats({ fs, modulePath, contents, ctime });
    fs._statStorage.data[modulePath] = [null, stats];
    fs._readFileStorage.data[modulePath] = [null, contents];
  }

  static statsDate(inputDate) {
    if (!inputDate) {
      inputDate = new Date();
    }
    return inputDate.toString();
  }

  static createStats(options) {
    if (!options) {
      options = {};
    }
    if (!options.ctime) {
      options.ctime = VirtualModulePlugin.statsDate();
    }
    if (!options.mtime) {
      options.mtime = VirtualModulePlugin.statsDate();
    }
    if (!options.size) {
      options.size = 0;
    }
    if (!options.size && options.contents) {
      options.size = options.contents.length;
    }
    return new VirtualStats({
      dev: 8675309,
      nlink: 1,
      uid: 501,
      gid: 20,
      rdev: 0,
      blksize: 4096,
      ino: 44700000,
      mode: 33188,
      size: options.size,
      atime: options.mtime,
      mtime: options.mtime,
      ctime: options.ctime,
      birthtime: options.ctime,
    });
  }
}

module.exports = VirtualModulePlugin;
