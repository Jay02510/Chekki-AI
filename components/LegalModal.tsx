
import React from 'react';

type LegalType = 'privacy' | 'terms';

interface Props {
  type: LegalType;
  onClose: () => void;
}

export const LegalModal: React.FC<Props> = ({ type, onClose }) => {
  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? "Privacy Policy" : "Terms of Use (EULA)";
  const date = "Last Updated: October 24, 2025";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-zinc-900 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl border border-zinc-800 animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white font-display">{title}</h2>
            <p className="text-xs text-zinc-500">{date}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors bg-zinc-900 w-8 h-8 rounded-full flex items-center justify-center border border-zinc-800">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 text-zinc-300 text-sm leading-relaxed space-y-6">
            
            {isPrivacy ? (
                <>
                    <section>
                        <h3 className="text-white font-bold mb-2">1. Introduction</h3>
                        <p>Chekki AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and services.</p>
                    </section>
                    
                    <section>
                        <h3 className="text-white font-bold mb-2">2. Information We Collect & Storage</h3>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                            <li><strong>User Provided Information:</strong> Account information (email address, name) when you register.</li>
                            <li><strong>Temporary Worksheet Images (For ALL Users):</strong> Whether you are a Free or Pro user, images of worksheets you scan are processed instantly in real-time. <u>We do not permanently store full worksheet images on our cloud servers.</u> They are temporarily held in your device's local memory for the duration of your session to protect your child's privacy.</li>
                            <li><strong>Stored Data for Pro Users:</strong> Pro Plan subscribers may have unlimited storage of <em>metadata</em> (analysis results, scores, dates, and mistake text). However, the original image files associated with these records are not retained.</li>
                            <li><strong>Stored Review Data:</strong> Specific text data you choose to save (e.g., "Mistake Notes" or flagged questions) is securely stored in our cloud database.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">3. How We Use Your Information</h3>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-400 mt-2">
                            <li>Provide AI-powered worksheet analysis and feedback.</li>
                            <li>Improve the accuracy of our AI models.</li>
                            <li>Manage your account and subscription.</li>
                            <li>Respond to customer support requests.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">4. Data Sharing and AI Processing</h3>
                        <p>We utilize third-party AI services (Google Gemini API) to analyze your worksheets. Images are transmitted securely (encrypted) to these providers solely for the purpose of immediate analysis. <strong>We do not retain the original image files on our servers</strong> after the analysis session is complete.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">5. Children's Privacy</h3>
                        <p>Our Service is intended for use by parents and guardians. We do not knowingly collect personally identifiable information directly from children under 13. If you become aware that a child has provided us with Personal Data without parental consent, please contact us.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">6. Your Rights (Account Deletion)</h3>
                        <p>You have the right to delete your account and all associated data at any time. You can do this directly within the app via <strong>Settings &gt; Danger Zone &gt; Delete Account</strong>.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">7. Contact Us</h3>
                        <p>If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:chekkihelp@gmail.com" className="text-orange-500 hover:underline">chekkihelp@gmail.com</a></p>
                    </section>
                </>
            ) : (
                <>
                    <section>
                        <h3 className="text-white font-bold mb-2">1. Acceptance of Terms</h3>
                        <p>By accessing or using Chekki AI, you agree to be bound by these Terms of Use ("Terms"). If you disagree with any part of the terms, you may not access the Service.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">2. Description of Service</h3>
                        <p>Chekki AI provides an educational tool that uses Artificial Intelligence to analyze homework and worksheets. The Service is provided "as is" and is intended to assist parents, not replace professional educational instruction.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">3. User Conduct</h3>
                        <p>You agree not to use the App to upload content that is illegal, offensive, harmful, or violates the rights of others. We reserve the right to suspend accounts that violate these guidelines.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">4. AI Disclaimer</h3>
                        <p>The feedback, grading, and suggestions provided by Chekki AI are generated by artificial intelligence. While we strive for accuracy, AI models can make mistakes ("hallucinations"). You should always verify the results before relying on them for educational purposes.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">5. Subscriptions and Billing</h3>
                        <p>Certain features of the Service may require a paid subscription ("Pro Plan"). Payment will be charged to your iTunes Account at confirmation of purchase. Subscriptions automatically renew unless auto-renew is turned off at least 24-hours before the end of the current period.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">6. Intellectual Property</h3>
                        <p>The Service and its original content (excluding Content provided by you), features, and functionality are and will remain the exclusive property of Chekki AI and its licensors.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">7. Limitation of Liability</h3>
                        <p>In no event shall Chekki AI be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
                    </section>
                </>
            )}

        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-950 p-4 border-t border-zinc-800 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg font-bold transition-colors text-sm"
            >
                I Understand
            </button>
        </div>

      </div>
    </div>
  );
};
