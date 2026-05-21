import creatorTermsMarkdown from "./creatorTerms.md?raw";

export interface CreatorTermsSection {
  title: string;
  items: string[];
}

export interface CreatorTermsContent {
  title: string;
  brand: string;
  tagline: string;
  intro: string;
  sections: CreatorTermsSection[];
  closingNote: string;
  welcomeMessage: string;
}

function parseCreatorTerms(markdown: string): CreatorTermsContent {
  const normalizedLines = markdown
    .replace(/\r\n/g, "\n")
    .replace(/\. +(?=\d+\.\s+[A-Z])/g, ".\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const isBrandFirstDocument = normalizedLines[0]?.toUpperCase() === "AIVESTIRE";
  const title = isBrandFirstDocument
    ? normalizedLines[2] ?? "Creator / Partner Terms & Conditions"
    : normalizedLines[0] ?? "Creator / Partner Terms & Conditions";
  const brand = isBrandFirstDocument
    ? normalizedLines[0] ?? "AIVESTIRE"
    : normalizedLines[1] ?? "AIVESTIRE";
  const tagline = isBrandFirstDocument
    ? normalizedLines[1] ?? "Where Designers Drop & AI Styles You"
    : "";
  const intro = isBrandFirstDocument
    ? normalizedLines[3] ?? ""
    : normalizedLines[2] ?? "";
  const bodyLines = normalizedLines.slice(isBrandFirstDocument ? 4 : 3);
  const sections: CreatorTermsSection[] = [];
  const closingLines: string[] = [];
  let currentSection: CreatorTermsSection | null = null;

  for (const line of bodyLines) {
    if (/^\d+\.\s+/.test(line)) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        title: line.replace(/^\d+\.\s+/, "").trim(),
        items: [],
      };
      continue;
    }

    if (/^By proceeding\b/i.test(line) || /^Welcome to\b/i.test(line)) {
      closingLines.push(line);
      continue;
    }

    if (currentSection) {
      currentSection.items.push(line);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    title,
    brand,
    tagline,
    intro,
    sections,
    closingNote: closingLines[0] ?? "By proceeding with onboarding, you agree to all the above terms and conditions.",
    welcomeMessage: closingLines[1] ?? "Welcome to our AIVESTIRE family.",
  };
}

export const creatorTermsContent = parseCreatorTerms(creatorTermsMarkdown);

export const creatorTermsPagePath = "/creator-partner-terms";

export const creatorTermsConfidentialityLabel =
  "Confidential - AIVESTIRE Platform";

export const creatorTermsCommissionRows = [
  {
    orderValue: "\u20B90 - \u20B91,000",
    platformCommission: "\u20B9150",
  },
  {
    orderValue: "\u20B91,001 - \u20B92,000",
    platformCommission: "\u20B9250",
  },
  {
    orderValue: "\u20B92,001 - \u20B95,000",
    platformCommission: "\u20B9400",
  },
  {
    orderValue: "\u20B95,001 and above",
    platformCommission: "Custom (agreed upon onboarding)",
  },
];

export const creatorTermsAcknowledgements = [
  "My designs are original, approved, and uploaded with clear true-colour images.",
  "I will produce made-to-order pieces on time and respond within 24 hours.",
  "I accept the commission, payout cycle, shipping, return, and refund rules.",
  "I am responsible for quality, sizing, defects, corrections, and platform standards.",
];
