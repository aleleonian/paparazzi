import { XBot } from "xbot-js";

const bot = new XBot();
const response = await bot.init();
await bot.goto("https://www.latigo.com.ar");
await bot.closeBrowser();
