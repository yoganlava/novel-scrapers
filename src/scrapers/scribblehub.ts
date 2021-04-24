import { Book, BookType, Category, BookStatus } from "./../entities";
const puppeteer = require("puppeteer-extra");
import cheerio from "cheerio";

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin());

const toc_fic_show = () => {};

async function scrapeScribbleHub() {
  let booksArray = [];
  let browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000,
  });

  let page = await browser.newPage();
  for (let pageNum = 1; pageNum <= 287; pageNum++) {
    await page.goto(
      `https://www.scribblehub.com/series-finder/?sf=1&sort=chapters&order=desc&pg=${pageNum}`
    );
    await page.waitForSelector(".sf_results");
    const $ = cheerio.load(await page.content());
    let booksElements = $(".search_main_box");
    for (let i = 0; i < booksElements.length; i++) {
      await page.goto($(booksElements[i]).find("a").attr("href"), {
        waitUntil: "networkidle2",
        timeout: 0,
      });

      await page.waitForSelector(".wi_fic_desc");
      await page.evaluate(() => {
        toc_fic_show();
      });
      await page.waitForSelector(".c_toc_box");
      let bookUrl = page.url();
      console.log(await scrapePage(await page.content(), bookUrl));
    }
  }
}

async function scrapePage(content: string, link: string): Book {
  let $ = cheerio.load(content);
  return {
    title: $(".fic_title").text(),
    author: {
      avatar: $("#acc_ava_change").attr().src,
      publisher_author_url: $(".auth_name_fic").parent().attr().href,
      publisher_author_id: "",
      name: $(".auth_name_fic").text(),
    },
    categories: (() => {
      let categories: Category[] = [];
      for (let category of $(".wi_fic_genre").children().toArray()) {
        categories.push({
          name: (category.children[0] as any).data,
        });
      }
      for (let category of $(".wi_fic_showtags_inner").children().toArray()) {
        categories.push({
          name: (category.children[0] as any).data,
        });
      }
      return categories;
    })(),
    synopsis: $(".wi_fic_desc").text(),
    type: (() => {
      for (let category of $(".wi_fic_genre").children().toArray())
        if ((category.children[0] as any).data == "Fanfiction")
          return BookType.FANFICTION;
      return BookType.ORIGINAL;
    })(),
    status: (() => {
      if ($(".widget_fic_similar").text().includes("Ongoing"))
        return BookStatus.ONGOING;
      if ($(".widget_fic_similar").text().includes("Completed"))
        return BookStatus.COMPLETED;
      if ($(".widget_fic_similar").text().includes("Hiatus"))
        return BookStatus.HIATUS;
    })(),
    original_language: "English",
    book_publisher: {
      name: "Scribble Hub",
      cover: $(".fic_image").children()[0].attribs.href
    }
  };
}

scrapeScribbleHub();
