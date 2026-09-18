export type SimulatedChannel = {
  key: "SUPPORT" | "APP_STORE" | "SURVEY" | "SALES";
  label: string;
  description: string;
  items: Array<{ text: string; customerLabel: string }>;
};

export const simulatedChannels: SimulatedChannel[] = [
  {
    key: "SUPPORT",
    label: "Support Tickets",
    description: "Simulated customer support conversations",
    items: [
      { text: "Onboarding took forever — I couldn't figure out how to invite my team.", customerLabel: "Aarav" },
      { text: "Billing page keeps timing out when I try to download an invoice.", customerLabel: "Meera" },
      { text: "Support replied within an hour and fixed my login issue right away.", customerLabel: "Rohan" },
      { text: "Can't reset my password — the reset email never arrives.", customerLabel: "Divya" },
      { text: "The export feature crashed twice while downloading a large report.", customerLabel: "Karthik" },
      { text: "Really appreciated how patient the support agent was walking me through setup.", customerLabel: "Priya" }
    ]
  },
  {
    key: "APP_STORE",
    label: "App Store Reviews",
    description: "Simulated public app store ratings and comments",
    items: [
      { text: "The new dashboard is gorgeous and finally fast. Huge improvement.", customerLabel: "app_user_204" },
      { text: "Crashes every time I try to open notifications on iOS 18.", customerLabel: "app_user_318" },
      { text: "Love the new export feature, saved me an hour today.", customerLabel: "app_user_112" },
      { text: "Search is still really slow when I have a lot of items.", customerLabel: "app_user_477" },
      { text: "Clean UI, easy to navigate, does exactly what I need.", customerLabel: "app_user_090" }
    ]
  },
  {
    key: "SURVEY",
    label: "NPS Surveys",
    description: "Simulated NPS/CSAT free-text responses",
    items: [
      { text: "It does the job, but the mobile experience needs work.", customerLabel: "Survey respondent 41" },
      { text: "Would recommend to a colleague — great value for the price.", customerLabel: "Survey respondent 12" },
      { text: "Wish there was a dark mode, otherwise solid product.", customerLabel: "Survey respondent 77" },
      { text: "Customer support response time could be faster.", customerLabel: "Survey respondent 5" },
      { text: "Everything I need in one place — very happy overall.", customerLabel: "Survey respondent 63" }
    ]
  },
  {
    key: "SALES",
    label: "Sales Notes",
    description: "Simulated notes from sales and success calls",
    items: [
      { text: "Prospect wants SSO before they'll sign — third time this month.", customerLabel: "Deal: Northwind Co." },
      { text: "Customer asked about a bulk-export API for their data team.", customerLabel: "Deal: Verdant Labs" },
      { text: "Renewal call went well, main ask was better onboarding docs.", customerLabel: "Deal: Atlas Retail" },
      { text: "Lost deal — competitor offered a cheaper enterprise tier.", customerLabel: "Deal: Solstice Inc." }
    ]
  }
];