import { CartProvider } from '../components/CartContext';
import Layout from '../components/Layout';
import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Head>
        <title>LaLa's Take Away - Ẩm thực Việt Nam</title>
        <meta name="description" content="LaLa's Take Away - Đặt món ngon Việt Nam" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </CartProvider>
  );
}
