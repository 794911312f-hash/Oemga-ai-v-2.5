import { buildMediaPlan } from "./mediaOrchestrator";

const prompt = "فيديو متحرك لقلعة قديمة وسط عاصفة";
const plan = buildMediaPlan(prompt, { preferFree: true });

console.log("=== Media Plan generated successfully ===");
console.log("Domain:", plan.domain);
console.log("Primary Tools:", plan.primaryTools.map(t => t.name).join(", "));
console.log("Steps:", plan.pipelineSteps);
console.log("Rationale:", plan.rationale);
