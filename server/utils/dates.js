const OFFSET_HOURS = Number(process.env.TZ_OFFSET_HOURS ?? 8);

export const todayString = () =>
  new Date(Date.now() + OFFSET_HOURS * 3600 * 1000).toISOString().slice(0, 10);