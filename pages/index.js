import Head from 'next/head';

export default function Home() {
	return (
		<div className='container'>
			<Head>
				<title>Home</title>
				<link rel='icon' href='/logo.ico' />
			</Head>

			<div className='bg-white dark:bg-gray-800'>
				<h1 className='text-gray-900 dark:text-white'>Dark mode is here!</h1>
				<p className='text-gray-600 dark:text-gray-300'>Lorem ipsum...</p>
			</div>
		</div>
	);
}
