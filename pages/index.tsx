import Head from 'next/head';
import Link from 'next/link';

function Home() {
  return (
    <>
      <Head>
        <title>Home</title>
        <meta name="description" content="Home" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ul>
        <li>
          <Link href='/'>
            <a>Home</a>
          </Link>
        </li>
        <li>
          <Link href='/about'>
            <a>About Us</a>
          </Link>
        </li>
      </ul>
      <div>
        <p className='text-3xl'> Vyas Ramankulangara</p>
      </div>
    </>
  );
}

export default Home;
