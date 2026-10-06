// Landing pages log GA4 events without putting the Firebase SDK on their
// critical path — it loads in the background on the first event.
export function track(eventName: string, params?: Record<string, unknown>): void {
  import('../../services/database')
    .then(({ db }) => db.logUserEvent(eventName, params))
    .catch(() => {});
}
