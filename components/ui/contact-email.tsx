import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
} from '@react-email/components';

interface ContactEmailProps {
    name: string;
    email: string;
    message: string;
}

export const ContactEmail: React.FC<ContactEmailProps> = ({
    name,
    email,
    message,
}) => (
    <Html>
        <Head />
        <Preview>New contact form submission</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>New Contact Form Submission</Heading>
                <Text style={text}>
                    <strong>Name:</strong> {name}
                </Text>
                <Text style={text}>
                    <strong>Email:</strong> {email}
                </Text>
                <Text style={text}>
                    <strong>Message:</strong>
                </Text>
                <Text style={messageStyle}>{message}</Text>
            </Container>
        </Body>
    </Html>
);

export default ContactEmail;

const main = {
    backgroundColor: '#ffffff',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '580px',
};

const h1 = {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    paddingTop: '32px',
    paddingBottom: '16px',
};

const text = {
    color: '#333',
    fontSize: '16px',
    lineHeight: '26px',
    marginBottom: '12px',
};

const messageStyle = {
    ...text,
    backgroundColor: '#f4f4f4',
    padding: '20px',
    borderRadius: '4px',
};

