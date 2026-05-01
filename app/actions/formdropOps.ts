"use server";

const FORMDROP_API_BASE = "https://api.formdrop.io";
const PRIVATE_KEY = process.env.FORMDROP_PRIVATE_KEY;

export async function fetchFormDropForms() {
    if (!PRIVATE_KEY) {
        console.error("FORMDROP_PRIVATE_KEY is not defined");
        return [];
    }

    try {
        const response = await fetch(`${FORMDROP_API_BASE}/forms`, {
            headers: {
                Authorization: `Bearer ${PRIVATE_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch forms: ${response.statusText}`);
        }

        const data = await response.json();
        return data.forms || [];
    } catch (error) {
        console.error("Error fetching FormDrop forms:", error);
        return [];
    }
}

export async function fetchFormDropSubmissions(formId: string) {
    if (!PRIVATE_KEY) {
        console.error("FORMDROP_PRIVATE_KEY is not defined");
        return [];
    }

    try {
        const response = await fetch(`${FORMDROP_API_BASE}/${formId}/submissions`, {
            headers: {
                Authorization: `Bearer ${PRIVATE_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch submissions: ${response.statusText}`);
        }

        const data = await response.json();
        return data.submissions || [];
    } catch (error) {
        console.error("Error fetching FormDrop submissions:", error);
        return [];
    }
}
