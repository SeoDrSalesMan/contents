'use client';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import ContentGenerator from '@/app/(DashboardLayout)/components/content/ContentGenerator';
import ArticleCreator from '@/app/(DashboardLayout)/components/content/ArticleCreator';


const Articulos = () => {
  return (
    <PageContainer title="Creador de Artículos" description="Este es el Creador de Artículos">
      <ContentGenerator>
        <ArticleCreator />
      </ContentGenerator>
    </PageContainer>
  );
};

export default Articulos;
