import { StoreCategory, ParentNeed, PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL || ""
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const DOWNLOADS = [
    {
        id: "de-escalation-in-schools",
        title: "De-Escalation in Schools Guide",
        description: "Best practices for maintaining a calm and safe learning environment.",
        category: "Guides",
        format: "PDF",
    },
    {
        id: "de-escalation-scripts",
        title: "Teacher De-Escalation Scripts",
        description: "Insights and methods on reducing tension and aggression in the classroom.",
        category: "Manuals",
        format: "PDF",
    },
    {
        id: "diagnosis-navigation-guide",
        title: "Diagnosis Navigation Guide",
        description: "Navigating the NHS and school support systems during the diagnosis journey.",
        category: "Guides",
        format: "PDF",
    },
    {
        id: "gentle-parenting-workbook",
        title: "The Gentle Parenting Workbook",
        description: "For African parents breaking cycles without losing your roots.",
        category: "Workbooks",
        format: "PDF",
    },
    {
        id: "is-this-bullying",
        title: "Is This Bullying? Quiz & Guide",
        description: "Define and identify bullying vs. peer conflict with this helpful resource.",
        category: "Guides",
        format: "PDF",
    },
    {
        id: "language-audit-worksheet",
        title: "Teacher Language Audit Worksheet",
        description: "Self-reflection and professional development tool for educators.",
        category: "Manuals",
        format: "PDF",
    },
    {
        id: "lesson-planning-template",
        title: "Culturally Responsive Lesson Planning Template",
        description: "A structured template to help you design lessons that reflect and respect student diversity.",
        category: "Templates",
        format: "PDF",
    },
    {
        id: "managing-your-triggers",
        title: "Managing Your Triggers Workbook",
        description: "Self-reflection exercises to help parents identify and manage emotional triggers in parenting.",
        category: "Workbooks",
        format: "PDF",
    },
    {
        id: "masking-behaviour-guide",
        title: "Understanding Masking Behaviour",
        description: "Guide for parents and teachers on neurodivergent students who 'mask' at school.",
        category: "Guides",
        format: "PDF",
    },
    {
        id: "meeting-note-sheet",
        title: "Meeting Note Sheet",
        description: "Structured template for effective note-taking during meetings.",
        category: "Templates",
        format: "PDF",
    },
    {
        id: "meeting-record-sheet",
        title: "Meeting Record Sheet",
        description: "A comprehensive template to record every detail and follow-up from school meetings.",
        category: "Templates",
        format: "PDF",
    },
    {
        id: "recognising-parent-triggers",
        title: "Recognising Parent Triggers",
        description: "Identify what sets you off and how to stay regulated during school meetings.",
        category: "Workbooks",
        format: "PDF",
    },
    {
        id: "school-meeting-guide",
        title: "The School Meeting Guide",
        description: "What to say when schools dismiss your concerns.",
        category: "Manuals",
        format: "PDF",
    },
    {
        id: "send-diagnosis-guide",
        title: "SEND Diagnosis Guide",
        description: "A step-by-step roadmap from first concerns to diagnosis and beyond.",
        category: "Guides",
        format: "PDF",
    },
    {
        id: "send-formal-support-request",
        title: "Formal SEND Support Request",
        description: "Formal letter template to request statutory support.",
        category: "Templates",
        format: "PDF",
    },
    {
        id: "send-initial-support-request",
        title: "Initial SEND Support Request",
        description: "First contact template for schools regarding SEND concerns.",
        category: "Templates",
        format: "PDF",
    },
    {
        id: "send-support-plan-checker",
        title: "SEND Support Plan Checker",
        description: "Audit your child's SEND support plan to ensure it meets legal requirements.",
        category: "Checklists",
        format: "PDF",
    },
    {
        id: "tomorrow-morning-manual",
        title: "Tomorrow Morning Manual",
        description: "Practical strategies for educators to start the day with inclusive and culturally responsive practices.",
        category: "Guides",
        format: "PDF",
    },
    {
        id: "what-to-say-when-the-school-isnt-listening",
        title: "When the School Isn't Listening",
        description: "Strategies for when your concerns are being ignored or minimised.",
        category: "Guides",
        format: "PDF",
    }
];

function getParentNeedsByTitle(title: string): ParentNeed[] {
  const needs: ParentNeed[] = [];
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("send") || lowerTitle.includes("sen ") || lowerTitle.includes("special educational needs")) {
    needs.push(ParentNeed.SEND);
  }
  if (lowerTitle.includes("ehcp") || lowerTitle.includes("education health care plan")) {
    needs.push(ParentNeed.EHCP);
  }
  if (lowerTitle.includes("bullying")) {
    needs.push(ParentNeed.Bullying);
  }
  if (
    lowerTitle.includes("advocacy") || 
    lowerTitle.includes("school") || 
    lowerTitle.includes("equality act") || 
    lowerTitle.includes("discrimination") || 
    lowerTitle.includes("complaint") || 
    lowerTitle.includes("escalation") || 
    lowerTitle.includes("meeting") ||
    lowerTitle.includes("manual") ||
    lowerTitle.includes("toolkit") ||
    lowerTitle.includes("system")
  ) {
    if (!needs.includes(ParentNeed.SCHOOL_ISSUES)) {
        needs.push(ParentNeed.SCHOOL_ISSUES);
    }
  }

  return needs;
}

async function main() {
    console.log('--- SEEDING FREE RESOURCES (UPSERT) ---');

    for (const download of DOWNLOADS) {
        const computedNeeds = getParentNeedsByTitle(download.title);
        
        // Find existing by name
        const existing = await prisma.storeItem.findFirst({
            where: { name: download.title }
        });

        const storeItemData = {
            name: download.title,
            desc: download.description,
            imageUrl: "/toolkit-placeholder.png",
            category: StoreCategory.Free,
            price: 0,
            free: true,
            badge: "FREE",
            cta: "Get Free Copy",
            downloadLink: `/downloads/${download.id}.${download.format.toLowerCase()}`,
            parentNeeds: computedNeeds,
        };

        if (existing) {
            console.log(`Updating existing item: ${download.title}`);
            await prisma.storeItem.update({
                where: { id: existing.id },
                data: storeItemData
            });
        } else {
            console.log(`Creating new item: ${download.title}`);
            await prisma.storeItem.create({
                data: storeItemData
            });
        }
    }

    console.log('--- SEEDING COMPLETED ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        pool.end();
    });
