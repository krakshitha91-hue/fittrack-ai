function formatDateInIndia(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function getTodayDate() {
  return formatDateInIndia(new Date());
}

export function getRecordDate(record) {
  if (record.date && /^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
    return record.date;
  }

  return record.createdAt ? formatDateInIndia(new Date(record.createdAt)) : "";
}
