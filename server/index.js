"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const port = 3000;
const app = (0, express_1.default)();
const client = new mongodb_1.MongoClient(process.env.MONGODB_URI);
app.use((0, cors_1.default)());
function scrapeData() {
    return __awaiter(this, void 0, void 0, function* () {
        let driver = yield new selenium_webdriver_1.Builder().forBrowser("chrome").build();
        yield driver.manage().setTimeouts({ implicit: 5000 });
        yield driver.manage().window().setRect({ width: 1600, height: 1032 });
        yield driver.get("https://www.whatsmyip.org/");
        const ipv4Div = yield driver.findElement(selenium_webdriver_1.By.id("hostname"));
        const ipv4Address = yield ipv4Div.getText();
        yield driver.get("https://x.com");
        try {
            const tryAgainButton = yield driver.findElement(selenium_webdriver_1.By.xpath("//*[contains(text(), 'Try again')]"));
            if (tryAgainButton)
                yield tryAgainButton.click();
        }
        catch (error) { }
        let refreshButton = undefined;
        while (refreshButton !== null) {
            try {
                const refreshButton = yield driver.findElement(selenium_webdriver_1.By.xpath("//*[contains(text(), 'Refresh')]"));
                if (refreshButton)
                    yield refreshButton.click();
            }
            catch (error) {
                refreshButton = null;
            }
        }
        yield driver.findElement(selenium_webdriver_1.By.css('[data-testid="loginButton"]')).click();
        yield driver.findElements(selenium_webdriver_1.By.css("label div"))
            .then((elements) => { var _a; return (_a = elements[3]) === null || _a === void 0 ? void 0 : _a.click(); });
        try {
            const emailVerificationInput = yield driver.findElement(selenium_webdriver_1.By.css(`input[data-testid="ocfEnterTextTextInput"]`));
            emailVerificationInput.sendKeys(process.env.TWITTER_EMAIL);
            yield driver.findElement(selenium_webdriver_1.By.xpath("//*[contains(text(), 'Next')]")).click();
        }
        catch (error) { }
        yield driver.findElement(selenium_webdriver_1.By.css('input[autocomplete="username"]'))
            .sendKeys(process.env.TWITTER_USERNAME);
        yield driver.findElement(selenium_webdriver_1.By.xpath("//*[contains(text(), 'Next')]")).click();
        yield driver.findElement(selenium_webdriver_1.By.css('input[autocomplete="current-password"]'))
            .sendKeys(process.env.TWITTER_PASSWORD);
        yield driver.findElement(selenium_webdriver_1.By.css('[data-testid="LoginForm_Login_Button"]')).click();
        const trendingDiv = yield driver.findElement(selenium_webdriver_1.By.css('div[aria-label="Timeline: Trending now"]'));
        const trendingText = (yield trendingDiv.getText()).split("\n").slice(1, -1);
        yield driver.close();
        const trendingTopics = [];
        for (let i = 0; i < trendingText.length; i += 3) {
            if (trendingText[i + 1]) {
                trendingTopics.push(trendingText[i + 1]);
            }
        }
        const currentTime = new Date();
        return { ipv4Address, trendingTopics, currentTime };
    });
}
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const scrapedData = yield scrapeData();
    const id = (yield client.db("main").collection("twitter").insertOne(scrapedData)).insertedId;
    const obj = yield client.db("main").collection("twitter").findOne({ _id: id });
    res.send(Object.assign(Object.assign({}, scrapedData), { mongoObj: JSON.stringify(obj) }));
}));
app.listen(port, () => {
    console.log(`Twitter scraper listening on port ${port}`);
});
