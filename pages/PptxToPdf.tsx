
import React from 'react';
import { Navigate } from 'react-router-dom';

// Feature removed. Redirect to home.
export const PptxToPdfPage: React.FC = () => {
  return <Navigate to="/" replace />;
};
