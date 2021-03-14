import * as calendar from './calendar.js';

import { DateTime } from 'luxon';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import formidable from 'express-formidable';
const app = express();
app.use(cors());
app.use(formidable());
const port = process.env.PORT;

const calendarId = 'g8udaf5h5e0hrjmsmffmgcsqc0@group.calendar.google.com';
const timeZone = 'America/Toronto';

function withAuth(req, res, callback) {
  calendar.authorize(JSON.parse(process.env.GOOGLE_CREDENTIALS), JSON.parse(process.env.GOOGLE_TOKEN))
  .then(callback)
  .catch((err) => { console.log('Error loading client secret file:', err); res.status(500).send('An internal error occurred :('); });
}

app.get('/events', (req, res) => {
  withAuth(req, res, (auth) => {
    calendar.listEvents(auth, 'g8udaf5h5e0hrjmsmffmgcsqc0@group.calendar.google.com')
    .then(res.send.bind(res))
    .catch(() => res.status(500).send('An internal error occurred :('));
  });
});
app.post('/events', (req, res) => {
  withAuth(req, res, (auth) => {
    const event = Object.assign({}, req.fields);
    // console.log(req.fields);
    event.start = { dateTime: DateTime.fromISO(event.start).toISO(), timeZone: timeZone };
    event.end = { dateTime: DateTime.fromISO(event.end).toISO(), timeZone: timeZone };
    
    console.log(event);
    calendar.createEvent(auth, calendarId, event)
    .then(res.send.bind(res))
    .catch(() => res.status(500).send('An internal error occurred :('));
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
