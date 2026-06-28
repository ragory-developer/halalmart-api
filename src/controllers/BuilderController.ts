import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { asyncHandler } from '../utils/helpers';
import { BuilderDocument, createDefaultHomeDocument, createDefaultLandingDocument, validateBuilderDocument } from '../validators/builder.schema';
import { BaseController } from './BaseController';

function getParam(value: string | string[] | undefined, name: string) {
  if (typeof value !== 'string') {
    throw new BadRequestError(`Invalid ${name}`);
  }
  return value;
}

function toInputJson(document: BuilderDocument): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(document)) as Prisma.InputJsonValue;
}

function normalizePageMeta(key: string, document?: BuilderDocument) {
  const isKeyMatch = document?.page.key === key;
  return {
    key,
    slug: (isKeyMatch ? document?.page.slug : null) || (key === 'home' ? '/' : `/${key}`),
    title: (isKeyMatch ? document?.page.title : null) || (key === 'home' ? 'Home' : key),
  };
}

export class BuilderController extends BaseController {
  private async ensurePage(key: string, document?: BuilderDocument) {
    const meta = normalizePageMeta(key, document);
    return await prisma.builderPage.upsert({
      where: { key },
      update: {},
      create: {
        key,
        slug: meta.slug,
        title: meta.title,
      },
    });
  }

  private async ensurePageSeed(key: string) {
    if (key === 'home') {
      await this.ensureHomeSeed();
    } else if (key === 'product_template') {
      await this.ensureProductTemplateSeed();
    }
  }

