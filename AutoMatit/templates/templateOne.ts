import axios from 'axios';
//import cheerio from 'cheerio';
import * as cheerio from 'cheerio';


export const extractTemplate1 = ($: cheerio.CheerioAPI, cleanAddress: (address: string) => string) => {
    const address = cleanAddress(
        $('#facility-info .contact')
            .contents()
            .filter((_: any, el: any) => el.type === 'text' && $(el).text().trim().length > 0)
            .map((_: any, el: any) => $(el).text().trim())
            .get()
            .join(' ')
            .replace(/\s+/g, ' ')
            .replace(/, /g, ',')
    );
    const phone = $('#facility-info .contact .phone').text().trim();
    return { address, phone };
};

export async function scrapeUnitDetailsForTemplate1($: cheerio.CheerioAPI): Promise<any[]> {
    try {
        
        const unitDetails: any[] = [];

        // Extract details from the unit-row elements
        $(".unit-row").each((_, element) => {
            const unitSize = $(element).find('.unit-size').text().trim().split('\n')[0].trim();
            const unitType = $(element).find('.p-unit-type').text().trim();
            const rent = $(element).find('.monthly-rent').text().trim();
            const reserveLink = $(element).find('.rate-button .btn_reserve').first().attr('href')?.trim();
            const holdLink = $(element).find('.rate-button .btn_reserve').last().attr('href')?.trim();

            const amenities: string[] = [];
            $(element).find('.unit-details li').each((_, li) => {
                amenities.push($(li).text().trim());
            });

            unitDetails.push({
                size: unitSize,
                type: unitType,
                amenities: amenities,
                rent: rent,
                reserveLink: reserveLink,
                holdLink: holdLink,
                element
            });
        });

        return unitDetails;
    } catch (error) {
        console.error('Error fetching the page:', error);
        return [];
    }
}


export function extractLatLngForTemplate1($: cheerio.CheerioAPI): { lat: number, lng: number } | null {
    //  const $ = cheerio.load(html);
    const mapTab = $('.map_tab.data_source');

    if (mapTab.length === 0) {
        return null; // Return null if the element is not found
    }

    const lat = parseFloat(mapTab.attr('data-lat') || '');
    const lng = parseFloat(mapTab.attr('data-lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
        return null; // Return null if lat or lng is not a valid number
    }

    return { lat, lng };
}

export function isUnitAvailableForTemplate1($: cheerio.CheerioAPI): boolean {
    // Check if the unit-row has the class 'available-unit'
    const availableUnit = $('.unit-row').hasClass('available-unit');

    // Check for text that indicates unavailability
    const unavailabilityText = $('.unit-row').text().toLowerCase().includes('sold out') ||
        $('.unit-row').text().toLowerCase().includes('waitlist') ||
        $('.unit-row').text().toLowerCase().includes('unavailable') ||
        $('.unit-row').text().toLowerCase().includes('call for availability');

    // If it has the 'available-unit' class and does not contain unavailability text, it's available
    return availableUnit && !unavailabilityText;
}


// Function to extract special offers for template one
export function extractSpecialOfferForTemplate1($: cheerio.CheerioAPI): string|null  {
    const specialOffer = $('.special-offer').text().trim();
    return specialOffer || null ;
}