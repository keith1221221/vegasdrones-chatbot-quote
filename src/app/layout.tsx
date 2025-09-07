// src/app/layout.tsx


export const metadata = {
  title: "Vegas Drones Chatbot",
  description: "Quote assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
