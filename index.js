require("dotenv").config();

const puppeteer = require("puppeteer");
const { Logger } = require("tslog");
const fs = require("fs");
const { downloadVideos } = require("./download");

const { EMAIL, PASSWORD } = process.env;

const log = new Logger();

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
 * @returns {Promise<{title: string, vimeoUrl: string}>}
 */
async function getVideoInfo(page) {
  await page.waitForSelector("iframe");

  const videoInfo = await page.evaluate(() => {
    const title = document
      .querySelector(".list-item.active")
      .querySelector(".list-item-title").textContent;

    const vimeoUrl = document.querySelector("iframe").src;
    const url = window.location.href;

    return {
      title,
      vimeoUrl,
      url,
    };
  });

  return videoInfo;
}

/**
 *
 * @param {puppeteer.Page} page
 */
async function handleVideoPage(page) {
  await page.reload({
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector(".lessons-list-scroll");

  const info = await getVideoInfo(page);

  log.info(`got info of video => `, info.title);

  return info;
}

async function handleCourse(page, course) {
  log.info(`course ${course.name}`);

  const courseVideosJsonPath = `${course.name}/videosInfo.json`;

  const videosFileAlreadyExists = fs.existsSync(courseVideosJsonPath);
  if (videosFileAlreadyExists) {
    log.info("videos file already exists 😎");
    const json = fs.readFileSync(courseVideosJsonPath);
    const videos = JSON.parse(json);

    await downloadVideos(videos, course);
    return;
  }

  fs.mkdirSync(__dirname + "/" + course.name, {
    recursive: true,
  });

  log.info("opening course page name=", course.name);

  await page.goto(course.url, { waitUntil: "domcontentloaded" });

  const videos = [];

  const updateJson = () => {
    fs.writeFileSync(courseVideosJsonPath, JSON.stringify(videos, null, 2));
  };

  while (true) {
    const info = await handleVideoPage(page);
    videos.push(info);

    updateJson();

    const noMoreVideos = await page.$("button.next[disabled]");

    if (noMoreVideos) {
      break;
    }

    await page.click("button[rel=next]");
    await page.waitForTimeout(3000);
  }

  log.info("done ✅");
  log.info("total videos=", videos.length);

  updateJson();

  log.info("file saved ✅ path=", courseVideosJsonPath);

  await downloadVideos(videos, course);
}

async function main() {
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

  const coursesJson = fs.readFileSync("./courses.json");
  const courses = JSON.parse(coursesJson);

  for (const course of courses) {
    await handleCourse(page, course);
  }

  log.info("closing browser");

  await browser.close();
}

main();
