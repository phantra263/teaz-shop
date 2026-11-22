import { ChevronRight } from "lucide-react";
import { aboutParagraphs, faqs } from "../data/site";

export function AboutSection() {
  return (
    <section
      id="ve-teaz"
      aria-labelledby="ve-teaz-heading"
      className="mt-8 lg:mt-10 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6"
    >
      <div className="rounded-3xl border border-tea-100 bg-white/85 p-4 shadow-sm lg:p-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-5 w-2 rounded-full bg-tea-600" aria-hidden="true" />
          <h2
            id="ve-teaz-heading"
            className="font-display text-base font-bold text-slate-900"
          >
            Về TeaZ Review
          </h2>
        </div>
        <div className="space-y-2 text-sm leading-relaxed text-slate-600 lg:text-[15px]">
          {aboutParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div id="cau-hoi" className="mt-4 lg:mt-0">
        <h2 className="font-display mb-2.5 text-base font-bold text-slate-900 lg:text-lg">
          Câu hỏi thường gặp
        </h2>
        <div className="space-y-2">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-3 open:border-tea-200 open:bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-sm font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90"
                  aria-hidden="true"
                />
              </summary>
              <p className="pt-2 text-xs leading-relaxed text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
