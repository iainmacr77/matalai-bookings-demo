import ClonedHeader from './components/ClonedHeader';
import HeroSection from './components/HeroSection';
import FeaturedLodges from './components/FeaturedLodges';
import CountryShowcase from './components/CountryShowcase';
import NyokaFoundation from './components/NyokaFoundation';
import Experiences from './components/Experiences';
import About from './components/About';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <>
      <ClonedHeader />
      <main>
        <HeroSection />
        <FeaturedLodges />
        <CountryShowcase />
        <NyokaFoundation />
        <Experiences />
        <About />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}

export default App;