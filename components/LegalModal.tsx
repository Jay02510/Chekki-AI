
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
          <button 
            onClick={onClose} 
            aria-label="Close"
            className="text-zinc-500 hover:text-white transition-colors bg-zinc-900 w-8 h-8 rounded-full flex items-center justify-center border border-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 text-zinc-300 text-sm leading-relaxed space-y-6">
            
            {isPrivacy ? (
                <>
                    <section>
                        <h3 className="text-white font-bold mb-2">1. Commitment to Privacy</h3>
                        <p>Chekki AI is designed for parents. We understand the sensitivity of children's educational data and implement industry-standard protections to keep your family's information secure.</p>
                    </section>
                    
                    <section>
                        <h3 className="text-white font-bold mb-2">2. Data Processing & AI Disclosure</h3>
                        <p>Our service utilizes the <strong>Google Gemini API</strong> for worksheet analysis. When you upload an image:</p>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-400 mt-2">
                            <li>The image is transmitted via encrypted channels to Google's servers for processing.</li>
                            <li><strong>Transient Processing:</strong> We do not permanently store the raw image files of your children's worksheets on our cloud servers. They are processed and then discarded.</li>
                            <li>Only the resulting text analysis (scores, question text, and guides) is stored to power your "Review Note" and account history.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">3. Information We Collect</h3>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                            <li><strong>Account Data:</strong> Name and email address used for registration.</li>
                            <li><strong>Activity Logs:</strong> Number of scans used and general app usage patterns to improve the service.</li>
                            <li><strong>Saved Review Items:</strong> Specifically flagged questions you choose to save for practice sheets.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">4. Children's Privacy (COPPA)</h3>
                        <p>Chekki AI is a tool for <strong>adults</strong> (parents and teachers). We do not knowingly collect personal information directly from children under the age of 13. All accounts must be created and managed by an adult.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">5. Contact & Data Deletion</h3>
                        <p>You may request full deletion of your account via the Settings menu or by contacting us at <strong>chekkihelp@gmail.com</strong>. Deletion is instantaneous and permanent.</p>
                    </section>
                </>
            ) : (
                <>
                    <section>
                        <h3 className="text-white font-bold mb-2">1. Agreement to Terms</h3>
                        <p>By using Chekki AI, you agree to these terms. This is a beta service provided for educational support purposes.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">2. AI Disclaimer & Accuracy</h3>
                        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-orange-200 mb-4">
                            <p className="font-bold mb-1">Important Education Notice:</p>
                            <p>Chekki AI uses advanced artificial intelligence to analyze handwriting and text. While highly accurate, AI can occasionally "hallucinate" or provide incorrect answers. <strong>Always verify the results</strong> before sharing them with your child. Chekki AI is an assistant, not a replacement for parental or professional supervision.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">3. Subscription & Beta Access</h3>
                        <p>During the beta period, access codes (e.g., CHEKKI40) may be used to unlock Pro features. We reserve the right to modify or terminate these promotional periods at our discretion based on usage limits.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">4. User Content Responsibilities</h3>
                        <p>You are solely responsible for the images you upload. You agree not to upload any content that is protected by third-party copyright without permission, or content that contains personally identifiable information of others.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">5. Limitation of Liability</h3>
                        <p>Chekki AI shall not be liable for any educational outcomes or errors resulting from the use of the application. Contact support at <strong>chekkihelp@gmail.com</strong> for inquiries.</p>
                    </section>
                </>
            )}

        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-950 p-4 border-t border-zinc-800 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg font-bold transition-colors text-sm active:scale-95"
            >
                I Understand
            </button>
        </div>

      </div>
    </div>
  );
};
