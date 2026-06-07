export const metadata = {
  title: 'Money Machine',
  description: 'Race day tracker — AI Edition',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
