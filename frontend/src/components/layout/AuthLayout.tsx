import React from 'react';
import Card from '../ui/Card';
import logo from '../../assets/images/logo-orizzontale.png';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex justify-center bg-bg-main px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <img 
            src={logo} 
            alt="Bich Immobiliare" 
            className="h-16 mx-auto mb-10"
          />
          <h1 className="text-4xl font-heading font-bold text-text-title mb-4">
            {title}
          </h1>
          <p className="text-text-body">
            {subtitle}
          </p>
        </div>

        {/* Card Form */}
        <Card className="shadow-sm p-8">
          {children}
        </Card>
      </div>
    </div>
  );
};
