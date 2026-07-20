import { useCms } from './hooks/useCms';
import { Portrait } from './components/Portrait';
import { Bio } from './components/Bio';
import { LinkList } from './components/LinkList';
import { Services } from './components/Services';
import { Footer } from './components/Footer';

export default function App() {
  const { data } = useCms();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-paper focus:px-4 focus:py-2 focus:text-ink focus:shadow"
      >
        Skip to content
      </a>

      <main id="main" className="mx-auto w-full max-w-editorial px-6 pt-14 pb-12 sm:pt-20 lg:pt-24">
        <div className="flex flex-col gap-8 sm:gap-10 md:flex-row md:items-start md:gap-12">
          <div className="md:w-[272px] md:shrink-0">
            <Portrait alt={data.site.portrait_alt} src={data.site.portrait_path} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <Bio
              greeting={data.homepage.greeting}
              bio={data.homepage.bio}
              location={data.homepage.location}
            />
            <LinkList links={data.links} />
            <Services
              services={data.services}
              heading={data.homepage.services_heading}
              disabledLabel={data.homepage.services_disabled_label}
            />
          </div>
        </div>
      </main>

      <div className="mx-auto w-full max-w-editorial px-6 pb-16">
        <Footer note={data.homepage.footer_note} siteName={data.site.site_name} />
      </div>
    </div>
  );
}
