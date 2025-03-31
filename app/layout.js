import "./globals.css";
import { Navbar } from "./components/Navbar";

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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
