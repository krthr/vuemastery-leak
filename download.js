const { spawn, Worker, Pool } = require("threads");
const { Logger } = require("tslog");

const log = new Logger();

async function downloadVideos(videos = [], course) {
  const worker = new Worker("/worker/downloader.js");
  const pool = Pool(() => spawn(worker), {
    size: 1,
    concurrency: 5,
  });

  const downloader = await spawn(worker);

  log.info("start downloading videos");
  const videosPath = `./${course.name}`;

  for (const videoInfo of videos) {
    pool.queue(async (downloader) => {
      log.info("downloading video: ", videoInfo.title, videoInfo.vimeoUrl);
      await downloader.downloadVideo(videoInfo, videosPath);
      log.info(videoInfo.title, "was downloaded! 🤘🏻");
    });
  }

  await pool.completed();
  await pool.terminate();

  log.info("cooorrecto sr edwin! ✅✨");
}

module.exports = {
  downloadVideos,
};
