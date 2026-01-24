import "./globals.css";
import ClientLayout from "./ClientLayout";

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body className="text-white min-h-screen bg-slate-950">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
