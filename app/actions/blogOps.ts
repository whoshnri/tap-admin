"use server";
import { prisma } from "@/prisma/engine";
import { BlogCategory, Prisma } from "@/app/generated/prisma/client";
import { Blog } from "@/app/generated/prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";

export async function purgeBlogCache() {
  try {
    revalidateTag("blog-list");
    revalidateTag("blog-featured");
    revalidateTag("blog-categories");
    revalidateTag("blog-popular");
    return { success: true };
  } catch (error) {
    console.error("purgeBlogCache error:", error);
    return { success: false };
  }
}

export async function fetchBlogs(start: number, shift: number, searchString?: string, category?: string) {
  try {
    const whereClause: any = {};

    if (searchString) {
      whereClause.OR = [
        { title: { contains: searchString } },
        { subtitle: { contains: searchString } },
        { content: { contains: searchString } },
        { category: { contains: searchString } }
      ];
    }

    whereClause.published = true;

    if (category && category !== "All" && category !== "All Posts") {
      whereClause.category = category;
    }

    const blogs: Blog[] = await prisma.blog.findMany({
      where: whereClause,
      skip: start,
      take: shift,
      orderBy: { date: "desc" },
    });

    return blogs;
  } catch (error) {
    console.error("fetchBlogs error:", error);
  }
}

export async function fetchBlogsByIds(ids: (number | string)[]) {
  try {
    const numericIds = ids.filter(id => typeof id === 'number' || !isNaN(Number(id))).map(id => Number(id));
    const stringIds = ids.filter(id => typeof id === 'string' && isNaN(Number(id))) as string[];

    const blogs = await prisma.blog.findMany({
      where: {
        OR: [
          { id: { in: numericIds } },
          { cuid: { in: stringIds } },
          { slug: { in: stringIds } }
        ],
        published: true
      },
      orderBy: { date: "desc" }
    });
    return blogs;
  } catch (error) {
    console.error("fetchBlogsByIds error:", error);
    return [];
  }
}

export type BlogwithComments = Prisma.BlogGetPayload<{
  include: { 
    comments: true;
    nextSteps: true;
  };
}>;

export async function fetchBlog(slug: string) {
  try {
    const blog: BlogwithComments | null = await prisma.blog.findUnique({
      where: { slug: slug },
      include: { 
        comments: true,
        nextSteps: true,
      },
    });

    if (!blog) {
      throw new Error("Blog not found");
    }

    return blog;
  } catch (error) {
    console.error("fetchBlog error:", error);
  }
}

export async function addLike(slug: string) {
  try {
    await prisma.blog.update({
      where: { slug: slug },
      data: { likes: { increment: 1 } },
    });
    revalidateTag(`blog-single-${slug}`);
    return true;
  } catch (error) {
    console.error("addLike error:", error);
    throw new Error("Failed to add like");
  }
}

export async function removeLike(slug: string) {
  try {
    await prisma.blog.update({
      where: { slug: slug },
      data: { likes: { decrement: 1 } },
    });
    revalidateTag(`blog-single-${slug}`);
    return true;
  } catch (error) {
    console.error("removeLike error:", error);
    throw new Error("Failed to remove like");
  }
}

export async function addView(blogId: string) {
  try {
    await prisma.blog.update({
      where: { cuid: blogId },
      data: { views: { increment: 1 } },
    });
    revalidateTag(`blog-single-${blogId}`);
    return true;
  } catch (error) {
    console.error("addView error:", error);
    throw new Error("Failed to add view");
  }
}

export async function addComment({
  blogId,
  comment,
  author,
}: {
  blogId: number;
  comment: string;
  author: string;
}) {
  try {
    const newComment = await prisma.comment.create({
      data: {
        blogId,
        content: comment,
        author,
      },
    });

    // Revalidate Specific Blog Cache
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      select: { cuid: true },
    });
    if (blog) {
      revalidateTag(`blog-single-${blog.cuid}`);
    }

    revalidateTag("blog-list");
    revalidatePath("/blogs");

    return { success: true, comment: newComment };
  } catch (error) {
    console.error("addComment error:", error);
    return { success: false, error: "Database error" };
  }
}

