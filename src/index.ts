import { BookStatus } from "./domain/Book.js";
import { LoanStatus } from "./domain/Loan.js";
import { formatDate, MAX_OPEN_LOANS } from "./domain/rules.js";
import { Library } from "./library/Library.js";

const TODAY = new Date("2026-10-26T09:00:00.000Z");
const THREE_WEEKS_AGO = new Date("2026-10-05T09:00:00.000Z");

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Échec : ${message}`);
  }
}

function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function expectError(action: () => void): string {
  try {
    action();
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    throw error;
  }
  throw new Error("Une erreur était attendue.");
}

function main(): void {
  const library = new Library();

  section("Administration : catalogue et adhérent");
  const cleanCode = library.addBook("978-0132350884", "Clean Code", "Robert C. Martin");
  library.addBook("978-0201633610", "Design Patterns", "Erich Gamma");
  const amina = library.registerMember("M-001", "Amina Diallo", "amina@example.com");
  console.log(`Catalogue : « ${cleanCode.title} » est ${cleanCode.status}.`);
  console.log(`Membre : ${amina.fullName} (${amina.memberId}).`);

  section("Cas d'utilisation : rechercher un livre");
  const found = library.search("martin");
  assert(found.length === 1 && found[0] === cleanCode, "la recherche doit trouver Clean Code");
  console.log(`Recherche « martin » → ${found.map((book) => book.title).join(", ")}.`);

  section("Cas d'utilisation : enregistrer un emprunt");
  const loan = library.issueBook(amina.memberId, cleanCode.isbn, TODAY);
  assert(cleanCode.status === BookStatus.Issued, "le livre passe à Issued");
  assert(loan.status === LoanStatus.Active, "l'emprunt est Active");
  assert(amina.openLoans === 1, "le membre a un emprunt ouvert");
  console.log(
    `${amina.fullName} emprunte « ${cleanCode.title} » le ${formatDate(loan.issuedOn)}, retour prévu le ${formatDate(loan.dueOn)}.`,
  );
  console.log(`État du livre : ${cleanCode.status}.`);

  const duplicate = expectError(() => library.issueBook(amina.memberId, cleanCode.isbn, TODAY));
  console.log(`Second emprunt refusé : ${duplicate}`);

  section("Cas d'utilisation : enregistrer un retour, puis remettre en rayon");
  const returned = library.returnBook(cleanCode.isbn, TODAY);
  assert(cleanCode.status === BookStatus.Returned, "le livre passe à Returned");
  assert(returned.status === LoanStatus.Closed, "l'emprunt est clos");
  assert(!returned.wasLate, "le retour du jour n'est pas en retard");
  assert(amina.openLoans === 0, "le compteur d'emprunts retombe à zéro");
  console.log(`Retour enregistré. État du livre : ${cleanCode.status}. Retard : ${returned.wasLate}.`);

  library.shelveBook(cleanCode.isbn);
  assert(cleanCode.status === BookStatus.Available, "le livre revient à Available");
  console.log(`Remis en rayon. État du livre : ${cleanCode.status}.`);

  section("Retard : l'emprunt change d'état, le livre reste Issued");
  const lateLoan = library.issueBook(amina.memberId, cleanCode.isbn, THREE_WEEKS_AGO);
  const late = library.overdueLoans(TODAY);
  assert(late.length === 1 && late[0] === lateLoan, "le prêt ancien est en retard");
  assert(lateLoan.status === LoanStatus.Overdue, "l'emprunt passe à Overdue");
  assert(cleanCode.status === BookStatus.Issued, "le livre reste Issued pendant le retard");
  console.log(
    `Emprunt ${lateLoan.loanId} dû le ${formatDate(lateLoan.dueOn)} → ${lateLoan.status}. Livre : ${cleanCode.status}.`,
  );

  const lateReturn = library.returnBook(cleanCode.isbn, TODAY);
  assert(lateReturn.wasLate, "le retour hors délai est signalé");
  console.log(`Retour hors délai signalé pour ${lateReturn.loanId}.`);
  library.shelveBook(cleanCode.isbn);

  section("Administration : suspension");
  library.suspendMember(amina.memberId);
  const blocked = expectError(() => library.issueBook(amina.memberId, cleanCode.isbn, TODAY));
  console.log(`Emprunt refusé : ${blocked}`);
  assert(amina.openLoans === 0, "aucun emprunt n'est ouvert après le refus");
  console.log(`Plafond analysé : ${MAX_OPEN_LOANS} emprunts ouverts.`);
}

main();
