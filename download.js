const { spawn, Thread, Worker } = require("threads");
const { Logger } = require("tslog");

const log = new Logger();

async function downloadVideos(videos = [], course) {
  const downloader = await spawn(new Worker("/worker/downloader.js"));

  log.info("start downloading videos");
  const videosPath = `./${course.name}`;

  const promises = videos.map(async (videoInfo) => {
    log.info("downloading video: ", videoInfo.title, videoInfo.vimeoUrl);
    await downloader.downloadVideo(videoInfo, videosPath);
    log.info(videoInfo.title, "was downloaded! 🤘🏻");
  });

  await Promise.all(promises);

  await Thread.terminate(downloader);
  log.info("cooorrecto sr edwin! ✅✨");
}

module.exports = {
  downloadVideos,
};