export async function fetchFeaturedBlog() {
  try {
    let blog = await prisma.blog.findFirst({
      where: { featured: true, published: true },
      orderBy: { date: "desc" },
    });

    // Fallback to most recent published
    if (!blog) {
      blog = await prisma.blog.findFirst({
        where: { published: true },
        orderBy: { date: "desc" },
      });
    }

    return blog;
  } catch (error) {
    console.error("fetchFeaturedBlog error:", error);
    return null;
  }
}

export async function fetchPopularBlogs() {
  try {
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      orderBy: { views: "desc" },
      take: 5,
    });
    return blogs;
  } catch (error) {
    console.error("fetchPopularBlogs error:", error);
    return [];
  }
}

export async function fetchSuggestedBlogs(category: BlogCategory): Promise<Blog[]> {
  try {
    let wantedBlogs: Blog[] = await prisma.blog.findMany({
      where: { category, published: true },
      orderBy: { views: "desc" },
      take: 6,
    });

    // If not enough, backfill with top published blogs from other categories
    if (wantedBlogs.length < 6) {
      const more = await prisma.blog.findMany({
        where: { category: { not: category }, published: true },
        orderBy: { views: "desc" },
        take: 6 - wantedBlogs.length,
      });

      wantedBlogs = [...wantedBlogs, ...more];
    }
    return wantedBlogs;
  } catch (error) {
    console.error("fetchSuggestedBlogs error:", error);
    return [];
  }
}

export async function fetchBlogCategoriesWithCounts(): Promise<{ name: string; count: number }[]> {
  try {
    const categories = await prisma.blog.groupBy({
      where: { published: true },
      by: ["category"],
      _count: {
        id: true,
      },
    });

    return categories.map(c => ({
      name: c.category,
      count: c._count.id,
    }));
  } catch (error) {
    console.error("fetchBlogCategoriesWithCounts error:", error);
    return [];
  }
}

export async function fetchBlogCategories(): Promise<string[]> {
  try {
    const categories = await prisma.blog.findMany({
      where: { published: true },
      select: { category: true },
      distinct: ["category"],
    });
    return ["All Posts", ...categories.map((c) => c.category)];
  } catch (error) {
    console.error("fetchBlogCategories error:", error);
    return ["All Posts"];
  }
}

export async function createBlog(data: {
  title: string;
  slug: string;
  subtitle?: string;
  content: string;
  category: BlogCategory;
  image?: string;
  excerpt?: string;
  authorName?: string;
  featured?: boolean;
  published?: boolean;
  audience?: "parents" | "institutions";
  categories?: BlogCategory[];
  nextSteps?: { id: number }[];
  showCallout?: boolean;
}) {
  try {
    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        slug: data.slug,
        subtitle: data.subtitle,
        content: data.content,
        category: data.category || BlogCategory.parenting,
        image: data.image,
        excerpt: data.excerpt,
        authorName: data.authorName || "The African Parent",
        featured: data.featured || false,
        published: data.published !== undefined ? data.published : true,
        showCallout: data.showCallout || false,
        audience: data.audience || "parents",
        categories: Array.from(new Set([data.category, ...(data.categories || [])])),
        nextSteps: data.nextSteps ? {
          connect: data.nextSteps.map(ns => ({ id: ns.id })),
        } : undefined,
      },
    });

    await purgeBlogCache();
    revalidatePath("/blogs");

    return { success: true, blog };
  } catch (error) {
    console.error("createBlog error:", error);
    return { success: false, error: "Failed to create blog post" };
  }
}

