 // app/layout.tsx
import { UIProvider } from "@/providers/ui-provider";
import "./globals.css";
import { Source_Sans_3 } from "next/font/google";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-source-sans",
});

export const metadata = {
  title: "StoneBuild",
  icons: {
    icon: "/stonepay.ico",              // default stonepay
    shortcut: "/stonepay.ico",
    apple: "/stonepay-logo.png",    // optional
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sourceSans.variable}>
      <body className="bg-gray-50 text-gray-900 font-sourceSans">
         <UIProvider>
    
        {children}

        </UIProvider>
      </body>
    </html>
  );
}
