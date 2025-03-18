import mammoth from "mammoth"; // For .docx conversion
// import pdfParse from "pdf-parse"; // For PDFs
import axios from "axios"; // To fetch file from R2
import markdownIt from "markdown-it"; // For Markdown

// Convert file content to HTML
async function convertToHTML(r2Url, format) {
  try {
    console.log("Fetching file from R2:", r2Url);

    // 1. Download file from R2
    const response = await axios.get(r2Url, { responseType: "arraybuffer" });
    const fileBuffer = Buffer.from(response.data);

    // 2. Convert file content based on format
    switch (format.toLowerCase()) {
      case "txt":
        return `<pre>${fileBuffer.toString("utf-8")}</pre>`;

      case "md":
        const md = new markdownIt();
        return md.render(fileBuffer.toString("utf-8"));

      case "pdf":
        const { default: pdfParse } = await import("pdf-parse"); 
        const pdfData = await pdfParse(fileBuffer);
        return `<div>${pdfData.text.replace(/\n/g, "<br>")}</div>`;

      case "docx":
        const docxData = await mammoth.convertToHtml({ buffer: fileBuffer });
        return docxData.value;

      default:
        return null;
    }
  } catch (error) {
    console.error("Error converting file:", error);
    return null;
  }
}

export { convertToHTML };
