import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Invoice Dashboard',
        default: 'Invoice Dashboard',
    },
    description: 'Invoice management dashboard built with Next.js and TypeScript.',
    metadataBase: new URL('https://next-js-needy1.vercel.app'),
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
      </html>
  );
}