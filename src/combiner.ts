import { Book, CombinedBook } from './entities';
import fs from "fs";

let combinedBooks: CombinedBook[] = []

let royalRoadBooks = [];
let webnovelBooks = JSON.parse(fs.readFileSync(`books/webnovel.txt`).toString());

for (let i = 1; i <= 7; i++)
  royalRoadBooks.push(
    ...JSON.parse(fs.readFileSync(`books/royal-${i}.json`).toString())
  );

function existsInRR(bookName: string, authorName: string): number {
    return royalRoadBooks.findIndex(book => book.title == bookName && book.author.name == authorName);
}

for (let book of webnovelBooks){
    let sameIndex = existsInRR(book.title, book.author.name);
    if (sameIndex == -1){
        book.author = [book.author];
        book.book_publisher = [book.book_publisher];
        combinedBooks.push(book);
        continue;
    }
    book.author = [book.author, royalRoadBooks[sameIndex].author];
    book.book_publisher = [book.book_publisher, royalRoadBooks[sameIndex].book_publisher];
    combinedBooks.push(book);
}

fs.writeFileSync(
  `combinedbooks.json`,
  JSON.stringify(combinedBooks)
);
    
