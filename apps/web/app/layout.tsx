import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="en">
      <body>
        <div className="min-h-screen grid grid-cols-[220px_1fr]">
          <aside className="border-r border-slate-800 p-4 space-y-2">
            <h1 className="text-xl font-semibold mb-4">PixEcom</h1>
            {[
              ['/sellpages', 'Sellpages'],
              ['/products', 'Products'],
              ['/ads-manager', 'Ads Manager'],
              ['/integrations/facebook', 'Integrations'],
              ['/products/1/ad-content', 'Ad Content']
            ].map(([href, label]) => <Link key={href} href={href} className="block text-slate-300 hover:text-white">{label}</Link>)}
          </aside>
          <main className="p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
