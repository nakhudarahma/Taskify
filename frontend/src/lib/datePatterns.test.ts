import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { extractDateAndTime } from './datePatterns';
import { addDays, format, nextFriday } from 'date-fns';

describe('extractDateAndTime', () => {
    const mockDate = new Date('2024-03-10T10:00:00'); // It's a Sunday

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('extracts "tomorrow" correctly', () => {
        const result = extractDateAndTime("Remind me to call John tomorrow");
        const expectedDate = format(addDays(mockDate, 1), 'yyyy-MM-dd'); // 2024-03-11
        expect(result.date).toBe(expectedDate);
    });

    it('extracts "today" correctly', () => {
        const result = extractDateAndTime("Do laundry today");
        const expectedDate = format(mockDate, 'yyyy-MM-dd'); // 2024-03-10
        expect(result.date).toBe(expectedDate);
    });

    it('extracts "next friday" correctly', () => {
        const result = extractDateAndTime("Party next friday");
        const expectedDate = format(nextFriday(mockDate), 'yyyy-MM-dd');
        expect(result.date).toBe(expectedDate);
    });

    it('extracts time "5pm" correctly', () => {
        const result = extractDateAndTime("Meeting at 5pm");
        expect(result.time).toBe('17:00');
    });

    it('extracts time "5:30 pm" correctly', () => {
        const result = extractDateAndTime("Meeting at 5:30 pm");
        expect(result.time).toBe('17:30');
    });

    it('extracts time "10 am" correctly', () => {
        const result = extractDateAndTime("Brunch at 10 am");
        expect(result.time).toBe('10:00');
    });

    it('extracts time "17:00" correctly', () => {
        const result = extractDateAndTime("Call at 17:00");
        expect(result.time).toBe('17:00');
    });

    it('extracts both date and time', () => {
        const result = extractDateAndTime("Meeting tomorrow at 2pm");
        const expectedDate = format(addDays(mockDate, 1), 'yyyy-MM-dd');
        expect(result.date).toBe(expectedDate);
        expect(result.time).toBe('14:00');
    });

    it('extracts "noon" and "midnight"', () => {
        expect(extractDateAndTime("Lunch at noon").time).toBe('12:00');
        expect(extractDateAndTime("Sleep at midnight").time).toBe('00:00');
    });

    it('returns undefined for missing info', () => {
        const result = extractDateAndTime("Just a task");
        expect(result.date).toBeUndefined();
        expect(result.time).toBeUndefined();
    });

    // NEW TESTS FOR TITLE CLEANING
    it('cleans title from "tomorrow at 5 p.m"', () => {
        const result = extractDateAndTime("Python Assignment due tomorrow at 5 p.m");
        const expectedDate = format(addDays(mockDate, 1), 'yyyy-MM-dd');

        expect(result.date).toBe(expectedDate);
        expect(result.time).toBe('17:00');
        expect(result.title).toBe('Python Assignment');
    });

    it('cleans title from "by tonight"', () => {
        const result = extractDateAndTime("Finish math homework by tonight");
        expect(result.time).toBe('20:00'); // default night time
        expect(result.title).toBe('Finish math homework');
    });

    it('cleans title from "on Friday at 10am"', () => {
        const result = extractDateAndTime("Submit report on Friday at 10am");
        expect(result.time).toBe('10:00');
        expect(result.title).toBe('Submit report');
    });

    it('keeps title intact if no date/time found', () => {
        const result = extractDateAndTime("Buy groceries");
        expect(result.title).toBe('Buy groceries');
        expect(result.date).toBeUndefined();
        expect(result.time).toBeUndefined();
    });

    it('removes "due" if followed by date', () => {
        const result = extractDateAndTime("Project due next monday");

        expect(result.title).toBe('Project');
        expect(result.date).toBeDefined();
    });
});
