// ─────────────────────────────────────────────────────────────
//  Invitation details — single source of truth for the site
//  and the /admin link generator.
// ─────────────────────────────────────────────────────────────

export const INVITATION = {
  couple: {
    groom: "Minidu",
    bride: "Maleesha",
  },
  parents: {
    groom: "Mr. W.M.A. Fernando & Mrs. R.D.R. Milani",
    bride: "Mr. S.A. Weerasinghe & Mrs. K.R.B. Damayanthi",
  },
  date: {
    displayNumeric: "29 . 12 . 2026",
    displayLong: "Tuesday, 29th December 2026",
    time: "7:00 PM – 12:00 AM",
    countdownTarget: "2026-12-29T19:00:00+05:30",
  },
  venue: {
    name: "Hotel Randika",
    address: "Kuliyapitiya Rd, Udubaddawa",
    city: "Udubaddawa",
    mapQuery: "Hotel Randika, Kuliyapitiya Road, Udubaddawa, Sri Lanka",
    googleMapsLink:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("Hotel Randika, Kuliyapitiya Road, Udubaddawa, Sri Lanka"),
  },
  rsvpContacts: [{ label: "RSVP", phone: "077 707 3573", tel: "+94777073573" }],
} as const;

/**
 * Google Apps Script Web App URL (see code.gs).
 * Paste the deployed "/exec" URL here, or set VITE_GOOGLE_SCRIPT_URL.
 * Left empty, form submissions are simulated (nothing is saved).
 */
export const GOOGLE_SCRIPT_URL: string =
  import.meta.env.VITE_GOOGLE_SCRIPT_URL || "";

// ─────────────────────────────────────────────────────────────
//  Guest personalisation
// ─────────────────────────────────────────────────────────────

export const GUEST_PREFIXES = ["Mr.", "Mrs.", "Miss", "Mr. & Mrs.", "Family", "Dear"] as const;
export type GuestPrefix = (typeof GUEST_PREFIXES)[number];

const cleanName = (name: string) => name.trim().replace(/\s+/g, " ");

/**
 * Combines prefix + name into the name the guest is addressed by.
 * "Dear" is a greeting style, not a title, so it adds nothing here —
 * the greeting itself already starts with "Dear".
 */
export function formatDisplayName(prefix: GuestPrefix, guestName: string): string {
  const name = cleanName(guestName);
  if (!name) return "";
  switch (prefix) {
    case "Family":
      return `${name} and Family`;
    case "Dear":
      return name;
    default:
      return `${prefix} ${name}`;
  }
}

/** Builds `{baseURL}/{displayName}` with the name safely URL-encoded. */
export function buildGuestLink(baseUrl: string, displayName: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(displayName)}`;
}

export function buildGreeting(displayName: string): string {
  return `Dear ${displayName} ❤️`;
}

export function buildInvitationMessage(displayName: string, link: string): string {
  return `${buildGreeting(displayName)}

With joyful hearts, we warmly invite you to celebrate one of the most special days of our lives as we begin our journey together.

Please view our wedding invitation and all the event details through the link below 🌐:

${link}

Your presence would truly mean the world to us, and we would be honored to celebrate this beautiful moment together.

With love,
❤️ ${INVITATION.couple.groom} & ${INVITATION.couple.bride}`;
}

const RESERVED_PATHS = new Set(["admin", "index.html"]);

/**
 * Reads the guest's display name from the current URL.
 * Supports `/{displayName}` and the older `?prefix=..&name=..` form.
 */
export function getGuestDisplayNameFromLocation(loc: Location = window.location): string {
  const params = new URLSearchParams(loc.search);
  const legacyName = params.get("name");
  if (legacyName && cleanName(legacyName)) {
    const legacyPrefix = params.get("prefix") as GuestPrefix | null;
    return formatDisplayName(
      legacyPrefix && (GUEST_PREFIXES as readonly string[]).includes(legacyPrefix) ? legacyPrefix : "Dear",
      legacyName,
    );
  }

  const segment = loc.pathname.replace(/^\/+|\/+$/g, "").split("/")[0] ?? "";
  if (!segment || RESERVED_PATHS.has(segment.toLowerCase())) return "";
  try {
    return cleanName(decodeURIComponent(segment)).slice(0, 80);
  } catch {
    return "";
  }
}
