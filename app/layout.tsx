import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'LoadLess — Your workload, with breathing room',description:'Plan your student workload around your deadlines, available time, and daily energy.'};
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
