import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import '../index.css';
import { Analytics } from '@vercel/analytics/next';
import { ToastProvider } from '@/components/ui/toast-provider';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ToastProvider>
            {children}
          </ToastProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
} 