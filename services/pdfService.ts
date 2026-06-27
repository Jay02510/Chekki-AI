import { pdf } from '@react-pdf/renderer';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import React from 'react';
import { WorksheetPDF } from '../components/pdf/WorksheetPDF';
import { WorksheetItem } from '../types';

export const generateAndSharePDF = async (items: WorksheetItem[]) => {
  try {
    // Generate the PDF blob
    const doc = React.createElement(WorksheetPDF, { items });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(doc as any).toBlob();
    
    // File naming
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const fileName = `Chekki_Worksheet_${timestamp}.pdf`;

    if (Capacitor.isNativePlatform()) {
      // 1. Convert Blob to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]); // get only the base64 part
          } else {
            reject(new Error('Failed to convert blob to base64'));
          }
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      // 2. Write to Filesystem
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // 3. Share via native share sheet
      await Share.share({
        title: 'Your Chekki Worksheet',
        url: savedFile.uri,
        dialogTitle: 'Share your practice sheet',
      });
    } else {
      // Web fallback: Trigger standard download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error generating or sharing PDF:', error);
    throw error;
  }
};
