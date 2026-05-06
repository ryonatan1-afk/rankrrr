import "dotenv/config";
import { generateCategory } from "../lib/ai/generate-category";

const topic = process.argv[2] ?? "startups in israel";
console.log(`Generating: "${topic}"\n`);

generateCategory(topic).then(result => {
  console.log(`Name:  ${result.emoji} ${result.name}`);
  console.log(`Desc:  ${result.description}`);
  console.log(`Items (${result.items.length}):`);
  result.items.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.emoji} ${item.name}`);
  });
}).catch(console.error);
