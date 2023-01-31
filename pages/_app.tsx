import type { AppProps } from "next/app";
import Head from "next/head";

import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>MuddEscapes Control Center</title>
        <meta name="description" content="Control Center for MuddEscapes" />
        <link rel="icon" href="/control-center/favicon.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
