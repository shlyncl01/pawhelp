const OFFSET_HOURS = Number(process.env.TZ_OFFSET_HOURS ?? 8);

export const todayString = () =>
  new Date(Date.now() + OFFSET_HOURS * 3600 * 1000).toISOString().slice(0, 10);

export const addDays = (dateString, days) => {
  const d = new Date(`${dateString}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};