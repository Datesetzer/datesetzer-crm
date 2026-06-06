import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Datesetzer CRM", template: "%s · Datesetzer CRM" },
  description: "Premium Executive Dating CRM",
  applicationName: "Datesetzer CRM",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Datesetzer" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#09080c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if('serviceWorker' in navigator){
            window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
          }
        `}} />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#13111a",
              border: "1px solid rgba(201,168,76,0.22)",
              color: "#f0e9da",
              fontFamily: "'Jost',sans-serif",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
