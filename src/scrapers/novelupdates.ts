import { asyncForEach } from "../utils";
import cheerio from "cheerio";
import fs from "fs";
import puppeteer from "puppeteer-extra";
import {
  BookType,
  BookStatus,
  Book,
  Chapter,
  Author,
  Category,
  BookPublisher,
} from "../entities";

const list_allchpstwo = () => {};

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
async function scrapeNovelUpdates() {
  let booksArray = [];
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let pageNum = 1;
  await page.goto(
    `https://www.novelupdates.com/series-finder/?sf=1&sort=srel&order=desc&pg=${pageNum}`
  );
  await page.waitForSelector(".search_main_box_nu");
  let $ = await cheerio.load(await page.content());
  while(true) {
    let booksElements = $(".search_main_box_nu");
    for (let i = 0; i < booksElements.length; i++) {
      await page.goto(
        (booksElements[i].children[1] as any).children[0].children[1].attribs.href
      );
      await page.waitForSelector(".l-content");
      await page.evaluate(() => {
        list_allchpstwo();
      });
      await page.waitForSelector(".sp_chp");
      let book = await scrapePage(await page.content(), page.url());
      console.log(book);
      booksArray.push(book);
    }
    fs.writeFileSync("novelupdates.txt", JSON.stringify(booksArray));
    if ($(".next_page").length == 0)
      break;
    await page.goto(
      `https://www.novelupdates.com/series-finder/?sf=1&sort=srel&order=desc&pg=${++pageNum}`
    );
    await page.waitForSelector(".search_main_box_nu");
    $ = cheerio.load(await page.content());
  }

  await browser.close();
}

async function scrapePage(content: string, link: string): Promise<Book> {
  let $ = cheerio.load(content);
  return {
    title: $(".seriestitlenu").text(),
    author: {
      publisher_author_id: encodeURI(
        $("#authtag").first().text().replace(" ", "-")
      ),
      publisher_author_url: $("#authtag").first().attr().href,
      name: $("#authtag").first().text(),
    },
    categories: (() => {
      let categories: Category[] = [];
      $("#showtags")
        .children()
        .each((_, element) => {
          categories.push({
            name: (element as any).children[0].data,
          });
        });
      return categories;
    })(),
    alias: (() => {
      let aliases: string[] = [];
      $("#editassociated")
        .html()
        .split("<br>")
        .forEach((v) => aliases.push(v));

      return aliases;
    })(),
    synopsis: $("#editdescription").text(),
    type: BookType.TRANSLATION,
    status: (() => {
      return $("#showtranslated").text() == "Yes"
        ? BookStatus.COMPLETED
        : BookStatus.ONGOING;
    })(),
    original_language: (() => {
      let type = $("#showtype").text();
      if (type.includes("(JP)")) return "Japanese";
      if (type.includes("(CN)")) return "Chinese";
      if (type.includes("(KR)")) return "Korean";
      return "Not specified";
    })(),
    book_publisher: {
      chapters: (() => {
        let chapters: Chapter[] = []
        $(".sp_chp").children().toArray().reverse().forEach(element => {
          if (element.tagName == "div")
            return
          chapters.push({
            title: (element.children[1] as any).children[0].attribs.title,
            link: (element.children[1] as any).attribs.href,
            locked: false,
            word_count: 0,
            volume_title: "Volume 1",
          })
        });
        return chapters
      })(),
      name: "Novel Updates",
      cover: $(".seriesimg").children().first().attr().src,
      link: link,
      publisher_book_id: link.split("/")[link.split("/").length - 2],
      views: 0,
      created_at: new Date($("#edityear").text()).getTime(),
      rating: parseFloat($(".uvotes").text().substring(1, 4)),
      rating_count: parseInt($(".uvotes").text().split(" ")[3]),
      collection_count: parseInt($(".rlist").text()),
      release_frequency: parseFloat(($(".seriesother")[13].next as any).data.split(" ")[1])
    },
    chapter_count: $(".sp_chp").children().length,
    content_rating: [
      $("#seriesgenre").text().includes("Adult") ? "18+" : "General Audience",
    ],
  };
}

scrapeNovelUpdates();
