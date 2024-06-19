import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { extractAddress } from './parseAddressFile'
import { extractTemplate1, scrapeUnitDetailsForTemplate1, extractLatLngForTemplate1, isUnitAvailableForTemplate1, extractSpecialOfferForTemplate1} from './templates/templateOne';
import { extractTemplate2,scrapeUnitDetailsForTemplate2,extractLatLngForTemplate2,isUnitAvailableForTemplate2,extractSpecialOfferForTemplate2} from './templates/templateTwo';
import {extractTemplate3,scrapeUnitDetailsForTemplate3,extractLatLngForTemplate3,isUnitAvailableForTemplate3,extractSpecialOfferForTemplate3} from './templates/templateThree';
import {extractTemplate4,scrapeUnitDetailsForTemplate4,extractLatLngForTemplate4,isUnitAvailableForTemplate4,extractSpecialOfferForTemplate4} from './templates/templateFour';

// Types definition
export type SelfStorageFacilityWebScrapeResult = {
  name: string,
  address: string | null | undefined,
  zip: string | null | undefined,
  city: string | null | undefined,
  state: string,
  latitude?: number | null | undefined,
  longitude?: number | null | undefined,
  website: string,
  rents: RentResult[],
};

export type RentResult = {
  date: Date | string,
  monthlyRentOnline?: number | null,
  monthlyRentInPerson?: number | null,
  unitDescriptionShort?: string | null,
  unitDescriptionLong?: string | null,
  unitDimensionsLengthInFeet?: number | null,
  unitDimensionsWidthInFeet?: number | null,
  isAvailable?: boolean | null,
  discounts?: string[],
  unitAmenities?: string[],
  source: string,
  limitedAvailability?: boolean | null,
  limitedAvailabilityText?: string | null,
  limitedAvailabilityUnitsLeft?: number | null,
  specialOffer?: string | null,


};

async function waitFor(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function isWebsiteCreatedByAutomatit(url: string) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Check if the word "Automatit" is present in the entire HTML content
    const content = $.html().toLowerCase();
    if (content.includes('automatit')) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error fetching the page:', error);
    return false;
  }
}


// Function to find rent pages from the base URL
async function findRentPages(baseUrl: string): Promise<string[]> {
  try {
      const response = await axios.get(baseUrl);
      const $ = cheerio.load(response.data);
      const links = new Set<string>();

      $('a').each((index, element) => {
          const href = $(element).attr('href');
          // Ensure the link matches the expected URL pattern
          if (href && href.includes('/self-storage/')) {
              const fullUrl = new URL(href, baseUrl).href;  // Resolve relative URLs to absolute
              links.add(fullUrl);
          }
      });

      console.log('Detected rent pages: for ', baseUrl);
      return Array.from(links);
  } catch (error) {
      console.error('Error fetching the page: for link ', baseUrl, error);
      return [];
  }
}

