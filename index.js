'use strict';

const AWS = require('aws-sdk');
const mysqlDump = require('mysqldump');
const fs = require('fs');
require('date-utils');

var date = new Date();
var timeStamp = date.toFormat('YYYYMMDDHH24MISS');
// dumpファイルのファイル名
const dumpFileName = 'dump_' + timeStamp + '.sql';
const dumpPath = '/tmp/' + dumpFileName;

// メインの処理
exports.handler = (event, context) => {
  const kms = new AWS.KMS({ region: 'ap-northeast-1' });
  // 暗号化したデータベースのパスワードをKMSに渡す形式のJSONにする
  const cipherText = { CiphertextBlob: new Buffer(process.env.PASSWORD, 'base64') };

  // パスワードの復号を実行する
  kms.decrypt(cipherText, (err, data) => {
    if (err) {
      // エラーが起こった場合、ログを出力
      console.log('Decrypt error:', err);
    } else {
      console.log('Decrypt Success.');

      // 復号に成功した場合、パスワードとして変数に代入
      var password = data.Plaintext.toString();
      // 不要な記号（”）が文字列の最初と最後に付くため、切り取る
      password = password.slice(1, -1);

      // mysqldumpを実行
      mysqlDump({
        host: process.env.HOST,
        user: process.env.USER,
        password: password,
        database: process.env.DBNAME,
        dest: dumpPath
      }, (err) => {
        // エラーが起こった場合、ログを出力
        if (err) {
          context.fail(err);
          console.log('mysqldump error:' + err);
        } else {
          console.log('mysqldump saved.');
          // mysqldumpの作成が成功した場合、S3へdumpファイルを送信する
          sendS3();
        }
      });
    }
  });
};

// S3へdumpファイルを送信する
function sendS3() {
  const s3 = new AWS.S3();

  var params = {
    Bucket: （保存先のバケット名を指定）,
    Key: 'mysqldump/' + dumpFileName,
    Body: fs.readFileSync(dumpPath)
  };

  // S3にmysqldumpを配置する
  s3.putObject(params, (err) => {
    if (err) {
      console.log('S3 PutObject error:', err);
    } else {
      console.log('mysqldump is uploaded to S3.');
    }
  });
}
