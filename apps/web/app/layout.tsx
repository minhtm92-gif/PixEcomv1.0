import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="en">
      <body>
        <div className="min-h-screen grid grid-cols-[220px_1fr]">
          <aside className="shell-sidebar p-3 space-y-1">
            <h1 className="text-[15px] font-semibold mb-3">PixEcom</h1>
            {[
              ['/sellpages', 'Sellpages'],
              ['/products', 'Products'],
              ['/ads-manager', 'Ads Manager'],
              ['/integrations/facebook', 'Integrations'],
              ['/products/1/ad-content', 'Ad Content']
            ].map(([href, label]) => (
              <Link key={href} href={href} className="nav-link">
                {label}
              </Link>
            ))}
          </aside>
          <main className="shell-main p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
