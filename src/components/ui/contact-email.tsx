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

// Simple but robust text sanitization - for plain text fields only
const sanitizeText = (text: string): string => {
  // Convert to string and handle edge cases
  const input = String(text || '');

  // For email templates, we only need plain text - strip everything dangerous
  // This is a whitelist approach: only allow safe characters
  return input
    // Keep only letters, numbers, spaces, basic punctuation
    .replace(/[^\w\s.,!?@\-()]/g, '')
    // Remove any remaining fragments
    .replace(/\s+/g, ' ')
    .trim()
    // Limit length for safety
    .slice(0, 1000);
};

export const ContactEmail: React.FC<ContactEmailProps> = ({
  name,
  email,
  message,
}) => {
  // Sanitize all user inputs
  const sanitizedName = sanitizeText(name);
  const sanitizedEmail = sanitizeText(email);
  const sanitizedMessage = sanitizeText(message);

  return (
    <Html>
      <Head />
      <Preview>New contact form submission</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Contact Form Submission</Heading>
          <Text style={text}>
            <strong>Name:</strong> {sanitizedName}
          </Text>
          <Text style={text}>
            <strong>Email:</strong> {sanitizedEmail}
          </Text>
          <Text style={text}>
            <strong>Message:</strong>
          </Text>
          <Text style={messageStyle}>{sanitizedMessage}</Text>
        </Container>
      </Body>
    </Html>
  );
};

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
