import "./globals.css";
import { Navbar } from "./components/Navbar";
import { SupabaseProvider } from "./context/SupabaseContext";

export const metadata = {
  title: "ניהול לוח זמנים",
  description: "אפליקציה לניהול לוחות זמנים",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Varela+Round&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-varela">
        <SupabaseProvider>
          <Navbar />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
