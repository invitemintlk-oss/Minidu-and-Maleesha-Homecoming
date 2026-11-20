/**
 * Google Apps Script Web App — RSVP + Wishes
 * Minidu & Maleesha · Homecoming · 29 December 2026 · Hotel Randika, Udubaddawa
 *
 * Spreadsheet:
 * https://docs.google.com/spreadsheets/d/1G-Eo3ADFbubeCdgkmaK1xERV7aIQKiSt6azTLjq5ZYg/edit
 *
 * The "RSVP" and "Wishes" sheets (with styled header rows) are created
 * automatically on the first request, or by running setup() once.
 *
 * DEPLOY
 *  1. Open the spreadsheet → Extensions → Apps Script.
 *  2. Replace everything in Code.gs with this file and save.
 *  3. Select the setup function → Run → allow the permissions.
 *  4. Deploy → New deployment → type "Web app"
 *       Execute as: Me
 *       Who has access: Anyone
 *  5. Copy the Web app URL (ends in /exec) into GOOGLE_SCRIPT_URL in
 *     src/config.ts, or set VITE_GOOGLE_SCRIPT_URL in Vercel.
 *  After editing this script, use Deploy → Manage deployments → Edit →
 *  Version: New version, so the same /exec URL serves the new code.
 */

const SPREADSHEET_ID = "1G-Eo3ADFbubeCdgkmaK1xERV7aIQKiSt6azTLjq5ZYg";
const TIMEZONE = "Asia/Colombo";

const SHEETS = {
  rsvp: {
    name: "RSVP",
    headers: ["Timestamp", "Name", "Attendance", "Invited As (link)"],
    widths: [170, 220, 120, 220],
  },
  wish: {
    name: "Wishes",
    headers: ["Timestamp", "Name", "Message", "Invited As (link)"],
    widths: [170, 220, 480, 220],
  },
};

const MAX_LEN = { name: 120, message: 2000, invitedAs: 120 };

/* ───────────────────────── Entry points ───────────────────────── */

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (!params.action) {
    return jsonResponse_({ ok: true, message: "RSVP & Wishes endpoint is running" });
  }
  return handleRequest_(e);
}

/** Run once from the editor to create both sheets and grant permissions. */
function setup() {
  getSheet_(SHEETS.rsvp);
  getSheet_(SHEETS.wish);
  Logger.log("Sheets ready: " + SHEETS.rsvp.name + ", " + SHEETS.wish.name);
}

/* ───────────────────────── Request handling ───────────────────────── */

function handleRequest_(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const params = parseParams_(e);
    const action = String(params.action || "").trim().toLowerCase();

    if (action === "rsvp") return jsonResponse_(saveRsvp_(params));
    if (action === "wish" || action === "wishes") return jsonResponse_(saveWish_(params));

    return jsonResponse_({ ok: false, message: action ? "Invalid action" : "Missing action" });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error && error.message ? error.message : "Unexpected error",
    });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function saveRsvp_(params) {
  const name = clean_(params.name, MAX_LEN.name);
  if (!name) return { ok: false, message: "Name is required" };

  // The website sends guests = "1" for attending, "0" for declining.
  const guests = String(params.guests || "").trim();
  const attendance = guests === "0" ? "No" : "Yes";
  const invitedAs = clean_(params.invitedAs, MAX_LEN.invitedAs);

  const sheet = getSheet_(SHEETS.rsvp);
  sheet.appendRow([timestamp_(), safeCell_(name), attendance, safeCell_(invitedAs)]);

  return { ok: true, message: "RSVP saved" };
}

function saveWish_(params) {
  const name = clean_(params.name, MAX_LEN.name);
  const message = clean_(params.message, MAX_LEN.message, true);
  if (!name || !message) return { ok: false, message: "Name and message are required" };

  const invitedAs = clean_(params.invitedAs, MAX_LEN.invitedAs);

  const sheet = getSheet_(SHEETS.wish);
  sheet.appendRow([timestamp_(), safeCell_(name), safeCell_(message), safeCell_(invitedAs)]);

  return { ok: true, message: "Wish saved" };
}

/* ───────────────────────── Sheet helpers ───────────────────────── */

/** Returns the sheet, creating it and its header row if missing. */
function getSheet_(config) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(config.name);
  if (!sheet) sheet = spreadsheet.insertSheet(config.name);
  ensureHeader_(sheet, config);
  return sheet;
}

function ensureHeader_(sheet, config) {
  const headers = config.headers;
  const range = sheet.getRange(1, 1, 1, headers.length);
  const current = range.getValues()[0];
  const matches = headers.every(function (h, i) { return current[i] === h; });
  if (matches) return;

  if (sheet.getLastRow() > 0 && current.some(function (v) { return v !== ""; })) {
    // Existing data without our header: insert the header above it.
    sheet.insertRowBefore(1);
  }

  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight("bold")
    .setFontColor("#ffffff")
    .setBackground("#8B0000")
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  config.widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
  sheet.getRange("A:A").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  if (config.name === SHEETS.wish.name) sheet.getRange("C:C").setWrap(true);
}

function timestamp_() {
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}

function clean_(value, maxLen, multiline) {
  let s = String(value == null ? "" : value);
  s = multiline ? s.replace(/\r\n/g, "\n").trim() : s.replace(/\s+/g, " ").trim();
  return s.slice(0, maxLen);
}

/** Prevents spreadsheet formula injection (values starting with = + - @). */
function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

/* ───────────────────────── Parsing / response ───────────────────────── */

function parseParams_(e) {
  const params = Object.assign({}, (e && e.parameter) || {});
  const contents = e && e.postData && e.postData.contents ? String(e.postData.contents).trim() : "";
  if (!contents) return params;

  if (contents.charAt(0) === "{") {
    try {
      return Object.assign(params, JSON.parse(contents));
    } catch (ignored) {
      return params;
    }
  }
  return Object.assign(params, parseFormEncoded_(contents));
}

function parseFormEncoded_(raw) {
  const result = {};
  String(raw || "").split("&").forEach(function (pair) {
    if (!pair) return;
    const parts = pair.split("=");
    const key = decodeURIComponent((parts[0] || "").replace(/\+/g, " "));
    const value = decodeURIComponent((parts.slice(1).join("=") || "").replace(/\+/g, " "));
    if (key) result[key] = value;
  });
  return result;
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
