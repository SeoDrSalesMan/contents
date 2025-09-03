'use client';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import StructureGenerator from '@/app/(DashboardLayout)/components/content/StructureGenerator';

const Estructuras = () => {
  return (
    <PageContainer title="Estructuras" description="Creador de estructuras de contenido">
      <StructureGenerator />
    </PageContainer>
  );
};

export default Estructuras;
