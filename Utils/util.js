//**Function to seggragate mails based on unique threads */
const basedOnThreads = (msgContents) => {
  const uniqueThreadObjects = [];
  const Hash = [];

  //? For each element in the array of objects its gonna find the duplicates and update hash value for easy identification
  msgContents.forEach((element) => {
    let statusFlag = 0; //? To check whether duplicate exists or not

    //?Iterates through the hash to find duplicates by checking the proir element from the parent loop.
    if (Hash.length != 0) {
      statusFlag = Hash.find((ele) => {
        if (ele.threadId === element.threadId) {
          ele.count = "duplicate"; //?Updates hash if duplicate exists
          return 1;
        }
      });
    }

    if (statusFlag == 0 || statusFlag == undefined)
      //?If not exists (prior and duplicate),pushing into hash
      Hash.push({ threadId: element.threadId, count: 1, element });
  });

  //?Seggregating elements with no duplicates
  Hash.forEach((o) => {
    if (o.count === 1) uniqueThreadObjects.push(o.element);
  });

  return uniqueThreadObjects;
};

//**Function to seggregate mails based on 'IMPORTANT' - label - (As most of the mailswith this label will be sent from a domain or personal mail id) */
const basedOnLabels = (msgContents) => {
  console.log(msgContents);
  if (msgContents.length == 0) {
    console.log("test");
    return [];
  }

  let labelPreferencedObjects = msgContents.filter((obj) => {
    let status = obj.labelIds.find((value) => {
      return value === "IMPORTANT";
    });
    if (status !== undefined) return true;
    return false;
  });
  return labelPreferencedObjects;
};

//**Combined function to consolidate the final object with required emailID's */
const consolidateFinalIDs = (msgContents) => {
  //?Furnishing the msgContents based on unique threads and label preference
  let furnishedInformation = basedOnLabels(basedOnThreads(msgContents));

  if (furnishedInformation.length == 0) return [];
  let emailIDs = [];

  //?Extracting emailID's from the furnished information
  furnishedInformation.forEach((element) => {
    let unfurnishedEmail = element.payload.headers.find((o) => {
      return o.name == "From";
    }).value; //?Finding 'From' keyword to extract from address from the object and furnshing the email string by removing uneccessary characters

    emailIDs.push({ id: element.id, email: unfurnishedEmail });
  });
  return emailIDs;
};

module.exports = { basedOnThreads, basedOnLabels, consolidateFinalIDs };
