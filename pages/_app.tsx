import 'tailwindcss/tailwind.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;

  //   (
  //     <>
  //       <Head>
  //         <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@algolia/algoliasearch-netlify-frontend@1/dist/algoliasearchNetlify.css" />
  //         <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@algolia/algoliasearch-netlify-frontend@1/dist/algoliasearchNetlify.js"></script>
  //         <script type="text/javascript">
  //           algoliasearchNetlify({
  //             appId: '6E8Q2MHQ6Q',
  //           apiKey: '69b8dc6bd5f088b94dcaa0c8a1344afd',
  //           siteId: 'f823f241-30d8-4e88-a617-19a4606271c7',
  //           branch: 'main',
  //           selector: 'div#search',
  //           });
  //         </script>
  //         <Component {...pageProps} />
  //     </>);
  // }
  export default MyApp;
