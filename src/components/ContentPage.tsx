import Header from './Header';
import Footer from './Footer';

type Props = {
  title: string;
  intro?: string;
  children: React.ReactNode;
};

export default function ContentPage({ title, intro, children }: Props) {
  return (
    <>
      <Header />
      <main className="bg-white">
        <article className="px-[60px] py-12 max-w-3xl mx-auto">
          <h1
            className="text-[36px] font-normal mb-4"
            style={{ color: 'rgb(219, 56, 44)' }}
          >
            {title}
          </h1>
          {intro && (
            <p className="text-lg text-gray-700 mb-8">{intro}</p>
          )}
          <div className="prose-content space-y-4 text-gray-700 leading-relaxed">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
