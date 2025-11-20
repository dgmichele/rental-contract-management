import React from 'react';
import { Html, Head, Preview, Body, Container, Button, Text } from '@react-email/components';


interface ResetPasswordEmailProps {
resetUrl: string;
}


const ResetPasswordEmail = ({ resetUrl }: ResetPasswordEmailProps) => (
<Html>
<Head />
<Preview>Reset della tua password</Preview>
<Body style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#fdf5f7', padding: '20px' }}>
<Container style={{ backgroundColor: '#fffbfc', padding: '20px', borderRadius: '8px' }}>
<Text style={{ fontSize: '16px', color: '#1e1e1e' }}>Ciao,</Text>
<Text style={{ fontSize: '16px', color: '#1e1e1e' }}>
Hai richiesto di resettare la tua password. Clicca sul pulsante qui sotto per procedere:
</Text>
<Button
  style={{ backgroundColor: '#b41c3c', color: '#fff', textDecoration: 'none', borderRadius: '5px', display: 'inline-block', margin: '20px 0', padding: '12px 20px', fontWeight: 'bold' }}
  href={resetUrl}
>
  Reimposta password
</Button>
<Text style={{ fontSize: '14px', color: '#5f5f5f' }}>
Se non hai richiesto questa operazione, ignora questa email.
</Text>
</Container>
</Body>
</Html>
);


export default ResetPasswordEmail;