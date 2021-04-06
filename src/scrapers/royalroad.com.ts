import cheerio from "cheerio";
import puppeteer from "puppeteer-extra";
import { Book, Category } from "../entities";

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

export default async function royalRoad() {
  let page_no = 1;
  let max_page = 1762;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let books: Book[];
  for (let i = 1; i < max_page; i++) {
    await page.goto(
      `https://www.royalroad.com/fictions/search?orderBy=views&page=${i}`
    );
    const content = await page.content();
    let $ = cheerio.load(content);
    // console.log($(".fiction-list-item"));
    $(".fiction-list-item").each((index, el) => {
      let ch = cheerio.load($(el).html());

      let book = {
        title: ch("h2.fiction-title a").text(),
        book_publisher: {
          link:
            "https://https://www.royalroad.com" +
            ch("h2.fiction-title a").attr("href"),
        },
      } as Book;
      ch(".row .stats").each((index, el) => {
        switch (index) {
          case 0:
            book.book_publisher.collection_count = parseInt(
              ch(el).children("span").text().replace(/,/gi, "").split(" ")[0]
            );
            break;
          case 1:
            book.book_publisher.rating = parseFloat(
              ch(el).children("span").attr("title")
            );
            break;
          case 2:
            // book.book_publisher.collection_count = parseInt(ch(el).children('span').text().replace(',',''))
            break;
          case 3:
            book.book_publisher.views = parseInt(
              ch(el).children("span").text().replace(/,/gi, "").split(" ")[0]
            );
            break;
          case 4:
            book.chapter_count = parseInt(
              ch(el).children("span").text().replace(/,/gi, "").split(" ")[0]
            );
            break;
          case 5:
            break;
          case 6:
            break;
        }
      });
      ch(".label.label-default").each((index, el) => {
        if (index === 0) {
          book.type = ch(el).text() as any;
        } else {
          book.categories.push({
            name: ch(el).text(),
          });
        }
      });

      console.log(book);
    });

    return;
  }
}

royalRoad();
