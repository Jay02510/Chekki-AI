import fs from 'fs';
import path from 'path';
import { SignedDataVerifier, Environment } from '@apple/app-store-server-library';

const APPLE_BUNDLE_ID = 'com.chekkiai.app';

const rootCert = fs.readFileSync(path.join(__dirname, 'certs', 'AppleRootCA-G3.cer'));

let verifier: SignedDataVerifier | null = null;

function getVerifier(): SignedDataVerifier {
  if (!verifier) {
    const environment =
      process.env.APPLE_IAP_ENVIRONMENT === 'sandbox' ? Environment.SANDBOX : Environment.PRODUCTION;
    verifier = new SignedDataVerifier([rootCert], true, environment, APPLE_BUNDLE_ID);
  }
  return verifier;
}

/**
 * Verifies a signedPayload's JWS signature against Apple's certificate
 * chain (rooted at the real Apple Root CA G3, fetched from
 * apple.com/certificateauthority and vendored in ./certs) before trusting
 * anything in it. Without this, api/subscription-webhook-apple.ts was only
 * base64-decoding the JWT body — any POST with a crafted payload could flip
 * a user to plan:'pro'.
 */
export async function verifyAppleNotification(signedPayload: string) {
  return getVerifier().verifyAndDecodeNotification(signedPayload);
}

/** Verifies the nested signedTransactionInfo JWS (a distinct, separately-signed payload). */
export async function verifyAppleTransaction(signedTransactionInfo: string) {
  return getVerifier().verifyAndDecodeTransaction(signedTransactionInfo);
}
