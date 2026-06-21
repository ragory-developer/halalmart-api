import https from 'https';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CITY_ID_MAP: Record<string, number> = {
  'Patuakhali': 729, 'Jhalokati': 732, 'Bhola': 736, 'Barisal': 743,
  'Barguna District': 746, 'Pirojpur': 753,
  'Chandpur': 725, 'Rangamati': 745, 'Brahmanbaria': 748, 'Lakshmipur': 749,
  'Cumilla': 755, 'Chittagong Area': 758, 'Feni': 765, 'Noakhali': 768,
  'Bandarban District': 776, "Cox's Bazar": 780, 'Khagrachari': 48369,
  'Dhaka City': 708, 'Savar (Dhaka Sub Area)': 709, 'Narayanganj (Dhaka Sub Area)': 710,
  'Tongi': 711, 'Gazipur': 717, 'Faridpur': 771, 'Madaripur': 773,
  'Kishoreganj': 774, 'Manikganj': 775, 'Munshiganj': 777, 'Gopalganj': 778,
  'Rajbari': 48360, 'Narsingdi': 48361, 'Tangail': 48362, 'Shariatpur': 48364,
  'Dhamrai': 48372, 'Dohar Upazila': 48373,
  'Magura': 723, 'Jashore': 726, 'Jhenaidah': 727, 'Kushtia': 731,
  'Khulna': 734, 'Meherpur': 735, 'Satkhira': 741, 'Narail': 48366,
  'Chuadanga': 48367, 'Bagerhat District': 48368,
  'Sherpur': 742, 'Jamalpur': 752, 'Netrokona': 754, 'Mymensingh': 757,
  'Natore': 714, 'Chapainawabganj': 715, 'Pabna': 716, 'Joypurhat': 718,
  'Naogaon': 719, 'Bogura': 721, 'Rajshahi': 724, 'Sirajganj': 827,
  'Habiganj': 750, 'Sunamganj': 760, 'Moulvibazar': 763, 'Sylhet': 766,
  'Dinajpur': 728, 'Rangpur': 744, 'Gaibandha': 751, 'Kurigram': 759,
  'Thakurgaon': 761, 'Panchagarh': 764, 'Nilphamari': 769, 'Lalmonirhat': 772,
};

function fetchAreas(cityId: number): Promise<{ name: string; cost: number }[]> {
  return new Promise((resolve, reject) => {
    https.get(`https://api.emartwayskincare.com.bd/api/v3/areas-by-city/${cityId}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success && Array.isArray(json.data)) {
            const seen = new Set<string>();
            const unique = json.data.filter((a: any) => {
              if (seen.has(a.name)) return false;
              seen.add(a.name);
              return true;
            });
            resolve(unique.map((a: any) => ({
              name: a.name,
              cost: parseFloat(a.cost) || 0,
            })));
          } else resolve([]);
        } catch { resolve([]); }
      });
    }).on('error', reject);
  });
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
  console.log(`Processing ${cities.length} cities...\n`);

  let totalUpdated = 0;
  let totalInserted = 0;

  for (const city of cities) {
    const externalId = CITY_ID_MAP[city.name];
    if (!externalId) {
      console.log(`⚠️  No mapping for "${city.name}"`);
      continue;
    }

    const areas = await fetchAreas(externalId);
    if (!areas.length) {
      console.log(`⏭️  No areas for ${city.name}`);
      continue;
    }

    let inserted = 0, updated = 0;
    for (const area of areas) {
      const existing = await prisma.area.findFirst({
        where: { name: area.name, cityId: city.id },
      });
      if (existing) {
        await prisma.area.update({
          where: { id: existing.id },
          data: { deliveryCharge: area.cost },
        });
        updated++;
      } else {
        await prisma.area.create({
          data: { name: area.name, cityId: city.id, status: 'active', deliveryCharge: area.cost },
        });
        inserted++;
      }
    }

    totalUpdated += updated;
    totalInserted += inserted;
    console.log(`✅ ${city.name}: ${inserted} inserted, ${updated} updated with charges`);
    await sleep(200);
  }

  console.log(`\n🎉 Done! ${totalInserted} inserted, ${totalUpdated} updated with delivery charges.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
