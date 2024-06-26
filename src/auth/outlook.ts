// src/auth/outlook.ts

import express from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import dotenv from 'dotenv';

dotenv.config();

const outlookRouter = express.Router();

const msalConfig = {
  auth: {
    clientId: process.env.OUTLOOK_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID}`,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
  },
};

const pca = new ConfidentialClientApplication(msalConfig);

outlookRouter.get('/outlook', async (req, res) => {
  const authUrl = await pca.getAuthCodeUrl({
    scopes: ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send'],
    redirectUri: process.env.OUTLOOK_REDIRECT_URI!,
  });
  res.redirect(authUrl);
});

outlookRouter.get('/outlook/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenResponse = await pca.acquireTokenByCode({
      code: code as string,
      scopes: ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send'],
      redirectUri: process.env.OUTLOOK_REDIRECT_URI!,
    });
    // Store tokens securely
    res.send('Outlook account connected successfully');
  } catch (error) {
    console.error('Error acquiring token:', error);
    res.status(500).send('Authentication failed');
  }
});

export { outlookRouter, pca };
