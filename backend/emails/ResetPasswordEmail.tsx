import React from 'react';
import { Html, Head, Preview, Body, Container, Button, Text } from '@react-email/components';


interface ResetPasswordEmailProps {
resetUrl: string;
}


const ResetPasswordEmail = ({ resetUrl }: ResetPasswordEmailProps) => (
<Html>
<Head />
<Preview>Reset della tua password</Preview>
<Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', padding: '20px' }}>
<Container style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px' }}>
<Text style={{ fontSize: '16px', color: '#333' }}>Ciao,</Text>
<Text style={{ fontSize: '16px', color: '#333' }}>
Hai richiesto di resettare la tua password. Clicca sul pulsante qui sotto per procedere:
</Text>
<Button
  style={{ backgroundColor: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: '5px', display: 'inline-block', margin: '20px 0', padding: '12px 20px' }}
  href={resetUrl}
>
  Reimposta password
</Button>
<Text style={{ fontSize: '14px', color: '#555' }}>
Se non hai richiesto questa operazione, ignora questa email.
</Text>
</Container>
</Body>
</Html>
);


export default ResetPasswordEmail;