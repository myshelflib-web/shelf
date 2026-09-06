import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { publicLearnSubjectWhere } from "../services/contentGen/publicLearnSubject.js";

type SitemapRoute = {
  path: string;
  lastModified?: string;
};

/**
 * Lightweight Learn URL list for sitemap.xml.
 * Must be registered before `GET /:slug` so "sitemap-slugs" is not captured.
 */
export function registerSubjectsSitemapRoutes(router: Router): void {
  router.get("/sitemap-slugs", async (_req: Request, res: Response) => {
    const subjects = await prisma.subject.findMany({
      where: publicLearnSubjectWhere(),
      orderBy: { order: "asc" },
      select: {
        slug: true,
        createdAt: true,
        topics: {
          orderBy: { order: "asc" },
          select: {
            slug: true,
            updatedAt: true,
            articles: {
              where: { status: "PUBLISHED" },
              orderBy: { order: "asc" },
              select: { slug: true, updatedAt: true },
            },
          },
        },
      },
    });

    const routes: SitemapRoute[] = [];

    for (const subject of subjects) {
      const topics = subject.topics.filter((t) => t.articles.length > 0);
      if (topics.length === 0) continue;

      const subjectModified = topics.reduce((latest, topic) => {
        const topicTs = topic.updatedAt.getTime();
        return topicTs > latest ? topicTs : latest;
      }, subject.createdAt.getTime());

      routes.push({
        path: `/learn/${subject.slug}`,
        lastModified: new Date(subjectModified).toISOString(),
      });

      for (const topic of topics) {
        routes.push({
          path: `/learn/${subject.slug}/${topic.slug}`,
          lastModified: topic.updatedAt.toISOString(),
        });
        for (const article of topic.articles) {
          routes.push({
            path: `/learn/${subject.slug}/${topic.slug}/${article.slug}`,
            lastModified: article.updatedAt.toISOString(),
          });
        }
      }
    }

    res.json({ routes });
  });
}
