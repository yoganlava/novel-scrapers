import { CombinedBook, BookPublisher } from "./entities";
import fs from "fs";
import dotenv from "dotenv";
import { Client } from "pg";
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

let genres = [
  "Action",
  "Adult",
  "Adventure",
  "Comedy",
  "Contemporary",
  "Cooking",
  "Drama",
  "Ecchi",
  "Economics",
  "Fanfiction",
  "Fantasy",
  "Game",
  "Gender Bender",
  "Harem",
  "High Fantasy [Fantasy]",
  "Historical",
  "Horror",
  "Isekai",
  "Josei",
  "Low Fantasy [Fantasy]",
  "Martial Arts",
  "Mature",
  "Mecha",
  "Music",
  "Mystery",
  "Non-Fiction",
  "Occult",
  "Political",
  "Psychological",
  "Romance",
  "Satire",
  "School",
  "School Life",
  "Sci-fi",
  "Seinen",
  "Shoujo",
  "Shoujo Ai",
  "Shounen",
  "Shounen Ai",
  "Slice of Life",
  "Smut",
  "Sports",
  "Supernatural",
  "Suspense",
  "Thriller",
  "Tragedy",
  "VR Games [SF]",
  "Wuxia",
  "Xianxia",
  "Xuanhuan",
  "Yaoi",
  "Yuri",
];

async function seed() {
  await client.connect();
  let books: CombinedBook[] = JSON.parse(
    fs.readFileSync("books/combinedbooks.json").toString()
  );

  for (let i = 0; i < 100; i++) {
    let book: CombinedBook = books[i];
    let bookRes = await client.query(`
        INSERT INTO books (title, alias, synopsis, type, status, original_language, content_rating, created_at, updated_at) 
        VALUES 
        ('${book.title
          .replace(/'/g, "''")
          .replace(/’/g, "''")}', '{${book.alias
      .filter((item) => item != null)
      .join(",")}}', '${book.synopsis
      .replace(/'/g, "''")
      .replace(/’/g, "''")}', '${book.type}', '${book.status}', '${
      book.original_language
    }', '{${book.content_rating.join(",")}}', now(), now())
        RETURNING book_id
        `);
    let bookId = bookRes.rows[0].book_id;
    for (let j = 0; j < book.book_publisher.length; j++) {
      let publisher: BookPublisher = book.book_publisher[j];
      await client.query(
        `INSERT into publishers (name) VALUES ('${publisher.name}') ON CONFLICT (name) DO NOTHING`
      );
      let publisherRes = await client.query(
        `SELECT publisher_id FROM publishers WHERE name = '${publisher.name}'`
      );
      let publisherId = publisherRes.rows[0].publisher_id;
      let bookPublisherRes = await client.query(`
            INSERT INTO book_publishers
            (publisher_id, book_id, link, publisher_book_id, views, collection_count, power_count, created_at, chapter_count, updated_at, rating, cover, main)
            VALUES 
            (${publisherId}, ${bookId}, '${publisher.link}', '${publisher.publisher_book_id}',${publisher.views}, ${publisher.collection_count}, 0, now(), ${publisher.chapter_count}, now(), ${publisher.rating}, '${publisher.cover}', false)
            RETURNING book_publisher_id
            `);
      let bookPublisherId = bookPublisherRes.rows[0].book_publisher_id;
      console.log(bookPublisherId);
      await client.query(`
            INSERT INTO authors
            (book_publisher_id, publisher_author_id, publisher_author_url, name, avatar, created_at, updated_at)
            VALUES
            (${bookPublisherId}, '${book.author[j].publisher_author_id}', '${
        book.author[j].publisher_author_url
      }', '${book.author[j].name.replace(/'/g, "''").replace(/’/g, "''")}', '${
        book.author[j].avatar
      }', now(), now())
            `);
      for (let chapter of publisher.chapters) {
        await client.query(`
                INSERT INTO chapters
                (title, link, word_count, volume_title, book_publisher_id, created_at, updated_at)
                VALUES
                ('${chapter.title.replace(/'/g, "''").replace(/’/g, "''")}', '${
          chapter.link
        }', 0, '${chapter.volume_title
          .replace(/'/g, "''")
          .replace(/’/g, "''")}', ${bookPublisherId}, now(), now())
                `);
      }
      for (let tag of book.categories) {
        await client.query(`
          INSERT INTO categories
          (name, type, user_id, created_at, updated_at)
          VALUES
          ('${tag.name.replace(/'/g, "''").replace(/’/g, "''")}', '${
          genres.includes(tag.name) ? "genre" : "tag"
        }', 0, now(), now())
          ON CONFLICT (name) DO NOTHING
          `);
        let categoryId = (
          await client.query(`
          SELECT category_id from categories WHERE name = '${tag.name
            .replace(/'/g, "''")
            .replace(/’/g, "''")}'
          `)
        ).rows[0].category_id;
        await client.query(`
          INSERT INTO book_categories
          (book_id, category_id)
          VALUES
          (${bookId}, ${categoryId})
          ON CONFLICT (book_id, category_id) DO NOTHING
          `);
      }
    }
  }
}

seed();
