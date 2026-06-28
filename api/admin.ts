import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const ADMIN_PASSCODE = 'ChecciAdmin2026!';

function initAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const cleaned = serviceAccount.trim().replace(/\n/g, '').replace(/\r/g, '');
      const parsed = JSON.parse(cleaned);
      initializeApp({ credential: cert(parsed) });
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
      initializeApp();
    }
  } else {
    initializeApp();
  }
}

initAdmin();
const adminDb = getFirestore();
const authDb = getAuth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { passcode, action, uid, email, duration } = req.body || {};

  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Passcode' });
  }

  try {
    if (action === 'list') {
      const usersSnapshot = await adminDb
        .collection('users')
        .orderBy('subscriptionStartedAt', 'desc')
        .limit(100)
        .get();

      const users = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name || 'Unknown',
          email: data.email || 'No email',
          plan: data.plan || 'free',
          subscriptionStartedAt: data.subscriptionStartedAt || null,
          nextBillingDate: data.nextBillingDate || null,
          maxScansPerDay: data.maxScansPerDay || 0,
          scansUsedToday: data.scansUsedToday || 0,
          lastScanDate: data.lastScanDate || null,
          maxQuestionsPerDay: data.maxQuestionsPerDay || 0,
        };
      });

      return res.status(200).json({ success: true, users });
    } 
    
    else if (action === 'upgrade') {
      if (!email) return res.status(400).json({ error: 'Missing email' });
      const cleanEmail = email.toLowerCase().trim();
      const usersRef = adminDb.collection('users');
      const q = usersRef.where('email', '==', cleanEmail);
      const querySnapshot = await q.get();

      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'User not found. Please check the email address.' });
      }

      const userDoc = querySnapshot.docs[0];
      const targetUid = userDoc.id;

      let nextBillingDateStr: any = FieldValue.delete();
      if (duration === '1_month') {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        nextBillingDateStr = d.toISOString();
      } else if (duration === '1_year') {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        nextBillingDateStr = d.toISOString();
      } else if (duration === 'lifetime') {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 100);
        nextBillingDateStr = d.toISOString();
      }

      await adminDb.collection('users').doc(targetUid).update({
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
        subscriptionStartedAt: new Date().toISOString(),
        nextBillingDate: nextBillingDateStr,
        subscriptionPlatform: 'admin_upgrade',
      });

      return res.status(200).json({ success: true, message: 'User upgraded successfully' });
    } 
    
    else if (action === 'downgrade') {
      if (!uid) return res.status(400).json({ error: 'Missing uid' });
      
      const updateData = {
        plan: 'free',
        maxScansPerDay: 2,
        maxQuestionsPerDay: 5,
        subscriptionStartedAt: FieldValue.delete(),
        nextBillingDate: FieldValue.delete(),
        subscriptionPlatform: FieldValue.delete(),
      };
      
      // Use set with merge to avoid failing if the document is somehow missing fields or doesn't exist
      await adminDb.collection('users').doc(uid).set(updateData, { merge: true });

      return res.status(200).json({ success: true, message: 'User downgraded successfully' });
    } 
    
    else if (action === 'delete') {
      if (!uid) return res.status(400).json({ error: 'Missing uid' });
      
      try {
        await adminDb.collection('users').doc(uid).delete();
      } catch (dbErr) {
        console.error('Error deleting user from Firestore:', dbErr);
      }
      
      try {
        await authDb.deleteUser(uid);
      } catch (authErr: any) {
        if (authErr.code !== 'auth/user-not-found') {
          console.error('Error deleting user from Auth:', authErr);
          throw authErr;
        }
        // If user is not found in auth, we can still consider the deletion successful 
        // since they are already gone from Auth and we just deleted them from Firestore
      }
      
      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } 
    
    else if (action === 'impersonate') {
      if (!uid) return res.status(400).json({ error: 'Missing uid' });
      const customToken = await authDb.createCustomToken(uid);
      return res.status(200).json({ success: true, customToken });
    } 
    
    else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (err: any) {
    console.error(`[admin] Error (${action}):`, err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
