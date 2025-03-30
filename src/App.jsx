import ClonedHeader from './components/ClonedHeader';
import HeroSection from './components/HeroSection';
import FeaturedLodges from './components/FeaturedLodges';
import NyokaFoundation from './components/NyokaFoundation';
import Experiences from './components/Experiences';
import About from './components/About';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <ClonedHeader />
      <main>
        <HeroSection />
        <FeaturedLodges />
        <NyokaFoundation />
        <Experiences />
        <About />
      </main>
      <Footer />
    </>
  );
}

export default App;