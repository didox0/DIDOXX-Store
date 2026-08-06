import '@/app/globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'DIDOX-KITCHEN Dashboard',
  description: 'Premium SaaS dashboard for order tracking and analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex h-screen bg-gradient-to-br from-primary-900 to-gradientEnd text-foreground overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
