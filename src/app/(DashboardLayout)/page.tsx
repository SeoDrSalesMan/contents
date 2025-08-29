'use client';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import ContentGenerator from '@/app/(DashboardLayout)/components/content/ContentGenerator';
import StrategyGenerator from '@/app/(DashboardLayout)/components/content/StrategyGenerator';





const Estrategias = () => {
  return (
    <PageContainer title="Generador de Estrategias" description="Este es el Generador de Estrategias de COntenidos">
      <ContentGenerator>
        <StrategyGenerator />
      </ContentGenerator>
    </PageContainer>
  );
};

export default Estrategias;
