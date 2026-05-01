import { ReactNode } from "react";
import {
  BiBarChart,
  BiBook,
  BiDonateHeart,
  BiShoppingBag,
  BiStore,
  BiUser,
  BiHeadphone,
  BiBell,
  BiBox,
  BiDirections,
  BiLineChart
} from "react-icons/bi";
import { FiMessageSquare } from "react-icons/fi";

export type BarItem = {
  name: string;
  link: string;
  icon: ReactNode;
};

export type NavSection = {
  title: string;
  items: BarItem[];
};

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { name: "Analytics", link: "", icon: <BiBarChart /> },
      { name: "Notifications", link: "notifications", icon: <BiBell /> },
    ]
  },
  {
    title: "Content",
    items: [
      { name: "Blogs", link: "blogs", icon: <BiBook /> },
      { name: "Next Steps", link: "blog-next-steps", icon: <BiDirections /> },
      { name: "Impact", link: "impact", icon: <BiLineChart /> },
    ]
  },
  {
    title: "Commerce",
    items: [
      { name: "Store", link: "store", icon: <BiStore /> },
      { name: "Toolkits", link: "bundles", icon: <BiBox /> }, 
      { name: "Orders", link: "orders", icon: <BiShoppingBag /> },
      { name: "Donations", link: "donations", icon: <BiDonateHeart /> },
    ]
  },
  {
    title: "System",
    items: [
      { name: "Memos", link: "memos", icon: <FiMessageSquare /> },
      { name: "Contact", link: "contact", icon: <BiHeadphone /> },
      { name: "Admins", link: "admins", icon: <BiUser /> },
    ]
  }
];

export const barItems: BarItem[] = navSections.flatMap(s => s.items);
