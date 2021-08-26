import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';

// If modifying these scopes, delete the access token.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, token) {
  function doAuthorize(credentialsObject, token, callback) {
    const {client_secret, client_id, redirect_uris} = credentialsObject.web;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    oAuth2Client.setCredentials(token);
    callback(oAuth2Client);
  }
  
  if (typeof credentials === 'string' || credentials instanceof String) {
    return new Promise((resolve, reject) => {
      fs.readFile(credentials, (err, content) => {
        if (err) reject(err);
        else doAuthorize(JSON.parse(content), token, resolve);
      });
    });
  } else {
    return new Promise((resolve, reject) => doAuthorize(credentials, token, resolve));
  }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
// function getAccessToken(oAuth2Client, callback) {
//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES,
//   });
//   console.log('Authorize this app by visiting this url:', authUrl);
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//   rl.question('Enter the code from that page here: ', (code) => {
//     rl.close();
//     oAuth2Client.getToken(code, (err, token) => {
//       if (err) return console.error('Error retrieving access token', err);
//       oAuth2Client.setCredentials(token);
//       // Store the token to disk for later program executions
//       fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
//         if (err) return console.error(err);
//         console.log('Token stored to', TOKEN_PATH);
//       });
//       callback(oAuth2Client);
//     });
//   });
// }

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth, calendarId) {
  const calendar = google.calendar({version: 'v3', auth});
  return new Promise((resolve, reject) => calendar.events.list({
    calendarId: calendarId,
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      reject(err);
    } else {
      const events = res.data.items;
      if (events.length) {
        console.log('Upcoming 10 events:');
        events.map((event, i) => {
          const start = event.start.dateTime || event.start.date;
          console.log(`${start} - ${event.summary}`);
        });
      } else {
        console.log('No upcoming events found.');
      }
      resolve(events);
    }
  }));
}

function createEvent(auth, calendarId, event) {
  const calendar = google.calendar({version: 'v3', auth});
  return new Promise((resolve, reject) => calendar.events.insert({
    calendarId: calendarId,
    resource: event
  }, (err, event) => {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      reject(err);
    } else {
      console.log('Event created: %s', event);
      resolve(event);
    }
  }));
}

export { authorize, listEvents, createEvent };
