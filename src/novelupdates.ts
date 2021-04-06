import { asyncForEach } from "./utils";
import puppeteer from "puppeteer";
import cheerio from "cheerio";

async function scrapeNovelUpdates() {
  let booksArray = [];
  const browser = await puppeteer.launch({ headless: false });
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
    // TODO
  }

  await browser.close();
}

scrapeNovelUpdates();
