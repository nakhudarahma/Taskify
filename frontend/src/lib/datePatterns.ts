import { addDays, format, nextFriday, nextMonday, nextSaturday, nextSunday, nextThursday, nextTuesday, nextWednesday } from "date-fns";

export interface ExtractedDateTime {
    title: string;
    date?: string; // YYYY-MM-DD
    time?: string; // HH:MM (24-hour)
}

export function extractDateAndTime(text: string): ExtractedDateTime {
    const lowerText = text.toLowerCase();
    let date: string | undefined;
    let time: string | undefined;
    let cleanTitle = text;

    // Helper to remove match from title (case-insensitive)
    const removeFromTitle = (match: string) => {
        const regex = new RegExp(`\\b${escapeRegExp(match)}\\b`, 'gi');
        cleanTitle = cleanTitle.replace(regex, '').replace(/\s+/g, ' ').trim();
    };

    // Helper to escape regex special characters
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // --- Date Extraction ---
    const today = new Date();
    let dateMatchString = "";

    if (lowerText.includes("day after tomorrow")) {
        date = format(addDays(today, 2), "yyyy-MM-dd");
        dateMatchString = "day after tomorrow";
    } else if (lowerText.includes("tomorrow")) {
        date = format(addDays(today, 1), "yyyy-MM-dd");
        dateMatchString = "tomorrow";
    } else if (lowerText.includes("today")) {
        date = format(today, "yyyy-MM-dd");
        dateMatchString = "today";
    } else {
        // Weekdays
        const days = [
            { name: "next monday", fn: nextMonday },
            { name: "next tuesday", fn: nextTuesday },
            { name: "next wednesday", fn: nextWednesday },
            { name: "next thursday", fn: nextThursday },
            { name: "next friday", fn: nextFriday },
            { name: "next saturday", fn: nextSaturday },
            { name: "next sunday", fn: nextSunday },
            { name: "monday", fn: nextMonday },
            { name: "tuesday", fn: nextTuesday },
            { name: "wednesday", fn: nextWednesday },
            { name: "thursday", fn: nextThursday },
            { name: "friday", fn: nextFriday },
            { name: "saturday", fn: nextSaturday },
            { name: "sunday", fn: nextSunday },
        ];

        for (const day of days) {
            if (lowerText.includes(day.name)) {
                date = format(day.fn(today), "yyyy-MM-dd");
                dateMatchString = day.name;
                break;
            }
        }
    }

    if (dateMatchString) {
        removeFromTitle(dateMatchString);
    }

    // --- Time Extraction ---
    // Match "at 5pm", "at 5 pm", "5pm", "5:30pm", "17:00"
    // Patterns:
    // 1. HH:MM (24-hour) -> 14:30
    // 2. H:MM am/pm -> 5:30 pm
    // 3. H am/pm -> 5 pm
    // 4. "noon", "midnight"

    const timeRegex24 = /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/;
    const timeRegex12 = /\b(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm|p\.m\.|a\.m\.|p\.m|a\.m)\b/i;

    const match24 = lowerText.match(timeRegex24);
    const match12 = lowerText.match(timeRegex12);

    let timeMatchString = "";

    if (match12) {
        timeMatchString = match12[0];
        let h = parseInt(match12[1]);
        const m = match12[2] || "00";
        const ampm = match12[3].toLowerCase().replace(/\./g, '');

        if (ampm === "pm" && h < 12) h += 12;
        if (ampm === "am" && h === 12) h = 0;

        time = `${h.toString().padStart(2, '0')}:${m}`;
    } else if (match24) {
        timeMatchString = match24[0];
        // Already HH:MM
        let h = parseInt(match24[1]);
        let m = match24[2];
        time = `${h.toString().padStart(2, '0')}:${m}`;
    } else if (lowerText.includes("noon")) {
        timeMatchString = "noon";
        time = "12:00";
    } else if (lowerText.includes("midnight")) {
        timeMatchString = "midnight";
        time = "00:00";
    } else if (lowerText.includes("morning")) {
        timeMatchString = "morning";
        time = "09:00"; // Default morning
    } else if (lowerText.includes("afternoon")) {
        timeMatchString = "afternoon";
        time = "14:00"; // Default afternoon
    } else if (lowerText.includes("evening")) {
        timeMatchString = "evening";
        time = "18:00"; // Default evening
    } else if (lowerText.includes("tonight")) {
        timeMatchString = "tonight";
        time = "20:00"; // Default night
    }

    if (timeMatchString) {
        // Special case: if we matched 'at 5pm', we want to remove 'at' as well if it immediately precedes the time
        // The regex only matched the time part.
        // We will do a generic cleanup of prepositions later.
        removeFromTitle(timeMatchString);
    }

    // --- Cleanup Prepositions ---
    // Remove "at", "by", "due", "on" if they are at the end of the string or dangling
    // Also remove "due" if it was before the date.
    // simpler approach: replace "due [date]" pattern if we found a date.

    // Better approach: Since we removed the specific date/time strings, we might have dangling prepositions.
    // e.g. "Do manual task at [REMOVED]" -> "Do manual task at"
    // Clean up trailing prepositions
    const prepositions = ["at", "by", "on", "due", "due on", "due by"];

    // We loop effectively to handle "due on" which becomes "due" after "on" is removed, etc.
    // Or just regex replace trailing words.

    cleanTitle = cleanTitle.trim();

    // Remove trailing prepositions
    // Regex matches " word" at end of string where word is one of the list
    const trailingPrepRegex = new RegExp(`\\s+(?:${prepositions.join('|')})$`, 'i');
    while (trailingPrepRegex.test(cleanTitle)) {
        cleanTitle = cleanTitle.replace(trailingPrepRegex, '').trim();
    }

    // Also remove leading "due " if the user started with "Due tomorrow..."
    // Though usually that's the whole sentence.
    // Let's handle "Task due" specifically inside the sentence?
    // "Python assignment due [REMOVED]" -> "Python assignment due" -> "Python assignment"

    return { title: cleanTitle, date, time };
}
