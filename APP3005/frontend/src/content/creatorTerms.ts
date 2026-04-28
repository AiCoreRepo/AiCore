import creatorTermsMarkdown from "./creatorTerms.md?raw";

export interface CreatorTermsSection {
  title: string;
  items: string[];
}

export interface CreatorTermsContent {
  title: string;
  brand: string;
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

  const [title = "Creator / Partner Terms & Conditions", brand = "AIVESTIRE", intro = "", ...bodyLines] = normalizedLines;
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
    intro,
    sections,
    closingNote: closingLines[0] ?? "By proceeding with onboarding, you agree to all the above terms and conditions.",
    welcomeMessage: closingLines[1] ?? "Welcome to our AIVESTIRE family.",
  };
}

export const creatorTermsContent = parseCreatorTerms(creatorTermsMarkdown);
