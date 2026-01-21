
export const config = {
  maxDuration: 10,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const { rating, comment, context, userEmail, userName } = req.body;
    const developerEmail = 'jsn.benjamin@gmail.com';
    
    // In production, integrate a mailer here:
    // const mailer = new Mailer(process.env.MAIL_KEY);
    // await mailer.send({ to: developerEmail, subject: `New Chekki Feedback from ${userName}`, body: ... });
    
    console.log(`[ALERT] New User Feedback Received`);
    console.log(`[ROUTING] To: ${developerEmail}`);
    console.log(`[FROM] User: ${userName} (${userEmail})`);
    console.log(`[DATA] Rating: ${rating}/5 | Comment: ${comment}`);
    if (context) console.log(`[CONTEXT] Worksheet Item ID: ${context.id}`);

    return res.status(200).json({ 
      success: true, 
      message: `Feedback routed to ${developerEmail}` 
    });
  } catch (error: any) {
    console.error("[Feedback API Error]:", error.message);
    return res.status(500).json({ error: "FEEDBACK_ROUTING_FAILED" });
  }
}
