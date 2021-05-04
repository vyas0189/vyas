import Image from 'next/image';
import logo from '../assets/logo.svg';

export const Navbar = () => {
	return (
		<nav>
			<Image src={logo} alt='logo' width={500} height={500} />
		</nav>
	);
};
