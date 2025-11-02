import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import * as XLSX from "xlsx";

/**
 * FileParsingService.ts
 * - Robust DOCX table parser for bank statements
 * - Detects header row by keyword scoring
 * - Pads rows to header length
 * - Uses header mapping to find date/ref/description/debit/credit/balance columns
 * - Merges continuation rows only into description column
 * - Cleans references and numeric fields
 */

const pdfParse = async (buffer: Buffer) => {
  throw new Error("PDF parsing is not available in the browser. Use server-side parsing or convert to Word/Excel.");
};

export interface ParsedTransaction {
  bookDate: string;
  valueDate?: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  closingBalance?: number;
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
  transactions: ParsedTransaction[];
}

export class FileParsingService {
  static async parseFile(file: File): Promise<ParsedTable> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return this.parsePDF(file);
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      return this.parseWord(file);
    } else if (
      fileType === "application/vnd.ms-excel" ||
      fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx")
    ) {
      return this.parseExcel(file);
    } else {
      throw new Error("Unsupported file type. Please upload PDF, Word (.docx), or Excel files.");
    }
  }

  private static async parsePDF(file: File): Promise<ParsedTable> {
    const arrayBuffer = await file.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));
    const text = (data as any).text || "";
    const tableData = this.extractTableFromText(text);
    return this.parseTableData(tableData);
  }

  /**
   * DOCX parser (tables only)
   */
  private static async parseWord(file: File): Promise<ParsedTable> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const docFile = zip.file("word/document.xml");
    if (!docFile) throw new Error("word/document.xml not found in .docx");

    const xmlString = await docFile.async("string");
    const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");

    const tblEls = Array.from(xmlDoc.getElementsByTagName("w:tbl"));
    if (tblEls.length === 0) throw new Error("No tables found in Word document.");

    const getCellText = (tc: Element) => {
      const tNodes = Array.from(tc.getElementsByTagName("w:t"));
      const texts = tNodes.map((t) => (t.textContent || "").replace(/\s+/g, " ").trim());
      return texts.filter(Boolean).join(" ");
    };

    const headerKeywords = [
      "book date",
      "reference",
      "description",
      "value date",
      "debit",
      "credit",
      "balance",
    ];

    let chosenHeaders: string[] = [];
    let mergedRows: string[][] = [];
    let globalBestScore = 0;

    for (const tbl of tblEls) {
      const rowsXml = Array.from(tbl.getElementsByTagName("w:tr"));
      const rows = rowsXml.map((tr) => {
        const cells = Array.from(tr.getElementsByTagName("w:tc"));
        return cells.map(getCellText);
      });

      if (rows.length === 0) continue;

      // Find header row
      let tableBestScore = 0;
      let headerIndex = -1;
      const limit = Math.min(10, rows.length);
      for (let i = 0; i < limit; i++) {
        const rowText = rows[i].join(" ").toLowerCase();
        let score = 0;
        for (const kw of headerKeywords) {
          if (rowText.includes(kw)) score++;
        }
        if (score > tableBestScore) {
          tableBestScore = score;
          headerIndex = i;
        }
      }

      if (headerIndex === -1) continue;

      const headerRow = rows[headerIndex].map((c) => (c || "").trim());
      if (chosenHeaders.length === 0 || tableBestScore > globalBestScore) {
        chosenHeaders = headerRow;
        globalBestScore = tableBestScore;
      }

      const dataRows = rows.slice(headerIndex + 1);
      mergedRows = mergedRows.concat(dataRows.filter((r) => r.some((c) => c && c.trim())));
    }

    if (mergedRows.length === 0) throw new Error("No transactions found across tables");

    if (chosenHeaders.length === 0) {
      const maxCols = Math.max(...mergedRows.map((r) => r.length));
      chosenHeaders = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
    }

    chosenHeaders = chosenHeaders.map((h) => (h || "").replace(/\s+/g, " ").trim());
    const normalizedHeaderLower = chosenHeaders.map((h) => (h || "").toLowerCase().trim());

    // Indexes
    const descriptionIndex = this.findColumnIndex(normalizedHeaderLower, ["description", "details", "narration"]);
    const debitIndex = this.findColumnIndex(normalizedHeaderLower, ["debit", "dr", "withdrawal"]);
    const creditIndex = this.findColumnIndex(normalizedHeaderLower, ["credit", "cr", "deposit"]);
    const balanceIndex = this.findColumnIndex(normalizedHeaderLower, ["balance"]);

    const dateRegex = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s+[A-Z]{3}\s+\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/;
    const amountRegex = /\b\d{1,3}(,\d{3})*(\.\d{2})?\b/;
    const referenceRegex = /\b[A-Z0-9\\\/-]{8,}\b/;

    const headerLen = Math.max(chosenHeaders.length, ...mergedRows.map((r) => r.length));
    const paddedRows: string[][] = mergedRows.map((r) =>
      Array.from({ length: headerLen }, (_, i) => (r[i] || "").trim())
    );

    const groupedRows: string[][] = [];
    for (let i = 0; i < paddedRows.length; i++) {
      const row = paddedRows[i];
      const bookDateCandidate = row[0] || "";
      const hasDate = dateRegex.test(bookDateCandidate);
    
      if (hasDate) {
        // Start new transaction
        let block = row.slice();
    
        // Look ahead: absorb all following continuation rows until next date
        while (i + 1 < paddedRows.length) {
          const nextRow = paddedRows[i + 1];
          const nextHasDate = dateRegex.test(nextRow[0] || "");
          if (nextHasDate) break; // stop at the next transaction
    
          // merge continuation into description and numeric fields
          const descIndex = descriptionIndex >= 0 ? descriptionIndex : 2;
          const descParts: string[] = nextRow.filter(c => c && c.trim());
    
          if (descParts.length > 0) {
            block[descIndex] = ((block[descIndex] || "") + " " + descParts.join(" ")).trim();
          }
    
          // also try to patch in debit/credit/balance if they are in continuation rows
          if (!block[debitIndex] && amountRegex.test(nextRow[debitIndex] || "")) {
            block[debitIndex] = nextRow[debitIndex];
          }
          if (!block[creditIndex] && amountRegex.test(nextRow[creditIndex] || "")) {
            block[creditIndex] = nextRow[creditIndex];
          }
          if (!block[balanceIndex] && amountRegex.test(nextRow[balanceIndex] || "")) {
            block[balanceIndex] = nextRow[balanceIndex];
          }
    
          i++; // consume continuation row
        }
    
        groupedRows.push(block);
      } else if (groupedRows.length > 0) {
        // continuation row without date → merge into last
        const prev = groupedRows[groupedRows.length - 1];
        const descIndex = descriptionIndex >= 0 ? descriptionIndex : 2;
        const descParts: string[] = row.filter(c => c && c.trim());
        if (descParts.length > 0) {
          prev[descIndex] = ((prev[descIndex] || "") + " " + descParts.join(" ")).trim();
        }
      }
    }
    
    

    const finalRows = groupedRows.filter((r) => {
      const text = r.join(" ").toLowerCase();
      if (/(opening balance|closing balance|period start|period end|page \d+)/i.test(text)) return false;
      return r.some((c) => c && c.trim().length > 0);
    });

    return this.parseTableData({ headers: chosenHeaders, rows: finalRows });
  }

  private static async parseExcel(file: File): Promise<ParsedTable> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    if (jsonData.length === 0) throw new Error("No data found in Excel file");
    const headers = jsonData[0].map((h) => (h || "").toString().trim());
    const rows = jsonData.slice(1).map((r) => r.map((c) => (c || "").toString().trim()));
    return this.parseTableData({ headers, rows });
  }

  private static extractTableFromText(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(/\s{2,}|\t/).map((s) => s.trim());
    const rows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      rows.push(lines[i].split(/\s{2,}|\t/).map((s) => s.trim()));
    }
    return { headers, rows };
  }

  private static fixReference(ref: string): string {
    if (!ref) return "";
    return ref.replace(/\s+/g, "").replace(/[-\\/]{2,}/g, "-");
  }

  private static parseTableData(tableData: { headers: string[]; rows: string[][] }): ParsedTable {
    const { headers, rows } = tableData;
    const normalizedHeaders = headers.map((h) => (h || "").toLowerCase().trim());

    const bookDateIndex = this.findColumnIndex(normalizedHeaders, ["book date", "date"]);
    const valueDateIndex = this.findColumnIndex(normalizedHeaders, ["value date"]);
    const referenceIndex = this.findColumnIndex(normalizedHeaders, ["reference", "ref"]);
    const descriptionIndex = this.findColumnIndex(normalizedHeaders, ["description", "details", "narration"]);
    const debitIndex = this.findColumnIndex(normalizedHeaders, ["debit", "dr", "withdrawal"]);
    const creditIndex = this.findColumnIndex(normalizedHeaders, ["credit", "cr", "deposit"]);
    const balanceIndex = this.findColumnIndex(normalizedHeaders, ["balance"]);

    const transactions: ParsedTransaction[] = [];

    for (const row of rows) {
      const get = (idx: number) => (idx >= 0 && idx < row.length ? (row[idx] || "").trim() : "");

      const bookDateRaw = get(bookDateIndex);
      const bookDate = this.parseDateFlexible(bookDateRaw);
      const valueDateRaw = valueDateIndex !== -1 ? get(valueDateIndex) : "";
      const valueDate = valueDateRaw ? this.parseDateFlexible(valueDateRaw) : undefined;
      const referenceRaw = get(referenceIndex);
      const reference = this.fixReference(referenceRaw);
      const description = get(descriptionIndex);
      const debit = this.parseAmount(get(debitIndex));
      const credit = this.parseAmount(get(creditIndex));
      const closingBalance = balanceIndex !== -1 ? this.parseAmount(get(balanceIndex)) : undefined;

      let finalDebit = debit;
      let finalCredit = credit;
      if (finalDebit === 0 && finalCredit === 0) {
        const joined = row.join(" ");
        if (/debit/i.test(joined)) finalDebit = this.parseAmount(joined);
        if (/credit/i.test(joined)) finalCredit = this.parseAmount(joined);
      }

      transactions.push({
        bookDate,
        valueDate,
        reference,
        description,
        debit: finalDebit,
        credit: finalCredit,
        closingBalance,
      });
    }

    return { headers, rows, transactions };
  }

  private static findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const idx = headers.findIndex((h) => h.includes(name.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  private static parseDateFlexible(s: string): string {
    if (!s) return "";
    const raw = s.trim().replace(/\s+/g, " ");
    const ymd = raw.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
    if (ymd) {
      const [, y, m, d] = ymd;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    const dmy = raw.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    const long = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{2,4})$/);
    if (long) {
      const [, d, monthName, yRaw] = long;
      const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
      const m = this.monthNameToNumber(monthName);
      return `${y}-${m}-${d.padStart(2, "0")}`;
    }
    return raw;
  }

  private static monthNameToNumber(name: string): string {
    const map: { [k: string]: string } = {
      jan: "01", january: "01",
      feb: "02", february: "02",
      mar: "03", march: "03",
      apr: "04", april: "04",
      may: "05",
      jun: "06", june: "06",
      jul: "07", july: "07",
      aug: "08", august: "08",
      sep: "09", sept: "09", september: "09",
      oct: "10", october: "10",
      nov: "11", november: "11",
      dec: "12", december: "12"
    };
    const low = (name || "").toLowerCase();
    for (const k of Object.keys(map)) if (low.startsWith(k)) return map[k];
    return "01";
  }

  private static parseAmount(s: string): number {
    if (!s) return 0;
    let tmp = s.replace(/(etb|birr|usd|\$)/gi, "");
    tmp = tmp.replace(/[^\d.,-]/g, "").trim();
    if (!tmp) return 0;
    if (tmp.includes(",") && tmp.includes(".")) {
      tmp = tmp.replace(/,/g, "");
    } else if (tmp.includes(",")) {
      const parts = tmp.split(",");
      if (parts.length > 1 && parts[parts.length - 1].length === 2) {
        tmp = parts.join(".");
      } else {
        tmp = tmp.replace(/,/g, "");
      }
    }
    const num = parseFloat(tmp);
    if (isNaN(num)) return 0;
    return Math.round(num * 100) / 100;
  }

  /**
   * Validates parsed transactions
   * @param transactions Array of parsed transactions to validate
   * @returns Validation result with valid flag and error messages
   */
  static validateTransactions(transactions: ParsedTransaction[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!transactions || transactions.length === 0) {
      errors.push("No transactions found in the file");
      return { valid: false, errors };
    }

    transactions.forEach((transaction, index) => {
      // Validate bookDate
      if (!transaction.bookDate || transaction.bookDate.trim() === "") {
        errors.push(`Transaction ${index + 1}: Missing book date`);
      } else {
        // Validate date format (should be YYYY-MM-DD or similar valid format)
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (!dateRegex.test(transaction.bookDate)) {
          errors.push(`Transaction ${index + 1}: Invalid book date format (${transaction.bookDate})`);
        }
      }

      // Validate reference
      if (!transaction.reference || transaction.reference.trim() === "") {
        errors.push(`Transaction ${index + 1}: Missing reference`);
      }

      // Validate description
      if (!transaction.description || transaction.description.trim() === "") {
        errors.push(`Transaction ${index + 1}: Missing description`);
      }

      // Validate that at least one of debit or credit is non-zero
      if (transaction.debit === 0 && transaction.credit === 0) {
        errors.push(`Transaction ${index + 1}: Both debit and credit are zero`);
      }

      // Validate numeric values are not negative (unless that's expected)
      if (transaction.debit < 0) {
        errors.push(`Transaction ${index + 1}: Debit amount is negative (${transaction.debit})`);
      }
      if (transaction.credit < 0) {
        errors.push(`Transaction ${index + 1}: Credit amount is negative (${transaction.credit})`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
