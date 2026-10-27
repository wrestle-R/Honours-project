import type { Metadata, Viewport } from "next";
import { Geist, Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";

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
      className={`${geist.variable} ${manrope.variable} ${serif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
