import { Job, Queue } from 'bullmq';
import { analyzeEmailContent, generateReply } from '../utils/openaiHelper';
import { fetchGoogleEmails, fetchOutlookEmails } from '../controllers/emailController';
import { redisClient } from '../utils/redisClient';

// Assuming Queue is properly typed after @types/bullmq installation
const emailQueue = new Queue('emailQueue', {
  connection: redisClient,
}) as Queue<any, any, string>;  // Adjust the types as per your Queue configuration

async function handleEmails(job: Job) {
  const googleEmails = await fetchGoogleEmails();
  const outlookEmails = await fetchOutlookEmails();

  const allEmails = [...googleEmails, ...outlookEmails];
  for (const email of allEmails) {
    const context = await analyzeEmailContent(email.body);
    let reply: string;
    if (context.includes('Interested')) {
      reply = await generateReply('Interested');
    } else if (context.includes('Not Interested')) {
      reply = await generateReply('Not Interested');
    } else {
      reply = await generateReply('More Information');
    }
    // Send reply via Gmail or Outlook
  }
}

emailQueue.process('handleEmails', handleEmails);
export { handleEmails };
