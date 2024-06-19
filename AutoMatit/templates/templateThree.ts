import * as cheerio from 'cheerio';

export const extractTemplate3 = ($: cheerio.CheerioAPI, cleanAddress: (address: string) => string) => {
    const address = cleanAddress(
        $('#facility_info_mobile_wrap .unit_info_address a')
            .map((_, el) => $(el).text().trim())
            .get()
            .join(' ')
    );
    const phone = $('#facility_info_mobile_wrap .unit_info_phone a').text().trim();
    return { address, phone };
};


export async function scrapeUnitDetailsForTemplate3($: cheerio.CheerioAPI): Promise<any[]> {
    try {
        const unitDetails: any[] = [];

        // Extract details from the facility_rates_row elements
        $(".facility_rates_row").each((_, element) => {
            const unitSize = $(element).find('.facility_rates_size').clone().children().remove().end().text().trim();
            const unitType = $(element).find('.facility_rates_details b').text().trim();
            const specialOffer = $(element).find('.facility_rates_special').text().replace('Special:', '').trim();
            const rent = $(element).find('.facility_rates_rent .facility_rates_wrap').text().trim();
            const reserveLink = $(element).find('.facility_rates_get_unit a.btn_hover').first().attr('href')?.trim() || '';
            const rentLink = $(element).find('.facility_rates_get_unit a.btn_hover').last().attr('href')?.trim() || '';

            const amenities: string[] = [];
            $(element).find('.facility_rates_details ul li').each((_, li) => {
                amenities.push($(li).text().trim());
            });

            unitDetails.push({
                size: unitSize,
                type: unitType,
                amenities: amenities,
                specialOffer: specialOffer,
                rent: rent,
                reserveLink: reserveLink,
                rentLink: rentLink,
                element
            });
        });

        return unitDetails;
    } catch (error) {
        console.error('Error fetching the page:', error);
        return [];
    }
}


export function extractLatLngForTemplate3($: cheerio.CheerioAPI): { lat: number, lng: number } | null {
    const mapDiv = $('#map');
    const lat = parseFloat(mapDiv.attr('data-lat') || '');
    const lng = parseFloat(mapDiv.attr('data-lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
        return null; // Return null if lat or lng are not valid numbers
    }

    return { lat, lng };
}
// Modified isUnitAvailableForTemplate3 function to check within context of each element
export function isUnitAvailableForTemplate3($: cheerio.CheerioAPI, rentElement: cheerio.Element): boolean {
    const rent = $(rentElement);
    const waitListButton = rent.find('.facility_rates_get_unit .btn_wait_list');
    const unitCountText = rent.find('.facility_rates_size span#uta').text().trim();
    const unitCount = parseInt(unitCountText, 10);

    return waitListButton.length === 0 && unitCount > 0;
}
// Function to extract special offers for template one
export function extractSpecialOfferForTemplate3($: cheerio.CheerioAPI): string | null {
    const specialOffer = $('.special-offer').text().trim();
    return specialOffer || null;
}