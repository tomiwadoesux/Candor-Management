/**
 * Three-letter country code for a model's nationality, for the comp-card facts.
 *
 * The records store a demonym ("NIGERIAN"), and the block wants three letters.
 * Truncating the demonym is the obvious way to get there and it is the wrong
 * one twice over:
 *
 *   - "NIGERIAN" cut to three letters is a racial slur, and the facts column
 *     renders lowercase, which is where it lands hardest. On an agency roster
 *     of Nigerian models this is not a hypothetical.
 *   - It is also the wrong country. In the three-letter codes people actually
 *     read — ISO 3166-1 alpha-3, and the IOC and FIFA sets that follow it —
 *     NIG is Niger. Nigeria is NGA.
 *
 * So this maps the demonym to the real alpha-3 code, which is what a printed
 * comp card or a passport uses. Codes are rendered uppercase by the caller so
 * they read as codes rather than as clipped words.
 *
 * Unknown demonyms fall back to their first three letters, uppercased, so a
 * new record always renders something — but add it to the map instead of
 * relying on that: the fallback is right for GHANAIAN (GHA) and wrong for
 * plenty of others (FRENCH would give FRE, not FRA).
 */
const ALPHA3 = {
  NIGERIAN: "NGA",
  GHANAIAN: "GHA",
  KENYAN: "KEN",
  "SOUTH AFRICAN": "ZAF",
  SENEGALESE: "SEN",
  IVORIAN: "CIV",
  CAMEROONIAN: "CMR",
  ETHIOPIAN: "ETH",
  MOROCCAN: "MAR",
  EGYPTIAN: "EGY",
  BRITISH: "GBR",
  IRISH: "IRL",
  FRENCH: "FRA",
  SPANISH: "ESP",
  PORTUGUESE: "PRT",
  ITALIAN: "ITA",
  GERMAN: "DEU",
  DUTCH: "NLD",
  BELGIAN: "BEL",
  DANISH: "DNK",
  SWEDISH: "SWE",
  NORWEGIAN: "NOR",
  POLISH: "POL",
  UKRAINIAN: "UKR",
  RUSSIAN: "RUS",
  AMERICAN: "USA",
  CANADIAN: "CAN",
  BRAZILIAN: "BRA",
  JAMAICAN: "JAM",
  AUSTRALIAN: "AUS",
  JAPANESE: "JPN",
  KOREAN: "KOR",
  CHINESE: "CHN",
  INDIAN: "IND",
};

export function countryCode(nationality) {
  if (!nationality) return "";
  const key = String(nationality).trim().toUpperCase();
  return ALPHA3[key] || key.slice(0, 3);
}
