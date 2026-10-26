import { addDays, LOAN_DAYS } from "./rules.js";

/** One borrowing transaction. Overdue is a loan state, not a book state. */
export const LoanStatus = {
  Active: "Active",
  Overdue: "Overdue",
  Closed: "Closed",
} as const;

export type LoanStatus = (typeof LoanStatus)[keyof typeof LoanStatus];

export class Loan {
  readonly loanId: string;
  readonly memberId: string;
  readonly isbn: string;
  readonly issuedOn: Date;
  readonly dueOn: Date;
  #returnedOn: Date | null = null;
  #wasLate = false;
  #status: LoanStatus = LoanStatus.Active;

  constructor(loanId: string, memberId: string, isbn: string, issuedOn: Date) {
    this.loanId = loanId;
    this.memberId = memberId;
    this.isbn = isbn;
    this.issuedOn = issuedOn;
    this.dueOn = addDays(issuedOn, LOAN_DAYS);
  }

  get status(): LoanStatus {
    return this.#status;
  }

  get returnedOn(): Date | null {
    return this.#returnedOn;
  }

  get wasLate(): boolean {
    return this.#wasLate;
  }

  isOpen(): boolean {
    return this.#status !== LoanStatus.Closed;
  }

  isOverdue(on: Date): boolean {
    return this.isOpen() && on.getTime() > this.dueOn.getTime();
  }

  markOverdue(on: Date): void {
    if (this.#status === LoanStatus.Active && this.isOverdue(on)) {
      this.#status = LoanStatus.Overdue;
    }
  }

  close(on: Date): void {
    if (!this.isOpen()) {
      throw new Error(`L'emprunt ${this.loanId} est déjà clos.`);
    }
    this.#wasLate = on.getTime() > this.dueOn.getTime();
    this.#returnedOn = on;
    this.#status = LoanStatus.Closed;
  }
}
