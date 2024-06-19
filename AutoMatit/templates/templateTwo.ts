import * as cheerio from 'cheerio';

export const extractTemplate2 = ($: cheerio.CheerioAPI, cleanAddress: (address: string) => string) => {
    const address = cleanAddress(
        $('.facility_info .address span')
            .map((_, el) => $(el).text().trim())
            .get()
            .join(' ')
    );
    const phone = $('.facility_info .phone a').text().trim();
    return { address, phone };
};

export async function scrapeUnitDetailsForTemplate2($: cheerio.CheerioAPI): Promise<any[]> {
    try {
        const unitDetails: any[] = [];

        $(".unit_row").each((_, element) => {
            const unitSize = $(element).find('.unit_size').text().trim();
            const unitType = $(element).find('.unit_details .type').text().trim();
            const rent = $(element).find('.monthly_rent .now').text().trim();
            const reserveLink = $(element).attr('data-link')?.trim();
            const holdLink = null; //  no hold link for this template

            
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


export function extractLatLngForTemplate2($: cheerio.CheerioAPI): { lat: number, lng: number } | null {

    const lat = parseFloat($('#loc_map').attr('data-lat') || '');
    const lng = parseFloat($('#loc_map').attr('data-lng') || '');

    if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
    }

    return null;
}

export function isUnitAvailableForTemplate2($: cheerio.CheerioAPI): boolean {
    let isAvailable = false;

    $('.unit_row').each((_, element) => {
        const hasContinueButton = $(element).find('.rate_button .reserve_btn').text().toLowerCase().includes('continue');
        const hasWaitlistButton = $(element).find('.rate_button .waitlist').length > 0;

        // Determine availability by the presence of 'Continue' button and absence of 'Waitlist' button
        if (hasContinueButton && !hasWaitlistButton) {
            isAvailable = true;
        }
    });

    return isAvailable;
}

// Function to extract special offers for template one
export function extractSpecialOfferForTemplate2($: cheerio.CheerioAPI): string | null {
    const specialOffer = $('.special_offers').text().trim();
    return specialOffer.length > 0 ? specialOffer : null;
}



