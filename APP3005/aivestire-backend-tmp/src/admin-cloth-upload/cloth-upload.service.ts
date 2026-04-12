import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, UserRole } from '@prisma/client';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { CloudinaryService } from '../common/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import { SyncAdminClothFolderDto } from './dto/sync-admin-cloth-folder.dto';

interface ClothMetadataItem {
  title: string;
  description?: string;
  category_id?: string;
  sub_category_id?: string;
  category?: string;
  price_cents: number;
  inventory_count?: number;
  occasions?: string[];
  body_shapes?: string[];
  skin_tones?: string[];
  sizes?: string[];
  age_ranges?: string[];
  metadata?: Record<string, unknown>;
  auto_approve?: boolean;
  status?: string;
}

interface ClothMetadataConfig {
  default?: Partial<ClothMetadataItem>;
  items: Record<string, Partial<ClothMetadataItem>>;
}

interface NormalizedClothMetadata extends ClothMetadataItem {
  category: string;
  inventory_count: number;
  status: ProductStatus;
}

interface PreparedUpload {
  fileName: string;
  title: string;
  description: string;
  category: string;
  categoryId?: string;
  subCategoryId?: string;
  priceCents: number;
  inventoryCount: number;
  status: ProductStatus;
  occasions: string[];
  bodyShapes: string[];
  skinTones: string[];
  sizes: string[];
  ageRanges: string[];
  metadata: Prisma.InputJsonValue;
  imageUrl: string;
  cloudinaryPublicId: string;
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.webp']);
const DEFAULT_FOLDER_RELATIVE_PATH = 'admin-cloth-upload/incoming';
const DEFAULT_CLOUDINARY_FOLDER = 'aivestire/collection';
const DEFAULT_CATEGORY = 'Clothing';
const DEFAULT_INVENTORY_COUNT = 10;
const MAX_PRODUCTS_PER_SYNC = 100;
const METADATA_FILE_NAME = 'metadata.json';
const DEFAULT_SYNC_CONCURRENCY = 4;
const MAX_SYNC_CONCURRENCY = 8;
const UPLOAD_MAX_WIDTH = 1600;
const UPLOAD_MAX_HEIGHT = 2000;
const UPLOAD_JPEG_QUALITY = 84;

@Injectable()
export class AdminClothUploadService {
  private readonly logger = new Logger(AdminClothUploadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async syncFromFolder(dto: SyncAdminClothFolderDto) {
    const startedAt = Date.now();
    const inputFolder = this.resolveInputFolder(dto.folder_path);
    if (!fs.existsSync(inputFolder) || !fs.statSync(inputFolder).isDirectory()) {
      throw new NotFoundException(`Upload folder not found: ${inputFolder}`);
    }

    const cloudinaryFolder =
      dto.cloudinary_folder?.trim() || DEFAULT_CLOUDINARY_FOLDER;
    const metadataConfig = this.readMetadataConfig(inputFolder);

    const files = fs
      .readdirSync(inputFolder)
      .filter((fileName) => {
        const fullPath = path.join(inputFolder, fileName);
        if (!fs.statSync(fullPath).isFile()) {
          return false;
        }

        const ext = path.extname(fileName).toLowerCase();
        return ALLOWED_EXTENSIONS.has(ext);
      })
      .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) {
      return {
        success: true,
        folder_path: inputFolder,
        cloudinary_folder: cloudinaryFolder,
        total: 0,
        processed: 0,
        queued: 0,
        imported: 0,
        skipped_duplicates: 0,
        details: [],
        message:
          'No JPG/JPEG/WEBP images found. Add files to the folder and sync again.',
      };
    }

    const filesToProcess = files.slice(0, MAX_PRODUCTS_PER_SYNC);
    const queuedCount = Math.max(files.length - filesToProcess.length, 0);

    const metadataCoverageErrors = this.validateMetadataCoverage(
      metadataConfig,
      filesToProcess,
    );
    if (metadataCoverageErrors.length > 0) {
      throw new BadRequestException(
        `Missing metadata entries for: ${metadataCoverageErrors.slice(0, 10).join(', ')}`,
      );
    }

    const creator = await this.getOrCreateCollectionCreator();

    let skippedDuplicates = 0;
    const details: Array<{ file: string; status: string; reason?: string }> = [];
    const prepared: PreparedUpload[] = [];
    const uploadedPublicIds: string[] = [];
    const seenHashes = new Set<string>();

    const configuredConcurrency = Number(
      process.env.ADMIN_CLOTH_SYNC_CONCURRENCY || DEFAULT_SYNC_CONCURRENCY,
    );
    const concurrency = Number.isFinite(configuredConcurrency)
      ? Math.max(1, Math.min(MAX_SYNC_CONCURRENCY, Math.floor(configuredConcurrency)))
      : DEFAULT_SYNC_CONCURRENCY;

    await this.runWithConcurrency(filesToProcess, concurrency, async (fileName) => {
      const filePath = path.join(inputFolder, fileName);
      const fileBuffer = await fs.promises.readFile(filePath);
      const metadataItem = this.resolveMetadataForImage(metadataConfig, fileName);
      const normalized = this.normalizeMetadata(
        metadataItem,
        fileName,
        dto.default_category,
        dto.auto_approve,
      );

      const fileHash = this.sha256(fileBuffer);

      if (seenHashes.has(fileHash)) {
        skippedDuplicates++;
        details.push({
          file: fileName,
          status: 'skipped',
          reason: 'Duplicate detected within selected batch',
        });
        return;
      }
      seenHashes.add(fileHash);

      const existingByHash = await this.prisma.product.findFirst({
        where: {
          is_deleted: false,
          metadata: {
            path: ['admin_cloth_upload', 'source_file_sha256'],
            equals: fileHash,
          },
        },
        select: {
          product_id: true,
        },
      });

      if (existingByHash) {
        const linkedExisting = await this.linkCategoryForExistingDuplicate(
          existingByHash.product_id,
          normalized,
        );

        skippedDuplicates++;
        details.push({
          file: fileName,
          status: 'skipped',
          reason: linkedExisting
            ? 'Duplicate detected by file hash (category link updated)'
            : 'Duplicate detected by file hash',
        });
        return;
      }

      const optimized = await this.optimizeImageForUpload(
        fileBuffer,
        path.extname(fileName),
      );

      const imageDataUri = this.toDataUri(optimized.buffer, optimized.extension);

      const uploadResult = await this.cloudinaryService.uploadWithMetadata(
        imageDataUri,
        {
          imageType: 'product',
          source: 'admin-cloth-upload',
          source_file_name: fileName,
          source_file_sha256: fileHash,
        },
        cloudinaryFolder,
      );
      uploadedPublicIds.push(uploadResult.publicId);

      const rowMetadata = {
        ...(normalized.metadata && typeof normalized.metadata === 'object'
          ? normalized.metadata
          : {}),
        admin_cloth_upload: {
          source_file_name: fileName,
          source_file_sha256: fileHash,
          source_folder: inputFolder,
          imported_at: new Date().toISOString(),
          cloudinary_public_id: uploadResult.publicId,
          optimized_before_upload: optimized.wasOptimized,
          optimized_bytes: optimized.buffer.length,
        },
      } as Prisma.InputJsonValue;

      prepared.push({
        fileName,
        title: normalized.title,
        description: normalized.description || '',
        category: normalized.category,
        categoryId: normalized.category_id,
        subCategoryId: normalized.sub_category_id,
        priceCents: normalized.price_cents,
        inventoryCount: normalized.inventory_count,
        status: normalized.status,
        occasions: this.safeArray(normalized.occasions),
        bodyShapes: this.safeArray(normalized.body_shapes),
        skinTones: this.safeArray(normalized.skin_tones),
        sizes: this.safeArray(normalized.sizes),
        ageRanges: this.safeArray(normalized.age_ranges),
        metadata: rowMetadata,
        imageUrl: uploadResult.secureUrl,
        cloudinaryPublicId: uploadResult.publicId,
      });
    }).catch(async (error) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Folder sync failed during preparation: ${message}`);
      await this.cleanupUploadedPublicIds(uploadedPublicIds);
      throw new BadRequestException(`Sync failed: ${message}`);
    });

    let imported = 0;
    const reservedSlugs = new Set<string>();
    const reservedCategorySlugs = new Set<string>();
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const row of prepared) {
          const slug = await this.generateUniqueSlugInTx(
            tx,
            row.title,
            reservedSlugs,
          );

          const categoryLink = await this.ensureCategoryLinksInTx(
            tx,
            row.category,
            row.categoryId,
            row.subCategoryId,
            reservedCategorySlugs,
          );

          await tx.product.create({
            data: {
              creator_id: creator.creator_id,
              title: row.title,
              slug,
              description: row.description,
              category: categoryLink.categoryName,
              category_id: categoryLink.categoryId,
              sub_category_id: categoryLink.subCategoryId,
              status: row.status,
              is_deleted: false,
              price_cents: row.priceCents,
              currency: 'INR',
              inventory_count: row.inventoryCount,
              occasions: row.occasions,
              body_shapes: row.bodyShapes,
              skin_tones: row.skinTones,
              sizes: row.sizes,
              age_ranges: row.ageRanges,
              metadata: row.metadata,
              images: {
                create: {
                  url: row.imageUrl,
                  is_primary: true,
                  order_index: 0,
                },
              },
            },
          });

          imported++;
          details.push({ file: row.fileName, status: 'imported' });
        }
      });
    } catch (error) {
      await this.cleanupUploadedPublicIds(uploadedPublicIds);

      const message = error instanceof Error ? error.message : 'Transaction failed';
      throw new BadRequestException(`Product transaction failed: ${message}`);
    }

    const durationMs = Date.now() - startedAt;

    return {
      success: true,
      folder_path: inputFolder,
      cloudinary_folder: cloudinaryFolder,
      total: files.length,
      processed: filesToProcess.length,
      queued: queuedCount,
      imported,
      skipped_duplicates: skippedDuplicates,
      duration_ms: durationMs,
      concurrency,
      details,
      message: `Sync complete. Processed ${filesToProcess.length}/${files.length}, imported ${imported}, skipped ${skippedDuplicates} duplicate(s).`,
    };
  }

  private async runWithConcurrency<T>(
    items: T[],
    concurrency: number,
    handler: (item: T) => Promise<void>,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    let currentIndex = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }).map(
      async () => {
        while (true) {
          const index = currentIndex;
          currentIndex += 1;
          if (index >= items.length) {
            return;
          }
          await handler(items[index]);
        }
      },
    );

    await Promise.all(workers);
  }

  private async optimizeImageForUpload(
    fileBuffer: Buffer,
    extension: string,
  ): Promise<{ buffer: Buffer; extension: string; wasOptimized: boolean }> {
    const ext = extension.toLowerCase();
    const supportsOptimization = ext === '.jpg' || ext === '.jpeg' || ext === '.webp';

    if (!supportsOptimization) {
      return { buffer: fileBuffer, extension, wasOptimized: false };
    }

    try {
      const sharp = (await import('sharp')).default;
      const optimizedBuffer = await sharp(fileBuffer)
        .resize(UPLOAD_MAX_WIDTH, UPLOAD_MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: UPLOAD_JPEG_QUALITY, mozjpeg: true })
        .toBuffer();

      if (optimizedBuffer.length >= fileBuffer.length) {
        return { buffer: fileBuffer, extension, wasOptimized: false };
      }

      return {
        buffer: optimizedBuffer,
        extension: '.jpg',
        wasOptimized: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Image optimization skipped: ${message}`);
      return { buffer: fileBuffer, extension, wasOptimized: false };
    }
  }

