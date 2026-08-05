import "@/app/globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import { Providers } from "./component/Providers";
import { GlobalChat } from "./component/chat/GlobalChat";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-200`}>
        <AuthProvider>
          <Providers>
            {children}
            <GlobalChat />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
