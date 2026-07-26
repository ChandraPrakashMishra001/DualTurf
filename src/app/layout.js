import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MainWrapper from '@/components/MainWrapper'
import SmoothScroll from '@/components/SmoothScroll'
import { CartProvider } from '@/context/CartContext'

export const metadata = {
  title: 'DualTurf — Premium Football Jerseys & Kits',
  description: 'Shop official and replica football jerseys, retro classics, anthem jackets, and international kits across India.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>
          <CartProvider>
            <Header />
            <MainWrapper>{children}</MainWrapper>
            <Footer />
          </CartProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}
