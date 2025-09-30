
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from '@/components/ui/tooltip'
import ConvexClientProvider from '../providers/ConvexClientProvider'
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

const PushInit = dynamic(() => import("@/components/notifications/PushInit"), { ssr: false });

export const metadata: Metadata = {
  title: "Whispera",
  description: "A modern chat application. Made by Abdur Rahman Toha",
  

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <head>
      <meta name="apple-mobile-web-app-title" content="Whispera" />
    </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <TooltipProvider>


              {children}

              <PushInit />

              <Toaster/>
            </TooltipProvider>

          </ConvexClientProvider>
        </ThemeProvider>

      </body>
    </html>
  );
}
