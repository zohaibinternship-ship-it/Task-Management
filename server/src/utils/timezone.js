import { DateTime } from 'luxon';
import { env } from '../config/env.js';

// The spec explicitly warns against fragile manual string manipulation for time math and
// says the app timezone must be handled carefully — luxon gives us a correct, DST-safe day
// boundary in APP_TIMEZONE instead of hand-rolled offset arithmetic.
export function startOfTodayInAppTimezone() {
  return DateTime.now().setZone(env.timezone).startOf('day').toJSDate();
}
