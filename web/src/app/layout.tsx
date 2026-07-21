import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Chekki AI | AI Homework Helper & Academy Grading for Korean Families',
  description:
    'Chekki AI is the leading bilingual English homework assistant for Korean parents and academies. Instant handwriting OCR grading, parent guidance scripts, phonics audio coaching, and automated diagnostic reports.',
  keywords: [
    'Chekki AI',
    '영어유치원 숙제 채점',
    '엄마표 영어',
    '영문법 오답노트',
    '파닉스 발음 교정',
    '학원 자동 채점 AI',
    '학부모 리포트 자동 생성',
    'Poly GATE PSA homework',
    'Korean ESL homework helper',
    'AI handwriting OCR grading',
    'bilingual AI tutor',
  ],
  authors: [{ name: 'Chekki AI Team' }],
  metadataBase: new URL('https://chekkiai.com'),
  alternates: {
    canonical: 'https://chekkiai.com',
  },
  openGraph: {
    title: 'Chekki AI | AI Homework Helper & Academy Grading for Korean Families',
    description:
      'Turn homework battles into bonding moments. Instant handwriting AI OCR, textbook answer key integration, and parent diagnostic reviews.',
    url: 'https://chekkiai.com',
    siteName: 'Chekki AI',
    images: [
      {
        url: 'https://res.cloudinary.com/dginphpy4/image/upload/v1773201056/Link_Card_Preview_Image_-_1200x628_qdhohw.png',
        width: 1200,
        height: 630,
        alt: 'Chekki AI Platform Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chekki AI | AI Homework Helper & Academy Grading for Korean Families',
    description:
      'Instant handwriting AI OCR grading for English workbooks, phonics coaching, and parent scripts.',
    images: ['https://res.cloudinary.com/dginphpy4/image/upload/v1773201056/Link_Card_Preview_Image_-_1200x628_qdhohw.png'],
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

  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Chekki AI',
    operatingSystem: 'Web, iOS, Android',
    applicationCategory: 'EducationalApplication',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1280',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
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
