import fs from "node:fs";
import path from "node:path";

export interface PricingPlan {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  features: string[];
  cta: string;
  note: string;
}

export function readPricingPlans(): PricingPlan[] {
  const file = path.join(process.cwd(), "content", "pricing_content.md");
  const raw = fs.readFileSync(file, "utf8");

  return raw
    .split(/\n---\s*\n/)
    .map((section) => {
      const title = section.match(/^##\s+(.+)$/m)?.[1]?.trim();
      if (!title) return null;

      const bold = [...section.matchAll(/^\*\*(.+)\*\*$/gm)].map((match) =>
        match[1].trim(),
      );
      const features = section
        .split("\n")
        .filter((line) => line.startsWith("- "))
        .map((line) => line.slice(2).trim());
      const cta = section.match(/^\[(.+)\]$/m)?.[1]?.trim() ?? "";
      const note = section.match(/^\*([^*\n].*)\*$/m)?.[1]?.trim() ?? "";

      return {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        title,
        subtitle: bold[0] ?? "",
        price: bold[1] ?? "",
        features,
        cta,
        note,
      };
    })
    .filter((plan): plan is PricingPlan => Boolean(plan));
}
