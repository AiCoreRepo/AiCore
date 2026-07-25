import { Injectable, Logger } from '@nestjs/common';
import { Occasion } from './enums/recommendation.enum';
import {
  RecommendationsResponseDto,
  RecommendationItemDto,
} from './dto/recommendation-response.dto';
import { PrismaService } from '../prisma/prisma.service';

export interface RecommendationProfile {
  ageRange?: string | null;
  skinTone?: string | null;
  gender?: string | null;
  bodyShape?: string | null;
  size?: string | null;
}

const normalizeToken = (value?: string | null): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

export const normalizeRecommendationAudience = (
  gender?: string | null,
): 'mens' | 'womens' | null => {
  const value = normalizeToken(gender);
  if (['male', 'man', 'men', 'mens', "men's"].includes(value)) return 'mens';
  if (['female', 'woman', 'women', 'womens', "women's"].includes(value))
    return 'womens';
  return null;
};

export const productMatchesRecommendationAudience = (
  metadata: unknown,
  gender?: string | null,
): boolean => {
  const requestedAudience = normalizeRecommendationAudience(gender);
  if (!requestedAudience) return true;

  const productMetadata =
    metadata && typeof metadata === 'object'
      ? (metadata as Record<string, unknown>)
      : {};
  const productAudience = normalizeRecommendationAudience(
    String(productMetadata.audience || productMetadata.gender || ''),
  );

  if (requestedAudience === 'mens') return productAudience === 'mens';
  // The legacy 200-item collection predates the audience field and is womenswear.
  return productAudience !== 'mens';
};

const matchesAttribute = (values: unknown, target?: string | null): boolean => {
  const normalizedTarget = normalizeToken(target);
  if (!normalizedTarget || values == null) return false;
  const candidates = Array.isArray(values) ? values : [values];
  return candidates.some((value) => {
    const normalizedValue = normalizeToken(String(value));
    return (
      normalizedValue === normalizedTarget ||
      normalizedValue.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedValue)
    );
  });
};

