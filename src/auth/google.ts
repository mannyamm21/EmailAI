import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const googleRouter = express.Router();
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Endpoint to start OAuth process
googleRouter.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
  });
  res.redirect(url);
});

googleRouter.get('/auth/google/callback', async (req, res) => {
  const code  = req.query.code as string;
  console.log(`Received code: ${code}`); // Log code for verification

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log('Tokens:', tokens); // Log tokens for debugging
    res.send('Authorization successful');
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(400).send('Error during OAuth callback');
  }
});

export { googleRouter, oauth2Client };
