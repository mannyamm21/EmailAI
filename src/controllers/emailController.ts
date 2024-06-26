import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import dotenv from 'dotenv';

dotenv.config();

// MSAL Configuration for Outlook
const msalConfig = {
  auth: {
    clientId: process.env.OUTLOOK_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID}`,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
  },
};

const pca = new ConfidentialClientApplication(msalConfig);

// Google OAuth2 Client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Fetch Outlook Emails
export async function fetchOutlookEmails() {
  try {
    const accounts = await pca.getTokenCache().getAllAccounts();
    const account = accounts[0];

    if (!account) {
      throw new Error('No Outlook account found');
    }

    // Acquire token silently
    const tokenResponse = await pca.acquireTokenSilent({
      scopes: ['https://graph.microsoft.com/Mail.Read'],
      account,
    });

    // Create TokenCredentialAuthenticationProvider instance
    const authProvider = new TokenCredentialAuthenticationProvider({
      getToken: async () => tokenResponse.accessToken,
    }, {
      scopes: ['https://graph.microsoft.com/Mail.Read'],
    });

    // Initialize Microsoft Graph client
    const client = Client.initWithMiddleware({
      authProvider,
    });

    // Fetch emails
    const response = await client.api('/me/messages').get();
    const emails = response.value.map((email: any) => ({
      from: email.from.emailAddress.address,
      body: email.bodyPreview,
    }));

    return emails;
  } catch (error) {
    console.error('Error fetching Outlook emails:', error);
    return [];
  }
}

// Fetch Google Emails
export async function fetchGoogleEmails() {
  try {
    // Acquire new token if not present
    if (!oauth2Client.credentials.access_token) {
      // Redirect user to the OAuth2 consent page
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      });
      console.log('Authorize this app by visiting this url:', authUrl);

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken('authorization_code_from_redirect');
      oauth2Client.setCredentials(tokens);
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const res = await gmail.users.messages.list({ userId: 'me' });
    const messages = res.data.messages || [];
    const emails = [];

    for (const message of messages) {
      const email = await gmail.users.messages.get({ userId: 'me', id: message.id! });
      emails.push({
        from: email.data.payload?.headers?.find((header) => header.name === 'From')?.value,
        body: email.data.snippet,
      });
    }

    return emails;
  } catch (error) {
    console.error('Error fetching Google emails:', error);
    return [];
  }
}
