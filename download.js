const { spawn } = require("child_process");
const { Logger } = require("tslog");
const log = new Logger();

const { COURSE_NAME, YOUTUBE_DL_BIN } = process.env;

async function downloadVideo(url, title, index) {
  const videoFolderPath = `./${COURSE_NAME}/${title}.%(ext)s`;

  return new Promise((resolve, reject) => {
    const prc = spawn(YOUTUBE_DL_BIN, ["-o", videoFolderPath, url]);

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

async function downloadVideos(videos = []) {
  log.info("start downloading videos");

  for (const info of videos) {
    log.info("downloading video: ", info.title);
    await downloadVideo(info.vimeoUrl, info.title, info.index);
    log.info(info.title, "was downloaded! 🤘🏻");
  }

  log.info("cooorrecto sr edwin! ✅✨");
}

module.exports = {
  downloadVideos,
  downloadVideo,
};
