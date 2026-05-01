"use server";
import { prisma } from "@/prisma/engine";
import {
  Admins,
  Roles,
  Notification,
  ContactForm,
  NotifType,
  Contribution,
  ContributionStatus,
  StoreCategory,
  Orders,
  OrderItem,
  StoreItem,
  Bundle,
  BundleCategory,
} from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { cookies } from "next/dist/server/request/cookies";
import type { MemoWithRelations, Session } from "../(dashboard)/types";

import { SendMailClient } from "zeptomail";

// emailer stuff
import { Donation } from "@/app/generated/prisma/client";

const url = "api.zeptomail.eu/";
const token = process.env.ZEPTOMAIL_API_KEY || "";
const client = new SendMailClient({ url, token });

function createEmailPayload(
  fromName: string,
  toEmail: string,
  subject: string,
  body: string,
  toName: string,
  a: string
) {
  return {
    from: {
      address: `${a}@theafricanparent.org`,
      name: `${fromName}`,
    },
    to: [
      {
        email_address: {
          address: toEmail,
          name: toName,
        },
      },
    ],
    cc: [{ email_address: { address: "hello@theafricanparent.org", name: "Anne-Rose" } }],
    subject: subject,
    htmlbody: body,
  };
}

function createEmailBody(donation: Donation) {
  const { donor, email, location, amount } = donation;

  return `
  <div style="font-family: Arial, sans-serif; background-color: #f7f8f7; padding: 20px;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05); overflow: hidden;">

      <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #e6e6e6; background-color: #fdfdfd;">
        <h1 style="color: #4A7044; font-size: 24px; font-weight: bold; margin: 0;">Thank you for your support!</h1>
      </div>

      <div style="padding: 25px 20px; color: #333; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hi ${donor.split(" ")[0]},</p>
        <p>
          Thank you for your generous donation to The African Parent. Your support helps us create more resources, stories, and spaces that celebrate African families and raise our next generation with love, awareness, and cultural pride.
        </p>
        <p>
          You’ll receive an update soon on how your contribution is being used to support our projects and community initiatives.
        </p>
        <p style="margin-top: 25px;">
          With gratitude,<br>
          <strong>The African Parent</strong>
        </p>
        
        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e6e6e6;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600;">Donor Name:</span>
              <span>${donor}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600;">Email:</span>
              <span>${email}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e6e6e6;">
              <span style="font-weight: 700;">Donation Amount:</span>
              <span style="color: #4A7044; font-weight: 700;">£${(amount / 100).toFixed(2)}</span>
            </div>
        </div>
      </div>
       <div style="background-color: #f7f8f7; padding: 15px 20px; text-align: center; font-size: 12px; color: #888;">
        © 2025 The African Parent. All rights reserved.
      </div>
    </div>
  </div>
  `;
}

export async function sendDonationEmail(donation: Donation) {
  const body = createEmailBody(donation);
  const payload = createEmailPayload(
    "The African Parent",
    donation.email,
    `Thank you for your donation, ${donation.donor}`,
    body,
    donation.donor,
    "donations"
  );
  const response = await client.sendMail(payload);
  // console.log("Email response: ", response)
  if (response?.message === "OK") {
    return true;
  } else {
    return false;
  }
}

export type OrderWithItems = Orders & {
  items: (OrderItem & {
    item: StoreItem | null;
    bundle: (Bundle & { items: StoreItem[] }) | null;
  })[];
};

export async function syncBundleData(bundleId: number | null) {
  if (!bundleId) return;
  try {
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
      include: { items: { select: { name: true, price: true } } }
    });
    if (bundle) {
      const itemNames = bundle.items.map(i => i.name);
      const total = bundle.items.reduce((sum, item) => sum + (item.price || 0), 0);
      await prisma.bundle.update({
        where: { id: bundleId },
        data: { 
          includes: itemNames,
          total: total
        }
      });
    }
  } catch (err) {
    console.error(`Failed to sync data for bundle ${bundleId}:`, err);
  }
}

