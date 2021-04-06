export interface Book {
  title: string;
  author: Author;
  cover: string;
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

export interface Category {
  name: string;
}

export interface Author {
  publisher_author_id: string;
  publisher_author_url: string;
  name: string;
}

export interface BookPublisher {
  name: string;
  link: string;
  publisher_book_id: string;
  views: number;
  chapters?: Chapter[];
  created_at: number;
  rating: number;
  rating_count: number;
}

export interface Chapter {
  title: string;
  link: string;
  locked: boolean;
  word_count: number;
  volume_title: string;
}

export enum BookType {
  original = "original",
  translation = "translation",
  fanfiction = "fanfiction",
}

export enum BookStatus {
  ongoing = "ongoing",
  completed = "completed",
  hiatus = "hiatus",
  dropped = "dropped",
}
