const { spawn } = require("child_process");

const { COURSE_NAME, YOUTUBE_DL_BIN } = process.env;

async function downloadVideo(url, index = 0) {
  const videoFolderPath = `./${COURSE_NAME}/${index}. %(title)s.%(ext)s`;

  return new Promise((resolve) => {
    const prc = spawn(YOUTUBE_DL_BIN, ["-o", videoFolderPath, url]);

    prc.stdout.setEncoding("utf-8");
    prc.stdout.on("data", console.log);

    prc.on("close", resolve);
  });
}

module.exports = {
  downloadVideo,
};
