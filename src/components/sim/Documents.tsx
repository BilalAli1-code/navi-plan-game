import { useState } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { cn } from "@/lib/utils";

export function Documents() {
  const { state } = useSim();
  const [openId, setOpenId] = useState<string | null>(state.documents[0]?.id ?? null);
  const active = state.documents.find((d) => d.id === openId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(260px,320px)_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[13px] font-semibold text-foreground">
          <FileText className="h-4 w-4 text-accent" />
          Project documents
        </div>
        <ul>
          {state.documents.map((d) => (
            <li key={d.id}>
              <button
                onClick={() => setOpenId(d.id)}
                className={cn(
                  "block w-full border-b border-white/5 px-4 py-3 text-left transition",
                  openId === d.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                )}
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {d.kind}
                </div>
                <div className="mt-0.5 text-[13px] font-medium text-foreground">{d.title}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <motion.article
        key={active?.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        {active ? (
          <div
            className="prose prose-invert max-w-none text-[14px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: mdToHtml(active.markdown) }}
          />
        ) : (
          <div className="grid h-full min-h-[300px] place-items-center text-muted-foreground">
            Select a document
          </div>
        )}
      </motion.article>
    </div>
  );
}

// Extremely small markdown → HTML for headings, lists, bold, tables, blockquotes.
function mdToHtml(md: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = escape(md).split("\n");
  const out: string[] = [];
  let inTable = false;
  let inList = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/^\|.*\|$/.test(line.trim())) {
      if (!inTable) {
        out.push('<table class="w-full text-left border-collapse">');
        inTable = true;
      }
      // separator row
      if (/^\|[\s\-|]+\|$/.test(line.trim())) continue;
      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      const tag = out[out.length - 1]?.startsWith("<table") ? "th" : "td";
      out.push(`<tr>${cells.map((c) => `<${tag} class="border-b border-white/10 px-2 py-1">${c}</${tag}>`).join("")}</tr>`);
      continue;
    } else if (inTable) {
      out.push("</table>");
      inTable = false;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        out.push("<ul class=\"list-disc pl-5 space-y-1\">");
        inList = true;
      }
      line = line.replace(/^- /, "");
      out.push(`<li>${bold(line)}</li>`);
      continue;
    } else if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (line.startsWith("### ")) out.push(`<h3 class="text-[15px] font-semibold mt-4">${bold(line.slice(4))}</h3>`);
    else if (line.startsWith("## ")) out.push(`<h2 class="text-[17px] font-bold mt-5">${bold(line.slice(3))}</h2>`);
    else if (line.startsWith("# ")) out.push(`<h1 class="text-[22px] font-bold mb-2">${bold(line.slice(2))}</h1>`);
    else if (line.startsWith("> ")) out.push(`<blockquote class="border-l-2 border-accent pl-3 italic text-foreground/70">${bold(line.slice(2))}</blockquote>`);
    else if (line.trim() === "") out.push("");
    else out.push(`<p class="my-1">${bold(line)}</p>`);
  }
  if (inList) out.push("</ul>");
  if (inTable) out.push("</table>");
  return out.join("\n");
}

function bold(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
