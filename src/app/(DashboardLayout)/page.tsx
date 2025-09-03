'use client';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import StrategyGenerator from '@/app/(DashboardLayout)/components/content/StrategyGenerator';





const Estrategias = () => {
  return (
    <PageContainer title="Generador de Estrategias" description="Este es el Generador de Estrategias de COntenidos">
      <StrategyGenerator />
    </PageContainer>
  );
};

export default Estrategias;