export async function updateBlog(id: string, data: {
  title: string;
  slug: string;
  subtitle?: string;
  content: string;
  category: BlogCategory;
  image?: string;
  excerpt?: string;
  authorName?: string;
  featured?: boolean;
  published?: boolean;
  audience?: "parents" | "institutions";
  categories?: BlogCategory[];
  nextSteps?: { id: number }[];
  showCallout?: boolean;
}) {

  try {
    const blog = await prisma.blog.update({
      where: { slug: id },
      data: {
        title: data.title,
        slug: data.slug,
        subtitle: data.subtitle,
        content: data.content,
        category: data.category,
        image: data.image,
        excerpt: data.excerpt,
        authorName: data.authorName || "The African Parent",
        featured: data.featured || false,
        published: data.published !== undefined ? data.published : true,
        showCallout: data.showCallout || false,
        audience: data.audience,
        categories: Array.from(new Set([data.category, ...(data.categories || [])])),
        nextSteps: data.nextSteps ? {
          set: data.nextSteps.map(ns => ({ id: ns.id })),
        } : undefined,
      },
    });

    await purgeBlogCache();
    revalidatePath("/blogs");
    revalidateTag(`blog-single-${id}`);

    return { success: true, blog };
  } catch (error) {
    console.error("updateBlog error:", error);
    return { success: false, error: "Failed to update blog post" };
  }
}

export async function updateBlogMetadata(id: string, data: {
  title?: string;
  slug?: string;
  subtitle?: string;
  category?: BlogCategory;
  categories?: BlogCategory[];
  image?: string;
  excerpt?: string;
  authorName?: string;
  featured?: boolean;
  published?: boolean;
  audience?: "parents" | "institutions";
  nextSteps?: number[]; // IDs of next steps
  showCallout?: boolean;
}) {
  try {
    const updateData: any = { ...data };
    
    if (data.nextSteps) {
      updateData.nextSteps = {
        set: data.nextSteps.map(stepId => ({ id: stepId }))
      };
    }

    const blog = await prisma.blog.update({
      where: { cuid: id },
      data: updateData,
    });

    await purgeBlogCache();
    revalidatePath("/blogs");
    revalidateTag(`blog-single-${id}`);

    return { success: true, blog };
  } catch (error) {
    console.error("updateBlogMetadata error:", error);
    return { success: false, error: "Failed to update blog metadata" };
  }
}

// BlogNextStep CRUD Operations

export async function createNextStep(data: {
  title: string;
  link: string;
  desc?: string;
}) {
  try {
    const nextStep = await prisma.blogNextStep.create({
      data: {
        title: data.title,
        link: data.link,
        desc: data.desc,
      },
    });
    return { success: true, nextStep };
  } catch (error) {
    console.error("createNextStep error:", error);
    return { success: false, error: "Failed to create next step" };
  }
}

export async function updateNextStep(id: number, data: {
  title?: string;
  link?: string;
  desc?: string;
}) {
  try {
    const nextStep = await prisma.blogNextStep.update({
      where: { id },
      data,
    });
    return { success: true, nextStep };
  } catch (error) {
    console.error("updateNextStep error:", error);
    return { success: false, error: "Failed to update next step" };
  }
}

export async function deleteNextStep(id: number) {
  try {
    await prisma.blogNextStep.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("deleteNextStep error:", error);
    return { success: false, error: "Failed to delete next step" };
  }
}

export async function getNextStepsForBlog(blogId: number) {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      select: { nextSteps: true },
    });
    return blog?.nextSteps || [];
  } catch (error) {
    console.error("getNextStepsForBlog error:", error);
    return [];
  }
}

export async function getAllNextSteps() {
  try {
    const nextSteps = await prisma.blogNextStep.findMany({
      orderBy: { title: "asc" },
    });
    return nextSteps;
  } catch (error) {
    console.error("getAllNextSteps error:", error);
    return [];
  }
}

export async function toggleNextStepOnBlog(blogId: number, nextStepId: number, active: boolean) {
  try {
    await prisma.blog.update({
      where: { id: blogId },
      data: {
        nextSteps: active ? { connect: { id: nextStepId } } : { disconnect: { id: nextStepId } }
      }
    });
    revalidatePath("/blogs");
    return { success: true };
  } catch (error) {
    console.error("toggleNextStepOnBlog error:", error);
    return { success: false, error: "Failed to toggle next step" };
  }
}
