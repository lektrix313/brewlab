import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { Fermentable, Hop, Culture, BeerStyle, StyleTemplate } from '../lib/beerjson/types';

export function useSeedData() {
  const setSeedData = useAppStore((s) => s.setSeedData);

  useEffect(() => {
    async function load() {
      try {
        const [fermentables, hops, cultures, styles, templates] = await Promise.all([
          fetchSeed<Fermentable[]>('./src/data/fermentables/index.json'),
          fetchSeed<Hop[]>('./src/data/hops/index.json'),
          fetchSeed<Culture[]>('./src/data/cultures/index.json'),
          fetchSeed<BeerStyle[]>('./src/data/styles/index.json'),
          loadTemplates(),
        ]);
        setSeedData({ fermentables, hops, cultures, styles, templates });
      } catch (e) {
        console.warn('Failed to load seed data', e);
      }
    }
    load();
  }, [setSeedData]);
}

async function fetchSeed<T>(path: string): Promise<T> {
  // In a real app these would be bundled assets or fetched from Supabase.
  // For local dev we inline the data to avoid bundler path issues.
  // We'll import them statically below.
  return [] as unknown as T;
}

import fermentablesJson from '../data/fermentables/index.json';
import hopsJson from '../data/hops/index.json';
import culturesJson from '../data/cultures/index.json';
import stylesJson from '../data/styles/index.json';
import tplAmericanPaleAle from '../data/templates/tpl-american-pale-ale.json';
import tplBestBitter from '../data/templates/tpl-best-bitter.json';
import tplIrishStout from '../data/templates/tpl-irish-stout.json';
import tplWestCoastIpa from '../data/templates/tpl-west-coast-ipa-classic.json';
import tplNeipa from '../data/templates/tpl-neipa-hazy.json';
import tplGermanHelles from '../data/templates/tpl-german-helles.json';
import tplCzechPilsner from '../data/templates/tpl-czech-pilsner.json';
import tplHefeweizen from '../data/templates/tpl-hefeweizen.json';
import tplSaison from '../data/templates/tpl-saison.json';
import tplKolsch from '../data/templates/tpl-kolsch.json';
import tplAmericanAmber from '../data/templates/tpl-american-amber.json';
import tplBelgianDubbel from '../data/templates/tpl-belgian-dubbel.json';

const templateMap: Record<string, StyleTemplate> = {
  'tpl-american-pale-ale': tplAmericanPaleAle as StyleTemplate,
  'tpl-best-bitter': tplBestBitter as StyleTemplate,
  'tpl-irish-stout': tplIrishStout as StyleTemplate,
  'tpl-west-coast-ipa-classic': tplWestCoastIpa as StyleTemplate,
  'tpl-neipa-hazy': tplNeipa as StyleTemplate,
  'tpl-german-helles': tplGermanHelles as StyleTemplate,
  'tpl-czech-pilsner': tplCzechPilsner as StyleTemplate,
  'tpl-hefeweizen': tplHefeweizen as StyleTemplate,
  'tpl-saison': tplSaison as StyleTemplate,
  'tpl-kolsch': tplKolsch as StyleTemplate,
  'tpl-american-amber': tplAmericanAmber as StyleTemplate,
  'tpl-belgian-dubbel': tplBelgianDubbel as StyleTemplate,
};

function loadTemplates(): StyleTemplate[] {
  return Object.values(templateMap);
}

export function getSeedData() {
  return {
    fermentables: fermentablesJson as Fermentable[],
    hops: hopsJson as Hop[],
    cultures: culturesJson as Culture[],
    styles: stylesJson as BeerStyle[],
    templates: loadTemplates(),
  };
}
