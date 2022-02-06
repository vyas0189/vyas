import Head from 'next/head';
import Link from "next/link";

export default function About() {

  return (
    <>
      <Head>
        <title>About</title>
        <meta name="description" content="About" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        <h1>About Me</h1>
      </div>

      <Link href='/'>
        <a>Home</a>
      </Link>

    </>
  );
}
