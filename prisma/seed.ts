import "dotenv/config";

import {
  PrismaClient,
  Role,
  FeedbackStatus,
  Sentiment,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const channels = [
  "WEB",
  "CSV",
  "EMAIL",
  "SUPPORT",
  "APP_STORE",
  "SURVEY",
];

const themesData = [
  {
    name: "Onboarding",
    description:
      "Feedback related to account setup and onboarding experience.",
    color: "#6366f1",
  },
  {
    name: "Checkout",
    description: "Feedback related to checkout and purchasing.",
    color: "#8b5cf6",
  },
  {
    name: "Performance",
    description:
      "Feedback related to application speed and performance.",
    color: "#ec4899",
  },
  {
    name: "Notifications",
    description:
      "Feedback related to alerts and notifications.",
    color: "#f59e0b",
  },
  {
    name: "Mobile App",
    description:
      "Feedback related to the mobile application experience.",
    color: "#10b981",
  },
  {
    name: "Payments",
    description:
      "Feedback related to payments and transactions.",
    color: "#06b6d4",
  },
  {
    name: "Search",
    description:
      "Feedback related to search and discovery.",
    color: "#3b82f6",
  },
  {
    name: "User Experience",
    description:
      "General usability and user experience feedback.",
    color: "#f97316",
  },
];

const positiveFeedback = [
  "The onboarding process was simple and easy to understand.",
  "Checkout was quick and the payment confirmation was clear.",
  "The application feels much faster after the latest update.",
  "I really like the new notification controls.",
  "The mobile app is much easier to use now.",
  "Payment processing was smooth and completed immediately.",
  "The search results are accurate and easy to navigate.",
  "The overall user experience is clean and intuitive.",
  "The new dashboard makes it easy to understand our data.",
  "I had a great experience using the application today.",
];

const neutralFeedback = [
  "The onboarding process was okay but could be clearer.",
  "Checkout worked as expected.",
  "The application performance is acceptable.",
  "Notifications are working normally.",
  "The mobile app provides the features I need.",
  "Payment was completed successfully.",
  "Search works but could provide more filtering options.",
  "The interface is usable but takes some time to learn.",
  "The dashboard provides the information I need.",
  "Everything worked as expected during my session.",
];

const negativeFeedback = [
  "The onboarding steps are confusing and I did not know what to do next.",
  "Checkout failed several times before the payment finally worked.",
  "The application becomes very slow when opening large pages.",
  "I receive too many notifications and cannot easily control them.",
  "The mobile app freezes whenever I open the order history.",
  "My payment failed even though the money was deducted.",
  "The search results are often irrelevant.",
  "The interface is confusing and difficult to navigate.",
  "The dashboard takes too long to load.",
  "The application crashed while I was completing an important task.",
];

const names = [
  "Aarav",
  "Maya",
  "Rohan",
  "Sara",
  "Arjun",
  "Priya",
  "Rahul",
  "Ananya",
  "Vikram",
  "Neha",
  "Kiran",
  "Meera",
];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomSentiment(): Sentiment {
  const value = Math.random();

  if (value < 0.54) return Sentiment.POSITIVE;
  if (value < 0.81) return Sentiment.NEGATIVE;

  return Sentiment.NEUTRAL;
}

function getFeedbackContent(sentiment: Sentiment): string {
  if (sentiment === Sentiment.POSITIVE) {
    return randomItem(positiveFeedback);
  }

  if (sentiment === Sentiment.NEGATIVE) {
    return randomItem(negativeFeedback);
  }

  return randomItem(neutralFeedback);
}

function getSentimentScore(sentiment: Sentiment): number {
  if (sentiment === Sentiment.POSITIVE) {
    return Number((0.55 + Math.random() * 0.44).toFixed(2));
  }

  if (sentiment === Sentiment.NEGATIVE) {
    return Number((-0.55 - Math.random() * 0.44).toFixed(2));
  }

  return Number((-0.2 + Math.random() * 0.4).toFixed(2));
}

function getStatus(): FeedbackStatus {
  const value = Math.random();

  if (value < 0.55) return FeedbackStatus.NEW;
  if (value < 0.85) return FeedbackStatus.REVIEWED;

  return FeedbackStatus.ACTIONED;
}

function getCreatedAt(index: number): Date {
  const daysAgo = index % 30;

  const date = new Date();

  date.setDate(date.getDate() - daysAgo);

  date.setHours(
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
    0,
    0
  );

  return date;
}

async function main() {
  console.log("🌱 Starting LOOP database seed...");

  /*
   * -------------------------------------------------------
   * 1. Clean existing demo data
   * -------------------------------------------------------
   */

  await prisma.feedbackTheme.deleteMany();

  await prisma.embedding.deleteMany();

  await prisma.feedback.deleteMany();

  await prisma.report.deleteMany();

  await prisma.theme.deleteMany();

  await prisma.user.deleteMany();

  await prisma.workspace.deleteMany();

  /*
   * -------------------------------------------------------
   * 2. Create workspace
   * -------------------------------------------------------
   */

  const workspace = await prisma.workspace.create({
    data: {
      name: "LOOP Demo Workspace",
    },
  });

  console.log(`✅ Workspace created: ${workspace.name}`);

  /*
   * -------------------------------------------------------
   * 3. Password
   * -------------------------------------------------------
   */

  const passwordHash = await bcrypt.hash("Password123!", 12);

  /*
   * -------------------------------------------------------
   * 4. Create users
   * -------------------------------------------------------
   */

  const admin = await prisma.user.create({
    data: {
      name: "LOOP Admin",
      email: "admin@loop.demo",
      passwordHash,
      role: Role.ADMIN,
      workspaceId: workspace.id,
    },
  });

  const analyst = await prisma.user.create({
    data: {
      name: "LOOP Analyst",
      email: "analyst@loop.demo",
      passwordHash,
      role: Role.ANALYST,
      workspaceId: workspace.id,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: "LOOP Viewer",
      email: "viewer@loop.demo",
      passwordHash,
      role: Role.VIEWER,
      workspaceId: workspace.id,
    },
  });

  console.log("✅ Created ADMIN, ANALYST and VIEWER users");

  /*
   * -------------------------------------------------------
   * 5. Create themes
   * -------------------------------------------------------
   */

  const themes = [];

  for (const themeData of themesData) {
    const theme = await prisma.theme.create({
      data: {
        ...themeData,
        workspaceId: workspace.id,
      },
    });

    themes.push(theme);
  }

  console.log(`✅ Created ${themes.length} themes`);

  /*
   * -------------------------------------------------------
   * 6. Create 125 feedback records
   * -------------------------------------------------------
   */

  const feedbackRecords = [];

  for (let i = 0; i < 125; i++) {
    const sentiment = randomSentiment();

    const feedback = await prisma.feedback.create({
      data: {
        content: getFeedbackContent(sentiment),
        channel: randomItem(channels),
        sourceRef: `DEMO-${String(i + 1).padStart(4, "0")}`,
        customerLabel: randomItem(names),
        sentiment,
        sentimentScore: getSentimentScore(sentiment),
        status: getStatus(),
        createdAt: getCreatedAt(i),
        workspaceId: workspace.id,
      },
    });

    feedbackRecords.push(feedback);
  }

  console.log(`✅ Created ${feedbackRecords.length} feedback records`);

  /*
   * -------------------------------------------------------
   * 7. Create FeedbackTheme relationships
   * -------------------------------------------------------
   */

  let relationshipCount = 0;

  for (const feedback of feedbackRecords) {
    const numberOfThemes = Math.random() < 0.7 ? 1 : 2;

    const selectedThemes = [...themes]
      .sort(() => Math.random() - 0.5)
      .slice(0, numberOfThemes);

    for (const theme of selectedThemes) {
      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: theme.id,
          confidence: Number(
            (0.65 + Math.random() * 0.34).toFixed(2)
          ),
        },
      });

      relationshipCount++;
    }
  }

  console.log(
    `✅ Created ${relationshipCount} FeedbackTheme relationships`
  );

  /*
   * -------------------------------------------------------
   * 8. Create one demo report
   * -------------------------------------------------------
   */

  const periodEnd = new Date();

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 7);

  await prisma.report.create({
    data: {
      title: "Weekly Voice of Customer",
      periodStart,
      periodEnd,
      contentJson: {
        summary:
          "Customers are positive about the overall experience while reporting some friction in onboarding, checkout and mobile performance.",
        generatedBy: admin.id,
        topThemes: [
          {
            name: "Onboarding",
            count: 31,
          },
          {
            name: "Checkout",
            count: 24,
          },
          {
            name: "Performance",
            count: 22,
          },
        ],
      },
      workspaceId: workspace.id,
      generatedBy: admin.id,
    },
  });

  console.log("✅ Created demo report");

  /*
   * -------------------------------------------------------
   * 9. Final summary
   * -------------------------------------------------------
   */

  console.log("\n🎉 LOOP database seed completed successfully!");
  console.log("------------------------------------------");
  console.log(`Workspace : ${workspace.name}`);
  console.log(`Users     : 3`);
  console.log(`Feedback  : ${feedbackRecords.length}`);
  console.log(`Themes    : ${themes.length}`);
  console.log(`Reports   : 1`);
  console.log("------------------------------------------");

  console.log("\nDemo login credentials:");
  console.log("ADMIN   : admin@loop.demo / Password123!");
  console.log("ANALYST : analyst@loop.demo / Password123!");
  console.log("VIEWER  : viewer@loop.demo / Password123!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });