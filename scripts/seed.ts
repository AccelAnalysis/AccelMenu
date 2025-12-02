import { createClient } from '@supabase/supabase-js';

interface SeedLocation {
  id: string;
  slug: string;
  name: string;
  description?: string;
  defaultBoardSlug?: string;
}

interface SeedBoard {
  id: string;
  slug: string;
  locationId: string;
  name: string;
  description?: string;
}

const locations: SeedLocation[] = [
  {
    id: 'loc-hq',
    slug: 'headquarters',
    name: 'Headquarters',
    description: 'Primary office and demo space.',
    defaultBoardSlug: 'welcome',
  },
  {
    id: 'loc-remote',
    slug: 'remote-lab',
    name: 'Remote Lab',
    description: 'QA lab for remote contributors.',
    defaultBoardSlug: 'qa-schedule',
  },
];

const boards: SeedBoard[] = [
  {
    id: 'board-welcome',
    slug: 'welcome',
    locationId: 'loc-hq',
    name: 'Welcome Board',
    description: 'Orientation materials and quick links for visitors.',
  },
  {
    id: 'board-ops',
    slug: 'ops',
    locationId: 'loc-hq',
    name: 'Operations',
    description: 'Daily runbook and operations tiles.',
  },
  {
    id: 'board-qa',
    slug: 'qa-schedule',
    locationId: 'loc-remote',
    name: 'QA Schedule',
    description: 'Testing calendar for early adopter cohorts.',
  },
];

function getClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function seedLocations() {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('locations')
    .upsert(
      locations.map((location) => ({
        id: location.id,
        slug: location.slug,
        name: location.name,
        description: location.description,
        data: {
          slug: location.slug,
          defaultBoardSlug: location.defaultBoardSlug,
        },
        updated_at: new Date().toISOString(),
      }))
    )
    .select('id, name, slug');

  if (error) throw error;
  return data ?? [];
}

async function seedBoards() {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('boards')
    .upsert(
      boards.map((board) => ({
        id: board.id,
        slug: board.slug,
        location_id: board.locationId,
        name: board.name,
        description: board.description,
        data: {
          slug: board.slug,
          locationSlug: locations.find((loc) => loc.id === board.locationId)?.slug,
        },
        updated_at: new Date().toISOString(),
      }))
    )
    .select('id, name, slug, location_id');

  if (error) throw error;
  return data ?? [];
}

async function runSeed() {
  console.log('Seeding locations and boards...');

  const seededLocations = await seedLocations();
  console.log(`Seeded ${seededLocations.length} locations.`);

  const seededBoards = await seedBoards();
  console.log(`Seeded ${seededBoards.length} boards.`);

  console.log('Seed complete.');
}

runSeed().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
