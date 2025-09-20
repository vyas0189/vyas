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

// Comprehensive sanitization function to prevent XSS
const sanitizeText = (text: string): string => {
    // Convert to string and handle edge cases
    const input = String(text || '');

    // Apply multiple passes of sanitization
    const sanitizers = [
        // Remove HTML tags completely
        (str: string) => str.replace(/<[^>]*>/g, ''),
        // Remove dangerous URL schemes (case insensitive)
        (str: string) => str.replace(/(javascript|data|vbscript):/gi, ''),
        // Remove event handler attributes (comprehensive)
        (str: string) => str.replace(/on\w+\s*=\s*[^>\s]*/gi, ''),
        // Remove standalone event handler names
        (str: string) => str.replace(/\bon\w+\b/gi, ''),
        // Remove script-related keywords
        (str: string) => str.replace(/\b(script|eval|expression)\b/gi, ''),
        // Clean up whitespace
        (str: string) => str.replace(/\s+/g, ' ').trim(),
    ];

    // Apply all sanitizers in sequence, multiple times for overlapping patterns
    let sanitized = input;
    for (let pass = 0; pass < 3; pass++) {
        const beforePass = sanitized;
        for (const sanitizer of sanitizers) {
            sanitized = sanitizer(sanitized);
        }
        // If no changes in this pass, we're done
        if (sanitized === beforePass) break;
    }

    return sanitized;
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

