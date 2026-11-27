import { ChevronDown } from "lucide-react";
import { aboutParagraphs, faqs } from "../data/site";

export function AboutSection() {
  return (
    <section className="hub-section hub-about" id="ve-teaz" aria-labelledby="ve-teaz-heading">
      <div>
        <h2 className="hub-heading" id="ve-teaz-heading">Về Tea<span className="teaz-letter-z">Z</span></h2>
        {aboutParagraphs.map((paragraph) => (
          <p className="hub-description" key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div id="cau-hoi">
        <h2 className="hub-heading">Câu hỏi thường gặp</h2>
        <div className="hub-faq">
          {faqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
