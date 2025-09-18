'use client';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import StrategyGenerator from '@/app/(DashboardLayout)/components/content/StrategyGenerator';





const Ideas = () => {
  return (
    <PageContainer title="Generador de Ideas" description="Este es el Generador de Ideas para Ideas de Contenidos">
      <StrategyGenerator />
    </PageContainer>
  );
};

export default Ideas;