/**
 * CSV exports (FR-M9-04). Excel only reads UTF-8 correctly with a BOM, and
 * Indonesian-locale Excel splits columns on `;` (the comma is its decimal
 * separator); Google Sheets detects either.
 */

export const CSV_BOM = "﻿";
export const CSV_SEPARATOR = ";";

export type CsvCell = string | number | null | undefined;

/** Spreadsheet apps run cells starting with these as formulas (CSV injection). */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value: CsvCell, separator = CSV_SEPARATOR): string {
  if (value === null || value === undefined) return "";
  // Numbers are written as-is (no thousand separators) so they stay numeric.
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";

  let text = value;
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  if (text.includes(separator) || /["\r\n]/.test(text)) {
    text = `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

/** Header plus rows, CRLF line endings, prefixed with a UTF-8 BOM. */
export function toCsv(headers: string[], rows: CsvCell[][], separator = CSV_SEPARATOR): string {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => csvCell(cell, separator)).join(separator),
  );
  return `${CSV_BOM}${lines.join("\r\n")}\r\n`;
}

/** A safe download file name, e.g. `PMB-UBS-2026-02-konten.csv`. */
export function csvFileName(code: string, suffix: string): string {
  const base = code.replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "kampanye";
  return `${base}-${suffix}.csv`;
}
