// import { Helmet } from 'react-helmet';
import React from 'react'


type Props = {
  description?: string;
  children: React.ReactNode;
  title?: string;
};

const PageContainer = ({ title, description, children }: Props) => (
  <>
    {children}
  </>
);

export default PageContainer;
