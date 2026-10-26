import { Book, BookStatus } from "../domain/Book.js";
import { Loan } from "../domain/Loan.js";
import { Member } from "../domain/Member.js";
import { MAX_OPEN_LOANS, required } from "../domain/rules.js";

/**
 * In-memory sketch of the application layer.
 * The architecture splits catalogue, membership, and circulation.
 * This class only shows how those responsibilities collaborate.
 * It is not a persistence layer and not a user interface.
 */
export class Library {
  readonly #books = new Map<string, Book>();
  readonly #members = new Map<string, Member>();
  readonly #loans = new Map<string, Loan>();
  #loanSequence = 1;

  addBook(isbn: string, title: string, author: string): Book {
    const book = new Book(isbn, title, author);
    if (this.#books.has(book.isbn)) {
      throw new Error(`Le livre ${book.isbn} est déjà au catalogue.`);
    }
    this.#books.set(book.isbn, book);
    return book;
  }

  registerMember(memberId: string, fullName: string, email: string): Member {
    const member = new Member(memberId, fullName, email);
    if (this.#members.has(member.memberId)) {
      throw new Error(`Le membre ${member.memberId} existe déjà.`);
    }
    this.#members.set(member.memberId, member);
    return member;
  }

  suspendMember(memberId: string): Member {
    const member = this.#requireMember(memberId);
    member.suspend();
    return member;
  }

  search(query: string): Book[] {
    const needle = required(query, "La recherche");
    return [...this.#books.values()].filter((book) => book.matches(needle));
  }

  loansOf(memberId: string): Loan[] {
    this.#requireMember(memberId);
    return [...this.#loans.values()].filter((loan) => loan.memberId === memberId);
  }

  /** Use case: issue a book. Checks eligibility, then records the loan. */
  issueBook(memberId: string, isbn: string, on: Date): Loan {
    const member = this.#requireMember(memberId);
    const book = this.#requireBook(isbn);
    if (!member.isActive) {
      throw new Error(`Le compte de ${member.fullName} est suspendu.`);
    }
    if (member.openLoans >= MAX_OPEN_LOANS) {
      throw new Error(`${member.fullName} a atteint le plafond de ${MAX_OPEN_LOANS} emprunts.`);
    }
    if (!book.isAvailable()) {
      throw new Error(`« ${book.title} » n'est pas disponible (${book.status}).`);
    }
    book.issue();
    member.attachLoan();
    const loan = new Loan(this.#nextLoanId(), member.memberId, book.isbn, on);
    this.#loans.set(loan.loanId, loan);
    return loan;
  }

  /** Use case: return a book. The copy stays Returned until it is shelved. */
  returnBook(isbn: string, on: Date): Loan {
    const book = this.#requireBook(isbn);
    if (book.status !== BookStatus.Issued) {
      throw new Error(`« ${book.title} » n'est pas sorti (${book.status}).`);
    }
    const loan = this.#openLoanFor(book.isbn);
    const member = this.#requireMember(loan.memberId);
    loan.close(on);
    book.markReturned();
    member.releaseLoan();
    return loan;
  }

  /** Use case: put a returned copy back on the shelf. */
  shelveBook(isbn: string): Book {
    const book = this.#requireBook(isbn);
    book.shelve();
    return book;
  }

  /** Use case: list loans that are past their due date and flag them. */
  overdueLoans(on: Date): Loan[] {
    const late: Loan[] = [];
    for (const loan of this.#loans.values()) {
      if (loan.isOverdue(on)) {
        loan.markOverdue(on);
        late.push(loan);
      }
    }
    return late;
  }

  #requireBook(isbn: string): Book {
    const book = this.#books.get(required(isbn, "L'ISBN"));
    if (!book) {
      throw new Error(`Aucun livre pour l'ISBN ${isbn.trim()}.`);
    }
    return book;
  }

  #requireMember(memberId: string): Member {
    const member = this.#members.get(required(memberId, "L'identifiant membre"));
    if (!member) {
      throw new Error(`Aucun membre ${memberId.trim()}.`);
    }
    return member;
  }

  #openLoanFor(isbn: string): Loan {
    const loan = [...this.#loans.values()].find((item) => item.isbn === isbn && item.isOpen());
    if (!loan) {
      throw new Error(`Aucun emprunt ouvert pour ${isbn}.`);
    }
    return loan;
  }

  #nextLoanId(): string {
    const id = `L-${String(this.#loanSequence).padStart(3, "0")}`;
    this.#loanSequence += 1;
    return id;
  }
}
