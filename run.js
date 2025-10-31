// const satellite = require("./src/satellite");
// const iridium = require("./src/iridium");

// var location = [39.9042, 116.4074, "%E5%8C%97%E4%BA%AC%E5%B8%82", 52, "ChST"];
// //COOKIE需要先通过浏览器调到中文
// ///////////hello
// //const names = ["ISS", "IridiumFlares"];
// // https://www.heavens-above.com/PassSummary.aspx?satid=41765&lat=0&lng=0&loc=Unspecified&alt=0&tz=UCT

// satellite.getTable({
// 	target: 25544,
// 	pages: 4,
// 	root: "./public/data/"
// }); //ISS
// /*
// iridium.getTable({
// 	pages: 4,
// 	root: "./public/data/"
// });
// */

const express = require("express");
const fs = require("fs");
const satellite = require("./src/satellite");
const iridium = require("./src/iridium");


const app = express();
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;

// Ensure data directories exist
const satelliteDir = "./public/data/satellite25544";
const iridiumDir = "./public/data/IridiumFlares";

[satelliteDir, iridiumDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Optional: base location
const location = [39.9042, 116.4074, "%E5%8C%97%E4%BA%AC%E5%B8%82", 52, "ChST"];

// Root route just to verify app works
app.get("/", (req, res) => {
  res.send("🚀 Heavens Above Scraper running on Heroku successfully!");
});

// Route to trigger satellite scraping manually
app.get("/scrape-satellite", async (req, res) => {
  try {
    await satellite.getTable({
      target: 25544,
      pages: 4,
      root: "./public/data/"
    });
    res.send("✅ Satellite scraping completed successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Satellite scraping failed!");
  }
});

// (Optional) Route to trigger Iridium scraping
app.get("/scrape-iridium", async (req, res) => {
  try {
    await iridium.getTable({
      pages: 4,
      root: "./public/data/"
    });
    res.send("✅ Iridium scraping completed successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Iridium scraping failed!");
  }
});

// Function to generate and return data
async function generateData(type, res) {
  try {
    const baseDir = './public/data/';
    const indexPath = type === 'satellite' 
      ? `${baseDir}satellite25544/index.json`
      : `${baseDir}IridiumFlares/index.json`;

    // Create a promise to handle the data generation
    const dataPromise = new Promise((resolve, reject) => {
      if (type === 'satellite') {
        satellite.getTable({
          target: 25544,
          pages: 4,
          root: baseDir,
          callback: resolve
        });
      } else {
        iridium.getTable({
          pages: 4,
          root: baseDir,
          callback: resolve
        });
      }

      // Set a timeout to prevent hanging
      setTimeout(() => {
        reject(new Error('Data generation timeout'));
      }, 30000); // 30 second timeout
    });

    await dataPromise;

    // Check if file was generated
    if (fs.existsSync(indexPath)) {
      const data = fs.readFileSync(indexPath);
      if (data.length > 0) {
        res.setHeader('Content-Type', 'application/json');
        return res.send(data);
      }
    }
    throw new Error('Data generation failed');
  } catch (error) {
    console.error(`Error generating ${type} data:`, error);
    res.status(500).send(`Failed to generate ${type} data: ${error.message}`);
  }
}

// Handle satellite data requests
app.get('/data/satellite25544/index.json', async (req, res) => {
  await generateData('satellite', res);
});

// Handle Iridium flares data requests
app.get('/data/IridiumFlares/index.json', async (req, res) => {
  await generateData('iridium', res);
});

// Start the web server
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
