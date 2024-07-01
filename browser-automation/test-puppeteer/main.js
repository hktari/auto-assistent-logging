const puppeteer = require("puppeteer");

async function generatePDF() {
  const browser = await puppeteer.launch({headless: true, timeout:0});
  const page = await browser.newPage();
  await page.setContent("<h1>Hello World</h1>", { waitUntil: 'domcontentloaded' });
  console.log("Content set");
  const pdfBuffer = await page.pdf({ printBackground: true });
  console.log("PDF generated");
  await browser.close();
}

generatePDF().catch(console.error);