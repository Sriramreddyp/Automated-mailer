# :hourglass: Automated-mailer

## Analogy :
An Automated API based on nodejs which replies new mails with predefined template with all consolidations included.

## Stack Used :
  - JavaScript
  - NodeJs - V.16.6.0
    
## Dependencies :
  - googleapi - V.1.0.0

# Software Description :

## Breif : 
An Automated mailer system which seggregates the recent mails between the time intreval difference (50 - 100 seconds) and replies to those mails with a predifined mail template.
The application uses googleAPI in order to achieve this.
<br>
Basically we can use google api in two ways :
 - By sending normal API request using nodejs modules after authenticating with google.
 - By using inbuilt googleapi RESTFUL module to initiate requests after authenticating with google.

This application uses the second approach.

### Process:
The whole automation process of this application is done in three steps :
 - Authentication
 - Two-Layer Abstraction.
 - Sending replies and labeling.

### 1. Authentication :
Gmail API uses oAuth2.0 process in order to authenticate API requests.So, initially we need to obtain oAuth2.0 client ID and secret from GCP (Google cloud platform) and use those credentials in order to generate access token.
This application use the same approach by using a quickstart template provided by google, so for each API request made it will be authenticated with the access token generated.

### 2. Two - Layer Abstraction :
In order to reply to those particular mails which were received recently, a two-layer abstraction was used inorder to consolidate all those mails by specific factors :
 - In first layer, all the mails will be seggregated based on their threadIDs in order to make sure that no previous conversation was initiated by the sender.
 - In second layer, application uses the label feature provided by google which fetches all the mails labeled with 'IMPORTANT' which represents that particular mail was received from either a single mailId or a recognized domain.

### 3. Sending replies and labeling :
Finally, a predefined template will be mailed to all those seggregated mailId's and will be labeled for future reference.

## Improvement Factors :
There are some areas of application that should be improved in future versions for more optimized experience.
- Fetching emails based on their timestamp.
- A template generator for generating email body.
- <b>IMPORTANT</b> : Right now, application uses setTimeout function in very few corners to make the application wait untill some of the promises to get resolved.This has to updated later as it might cause uneccessary delays when the traffic on the application is huge.

