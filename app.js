import { XBot } from "xbot-js";

const DESIRED_USERNAME = process.argv[2];
let bot;

if (!DESIRED_USERNAME) {
  console.log("We need a X username, buddy!");
  process.exit(-1);
}

const DESIRED_URL = `https://x.com/${DESIRED_USERNAME}`;

main();

async function main() {
  bot = new XBot();
  const response = await bot.init();
  if (!response.success) {
    return exitApp(response.errorMessage, -1);
  }
  await bot.goto(DESIRED_URL);
  await bot.wait(5000);

  const tweets = await bot.selectMultipleElements(
    "cellInnerDiv",
    process.env.TWEET_SELECTOR,
    10000
  );

  console.log("tweets->", JSON.stringify(tweets));

  if (!tweets?.length) {
    if (await bot.findTextInPage("This account doesn’t exist")) {
      return exitApp("Friend, that username does not exist", -1);
    } else return exitApp("Are you sure that username is correct?", -1);
  }
  const firstTweet = await tweets[0].evaluate((div) => div.outerHTML);

  const username = bot.getTweetAuthor(firstTweet);

  if (username !== DESIRED_USERNAME) {
    return exitApp("Are you sure that username is correct?", -1);
  } else {
    console.log("username->", username);
  }

  return exitApp();
}

async function exitApp(message, exitCode = 0) {
  try {
    if (bot) {
      await bot.closeBrowser();
    }
  } catch (error) {
    console.error("🔴 Error closing browser:", error);
  }

  if (message) console.log("Message:", message);

  return process.exit(Number.isInteger(exitCode) ? exitCode : 1);
}
