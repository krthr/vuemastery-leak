require("dotenv").config();
const { expose } = require("threads/worker");
const { spawn } = require("child_process");

const { YOUTUBE_DL_BIN } = process.env;

async function downloadVideo({ vimeoUrl, title }, path) {
  const videoFolderPath = `${path}/${title}.%(ext)s`;

  return new Promise((resolve, reject) => {
    const prc = spawn(YOUTUBE_DL_BIN, ["-o", videoFolderPath, vimeoUrl]);

    prc.stdout.setEncoding("utf-8");
    prc.stderr.setEncoding("utf-8");

    prc.stdout.on("data", (data) => {
      log.debug(data.trim());
    });

    prc.stderr.on("data", (err) => {
      log.error(err);
    });

    prc.on("error", reject);
    prc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
}

expose({
  downloadVideo,
});
