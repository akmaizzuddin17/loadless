import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'LoadLess — Your workload, with breathing room',description:'Plan your student workload around your deadlines, available time, and daily energy.'};
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"try{var t=localStorage.getItem('loadless-theme')||'system';var d=t==='dark'||t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.classList.toggle('dark',d)}catch(e){}"}}/></head><body>{children}</body></html>}
