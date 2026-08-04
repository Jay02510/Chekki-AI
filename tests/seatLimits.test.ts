import { describe, it, expect } from 'vitest';
import { maxClassesForSeats, maxInvitesForRole } from '../api/_lib/seatLimits';

describe('maxClassesForSeats', () => {
  it('gives an unconfirmed/no-school account a single trial class', () => {
    expect(maxClassesForSeats(undefined)).toBe(1);
    expect(maxClassesForSeats(null)).toBe(1);
  });

  it('sums ft + kt seats', () => {
    expect(maxClassesForSeats({ ft: 6, kt: 4 })).toBe(10);
  });

  it('never returns less than 1 even if seatsTotal is zeroed out', () => {
    expect(maxClassesForSeats({ ft: 0, kt: 0 })).toBe(1);
  });

  it('treats a missing ft or kt field as 0', () => {
    expect(maxClassesForSeats({ ft: 2 })).toBe(2);
    expect(maxClassesForSeats({ kt: 3 })).toBe(3);
  });
});

describe('maxInvitesForRole', () => {
  it('reads the seat count for the requested role', () => {
    expect(maxInvitesForRole({ ft: 6, kt: 4 }, 'ft')).toBe(6);
    expect(maxInvitesForRole({ ft: 6, kt: 4 }, 'kt')).toBe(4);
  });

  it('defaults to 0 when seatsTotal or the role field is missing', () => {
    expect(maxInvitesForRole(undefined, 'ft')).toBe(0);
    expect(maxInvitesForRole(null, 'kt')).toBe(0);
    expect(maxInvitesForRole({ ft: 6 }, 'kt')).toBe(0);
  });
});
