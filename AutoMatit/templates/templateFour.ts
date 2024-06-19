import * as cheerio from 'cheerio';

export const extractTemplate4 = ($: cheerio.CheerioAPI, cleanAddress: (address: string) => string) => {
    const title = $('#facility_info .title hgroup h2').text().trim();
    const address = cleanAddress(`${title}, ${$('#facility_info .title hgroup h3').text().trim()}`);
    const phone = $('#facility_info .phone a').text().trim();
    return { address, phone };
};

export async function scrapeUnitDetailsForTemplate4($: cheerio.CheerioAPI): Promise<any[]> {
    try {
        const unitDetails: any[] = [];

        // Extract details from the unit_row elements
        $("tr.unit_row").each((_, element) => {
            const unitSize = $(element).find('.unit-size').clone().children().remove().end().text().trim();
            const unitType = $(element).find('.unit-details ul li').text().trim();
            const specialOffer = $(element).find('.special-offer').text().trim();
            const rent = $(element).find('.monthly-rent .now').text().trim();
            const reserveLink = $(element).find('.rate-button a.btn_reserve').first().attr('href')?.trim() || '';

            const amenities: string[] = [];
            $(element).find('.unit-details ul li').each((_, li) => {
                amenities.push($(li).text().trim());
            });

            unitDetails.push({
                size: unitSize,
                type: unitType,
                amenities: amenities,
                specialOffer: specialOffer,
                rent: rent,
                reserveLink: reserveLink,
                element,
                
            });
        });

        return unitDetails;
    } catch (error) {
        console.error('Error fetching the page:', error);
        return [];
    }
}


export function extractLatLngForTemplate4($: cheerio.CheerioAPI): { lat: number, lng: number } | null {
    const locationItem = $('.location_item');
    const lat = parseFloat(locationItem.attr('lat') || '');
    const lng = parseFloat(locationItem.attr('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
        return null; // Return null if lat or lng are not valid numbers
    }

    return { lat, lng };
}

export function isUnitAvailableForTemplate4($: cheerio.CheerioAPI, rentElement: cheerio.Element): boolean {
    const rent = $(rentElement);
    const waitListButton = rent.find('.rate-button .btn_wait_list');
    const unitCountText = rent.find('.unit-size span#uta').text().trim();
    const unitCount = parseInt(unitCountText, 10);

    return waitListButton.length === 0 && unitCount > 0;
}


// Function to extract special offers for template one
export function extractSpecialOfferForTemplate4($: cheerio.CheerioAPI): string | null {
    const specialOffer = $('.special-offer').text().trim();
    return specialOffer || null;
}
