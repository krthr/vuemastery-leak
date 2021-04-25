require("dotenv").config();

const puppeteer = require("puppeteer");
const { Logger } = require("tslog");
const fs = require("fs");
const { downloadVideos } = require("./download");

const { EMAIL, PASSWORD, COURSE_NAME, COURSE_URL } = process.env;

const log = new Logger();

fs.mkdirSync(__dirname + "/" + COURSE_NAME, {
  recursive: true,
});

const JSON_VIDEOS_FILE_PATH = `${COURSE_NAME}/videosInfo.json`;

const SELECTOR = {
  openLoginModalBtn:
    "#__layout > div > div > div > header > div > nav > div.navbar-secondary.notlogged > button.button.primary.-small",
  email: "input[type=email]",
  password: "input[type=password]",
  loginBtn: "button[type=submit]",
};

/**
 *
 * @param {puppeteer.Page} page
 * @returns {Promise<{title: string, vimeoUrl: string, index: number}>}
 */
async function getVideoInfo(page, index) {
  await page.waitForSelector("iframe");

  const videoInfo = await page.evaluate(() => {
    const title = document
      .querySelector(".list-item.active")
      .querySelector(".list-item-title").textContent;

    const vimeoUrl = document.querySelector("iframe").src;

    return {
      title,
      vimeoUrl,
    };
  });

  return { index, ...videoInfo };
}

/**
 *
 * @param {puppeteer.Page} page
 */
async function handleVideoPage(page, index) {
  await page.waitForSelector(".lessons-list-scroll");
  const info = await getVideoInfo(page, index);

  log.info(`got info of video #${index} => `, info.title);

  return info;
}

async function main() {
  const videosFileAlreadyExists = fs.existsSync(JSON_VIDEOS_FILE_PATH);
  if (videosFileAlreadyExists) {
    log.info("videos file already exists 😎");
    const json = fs.readFileSync(JSON_VIDEOS_FILE_PATH);
    const videos = JSON.parse(json);

    await downloadVideos(videos);
    return;
  }

  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 1280, height: 800 });

  log.info("opening page");

  await page.goto("https://www.vuemastery.com/");
  await page.waitForSelector(SELECTOR.openLoginModalBtn);

  await page.click(SELECTOR.openLoginModalBtn);

  await page.waitForSelector(SELECTOR.email);

  await page.type(SELECTOR.email, EMAIL);
  await page.type(SELECTOR.password, PASSWORD);
  await page.keyboard.press("Enter");

  log.info("logged in");

  await page.waitForTimeout(2000);

  log.info("opening course page");

  await page.goto(COURSE_URL, { waitUntil: "domcontentloaded" });

  const videos = [];
  let index = 1;

  while (true) {
    const info = await handleVideoPage(page, index);
    videos.push(info);

    const noMoreVideos = await page.$("button.next[disabled]");

    if (noMoreVideos) {
      break;
    }

    await page.click("button[rel=next]");
    await page.waitForTimeout(3000);

    index++;
  }

  log.info("closing browser");

  await browser.close();

  log.info("done ✅");
  log.info("total videos=", videos.length);

  fs.writeFileSync(JSON_VIDEOS_FILE_PATH, JSON.stringify(videos, null, 2));

  log.info("file saved ✅ path=", `./${COURSE_NAME}/videosInfo.json`);

  await downloadVideos(videos);
}

main();