async function extractFacilityInfo(url: string): Promise<SelfStorageFacilityWebScrapeResult | null> {
  const facilityDetails: any = {};

  // Utility function to clean the address
  const cleanAddress = (address: string) => {
    if (typeof address !== 'string') return '';
    return address
      .replace(/\[email.*?\]/g, '') // Remove email addresses
      .replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b.*$/i, '') // Remove days of the week and subsequent text
      .replace(/\d{1,2}(am|pm).*$/i, '') // Remove time-related text
      .replace(/(\d{1,5} \w+ (Rd|St|Dr|Ave|Blvd|Way|Ct|Ln)[^,]*, \w{2} \d{5}).*/i, '$1') // Match address pattern and discard extras
      .replace(/\n+/g, ' ') // Replace newlines with a single space
      .replace(/\s+/g, ' ') // Collapse multiple spaces into one
      .trim();
  };

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let extractInfo, scrapeUnitDetails, extractLatLng;
    let isUnitAvailable: any;

    // Determine the appropriate template
    const templates = [
      { identifier: extractTemplate1, scrapeUnitDetails: scrapeUnitDetailsForTemplate1, extractLatLng: extractLatLngForTemplate1, isUnitAvailable: isUnitAvailableForTemplate1  },
      { identifier: extractTemplate2, scrapeUnitDetails: scrapeUnitDetailsForTemplate2, extractLatLng: extractLatLngForTemplate2, isUnitAvailable: isUnitAvailableForTemplate2, },
      { identifier: extractTemplate3, scrapeUnitDetails: scrapeUnitDetailsForTemplate3, extractLatLng: extractLatLngForTemplate3, isUnitAvailable: isUnitAvailableForTemplate3, },
      { identifier: extractTemplate4, scrapeUnitDetails: scrapeUnitDetailsForTemplate4, extractLatLng: extractLatLngForTemplate4, isUnitAvailable: isUnitAvailableForTemplate4, },
    ];

    let counter = 1;

    for (const template of templates) {
      const { address, phone } = template.identifier($, cleanAddress);
      if (address && phone) {
        extractInfo = template.identifier;
        scrapeUnitDetails = template.scrapeUnitDetails;
        extractLatLng = template.extractLatLng;
        isUnitAvailable = template.isUnitAvailable;
        facilityDetails.fullAddress = address;
        facilityDetails.phone = phone;
        const addressComponents = await extractAddress(address, address, false);
        facilityDetails.address = addressComponents?.address;
        facilityDetails.city = addressComponents?.city;
        facilityDetails.state = addressComponents?.state;
        facilityDetails.zipCode = addressComponents?.zip;
        break;
      }
    }

    if (!extractInfo || !scrapeUnitDetails || !extractLatLng) {
      console.warn(`Skipping URL ${url}: No matching template found`);
      return null;
    }

    facilityDetails.url = url;
    const rents = await scrapeUnitDetails($);
    const latAndLng = extractLatLng($);
    const facilityName = $('title').text().trim(); // Assuming the facility name is in the title tag

    const rentsDetails = rents.map(rent => {
      const unitAvailability = isUnitAvailable($, rent.element); // Check availability for the specific rent element
      return {
        date: new Date(),
        monthlyRentOnline: parseFloat(rent.rent.replace('$', '')) || null,
        monthlyRentInPerson: null,
        unitDescriptionShort: `${rent.size ?? ''}`,
        unitDescriptionLong: null,
        unitDimensionsLengthInFeet: parseInt(rent.size.split('x')[0]) || null,
        unitDimensionsWidthInFeet: parseInt(rent.size.split('x')[1]) || null,
        isAvailable: unitAvailability,
        discounts: [],
        unitAmenities: rent.amenities,
        source: url,
        limitedAvailability: null,
        limitedAvailabilityText: null,
        limitedAvailabilityUnitsLeft: null,
        specialOffer: rent.specialOffer
      };
    });

    return {
      name: facilityName,
      address: facilityDetails.address,
      zip: facilityDetails.zipCode,
      city: facilityDetails.city,
      state: facilityDetails.state,
      latitude: latAndLng?.lat ?? null,
      longitude: latAndLng?.lng ?? null,
      website: url,
      rents: rentsDetails,
    };
  } catch (error: any) {
    if (error.message === 'No matching template found') {
      console.warn(`Skipping URL ${url}: ${error.message}`);
      return null;
    }
    console.error('Error fetching the page:', error);
    throw error;
  }

}


// Main function to check Automatit and extract rent information
export async function runAutomatitFMS(url: string) {
  const isAutomatit = await isWebsiteCreatedByAutomatit(url);
  if (!isAutomatit) {
    console.warn(`Skipping URL ${url}: Not created by Automatit`);
    return;
  }
  await waitFor(10000);
  const rentPages = await findRentPages(url) ?? [];
  for (const rentPage of rentPages) {
    const facilityInfo = await extractFacilityInfo(rentPage);
    if (facilityInfo) {
      console.log(facilityInfo);
    }
  }
}

const websites: string[] = [
  "https://167nselfstorage.com/",
  "https://bangorbrewerstorage.com/",
  "https://beaufortselfstorage.ca/",
  "https://beavervalleyselfstorage.com/",
  "https://beechgrove.us/",
  "https://beltonselfstorage.com/",
  "https://bestnorthweststorage.com/",
  "https://bestvaluestorall.com/",
  "https://beststorehouse.com/",
  "https://bigredselfstorage.com/",
  "https://bigspringstorage.com/",
  "https://bmacselfstorage.com/",
  "https://bolsachicaselfstorage.com/",
  "https://bomarcselfstorage.com/",
  "https://boomerangselfstorage.com/",
  "https://briteboxstorage.com/",
  "https://brokenarrowofficeandstorage.com/",
  "https://bvselfstorage.com/",
  "https://canstoreselfstorage.ca/",
  "https://cantonrdss.com/",
  "https://capecodclimatecontrolledstorage.com/",
  "https://castleselfstorage.com/",
  "https://centralillinoisstorage.com/",
  "https://centralmaxistorage.com/",
  "https://century-storage.com/",
  "https://centurytruckparking.com/",
  "https://centuryboatandrv.com/",
  "https://cleveland-storage.com/",
  "https://close2ustorage.com/",
  "https://collegetownstoragecompany.com/",
  "https://communityselfstoragene.com/",
  "https://coolspacesstorage.com/",
  "https://katyboatstorage.com/",
  "https://keepitselfstorage.com/",
  "https://kelloggcreekboatandrvstorage.com/",
  "https://kembricks.com/",
  "https://keyserstorage.com/",
  "https://northeastselfstoragealliance.com/",
  "https://northlibertyselfstorage.com/",
  "https://northeaststoragevt.com/"
];


websites.forEach((url =>{
  runAutomatitFMS(url)
})) 