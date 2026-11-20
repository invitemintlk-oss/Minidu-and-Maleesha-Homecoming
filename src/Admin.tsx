import React, { useEffect, useRef, useState } from "react";
import { Check, Link as LinkIcon, MessageSquare, Sparkles } from "lucide-react";
import {
  INVITATION,
  GUEST_PREFIXES,
  type GuestPrefix,
  formatDisplayName,
  buildGuestLink,
  buildGreeting,
  buildInvitationMessage,
} from "./config";

type Generated = {
  prefix: GuestPrefix;
  guestName: string;
  displayName: string;
  link: string;
  message: string;
};

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function Admin() {
  const [prefix, setPrefix] = useState<GuestPrefix>("Mr.");
  const [guestName, setGuestName] = useState("");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.title = `Invitation Link Generator · ${INVITATION.couple.groom} & ${INVITATION.couple.bride}`;
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  const isStale =
    generated !== null && (generated.prefix !== prefix || generated.guestName !== guestName.trim());

  const showToast = (text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2000);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = formatDisplayName(prefix, guestName);
    if (!displayName) {
      setError("Please enter a guest name.");
      setGenerated(null);
      return;
    }
    setError("");
    const link = buildGuestLink(window.location.origin, displayName);
    setGenerated({
      prefix,
      guestName: guestName.trim(),
      displayName,
      link,
      message: buildInvitationMessage(displayName, link),
    });
  };

  const handleCopy = async (kind: "link" | "message") => {
    if (!generated) return;
    const ok = await copyText(kind === "link" ? generated.link : generated.message);
    showToast(ok ? (kind === "link" ? "Link copied!" : "Message copied!") : "Copy failed — please copy manually");
  };

  const inputClass =
    "w-full p-4 rounded-xl border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37] bg-[#111111] text-[#E0E0E0] placeholder:text-[#E0E0E0]/40 font-medium transition-colors";
  const labelClass = "block text-xs font-bold text-[#D4AF37] uppercase tracking-[0.2em]";

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 md:p-12 font-montserrat text-[#E0E0E0]">
      <div className="max-w-3xl mx-auto bg-[#141414] p-6 md:p-12 rounded-3xl shadow-[0_0_40px_rgba(212,175,55,0.12)] border border-[#D4AF37]/25">
        <h1 className="text-4xl md:text-5xl text-center font-playball text-[#D4AF37] mb-2">
          {INVITATION.couple.groom} & {INVITATION.couple.bride}
        </h1>
        <h2 className="text-sm md:text-base text-center font-cinzel text-[#E0E0E0] mb-10 tracking-[0.3em] font-bold uppercase">
          Invitation Link Generator
        </h2>

        <form onSubmit={handleGenerate} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="prefix" className={labelClass}>Select Prefix</label>
              <select
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value as GuestPrefix)}
                className={inputClass}
              >
                {GUEST_PREFIXES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="guestName" className={labelClass}>Guest Name</label>
              <input
                id="guestName"
                type="text"
                placeholder="e.g. Sanjaya"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  if (error) setError("");
                }}
                className={inputClass}
                autoComplete="off"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400 -mt-4">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#D4AF37] text-[#0A0A0A] font-bold uppercase tracking-[0.2em] text-sm rounded-xl hover:bg-[#e2c25a] transition-all shadow-[0_10px_20px_rgba(212,175,55,0.2)]"
          >
            <Sparkles className="w-5 h-5" />
            Generate Link
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-[#D4AF37]/20 space-y-6">
          {generated ? (
            <>
              {isStale && (
                <p className="text-xs text-amber-300/90 bg-amber-300/10 border border-amber-300/30 rounded-lg px-4 py-2">
                  The form has changed since this link was generated. Click <strong>Generate Link</strong> to update it.
                </p>
              )}

              <div className="space-y-2">
                <h3 className={labelClass}>Greeting</h3>
                <p className="font-playball text-3xl text-[#D4AF37] break-words">{buildGreeting(generated.displayName)}</p>
              </div>

              <div className="space-y-2">
                <h3 className={labelClass}>Generated Link</h3>
                <a
                  href={generated.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-4 rounded-xl bg-[#111111] border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-sm break-all hover:border-[#D4AF37]"
                >
                  {generated.link}
                </a>
              </div>

              <div className="space-y-2">
                <h3 className={labelClass}>Message Preview</h3>
                <div className="bg-[#111111] p-5 md:p-6 rounded-2xl border border-[#D4AF37]/20 whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed">
                  {generated.message}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-[#E0E0E0]/50 italic text-sm">
              Choose a prefix, enter a guest name and click <strong>Generate Link</strong> to see the preview.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
            <button
              type="button"
              onClick={() => handleCopy("link")}
              disabled={!generated}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#D4AF37]"
            >
              <LinkIcon className="w-5 h-5" />
              Copy Link Only
            </button>
            <button
              type="button"
              onClick={() => handleCopy("message")}
              disabled={!generated}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-[#D4AF37] text-[#0A0A0A] font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#e2c25a] transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-5 h-5" />
              Copy Full Message
            </button>
          </div>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full bg-[#1A1A1A] border border-[#D4AF37]/50 text-[#D4AF37] text-sm font-semibold shadow-lg transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <Check className="w-4 h-4" />
        {toast}
      </div>
    </div>
  );
}