  private async cleanupUploadedPublicIds(publicIds: string[]): Promise<void> {
    for (const publicId of publicIds) {
      try {
        await this.cloudinaryService.deleteByPublicId(publicId);
      } catch (cleanupError) {
        const cleanupMessage =
          cleanupError instanceof Error
            ? cleanupError.message
            : 'Unknown cleanup error';
        this.logger.warn(
          `Failed rollback cleanup for Cloudinary public ID ${publicId}: ${cleanupMessage}`,
        );
      }
    }
  }

  private resolveInputFolder(folderPath?: string): string {
    if (folderPath && folderPath.trim().length > 0) {
      return path.isAbsolute(folderPath)
        ? folderPath
        : path.resolve(process.cwd(), folderPath);
    }

    return path.resolve(process.cwd(), DEFAULT_FOLDER_RELATIVE_PATH);
  }

  private readMetadataConfig(inputFolder: string): ClothMetadataConfig {
    const fullPath = path.join(inputFolder, METADATA_FILE_NAME);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(
        `Metadata file not found: ${METADATA_FILE_NAME}`,
      );
    }

    const raw = fs.readFileSync(fullPath, 'utf-8');
    if (!raw.trim()) {
      throw new BadRequestException(`${METADATA_FILE_NAME} is empty`);
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new BadRequestException(
          `${METADATA_FILE_NAME} must be a JSON object`,
        );
      }

