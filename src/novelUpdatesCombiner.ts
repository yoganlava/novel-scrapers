import { CombinedBook, Book } from './entities';
import fs from "fs";

let combinedBooks: CombinedBook[] = [];

let novelUpdatesBooks = JSON.parse(fs.readFileSync(`books/novelupdates-1.json`).toString());
let preCombinedBooks: CombinedBook[] = JSON.parse(fs.readFileSync(`books/combinedbooks.json`).toString());

function existsInNovelUpdates(bookName: string, authorName: string): number {
    return novelUpdatesBooks.findIndex(book => book.title == bookName && book.author.name == authorName);
}

for (let book of preCombinedBooks) {
    let sameIndex = existsInNovelUpdates(book.title, book.author[0].name);
    if (sameIndex == -1){
        combinedBooks.push(book);
        continue;
    }
    let sameBook: Book = novelUpdatesBooks[sameIndex];
    book.author.push(sameBook.author);
    book.alias.push(...sameBook.alias);
    book.book_publisher.push(sameBook.book_publisher);
}

fs.writeFileSync(
    `books/nucombinedbooks.json`,
    JSON.stringify(combinedBooks)
  );
  