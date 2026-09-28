import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Chụp Đại Mix Đại cùng Lay's",
  description: "Chụp đại một tấm, AI của Lay's tính toán đại đại ra công thức mix. Lay's giòn chấn động, mix đại đại vẫn ngon.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#2A74E0" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Be+Vietnam+Pro:wght@500;700;900&display=swap&subset=vietnamese"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
