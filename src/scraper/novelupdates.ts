import { asyncForEach } from "./utils";
import cheerio from "cheerio";
import puppeteer from "puppeteer-extra";

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
async function scrapeNovelUpdates() {
  let booksArray = [];
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(
    "https://www.novelupdates.com/series-finder/?sf=1&sort=srel&order=desc"
  );
  await page.waitForSelector(".search_main_box_nu");
  let $ = cheerio.load(await page.content());
  let booksElements = $(".search_main_box_nu");

  for (let i = 0; i < booksElements.length; i++) {
    await page.goto(
      (booksElements[i].children[1] as any).children[0].children[1].attribs.href
    );
    await page.waitForSelector(".l-content");
  }
  await browser.close();
}

scrapeNovelUpdates();
