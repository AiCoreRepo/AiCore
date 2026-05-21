import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  creatorTermsCommissionRows,
  creatorTermsConfidentialityLabel,
  creatorTermsContent,
} from "@/content/creatorTerms";

const makeSectionId = (index: number, title: string) =>
  `creator-term-${index + 1}-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;

const renderCommissionTable = () => (
  <div className="overflow-hidden rounded-lg border border-stone-300">
    <table className="w-full border-collapse text-left text-sm">
      <thead className="bg-stone-100 text-stone-900">
        <tr>
          <th className="border-b border-stone-300 px-4 py-3 font-semibold">
            Order Value
          </th>
          <th className="border-b border-stone-300 px-4 py-3 font-semibold">
            Platform Commission
          </th>
        </tr>
      </thead>
      <tbody>
        {creatorTermsCommissionRows.map((row) => (
          <tr key={row.orderValue} className="bg-white">
            <td className="border-b border-stone-200 px-4 py-3 text-stone-700">
              {row.orderValue}
            </td>
            <td className="border-b border-stone-200 px-4 py-3 text-stone-700">
              {row.platformCommission}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const renderTermItem = (sectionTitle: string, item: string, itemIndex: number) => {
  const key = `${sectionTitle}-${itemIndex}`;

  if (item === "Commission Structure") {
    return (
      <div key={key} className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-950">{item}</h3>
        {renderCommissionTable()}
      </div>
    );
  }

  if (item.startsWith("Final Payout =")) {
    return (
      <div
        key={key}
        className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 font-mono text-sm text-stone-900"
      >
        {item}
      </div>
    );
  }

  if (item.startsWith("How your pricing works:")) {
    const body = item.replace("How your pricing works:", "").trim();

    return (
      <div
        key={key}
        className="rounded-lg border border-stone-300 bg-stone-50 px-4 py-4 text-sm leading-7 text-stone-700"
      >
        <span className="font-semibold text-stone-950">How your pricing works: </span>
        {body}
      </div>
    );
  }

  if (item.endsWith(":") || item === "Shipping Cost Responsibility") {
    return (
      <h3 key={key} className="pt-2 text-sm font-semibold text-stone-950">
        {item}
      </h3>
    );
  }

  return (
    <div key={key} className="flex gap-3 text-sm leading-7 text-stone-700">
      <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-stone-900" />
      <p>{item}</p>
    </div>
  );
};

const CreatorPartnerTerms = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/creator-onboarding");
  };

  return (
    <main className="min-h-screen bg-[#ece7dd] px-4 py-6 text-stone-900 md:px-6 md:py-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-lg border border-stone-300 bg-white p-5 shadow-sm">
            <button
              type="button"
              onClick={handleBack}
              className="mb-5 inline-flex h-10 items-center gap-2 rounded-lg border border-stone-300 px-3 text-sm font-medium text-stone-800 transition hover:bg-stone-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <p className="text-xs font-semibold text-stone-500">
              Document Sections
            </p>
            <nav className="mt-4 max-h-[calc(100vh-180px)] space-y-1 overflow-y-auto pr-1">
              {creatorTermsContent.sections.map((section, index) => (
                <a
                  key={section.title}
                  href={`#${makeSectionId(index, section.title)}`}
                  className="block rounded-md px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
                >
                  {index + 1}. {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="rounded-lg border border-stone-300 bg-[#fffdf8] shadow-xl">
          <header className="border-b border-stone-300 px-6 py-8 md:px-12 md:py-12">
            <button
              type="button"
              onClick={handleBack}
              className="mb-8 inline-flex h-10 items-center gap-2 rounded-lg border border-stone-300 px-3 text-sm font-medium text-stone-800 transition hover:bg-stone-100 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="mb-7 flex flex-wrap items-center gap-3 text-sm text-stone-600">
              <span className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-[#9c7623]" />
                {creatorTermsConfidentialityLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2">
                <FileText className="h-4 w-4 text-[#9c7623]" />
                Creator onboarding document
              </span>
            </div>

            <p className="text-base font-semibold text-[#8b681f]">
              {creatorTermsContent.brand}
            </p>
            <p className="mt-2 text-sm text-stone-600">
              {creatorTermsContent.tagline}
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-tight text-stone-950 md:text-5xl">
              {creatorTermsContent.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-stone-700">
              {creatorTermsContent.intro}
            </p>
          </header>

          <div className="px-6 py-8 md:px-12 md:py-12">
            <div className="space-y-10">
              {creatorTermsContent.sections.map((section, index) => (
                <section
                  key={section.title}
                  id={makeSectionId(index, section.title)}
                  className="scroll-mt-8 border-b border-stone-200 pb-9 last:border-b-0 last:pb-0"
                >
                  <div className="mb-5 flex items-start gap-4">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-stone-300 bg-white text-sm font-semibold text-stone-900">
                      {index + 1}
                    </span>
                    <h2 className="font-serif text-2xl leading-tight text-stone-950">
                      {section.title}
                    </h2>
                  </div>

                  <div role="list" className="space-y-3 pl-0 md:pl-[52px]">
                    {section.items.map((item, itemIndex) =>
                      renderTermItem(section.title, item, itemIndex),
                    )}
                  </div>
                </section>
              ))}
            </div>

            <footer className="mt-12 rounded-lg border border-stone-300 bg-white px-5 py-5 text-sm leading-7 text-stone-700">
              <p className="font-semibold text-stone-950">
                {creatorTermsContent.closingNote}
              </p>
              <p className="mt-2">{creatorTermsContent.welcomeMessage}</p>
              <p className="mt-5 text-xs text-stone-500">
                {creatorTermsConfidentialityLabel}
              </p>
            </footer>
          </div>
        </article>
      </div>
    </main>
  );
};

export default CreatorPartnerTerms;
