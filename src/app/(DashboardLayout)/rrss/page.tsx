'use client';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import RrssGenerator from '@/app/(DashboardLayout)/components/content/RrssGenerator';


const RRSS = () => {
  return (
    <PageContainer title="RRSS" description="Generador de estrategias de redes sociales">
      <RrssGenerator />
    </PageContainer>
  );
};

export default RRSS;
