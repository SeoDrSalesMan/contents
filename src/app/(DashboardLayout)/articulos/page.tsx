'use client';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import ArticleCreator from '@/app/(DashboardLayout)/components/content/ArticleCreator';


const Articulos = () => {
  return (
    <PageContainer title="Creador de Artículos" description="Este es el Creador de Artículos">
      <ArticleCreator />
    </PageContainer>
  );
};

export default Articulos;
