// YYYY-MM-DD in the device's own time zone. toISOString() gives the UTC date,
// which in Korea (UTC+9) is still yesterday until 9am.
export const localDate = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Korea's date (UTC+9, no DST) for the parent daily quotas. The server and
// every client must agree on the day key, so this doesn't use the device's
// zone. Before, both used the UTC date, so "today" reset at 9am in Korea.
export const kstDate = (d: Date = new Date()) => new Date(d.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