@Injectable()
export class DummyRecommendationService {
  private readonly logger = new Logger(DummyRecommendationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDummyRecommendations(
    occasion: Occasion,
    profile: RecommendationProfile = {},
  ): Promise<RecommendationsResponseDto> {
    const { ageRange, skinTone, gender, bodyShape, size } = profile;
    const requestedAudience = normalizeRecommendationAudience(gender);
    this.logger.log(
      `Getting DB-based recommendations for occasion=${occasion}, audience=${requestedAudience || 'all'}`,
    );

    try {
      // Fetch products from database
      const allProducts = await this.prisma.product.findMany({
        where: {
          status: 'APPROVED',
          is_deleted: false,
          inventory_count: { gt: 0 },
        },
        include: {
          images: {
            orderBy: { order_index: 'asc' },
          },
          creator: {
            select: { store_name: true },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 300, // Fetch even more comparisons
      });

      const audienceProducts = allProducts.filter((product) =>
        productMatchesRecommendationAudience(product.metadata, gender),
      );

      this.logger.log(
        `🔍 Fetched ${allProducts.length} products; ${audienceProducts.length} match audience=${requestedAudience || 'all'}`,
      );

      // Debug: Log the metadata of the first 3 products to see structure
      if (allProducts.length > 0) {
        this.logger.log(
          `📄 Sample Metadata (Product 1): ${JSON.stringify(allProducts[0].metadata)}`,
        );
      }

      // --- SCORING & FILTERING LOGIC ---

      const scoredProducts = audienceProducts.map((product) => {
        let score = 0;
        const debugReasons: string[] = [];

        const metadata = product.metadata as any;
        const pTitle = (product.title || '').toLowerCase();
        const pDesc = (product.description || '').toLowerCase();

        // 1. Occasion Check (Weighted High - Essential)
        // Check metadata first
        const occasionsValue =
          product.occasions?.length > 0
            ? product.occasions
            : metadata
              ? metadata.occasions ||
                metadata.occasion ||
                metadata.Occasion ||
                metadata['@Occasion']
              : null;
        const searchOccasion = normalizeToken(occasion);
        let matchesOccasion = matchesAttribute(occasionsValue, occasion);

        // Fallback: Check Title/Description if metadata missing or didn't match
        if (!matchesOccasion) {
          if (
            pTitle.includes(searchOccasion) ||
            pDesc.includes(searchOccasion)
          ) {
            matchesOccasion = true;
            debugReasons.push('Matched via Text');
          }
        } else {
          debugReasons.push('Matched via Metadata');
        }

        if (matchesOccasion) {
          score += 100; // Base score for being in the right category
        }

        // 2. GLOBAL QUALITY & AGE FILTER (Runs for everyone)
        // Filter out "Bad quality", "Okay quality", and "51+" / "46+" artifacts aggressively
        const globalTextCheck = (pTitle + ' ' + pDesc).toLowerCase();
        if (
          globalTextCheck.includes('bad quality') ||
          globalTextCheck.includes('okay quality') ||
          globalTextCheck.includes('51+') ||
          globalTextCheck.includes('age group 51') ||
          globalTextCheck.includes('40+') ||
          globalTextCheck.includes('age group 40') ||
          globalTextCheck.includes('old lady') ||
          globalTextCheck.includes('elderly') ||
          globalTextCheck.includes('grandmother') ||
          // Catch numbers > 45
          globalTextCheck.includes('46') ||
          globalTextCheck.includes('47') ||
          globalTextCheck.includes('48') ||
          globalTextCheck.includes('49') ||
          globalTextCheck.includes('50')
        ) {
          score -= 2000;
          debugReasons.push('Global Filter Rejection (Quality/Age)');
        }

        // 2. Age Check (STRICT)
        if (ageRange) {
          const uAge = String(ageRange).toLowerCase();
          const isUserYoung =
            uAge.includes('18') ||
            uAge.includes('20') ||
            uAge.includes('25') ||
            uAge.includes('30') ||
            uAge.includes('35');

          // Extract product age from metadata OR detect in text
          let productAgeInfo = '';
          if (metadata) {
            productAgeInfo =
              metadata.age_group ||
              metadata['Age Group'] ||
              metadata['@Age Group'] ||
              metadata.age_range ||
              '';
          }

          // Also check title/desc for obvious age markers if metadata is missing/ambiguous
          const textContent = (pTitle + ' ' + pDesc).toLowerCase();
          if (
            textContent.includes('51+') ||
            textContent.includes('age group 51')
          )
            productAgeInfo += ' 51+';
          if (
            textContent.includes('36-50') ||
            textContent.includes('age group 36')
          )
            productAgeInfo += ' 36-50';
          if (
            textContent.includes('40+') ||
            textContent.includes('age group 40')
          )
            productAgeInfo += ' 40+';
          if (
            textContent.includes('46') ||
            textContent.includes('47') ||
            textContent.includes('48') ||
            textContent.includes('49') ||
            textContent.includes('50')
          )
            productAgeInfo += ' 45+';

          const pAge = String(productAgeInfo).toLowerCase();

          // strict exclusion for young users: NO products > 45, NO "old ladies"
          // "36-50" implies up to 50, so it's excluded. "40+" implies up to infinite, excluded.
          const isProductOld =
            pAge.includes('51') ||
            pAge.includes('40') ||
            pAge.includes('50') ||
            pAge.includes('36-50') ||
            pAge.includes('senior') ||
            pAge.includes('45+') ||
            pAge.includes('46') ||
            pAge.includes('47') ||
            pAge.includes('48') ||
            pAge.includes('49') ||
            textContent.includes('old lady') ||
            textContent.includes('elderly') ||
            textContent.includes('aged') ||
            textContent.includes('grandmother');

          if (isUserYoung && isProductOld) {
            score -= 2000; // Nuclear option: definitely remove
            debugReasons.push('Strict Age Mismatch (Too Old > 45)');
          } else if (pAge && (pAge.includes(uAge) || uAge.includes(pAge))) {
            score += 20;
            debugReasons.push('Age Match');
          }
        }

        // 3. Skin Tone Check
        if (skinTone) {
          const productSkin =
            product.skin_tones?.length > 0
              ? product.skin_tones
              : metadata?.skin_tone ||
                metadata?.['Skin tone'] ||
                metadata?.['@Skin tone'];
          if (productSkin) {
            if (matchesAttribute(productSkin, skinTone)) {
              score += 10;
              debugReasons.push('Skin Tone Match');
            }
          }
        }

        // 4. Body shape and size use the product's dedicated recommendation fields.
        const productBodyShapes =
          product.body_shapes?.length > 0
            ? product.body_shapes
            : metadata?.body_shape || metadata?.['@Recommended Body shape'];
        if (bodyShape && matchesAttribute(productBodyShapes, bodyShape)) {
          score += 15;
          debugReasons.push('Body Shape Match');
        }

        const productSizes =
          product.sizes?.length > 0
            ? product.sizes
            : metadata?.size || metadata?.recommended_size;
        if (size && matchesAttribute(productSizes, size)) {
          score += 10;
          debugReasons.push('Size Match');
        }

        // Gen Z products should rank ahead for the young-adult Aura they target.
        const productStyles = metadata?.style;
        const isYoungAdult = Boolean(
          ageRange &&
            /(?:18|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35)/.test(
              ageRange,
            ),
        );
        if (isYoungAdult && matchesAttribute(productStyles, 'Gen Z')) {
          score += 12;
          debugReasons.push('Gen Z Age/Style Match');
        }

        return { product, score, debugReasons };
      });

      // Filter out non-matches (score < 100 means it didn't match occasion)
      const qualifiedProducts = scoredProducts.filter((p) => p.score >= 100);

      // Sort by Score Descending
      qualifiedProducts.sort((a, b) => b.score - a.score);

      this.logger.log(
        `🎯 Scoring Results: Found ${qualifiedProducts.length} qualified matches for "${occasion}"`,
      );
      if (qualifiedProducts.length > 0) {
        this.logger.log(
          `🥇 Top Match: ${qualifiedProducts[0].product.title} (Score: ${qualifiedProducts[0].score}) - ${qualifiedProducts[0].debugReasons.join(', ')}`,
        );
      }

      // --- TIER ASSIGNMENT ---

      // Extract the raw product objects
      const sortedProducts = qualifiedProducts.map((p) => p.product);

      // 1. Perfect For You (Top 8 of strictly sorted list)
      // These have the highest scores (Likely Occasion + Age + Skin)
      const perfect = sortedProducts.slice(0, 8);

      // 2. Good For You (Next 12)
      const good = sortedProducts.slice(8, 20);

      // 3. You Can Also Try (Next 16)
      let tryItems = sortedProducts.slice(20, 36);

      // BACKFILL logic: If we don't have enough qualified items, fill 'Try' section with
      // general popular items that weren't selected yet, to ensure UI doesn't look empty.
      // Note: We only backfill if we have really bad matches, but we explicitly keep "Perfect" and "Good" as strict.
      if (
        tryItems.length < 16 &&
        perfect.length + good.length + tryItems.length < 12
      ) {
        // Only backfill if total results are very low, to avoid empty page
        const usedIds = new Set(
          sortedProducts.slice(0, 36).map((p) => p.product_id),
        );
        const remaining = audienceProducts.filter(
          (p) => !usedIds.has(p.product_id),
        );
        // Shuffle remaining to ensure variety
        remaining.sort(() => 0.5 - Math.random());

        const needed = 16 - tryItems.length;
        tryItems = [...tryItems, ...remaining.slice(0, needed)];
      }

      // Mapper function
      const cleanText = (text: string) => {
        if (!text) return '';
        let cleaned = text;

        // 1. Remove quality prefixes
        cleaned = cleaned.replace(/^(bad|okay|good)\s+quality\s+/i, '');

        // 2. Remove "prompt" style artifacts like "for Indian female in age group X"
        // Matches "for X in age group Y." or "in age group Y"
        cleaned = cleaned.replace(
          /for\s+[\w\s]+\s+in\s+age\s+group\s+[\d\w\-\+]+/i,
          '',
        );
        cleaned = cleaned.replace(/in\s+age\s+group\s+[\d\w\-\+]+/i, '');
        cleaned = cleaned.replace(/\s+age\s+group\s+[\d\w\-\+]+/i, ''); // Catch leftovers

        // 3. Remove trailing periods or weird punctuation from cut (optional)
        cleaned = cleaned.replace(/\s+\.$/, ''); // Remove " ."
        cleaned = cleaned.replace(/\.$/, ''); // Remove "."

        // Trim
        cleaned = cleaned.trim();

        // Capitalize first letter
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      };

      const mapToDto = (
        product: any,
        scoreVal: number,
        label: string,
      ): RecommendationItemDto => {
        const imageUrl =
          product.images.find((img: any) => img.is_primary)?.url ||
          product.images[0]?.url ||
          null;
        const images = product.images.map((img: any) => img.url);

        // Clean the title and description
        const rawTitle = product.title || '';
        const rawDesc = product.description || rawTitle;

        const finalTitle = cleanText(rawTitle);
        const finalDesc = cleanText(rawDesc);

        return {
          id: product.product_id, // REAL UUID
          product_id: product.product_id, // REAL UUID
          score: scoreVal,
          final_score: scoreVal,
          score_label: label,
          description: finalDesc,
          image: imageUrl,
          images: images,
          title: finalTitle,
          price_cents: product.price_cents,
          slug: product.slug,
          creator_name: product.creator?.store_name,
          inventory_count: product.inventory_count,
        };
      };

      // Generate response
      const finalCount = perfect.length + good.length + tryItems.length;
      return {
        perfect_for_you: perfect.map((p) =>
          mapToDto(p, 0.96, 'perfect for you'),
        ),
        good_for_you: good.map((p) => mapToDto(p, 0.85, 'good for you')),
        you_can_also_try: tryItems.map((p) =>
          mapToDto(p, 0.7, 'you can also try'),
        ),
        count: finalCount,
        warnings:
          qualifiedProducts.length === 0
            ? ['No strict occasion matches found, showing popular items']
            : [],
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch recommendations from DB: ${error.message}`,
      );
      return {
        perfect_for_you: [],
        good_for_you: [],
        you_can_also_try: [],
        count: 0,
        warnings: ['Failed to load products'],
      };
    }
  }
}