  private async ensureProductTemplateSeed() {
    const existing = await prisma.builderPage.findUnique({
      where: { key: 'product_template' },
      include: { versions: { take: 1 } },
    });

    if (existing && existing.versions.length > 0) return;

    const document: BuilderDocument = {
      schemaVersion: 1,
      page: {
        key: 'product_template',
        slug: '/products/:slug',
        title: 'Product Template',
      },
      sections: [
        {
          id: 'product_overview',
          type: 'ProductOverviewSection',
          props: {
            showFlashSale: true,
            showTrustBadges: true,
            showSku: true,
          },
        },
        {
          id: 'product_tabs',
          type: 'ProductTabsSection',
          props: {},
        },
        {
          id: 'product_upsell',
          type: 'ProductUpsellSection',
          props: {},
        },
        {
          id: 'product_downsell',
          type: 'ProductDownsellSection',
          props: {},
        },
        {
          id: 'product_reviews',
          type: 'ProductReviewsSection',
          props: {},
        },
      ],
    };

    try {
      await prisma.$transaction(async (tx) => {
        const page = existing || await tx.builderPage.create({
          data: {
            key: 'product_template',
            slug: '/products/:slug',
            title: 'Product Template',
            type: 'builder',
          },
        });

        const version = await tx.builderPageVersion.create({
          data: {
            pageId: page.id,
            version: 1,
            status: 'published',
            document: toInputJson(document),
            publishedAt: new Date(),
          },
        });

        await tx.builderPage.update({
          where: { id: page.id },
          data: {
            status: 'published',
            draftVersionId: version.id,
            publishedVersionId: version.id,
          },
        });
      }, { maxWait: 10000, timeout: 30000 });
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Wait 150ms to allow the concurrent transaction to commit
        await new Promise((resolve) => setTimeout(resolve, 150));
        return;
      }
      throw error;
    }
  }

  private async ensureHomeSeed() {
    const existing = await prisma.builderPage.findUnique({
      where: { key: 'home' },
      include: { versions: { take: 1 } },
    });

    if (existing && existing.versions.length > 0) return;

    const defaultTemplate = await prisma.builderTemplate.findUnique({
      where: { key: 'default-home' },
    });

    const document = defaultTemplate
      ? (defaultTemplate.document as any)
      : createDefaultHomeDocument();

    try {
      await prisma.$transaction(async (tx) => {
        const page = existing || await tx.builderPage.create({
          data: {
            key: 'home',
            slug: '/',
            title: 'Home',
          },
        });

        const version = await tx.builderPageVersion.create({
          data: {
            pageId: page.id,
            version: 1,
            status: 'published',
            document: toInputJson(document),
            publishedAt: new Date(),
          },
        });

        await tx.builderPage.update({
          where: { id: page.id },
          data: {
            status: 'published',
            draftVersionId: version.id,
            publishedVersionId: version.id,
          },
        });
      }, { maxWait: 10000, timeout: 30000 });
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Wait 150ms to allow the concurrent transaction to commit
        await new Promise((resolve) => setTimeout(resolve, 150));
        return;
      }
      throw error;
    }
  }

  getAdminPage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const key = getParam(req.params.key, 'page key');
    await this.ensurePageSeed(key);

    const page = await prisma.builderPage.findUnique({ where: { key } });
    if (!page) throw new NotFoundError('Builder page not found');

    const [draft, published] = await Promise.all([
      page.draftVersionId
        ? prisma.builderPageVersion.findUnique({ where: { id: page.draftVersionId } })
        : null,
      page.publishedVersionId
        ? prisma.builderPageVersion.findUnique({ where: { id: page.publishedVersionId } })
        : null,
    ]);

    res.json({
      success: true,
      data: {
        page,
        draft,
        published,
        dirty: draft?.id !== published?.id,
      },
    });
  });

  saveDraft = asyncHandler(async (req: AuthRequest, res: Response) => {
    const key = getParam(req.params.key, 'page key');
    let document: BuilderDocument;

    try {
      document = validateBuilderDocument(req.body.document);
    } catch (error: any) {
      throw new BadRequestError(error.message || 'Invalid builder document');
    }

    if (document.page.key !== key) {
      throw new BadRequestError('Document page key does not match route key');
    }

    let retries = 0;
    const maxRetries = 3;
    let result;

    while (retries < maxRetries) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const page = await tx.builderPage.upsert({
            where: { key },
            update: {},
            create: {
              key,
              slug: document.page.slug,
              title: document.page.title,
            },
          });

          const latest = await tx.builderPageVersion.findFirst({
            where: { pageId: page.id },
            orderBy: { version: 'desc' },
          });

          const draft = await tx.builderPageVersion.create({
            data: {
              pageId: page.id,
              version: (latest?.version || 0) + 1,
              status: 'draft',
              document: toInputJson(document),
              createdById: req.user?.userId,
            },
          });

          const updatedPage = await tx.builderPage.update({
            where: { id: page.id },
            data: {
              title: document.page.title,
              slug: document.page.slug,
              status: page.publishedVersionId ? 'published' : 'draft',
              draftVersionId: draft.id,
            },
          });

          return { page: updatedPage, draft };
        }, { maxWait: 10000, timeout: 30000 });
        break; // Success!
      } catch (error: any) {
        if (error.code === 'P2002' && retries < maxRetries - 1) {
          retries++;
          // Sleep for a short jittered delay before retrying
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));
          continue;
        }
        throw error;
      }
    }

    res.json({ success: true, data: result, message: 'Draft saved' });
  });

  publish = asyncHandler(async (req: AuthRequest, res: Response) => {
    const key = getParam(req.params.key, 'page key');
    const page = await this.ensurePage(key);
    const draftVersionId = req.body.draftVersionId || page.draftVersionId;

    if (!draftVersionId) {
      throw new BadRequestError('No draft available to publish');
    }

    const result = await prisma.$transaction(async (tx) => {
      const draft = await tx.builderPageVersion.findUnique({ where: { id: draftVersionId } });
      if (!draft || draft.pageId !== page.id) {
        throw new BadRequestError('Draft version not found for this page');
      }

      let document: BuilderDocument;
      try {
        document = validateBuilderDocument(draft.document);
      } catch (error: any) {
        throw new BadRequestError(error.message || 'Draft is invalid');
      }

      await tx.builderPageVersion.updateMany({
        where: { pageId: page.id, status: 'published' },
        data: { status: 'archived' },
      });

      const published = await tx.builderPageVersion.update({
        where: { id: draft.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
        },
      });

      const updatedPage = await tx.builderPage.update({
        where: { id: page.id },
        data: {
          status: 'published',
          title: document.page.title,
          slug: document.page.slug,
          draftVersionId: published.id,
          publishedVersionId: published.id,
        },
      });

      return { page: updatedPage, published };
    }, { maxWait: 10000, timeout: 30000 });

    res.json({ success: true, data: result, message: 'Page published' });
  });

  getVersions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const key = getParam(req.params.key, 'page key');
    const page = await prisma.builderPage.findUnique({ where: { key } });
    if (!page) throw new NotFoundError('Builder page not found');

    const versions = await prisma.builderPageVersion.findMany({
      where: { pageId: page.id },
      orderBy: { version: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: versions });
  });

  getPacks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const where = req.user?.role === 'SUPER_ADMIN' ? {} : { status: 'unlocked' };
    const packs = await prisma.builderTemplatePack.findMany({
      where,
      include: { templates: true },
    });
    res.json({ success: true, data: packs });
  });

  getPublicPage = asyncHandler(async (req: Request, res: Response) => {
    const key = getParam(req.params.key, 'page key');
    await this.ensurePageSeed(key);

    const page = await prisma.builderPage.findUnique({ where: { key } });
    if (!page) {
      throw new NotFoundError('Published page not found');
    }

    const now = new Date();
    
    // 1. Try to find an active scheduled campaign version
    let published = await prisma.builderPageVersion.findFirst({
      where: {
        pageId: page.id,
        status: 'published',
        activeFrom: { lte: now },
        activeTo: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fall back to the default published version
    if (!published && page.publishedVersionId) {
      published = await prisma.builderPageVersion.findUnique({
        where: { id: page.publishedVersionId },
      });
    }

    if (!published || published.status !== 'published') {
      throw new NotFoundError('Published page not found');
    }

    res.json({
      success: true,
      data: {
        page,
        version: {
          id: published.id,
          version: published.version,
          publishedAt: published.publishedAt,
          document: published.document,
        },
      },
    });
  });

  getTemplates = asyncHandler(async (req: Request, res: Response) => {
    const scope = req.query.scope as string;
    const themeKey = req.query.themeKey as string;
    const pageType = req.query.pageType as string;

    const where: any = {};
    if (scope) where.scope = scope;
    if (themeKey) {
      where.themeKey = themeKey === 'null' ? null : themeKey;
    }
    if (pageType) where.pageType = pageType;

    const templates = await prisma.builderTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: templates });
  });

  getTemplateById = asyncHandler(async (req: Request, res: Response) => {
    const id = getParam(req.params.id, 'id');
    const template = await prisma.builderTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundError('Builder template not found');
    res.json({ success: true, data: template });
  });

  createTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { key, name, scope, pageType, themeKey, thumbnail, document } = req.body;

    if (!name || !scope || !document) {
      throw new BadRequestError('Name, scope, and document are required');
    }

    if (scope === 'page' || scope === 'theme') {
      try {
        validateBuilderDocument(document);
      } catch (err: any) {
        throw new BadRequestError(err.message || 'Invalid builder document');
      }
    }

    const generatedKey = key || `${scope}-${Date.now()}`;

    const template = await prisma.builderTemplate.create({
      data: {
        key: generatedKey,
        name,
        scope,
        pageType: pageType || 'home',
        themeKey: themeKey || null,
        thumbnail: thumbnail || null,
        document: JSON.parse(JSON.stringify(document)),
        isSystem: false,
        createdById: req.user?.userId,
      },
    });

    res.status(201).json({ success: true, data: template, message: 'Template saved' });
  });

  applyTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const key = getParam(req.params.key, 'page key');
    const { templateId } = req.body;
    if (!templateId) throw new BadRequestError('templateId is required');

    const template = await prisma.builderTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundError('Template not found');

    const result = await prisma.$transaction(async (tx) => {
      // Ensure target page exists, resolving meta from target page key
      const page = await this.ensurePage(key);
      
      const latest = await tx.builderPageVersion.findFirst({
        where: { pageId: page.id },
        orderBy: { version: 'desc' },
      });

      // Clone template document and update its page metadata to match target page
      const clonedDoc = JSON.parse(JSON.stringify(template.document)) as any;
      clonedDoc.page = {
        key: page.key,
        slug: page.slug,
        title: page.title,
        theme: template.themeKey,
      };

      const draft = await tx.builderPageVersion.create({
        data: {
          pageId: page.id,
          version: (latest?.version || 0) + 1,
          status: 'draft',
          document: toInputJson(clonedDoc),
          createdById: req.user?.userId,
        },
      });

      const updatedPage = await tx.builderPage.update({
        where: { id: page.id },
        data: {
          status: page.publishedVersionId ? 'published' : 'draft',
          draftVersionId: draft.id,
        },
      });

      return { page: updatedPage, draft };
    });

    res.json({ success: true, data: result, message: 'Template applied as draft' });
  });

  deleteTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = getParam(req.params.id, 'id');
    const template = await prisma.builderTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundError('Template not found');
 
    if (template.isSystem) {
       throw new BadRequestError('System templates cannot be deleted');
    }
 
    await prisma.builderTemplate.delete({ where: { id } });
    res.json({ success: true, message: 'Template deleted successfully' });
  });

  getComponents = asyncHandler(async (req: Request, res: Response) => {
    const components = await prisma.builderComponent.findMany({
      include: {
        contents: true,
      },
    });

    const formatted = components.map((comp) => {
      const defaultProps: Record<string, any> = {};
      for (const content of comp.contents) {
        defaultProps[content.key] = content.value;
      }
      return {
        id: comp.id,
        name: comp.name,
        label: comp.label,
        category: comp.category,
        defaultProps,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  });

  registerComponent = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, label, category, defaultProps } = req.body;
    
    if (!name || !label || !category) {
      throw new BadRequestError('Name, label, and category are required');
    }

    const component = await prisma.$transaction(async (tx) => {
      const comp = await tx.builderComponent.upsert({
        where: { name },
        update: { label, category },
        create: { name, label, category },
      });

      if (defaultProps && typeof defaultProps === 'object') {
        // Clear old props
        await tx.builderComponentContent.deleteMany({
          where: { componentId: comp.id }
        });
        
        // Add new props
        const contents = Object.entries(defaultProps).map(([key, value]) => ({
          componentId: comp.id,
          key,
          value: value as any,
        }));
        
        if (contents.length > 0) {
          await tx.builderComponentContent.createMany({ data: contents });
        }
      }

      return tx.builderComponent.findUnique({
        where: { id: comp.id },
        include: { contents: true }
      });
    });

    res.status(201).json({ success: true, data: component, message: 'Component registered' });
  });

  getPages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const pages = await prisma.builderPage.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          select: { id: true, version: true, status: true, publishedAt: true },
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    });

    res.json({
      success: true,
      data: pages
    });
  });

  createPage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, key, slug } = req.body;
    if (!title || !key || !slug) {
      throw new BadRequestError('Title, key, and slug are required');
    }

    const existing = await prisma.builderPage.findUnique({ where: { key } });
    if (existing) {
      throw new BadRequestError('A page with this key already exists');
    }

    const document = createDefaultLandingDocument(key, slug, title);

    const result = await prisma.$transaction(async (tx) => {
      const page = await tx.builderPage.create({
        data: {
          key,
          slug,
          title,
          type: 'builder',
          status: 'draft',
        },
      });

      const draft = await tx.builderPageVersion.create({
        data: {
          pageId: page.id,
          version: 1,
          status: 'draft',
          document: toInputJson(document),
          createdById: req.user?.userId,
        },
      });

      const updatedPage = await tx.builderPage.update({
        where: { id: page.id },
        data: {
          draftVersionId: draft.id,
        },
      });

      return { page: updatedPage, draft };
    });

    res.status(201).json({ success: true, data: result, message: 'Page created' });
  });

  deletePage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const key = getParam(req.params.key, 'page key');
    
    if (key === 'home' || key === 'product_template') {
      throw new BadRequestError('Cannot delete system pages');
    }

    const page = await prisma.builderPage.findUnique({ where: { key } });
    if (!page) {
      throw new NotFoundError('Page not found');
    }

    await prisma.builderPage.delete({ where: { key } });

    res.json({ success: true, message: 'Page deleted successfully' });
  });
}
