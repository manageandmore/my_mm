export const ONE_HOUR = 3600;
export const TWO_HOURS = ONE_HOUR * 2;
export const ONE_DAY = ONE_HOUR * 24;
export const TWO_DAYS = ONE_DAY * 2;
export const ONE_WEEK = ONE_DAY * 7;
export const TWO_WEEKS = ONE_WEEK * 2;

/**
 * Returns the time between now and some date as a formatted duration.
 * May return values like 'a few seconds', '3 minutes', 'a day' or '53 weeks'
 *
 * @param date The starting date.
 * @returns The formatted duration.
 */
export function timeSince(date: string): string {
  var seconds = Math.floor((Date.now() - Date.parse(date)) / 1000);

  if (seconds < 30) {
    return "a few seconds";
  } else if (seconds < 90) {
    return "a minute";
  } else if (seconds < ONE_HOUR) {
    var minutes = Math.floor(seconds / 60);
    return `${minutes} minutes`;
  } else if (seconds < TWO_HOURS) {
    return "an hour";
  } else if (seconds < ONE_DAY) {
    var hours = Math.floor(seconds / ONE_HOUR);
    return `${hours} hours`;
  } else if (seconds < TWO_DAYS) {
    return "a day";
  } else if (seconds < ONE_WEEK) {
    var days = Math.floor(seconds / ONE_DAY);
    return `${days} days`;
  } else if (seconds < TWO_WEEKS) {
    return "a week";
  } else {
    var weeks = Math.floor(seconds / ONE_WEEK);
    return `${weeks} weeks`;
  }
}

export function timeDisplay(date: string): string {
  var seconds = Math.floor((Date.parse(date) - Date.now()) / 1000);

  function toTime(unit: number, cut: number | null, tag: string): string {
    var n = Math.floor((seconds % (cut ?? seconds + 1)) / unit);
    return n.toString().padStart(2, "0") + tag;
  }

  let result =
    `${toTime(ONE_DAY, null, "d")} ` +
    `${toTime(ONE_HOUR, ONE_DAY, "h")} ` +
    `${toTime(60, ONE_HOUR, "m")}`;
  return result;
}

/**
 * Transforms a duration in milliseconds into a human readable string.
 *
 * E.g. "less than one hour", "3 hours", "one day", "2 weeks"
 */
export function asReadableDuration(millis: number): string {
  var seconds = millis / 1000;
  var minutes = seconds / 60;
  var hours = minutes / 60;
  var days = hours / 24;
  var weeks = days / 7;

  if (hours < 1) {
    return "less than one hour";
  } else if (hours < 2) {
    return `one hour`;
  } else if (days < 1) {
    return `${Math.floor(hours)} hours`;
  } else if (days < 2) {
    return `one day`;
  } else if (weeks < 1) {
    return `${Math.floor(days)} days`;
  } else if (weeks < 2) {
    return "one week";
  } else {
    return `${Math.floor(weeks)} weeks`;
  }
}
