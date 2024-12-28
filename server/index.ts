import { Builder, By, WebElement } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { Request, Response } from "express";
import express from "express";
import cors from "cors";

dotenv.config();

const port = 3000;
const app = express();
const client = new MongoClient(process.env.MONGODB_URI!);
app.use(cors());

async function scrapeData() {
  let driver = await new Builder()
    .forBrowser("chrome")
    .build();

  await driver.manage().setTimeouts({ implicit: 5000 });
  await driver.manage().window().setRect({ width: 1600, height: 1032 });

  await driver.get("https://www.whatsmyip.org/");
  const ipv4Div = await driver.findElement(By.id("hostname"));
  const ipv4Address = await ipv4Div.getText();

  await driver.get("https://x.com");
  try {
    const tryAgainButton = await driver.findElement(
      By.xpath("//*[contains(text(), 'Try again')]")
    );
    if (tryAgainButton) await tryAgainButton.click();
  } catch (error) {}

  let refreshButton: WebElement | null | undefined = undefined;
  while (refreshButton !== null) {
    try {
      const refreshButton = await driver.findElement(
        By.xpath("//*[contains(text(), 'Refresh')]")
      );
      if (refreshButton) await refreshButton.click();
    } catch (error) {
      refreshButton = null;
    }
  }

  await driver.findElement(By.css('[data-testid="loginButton"]')).click();
  await driver
    .findElements(By.css("label div"))
    .then((elements) => elements[3]?.click());

  try {
    const emailVerificationInput = await driver.findElement(
      By.css(`input[data-testid="ocfEnterTextTextInput"]`)
    );
    emailVerificationInput.sendKeys(process.env.TWITTER_EMAIL!);
    await driver.findElement(By.xpath("//*[contains(text(), 'Next')]")).click();
  } catch (error) {}

  await driver
    .findElement(By.css('input[autocomplete="username"]'))
    .sendKeys(process.env.TWITTER_USERNAME!);
  await driver.findElement(By.xpath("//*[contains(text(), 'Next')]")).click();

  await driver
    .findElement(By.css('input[autocomplete="current-password"]'))
    .sendKeys(process.env.TWITTER_PASSWORD!);
  await driver
    .findElement(By.css('[data-testid="LoginForm_Login_Button"]'))
    .click();

  const trendingDiv = await driver.findElement(
    By.css('div[aria-label="Timeline: Trending now"]')
  );
  const trendingText = (await trendingDiv.getText()).split("\n").slice(1, -1);
  await driver.close();

  const trendingTopics: string[] = [];
  for (let i = 0; i < trendingText.length; i += 3) {
    if (trendingText[i + 1]) {
      trendingTopics.push(trendingText[i + 1]);
    }
  }

  const atTime = new Date();
  return { ipv4Address, trendingTopics, atTime };
}

app.get("/", async (req: Request, res: Response) => {
  const scrapedData = await scrapeData();
  const id = (
    await client.db("main").collection("twitter").insertOne(scrapedData)
  ).insertedId;

  const obj = await client
    .db("main")
    .collection("twitter")
    .findOne({ _id: id });

  res.send({ ...scrapedData, mongoObj: JSON.stringify(obj) });
});

app.listen(port, () => {
  console.log(`Twitter scraper listening on port ${port}`);
});
