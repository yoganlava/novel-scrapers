import fetch from "node-fetch";
import { asyncForEach } from "../utils";
import * as fs from "fs";
import {
  BookType,
  BookStatus,
  Book,
  Chapter,
  Author,
  Category,
  BookPublisher,
} from "../entities";

const fanficID = [
  81006,
  81005,
  81002,
  81003,
  81007,
  81001,
  81008,
  81004,
  81009,
];

async function getBookInfo(id: number) {
  let res = await fetch(
    `https://m.webnovel.com/go/pcm/book/get-book-detail?bookId=${id}`
  );
  return (await res.json()).data.bookInfo;
}

async function scrapeWebnovel() {
  let bookList: Book[] = [];
  for (let i = 0; i < 500; i++) {
    let res = await fetch(
      `https://www.webnovel.com/go/pcm/category/categoryAjax?pageIndex=${
        i + 1
      }&categoryId=0&categoryType=1&sourceType=0&bookStatus=0&orderBy=1`
    );
    let books: any[] = (await res.json()).data.items;
    await asyncForEach(books, async (book) => {
      let categories: Category[] = [];
      categories.push({
        name: book.categoryName,
      });
      book.tagInfo.forEach((tag) => {
        categories.push({
          name: tag.tagName,
        });
      });
      let bookInfo = await getBookInfo(book.bookId);
      let bookType = (() => {
        if (bookInfo.bookType == 1) return BookType.TRANSLATION;
        else if (bookInfo.bookType == 2 && bookInfo.categoryId in fanficID)
          return BookType.FANFICTION;
        return BookType.ORIGINAL;
      })();
      bookList.push({
        title: book.bookName,
        alias: [bookInfo.language?.text],
        cover: `http://img.webnovel.com/bookcover/${bookInfo.bookId}`,
        synopsis: book.description,
        categories: categories,
        chapter_count: book.chapterNum,
        type: bookType,
        content_rating: [bookInfo.ageGroup],
        status:
          bookInfo.actionStatus == 30
            ? BookStatus.ONGOING
            : BookStatus.COMPLETED,
        book_publisher: {
          name: "Webnovel",
          views: bookInfo.pvNum,
          rating: bookInfo.totalScore,
          link: `www.webnovel.com/book/${bookInfo.bookId}`,
          publisher_book_id: bookInfo.bookId,
          rating_count: bookInfo.voters,
          created_at: bookInfo.publishTime,
          collection_count: 0,
        },
        author: {
          publisher_author_id: bookInfo.authorItems?.[0]?.guid,
          publisher_author_url:
            bookInfo.authorItems?.[0]?.guid === undefined
              ? undefined
              : `https://www.webnovel.com/profile/${bookInfo.authorItems?.[0]?.guid}`,
          name: bookInfo.authorItems?.[0]?.name,
        },
        original_language: (() => {
          if (bookInfo.language?.url?.includes("qidian")) return "Chinese";
          else if (bookType == BookType.TRANSLATION) return "Korean";
          else return "English";
        })(),
      });
    });

    console.log(i + 1);
    await new Promise((r) => setTimeout(r, 200));
  }
  fs.appendFile("webnovel.txt", JSON.stringify(bookList), function (err) {
    if (err) throw err;
  });
}

scrapeWebnovel();
