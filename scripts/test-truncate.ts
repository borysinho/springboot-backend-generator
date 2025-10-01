import { truncateText } from "../src/utils/textUtils.js";

console.log("Testing truncateText function:");
console.log("Short text:", truncateText("association", 15));
console.log(
  "Long text:",
  truncateText(
    "Esta es una descripción muy larga de una relación de asociación entre clases",
    15
  )
);
console.log("Exact length:", truncateText("123456789012345", 15));
console.log("Over limit:", truncateText("1234567890123456", 15));
