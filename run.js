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

// Ensure data directory exists
const dataDir = "./public/data/satellite25544";
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

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

// Handle satellite data requests
app.get('/data/satellite25544/index.json', async (req, res) => {
  const indexPath = './public/data/satellite25544/index.json';
  
  try {
    // Check if the file exists and is not empty
    if (!fs.existsSync(indexPath) || fs.statSync(indexPath).size === 0) {
      // Generate the data
      await satellite.getTable({
        target: 25544,
        pages: 4,
        root: "./public/data/"
      });
    }
    
    // Read and send the file
    if (fs.existsSync(indexPath)) {
      const data = fs.readFileSync(indexPath);
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    } else {
      res.status(500).send('Failed to generate satellite data');
    }
  } catch (error) {
    console.error('Error handling satellite data request:', error);
    res.status(500).send('Internal server error');
  }
});

// Start the web server
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
