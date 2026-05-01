import { PrismaClient, StoreCategory, ParentNeed, BundleCategory, Roles } from "../app/generated/prisma/client"
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import bcrypt from "bcryptjs"
import crypto from "crypto"
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL || ""
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "");
}

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
  console.log('--- DATA SEEDING (UPSERT) ---')
  // Removed destructive deleteMany calls to preserve existing data (like orders and custom items)

  console.log('--- SEEDING ADMIN ---')
  const hashedPassword = await bcrypt.hash("@as5XIUdc", 10)
  const adminData = {
    name: "Henry Bassey",
    email: "henrybassey2007@gmail.com",
    password: hashedPassword,
    role: Roles.Owner
  }
  await prisma.admins.upsert({
    where: { email: adminData.email },
    update: adminData,
    create: adminData
  })

  console.log('--- SEEDING BLOGS ---')
  const blogsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'blogs.json'), 'utf8'))
  for (const blog of blogsData) {
    const blogData = {
      cuid: blog.cuid || `c${crypto.randomBytes(12).toString("hex")}`,
      slug: blog.slug,
      title: blog.title || "Untitled",
      subtitle: blog.subtitle,
      content: blog.content,
      category: blog.category || "Parenting",
      date: new Date(blog.date),
      views: blog.views || 0,
      likes: blog.likes || 0,
      image: blog.image,
      featured: blog.featured || false,
      authorName: blog.authorName || "The African Parent",
      authorImage: blog.authorImage,
      excerpt: blog.excerpt || (stripHtml(blog.content || "").substring(0, 150) + "...")
    }

    await prisma.blog.upsert({
      where: { slug: blog.slug },
      update: blogData,
      create: blogData
    })
  }

  console.log('--- SEEDING BUNDLES ---')
  
  // Create Bundles
  const equalityActToolkitData = {
    id: 1,
    name: "Equality Act Toolkit",
    desc: "Parent's guide to using the law to protect your child. Includes guide, trackers, and templates.",
    price: 27.00,
    imageUrl: "/toolkit-placeholder.png",
    category: BundleCategory.school_issues,
    badge: "BESTSELLER",
    includes: [
      "Equality Act Advocacy Guide",
      "Discrimination Incident Tracker",
      "Legal Citation Cheat Sheet",
      "Equality Act Email Templates",
      "Discrimination Complaint Builder",
      "Discrimination Escalation Pathway",
      "Real Case Examples"
    ],
  };
  const equalityActToolkit = await prisma.bundle.upsert({
    where: { id: 1 },
    update: equalityActToolkitData,
    create: equalityActToolkitData
  })

  const bullyingActionToolkitData = {
    id: 2,
    name: "Bullying Action Toolkit",
    desc: "Everything you need when your child is being bullied. Includes manual, trackers, and survival scripts.",
    price: 27.00,
    imageUrl: "/toolkit-placeholder.png",
    category: BundleCategory.bullying,
    badge: "MOST POPULAR",
    includes: [
      "Bullying Action Manual",
      "Bullying Incident Tracker",
      "Meeting Survival Script",
      "Pattern Analysis Page",
      "Bullying Case File Template",
      "Escalation Flowchart"
    ],
  };
  const bullyingActionToolkit = await prisma.bundle.upsert({
    where: { id: 2 },
    update: bullyingActionToolkitData,
    create: bullyingActionToolkitData
  })

  const completeAdvocacySystemData = {
    id: 3,
    name: "Complete School Advocacy System",
    desc: "The premium roadmap integrating all toolkits. Includes 20+ resources across SEND, Bullying, and the Equality Act.",
    price: 57.00,
    imageUrl: "/toolkit-placeholder.png",
    category: BundleCategory.school_advocacy,
    badge: "BEST VALUE",
    includes: [
      "The Core Manual",
      "The School Advocacy Toolkit",
      "The Bullying Action Toolkit",
      "The Equality Act Toolkit",
      "The SEND School Advocacy Manual",
      "Complaint Letter Pack",
      "Evidence Documentation Pack",
      "Meeting Toolkit"
    ],
  };
  const completeAdvocacySystem = await prisma.bundle.upsert({
    where: { id: 3 },
    update: completeAdvocacySystemData,
    create: completeAdvocacySystemData
  })

  console.log('--- SEEDING STORE ITEMS ---')
  
  const items = [
    // --- INDIVIDUAL ITEMS FOR SALE (Standalone Products) ---
    {
      name: "SEN Advocacy Manual",
      desc: "Everything you need to know about SEND support in mainstream schools.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 19.99,
      downloadLink: "/downloads/send-manual.pdf",
      parentNeeds: [ParentNeed.SEND, ParentNeed.EHCP],
      badge: "ESSENTIAL",
      cta: "Buy Now"
    },
    {
      name: "Bullying Action Manual",
      desc: "Complete manual for addressing bullying effectively.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 13.99,
      downloadLink: "/downloads/bullying-action-manual.pdf",
      parentNeeds: [ParentNeed.Bullying],
      badge: "TOP PICK",
      cta: "Buy Now"
    },
    {
      name: "Equality Act Advocacy Guide",
      desc: "Expert guide on using the Equality Act 2010 to protect student rights.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 8.99,
      downloadLink: "/downloads/equality-act-advocacy-guide.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Buy Now"
    },
    {
      name: "Bullying Case File Template",
      desc: "Structured template for building a case file.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 5.99,
      downloadLink: "/downloads/bullying-case-file.pdf",
      parentNeeds: [ParentNeed.Bullying],
      cta: "Buy Now"
    },
    {
      name: "Equality Act Email Templates",
      desc: "Ready-to-use email drafts referencing the Equality Act 2010.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 5.99,
      downloadLink: "/downloads/equality-act-email-templates.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Buy Now"
    },
    {
      name: "Discrimination Incident Tracker",
      desc: "Advanced spreadsheet to document and track incidents of discrimination.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 5.99,
      downloadLink: "/downloads/discrimination-incident-tracker.xlsx",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Buy Now"
    },
    {
      name: "Discrimination Complaint Builder",
      desc: "Step-by-step tool to help you draft formal complaints.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 5.99,
      downloadLink: "/downloads/discrimination-complaint-builder.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Buy Now"
    },
    {
      name: "Bullying Incident Tracker",
      desc: "Professional spreadsheet to log every detail for bullying documentation.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 4.99,
      downloadLink: "/downloads/bullying-incident-tracker.xlsx",
      parentNeeds: [ParentNeed.Bullying],
      cta: "Buy Now"
    },
    {
      name: "Escalation Flowchart",
      desc: "Visual guide on exactly who to contact and when to escalate concerns.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 3.99,
      downloadLink: "/downloads/escalation-flowchart.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Buy Now"
    },
    {
      name: "Legal Citation Cheat Sheet",
      desc: "Quick reference guide for citations in school advocacy.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 3.99,
      downloadLink: "/downloads/legal-citation-cheat-sheet.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Buy Now"
    },
    {
      name: "Meeting Survival Script",
      desc: "Essential phrases to stay focused and heard during meetings.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 2.99,
      downloadLink: "/downloads/meeting-survival-script.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Buy Now"
    },

    // --- EQUALITY ACT TOOLKIT ITEMS (Assigned directly to Bundle 1) ---
    {
      name: "Equality Act Advocacy Guide (Bundle 1)",
      desc: "The core legal guide on recognizing discrimination.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/equality-act-advocacy-guide.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: equalityActToolkit.id
    },
    {
      name: "Discrimination Incident Tracker (Bundle 1)",
      desc: "A spreadsheet tool for logging incidents.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/discrimination-incident-tracker.xlsx",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: equalityActToolkit.id
    },
    {
      name: "Legal Citation Cheat Sheet (Bundle 1)",
      desc: "Quick references for meetings and emails.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/legal-citation-cheat-sheet.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: equalityActToolkit.id
    },
    {
      name: "Equality Act Email Templates (Bundle 1)",
      desc: "Four annotated templates for formal complaints.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/equality-act-email-templates.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: equalityActToolkit.id
    },
    {
      name: "Discrimination Complaint Builder (Bundle 1)",
      desc: "A worksheet to help structure your case.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/discrimination-complaint-builder.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: equalityActToolkit.id
    },
    {
      name: "Discrimination Escalation Pathway (Bundle 1)",
      desc: "A visual guide for moving from school to external bodies.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/discrimination-escalation-pathway.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: equalityActToolkit.id
    },
    {
      name: "Real Case Examples (Bundle 1)",
      desc: "References to help understand successful advocacy.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/real-case-examples.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: equalityActToolkit.id
    },

    // --- BULLYING ACTION TOOLKIT ITEMS (Assigned directly to Bundle 2) ---
    {
      name: "Bullying Action Manual (Bundle 2)",
      desc: "The main guidance on moving from complaints to action.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/bullying-action-manual.pdf",
      parentNeeds: [ParentNeed.Bullying],
      cta: "Unlock in Bundle",
      bundleId: bullyingActionToolkit.id
    },
    {
      name: "Bullying Incident Tracker (Bundle 2)",
      desc: "An Excel tool for documenting the pattern of bullying.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/bullying-incident-tracker.xlsx",
      parentNeeds: [ParentNeed.Bullying],
      cta: "Unlock in Bundle",
      bundleId: bullyingActionToolkit.id
    },
    {
      name: "Meeting Survival Script (Bundle 2)",
      desc: "A guide to staying focused during difficult school meetings.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/meeting-survival-script.pdf",
      parentNeeds: [ParentNeed.Bullying],
      cta: "Unlock in Bundle",
      bundleId: bullyingActionToolkit.id
    },
    {
      name: "Pattern Analysis Page (Bundle 2)",
      desc: "A tool to identify and prove recurring issues.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/bullying-incident-pattern-analysis.pdf",
      parentNeeds: [ParentNeed.Bullying],
      cta: "Unlock in Bundle",
      bundleId: bullyingActionToolkit.id
    },
    {
      name: "Bullying Case File Template (Bundle 2)",
      desc: "A structured format for presenting your evidence.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/bullying-case-file.pdf",
      parentNeeds: [ParentNeed.Bullying],
      cta: "Unlock in Bundle",
      bundleId: bullyingActionToolkit.id
    },
    {
      name: "Escalation Flowchart (Bundle 2)",
      desc: "A visual tool for the complaints process.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/escalation-flowchart.pdf",
      parentNeeds: [ParentNeed.Bullying],
      cta: "Unlock in Bundle",
      bundleId: bullyingActionToolkit.id
    },

    // --- COMPLETE SCHOOL ADVOCACY SYSTEM ITEMS (Assigned directly to Bundle 3) ---
    {
      name: "The Core Manual (Bundle 3)",
      desc: "The foundational guide on how school systems work and how to build leverage.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/advocacy-documentation.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: completeAdvocacySystem.id
    },
    {
      name: "The School Advocacy Toolkit (Bundle 3)",
      desc: "The practical system for general school concerns.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/advocacy-manual.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: completeAdvocacySystem.id
    },
    {
      name: "The Bullying Action Toolkit (Bundle 3)",
      desc: "Complete manual, trackers, and survival scripts for addressing bullying.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/bullying-action-manual.pdf",
      parentNeeds: [ParentNeed.Bullying],
      cta: "Unlock in Bundle",
      bundleId: completeAdvocacySystem.id
    },
    {
      name: "The Equality Act Toolkit (Bundle 3)",
      desc: "Expert guide, trackers, and templates on using the Equality Act.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/equality-act-advocacy-guide.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: completeAdvocacySystem.id
    },
    {
      name: "The SEND School Advocacy Manual (Bundle 3)",
      desc: "Specialized guidance for families navigating Special Educational Needs (SEN).",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/send-manual.pdf",
      parentNeeds: [ParentNeed.SEND, ParentNeed.EHCP],
      cta: "Unlock in Bundle",
      bundleId: completeAdvocacySystem.id
    },
    {
      name: "Complaint Letter Pack (Bundle 3)",
      desc: "A comprehensive set of templates for various scenarios.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/school-complaint-letter-pack.pdf",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: completeAdvocacySystem.id
    },
    {
      name: "Evidence Documentation Pack (Bundle 3)",
      desc: "Includes the Timeline Builder and comprehensive evidence logs.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/bullying-incident-tracker.xlsx", // Reusing tracker link for now as visual placeholder
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: completeAdvocacySystem.id
    },
    {
      name: "Meeting Toolkit (Bundle 3)",
      desc: "Includes the Meeting Planner and follow-up scripts.",
      imageUrl: "/toolkit-placeholder.png",
      category: StoreCategory.Downloads,
      price: 0,
      downloadLink: "/downloads/meeting-manual-cover.pdf", // Reusing cover link for now as visual placeholder
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Unlock in Bundle",
      bundleId: completeAdvocacySystem.id
    },

    // --- OTHER ORIGINAL ITEMS ---
    {
      name: "Affirmation Cards From Dads To Daughter",
      imageUrl: "https://cdn.beacons.ai/user_content/t6dZWlVTbAX947SVXSyGvTlO3Jf1/referenced_images/55a0ecb1-37a5-4515-8aac-4d6e23f3680a__store__product-image__291e332b-e947-4dc2-90d1-11efa1f04426__17bea4d9-b624-4465-81ac-24b51cb6b831.webp?t=1751740242636",
      category: StoreCategory.AffirmationCards,
      desc: "Speak Love. Build Her Up. Remind Her Who Is Her.",
      beaconLink: "https://theafricanparent.store/shop/291e332b-e947-4dc2-90d1-11efa1f04426?pageViewSource=lib_view&referrer=https%3A%2F%2Ftheafricanparent.store%2F&show_back_button=true",
      price: 1.99,
      parentNeeds: [],
      cta: "Buy Now"
    },
    {
      name: "Affirmation Cards From Dad To Son",
      imageUrl: "https://cdn.beacons.ai/user_content/t6dZWlVTbAX947SVXSyGvTlO3Jf1/referenced_images/d88ff6b0-6f33-4efb-a133-0e9626970c8f__store__product-image__c7bfd6a2-87f1-44f5-af4f-8ac77ddc54da__30235bf2-27c5-4830-8edf-957029791a98.webp?t=1751739350681",
      category: StoreCategory.AffirmationCards,
      desc: "These heartfelt affirmation cards are a father’s voice, echoing pride, love, and legacy into the heart of his son.",
      beaconLink: "https://theafricanparent.store/shop/c7bfd6a2-87f1-44f5-af4f-8ac77ddc54da?pageViewSource=lib_view&referrer=https%3A%2F%2Ftheafricanparent.store%2F&show_back_button=true",
      price: 1.99,
      parentNeeds: [],
      cta: "Buy Now"
    },
    {
      name: "Dear Dad: Affirmation Cards from Your Child",
      imageUrl: "https://cdn.beacons.ai/user_content/t6dZWlVTbAX947SVXSyGvTlO3Jf1/referenced_images/19837a7b-7e6d-48db-bce6-ae4b805c1fec__store__product-image__7b1b492e-f917-4b8a-93a9-be752138612d__62f99c93-2825-4aa0-b478-9e62a741703d.webp?t=1749857031748",
      category: StoreCategory.AffirmationCards,
      desc: "Are you looking for a heartfelt way for your child to express love and gratitude to their dad? Look no further than our Printable Affirmation Cards!",
      beaconLink: "https://theafricanparent.store/shop/7b1b492e-f917-4b8a-93a9-be752138612d?pageViewSource=lib_view&referrer=https%3A%2F%2Ftheafricanparent.store%2F&show_back_button=true",
      price: 0.99,
      parentNeeds: [],
      cta: "Buy Now"
    },
    // COACHING
    {
      name: "Parent Coaching (Single Session)",
      imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1974&auto=format&fit=crop",
      category: StoreCategory.Coaching,
      desc: "40-minute session for your specific challenge. School advocacy, discipline, identity, or family dynamics.",
      price: 0,
      goodFor: "Immediate support",
      beaconLink : "https://cal.com/african-parent-psx0br/one-to-one-session",
      parentNeeds: [],
      cta: "Book Now",
    },
    {
      name: "Coaching Package (4 Sessions)",
      imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop",
      category: StoreCategory.Coaching,
      desc: "Monthly support over 4 months. For ongoing challenges or deep transformation.",
      price: 0,
      goodFor: "Sustained change",
      beaconLink : "https://cal.com/african-parent-psx0br/coaching-package-application",
      parentNeeds: [],
      cta: "Book Package",
    },
    {
      name : "Supporting Your Child After Bullying",
      imageUrl : "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2070&auto=format&fit=crop",
      category : StoreCategory.Coaching,
      cta : "Book Now",
      beaconLink : "https://cal.com/african-parent-psx0br/supporting-your-child-after-bullying",
      desc : "The Bullying may have stopped, but the impact can last a lifetime. Let me help you support your child through this challenging time.",
      price : 0,
      parentNeeds: [ParentNeed.Bullying],
      goodFor : "Parents of bullying victims",
    },
    {
      name: "School Meeting Prep",
      imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop",
      category: StoreCategory.Coaching,
      desc: "Intensive 40-minute session preparing you for difficult meetings. Review evidence, plan strategy, practice responses.",
      price: 0,
      goodFor: "School advocacy",
      beaconLink : "https://cal.com/african-parent-psx0br/30min",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Book Now",
    },
    {
      name : "SEN Strategy Session",
      imageUrl : "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop",
      category : StoreCategory.Coaching,
      cta : "Book Now",
      desc : "Clear direction when you suspect SEN but are not sure what to do.",
      price : 0,
      parentNeeds: [ParentNeed.SEND, ParentNeed.EHCP],
      goodFor : "Parents of children with suspected SEN",
      beaconLink : "https://cal.com/african-parent-psx0br/sen-strategy-session",
    },
    {
      name: "Full Advocacy Support",
      imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop",
      category: StoreCategory.Coaching,
      desc: "I attend your school meeting with you as your advocate. Available in London and surrounding areas.",
      price: 0,
      badge: "LONDON & EAST OF ENGLAND ONLY",
      goodFor: "High-stakes meetings",
      beaconLink : "https://cal.com/african-parent-psx0br/one-to-one-session",
      parentNeeds: [ParentNeed.SCHOOL_ISSUES],
      cta: "Enquire",
    },
    // FOR EDUCATORS
    {
      name: "Half-Day Staff Training",
      imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop",
      category: StoreCategory.ForEducators,
      desc: "3-hour session on reducing bias and improving outcomes. Practical strategies your staff can use immediately.",
      price: 0,
      goodFor: "Schools new to this work",
      beaconLink : "https://cal.com/african-parent-psx0br/coaching-package-application",
      parentNeeds: [],
      cta: "Request Quote",
    },
    {
      name: "Full-Day Staff Training",
      imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop",
      category: StoreCategory.ForEducators,
      desc: "6-hour deep dive. Data analysis, bias recognition, practical strategies, action planning.",
      price: 0,
      badge: "MOST IMPACT",
      beaconLink : "https://cal.com/african-parent-psx0br/coaching-package-application",
      goodFor: "Committed schools",
      parentNeeds: [],
      cta: "Request Quote",
    },
    {
      name: "Bespoke School Consultation",
      imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
      category: StoreCategory.ForEducators,
      desc: "Tailored support (3-12 months). Data review, policy development, staff coaching, implementation monitoring.",
      price: 0,
      goodFor: "Systemic change",
      beaconLink : "https://cal.com/african-parent-psx0br/coaching-package-application",
      parentNeeds: [],
      cta: "Enquire",
    }
  ]

  let itemId = 1;
  for (const item of items) {
    // Automatically determine parentNeeds if empty or based on title
    const computedNeeds = getParentNeedsByTitle(item.name);
    const finalNeeds = item.parentNeeds && item.parentNeeds.length > 0 ? item.parentNeeds : computedNeeds;
    
    const dataWithId = { ...item, id: itemId, parentNeeds: finalNeeds };
    await prisma.storeItem.upsert({ 
      where: { id: itemId },
      update: dataWithId,
      create: dataWithId
    })
    itemId++;
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    pool.end()
  })
