const { google } = require("googleapis");
const authorize = require("./Authentication/Authentication.js");
const requests = require("./Requests/request.js");

// //** Authentication function which we use authorize the existing session */
async function authenticateClient() {
  try {
    const client = await authorize();
    return client;
  } catch (error) {
    return { error: error };
  }
}

//**Application which runs infinitely with an intreval of 50 seconds */
const app = () => {
  console.log("Started Execution.......");

  authenticateClient().then(async (value) => {
    let gmail = google.gmail({ version: "v1", auth: value });
    let emailIDs = await requests.seggregateMsgForMailIds(4, gmail);
    console.log(emailIDs);
    let status = await requests.sendingMail(emailIDs, gmail);
    console.log(status);
  });
};

authenticateClient().then(setInterval(app, 10000));
