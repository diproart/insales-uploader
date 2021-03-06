import fs from 'fs';
import Promise from 'promise';
import http from 'http';
import clc from 'cli-color';

const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_edit = clc.xterm(40);
const log_white = clc.xterm(254);

export function fileMissing(_path) {
  return new Promise(function (resolve, reject) {
    fs.stat(_path, (err, stats) => {
      if (err) {
        resolve();
      }else{
        reject();
      }
    });
  });
}

export function writeFile(dest, _contents, _encodes, task) {
  return new Promise(function (resolve, reject) {
  var options = { encoding: _encodes };
  var file = fs.createWriteStream(dest, options);

  file.on('open', function () {
      file.write(_contents);
      file.end()
  }).on('finish', function () {
    if (!task) {
      console.log(log_white('download: ' + dest));
    }
    if (task && task.message) {
      console.log(log_white(task.message));
    }
    resolve();
  }).on('error', function(err) {
      fs.unlink(dest);
      console.log(log_error(err));
      reject()
    });
  });
}

export function writeFileWithDownload(url, dest, cb) {
    return new Promise(function (resolve, reject) {
      var file = fs.createWriteStream(dest);
      var request = http.get(url, function(response) {
        let statusCode = response.statusCode
        if (statusCode !== 404) {
          response.pipe(file);
          file.on('finish', function() {
            console.log(log_white('download: ' + dest));
            resolve()
            file.close(cb);
          });
        }
        if (statusCode === 404) {
          console.log(log_error(`Файл по адресу: ${url}, не найден.`));
          resolve()
        }
      }).on('error', function(err) {
        fs.unlink(dest);
        if (cb) cb(err.msg);
        reject()
      });
    });
};

export function writeManager (_asset, _uri, dataReponse, action, _owner, callback) {
  var _contents = dataReponse.content

  if (dataReponse.asset_url) {
    if (action.method === 'download' && action.rewrite) {
      writeFileWithDownload(_uri, _asset.path).then(function () {
        if (_asset.isMedia) {
          writeFileWithDownload(_uri, _asset.pathMedia).then(function () {
            callback()
          })
        }else{
          callback()
        }
      })
    }
    if (_owner.options.theme.startBackup || action.method === 'backup') {
        writeFileWithDownload(_uri, _asset.backupPath).then(function () {
          callback()
        })
      }
  }else{
    if (action.method === 'download' && action.rewrite) {
      writeFile(_asset.path, _contents, 'utf8').then(function () {
        if (_asset.isMedia) {
          writeFile(_asset.pathMedia, _contents, 'utf8').then(function () {
            callback()
          })
        }else{
          callback()
        }
      })
    }
    if (_owner.options.theme.startBackup || action.method === 'backup') {
        writeFile(_asset.backupPath, _contents, 'utf8').then(function () {
          callback()
        })
      }
  }
}
