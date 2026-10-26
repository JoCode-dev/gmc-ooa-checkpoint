import { required } from "./rules.js";

/**
 * Physical copy tracked by the catalogue.
 * Stable states: Available, Issued, Returned.
 * Returned means the member handed the copy back and it is not on the shelf yet.
 */
export const BookStatus = {
  Available: "Available",
  Issued: "Issued",
  Returned: "Returned",
} as const;

export type BookStatus = (typeof BookStatus)[keyof typeof BookStatus];

export class Book {
  readonly isbn: string;
  readonly title: string;
  readonly author: string;
  #status: BookStatus = BookStatus.Available;

  constructor(isbn: string, title: string, author: string) {
    this.isbn = required(isbn, "L'ISBN");
    this.title = required(title, "Le titre");
    this.author = required(author, "L'auteur");
  }

  get status(): BookStatus {
    return this.#status;
  }

  isAvailable(): boolean {
    return this.#status === BookStatus.Available;
  }

  matches(query: string): boolean {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return false;
    }
    return [this.isbn, this.title, this.author].some((field) => field.toLowerCase().includes(needle));
  }

  /** Available → Issued. Responsibility of the "issue book" use case. */
  issue(): void {
    this.#move(BookStatus.Available, BookStatus.Issued);
  }

  /** Issued → Returned. Responsibility of the "return book" use case. */
  markReturned(): void {
    this.#move(BookStatus.Issued, BookStatus.Returned);
  }

  /** Returned → Available. Responsibility of the "shelve book" use case. */
  shelve(): void {
    this.#move(BookStatus.Returned, BookStatus.Available);
  }

  #move(from: BookStatus, to: BookStatus): void {
    if (this.#status !== from) {
      throw new Error(`« ${this.title} » est ${this.#status} : passage vers ${to} impossible.`);
    }
    this.#status = to;
  }
}
