export class Book {
  title: string;
  author: Author;
  categories: Category[];
  alias?: string[];
  synopsis: string;
  type: BookType;
  status: BookStatus;
  original_language: string;
  book_publisher: BookPublisher;
  chapter_count: number;
  content_rating: string[];
}

export class Category {
  name: string;
}

export class Author {
  publisher_author_id: string;
  publisher_author_url: string;
  name: string;
  avatar: string;
}

export class BookPublisher {
  name: string;
  link: string;
  release_frequency: number;
  publisher_book_id: string;
  views: number;
  chapters?: Chapter[];
  created_at: number;
  rating: number;
  rating_count: number;
  collection_count: number;
  cover: string;
  word_count: number;
  last_updated?: string;
}

export class Chapter {
  index: number;
  title: string;
  contents: string[];
  link: string;
  locked: boolean;
  word_count: number;
  volume_title?: string;
  publisher_created_at?: Date;
}

export enum BookType {
  ORIGINAL = "original",
  TRANSLATION = "translation",
  FANFICTION = "fanfiction",
}

export enum BookStatus {
  ONGOING = "ongoing",
  COMPLETED = "completed",
  HIATUS = "hiatus",
  DROPPED = "dropped",
  STUB = "stub",
}
