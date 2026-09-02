import { createClient } from '@supabase/supabase-js';
import { GENERATORS } from '../src/lib/competition/generators';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in the environment.');
  }

  const supabase = createClient(url, publishableKey);

  const { data, error } = await supabase
    .from('question_generators')
    .select('generator_type')
    .eq('is_active', true);

  if (error) { console.error('DB error:', error.message); process.exit(1); }

  const dbTypes = [...new Set(data?.map((r: any) => r.generator_type) ?? [])] as string[];
  const missing = dbTypes.filter(t => !(GENERATORS as any)[t]);
  const matched = dbTypes.filter(t => (GENERATORS as any)[t]);

  console.log('Total active DB generators:', dbTypes.length);
  console.log('Matched in GENERATORS map: ', matched.length);
  console.log('Missing from map:          ', missing.length);
  
  if (missing.length > 0) {
    console.log('\nMissing generator_types (in DB but not in GENERATORS map):');
    missing.forEach(m => console.log(' -', m));
  } else {
    console.log('\n✅ All DB generator_types have matching functions in GENERATORS map.');
  }

  // Also check reverse — GENERATORS keys not in DB
  const mapKeys = Object.keys(GENERATORS);
  const notInDB = mapKeys.filter(k => !dbTypes.includes(k));
  console.log('\nGENERATORS map keys not in DB:', notInDB.length);
  if (notInDB.length > 0) {
    notInDB.forEach(k => console.log(' -', k));
  }
}

main().catch(console.error);
