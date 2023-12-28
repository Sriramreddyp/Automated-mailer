//**This template was directly referenced from gmail API documents to implement authentication process */
const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

//**For now, API is provided with super scope of all CRUD access, can be changed later */
const SCOPES = ["https://mail.google.com/"];

//**Path for token.json -- will be used to check the authenticity of the api */
const TOKEN_PATH = path.join(process.cwd(), "./token.json");

//**Path for credentials.json -- will be used to authenticate the api */
const CREDENTIALS_PATH = path.join(process.cwd(), "./credentials.json");

//**function to load access token if present in token.json */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

//**function to authenicate and save access token after authentication */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

//** Function to authorize API calls made */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

module.exports = authorize;
