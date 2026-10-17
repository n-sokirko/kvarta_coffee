import ScenesRoot from '@/components/ScenesRoot';
import Shop from '@/components/Shop';
import Lead from '@/components/Lead';
import { Header, Hero, SceneA, Fresh, Sub, SceneB, Meth, About, Footer } from '@/components/sections';

// Статические секции отдаются сервером готовым HTML; на клиенте оживают только витрина, форма и сцены.
export default function Page() {
  return (
    <ScenesRoot>
      <Header />
      <Hero />
      <About />
      <SceneA />
      <Fresh />
      <Shop />
      <Sub />
      <SceneB />
      <Meth />
      <Lead />
      <Footer />
    </ScenesRoot>
  );
}