      if (!('items' in parsed) || typeof parsed.items !== 'object') {
        throw new BadRequestException(
          `${METADATA_FILE_NAME} must contain an "items" object keyed by image filename`,
        );
      }

      return parsed as ClothMetadataConfig;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON';
      throw new BadRequestException(`Invalid ${METADATA_FILE_NAME}: ${message}`);
    }
  }

  private resolveMetadataForImage(
    config: ClothMetadataConfig,
    fileName: string,
  ): Partial<ClothMetadataItem> {
    const baseName = path.parse(fileName).name;
    const byFullName = config.items[fileName];
    const byBaseName = config.items[baseName];

    if (!byFullName && !byBaseName) {
      throw new BadRequestException(
        `Missing metadata for image: ${fileName}`,
      );
    }

    return {
      ...(config.default || {}),
      ...(byBaseName || {}),
      ...(byFullName || {}),
    };
  }

  private validateMetadataCoverage(
    config: ClothMetadataConfig,
    fileNames: string[],
  ): string[] {
    return fileNames.filter((fileName) => {
      const baseName = path.parse(fileName).name;
      return !config.items[fileName] && !config.items[baseName];
    });
  }

  private normalizeMetadata(
    item: Partial<ClothMetadataItem>,
    fileName: string,
    dtoDefaultCategory?: string,
    dtoAutoApprove?: boolean,
  ): NormalizedClothMetadata {
    const title = item.title?.trim();
    if (!title) {
      throw new BadRequestException(
        `title is required in metadata for ${fileName}`,
      );
    }

    if (typeof item.price_cents !== 'number' || item.price_cents <= 0) {
      throw new BadRequestException(
        `price_cents must be a positive number for ${fileName}`,
      );
    }

    const category =
      item.category?.trim() || dtoDefaultCategory?.trim() || DEFAULT_CATEGORY;

    const inventoryCount =
      typeof item.inventory_count === 'number' &&
      Number.isFinite(item.inventory_count)
        ? Math.max(0, Math.round(item.inventory_count))
        : DEFAULT_INVENTORY_COUNT;

    const status = this.resolveProductStatus(item, dtoAutoApprove);

    return {
      title,
      description: item.description || '',
      category,
      category_id: item.category_id,
      sub_category_id: item.sub_category_id,
      price_cents: Math.round(item.price_cents),
      inventory_count: inventoryCount,
      occasions: this.safeArray(item.occasions),
      body_shapes: this.safeArray(item.body_shapes),
      skin_tones: this.safeArray(item.skin_tones),
      sizes: this.safeArray(item.sizes),
      age_ranges: this.safeArray(item.age_ranges),
      metadata: item.metadata,
      auto_approve: item.auto_approve,
      status: status,
    };
  }

  private resolveProductStatus(
    formItem: Partial<ClothMetadataItem> | undefined,
    dtoAutoApprove: boolean | undefined,
  ): ProductStatus {
    const rawStatus = formItem?.status?.toUpperCase();

    if (rawStatus && ['APPROVED', 'PENDING', 'DRAFT'].includes(rawStatus)) {
      return rawStatus as ProductStatus;
    }

    const effectiveAutoApprove =
      typeof formItem?.auto_approve === 'boolean'
        ? formItem.auto_approve
        : dtoAutoApprove ?? true;

    return effectiveAutoApprove ? ProductStatus.APPROVED : ProductStatus.PENDING;
  }

  private async generateUniqueSlugInTx(
    tx: Prisma.TransactionClient,
    title: string,
    reservedSlugs: Set<string>,
  ): Promise<string> {
    const baseSlug = this.slugify(title);
    let slug = baseSlug;
    let index = 1;

    while (
      reservedSlugs.has(slug) ||
      (await tx.product.findUnique({ where: { slug } }))
    ) {
      slug = `${baseSlug}-${index++}`;
    }

    reservedSlugs.add(slug);

    return slug;
  }

  private async ensureCategoryLinksInTx(
    tx: Prisma.TransactionClient,
    categoryName: string,
    categoryId?: string,
    subCategoryId?: string,
    reservedCategorySlugs?: Set<string>,
  ): Promise<{
    categoryId?: string;
    subCategoryId?: string;
    categoryName: string;
  }> {
    let resolvedCategoryId = categoryId?.trim() || undefined;
    let resolvedCategoryName = categoryName?.trim() || DEFAULT_CATEGORY;

    if (resolvedCategoryId) {
      const existingCategory = await tx.category.findUnique({
        where: { category_id: resolvedCategoryId },
        select: { category_id: true, name: true },
      });

      if (!existingCategory) {
        throw new BadRequestException(
          `Invalid category_id provided: ${resolvedCategoryId}`,
        );
      }

      resolvedCategoryName = existingCategory.name;
    } else {
      const existingCategory = await tx.category.findFirst({
        where: {
          OR: [
            { name: { equals: resolvedCategoryName, mode: 'insensitive' } },
            { slug: this.slugify(resolvedCategoryName) },
          ],
        },
        select: { category_id: true, name: true },
      });

      if (existingCategory) {
        resolvedCategoryId = existingCategory.category_id;
        resolvedCategoryName = existingCategory.name;
      } else {
        const categorySlug = await this.generateUniqueCategorySlugInTx(
          tx,
          resolvedCategoryName,
          reservedCategorySlugs || new Set<string>(),
        );

        const createdCategory = await tx.category.create({
          data: {
            name: resolvedCategoryName,
            slug: categorySlug,
            is_active: true,
          },
          select: { category_id: true, name: true },
        });

        resolvedCategoryId = createdCategory.category_id;
        resolvedCategoryName = createdCategory.name;
      }
    }

    const resolvedSubCategoryId = subCategoryId?.trim() || undefined;
    if (resolvedSubCategoryId) {
      const existingSubCategory = await tx.subCategory.findUnique({
        where: { sub_category_id: resolvedSubCategoryId },
        select: { sub_category_id: true, category_id: true },
      });

      if (!existingSubCategory) {
        throw new BadRequestException(
          `Invalid sub_category_id provided: ${resolvedSubCategoryId}`,
        );
      }

      if (
        resolvedCategoryId &&
        existingSubCategory.category_id !== resolvedCategoryId
      ) {
        throw new BadRequestException(
          `sub_category_id ${resolvedSubCategoryId} does not belong to category_id ${resolvedCategoryId}`,
        );
      }
    }

    return {
      categoryId: resolvedCategoryId,
      subCategoryId: resolvedSubCategoryId,
      categoryName: resolvedCategoryName,
    };
  }

  private async generateUniqueCategorySlugInTx(
    tx: Prisma.TransactionClient,
    categoryName: string,
    reservedCategorySlugs: Set<string>,
  ): Promise<string> {
    const baseSlug = this.slugify(categoryName) || 'category';
    let slug = baseSlug;
    let index = 1;

    while (
      reservedCategorySlugs.has(slug) ||
      (await tx.category.findUnique({ where: { slug } }))
    ) {
      slug = `${baseSlug}-${index++}`;
    }

    reservedCategorySlugs.add(slug);
    return slug;
  }

  private async linkCategoryForExistingDuplicate(
    productId: string,
    normalized: NormalizedClothMetadata,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const categoryLink = await this.ensureCategoryLinksInTx(
        tx,
        normalized.category,
        normalized.category_id,
        normalized.sub_category_id,
        new Set<string>(),
      );

      const product = await tx.product.findUnique({
        where: { product_id: productId },
        select: {
          category: true,
          category_id: true,
          sub_category_id: true,
        },
      });

      if (!product) {
        return false;
      }

      const unchanged =
        product.category === categoryLink.categoryName &&
        product.category_id === (categoryLink.categoryId || null) &&
        product.sub_category_id === (categoryLink.subCategoryId || null);

      if (unchanged) {
        return false;
      }

      await tx.product.update({
        where: { product_id: productId },
        data: {
          category: categoryLink.categoryName,
          category_id: categoryLink.categoryId,
          sub_category_id: categoryLink.subCategoryId,
        },
      });

      return true;
    });
  }

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private toDataUri(fileBuffer: Buffer, extension: string): string {
    const mimeType = this.getMimeType(extension);
    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  }

  private getMimeType(extension: string): string {
    const ext = extension.toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      return 'image/jpeg';
    }
    if (ext === '.webp') {
      return 'image/webp';
    }
    return 'application/octet-stream';
  }

  private sha256(fileBuffer: Buffer): string {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }

  private safeArray(value: string[] | undefined): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((entry) => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  private async getOrCreateCollectionCreator() {
    let creatorUser = await this.prisma.user.findFirst({
      where: { email: 'collections@aivestire.com' },
    });

    if (!creatorUser) {
      creatorUser = await this.prisma.user.create({
        data: {
          email: 'collections@aivestire.com',
          password_hash: 'PLACEHOLDER',
          role: UserRole.CREATOR,
        },
      });
      this.logger.log('Created collection creator user');
    }

    let creator = await this.prisma.creator.findUnique({
      where: { user_id: creatorUser.user_id },
    });

    if (!creator) {
      creator = await this.prisma.creator.create({
        data: {
          user_id: creatorUser.user_id,
          store_name: 'AiVestire Collection',
          store_slug: 'aivestire-collection',
          verified: true,
        },
      });
      this.logger.log('Created collection creator profile');
    }

    return creator;
  }
}
