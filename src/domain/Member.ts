import { MAX_OPEN_LOANS, required } from "./rules.js";

/** A person allowed to borrow, within the rules found in the analysis. */
export class Member {
  readonly memberId: string;
  readonly fullName: string;
  readonly email: string;
  #active = true;
  #openLoans = 0;

  constructor(memberId: string, fullName: string, email: string) {
    this.memberId = required(memberId, "L'identifiant membre");
    this.fullName = required(fullName, "Le nom");
    this.email = required(email, "L'e-mail");
  }

  get isActive(): boolean {
    return this.#active;
  }

  get openLoans(): number {
    return this.#openLoans;
  }

  canBorrow(): boolean {
    return this.#active && this.#openLoans < MAX_OPEN_LOANS;
  }

  suspend(): void {
    this.#active = false;
  }

  reactivate(): void {
    this.#active = true;
  }

  attachLoan(): void {
    if (!this.#active) {
      throw new Error(`Le compte de ${this.fullName} est suspendu.`);
    }
    if (this.#openLoans >= MAX_OPEN_LOANS) {
      throw new Error(`${this.fullName} a atteint le plafond de ${MAX_OPEN_LOANS} emprunts.`);
    }
    this.#openLoans += 1;
  }

  releaseLoan(): void {
    if (this.#openLoans === 0) {
      throw new Error(`${this.fullName} n'a aucun emprunt en cours.`);
    }
    this.#openLoans -= 1;
  }
}
