import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Dhaka Tesla Pool",
  description: "Share a seat. Split the fare. Survive Dhaka traffic.",
  icons: {
    icon: "/images/ride_sharing_logo.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
