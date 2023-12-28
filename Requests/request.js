const { google } = require("googleapis");
const fs = require("fs").promises;
const utils = require("../Utils/util.js");


//**Function to seggregate the past 20 message id's */
const retrieveMsg = async (count, gmail) => {
  try {
    let response = await gmail.users.messages.list({
      userId: "me",
      maxResults: count,
      labelIds: ["INBOX"],
    });
    let list = response.data.messages;
    return list;
  } catch (error) {
    console.log({ "Error receiving the msgId's": error });
    return false;
  }
};

//**Promise based function inorder to retrieve msg contents from the mail-id's (Used setTimeOut to nullify the time taken for the promise to get resolved) */
//! This case might work for less traffic, might cause problem if the mail traffic is huge in number
const getMsgContents = async (newMails, contents, gmail) => {
  var resolver = new Promise(async (resolve, _reject) => {
    try {
      //? To seggregate msgId's and requesting for message contents
      newMails.forEach(async (element) => {
        let content = await gmail.users.messages.get({
          userId: "me",
          id: element.id,
        });
        contents.push(
          content.data //?Using array.find to find the from address.
        ); //?Pushing retreived content into contents array.
      });

      setTimeout(() => {
        resolve(contents); //? Waits for 1.5 second for the promise to get its task done and resolve the required contents array. (Assuming the mail contents which we receive will be less in number)
      }, 1500);
    } catch (error) {
      console.log({ "Error in fetching msg contents": error });
      _reject(false); //? if any misscellenious error occures, it rejects error instead of the contents array.
    }
  });
  return await resolver; //?waits untill the msgcontent promise is dne.
};

//**Function to seggregate (By filtering upon unique threads and label) the message contents based on the id's */
const seggregateMsgForMailIds = async (count, gmail) => {
  try {
    let emailIDs = [];

    //?Waiting for mail Id's
    let newMails = await retrieveMsg(count, gmail);
    if (newMails == false) throw "Error in receiving msgId's!!";

    //?Waiting for msg content's
    let msgContents = await getMsgContents(newMails, [], gmail);
    if (msgContents == false) throw "Error in receiving msgContent's";

    //?Retreiving emailID's with all the constraints filtered
    emailIDs = utils.consolidateFinalIDs(msgContents);
    return emailIDs;

    //?Seggregating mails on the basis of unique threadID's and recent timestamps
  } catch (err) {
    console.log({ Status: err }); //?Error handling
  }
};

//**Promise based function inorder to initiate msg.send() request to the mail-id's (Used setTimeOut to nullify the time taken for the promise to get resolved) */
const MailInitiator = async (status, emailIDs, gmail, mailContent) => {
  var resolver = new Promise(async (resolve, _reject) => {
    try {
      //?Sending API request for each and every email id using pre-built template
      emailIDs.forEach(async (element) => {
        //?Addition of recipient address
        let updatedContent =
          "From : " +
          "Sriram Reddy <sriramreddyp123@gmail.com>\n" +
          "Subject : Information regaring my leave for vacation\n" +
          "To : " +
          element.email +
          "\n\n\n" +
          mailContent;

        //?Converting into b64
        //!Used deprecated method - should be changed later
        updatedContent = btoa(updatedContent);

        //!Problem - Mail sender was being identified as unknown in sender's inbox, but working perfectly fine in recipient's inbox
        let ack = await gmail.users.messages.send({
          userId: "me",
          resource: {
            raw: updatedContent,
          },
        });

        //?Updating status array
        if (ack.status != 200) {
          status.push({ email: element, status: "Not Sent" });
        } else {
          //?Grabbing labelId if exists or creates a new one
          let labelId = await labelExistenceAndCreation(gmail, "VacationMails");

          //?Adds the label to the mail
          let ackAdd = await labelModificationAddition(
            ack.data.id,
            gmail,
            labelId
          );
          let ackDel = await labelModificationDeletion(element.id, gmail);

          if (ackAdd == 200 && ackDel == 200)
            status.push({ email: element, status: "sent", labels: "added" });
          else
            status.push({
              email: element,
              status: "sent",
              labels: "Not added",
            });
        }
      });
      setTimeout(() => {
        resolve(status); //? Waits for 2 seconds for the promise to get its task done and resolve the required contents array.(Assuming the mail Id's which we receive will be less in number)
      }, 3000);
    } catch (error) {
      console.log({ "Error in Sending reply mails": error });
      _reject(false); //? if any misscellenious error occures, it rejects error instead of the status array.
    }
  });
  return await resolver; //?waits untill the resolver promise is dne.
};

//**Function to send automated mail to those seggregated emails */
const sendingMail = async (emailIDs, gmail) => {
  try {
    if (emailIDs.length == 0) {
      console.log("No latest mails to reply!!");
      return [];
    }

    //?Generating the template
    let mailContent = await fs.readFile(
      "./Templates/email.txt",
      (err, data) => {
        if (err) return "No data received";
        return data;
      }
    );

    //? To check status of the mails sent
    let status = await MailInitiator([], emailIDs, gmail, mailContent);
    return status;
  } catch (error) {
    console.log("Error in sending mails" + error);
  }
};

//**Function to  add labels the new mails*/
const labelModificationAddition = async (id, gmail, labelId) => {
  try {
    //?Addtion of label to the mail
    let ack = await gmail.users.messages.modify({
      userId: "me",
      id: id,
      resource: {
        addLabelIds: [labelId],
      },
    });
    return ack.status;
  } catch (error) {
    console.log("Error in adding the label" + error);
  }
};

//**Function to  add labels the new mails*/
const labelModificationDeletion = async (id, gmail) => {
  try {
    //?Deletion of label from the mail
    let ack = await gmail.users.messages.modify({
      userId: "me",
      id: id,
      resource: {
        removeLabelIds: ["IMPORTANT"],
      },
    });
    return ack.status;
  } catch (error) {
    console.log("Error in deleting the label" + error);
  }
};

//**Function to create the label */
const labelExistenceAndCreation = async (gmail, labelName) => {
  try {
    //?Getting the total list of labels
    let labels = await gmail.users.labels.list({
      userId: "me",
    });

    //?Finding the required label
    let ack = labels.data.labels.find((o) => {
      return o.name === labelName;
    });

    if (ack === undefined) {
      //?If not found, creating a new label and returning the of new label
      ack = await gmail.users.labels.create({
        userId: "me",
        resource: {
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
          name: labelName,
        },
      });
      //? if found, returning the existing id
      return ack.data.id;
    }
    return ack.id;
  } catch (error) {
    console.log("Error in creating label : " + error);
  }
};

module.exports = { seggregateMsgForMailIds, sendingMail };
