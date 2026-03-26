import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata = {
  title: 'SkillBridge AI - Peer-to-Peer Skill Marketplace',
  description: 'Learn and teach skills, earn SkillCoins',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={spaceGrotesk.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
