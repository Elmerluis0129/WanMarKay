import { addFrequency, calculateDaysRemaining } from './dateUtils';

describe('addFrequency', () => {
  it('should add one day for daily frequency', () => {
    const date = new Date(2025, 3, 30);
    const result = addFrequency(date, 'daily');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(1);
  });

  it('should add seven days for weekly frequency', () => {
    const date = new Date(2025, 3, 30);
    const result = addFrequency(date, 'weekly');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(7);
  });

  it('should add fourteen days for biweekly frequency', () => {
    const date = new Date(2025, 3, 30);
    const result = addFrequency(date, 'biweekly');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(14);
  });

  it('should add one month for monthly frequency', () => {
    const date = new Date(2025, 3, 30);
    const result = addFrequency(date, 'monthly');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(30);
  });
});

describe('calculateDaysRemaining', () => {
  it('should return 30 days remaining for dates one month apart', () => {
    const reference = new Date(2025, 3, 30);
    const next = new Date(2025, 4, 30);
    expect(calculateDaysRemaining(next, reference)).toBe(30);
  });

  it('should return 0 days remaining when nextDate equals referenceDate', () => {
    const reference = new Date(2025, 4, 1);
    const next = new Date(2025, 4, 1);
    expect(calculateDaysRemaining(next, reference)).toBe(0);
  });

  it('should return negative days for past dates', () => {
    const reference = new Date(2025, 4, 30);
    const next = new Date(2025, 3, 30);
    expect(calculateDaysRemaining(next, reference)).toBe(-30);
  });

  it('should round up partial days to next whole day', () => {
    const reference = new Date(2025, 4, 1, 12, 0, 0);
    const next = new Date(2025, 4, 2, 6, 0, 0);
    expect(calculateDaysRemaining(next, reference)).toBe(1);
  });
}); 