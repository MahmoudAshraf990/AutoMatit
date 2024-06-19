import { parseAddress } from 'addresser';
export type AddressComponents = z.infer<typeof AddressComponentsSchema>;
import { z } from 'zod';
export const AddressComponentsSchema = z.object({
    address: z.string().optional().describe("the street address of the address. For example, 123 Main St. Do not include the unit, suite, or anything like that. Just the street address"),
    city: z.string().optional().describe("the city of the address. For example, San Francisco"),
    state: z.string().describe("a two-letter, capital, abbreviation of the state. For example CA for California, or NY for New York. If a Canada address, include the province two character abbreviation still."),
    zip: z.string().optional().describe("the zip code of the address. For example, 94114")
})

export async function extractAddress(rawAddressText: string, attemptedExtractedAddress: string, fallBackToClause: boolean = true): Promise<AddressComponents | undefined> {
    try {
        const brokenDownAddress = parseAddress(attemptedExtractedAddress)
        return {
            address: brokenDownAddress.addressLine1,
            zip: brokenDownAddress.zipCode,
            city: brokenDownAddress.placeName,
            state: brokenDownAddress.stateAbbreviation
        }
    } catch (e) {
            console.log("could not parse address: ", e)
            return undefined
    }
}