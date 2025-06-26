import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Devlog Management',
  description: 'Development log tracking and management dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
