import type { EventTypeKey } from "../types";

export interface ChecklistTemplateItem {
  title: string;
  /** Days before the event the task is due. Due date = eventDate − offsetDays. */
  offsetDays: number;
}

// A curated wedding planning timeline. Offsets are "days before the day".
const WEDDING: ChecklistTemplateItem[] = [
  // ~12 months out
  { title: "Set your wedding budget", offsetDays: 365 },
  { title: "Draft your guest list", offsetDays: 365 },
  { title: "Choose your wedding party", offsetDays: 360 },
  { title: "Book your venue", offsetDays: 350 },
  { title: "Start researching photographers", offsetDays: 340 },
  { title: "Book a photographer", offsetDays: 320 },
  { title: "Book a caterer", offsetDays: 320 },
  // ~9 months
  { title: "Book a band or DJ", offsetDays: 270 },
  { title: "Order your wedding dress", offsetDays: 270 },
  { title: "Book your florist", offsetDays: 255 },
  { title: "Book the officiant", offsetDays: 255 },
  { title: "Reserve a hotel room block for guests", offsetDays: 240 },
  { title: "Book transport for the day", offsetDays: 240 },
  // ~6 months
  { title: "Send save-the-dates", offsetDays: 180 },
  { title: "Start your gift registry", offsetDays: 180 },
  { title: "Plan the honeymoon", offsetDays: 175 },
  { title: "Order invitations", offsetDays: 165 },
  { title: "Choose the wedding cake", offsetDays: 160 },
  { title: "Arrange any rentals (chairs, linens, décor)", offsetDays: 160 },
  { title: "Schedule dress fittings", offsetDays: 150 },
  // ~4 months
  { title: "Book hair and makeup", offsetDays: 120 },
  { title: "Finalise the menu and tasting", offsetDays: 120 },
  { title: "Buy the wedding rings", offsetDays: 110 },
  { title: "Plan the rehearsal dinner", offsetDays: 100 },
  { title: "Arrange ceremony readings and music", offsetDays: 95 },
  // ~2 months
  { title: "Send the invitations", offsetDays: 60 },
  { title: "Order wedding favours", offsetDays: 55 },
  { title: "Write your vows", offsetDays: 50 },
  { title: "Confirm details with all vendors", offsetDays: 45 },
  { title: "Buy gifts for the wedding party", offsetDays: 45 },
  // ~1 month
  { title: "Apply for the marriage licence", offsetDays: 30 },
  { title: "Final dress fitting", offsetDays: 28 },
  { title: "Chase up missing RSVPs", offsetDays: 25 },
  { title: "Give the caterer a final headcount", offsetDays: 21 },
  { title: "Finalise the seating plan", offsetDays: 18 },
  { title: "Make final payments to vendors", offsetDays: 14 },
  { title: "Confirm the day-of timeline with everyone", offsetDays: 14 },
  // final week
  { title: "Break in your wedding shoes", offsetDays: 10 },
  { title: "Delegate day-of responsibilities", offsetDays: 7 },
  { title: "Pack for the honeymoon", offsetDays: 5 },
  { title: "Confirm transport and timings", offsetDays: 3 },
  { title: "Pick up the rings and attire", offsetDays: 2 },
  { title: "Rehearsal and rehearsal dinner", offsetDays: 1 },
  // day of
  { title: "Relax and enjoy your wedding day 🎉", offsetDays: 0 },
];

const TEMPLATES: Partial<Record<EventTypeKey, ChecklistTemplateItem[]>> = {
  wedding: WEDDING,
};

export function checklistTemplateFor(eventType: EventTypeKey): ChecklistTemplateItem[] {
  return TEMPLATES[eventType] ?? [];
}

export function hasChecklistTemplate(eventType: EventTypeKey): boolean {
  return (TEMPLATES[eventType]?.length ?? 0) > 0;
}
