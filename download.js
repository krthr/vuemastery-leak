const { spawn, Worker, Pool } = require("threads");
const { Logger } = require("tslog");

const log = new Logger();

async function downloadVideos(videos = [], course) {
  const worker = new Worker("/worker/downloader.js");
  const pool = Pool(() => spawn(worker), {
    size: 1,
    concurrency: 6,
  });

  log.info("start downloading videos");
  const videosPath = `./${course.name}`;

  for (const videoInfo of videos) {
    pool.queue(async (downloader) => {
      try {
        log.info("downloading video: ", videoInfo.title, videoInfo.vimeoUrl);
        await downloader.downloadVideo(videoInfo, videosPath);
        log.info(videoInfo.title, "was downloaded! 🤘🏻");
      } catch (error) {
        log.error(error);
      }
    });
  }

  await pool.completed();
  await pool.terminate();

  log.info("cooorrecto sr edwin! ✅✨");
}

module.exports = {
  downloadVideos,
};
