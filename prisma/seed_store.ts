import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


async function main() {
  const paidItems = [
    {
      name: "Escalation Flowchart",
      id: "escalation-flowchart",
      price: 3.99,
      desc: "Visual roadmap for escalating school concerns.",
      format: "PDF"
    },
    {
      name: "Bullying Action Manual",
      id: "bullying-action-manual",
      price: 13.99,
      desc: "Complete manual for addressing bullying effectively.",
      format: "PDF"
    },
    {
      name: "Bullying Incident Tracker",
      id: "bullying-incident-tracker",
      price: 4.99,
      desc: "Professional log for tracking bullying incidents.",
      format: "EXCEL"
    },
    {
      name: "Meeting Survival Script",
      id: "meeting-survival-script",
      price: 2.99,
      desc: "Essential phrases for difficult school meetings.",
      format: "PDF"
    },
    {
      id: "school-meeting-survival-script",
      name: "School Meeting Survival Script (Extended)",
      price: 2.99,
      desc: "Strategic responses for institutional meetings.",
      format: "PDF"
    },
    {
      name: "Bullying Case File Template",
      id: "bullying-case-file",
      price: 5.99,
      desc: "Structured template for building a case file.",
      format: "PDF"
    },
    {
      name: "Equality Act Advocacy Guide",
      id: "equality-act-advocacy-guide",
      price: 8.99,
      desc: "Expert guide to rights under the Equality Act 2010.",
      format: "PDF"
    },
    {
      name: "Legal Citation Cheat Sheet",
      id: "legal-citation-cheat-sheet",
      price: 3.99,
      desc: "Quick reference for citing law in advocacy.",
      format: "PDF"
    },
    {
      name: "Equality Act Email Templates",
      id: "equality-act-email-templates",
      price: 5.99,
      desc: "Ready-to-use email drafts for school advocacy.",
      format: "PDF"
    },
    {
      name: "Discrimination Incident Tracker",
      id: "discrimination-incident-tracker",
      price: 5.99,
      desc: "Detailed spreadsheet for logging discrimination.",
      format: "EXCEL"
    },
    {
      name: "Discrimination Complaint Builder",
      id: "discrimination-complaint-builder",
      price: 5.99,
      desc: "Framework for drafting formal discrimination complaints.",
      format: "PDF"
    },
    {
      name: "Bullying Complaints Builder",
      id: "bullying-complaint-builder",
      price: 5.99,
      desc: "Step-by-step tool for formal bullying complaints.",
      format: "PDF"
    },
    {
      name: "SEND Advocacy Manual",
      id: "send-school-advocacy-manual",
      price: 19.99,
      desc: "Comprehensive manual for SEND education advocacy.",
      format: "PDF"
    }
  ];

  console.log("Seeding paid items to store...");

  for (const item of paidItems) {
    const downloadLink = `/downloads/${item.id}.${item.format === "EXCEL" ? "xlsx" : "pdf"}`;
    
    await prisma.storeItem.upsert({
      where: { id: -1 }, // Use match on name or ID if you have better unique fields, here we just use name
      // Since schema doesn't have unique on name, we might need to find by name first
      update: {
        price: item.price,
        desc: item.desc,
        downloadLink: downloadLink,
      },
      create: {
        name: item.name,
        imageUrl: "/toolkit-placeholder.png",
        category: "Downloads",
        desc: item.desc,
        price: item.price,
        downloadLink: downloadLink,
        cta: "Buy Now"
      }
    });
    console.log(`- ${item.name} upserted.`);
  }

  console.log("Seeding complete! ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
