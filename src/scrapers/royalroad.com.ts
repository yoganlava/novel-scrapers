import cheerio from "cheerio";
const puppeteer = require("puppeteer-extra");
import { Book, Category, Chapter } from "../entities";
import fs from "fs-extra";
import { sleep } from "../utils";
import { isWhileStatement } from "typescript";

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

export default async function royalRoad() {
  let page_no = 1;
  let max_page = 1762;
  let browser = await puppeteer.launch({
    // slowMo: 200,
    headless: true,
    defaultViewport: null,
  });

  let page = await browser.newPage();
  let chunk_index = 0;
  let all_books: any[] = [];
  let chunks = [0, 300, 600, 900, 1200, 1500, 1767];
  for (let chunk of chunks) {
    let books: Book[] = [];
    if (chunk <= -1) {
    } else {
      for (let i = chunks[chunk_index - 1] + 1; i <= chunk; i++) {
        let error = true,
          error_count = 0;
        while (error) {
          try {
            if (error_count > 1) {
              console.log("something wrong with pagination navigation");
              browser.close();
              await sleep(1000 * 60 * 5 * (error_count + 1));
              browser = await puppeteer.launch({
                // slowMo: 200,
                headless: true,
                defaultViewport: null,
              });
              page = await browser.newPage();
              await page.goto(
                `https://www.royalroad.com/fictions/search?page=${i}&orderBy=views`,
                { waitUntil: "networkidle2" }
              );
            } else {
              await page.goto(
                `https://www.royalroad.com/fictions/search?page=${i}&orderBy=views`,
                { waitUntil: "networkidle2" }
              );
            }
            error = false;
          } catch (error) {
            error_count++;
            error = true;
          }
        }
        await page.waitForSelector(".fiction-list-item");
        const content = await page.content();
        let $ = cheerio.load(content);
        let current_books: Book[] = [];
        $(".fiction-list-item").each(async (index, el) => {
          let ch = cheerio.load($(el).html());
          let book = {
            title: ch("h2.fiction-title a").text(),
            book_publisher: {
              link:
                "https://www.royalroad.com" +
                ch("h2.fiction-title a").attr("href"),
              chapters: [],
              cover: ch("figure a img").attr("src"),
            },
            author: {},
            categories: [],
          } as Book;
          ch(".row.stats")
            .children()
            .each((index, el) => {
              switch (index) {
                case 0:
                  book.book_publisher.collection_count = parseInt(
                    ch(el)
                      .children("span")
                      .text()
                      .replace(/,/gi, "")
                      .split(" ")[0]
                  );
                  break;
                case 1:
                  book.book_publisher.rating = parseFloat(
                    ch(el).children("span").attr("title")
                  );
                  break;
                case 2:
                  break;
                case 3:
                  book.book_publisher.views = parseInt(
                    ch(el)
                      .children("span")
                      .text()
                      .replace(/,/gi, "")
                      .split(" ")[0]
                  );
                  break;
                case 4:
                  book.chapter_count = parseInt(
                    ch(el)
                      .children("span")
                      .text()
                      .replace(/,/gi, "")
                      .split(" ")[0]
                  );
                  book.book_publisher.chapter_count = parseInt(
                    ch(el)
                      .children("span")
                      .text()
                      .replace(/,/gi, "")
                      .split(" ")[0]
                  );
                  break;
                case 5:
                  break;
                case 6:
                  book.synopsis = ch(el)
                    .text()
                    .replace(/\s{2,}/gi, "");

                  break;
              }
            });
          ch(".label.label-default").each((index, el) => {
            if (index === 0) {
              book.type = ch(el).text().toLocaleLowerCase() as any;
            } else {
              let list = [];
              if (ch(el).text().match("Portal Fantasy")) {
                list.push({ name: ch(el).text().split("/")[0].trim() });
                list.push({ name: ch(el).text().split("/")[1].trim() });
              } else {
                list.push({
                  name: ch(el).text(),
                });
              }
              book.categories.push(...list);
            }
          });

          current_books.push(book);
        });
        let exclude = [];
        for (let book of current_books) {
          let error = true,
            error_count = 0;
          while (error) {
            try {
              if (error_count > 1) {
                console.log("something wrong with book navigation");
                console.log(book.book_publisher.link);
                browser.close();
                await sleep(1000 * 60 * 5 * (error_count + 1));
                browser = await puppeteer.launch({
                  //   slowMo: 200,
                  headless: false,
                  defaultViewport: null,
                });
                page = await browser.newPage();

                await page.goto(book.book_publisher.link, {
                  waitUntil: "networkidle2",
                  timeout: 0,
                });
              } else {
                await page.goto(book.book_publisher.link, {
                  waitUntil: "networkidle2",
                });
              }
              error = false;
            } catch (error) {
              console.log(error);
              error_count++;
              error = true;
            }
          }
          const pageClicked = await page.evaluate(() => {
            return !!document.querySelector(".page-404"); // !! converts anything to boolean
          });
          if (pageClicked) {
            exclude.push(book.book_publisher.link);
          } else {
            try {
              await page.waitForSelector(".dataTable-selector");
            } catch (error) {
              console.log(error);
              await page.goto(book.book_publisher.link, {
                waitUntil: "networkidle2",
              });
              await page.waitForSelector(".dataTable-selector", { timeout: 0 });
            }

            let $ = cheerio.load(await page.content());
            let max = 0;
            console.log(i, "   ", book.book_publisher.link);
            book.synopsis = $(".description")
              .text()
              .split("\n")
              .map((item) => item.replace(/\s{2,}/gi, ""))
              .filter((item) => item.length > 1)
              .join("\n\n");
            book.author = {
              name: $(".fic-title h4 span a").text(),
              publisher_author_url:
                "https://www.royalroad.com" +
                $(".mt-card-content h3 a").attr("href"),
              avatar: $(".avatar-container-general img")
                .attr("src")
                .match("/Content/Images/anon.jpg")
                ? "https://www.royalroad.com" +
                  $(".avatar-container-general img").attr("src")
                : $(".avatar-container-general img").attr("src"),
              publisher_author_id: $(".mt-card-content h3 a")
                .attr("href")
                .split("/")[
                $(".mt-card-content h3 a").attr("href").split("/").length - 1
              ],
            };
            await page.select(
              ".dataTable-selector",
              $("#chapters").attr("data-chapters")
            );
            $(".fiction-info span.label.label-default").each((index, el) => {
              if (
                $(el).text().toLowerCase() === "ongoing" ||
                $(el).text().toLowerCase() === "hiatus" ||
                $(el).text().toLowerCase() === "completed" ||
                $(el).text().toLowerCase() === "dropped" ||
                $(el).text().toLowerCase() === "stub"
              ) {
                book.status = $(el).text().toLowerCase() as any;
              }
            });
            await page.waitForTimeout(100);

            $ = cheerio.load(await page.content());
            book.book_publisher.word_count = parseInt(
              $(".fal.fa-question-circle.popovers")
                .attr("data-content")
                .split("calculated from")[1]
                .trim()
                .split(" ")[0]
                .replace(/,/gi, "")
            );
            $("#chapters tbody")
              .children()
              .each((index, el) => {
                let chapter: Chapter = {
                  index: index + 1,
                  title: $(el)
                    .children()
                    .first()
                    .find("a")
                    .text()
                    .trim()
                    .replace(/\n/gi, ""),
                  contents: [],
                  link:
                    "https://www.royalroad.com" +
                    $(el).children().first().find("a").attr("href"),
                  locked: false,
                  publisher_created_at: new Date(
                    $(el)
                      .children()
                      .last()
                      .find("time")
                      .attr("title")
                      .replace("Monday,", "")
                      .replace("Tuesday,", "")
                      .replace("Wednesday,", "")
                      .replace("Thursday,", "")
                      .replace("Friday,", "")
                      .replace("Saturday,", "")
                      .replace("Sunday,", "") as any
                  ),
                  word_count: 0,
                  volume_title: "",
                };
                book.book_publisher.chapters.push(chapter);
              });

            //   for (let chapter of book.book_publisher.chapters) {
            //     await page.goto(chapter.link);
            //     $ = cheerio.load(await page.content());
            //     let contents = [],
            //       word_count = 0;
            //     $(".chapter-inner.chapter-content")
            //       .children("p")
            //       .each((index, el) => {
            //         let content = $(el).text().trim();
            //         word_count += content.split(" ").length;
            //         contents.push(content);
            //       });
            //     chapter.word_count = word_count;
            //     chapter.contents = contents;
            //   }
          }
        }
        current_books = current_books.filter((book) => {
          return !exclude.find((link) => link === book.book_publisher.link);
        });
        books.push(...current_books);
      }
      await fs.writeFile(
        `./dataset/royal-${chunk_index}.json`,
        JSON.stringify(books)
      );
    }

    chunk_index++;
    // all_books.push(...books.map((book) => book.title));
  }
}

(async () => {
  //   const file = await fs.readFile("./dataset/royal-0.json", "utf8");
  //   console.log(JSON.parse(file).length);
  await royalRoad();
})();
