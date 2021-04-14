import { asyncForEach } from "../utils";
import cheerio from "cheerio";
import fs from "fs";
const puppeteer = require("puppeteer-extra");
import {
  BookType,
  BookStatus,
  Book,
  Chapter,
  Author,
  Category,
  BookPublisher,
} from "../entities";
import { Page } from "puppeteer";

const list_allchpstwo = () => {};

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin());

async function scrapeNovelUpdates() {
  let booksArray = [];
  let browser = await puppeteer.launch({ headless: false, slowMo: 500 });
  let page = await browser.newPage();
  let pageNum = 1;
  let chunks = [
    30,
    60,
    90,
    120,
    130,
    150,
    180,
    220,
    250,
    280,
    310,
    340,
    370,
    400,
  ];
  const file =
    JSON.parse(fs.readFileSync("./dataset/novelupdates-1.json", "utf8"))
      .length / 25;
  pageNum = file;
  booksArray = JSON.parse(
    fs.readFileSync("./dataset/novelupdates-1.json", "utf8")
  );
  console.log(file);
  while (true) {
    if (chunks.find((id) => id === pageNum)) {
      await browser.close();
      browser = await puppeteer.launch({ headless: true, slowMo: 1000 });
      page = await browser.newPage();
    }

    await page.goto(
      `https://www.novelupdates.com/series-finder/?sf=1&sort=srel&order=desc&pg=${pageNum++}`
    );
    await page.waitForSelector(".search_main_box_nu");
    const $ = cheerio.load(await page.content());
    let booksElements = $(".search_main_box_nu");
    for (let i = 0; i < booksElements.length; i++) {
      console.log($(booksElements[i]).find("a").first().attr("href"));
      let title = $(booksElements[i]).find("a").first().text();
      await page.goto($(booksElements[i]).find("a").attr("href"));

      await page.waitForSelector(".l-content");
      await page.evaluate(() => {
        list_allchpstwo();
      });
      await page.waitForSelector(".sp_chp");
      let bookUrl = page.url();
      let book = await scrapePage(await page.content(), bookUrl, page, title);
      console.log(book.title);
      booksArray.push(book);
    }
    fs.writeFileSync(
      "./dataset/novelupdates-1.json",
      JSON.stringify(booksArray)
    );
    if ($(".next_page").length == 0) break;
  }

  await browser.close();
}

async function scrapePage(
  content: string,
  link: string,
  page: Page,
  title: string
): Promise<Book> {
  let $ = cheerio.load(content);
  return {
    title: title,
    author: {
      avatar: "",
      publisher_author_id: encodeURI(
        $("#authtag").first().text().replace(" ", "-")
      ),
      publisher_author_url: $("#authtag").first().attr("href"),
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
      chapter_count: await (async () => {
        let chapters: Chapter[] = [];
        $(".sp_chp")
          .children()
          .toArray()
          .reverse()
          .forEach((element, index) => {
            if (element.tagName == "div") return;
            chapters.push({
              index: index + 1,
              title: $(element.children[1]).attr("title"),
              link: $(element.children[1]).attr("href"),
              locked: false,
              word_count: 0,
              contents: [],
            });
          });
        return chapters.length;
      })(),
      chapters: await (async () => {
        let chapters: Chapter[] = [];
        $(".sp_chp")
          .children()
          .toArray()
          .reverse()
          .forEach((element, index) => {
            if (element.tagName == "div") return;
            chapters.push({
              index: index + 1,
              title: $(element.children[1]).attr("title"),
              link: $(element.children[1]).attr("href"),
              locked: false,
              word_count: 0,
              contents: [],
            });
          });
        return chapters;
      })(),
      name: "Novel Updates",
      cover: $(".seriesimg").children().first().attr().src,
      link: link,
      word_count: 0,
      publisher_book_id: link.split("/")[link.split("/").length - 2],
      views: 0,
      created_at: new Date($("#edityear").text()).getTime(),
      rating: parseFloat($(".uvotes").text().substring(1, 4)),
      rating_count: parseInt($(".uvotes").text().split(" ")[3]),
      collection_count: parseInt($(".rlist").text()),
      release_frequency: parseFloat(
        ($(".seriesother")[13].next as any).data.split(" ")[1]
      ),
      last_updated: ($(
        "#myTable"
      )?.children()?.[1] as any)?.children?.[1]?.children?.[1]?.children?.[0]?.data?.substring(
        3
      ),
    },
    chapter_count: $(".sp_chp").children().length,
    content_rating: [
      $("#seriesgenre").text().includes("Adult") ? "18+" : "General Audience",
    ],
  };
}

scrapeNovelUpdates();
