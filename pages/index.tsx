import Head from 'next/head';
import Link from 'next/link'

function Home() {
  return <>
    <ul>
      <li>
        <Link href="/">
          <a>Home</a>
        </Link>
      </li>
      <li>
        <Link href="/about">
          <a>About Us</a>
        </Link>
      </li>
      <li>
        <Link href="/blog/hello-world">
          <a>Blog Post</a>
        </Link>
      </li>
    </ul>
    <div> 
      <p className='text-3xl'> Vyas Ramankulangara </p>
    </div>
</>
  )
}

export default Home
