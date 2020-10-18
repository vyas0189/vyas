import Head from 'next/head';

export default function Home() {
	return (
		<div className='container'>
			<Head>
				<title>Home</title>
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<p>Hello</p>
		</div>
	);
}
