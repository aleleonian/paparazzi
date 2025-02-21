import { XBot } from "xbot-js";

const DESIRED_USERNAME = process.argv[2];
let xbot;

if (!DESIRED_USERNAME) {
  console.log("We need a X username, buddy!");
  process.exit(-1);
}

const DESIRED_URL = `https://x.com/${DESIRED_USERNAME}`;

main();

async function main() {
  xbot = new XBot();
  let savedLastTweetUrlPath;

  let initResponse = await xbot.init();
  if (!initResponse.success) {
    return exitApp(initResponse.errorMessage, -1);
  }

  const loginResponse = await xbot.loginToX(
    "overHelloBot",
    "Latigazo2023!",
    "overhello@latigo.com.ar"
  );

  if (!loginResponse.success) {
    return exitApp(loginResponse.errorMessage, -1);
  }

  await xbot.goto(DESIRED_URL);
  await xbot.wait(5000);

  let tweets = await xbot.selectMultipleElements(
    "cellInnerDiv",
    process.env.TWEET_SELECTOR,
    10000
  );

  console.log("tweets->", JSON.stringify(tweets));

  if (!tweets?.length) {
    if (await xbot.findTextInPage("This account doesn’t exist")) {
      return exitApp("Friend, that username does not exist", -1);
    } else return exitApp("Are you sure that username is correct?", -1);
  }
  const lastTweet = await tweets[0].evaluate((div) => div.outerHTML);

  const username = xbot.getTweetAuthor(lastTweet);

  if (username !== DESIRED_USERNAME) {
    return exitApp("Are you sure that username is correct?", -1);
  } else {
    console.log("username->", username);
  }

  savedLastTweetUrlPath = xbot.getTweetUrlPath(lastTweet);

  while (true) {
    console.log("gonna reload...");
    await xbot.reloadPage();
    tweets = await xbot.selectMultipleElements(
      "cellInnerDiv",
      process.env.TWEET_SELECTOR,
      5000
    );
    const lastTweet = await tweets[0].evaluate((div) => div.outerHTML);
    const lastTweetUrlPath = xbot.getTweetUrlPath(lastTweet);
    console.log("savedLastTweetUrlPath->", savedLastTweetUrlPath);
    console.log("lastTweetUrlPath->", lastTweetUrlPath);
    if (savedLastTweetUrlPath === lastTweetUrlPath) {
      console.log("Tweet's the same, will keep you posted.");
    } else {
      console.log("Tweet's different, gotta take the picture!");
      const tweetId = xbot.getTweetId(lastTweet);
      console.log("tweetId->", tweetId);
      savedLastTweetUrlPath = lastTweetUrlPath;
      if (tweetId) {
        const snapshotResponse = await xbot.takeSnapshotOfTweet(tweetId);
        console.log("snapshotResponse->", snapshotResponse);
      }
    }
  }

  return exitApp();
}

async function exitApp(message, exitCode = 0) {
  try {
    if (xbot) {
      await xbot.closeBrowser();
    }
  } catch (error) {
    console.error("🔴 Error closing browser:", error);
  }

  if (message) console.log("Message:", message);

  return process.exit(Number.isInteger(exitCode) ? exitCode : 1);
}
