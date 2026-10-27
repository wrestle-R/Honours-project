import type { Metadata, Viewport } from "next";
import { Geist, Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";
import "./theme.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-body" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-display" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "Lucent | See beyond the scan",
  description:
    "An honours research project exploring explainable chest X-ray analysis with deep learning, visual attention and reproducible model evaluation.",
  openGraph: {
    title: "Lucent | See beyond the scan",
    description: "A little more clarity. Explore explainable medical imaging.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { themeColor: "#101211" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geist.variable} ${manrope.variable} ${serif.variable}`}
    >
      <head>
        <script
          id="lucent-theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t='dark';try{if(localStorage.getItem('lucent-theme')==='light')t='light'}catch(e){}document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='light'?'#f6f3eb':'#101211')})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
