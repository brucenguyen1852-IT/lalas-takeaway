import { CartProvider } from '../components/CartContext';
import Layout from '../components/Layout';
import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Head>
        <title>LaLa's Take Away — Fresh Vietnamese Cuisine</title>
        <meta name="description" content="Order authentic Vietnamese food for takeaway. Fresh ingredients, bold flavors. No account needed. Cash on delivery." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#2C4A3A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LaLa's" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </CartProvider>
  );
}
