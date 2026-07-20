import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Chekki | The Homework Helper for Korean Parents',
  description:
    "Empower your child's education. A homework helper tailored for Korean parents, plus resources for educators.",
  openGraph: {
    title: 'Chekki | The Homework Helper for Korean Parents',
    description:
      "Empower your child's education. A homework helper tailored for Korean parents, plus resources for educators.",
    url: 'https://chekki-ai.vercel.app',
    siteName: 'Chekki',
    images: [
      {
        url: 'https://res.cloudinary.com/dginphpy4/image/upload/v1771381888/Chekki_Splash_1_nrpzaj.png',
        width: 1200,
        height: 630,
        alt: 'Chekki App Splash Screen',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Will using Chekki make my child dependent on smartphones or screens?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Chekki is designed as a paper-to-digital bridge rather than a passive gaming or video app. Children complete their work using physical workbooks and pencils, and parents use Chekki for brief 1 to 2-second scans to check answers and review parent guidance scripts.',
        },
      },
      {
        '@type': 'Question',
        name: "Does Chekki's pronunciation coaching use standard American accent profiles?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Yes. Chekki operates on 100% standard North American English speech synthesis (TTS) and voice recognition (STT) calibrated for children's speech pitch and cadence, matching native North American instructor pronunciation.",
        },
      },
      {
        '@type': 'Question',
        name: 'Is Chekki safe for a 6-year-old child to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Chekki is a 100% ad-free, secure, and child-friendly environment. Children can practice pronunciation and review error notebooks independently, while parents can use the built-in parent scripts to guide learning.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Chekki handle different academy workbooks like Poly, GATE, or PSA?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Chekki is powered by Google Gemini multimodal AI OCR which dynamically analyzes reading worksheets, phonics grids, and grammar exercises from any academy workbook or commercial publisher without fixed templates.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does Chekki cost compared to private tutoring?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Chekki offers a free Explorer tier with 3 daily scans, and a Pro tier providing unlimited scans for a small fraction of private tutoring costs.',
        },
      },
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased bg-slate-950 text-slate-50 min-h-[100dvh] flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
