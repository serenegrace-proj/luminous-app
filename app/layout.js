import "./globals.css";

export const metadata = {
  title: "Luminous",
  description: "Find a little space to breathe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
