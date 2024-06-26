import { Queue, Worker, Job } from 'bullmq';
import { fetchGoogleEmails, fetchOutlookEmails } from '../controllers/emailController';
import { redisClient } from '../utils/redisClient';
import dotenv from 'dotenv';

dotenv.config();

const emailQueue = new Queue('emailQueue', {
  connection: redisClient,
});

async function scheduleEmailCheck() {
  await emailQueue.add(
    'checkEmails',
    {}, // Empty payload
    { repeat: { every: 60000 } } // Repeat every 60 seconds
  );
}

scheduleEmailCheck();

const emailWorker = new Worker(
  'emailQueue',
  async (job: Job | undefined) => {
    if (!job) {
      console.error('Job is undefined');
      return;
    }

    console.log('Checking emails...');
    try {
      const googleEmails = await fetchGoogleEmails();
      console.log('Fetched Google emails:', googleEmails);

      const outlookEmails = await fetchOutlookEmails();
      console.log('Fetched Outlook emails:', outlookEmails);
    } catch (error) {
      console.error('Error processing job:', error);
    }
  },
  {
    connection: redisClient,
  }
);

emailWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
  }
});