function createPurchaseEmailBody(order: OrderWithItems) {
  const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/secure-downloads/${order.id}?auth=tp_${Math.random().toString(36).substring(7)}&session=${Date.now()}`;

  const itemsHtml = order.items.map(oi => {
    const name = oi.item?.name || oi.bundle?.name || "Unknown Item";
    const price = oi.item?.price || oi.bundle?.price || 0;
    const isBundle = !!oi.bundle;

    return `
      <tr style="border-bottom: 1px solid #edf2f7;">
        <td style="padding: 12px 0; font-size: 14px; color: #4a5568;">
          ${name}
          ${isBundle ? '<br/><span style="font-size: 10px; color: #5C9952; font-weight: 800; text-transform: uppercase;">Bundle</span>' : ''}
        </td>
        <td style="padding: 12px 0; font-size: 14px; color: #4a5568; text-align: center;">${oi.quantity}</td>
        <td style="padding: 12px 0; font-size: 14px; color: #2d3748; text-align: right; font-weight: 600;">£${(price * oi.quantity).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
      </style>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
      <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background-color: #2D4A29; padding: 40px 30px; text-align: center;">
          <div style="background-color: rgba(255, 255, 255, 0.1); width: 64px; height: 64px; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <img src=${`${process.env.NEXT_PUBLIC_APP_URL}tap-white.png`} alt="The African Parent" width="64" height="64"/>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em;">Order Confirmed</h1>
          <p style="color: rgba(255, 255, 255, 0.7); margin: 8px 0 0; font-size: 14px;">Thank you for your purchase</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="margin-bottom: 30px; background-color: #f1f5f9; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 4px; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Order ID</p>
            <p style="margin: 0; font-size: 16px; font-weight: 700; color: #2D4A29;">${order.id}</p>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #4a5568; margin-bottom: 30px;">
            Hello,<br/><br/>
            Your order has been successfully processed! You can access your resources and downloads by clicking the secure button below.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 40px;">
            <a href="${downloadUrl}" style="display: inline-block; background-color: #2D4A29; color: #ffffff; padding: 18px 32px; border-radius: 16px; font-weight: 800; text-decoration: none; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(45, 74, 41, 0.2);">
              Get Your Downloads
            </a>
          </div>

          <!-- Order Summary -->
          <div style="margin-bottom: 10px; display: flex; align-items: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C9952" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
            <h3 style="margin: 0; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Order Summary</h3>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="border-bottom: 2px solid #edf2f7;">
                <th style="padding: 12px 0; text-align: left; font-size: 11px; font-weight: 800; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.05em;">Item</th>
                <th style="padding: 12px 0; text-align: center; font-size: 11px; font-weight: 800; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.05em;">Qty</th>
                <th style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 800; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.05em;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 20px 0 0; text-align: left; font-size: 14px; font-weight: 800; color: #2D4A29; text-transform: uppercase;">Total Paid</td>
                <td style="padding: 20px 0 0; text-align: right; font-size: 24px; font-weight: 800; color: #2D4A29;">£${order.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #E8F0E6; border-radius: 16px; padding: 20px; text-align: center; border: 1px solid rgba(92, 153, 82, 0.1);">
            <p style="margin: 0; font-size: 12px; font-weight: 700; color: #2D4A29; line-height: 1.5;">
              If you have any issues with your downloads, please reply to this email or contact support@theafricanparent.org
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #edf2f7;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
            &copy; ${new Date().getFullYear()} The African Parent. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendPurchaseEmail(
  toEmail: string,
  toName: string,
  order: OrderWithItems
) {
  const body = createPurchaseEmailBody(order);
  const payload = createEmailPayload(
    "The African Parent",
    toEmail,
    "Your resources from The African Parent",
    body,
    toName,
    "shop"
  );
  const response = await client.sendMail(payload);
  if (response?.message === "OK") {
    return true;
  } else {
    return false;
  }
}

export async function sendReplyEmail(
  contactFormId: number,
  replyMessage: string,
  admin: Admins | Session
) {
  if (!contactFormId || !replyMessage || !admin) {
    console.error("Incomplete contact form reply details");
    return false;
  }

  const contactForm = await prisma.contactForm.findUnique({
    where: {
      id: contactFormId,
    },
  });

  if (!contactForm) {
    console.error("Contact form not found");
    return false;
  }
  const adminFirstName = "name" in admin ? admin.name.split(" ")[0] : "Admin";

  const body = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 24px;">
    <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 32px 24px; border-radius: 10px; box-shadow: 0 3px 8px rgba(0,0,0,0.05);">
      
      <!-- Header -->
      <h1 style="font-size: 24px; color: #111827; margin-bottom: 8px; text-align: center;">
        Reply to Your Contact Form Submission
      </h1>
      <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 24px;">
        Sent on ${new Date().toLocaleString()}
      </p>

      <!-- Greeting -->
      <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
        Hi <strong>${contactForm.firstName}</strong>,
      </p>
      <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px;">
        Thank you for reaching out to <strong>The African Parent</strong>. We’ve reviewed your message and here’s our response:
      </p>

      <!-- User's Message -->
      <div style="margin-bottom: 20px;">
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 6px;">
          <strong>Your Message (submitted on ${new Date(contactForm.createdAt).toLocaleString()}):</strong>
        </p>
        <div style="background-color: #f9fafb; padding: 14px 18px; border-left: 4px solid #4f46e5; border-radius: 6px; font-size: 15px; color: #111827; line-height: 1.5;">
          ${contactForm.message}
        </div>
      </div>

      <!-- Our Reply -->
      <div style="margin-bottom: 24px;">
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 6px;">
          <strong>Our Reply (on ${new Date().toLocaleString()}):</strong>
        </p>
        <div style="background-color: #eef2ff; padding: 14px 18px; border-left: 4px solid #4338ca; border-radius: 6px; font-size: 15px; color: #111827; line-height: 1.5;">
          ${replyMessage}
        </div>
      </div>

      <!-- Signature -->
      <p style="font-size: 15px; color: #374151; margin-bottom: 12px;">
        Warm regards,<br/>
        <strong style="color: #111827;">${adminFirstName} & The African Parent Team</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <!-- Footer -->
      <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.4;">
        If you have any further questions or need additional assistance,<br/>
        simply send a new contact form and we’ll be happy to help! 
      </p>
      <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 8px;">
        © ${new Date().getFullYear()} The African Parent. All rights reserved.
      </p>
    </div>
  </div>
`;

  const payload = createEmailPayload(
    `${adminFirstName} - The African Parent`,
    contactForm.email,
    `Reply to Your Contact Form Submission`,
    body,
    contactForm.firstName,
    "contact"
  );

  const response = await client.sendMail(payload);
  if (response?.message === "OK") {
    // update the contact form entry to mark it as replied
    await prisma.contactForm.update({
      where: {
        id: contactFormId,
      },
      data: {
        addressed: true,
        reply: replyMessage,
        addressedBy: admin.name ? admin.name : "Admin",
        addressedAt: new Date(),
      },
    });
    return true;
  } else {
    return false;
  }
}

function createContributionStatusChangeBody(
  contribution: Contribution,
  newStatus: ContributionStatus
) {
  // --- Theming Variables ---
  const theme = {
    background: "#4A7044", // Deep, earthy green
    cardBackground: "#FFFFFF",
    primaryText: "#1f2937", // A slightly softer black
    secondaryText: "#4b5563",
    fontFamily: "Georgia, 'Times New Roman', serif",
  };

  // --- Status-Specific Content ---
  let badgeColor = "#e5e7eb";
  let badgeTextColor = "#374151";
  let message = "";
  let subject = "Update on Your Contribution";

  switch (newStatus) {
    case "Adopted":
      badgeColor = "#dcfce7";
      badgeTextColor = "#15803d";
      subject = "🎉 Your Contribution has been Adopted!";
      message = `Great news! Your contribution has been <strong>adopted</strong>. 
        It has been integrated into our platform, and we are incredibly grateful for your valuable input. We look forward to more from you.`;
      break;

    case "Revised":
      badgeColor = "#fef9c3";
      badgeTextColor = "#a16207";
      subject = "✏️ An Update on Your Contribution";
      message = `We've made some adjustments to your contribution to better align it with our project. It is now marked as <strong>revised</strong>. 
        Thank you for helping us improve.`;
      break;

    case "UnderReview":
      badgeColor = "#e0f2fe";
      badgeTextColor = "#0369a1";
      subject = "🕓 Your Contribution is Under Review";
      message = `Just a quick note to let you know that your contribution is <strong>under review</strong>. 
        Our team is carefully evaluating it, and we’ll notify you as soon as a decision has been made.`;
      break;

    case "Declined":
      badgeColor = "#fee2e2";
      badgeTextColor = "#b91c1c";
      subject = "Regarding Your Recent Contribution";
      message = `Thank you for submitting your contribution. After careful consideration, we have decided not to move forward with it at this time, and its status is now <strong>declined</strong>. 
        Please don’t be discouraged—we truly value your effort and encourage you to contribute again in the future.`;
      break;

    default:
      message = `The status of your contributio has been updated to <strong>${newStatus}</strong>.`;
  }

  // --- HTML Template ---
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body style="font-family: ${theme.fontFamily}; padding: 40px 20px; margin: 0;">
    <div style="max-width: 700px; margin: 0 auto; background-color: ${theme.cardBackground}; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="padding: 24px; background-color: #f8f9fa; border-bottom: 1px solid #e5e7eb;">
        <h1 style="font-size: 24px; color: ${theme.primaryText}; margin: 0; font-weight: 600;">
          The African Parent
        </h1>
      </div>

      <!-- Main Content -->
      <div style="padding: 32px;">
        <h2 style="font-size: 20px; color: ${theme.primaryText}; margin-top: 0; margin-bottom: 16px; font-weight: 600;">
          Contribution Status Update
        </h2>

        <p style="font-size: 16px; color: ${theme.secondaryText}; margin-bottom: 24px;">
          Hi <strong>${contribution.name}</strong>,
        </p>
        
        <p style="font-size: 16px; color: ${theme.secondaryText}; line-height: 1.6; margin-bottom: 24px;">
          ${message}
        </p>

        <!-- Status Badge -->
        <div style="margin-bottom: 24px;">
          <span style="background-color: ${badgeColor}; color: ${badgeTextColor}; display: inline-block;  font-size: 14px; font-weight: bold; border-radius: 30px; letter-spacing: 0.5px; padding: 8px 16px;">
            STATUS: ${newStatus.toUpperCase()}
          </span>
        </div>
        <p style="font-size: 16px; color: ${theme.secondaryText}; line-height: 1.6;">
          Thank you for being a part of our community.
        </p>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding: 24px; text-align: center;">
        <p style="font-size: 14px; color: #9ca3af; margin: 0;">
          Sincerely, <br/><strong>The African Parent Team</strong>
        </p>
      </div>
    </div>

    <!-- Meta Info -->
    <div style="text-align: center; max-width: 600px; margin: 24px auto 0;">
      <p style="font-size: 12px; color: #a1b09e;">
        You are receiving this email because you made a contribution on our platform.
        <br/>
        &copy; ${new Date().getFullYear()} The African Parent. All rights reserved.
      </p>
    </div>
  </body>
  </html>
  `;
}

export async function notifyContributionStatusChange(
  contributionId: number,
  newStatus: ContributionStatus,
  admin: Admins | Session
) {
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
  });
  if (!contribution) {
    console.error("Contribution not found");
    return false;
  }
  const adminName = "name" in admin ? admin.name : "Admin";
  const body = createContributionStatusChangeBody(contribution, newStatus);

  const payload = createEmailPayload(
    `${adminName} - The African Parent`,
    contribution.email,
    `Update on Your Contribution`,
    body,
    contribution.name,
    "contributions"
  );

  const response = await client.sendMail(payload);
  if (response?.message === "OK") {
    // update the contribution entry to mark it as notified
    await prisma.contribution.update({
      where: {
        id: contributionId,
      },
      data: {
        replied: true,
        repliedAt: new Date(),
        repliedBy: adminName,
      },
    });
    return true;
  } else {
    return false;
  }
}

//-----HELPERS
const saltRounds = 10;

// generate hash
export async function generateHash(password: string) {
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

// verify
export async function verifyPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

const MASTER_KEY: string = process.env.MASTER_KEY ? process.env.MASTER_KEY : "";

export async function fetchBlogs() {
  try {
    const blogs = await prisma.blog.findMany({
      select: {
        id: true,
        subtitle: true,
        cuid: true,
        title: true,
        slug: true,
        category: true,
        date: true,
        views: true,
        likes: true,
        image: true,
        featured: true,
        authorName: true,
        categories: true,
        authorImage: true,
        excerpt: true,
        published: true,
        showCallout: true,
        audience: true,
        nextSteps: true,
        comments: true, // include related comments here
      },
      orderBy: {
        date: "desc"
      }
    });

    return blogs ?? [];
  } catch (error) {
    console.error("fetchBlogs error:", error);
    return [];
  }
}

// in @/app/actions/adminOps.ts

export async function fetchOrders() {
  try {
    const orders = await prisma.orders.findMany({
      include: {
        items: {
          include: {
            item: true,
            bundle: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return orders || [];
  } catch (error) {
    console.error("fetchOrders error:", error);
    return [];
  }
}

export async function fetchItems() {
  try {
    const items = await prisma.storeItem.findMany({
      include: {
        bundle: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return items ? items : [];
  } catch (error) {
    console.error("fetchItems error:", error);
  }
}

export async function fetchDonations() {
  try {
    const donations = await prisma.donation.findMany();
    return donations ? donations : [];
  } catch (error) {
    console.error("fetchDonations Error", error);
  }
}

export async function fetchOrderItems() {
  try {
    const items = await prisma.orderItem.findMany();
    return items ? items : [];
  } catch (error) {
    console.error("fetchItems error:", error);
  }
}

export async function fetchAdmins() {
  try {
    const items: Admins[] = await prisma.admins.findMany();
    return items ? items : [];
  } catch (error) {
    console.error("fetchItems error:", error);
  }
}

export async function addAdmin(
  name: string,
  email: string,
  password: string,
  master_key: string,
  role: Roles = "Other",
  admin: Admins | Session
) {
  if (!role) console.info("Creating user with default minimal role");
  if (!name || !password) {
    console.error("Incomplete credentials");
    return false;
  } else if (!master_key) {
    console.error("Master Key required to create admin");
    return;
  } else if (master_key !== MASTER_KEY) {
    console.error("Invalid Master Key");
  } else {
    try {
      const Nadmin = await prisma.admins.create({
        data: {
          name: name,
          password: await generateHash(password),
          role: role,
          email: email,
        },
      });
      if (admin) {
        console.log("Admin Added Succesfully");
        await prisma.notification.create({
          data: {
            type: "AdminCreate",
            message: `A new admin named "${Nadmin.name}" with role "${Nadmin.role}" was added by ${admin.name}.`,
            adminId: admin.id,
            cause: admin.name,
          },
        });
        return true;
      } else {
        console.error("Couldn't add admin");
        return false;
      }
    } catch (error) {
      console.error("Server Error occured while creating admin");
      return false;
    }
  }
}

export async function verifyAdmin(email: string, password: string) {
  if (!email || !password) {
    console.error("Incomplete credentials");
    return false;
  } else {
    try {
      const admin = await prisma.admins.findUnique({
        where: {
          email: email,
        },
      });
      if (admin && (await verifyPassword(password, admin.password))) {
        console.log("Admin Verified Succesfully");
        return true;
      } else if (admin && !(await verifyPassword(password, admin.password))) {
        console.error("Invalid Password");
        return false;
      } else {
        console.error("Admin Not Found");
        return false;
      }
    } catch (error) {
      console.error("Server Error occured while verifying admin");
      return false;
    }
  }
}

export async function deleteAdmin(id: string, Nadmin: Admins | Session) {
  console.log("Deleting Admin with ID:", id);
  try {
    const admin = await prisma.admins.delete({
      where: {
        id: id,
      },
    });
    if (admin) {
      console.log("Admin Deleted Successfully");
      await prisma.notification.create({
        data: {
          type: "AdminDelete",
          message: `An admin named "${admin.name}" with role "${admin.role}" was deleted by ${Nadmin.name}.`,
          adminId: Nadmin.id,
          cause: Nadmin.name,
        },
      });
      return true;
    } else {
      console.error("Couldn't delete admin");
      return false;
    }
  } catch (error) {
    console.error("Error deleting admin:", error);
    return false;
  }
}

export async function updateAdminRole(
  id: string,
  role: Roles,
  Nadmin: Admins | Session
) {
  try {
    const admin = await prisma.admins.update({
      where: {
        id: id,
      },
      data: {
        role: role,
      },
    });
    if (admin) {
      console.log("Admin Role Updated Successfully");
      await prisma.notification.create({
        data: {
          type: "AdminRoleChange",
          message: `${admin.name}'s role was changed to "${role}" by ${Nadmin.name}.`,
          adminId: Nadmin.id,
          cause: Nadmin.name,
          recipientId: admin.id,
        },
      });
      return true;
    } else {
      console.error("Couldn't update admin role");
      return false;
    }
  } catch (error) {
    console.error("Error updating admin role:", error);
    return false;
  }
}

export async function addItem(
  name: string,
  description: string,
  price: number,
  image: string,
  beaconLink: string | null,
  downloadLink: string,
  badge: string,
  goodFor: string,
  cta: string,
  category: StoreCategory,
  admin: Admins | Session,
  bundleId?: number | null
) {
  if (
    !name ||
    !description ||
    price === undefined ||
    price === null ||
    !image ||
    !category ||
    !admin
  ) {
    console.error("Incomplete item details");
    return false;
  } else {
    try {
      const item = await prisma.storeItem.create({
        data: {
          name: name,
          desc: description,
          price: price,
          imageUrl: image,
          beaconLink: beaconLink,
          category: category,
          bundleId: bundleId,
          downloadLink: downloadLink,
          badge: badge,
          goodFor: goodFor,
          cta: cta,
        },
      });
      if (item) {
        if (bundleId) await syncBundleData(bundleId);
        console.log("Item Added Successfully");
        await prisma.notification.create({
          data: {
            type: "AdminStoreItemAdd",
            message: `Store item titled "${item.name}" was added by Admin.`,
            adminId: admin.id,
            cause: admin.name,
          },
        });
        return true;
      } else {
        console.error("Couldn't add item");
        return false;
      }
    } catch (error) {
      console.error("Error adding item:", error);
      return false;
    }
  }
}

export async function deleteItem(id: number, admin: Admins | Session) {
  try {
    const itemToDelete = await prisma.storeItem.findUnique({
      where: { id },
      select: { bundleId: true }
    });
    const item = await prisma.storeItem.delete({
      where: {
        id: id,
      },
    });
    if (item) {
      if (itemToDelete?.bundleId) await syncBundleData(itemToDelete.bundleId);
      console.log("Item Deleted Successfully");
      await prisma.notification.create({
        data: {
          type: "AdminStoreItemDelete",
          message: `Store item titled "${item.name}" was deleted by Admin.`,
          adminId: admin.id,
          cause: admin.name,
        },
      });

      return true;
    } else {
      console.error("Couldn't delete item");
      return false;
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    return false;
  }
}

export async function fetchBundles() {
  try {
    const bundles = await prisma.bundle.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return bundles || [];
  } catch (error) {
    console.error("fetchBundles error:", error);
    return [];
  }
}

export async function addBundle(
  name: string,
  desc: string,
  price: number,
  imageUrl: string,
  category: BundleCategory,
  badge: string,
  cta: string,
  includes: string[],
  total: number,
  admin: Admins | Session
): Promise<number | null> {
  try {
    const bundle = await prisma.bundle.create({
      data: {
        name,
        desc,
        price,
        imageUrl,
        category,
        badge,
        cta,
        includes,
        total,
      },
    });

    if (bundle) {
      await syncBundleData(bundle.id);
      await prisma.notification.create({
        data: {
          type: "AdminStoreItemAdd",
          message: `New bundle "${name}" was created by Admin.`,
          adminId: admin.id,
          cause: admin.name,
        },
      });
      revalidatePath("/bundles");
      return bundle.id;
    }
    return null;
  } catch (error) {
    console.error("Error adding bundle:", error);
    return null;
  }
}

export async function updateBundle(
  id: number,
  name: string,
  desc: string,
  price: number,
  imageUrl: string,
  category: BundleCategory,
  badge: string,
  cta: string,
  includes: string[],
  total: number,
  admin: Admins | Session
) {
  try {
    const bundle = await prisma.bundle.update({
      where: { id },
      data: {
        name,
        desc,
        price,
        imageUrl,
        category,
        badge,
        cta,
        includes,
        total,
      },
    });

    if (bundle) {
      await syncBundleData(id);
      await prisma.notification.create({
        data: {
          type: "AdminStoreItemUpdate",
          message: `Bundle "${name}" was updated by Admin.`,
          adminId: admin.id,
          cause: admin.name,
        },
      });
      revalidatePath("/bundles");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating bundle:", error);
    return false;
  }
}

export async function deleteBundle(id: number, admin: Admins | Session) {
  try {
    await prisma.storeItem.updateMany({
      where: { bundleId: id },
      data: { bundleId: null },
    });

    const bundle = await prisma.bundle.delete({
      where: { id },
    });

    if (bundle) {
      await prisma.notification.create({
        data: {
          type: "AdminStoreItemDelete",
          message: `Bundle "${bundle.name}" was deleted by Admin.`,
          adminId: admin.id,
          cause: admin.name,
        },
      });
      revalidatePath("/bundles");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting bundle:", error);
    return false;
  }
}

export async function toggleItemInBundle(
  itemId: number,
  bundleId: number | null,
  admin: Admins | Session
) {
  try {
    const oldItem = await prisma.storeItem.findUnique({
      where: { id: itemId },
      select: { bundleId: true }
    });
    const item = await prisma.storeItem.update({
      where: { id: itemId },
      data: { bundleId },
    });

    if (item) {
      if (bundleId) await syncBundleData(bundleId);
      if (oldItem?.bundleId && oldItem.bundleId !== bundleId) {
        await syncBundleData(oldItem.bundleId);
      }
      await prisma.notification.create({
        data: {
          type: "AdminStoreItemUpdate",
          message: `Item "${item.name}" bundle assignment updated by Admin.`,
          adminId: admin.id,
          cause: admin.name,
        },
      });
      revalidatePath("/bundles");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error toggling item in bundle:", error);
    return false;
  }
}

export async function updateItem(
  id: number,
  name: string,
  description: string,
  price: number,
  image: string,
  beaconLink: string | null,
  downloadLink: string,
  badge: string,
  goodFor: string,
  cta: string,
  category: StoreCategory,
  admin: Admins | Session,
  bundleId?: number | null
) {
  if (
    !name ||
    !description ||
    price === undefined ||
    price === null ||
    !image ||
    !category ||
    !admin
  ) {
    console.error("Incomplete item details");
    return false;
  } else {
    try {
      const oldItem = await prisma.storeItem.findUnique({
        where: { id },
        select: { bundleId: true }
      });
      const item = await prisma.storeItem.update({
        where: {
          id: id,
        },
        data: {
          name: name,
          desc: description,
          price: price,
          imageUrl: image,
          beaconLink: beaconLink,
          category: category,
          bundleId: bundleId,
          downloadLink: downloadLink,
          badge: badge,
          goodFor: goodFor,
          cta: cta,
        },
      });
      if (item) {
        if (bundleId) await syncBundleData(bundleId);
        if (oldItem?.bundleId && oldItem.bundleId !== bundleId) {
          await syncBundleData(oldItem.bundleId);
        }
        console.log("Item Updated Successfully");
        await prisma.notification.create({
          data: {
            type: "AdminStoreItemUpdate",
            message: `Store item titled "${item.name}" was updated by ${admin.name}.`,
            adminId: admin.id,
            cause: admin.name,
          },
        });

        return true;
      } else {
        console.error("Couldn't update item");
        return false;
      }
    } catch (error) {
      console.error("Error updating item:", error);
      return false;
    }
  }
}

export async function toggleStoreItemFree(
  id: number,
  free: boolean,
  admin: Admins | Session
) {
  try {
    const item = await prisma.storeItem.update({
      where: { id },
      data: { free },
    });
    if (item) {
      await prisma.notification.create({
        data: {
          type: "AdminStoreItemUpdate",
          message: `Store item "${item.name}" marked as ${
            free ? "FREE" : "PAID"
          } by ${admin.name}.`,
          adminId: (admin as any).id,
          cause: admin.name,
        },
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error toggling item free status:", error);
    return false;
  }
}

export async function deleteBlog(cuid: string, admin: Admins) {
  try {
    const blog = await prisma.blog.delete({
      where: {
        cuid: cuid,
      },
    });
    if (blog) {
      console.log("Blog Deleted Successfully");
      await prisma.notification.create({
        data: {
          type: "AdminBlogDelete",
          message: `Blog titled "${blog.title}" was deleted by ${admin.name}.`,
          adminId: admin.id,
          cause: admin.name,
        },
      });
      return true;
    } else {
      console.error("Couldn't delete blog");
      return false;
    }
  } catch (error) {
    console.error("Error deleting blog:", error);
    return false;
  }
}

export async function updateAdminDetails(
  name: string,
  email: string,
  password: string
) {
  if (!name || !email || !password) {
    console.error("Incomplete details");
    return false;
  }
  try {
    const admin = await prisma.admins.update({
      where: {
        email: email,
      },
      data: {
        name: name,
        password: password,
      },
    });
    if (admin) {
      console.log("Admin Details Updated Successfully");
      await prisma.notification.create({
        data: {
          type: "AdminProfileChange",
          message: `Admin "${admin.name}" updated their profile information.`,
          adminId: admin.id,
          cause: admin.name,
        },
      });
      return true;
    } else {
      console.error("Couldn't update admin details");
      return false;
    }
  } catch (error) {
    console.error("Error updating admin details:", error);
    return false;
  }
}

export async function updateAdminName(
  email: string,
  newName: string,
  Nadmin: Admins
): Promise<boolean> {
  if (!newName) return false;
  try {
    const admin = await prisma.admins.update({
      where: { email },
      data: { name: newName },
    });
    await prisma.notification.create({
      data: {
        type: "AdminProfileChange",
        message: `${Nadmin.name} changed their name to "${newName}".`,
        adminId: admin.id,
        cause: Nadmin.name,
      },
    });
    return true;
  } catch (error) {
    console.error("Error updating admin name:", error);
    return false;
  }
}

export async function updateAdminPasswordByAdmin(
  email: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  if (!email || !oldPassword || !newPassword) {
    return { success: false, message: "Incomplete details provided." };
  }

  try {
    const admin = await prisma.admins.findUnique({ where: { email } });
    if (!admin) {
      return { success: false, message: "Admin not found." };
    }
    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      admin.password
    );
    if (!isOldPasswordCorrect) {
      return { success: false, message: "Incorrect old password." };
    }

    const Nadmin = await prisma.admins.update({
      where: { email },
      data: { password: await generateHash(newPassword) },
    });

    // Invalidate session by clearing the session cookie

    (await cookies()).delete("session");
    if (Nadmin) {
      await prisma.notification.create({
        data: {
          type: "AdminPasswordChangeSelf",
          message: `${Nadmin.name} updated their password.`,
          adminId: Nadmin.id,
          cause: Nadmin.name,
        },
      });
    }

    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    console.error("Error updating admin password:", error);
    return { success: false, message: "A server error occurred." };
  }
}
export async function updateAdminPasswordByMasterKey(
  email: string,
  newPassword: string,
  master_key: string,
  admin: Admins | Session
) {
  if (!email || !newPassword || !master_key) {
    console.error("Incomplete details");
    return false;
  } else if (master_key !== MASTER_KEY) {
    console.error("Invalid Master Key");
    return false;
  }
  try {
    const Nadmin = await prisma.admins.update({
      where: {
        email: email,
      },
      data: {
        password: await generateHash(newPassword),
      },
    });
    if (Nadmin) {
      console.log("Admin Password Updated Successfully");
      await prisma.notification.create({
        data: {
          type: "AdminPasswordChangeRoot",
          message: `${admin.name} updated ${Nadmin.name}'s password.`,
          adminId: admin.id,
          cause: admin.name,
          recipientId: Nadmin.id,
        },
      });
      return true;
    } else {
      console.error("Couldn't update admin password");
      return false;
    }
  } catch (error) {
    console.error("Error updating admin password:", error);
    return false;
  }
}

export async function fetchDashNotifications(start: number, end: number) {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: "desc",
      },
      where: {
        type: {
          notIn: [
            "AdminLogin",
            "AdminCreate",
            "AdminRoleChange",
            "AdminPasswordChangeSelf",
            "AdminPasswordChangeRoot",
            "AdminProfileChange",
            "AdminDelete",
            "AdminBlogCreate",
            "AdminBlogDelete",
            "AdminStoreItemDelete",
            "AdminStoreItemUpdate",
            "AdminStoreItemAdd",
          ],
        },
      },
      skip: start,
      take: end - start,
    });
    // console.log("Fetched Dash Notifications:\n\n", notifications);
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

async function fetchAdminspecificNotifications(
  adminId: string,
  start: number,
  end: number
) {
  try {
    const notifications: Notification[] = await prisma.notification.findMany({
      where: {
        OR: [
          { adminId: adminId },
          { recipientId: adminId },
          {
            type: {
              in: [
                "ContactFormSubmit",
                "PaymentInit",
                "PaymentFail",
                "PaymentFail",
                "PaymentComplete",
                "DonationInit",
                "DonationFail",
                "DonationComplete",
                "ContributorFormSubmit",
                "AdminStoreItemUpdate",
                "AdminStoreItemAdd",
                "AdminStoreItemDelete",
                "AdminBlogCreate",
                "AdminBlogDelete",
                "AdminRoleChange",
                "AdminCreate",
                "AdminDelete",
                "AdminProfileChange",
              ],
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: end - start,
    });

    return notifications;
  } catch (error) {
    console.error("Error fetching admin-specific notifications:", error);
    return [];
  }
}

async function fetchAllNotifications(start: number, end: number) {
  try {
    const notifications: Notification[] = await prisma.notification.findMany({
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: end - start,
    });
    return notifications;
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    return [];
  }
}

async function fetchRootNotifications(start: number, end: number) {
  const notifications: Notification[] = await prisma.notification.findMany({
    where: {
      type: {
        notIn: ["AdminLogin"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: start,
    take: end - start,
  });
  return notifications;
}

export async function fetchNotifications(
  admin: Admins | Session,
  start: number,
  end: number
) {
  const notifications: Notification[] = [];
  switch (admin.role) {
    case "Owner":
      console.log("Owner - Fetching all notifications");
      notifications.push(...(await fetchAllNotifications(start, end)));
      break;
    case "Other":
      console.log("Other - Fetching admin-specific notifications");
      notifications.push(
        ...(await fetchAdminspecificNotifications(admin.id, start, end))
      );
      break;
    case "Root":
      console.log("Root - Fetching all notifications except AdminLogin");
      notifications.push(...(await fetchRootNotifications(start, end)));
      break;
    case "Developer":
      console.log("Developer - Fetching all notifications except AdminLogin");
      notifications.push(...(await fetchRootNotifications(start, end)));
      break;
  }
  return notifications;
}

export async function sendMemo(
  content: string,
  admin: Admins,
  title: string,
  recipients?: Admins[]
) {
  if (!content || !admin || !title) {
    return {
      success: false,
      message: "Incomplete memo details",
    };
  }

  try {
    const memo = await prisma.memo.create({
      data: {
        title,
        content,
        authorId: admin.id,
        status: "UNRESOLVED",
        recipients:
          recipients && recipients.length > 0
            ? {
              connect: recipients.map((r) => ({ id: r.id })),
            }
            : undefined,
      },
    });

    return {
      success: true,
      message: "✅ Memo sent successfully",
      memo,
    };
  } catch (error) {
    console.error("Error sending memo:", error);
    return {
      success: false,
      message: "❌ Error sending memo",
    };
  }
}

export async function fetchAllMemos(start: number, end: number) {
  try {
    const memos = await prisma.memo.findMany({
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: end - start,
      include: {
        author: true,
        recipients: true,
        readBy: true,
      },
    });
    return memos;
  } catch (error) {
    console.error("Error fetching all memos:", error);
    return [];
  }
}

export async function fetchAdminSpecificMemos(
  admin: Admins,
  start: number,
  end: number
) {
  try {
    if (admin.role === "Owner") {
      return await fetchAllMemos(start, end);
    }

    const memos: MemoWithRelations[] = await prisma.memo.findMany({
      where: {
        OR: [
          { authorId: admin.id },
          {
            recipients: {
              some: {
                id: admin.id,
              },
            },
          },
          { recipients: { none: {} } },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: end - start,
      include: {
        author: true,
        recipients: true,
        readBy: true,
      },
    });

    return memos;
  } catch (error) {
    console.error("Error fetching admin-specific memos:", error);
    return [];
  }
}

export async function markMemoAsRead(memoId: string, admin: Admins | Session) {
  if (!memoId || !admin) {
    return { success: false, message: "Invalid data provided." };
  }
  try {
    await prisma.memo.update({
      where: { id: memoId },
      data: {
        readBy: {
          connect: {
            id: admin.id,
          },
        },
      },
    });
    revalidatePath(`/dashboard/memos/${memoId}`);
    return { success: true };
  } catch (error) {
    console.error("Error marking memo as read:", error);
    return { success: false, message: "Database error." };
  }
}

export async function markMemoAsResolved(memoId: string) {
  return await prisma.memo.update({
    where: { id: memoId },
    data: { status: "RESOLVED" },
  });
}

export async function getMemoById(memoId: string) {
  try {
    const memo = await prisma.memo.findUnique({
      where: { id: memoId },
      include: {
        author: true,
        recipients: true,
        readBy: true,
      },
    });
    return memo;
  } catch (error) {
    console.error("Error fetching memo by ID:", error);
    return null;
  }
}

export async function addNotification(type: NotifType, message: string) {
  try {
    await prisma.notification.create({
      data: {
        type,
        message,
      },
    });
    return true;
  } catch (error) {
    console.error("Error adding notification:", error);
    return null;
  }
}

export async function addContactFormEntry(
  name: string,
  email: string,
  message: string,
  location: string
) {
  if (!name || !email || !message || !location) {
    console.error("Incomplete contact form details");
    return { status: false, message: "Incomplete contact form details" };
  }
  const nameParts = name.trim().split(" ");
  try {
    const entry = await prisma.contactForm.create({
      data: {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" "),
        email,
        message,
        location,
      },
    });
    if (entry) {
      const notification = await prisma.notification.create({
        data: {
          type: "ContactFormSubmit",
          message: `New contact form submission from ${name} (${email}).`,
        },
      });
      try {
        const body = `
        <div style="font-family: Arial, sans-serif; background-color: #f7f8f7; padding: 20px;">
    <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05); overflow: hidden;">

      <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #e6e6e6; background-color: #fdfdfd;">
        <h1 style="color: #4A7044; font-size: 24px; font-weight: bold; margin: 0;">We've Received Your Message</h1>
      </div>

      <div style="padding: 25px 20px; color: #333; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hi ${nameParts[0]},</p>
        <p>
          Thank you for reaching out to The African Parent. Your message has been received, and we’ll get back to you as soon as possible.
        </p>
        <p>
          We truly appreciate you taking the time to connect with us. Whether it’s a question, collaboration idea, or story to share, our team reads every message carefully. You can expect a reply within 2-3 working days.
        </p>
        <p>
          In the meantime, feel free to explore our latest parenting reflections, guides, and community updates at <a href="https://www.theafricanparent.org" style="color: #4A7044; text-decoration: none;">www.theafricanparent.org</a>.
        </p>
      </div>

      <div style="border-top: 1px solid #e6e6e6; padding: 20px; font-size: 13px; color: #555;">
          <p style="margin: 0 0 10px 0;">We read every message that comes our way.</p>
          <p style="margin: 0;">Simply reply to this email if there’s anything else we can support you with.</p>
      </div>
      
      <div style="background-color: #f7f8f7; padding: 20px; text-align: center;">
        <p style="font-size: 14px; color: #4A7044; font-weight: bold; margin: 0 0 15px 0;">
          Rooted in culture, growing together.
        </p>
        <p style="font-size: 12px; color: #888; margin: 0;">
          © 2025 The African Parent. All rights reserved.
        </p>
      </div>
    </div>
  </div>
        
        `;
        await sendFollowUp(email, nameParts[0], body);
        console.log("Contact Form Entry Added Successfully");
        return entry;
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.error("Error adding contact form entry:", error);
    return { status: false, message: "Failed to submit contact form" };
  }
}

export async function fetchContactFormEntries() {
  try {
    const entries = await prisma.contactForm.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        readBy: true,
      },
    });
    return entries;
  } catch (error) {
    console.error("Error fetching contact form entries:", error);
    return [];
  }
}

async function sendFollowUp(email: string, name: string, replyMessage: string) {
  const payload = createEmailPayload(
    "The African Parent",
    email,
    "We have recieved your message",
    replyMessage,
    name,
    "contact"
  );

  const response = await client.sendMail(payload);
  if (response?.message === "OK") {
    return true;
  } else {
    return false;
  }
}

export async function sendContactFormReply(
  contactFormId: number,
  replyMessage: string,
  admin: Admins | Session
) {
  if (!contactFormId || !replyMessage || !admin) {
    console.error("Incomplete contact form reply details");
    return false;
  }

  const success = await sendReplyEmail(contactFormId, replyMessage, admin);
  if (!success) {
    console.error("Error sending contact form reply email");
    return false;
  }
  return true;
}

export async function deleteContactFormEntry(id: number) {
  try {
    const entry = await prisma.contactForm.delete({
      where: {
        id: id,
      },
    });
    if (entry) {
      console.log("Contact Form Entry Deleted Successfully");
      return true;
    } else {
      console.error("Couldn't delete contact form entry");
      return false;
    }
  } catch (error) {
    console.error("Error deleting contact form entry:", error);
    return false;
  }
}

export async function markContactFormAsRead(
  contactFormId: number,
  admin: Admins | Session
) {
  if (!contactFormId || !admin) {
    console.error("Incomplete details to mark contact form as read");
    return false;
  }
  try {
    await prisma.contactForm.update({
      where: {
        id: contactFormId,
      },
      data: {
        readBy: {
          connect: {
            id: admin.id,
          },
        },
      },
    });
    console.log("Contact Form marked as read successfully");
    return true;
  } catch (error) {
    console.error("Error marking contact form as read:", error);
    return false;
  }
}

export async function fetchSpecificContactFormEntry(
  id: number,
  admin: Admins | Session
) {
  try {
    const entry = await prisma.contactForm.findUnique({
      where: {
        id: id,
      },
      include: {
        readBy: true,
      },
    });

    //if entry exists and its not read by this admin, mark it as read
    if (
      entry &&
      !entry.readBy.some((user: Admins | Session) => user.id === admin.id)
    ) {
      await markContactFormAsRead(entry.id, admin);
    }
    return entry;
  } catch (error) {
    console.error("Error fetching specific contact form entry:", error);
    return null;
  }
}

export type ContributorLinks = {
  name: string;
  link: string;
};

export async function addContributorFormEntry(
  name: string,
  email: string,
  phone: string,
  content: string,
  links: ContributorLinks[]
) {
  if (!name || !email || !phone || !content) {
    console.error("Incomplete contributor form details");
    return null;
  }

  const jsonLinks = links.map((link) => ({
    name: link.name,
    link: link.link,
  }));

  try {
    const entry = await prisma.contribution.create({
      data: {
        name,
        email,
        phoneNumber: phone,
        content,
        links: jsonLinks,
      },
    });
    if (entry) {
      console.log("Contributor Form Entry Added Successfully");
      await prisma.notification.create({
        data: {
          type: "ContributorFormSubmit",
          message: `New contributor form submission from ${name} (${email}).`,
        },
      });
      return true;
    } else {
      console.error("Couldn't add contributor form entry");
      return false;
    }
  } catch (error) {
    console.error("Error adding contributor form entry:", error);
    return false;
  }
}

export async function fetchContributorFormEntries() {
  try {
    const entries: Contribution[] = await prisma.contribution.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return entries;
  } catch (error) {
    console.error("Error fetching contributor form entries:", error);
    return [];
  }
}

export async function changeContributionStatus(
  id: number,
  status: ContributionStatus,
  admin: Admins | Session
) {
  try {
    const entry = await prisma.contribution.update({
      where: {
        id: id,
      },
      data: {
        status: status,
      },
    });
    if (entry) {
      console.log("Contribution status updated successfully");
      // send email to contributor about status change (not implemented here)
      const result = await notifyContributionStatusChange(id, status, admin);
      if (!result) {
        console.error("Error notifying contributor about status change");
      }
      return true;
    } else {
      console.error("Couldn't update contribution status");
      return false;
    }
  } catch (error) {
    console.error("Error updating contribution status:", error);
    return false;
  }
}

export async function fetchSpecificContributionEntry(id: number) {
  try {
    const entry = await prisma.contribution.findUnique({
      where: {
        id: id,
      },
    });
    return entry;
  } catch (error) {
    console.error("Error fetching specific contribution entry:", error);
    return null;
  }
}

export async function bulkDeleteBlogs(ids: number[], admin: Admins | Session) {
  if (!ids || ids.length === 0) return false;
  try {
    const deleted = await prisma.blog.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    if (deleted) {
      console.log(`Successfully deleted ${deleted.count} blogs`);
      if (admin) {
        await prisma.notification.create({
          data: {
            type: "AdminBlogDelete",
            message: `${admin.name} deleted ${deleted.count} blogs in bulk.`,
            adminId: admin.id,
            cause: admin.name,
          },
        });
      }
      revalidatePath("/blogs");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error bulk deleting blogs:", error);
    return false;
  }
}

export async function bulkDeleteStoreItems(ids: number[], admin: Admins | Session) {
  if (!ids || ids.length === 0) return false;
  try {
    const deleted = await prisma.storeItem.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    if (deleted) {
      console.log(`Successfully deleted ${deleted.count} store items`);
      if (admin) {
        await prisma.notification.create({
          data: {
            type: "AdminStoreItemDelete",
            message: `${admin.name} deleted ${deleted.count} store items in bulk.`,
            adminId: admin.id,
            cause: admin.name,
          },
        });
      }
      revalidatePath("/store");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error bulk deleting store items:", error);
    return false;
  }
}

export async function fetchImpactPatterns() {
  try {
    return await prisma.impactPattern.findMany({
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error("Error fetching impact patterns:", error);
    return [];
  }
}

export async function addImpactPattern(data: {
  title: string;
  description: string;
  icon: string;
  color: string;
  order?: number;
}) {
  try {
    const pattern = await prisma.impactPattern.create({
      data,
    });
    revalidatePath("/impact");
    revalidatePath("/impact");
    return { success: true, pattern };
  } catch (error) {
    console.error("Error adding impact pattern:", error);
    return { success: false, message: "Failed to add pattern" };
  }
}

export async function updateImpactPattern(id: number, data: any) {
  try {
    await prisma.impactPattern.update({
      where: { id },
      data,
    });
    revalidatePath("/impact");
    revalidatePath("/impact");
    return { success: true };
  } catch (error) {
    console.error("Error updating impact pattern:", error);
    return { success: false, message: "Failed to update pattern" };
  }
}

export async function deleteImpactPattern(id: number) {
  try {
    await prisma.impactPattern.delete({
      where: { id },
    });
    revalidatePath("/impact");
    revalidatePath("/impact");
    return { success: true };
  } catch (error) {
    console.error("Error deleting impact pattern:", error);
    return { success: false, message: "Failed to delete pattern" };
  }
}

export async function fetchImpactReports() {
  try {
    return await prisma.impactReport.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching impact reports:", error);
    return [];
  }
}

export async function addImpactReport(data: {
  title: string;
  description?: string;
  link?: string;
  fileUrl?: string;
  published?: boolean;
}) {
  try {
    const report = await prisma.impactReport.create({
      data,
    });
    revalidatePath("/impact");
    revalidatePath("/impact");
    return { success: true, report };
  } catch (error) {
    console.error("Error adding impact report:", error);
    return { success: false, message: "Failed to add report" };
  }
}

export async function updateImpactReport(id: number, data: any) {
  try {
    await prisma.impactReport.update({
      where: { id },
      data,
    });
    revalidatePath("/impact");
    revalidatePath("/impact");
    return { success: true };
  } catch (error) {
    console.error("Error updating impact report:", error);
    return { success: false, message: "Failed to update report" };
  }
}

export async function deleteImpactReport(id: number) {
  try {
    await prisma.impactReport.delete({
      where: { id },
    });
    revalidatePath("/impact");
    revalidatePath("/impact");
    return { success: true };
  } catch (error) {
    console.error("Error deleting impact report:", error);
    return { success: false, message: "Failed to delete report" };
  }
}
