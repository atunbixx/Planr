// Suggested meal choices for catering. Used as <datalist> suggestions on the host
// side and <select> options on the public RSVP — the field is free-text, so hosts
// and guests can type a custom/dietary choice and it still groups by exact value.
export const MEAL_OPTIONS = [
  "Chicken",
  "Beef",
  "Fish",
  "Vegetarian",
  "Vegan",
  "Kids meal",
] as const;
