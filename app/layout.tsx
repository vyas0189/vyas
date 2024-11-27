import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navigation } from '@/components/navigation';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vyas Ramankulangara',
  description: 'Software Engineer specializing in full-stack development and cloud technologies',
  metadataBase: new URL('https://vyasr.space'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vyasr.space',
    siteName: 'Vyas Ramankulangara',
    title: 'Vyas Ramankulangara - Software Engineer',
    description: 'Full Stack Software Engineer specializing in enterprise applications, cloud technologies, and modern web development.',
    images: [
      {
        url: '/profile.jpeg',
        width: 1200,
        height: 630,
        alt: 'Vyas Ramankulangara - Software Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vyas Ramankulangara - Software Engineer',
    description: 'Full Stack Software Engineer specializing in enterprise applications, cloud technologies, and modern web development.',
    images: ['/profile.jpeg',],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1 flex items-center justify-center py-8 md:py-12">
              <div className="container mx-auto max-w-[1200px] px-4 md:px-6">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}