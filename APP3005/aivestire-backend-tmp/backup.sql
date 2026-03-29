--
-- PostgreSQL database dump
--

\restrict ipbJUd14peKNPJ5OVAT4zWB2wSbCJ1XcecCodn7amcTm5DnCtbUq0QBlBYfRhYo

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AddressType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AddressType" AS ENUM (
    'HOME',
    'WORK',
    'OTHER'
);


ALTER TYPE public."AddressType" OWNER TO postgres;

--
-- Name: ApprovalStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'ARCHIVED'
);


ALTER TYPE public."ApprovalStatus" OWNER TO postgres;

--
-- Name: AuraStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuraStatus" AS ENUM (
    'PENDING',
    'READY',
    'ERROR'
);


ALTER TYPE public."AuraStatus" OWNER TO postgres;

--
-- Name: BodyShape; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BodyShape" AS ENUM (
    'HOURGLASS',
    'PEAR',
    'APPLE',
    'RECTANGLE',
    'INVERTED_TRIANGLE',
    'OVAL',
    'ATHLETIC',
    'PETITE',
    'PLUS_SIZE'
);


ALTER TYPE public."BodyShape" OWNER TO postgres;

--
-- Name: ChangedByType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ChangedByType" AS ENUM (
    'SYSTEM',
    'ADMIN',
    'DELIVERY_PARTNER',
    'USER'
);


ALTER TYPE public."ChangedByType" OWNER TO postgres;

--
-- Name: ClothingColor; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ClothingColor" AS ENUM (
    'BLACK',
    'WHITE',
    'GREY',
    'CHARCOAL',
    'NAVY',
    'ROYAL_BLUE',
    'SKY_BLUE',
    'TEAL',
    'GREEN',
    'OLIVE_GREEN',
    'MINT',
    'RED',
    'MAROON',
    'PINK',
    'HOT_PINK',
    'CORAL',
    'ORANGE',
    'YELLOW',
    'GOLD',
    'BEIGE',
    'CREAM',
    'BROWN',
    'CHOCOLATE',
    'CARAMEL',
    'LAVENDER',
    'PURPLE',
    'INDIGO',
    'RUST',
    'OFF_WHITE',
    'MULTI_COLOR',
    'PRINTED',
    'OTHER'
);


ALTER TYPE public."ClothingColor" OWNER TO postgres;

--
-- Name: CouponApprovalStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CouponApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'ARCHIVED'
);


ALTER TYPE public."CouponApprovalStatus" OWNER TO postgres;

--
-- Name: CouponScopeType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CouponScopeType" AS ENUM (
    'GLOBAL',
    'PRICE_LEVEL',
    'FESTIVAL',
    'USER',
    'COMPANY_SPECIAL',
    'COLLECTION',
    'USER_BIRTHDAY',
    'COMPANY_ANNIVERSARY'
);


ALTER TYPE public."CouponScopeType" OWNER TO postgres;

--
-- Name: CouponStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CouponStatus" AS ENUM (
    'ACTIVE',
    'DISABLED',
    'EXPIRED'
);


ALTER TYPE public."CouponStatus" OWNER TO postgres;

--
-- Name: CouponType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CouponType" AS ENUM (
    'FLAT',
    'PERCENTAGE',
    'DELIVERY'
);


ALTER TYPE public."CouponType" OWNER TO postgres;

--
-- Name: LocationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LocationType" AS ENUM (
    'WAREHOUSE',
    'TRANSIT_HUB',
    'LOCAL_FACILITY',
    'OUT_FOR_DELIVERY',
    'DELIVERED'
);


ALTER TYPE public."LocationType" OWNER TO postgres;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'BOOKED',
    'DISPATCHED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: PaymentGateway; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentGateway" AS ENUM (
    'PAYU',
    'COD'
);


ALTER TYPE public."PaymentGateway" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'PREPAID',
    'COD',
    'PAYU',
    'WALLET'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: PaymentTransactionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentTransactionStatus" AS ENUM (
    'CREATED',
    'ATTEMPTED',
    'AUTHORIZED',
    'CAPTURED',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
    'CANCELLED'
);


ALTER TYPE public."PaymentTransactionStatus" OWNER TO postgres;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'ARCHIVED'
);


ALTER TYPE public."ProductStatus" OWNER TO postgres;

--
-- Name: RefundStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RefundStatus" AS ENUM (
    'INITIATED',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REJECTED'
);


ALTER TYPE public."RefundStatus" OWNER TO postgres;

--
-- Name: ReplaceReason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReplaceReason" AS ENUM (
    'DAMAGED',
    'WRONG_ITEM',
    'SIZE_ISSUE',
    'DEFECTIVE',
    'QUALITY_ISSUE',
    'OTHER'
);


ALTER TYPE public."ReplaceReason" OWNER TO postgres;

--
-- Name: ReplacementStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReplacementStatus" AS ENUM (
    'REQUESTED',
    'APPROVED',
    'REJECTED',
    'PICKUP_SCHEDULED',
    'PICKED_UP',
    'DISPATCHED',
    'DELIVERED',
    'COMPLETED'
);


ALTER TYPE public."ReplacementStatus" OWNER TO postgres;

--
-- Name: ReturnReason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReturnReason" AS ENUM (
    'DAMAGED',
    'WRONG_ITEM',
    'SIZE_ISSUE',
    'QUALITY_ISSUE',
    'NOT_AS_DESCRIBED',
    'DEFECTIVE',
    'CHANGED_MIND',
    'OTHER'
);


ALTER TYPE public."ReturnReason" OWNER TO postgres;

--
-- Name: ReturnStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReturnStatus" AS ENUM (
    'REQUESTED',
    'APPROVED',
    'REJECTED',
    'PICKUP_SCHEDULED',
    'PICKED_UP',
    'QC_PASSED',
    'QC_FAILED',
    'COMPLETED',
    'QC_IN_PROGRESS'
);


ALTER TYPE public."ReturnStatus" OWNER TO postgres;

--
-- Name: SkinTone; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SkinTone" AS ENUM (
    'FAIR',
    'LIGHT',
    'MEDIUM',
    'OLIVE',
    'TAN',
    'BROWN',
    'DARK_BROWN',
    'DEEP'
);


ALTER TYPE public."SkinTone" OWNER TO postgres;

--
-- Name: TryOnPermissionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TryOnPermissionStatus" AS ENUM (
    'NONE',
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."TryOnPermissionStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'BUYER',
    'CREATOR',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: WalletTransactionSource; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WalletTransactionSource" AS ENUM (
    'REFUND',
    'CASHBACK',
    'ORDER_PAYMENT',
    'ADMIN_CREDIT',
    'PROMOTION'
);


ALTER TYPE public."WalletTransactionSource" OWNER TO postgres;

--
-- Name: WalletTransactionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WalletTransactionStatus" AS ENUM (
    'SUCCESS',
    'FAILED',
    'REVERSED'
);


ALTER TYPE public."WalletTransactionStatus" OWNER TO postgres;

--
-- Name: WalletTransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WalletTransactionType" AS ENUM (
    'CREDIT',
    'DEBIT'
);


ALTER TYPE public."WalletTransactionType" OWNER TO postgres;

--
-- Name: update_payment_transactions_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_payment_transactions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_payment_transactions_updated_at() OWNER TO postgres;

--
-- Name: update_user_addresses_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user_addresses_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_addresses_updated_at() OWNER TO postgres;

--
-- Name: update_wishlists_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_wishlists_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_wishlists_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ApprovalLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ApprovalLog" (
    log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    approval_id uuid NOT NULL,
    actor_user_id uuid,
    action text NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ApprovalLog" OWNER TO postgres;

--
-- Name: Aura; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Aura" (
    aura_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    image_url text,
    height_cm integer,
    weight_kg integer,
    skin_tone text,
    gender text,
    body_shape text,
    age_range text,
    hair_style text,
    beard boolean,
    extra_attributes jsonb,
    model_url text,
    generated_avatar_urls text[] DEFAULT ARRAY[]::text[],
    attributes jsonb,
    status public."AuraStatus" DEFAULT 'PENDING'::public."AuraStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    body_type text,
    body_size text
);


ALTER TABLE public."Aura" OWNER TO postgres;

--
-- Name: Creator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Creator" (
    creator_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_name text NOT NULL,
    store_slug text NOT NULL,
    about text,
    verified boolean DEFAULT false NOT NULL,
    verification_data jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    terms_accepted boolean DEFAULT false NOT NULL,
    terms_accepted_at timestamp(3) without time zone,
    terms_version text
);


ALTER TABLE public."Creator" OWNER TO postgres;

--
-- Name: CreatorLimit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CreatorLimit" (
    creator_id uuid NOT NULL,
    max_products integer DEFAULT 30 NOT NULL,
    max_images_per_product integer DEFAULT 20 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CreatorLimit" OWNER TO postgres;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    product_id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    price_cents integer NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    inventory_count integer DEFAULT 0 NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    max_images integer DEFAULT 20 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone,
    status public."ProductStatus" DEFAULT 'DRAFT'::public."ProductStatus" NOT NULL,
    category text,
    is_featured boolean DEFAULT false NOT NULL,
    metadata jsonb,
    occasions text[] DEFAULT '{}'::text[],
    body_shapes text[] DEFAULT '{}'::text[],
    skin_tones text[] DEFAULT '{}'::text[],
    sizes text[] DEFAULT '{}'::text[],
    age_ranges text[] DEFAULT '{}'::text[],
    category_id uuid,
    sub_category_id uuid,
    commission_percentage integer DEFAULT 10 NOT NULL
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: COLUMN "Product".metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Product".metadata IS 'Stores recommendation attributes: occasions, body_shapes, skin_tones, sizes, fit, fabric, color_family, style';


--
-- Name: ProductApproval; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductApproval" (
    approval_id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    submitted_by uuid,
    admin_user_id uuid,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actioned_at timestamp(3) without time zone,
    status public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL
);


ALTER TABLE public."ProductApproval" OWNER TO postgres;

--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductImage" (
    image_id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    url text NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    uploaded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProductImage" OWNER TO postgres;

--
-- Name: ProductStat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductStat" (
    product_id uuid NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    likes_count integer DEFAULT 0 NOT NULL,
    comments_count integer DEFAULT 0 NOT NULL,
    last_updated timestamp(3) without time zone
);


ALTER TABLE public."ProductStat" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text,
    phone text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login timestamp(3) without time zone,
    refresh_token_hash text,
    role public."UserRole" DEFAULT 'BUYER'::public."UserRole" NOT NULL,
    max_try_ons integer DEFAULT 3 NOT NULL,
    try_ons_used integer DEFAULT 0 NOT NULL,
    date_of_birth timestamp(3) without time zone,
    try_on_permission public."TryOnPermissionStatus" DEFAULT 'NONE'::public."TryOnPermissionStatus" NOT NULL,
    phone_verified boolean DEFAULT false NOT NULL,
    has_created_aura boolean DEFAULT false NOT NULL,
    max_avatar_regenerations integer DEFAULT 2 NOT NULL,
    avatar_regenerations_used integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    cart_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    size text,
    color text,
    price_cents_snapshot integer NOT NULL,
    currency_snapshot text DEFAULT 'INR'::text NOT NULL,
    added_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carts (
    cart_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    merged_from_guest boolean DEFAULT false NOT NULL,
    region text DEFAULT 'IN'::text NOT NULL,
    channel text DEFAULT 'WEB'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    applied_coupon_code text
);


ALTER TABLE public.carts OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    category_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: coupon_allowed_pincodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupon_allowed_pincodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    pincode text NOT NULL
);


ALTER TABLE public.coupon_allowed_pincodes OWNER TO postgres;

--
-- Name: coupon_scopes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupon_scopes (
    scope_id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    scope_type public."CouponScopeType" DEFAULT 'GLOBAL'::public."CouponScopeType" NOT NULL,
    min_price numeric(10,2),
    max_price numeric(10,2),
    festival_key text,
    company_anniversary_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.coupon_scopes OWNER TO postgres;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupons (
    coupon_id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    code text NOT NULL,
    description text,
    discount_type public."CouponType" NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_order_amount numeric(10,2) DEFAULT 0 NOT NULL,
    max_usage integer DEFAULT 1 NOT NULL,
    current_usage integer DEFAULT 0 NOT NULL,
    status public."CouponStatus" DEFAULT 'ACTIVE'::public."CouponStatus" NOT NULL,
    reason text,
    terms_and_conditions text,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_location_restricted boolean DEFAULT false NOT NULL,
    is_one_time_per_user boolean DEFAULT false NOT NULL,
    is_stackable boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.coupons OWNER TO postgres;

--
-- Name: creator_coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.creator_coupons (
    creator_coupon_id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    code text NOT NULL,
    description text,
    discount_type public."CouponType" NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_order_amount numeric(10,2) DEFAULT 0 NOT NULL,
    max_usage integer DEFAULT 1 NOT NULL,
    current_usage integer DEFAULT 0 NOT NULL,
    status public."CouponStatus" DEFAULT 'ACTIVE'::public."CouponStatus" NOT NULL,
    approval_status public."CouponApprovalStatus" DEFAULT 'PENDING'::public."CouponApprovalStatus" NOT NULL,
    approval_note text,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    creator_id uuid NOT NULL,
    product_id uuid NOT NULL
);


ALTER TABLE public.creator_coupons OWNER TO postgres;

--
-- Name: delivery_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_tracking (
    tracking_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    location_name text NOT NULL,
    location_type public."LocationType" NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    status_description text NOT NULL,
    delivery_partner_agent text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.delivery_tracking OWNER TO postgres;

--
-- Name: guest_cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guest_cart_items (
    guest_cart_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    guest_cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    size text,
    color text,
    price_cents_snapshot integer NOT NULL,
    currency_snapshot text DEFAULT 'INR'::text NOT NULL,
    added_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.guest_cart_items OWNER TO postgres;

--
-- Name: guest_carts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guest_carts (
    guest_cart_id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text NOT NULL,
    region text DEFAULT 'IN'::text NOT NULL,
    channel text DEFAULT 'WEB'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    applied_coupon_code text
);


ALTER TABLE public.guest_carts OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    order_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    product_name text NOT NULL,
    product_image text,
    variant_details jsonb,
    size text,
    color text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_refunds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_refunds (
    refund_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    refund_status public."RefundStatus" DEFAULT 'INITIATED'::public."RefundStatus" NOT NULL,
    refund_reason text,
    approved_by uuid,
    approved_at timestamp(3) without time zone,
    rejection_reason text,
    refund_method text,
    transaction_id text,
    initiated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processing_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    failed_at timestamp(3) without time zone,
    notes text,
    metadata jsonb
);


ALTER TABLE public.order_refunds OWNER TO postgres;

--
-- Name: order_replacements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_replacements (
    replacement_id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_order_id uuid NOT NULL,
    new_order_id uuid,
    replace_reason public."ReplaceReason" NOT NULL,
    custom_reason text,
    feedback text,
    replacement_status public."ReplacementStatus" DEFAULT 'REQUESTED'::public."ReplacementStatus" NOT NULL,
    approved_by uuid,
    approved_at timestamp(3) without time zone,
    rejected_by uuid,
    rejected_at timestamp(3) without time zone,
    rejection_reason text,
    pickup_scheduled timestamp(3) without time zone,
    pickup_partner text,
    pickup_tracking text,
    picked_up_at timestamp(3) without time zone,
    dispatched_at timestamp(3) without time zone,
    delivery_tracking text,
    delivered_at timestamp(3) without time zone,
    requested_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp(3) without time zone,
    notes text,
    metadata jsonb
);


ALTER TABLE public.order_replacements OWNER TO postgres;

--
-- Name: order_returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_returns (
    return_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    return_reason public."ReturnReason" NOT NULL,
    custom_reason text,
    feedback text,
    return_status public."ReturnStatus" DEFAULT 'REQUESTED'::public."ReturnStatus" NOT NULL,
    approved_by uuid,
    approved_at timestamp(3) without time zone,
    rejected_by uuid,
    rejected_at timestamp(3) without time zone,
    rejection_reason text,
    pickup_scheduled timestamp(3) without time zone,
    pickup_partner text,
    pickup_tracking text,
    picked_up_at timestamp(3) without time zone,
    qc_passed boolean,
    qc_notes text,
    qc_completed_at timestamp(3) without time zone,
    requested_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp(3) without time zone,
    notes text,
    metadata jsonb,
    refund_id uuid
);


ALTER TABLE public.order_returns OWNER TO postgres;

--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_status_history (
    history_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    from_status text,
    to_status text NOT NULL,
    changed_by uuid,
    changed_by_type public."ChangedByType",
    notes text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_status_history OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    order_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    user_id uuid NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    payment_method public."PaymentMethod" NOT NULL,
    payment_status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    current_status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    cod_collected boolean DEFAULT false NOT NULL,
    cod_collected_at timestamp(3) without time zone,
    cod_collected_by uuid,
    shipping_address_id uuid NOT NULL,
    tracking_number text,
    delivery_partner text,
    estimated_delivery_date timestamp(3) without time zone,
    cancelled_at timestamp(3) without time zone,
    cancelled_by uuid,
    cancellation_reason text,
    cancel_feedback text,
    refund_status public."RefundStatus",
    refund_amount numeric(10,2),
    return_status public."ReturnStatus",
    return_requested_at timestamp(3) without time zone,
    replace_status public."ReplacementStatus",
    replace_requested_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: otp_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_verifications (
    otp_id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_number text NOT NULL,
    otp_hash text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.otp_verifications OWNER TO postgres;

--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions (
    transaction_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    gateway public."PaymentGateway" DEFAULT 'PAYU'::public."PaymentGateway" NOT NULL,
    gateway_order_id text,
    gateway_payment_id text,
    amount_paise integer NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    receipt text,
    status public."PaymentTransactionStatus" DEFAULT 'CREATED'::public."PaymentTransactionStatus" NOT NULL,
    payment_method text,
    refund_id text,
    refunded_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    captured_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone NOT NULL,
    metadata jsonb
);


ALTER TABLE public.payment_transactions OWNER TO postgres;

--
-- Name: product_color_variant_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_color_variant_images (
    image_id uuid DEFAULT gen_random_uuid() NOT NULL,
    variant_id uuid NOT NULL,
    url text NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    uploaded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_color_variant_images OWNER TO postgres;

--
-- Name: product_color_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_color_variants (
    variant_id uuid DEFAULT gen_random_uuid() NOT NULL,
    pattern_id uuid NOT NULL,
    color public."ClothingColor" NOT NULL,
    hex_code text,
    stock integer DEFAULT 0 NOT NULL,
    skin_tones public."SkinTone"[],
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_color_variants OWNER TO postgres;

--
-- Name: product_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_comments (
    comment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment_text text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    image_urls text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public.product_comments OWNER TO postgres;

--
-- Name: product_group_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_group_assignments (
    assignment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    group_id uuid NOT NULL,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_group_assignments OWNER TO postgres;

--
-- Name: product_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_groups (
    group_id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    parent_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_groups OWNER TO postgres;

--
-- Name: product_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_likes (
    like_id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_likes OWNER TO postgres;

--
-- Name: product_patterns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_patterns (
    pattern_id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    name text NOT NULL,
    body_shapes public."BodyShape"[],
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_patterns OWNER TO postgres;

--
-- Name: sub_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sub_categories (
    sub_category_id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sub_categories OWNER TO postgres;

--
-- Name: try_ons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.try_ons (
    try_on_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    aura_id uuid NOT NULL,
    result_image_url text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    provider text DEFAULT 'unknown'::text NOT NULL,
    angle text,
    base_tryon_id uuid,
    angles_generated text[] DEFAULT ARRAY[]::text[],
    cloudinary_public_id text,
    compressed_url text,
    metadata_cache jsonb,
    processing_metrics jsonb,
    thumbnail_url text
);


ALTER TABLE public.try_ons OWNER TO postgres;

--
-- Name: user_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_addresses (
    address_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    pincode text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    landmark text,
    address_type public."AddressType" DEFAULT 'HOME'::public."AddressType" NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_addresses OWNER TO postgres;

--
-- Name: TABLE user_addresses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_addresses IS 'Stores delivery addresses for users';


--
-- Name: COLUMN user_addresses.address_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.address_id IS 'Unique identifier for the address';


--
-- Name: COLUMN user_addresses.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.user_id IS 'Foreign key to users table';


--
-- Name: COLUMN user_addresses.full_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.full_name IS 'Recipient full name';


--
-- Name: COLUMN user_addresses.phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.phone IS '10-digit Indian mobile number';


--
-- Name: COLUMN user_addresses.pincode; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.pincode IS '6-digit Indian postal code';


--
-- Name: COLUMN user_addresses.address_line1; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.address_line1 IS 'House No, Building, Street';


--
-- Name: COLUMN user_addresses.address_line2; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.address_line2 IS 'Locality, Area (optional)';


--
-- Name: COLUMN user_addresses.city; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.city IS 'City name';


--
-- Name: COLUMN user_addresses.state; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.state IS 'Indian state name';


--
-- Name: COLUMN user_addresses.landmark; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.landmark IS 'Nearby landmark (optional)';


--
-- Name: COLUMN user_addresses.address_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.address_type IS 'Type of address: HOME, WORK, or OTHER';


--
-- Name: COLUMN user_addresses.is_default; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_addresses.is_default IS 'Whether this is the default delivery address';


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallet_transactions (
    transaction_id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_id uuid NOT NULL,
    type public."WalletTransactionType" NOT NULL,
    source public."WalletTransactionSource" NOT NULL,
    amount numeric(10,2) NOT NULL,
    reference_id text,
    description text,
    status public."WalletTransactionStatus" DEFAULT 'SUCCESS'::public."WalletTransactionStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wallet_transactions OWNER TO postgres;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    wallet_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    balance numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlist_items (
    wishlist_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    wishlist_id uuid NOT NULL,
    product_id uuid NOT NULL,
    added_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wishlist_items OWNER TO postgres;

--
-- Name: TABLE wishlist_items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.wishlist_items IS 'Stores products saved to wishlists';


--
-- Name: COLUMN wishlist_items.wishlist_item_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wishlist_items.wishlist_item_id IS 'Unique identifier for the wishlist item';


--
-- Name: COLUMN wishlist_items.wishlist_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wishlist_items.wishlist_id IS 'Foreign key to wishlists table';


--
-- Name: COLUMN wishlist_items.product_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wishlist_items.product_id IS 'Foreign key to products table';


--
-- Name: COLUMN wishlist_items.added_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wishlist_items.added_at IS 'Timestamp when product was added to wishlist';


--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlists (
    wishlist_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.wishlists OWNER TO postgres;

--
-- Name: TABLE wishlists; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.wishlists IS 'Stores user wishlists (one per user)';


--
-- Name: COLUMN wishlists.wishlist_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wishlists.wishlist_id IS 'Unique identifier for the wishlist';


--
-- Name: COLUMN wishlists.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wishlists.user_id IS 'Foreign key to users table (unique - one wishlist per user)';


--
-- Data for Name: ApprovalLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ApprovalLog" (log_id, approval_id, actor_user_id, action, comment, created_at) FROM stdin;
bd04730f-ca88-4ac0-94f9-4bf5f5cce0ab	ec606265-5222-4414-b94b-4ddc7ec8a274	\N	APPROVED	\N	2026-03-24 15:11:14.748
83e12f71-560e-4d85-b846-70b4d41a1aa8	eb29b62f-523c-485c-b139-9a177cc75d9c	\N	APPROVED	\N	2026-03-24 15:11:22.344
bdae2a35-513a-488d-bde3-2136fd311200	d370d77d-b895-46a5-85aa-dff3be96bee5	\N	APPROVED	Approved	2026-03-25 15:52:46.374
830f319e-7e48-41ae-ba76-05f0c6fb30b0	2ff5325b-caa0-44c0-aab6-f238f1aca7f6	\N	APPROVED	Approved	2026-03-25 15:52:52.811
8fcb968a-15d3-4eb2-ac43-7b52766ac985	d51776a1-9bf7-466a-9d34-64f973caf0e4	\N	APPROVED	Approved	2026-03-25 15:52:55.556
b19388df-ebd6-466d-9bd9-9dfe301278ce	d993a0ee-2f23-4983-8ed8-f65a8579de37	\N	APPROVED	Approved	2026-03-25 15:54:55.981
4f3fc591-24a1-47ba-8ce6-a45d7a5ad383	b44fa025-efb5-4cbf-b972-069aea38bcbd	\N	APPROVED	\N	2026-03-28 10:06:50.749
1dabdc2e-c777-4aaa-ac86-a039280833b2	7c4f3453-56e0-4fe8-97a0-42c2d34ee93d	\N	APPROVED	\N	2026-03-28 17:41:05.9
\.


--
-- Data for Name: Aura; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Aura" (aura_id, user_id, image_url, height_cm, weight_kg, skin_tone, gender, body_shape, age_range, hair_style, beard, extra_attributes, model_url, generated_avatar_urls, attributes, status, created_at, updated_at, body_type, body_size) FROM stdin;
b00431f3-7e4d-4cea-a7ef-e12c14de9805	be6b282a-4785-433e-8813-5f8ed890ec89	https://res.cloudinary.com/dxfxicebq/image/upload/v1773156778/try-ons/r1zxezadoxchyfbpjl76.jpg	\N	\N	medium	female	pear_shape	18-25	\N	\N	\N	https://res.cloudinary.com/dxfxicebq/image/upload/v1773156778/try-ons/r1zxezadoxchyfbpjl76.jpg	{https://res.cloudinary.com/dxfxicebq/image/upload/v1773156778/try-ons/r1zxezadoxchyfbpjl76.jpg}	{"type": "original", "attributes": {"gender": "female", "height": 170, "weight": 70, "ageRange": "18-25", "skinTone": "medium", "bodyShape": "pear_shape", "hairStyle": "short"}, "processedAt": "2026-03-10T15:33:02.061Z"}	READY	2026-03-10 15:32:59.738	2026-03-10 15:33:02.066	\N	small
827ba157-ce66-44cb-ad4c-50d4e33d4dd1	4f70d293-f018-4009-b68b-8945db2acbcc	https://res.cloudinary.com/dxfxicebq/image/upload/v1773489910/try-ons/p7tqwiujzamicgfls256.jpg	\N	\N	light	female	pear_shape	18-25	\N	\N	\N	https://res.cloudinary.com/dxfxicebq/image/upload/v1773489935/try-ons/ng77t5shilnkddv3mevv.jpg	{https://res.cloudinary.com/dxfxicebq/image/upload/v1773489935/try-ons/ng77t5shilnkddv3mevv.jpg}	{"type": "generated", "attributes": {"gender": "female", "height": 170, "weight": 70, "ageRange": "18-25", "skinTone": "light", "bodyShape": "pear_shape", "hairStyle": "short"}, "generatedAt": "2026-03-14T12:05:35.845Z"}	READY	2026-03-14 12:05:11.071	2026-03-14 12:05:35.855	\N	small
c6f05f48-3200-4ce4-b7b0-d0cc4a8ad15f	23d3d707-c107-40c4-ae87-feb0cc8812a8	https://res.cloudinary.com/dxfxicebq/image/upload/v1773684390/try-ons/y0zzn8ewuevip40fuoc0.jpg	\N	\N	medium	female	pear_shape	18-25	\N	\N	\N	https://res.cloudinary.com/dxfxicebq/image/upload/v1773684412/try-ons/w84ginkq1nnnu2bki8c5.jpg	{https://res.cloudinary.com/dxfxicebq/image/upload/v1773684412/try-ons/w84ginkq1nnnu2bki8c5.jpg}	{"type": "generated", "attributes": {"gender": "female", "height": 170, "weight": 70, "ageRange": "18-25", "skinTone": "medium", "bodyShape": "pear_shape", "hairStyle": "short"}, "generatedAt": "2026-03-16T18:06:54.062Z"}	READY	2026-03-16 18:06:30.919	2026-03-16 18:06:54.064	\N	medium
61229005-c4b7-46f7-8873-e748710e78b4	25ae96d6-4433-43e1-8ca3-57a4721227fd	https://res.cloudinary.com/dxfxicebq/image/upload/v1773770609/try-ons/yjdskdowqy97kvsqofor.jpg	172	\N	dusky	female	pear_shape	18-25	\N	\N	\N	https://res.cloudinary.com/dxfxicebq/image/upload/v1773770640/avatars/vxbme2n6rotswq6sd5ct.jpg	{https://res.cloudinary.com/dxfxicebq/image/upload/v1773770640/avatars/vxbme2n6rotswq6sd5ct.jpg,https://res.cloudinary.com/dxfxicebq/image/upload/v1773770642/avatars/tryon-crops/g60pet0f086q7nwwayip.jpg}	{"type": "generated", "tryOnCrop": {"url": "https://res.cloudinary.com/dxfxicebq/image/upload/v1773770642/avatars/tryon-crops/g60pet0f086q7nwwayip.jpg", "cropBottomPercent": 12}, "attributes": {"gender": "female", "height": 172, "weight": 70, "ageRange": "18-25", "bodySize": "medium", "skinTone": "dusky", "bodyShape": "pear_shape", "hairStyle": "short"}, "generatedAt": "2026-03-17T18:04:01.855Z"}	READY	2026-03-17 18:03:30.89	2026-03-17 18:04:03.935	\N	medium
d91db23b-de73-4649-927e-a0c471919c8d	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	https://res.cloudinary.com/dxfxicebq/image/upload/v1773845118/try-ons/q5ediiejljfgtckp6fmy.jpg	156	\N	medium	female	inverted_triangle	18-25	\N	\N	\N	https://res.cloudinary.com/dxfxicebq/image/upload/v1773845118/try-ons/q5ediiejljfgtckp6fmy.jpg	{https://res.cloudinary.com/dxfxicebq/image/upload/v1773845118/try-ons/q5ediiejljfgtckp6fmy.jpg,https://res.cloudinary.com/dxfxicebq/image/upload/v1773857250/avatars/tryon-crops/pnzpt6hxctngokt8vxmj.jpg}	{"type": "original", "tryOnCrop": {"url": "https://res.cloudinary.com/dxfxicebq/image/upload/v1773857250/avatars/tryon-crops/pnzpt6hxctngokt8vxmj.jpg", "cropBottomPercent": 12}, "attributes": {"gender": "female", "height": 156, "weight": 70, "ageRange": "18-25", "bodySize": "medium", "skinTone": "medium", "bodyShape": "inverted_triangle", "hairStyle": "short"}, "processedAt": "2026-03-18T18:07:25.679Z"}	READY	2026-03-18 14:45:19.548	2026-03-18 18:07:30.936	\N	medium
12caf31d-1aa6-42d4-8254-76607f0b6b4c	1df5c992-5033-4efa-a78f-6f69bc8ec9fd	https://res.cloudinary.com/dxfxicebq/image/upload/v1773857353/try-ons/gdky72of9iymabzp0gey.jpg	156	\N	medium	female	pear_shape	18-25	\N	\N	\N	https://res.cloudinary.com/dxfxicebq/image/upload/v1773857990/avatars/lu1hm8b5w3sjvcz89l0f.jpg	{https://res.cloudinary.com/dxfxicebq/image/upload/v1773857990/avatars/lu1hm8b5w3sjvcz89l0f.jpg}	{"type": "generated", "attributes": {"gender": "female", "height": 156, "weight": 70, "ageRange": "18-25", "bodySize": "medium", "skinTone": "medium", "bodyShape": "pear_shape", "hairStyle": "short"}, "generatedAt": "2026-03-18T18:19:51.489Z"}	READY	2026-03-18 18:09:14.967	2026-03-18 18:19:51.498	\N	medium
\.


--
-- Data for Name: Creator; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Creator" (creator_id, user_id, store_name, store_slug, about, verified, verification_data, created_at, terms_accepted, terms_accepted_at, terms_version) FROM stdin;
534e065f-1981-493f-952d-b3f8d919df52	51c7b1ee-5bf4-46c5-b285-bdeefa1c484f	AiVestire Collection	aivestire-collection	\N	t	\N	2026-03-10 15:29:58.935	f	\N	\N
3fa5464c-3181-4083-b072-b6205143ca64	8682a537-a9d4-47fc-aa6b-4ca4e635401e	designer Store	designer-store	\N	t	{"timestamp": "2026-03-10T16:59:09.805Z", "autoCreated": true}	2026-03-10 16:59:09.806	t	2026-03-10 16:59:44.946	1.0
a231601f-821b-44fb-9c3d-704820bf5793	0269251c-81c1-47e0-b72e-9a6538397cba	designerJaadu Store	designerjaadu-store	\N	t	{"timestamp": "2026-03-10T18:13:26.588Z", "autoCreated": true}	2026-03-10 18:13:26.588	t	2026-03-16 15:28:33.499	1.0
b317f4ab-75db-4b8f-8807-08dafa4e5246	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	designerA Store	designera-store	\N	t	{"timestamp": "2026-03-22T10:26:56.111Z", "autoCreated": true}	2026-03-22 10:26:56.112	t	2026-03-22 10:27:07.962	1.0
d10ddc0e-9d4a-4774-a94e-d3c043a6fab6	23cd1a61-dc15-44f4-a557-cb88230fe838	designer Store	designer-store-1	\N	t	{"timestamp": "2026-03-24T15:07:54.492Z", "autoCreated": true}	2026-03-24 15:07:54.493	t	2026-03-24 15:08:05.002	1.0
\.


--
-- Data for Name: CreatorLimit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CreatorLimit" (creator_id, max_products, max_images_per_product, created_at) FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (product_id, creator_id, title, slug, description, price_cents, currency, inventory_count, is_deleted, max_images, created_at, updated_at, status, category, is_featured, metadata, occasions, body_shapes, skin_tones, sizes, age_ranges, category_id, sub_category_id, commission_percentage) FROM stdin;
0382f3d3-88eb-43b9-970f-48fb998ff212	534e065f-1981-493f-952d-b3f8d919df52	Delicate lace dress with slip lining and side slit for evening receptions. Crafted in lace with a sl	lace-dress-1773156598943-0	Delicate lace dress with slip lining and side slit for evening receptions. Crafted in lace with a slim profile and a metallic palette suited for Party moments across India. Fits Hourglass, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 36-50 years.	4100	INR	10	f	20	2026-03-10 15:29:58.945	\N	APPROVED	lace_dress	f	{"fit": "slim", "score": "0.7", "style": "Elegant", "fabric": "lace", "cloth_id": "testiing_image_collection/76.png", "occasion": "Party", "age_group": "36-50", "skin_tone": "Light, Medium", "body_shape": "Hourglass, Rectangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "lace_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
ca66e151-f390-41f3-b22e-36a85c93e9f5	534e065f-1981-493f-952d-b3f8d919df52	Breezy chiffon maxi dress with tiered hem, designed for coastal getaways and Indian summers. Crafted	maxi-dress-1773156598953-1	Breezy chiffon maxi dress with tiered hem, designed for coastal getaways and Indian summers. Crafted in chiffon with a flowing profile and a neutral palette suited for Resort moments across India. Fits Rectangle, Pear Shape, Hourglass bodies, complements Light, Medium, Dusky skin tones, and is available in sizes XS, S, M, L. Age guidance: 13-17 years.	3596	INR	10	f	20	2026-03-10 15:29:58.955	\N	APPROVED	maxi_dress	f	{"fit": "flowing", "score": "0.532", "style": "Minimal Luxury", "fabric": "chiffon", "cloth_id": "testiing_image_collection/77.png", "occasion": "Resort", "age_group": "13-17", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Pear Shape, Hourglass", "quality_tag": "", "color_family": "neutral", "clothing_type": "maxi_dress", "recommended_size": "XS, S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
756437d6-0762-4cee-9bc6-5f3c2ebe4cde	534e065f-1981-493f-952d-b3f8d919df52	Classic silk saree with hand-detailed borders and fluid pleats tailored for Indian wedding rituals. 	saree-1773156598960-2	Classic silk saree with hand-detailed borders and fluid pleats tailored for Indian wedding rituals. Crafted in silk with a flowing profile and a pastel palette suited for Wedding moments across India. Fits Pear Shape, Hourglass, Rectangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 26-35 years.	4505	INR	10	f	20	2026-03-10 15:29:58.961	\N	APPROVED	saree	f	{"fit": "flowing", "score": "0.835", "style": "Traditional Luxury", "fabric": "silk", "cloth_id": "testiing_image_collection/78.png", "occasion": "Wedding", "age_group": "26-35", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Pear Shape, Hourglass, Rectangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "saree", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
ed839fa9-bcf5-4e78-b639-690fc5dbf2d9	534e065f-1981-493f-952d-b3f8d919df52	Chiffon wrap dress with adjustable tie, easy to style for brunches and day dates. Crafted in chiffon	wrap-dress-1773156598965-3	Chiffon wrap dress with adjustable tie, easy to style for brunches and day dates. Crafted in chiffon with a flowing profile and a neutral palette suited for Casual luxury moments across India. Fits Rectangle, Pear Shape bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 18-25 years.	2882	INR	10	f	20	2026-03-10 15:29:58.967	\N	APPROVED	wrap_dress	f	{"fit": "flowing", "score": "0.294", "style": "Minimal Luxury", "fabric": "chiffon", "cloth_id": "testiing_image_collection/79.png", "occasion": "Casual luxury", "age_group": "18-25", "skin_tone": "Light, Medium", "body_shape": "Rectangle, Pear Shape", "quality_tag": "", "color_family": "neutral", "clothing_type": "wrap_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
6b2baca2-5e43-4459-9bb3-7c60150ad116	534e065f-1981-493f-952d-b3f8d919df52	Relaxed chiffon sharara set with light zari work and breezy pants made for mehendi comfort. Crafted 	sharara-set-1773156598971-4	Relaxed chiffon sharara set with light zari work and breezy pants made for mehendi comfort. Crafted in chiffon with a relaxed profile and a neutral palette suited for Wedding moments across India. Fits Pear Shape, Apple Shape, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 51+ years.	3848	INR	10	f	20	2026-03-10 15:29:58.972	\N	APPROVED	sharara_set	f	{"fit": "relaxed", "score": "0.616", "style": "Traditional Luxury", "fabric": "chiffon", "cloth_id": "testiing_image_collection/80.png", "occasion": "Wedding", "age_group": "51+", "skin_tone": "Medium, Dusky", "body_shape": "Pear Shape, Apple Shape, Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "sharara_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
4828ee34-ec9f-4452-b756-8a4ca42c8d82	534e065f-1981-493f-952d-b3f8d919df52	Satin cocktail dress with a sleek cut and side ruching for evening events. Crafted in satin with a s	cocktail-dress-1773156598977-5	Satin cocktail dress with a sleek cut and side ruching for evening events. Crafted in satin with a slim profile and a jewel palette suited for Party moments across India. Fits Hourglass, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 13-17 years.	4295	INR	10	f	20	2026-03-10 15:29:58.978	\N	APPROVED	cocktail_dress	f	{"fit": "slim", "score": "0.765", "style": "Elegant", "fabric": "satin", "cloth_id": "testiing_image_collection/81.png", "occasion": "Party", "age_group": "13-17", "skin_tone": "Light, Medium", "body_shape": "Hourglass, Rectangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "cocktail_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
ba9d7a2e-5a75-4487-815a-cf0d242d35da	534e065f-1981-493f-952d-b3f8d919df52	Tailored linen jumpsuit with a cinched waist built for humid city days. Crafted in linen with a stru	jumpsuit-1773156598983-6	Tailored linen jumpsuit with a cinched waist built for humid city days. Crafted in linen with a structured profile and a jewel palette suited for Casual luxury moments across India. Fits Rectangle, Apple Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 51+ years.	2495	INR	10	f	20	2026-03-10 15:29:58.985	\N	APPROVED	jumpsuit	f	{"fit": "structured", "score": "0.165", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "testiing_image_collection/82.png", "occasion": "Casual luxury", "age_group": "51+", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Apple Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "jumpsuit", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
3b0f3c0e-ba43-48ed-a8bf-b5d7abcdd90a	534e065f-1981-493f-952d-b3f8d919df52	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk wit	kaftan-1773156598990-7	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk with a relaxed profile and a jewel palette suited for Resort moments across India. Fits Apple Shape, Rectangle, Pear Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L. Age guidance: 18-25 years.	3017	INR	10	f	20	2026-03-10 15:29:58.993	\N	APPROVED	kaftan	f	{"fit": "relaxed", "score": "0.339", "style": "Minimal Luxury", "fabric": "silk", "cloth_id": "testiing_image_collection/83.png", "occasion": "Resort", "age_group": "18-25", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Rectangle, Pear Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "kaftan", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
381ff9a4-d4a6-49ad-be93-f2b929440115	534e065f-1981-493f-952d-b3f8d919df52	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weath	kurta-set-1773156599000-8	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weather. Crafted in linen with a relaxed profile and a pastel palette suited for Formal moments across India. Fits Apple Shape, Rectangle bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 18-25 years.	2918	INR	10	f	20	2026-03-10 15:29:59.001	\N	APPROVED	kurta_set	f	{"fit": "relaxed", "score": "0.306", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "testiing_image_collection/84.png", "occasion": "Formal", "age_group": "18-25", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Rectangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "kurta_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
166a4fbf-e51d-40a3-9be0-57ebeddaf8d7	534e065f-1981-493f-952d-b3f8d919df52	Velvet evening gown with corseted bodice and sweeping skirt suited for receptions. Crafted in velvet	gown-1773156599009-9	Velvet evening gown with corseted bodice and sweeping skirt suited for receptions. Crafted in velvet with a structured profile and a pastel palette suited for Wedding moments across India. Fits Hourglass, Inverted Triangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL. Age guidance: 51+ years.	4700	INR	10	f	20	2026-03-10 15:29:59.011	\N	APPROVED	gown	f	{"fit": "structured", "score": "0.9", "style": "Couture", "fabric": "velvet", "cloth_id": "testiing_image_collection/85.png", "occasion": "Wedding", "age_group": "51+", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Hourglass, Inverted Triangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "gown", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
be826e52-36ca-4b8e-b26d-4b5aa201ebd0	534e065f-1981-493f-952d-b3f8d919df52	Structured silk lehenga set with a supportive blouse and ample flare suited to sangeet and pheras. C	lehenga-set-1773156599025-11	Structured silk lehenga set with a supportive blouse and ample flare suited to sangeet and pheras. Crafted in silk with a structured profile and a black palette suited for Wedding moments across India. Fits Hourglass, Pear Shape bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 18-25 years.	4139	INR	10	f	20	2026-03-10 15:29:59.026	\N	APPROVED	lehenga_set	f	{"fit": "structured", "score": "0.713", "style": "Traditional Luxury", "fabric": "silk", "cloth_id": "testiing_image_collection/87.png", "occasion": "Wedding", "age_group": "18-25", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Hourglass, Pear Shape", "quality_tag": "", "color_family": "black", "clothing_type": "lehenga_set", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
5f760d29-c17c-447f-bbd5-2de8bbb56a91	534e065f-1981-493f-952d-b3f8d919df52	Structured silk lehenga set with a supportive blouse and ample flare suited to sangeet and pheras. C	lehenga-set-1773156599030-12	Structured silk lehenga set with a supportive blouse and ample flare suited to sangeet and pheras. Crafted in silk with a structured profile and a neutral palette suited for Wedding moments across India. Fits Hourglass, Pear Shape bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 26-35 years.	4448	INR	10	f	20	2026-03-10 15:29:59.031	\N	APPROVED	lehenga_set	f	{"fit": "structured", "score": "0.816", "style": "Traditional Luxury", "fabric": "silk", "cloth_id": "testiing_image_collection/88.png", "occasion": "Wedding", "age_group": "26-35", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Hourglass, Pear Shape", "quality_tag": "", "color_family": "neutral", "clothing_type": "lehenga_set", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
3687396e-b3a7-4fe7-b4af-d70a8af8c34c	534e065f-1981-493f-952d-b3f8d919df52	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk wit	kaftan-1773156599036-13	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk with a relaxed profile and a pastel palette suited for Resort moments across India. Fits Apple Shape, Rectangle, Pear Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L. Age guidance: 13-17 years.	3518	INR	10	f	20	2026-03-10 15:29:59.038	\N	APPROVED	kaftan	f	{"fit": "relaxed", "score": "0.506", "style": "Minimal Luxury", "fabric": "silk", "cloth_id": "testiing_image_collection/89.png", "occasion": "Resort", "age_group": "13-17", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Rectangle, Pear Shape", "quality_tag": "", "color_family": "pastel", "clothing_type": "kaftan", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
7a426f6e-5e54-4df4-acd6-7279c87699df	534e065f-1981-493f-952d-b3f8d919df52	Linen tunic set with high-low hem and slim pants for easy daytime polish. Crafted in linen with a re	tunic-set-1773156599043-14	Linen tunic set with high-low hem and slim pants for easy daytime polish. Crafted in linen with a relaxed profile and a pastel palette suited for Casual luxury moments across India. Fits Apple Shape, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L, XL. Age guidance: 36-50 years.	2957	INR	10	f	20	2026-03-10 15:29:59.044	\N	APPROVED	tunic_set	f	{"fit": "relaxed", "score": "0.319", "style": "Elegant", "fabric": "linen", "cloth_id": "testiing_image_collection/90.png", "occasion": "Casual luxury", "age_group": "36-50", "skin_tone": "Light, Medium", "body_shape": "Apple Shape, Rectangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "tunic_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
5bf3c70b-94d7-492f-849b-908b8e9ec66f	534e065f-1981-493f-952d-b3f8d919df52	Relaxed chiffon sharara set with light zari work and breezy pants made for mehendi comfort. Crafted 	sharara-set-1773156599048-15	Relaxed chiffon sharara set with light zari work and breezy pants made for mehendi comfort. Crafted in chiffon with a relaxed profile and a metallic palette suited for Wedding moments across India. Fits Pear Shape, Apple Shape, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 26-35 years.	4043	INR	10	f	20	2026-03-10 15:29:59.049	\N	APPROVED	sharara_set	f	{"fit": "relaxed", "score": "0.681", "style": "Traditional Luxury", "fabric": "chiffon", "cloth_id": "testiing_image_collection/91.png", "occasion": "Wedding", "age_group": "26-35", "skin_tone": "Medium, Dusky", "body_shape": "Pear Shape, Apple Shape, Rectangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "sharara_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
4559f069-32f5-4381-847d-91cca11ca219	534e065f-1981-493f-952d-b3f8d919df52	Satin peplum set with fitted trousers, flattering the waist for festive dinners. Crafted in satin wi	peplum-set-1773156599054-16	Satin peplum set with fitted trousers, flattering the waist for festive dinners. Crafted in satin with a structured profile and a metallic palette suited for Party moments across India. Fits Pear Shape, Hourglass bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 51+ years.	4178	INR	10	f	20	2026-03-10 15:29:59.055	\N	APPROVED	peplum_set	f	{"fit": "structured", "score": "0.726", "style": "Elegant", "fabric": "satin", "cloth_id": "testiing_image_collection/92.png", "occasion": "Party", "age_group": "51+", "skin_tone": "Light, Medium", "body_shape": "Pear Shape, Hourglass", "quality_tag": "", "color_family": "metallic", "clothing_type": "peplum_set", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
fff6070a-f3d3-46bd-a248-63eceb35ac53	534e065f-1981-493f-952d-b3f8d919df52	Satin blazer dress with sharp lapels and waist definition for boardroom-to-dinner dressing. Crafted 	blazer-dress-1773156599060-17	Satin blazer dress with sharp lapels and waist definition for boardroom-to-dinner dressing. Crafted in satin with a structured profile and a jewel palette suited for Formal moments across India. Fits Rectangle, Inverted Triangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 18-25 years.	3578	INR	10	f	20	2026-03-10 15:29:59.061	\N	APPROVED	blazer_dress	f	{"fit": "structured", "score": "0.526", "style": "Minimal Luxury", "fabric": "satin", "cloth_id": "testiing_image_collection/93.png", "occasion": "Formal", "age_group": "18-25", "skin_tone": "Light, Medium", "body_shape": "Rectangle, Inverted Triangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "blazer_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
0d496a7d-46e1-49f6-a879-f4acec6aac4a	534e065f-1981-493f-952d-b3f8d919df52	Pre-stitched silk cape saree that adds drama without heavy draping. Crafted in silk with a structure	cape-saree-1773156599066-18	Pre-stitched silk cape saree that adds drama without heavy draping. Crafted in silk with a structured profile and a black palette suited for Party moments across India. Fits Inverted Triangle, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes M, L, XL. Age guidance: 36-50 years.	4487	INR	10	f	20	2026-03-10 15:29:59.068	\N	APPROVED	cape_saree	f	{"fit": "structured", "score": "0.829", "style": "Couture", "fabric": "silk", "cloth_id": "testiing_image_collection/94.png", "occasion": "Party", "age_group": "36-50", "skin_tone": "Medium, Dusky", "body_shape": "Inverted Triangle, Rectangle", "quality_tag": "", "color_family": "black", "clothing_type": "cape_saree", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
e6d4f7de-db3d-412a-b92b-bd8bb77bfac3	534e065f-1981-493f-952d-b3f8d919df52	Classic silk saree with hand-detailed borders and fluid pleats tailored for Indian wedding rituals. 	saree-1773156599080-20	Classic silk saree with hand-detailed borders and fluid pleats tailored for Indian wedding rituals. Crafted in silk with a flowing profile and a black palette suited for Wedding moments across India. Fits Pear Shape, Hourglass, Rectangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 13-17 years.	3791	INR	10	f	20	2026-03-10 15:29:59.081	\N	APPROVED	saree	f	{"fit": "flowing", "score": "0.597", "style": "Traditional Luxury", "fabric": "silk", "cloth_id": "testiing_image_collection/96.png", "occasion": "Wedding", "age_group": "13-17", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Pear Shape, Hourglass, Rectangle", "quality_tag": "", "color_family": "black", "clothing_type": "saree", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
bfce8b21-e6fb-401d-8624-7b95576ebfd5	534e065f-1981-493f-952d-b3f8d919df52	Delicate lace dress with slip lining and side slit for evening receptions. Crafted in lace with a sl	lace-dress-1773156599085-21	Delicate lace dress with slip lining and side slit for evening receptions. Crafted in lace with a slim profile and a black palette suited for Party moments across India. Fits Hourglass, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 51+ years.	3482	INR	10	f	20	2026-03-10 15:29:59.086	\N	APPROVED	lace_dress	f	{"fit": "slim", "score": "0.494", "style": "Elegant", "fabric": "lace", "cloth_id": "testiing_image_collection/97.png", "occasion": "Party", "age_group": "51+", "skin_tone": "Light, Medium", "body_shape": "Hourglass, Rectangle", "quality_tag": "", "color_family": "black", "clothing_type": "lace_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
ed124e93-0719-44f5-83e7-a1cee3d8fb36	534e065f-1981-493f-952d-b3f8d919df52	Tailored linen jumpsuit with a cinched waist built for humid city days. Crafted in linen with a stru	jumpsuit-1773156599090-22	Tailored linen jumpsuit with a cinched waist built for humid city days. Crafted in linen with a structured profile and a pastel palette suited for Casual luxury moments across India. Fits Rectangle, Apple Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 36-50 years.	2705	INR	10	f	20	2026-03-10 15:29:59.091	\N	APPROVED	jumpsuit	f	{"fit": "structured", "score": "0.235", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "testiing_image_collection/98.png", "occasion": "Casual luxury", "age_group": "36-50", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Apple Shape", "quality_tag": "", "color_family": "pastel", "clothing_type": "jumpsuit", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
ffd5fe38-8e86-4a8c-8f0d-4bb25952a1bb	534e065f-1981-493f-952d-b3f8d919df52	Pre-stitched silk cape saree that adds drama without heavy draping. Crafted in silk with a structure	cape-saree-1773156599095-23	Pre-stitched silk cape saree that adds drama without heavy draping. Crafted in silk with a structured profile and a jewel palette suited for Party moments across India. Fits Inverted Triangle, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes M, L, XL. Age guidance: 18-25 years.	4313	INR	10	f	20	2026-03-10 15:29:59.097	\N	APPROVED	cape_saree	f	{"fit": "structured", "score": "0.771", "style": "Couture", "fabric": "silk", "cloth_id": "testiing_image_collection/99.png", "occasion": "Party", "age_group": "18-25", "skin_tone": "Medium, Dusky", "body_shape": "Inverted Triangle, Rectangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "cape_saree", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
b3f1efe1-f2ad-4e91-bb1c-b7cbf23df89d	534e065f-1981-493f-952d-b3f8d919df52	Chiffon wrap dress with adjustable tie, easy to style for brunches and day dates. Crafted in chiffon	wrap-dress-1773156599100-24	Chiffon wrap dress with adjustable tie, easy to style for brunches and day dates. Crafted in chiffon with a flowing profile and a jewel palette suited for Casual luxury moments across India. Fits Rectangle, Pear Shape bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 36-50 years.	2474	INR	10	f	20	2026-03-10 15:29:59.101	\N	APPROVED	wrap_dress	f	{"fit": "flowing", "score": "0.158", "style": "Minimal Luxury", "fabric": "chiffon", "cloth_id": "testiing_image_collection/100.png", "occasion": "Casual luxury", "age_group": "36-50", "skin_tone": "Light, Medium", "body_shape": "Rectangle, Pear Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "wrap_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
0410040e-8422-418a-9129-f8a81d43c26a	534e065f-1981-493f-952d-b3f8d919df52	Velvet kurta with a longline jacket for winter formals and cultural events. Crafted in velvet with a	kurta-jacket-set-1773156599107-25	Velvet kurta with a longline jacket for winter formals and cultural events. Crafted in velvet with a structured profile and a metallic palette suited for Formal moments across India. Fits Rectangle, Inverted Triangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 18-25 years.	3617	INR	10	f	20	2026-03-10 15:29:59.108	\N	APPROVED	kurta_jacket_set	f	{"fit": "structured", "score": "0.539", "style": "Traditional Luxury", "fabric": "velvet", "cloth_id": "testiing_image_collection/101.png", "occasion": "Formal", "age_group": "18-25", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Rectangle, Inverted Triangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "kurta_jacket_set", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
3a98461a-4ca6-4e7b-8ee7-2346e76be570	534e065f-1981-493f-952d-b3f8d919df52	Silk palazzo set with a gently flared kurti and airy pants, ideal for Indian formal dinners. Crafted	palazzo-set-1773156599112-26	Silk palazzo set with a gently flared kurti and airy pants, ideal for Indian formal dinners. Crafted in silk with a flowing profile and a black palette suited for Formal moments across India. Fits Pear Shape, Hourglass bodies, complements Light, Medium skin tones, and is available in sizes M, L, XL. Age guidance: 13-17 years.	4256	INR	10	f	20	2026-03-10 15:29:59.113	\N	APPROVED	palazzo_set	f	{"fit": "flowing", "score": "0.752", "style": "Elegant", "fabric": "silk", "cloth_id": "testiing_image_collection/102.png", "occasion": "Formal", "age_group": "13-17", "skin_tone": "Light, Medium", "body_shape": "Pear Shape, Hourglass", "quality_tag": "", "color_family": "black", "clothing_type": "palazzo_set", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
00bcd69c-110c-4699-a276-0fdb40013c99	534e065f-1981-493f-952d-b3f8d919df52	Linen co-ord set with a cropped top and tailored trousers for weekend outings. Crafted in linen with	co-ord-set-1773156599117-27	Linen co-ord set with a cropped top and tailored trousers for weekend outings. Crafted in linen with a structured profile and a neutral palette suited for Casual luxury moments across India. Fits Rectangle, Pear Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes XS, S, M, L. Age guidance: 13-17 years.	3500	INR	10	f	20	2026-03-10 15:29:59.118	\N	APPROVED	co_ord_set	f	{"fit": "structured", "score": "0.5", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "testiing_image_collection/103.png", "occasion": "Casual luxury", "age_group": "13-17", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Pear Shape", "quality_tag": "", "color_family": "neutral", "clothing_type": "co_ord_set", "recommended_size": "XS, S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
e789a459-2bac-410e-bf56-02eac4740edc	534e065f-1981-493f-952d-b3f8d919df52	Linen tunic set with high-low hem and slim pants for easy daytime polish. Crafted in linen with a re	tunic-set-1773156599123-28	Linen tunic set with high-low hem and slim pants for easy daytime polish. Crafted in linen with a relaxed profile and a metallic palette suited for Casual luxury moments across India. Fits Apple Shape, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L, XL. Age guidance: 13-17 years.	3035	INR	10	f	20	2026-03-10 15:29:59.124	\N	APPROVED	tunic_set	f	{"fit": "relaxed", "score": "0.345", "style": "Elegant", "fabric": "linen", "cloth_id": "testiing_image_collection/104.png", "occasion": "Casual luxury", "age_group": "13-17", "skin_tone": "Light, Medium", "body_shape": "Apple Shape, Rectangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "tunic_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
93912391-bdc9-4bf2-b0ab-e0f42f7325c4	534e065f-1981-493f-952d-b3f8d919df52	Satin peplum set with fitted trousers, flattering the waist for festive dinners. Crafted in satin wi	peplum-set-1773156599128-29	Satin peplum set with fitted trousers, flattering the waist for festive dinners. Crafted in satin with a structured profile and a pastel palette suited for Party moments across India. Fits Pear Shape, Hourglass bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 26-35 years.	4022	INR	10	f	20	2026-03-10 15:29:59.13	\N	APPROVED	peplum_set	f	{"fit": "structured", "score": "0.674", "style": "Elegant", "fabric": "satin", "cloth_id": "testiing_image_collection/105.png", "occasion": "Party", "age_group": "26-35", "skin_tone": "Light, Medium", "body_shape": "Pear Shape, Hourglass", "quality_tag": "", "color_family": "pastel", "clothing_type": "peplum_set", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
b8a0d437-8a11-4da5-88f4-4465e0742f80	534e065f-1981-493f-952d-b3f8d919df52	Velvet evening gown with corseted bodice and sweeping skirt suited for receptions. Crafted in velvet	gown-1773156599135-30	Velvet evening gown with corseted bodice and sweeping skirt suited for receptions. Crafted in velvet with a structured profile and a metallic palette suited for Wedding moments across India. Fits Hourglass, Inverted Triangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL. Age guidance: 18-25 years.	4469	INR	10	f	20	2026-03-10 15:29:59.136	\N	APPROVED	gown	f	{"fit": "structured", "score": "0.823", "style": "Couture", "fabric": "velvet", "cloth_id": "testiing_image_collection/106.png", "occasion": "Wedding", "age_group": "18-25", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Hourglass, Inverted Triangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "gown", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
f19892af-88d8-4c6e-a0d4-48f71f5f0b38	534e065f-1981-493f-952d-b3f8d919df52	Silk palazzo set with a gently flared kurti and airy pants, ideal for Indian formal dinners. Crafted	palazzo-set-1773156599141-31	Silk palazzo set with a gently flared kurti and airy pants, ideal for Indian formal dinners. Crafted in silk with a flowing profile and a metallic palette suited for Formal moments across India. Fits Pear Shape, Hourglass bodies, complements Light, Medium skin tones, and is available in sizes M, L, XL. Age guidance: 51+ years.	3770	INR	10	f	20	2026-03-10 15:29:59.142	\N	APPROVED	palazzo_set	f	{"fit": "flowing", "score": "0.59", "style": "Elegant", "fabric": "silk", "cloth_id": "testiing_image_collection/107.png", "occasion": "Formal", "age_group": "51+", "skin_tone": "Light, Medium", "body_shape": "Pear Shape, Hourglass", "quality_tag": "", "color_family": "metallic", "clothing_type": "palazzo_set", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
42423884-9d96-4c98-9008-6b70bf8f3ec1	534e065f-1981-493f-952d-b3f8d919df52	Silk palazzo set with a gently flared kurti and airy pants, ideal for Indian formal dinners. Crafted	palazzo-set-1773156599146-32	Silk palazzo set with a gently flared kurti and airy pants, ideal for Indian formal dinners. Crafted in silk with a flowing profile and a pastel palette suited for Formal moments across India. Fits Pear Shape, Hourglass bodies, complements Light, Medium skin tones, and is available in sizes M, L, XL. Age guidance: 26-35 years.	3905	INR	10	f	20	2026-03-10 15:29:59.147	\N	APPROVED	palazzo_set	f	{"fit": "flowing", "score": "0.635", "style": "Elegant", "fabric": "silk", "cloth_id": "testiing_image_collection/108.png", "occasion": "Formal", "age_group": "26-35", "skin_tone": "Light, Medium", "body_shape": "Pear Shape, Hourglass", "quality_tag": "", "color_family": "pastel", "clothing_type": "palazzo_set", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
f4015110-d7ed-43c7-8c90-35ee2eeb0630	534e065f-1981-493f-952d-b3f8d919df52	Velvet kurta with a longline jacket for winter formals and cultural events. Crafted in velvet with a	kurta-jacket-set-1773156599151-33	Velvet kurta with a longline jacket for winter formals and cultural events. Crafted in velvet with a structured profile and a jewel palette suited for Formal moments across India. Fits Rectangle, Inverted Triangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 13-17 years.	3170	INR	10	f	20	2026-03-10 15:29:59.152	\N	APPROVED	kurta_jacket_set	f	{"fit": "structured", "score": "0.39", "style": "Traditional Luxury", "fabric": "velvet", "cloth_id": "testiing_image_collection/109.png", "occasion": "Formal", "age_group": "13-17", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Rectangle, Inverted Triangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "kurta_jacket_set", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
ed5e8c6d-7d3a-4924-806d-830c4e409cbd	534e065f-1981-493f-952d-b3f8d919df52	Delicate lace dress with slip lining and side slit for evening receptions. Crafted in lace with a sl	lace-dress-1773156599157-34	Delicate lace dress with slip lining and side slit for evening receptions. Crafted in lace with a slim profile and a pastel palette suited for Party moments across India. Fits Hourglass, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 18-25 years.	3752	INR	10	f	20	2026-03-10 15:29:59.158	\N	APPROVED	lace_dress	f	{"fit": "slim", "score": "0.584", "style": "Elegant", "fabric": "lace", "cloth_id": "testiing_image_collection/110.png", "occasion": "Party", "age_group": "18-25", "skin_tone": "Light, Medium", "body_shape": "Hourglass, Rectangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "lace_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
cbaac4c8-9a23-4ee1-96ca-8413cfcdad1c	534e065f-1981-493f-952d-b3f8d919df52	Classic silk saree with hand-detailed borders and fluid pleats tailored for Indian wedding rituals. 	saree-1773156599163-35	Classic silk saree with hand-detailed borders and fluid pleats tailored for Indian wedding rituals. Crafted in silk with a flowing profile and a metallic palette suited for Wedding moments across India. Fits Pear Shape, Hourglass, Rectangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 51+ years.	4661	INR	10	f	20	2026-03-10 15:29:59.164	\N	APPROVED	saree	f	{"fit": "flowing", "score": "0.887", "style": "Traditional Luxury", "fabric": "silk", "cloth_id": "testiing_image_collection/111.png", "occasion": "Wedding", "age_group": "51+", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Pear Shape, Hourglass, Rectangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "saree", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
ab3bbb6b-239e-4374-ae0a-cce823911429	534e065f-1981-493f-952d-b3f8d919df52	Chiffon wrap dress with adjustable tie, easy to style for brunches and day dates. Crafted in chiffon	wrap-dress-1773156599170-36	Chiffon wrap dress with adjustable tie, easy to style for brunches and day dates. Crafted in chiffon with a flowing profile and a metallic palette suited for Casual luxury moments across India. Fits Rectangle, Pear Shape bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 51+ years.	2378	INR	10	f	20	2026-03-10 15:29:59.171	\N	APPROVED	wrap_dress	f	{"fit": "flowing", "score": "0.126", "style": "Minimal Luxury", "fabric": "chiffon", "cloth_id": "testiing_image_collection/112.png", "occasion": "Casual luxury", "age_group": "51+", "skin_tone": "Light, Medium", "body_shape": "Rectangle, Pear Shape", "quality_tag": "", "color_family": "metallic", "clothing_type": "wrap_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
4ce30006-a1aa-4433-ab18-e196a19a8403	534e065f-1981-493f-952d-b3f8d919df52	Satin peplum set with fitted trousers, flattering the waist for festive dinners. Crafted in satin wi	peplum-set-1773156599176-37	Satin peplum set with fitted trousers, flattering the waist for festive dinners. Crafted in satin with a structured profile and a black palette suited for Party moments across India. Fits Pear Shape, Hourglass bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 13-17 years.	4061	INR	10	f	20	2026-03-10 15:29:59.177	\N	APPROVED	peplum_set	f	{"fit": "structured", "score": "0.687", "style": "Elegant", "fabric": "satin", "cloth_id": "testiing_image_collection/113.png", "occasion": "Party", "age_group": "13-17", "skin_tone": "Light, Medium", "body_shape": "Pear Shape, Hourglass", "quality_tag": "", "color_family": "black", "clothing_type": "peplum_set", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
b4d81ea6-c7b5-4847-ada4-940a669352f7	534e065f-1981-493f-952d-b3f8d919df52	Layered chiffon anarkali with soft ghera and yoke embroidery for festive Indian celebrations. Crafte	anarkali-1773156599181-38	Layered chiffon anarkali with soft ghera and yoke embroidery for festive Indian celebrations. Crafted in chiffon with a flowing profile and a neutral palette suited for Wedding moments across India. Fits Apple Shape, Pear Shape, Hourglass bodies, complements Light, Medium, Dusky skin tones, and is available in sizes M, L, XL. Age guidance: 36-50 years.	3869	INR	10	f	20	2026-03-10 15:29:59.183	\N	APPROVED	anarkali	f	{"fit": "flowing", "score": "0.623", "style": "Traditional Luxury", "fabric": "chiffon", "cloth_id": "testiing_image_collection/114.png", "occasion": "Wedding", "age_group": "36-50", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Pear Shape, Hourglass", "quality_tag": "", "color_family": "neutral", "clothing_type": "anarkali", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
b54efab6-1b4f-43d4-a651-20d300862820	534e065f-1981-493f-952d-b3f8d919df52	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk wit	kaftan-1773156599187-39	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk with a relaxed profile and a metallic palette suited for Resort moments across India. Fits Apple Shape, Rectangle, Pear Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L. Age guidance: 26-35 years.	2726	INR	10	f	20	2026-03-10 15:29:59.189	\N	APPROVED	kaftan	f	{"fit": "relaxed", "score": "0.242", "style": "Minimal Luxury", "fabric": "silk", "cloth_id": "testiing_image_collection/115.png", "occasion": "Resort", "age_group": "26-35", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Rectangle, Pear Shape", "quality_tag": "", "color_family": "metallic", "clothing_type": "kaftan", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
b5fabff3-ae68-4db3-bc31-15f3863bfb80	534e065f-1981-493f-952d-b3f8d919df52	Velvet kurta with a longline jacket for winter formals and cultural events. Crafted in velvet with a	kurta-jacket-set-1773156599195-40	Velvet kurta with a longline jacket for winter formals and cultural events. Crafted in velvet with a structured profile and a neutral palette suited for Formal moments across India. Fits Rectangle, Inverted Triangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 36-50 years.	4370	INR	10	f	20	2026-03-10 15:29:59.198	\N	APPROVED	kurta_jacket_set	f	{"fit": "structured", "score": "0.79", "style": "Traditional Luxury", "fabric": "velvet", "cloth_id": "testiing_image_collection/116.png", "occasion": "Formal", "age_group": "36-50", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Rectangle, Inverted Triangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "kurta_jacket_set", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
0ccde618-8c26-44a3-bd5b-642b3df9538f	534e065f-1981-493f-952d-b3f8d919df52	Layered chiffon anarkali with soft ghera and yoke embroidery for festive Indian celebrations. Crafte	anarkali-1773156599209-41	Layered chiffon anarkali with soft ghera and yoke embroidery for festive Indian celebrations. Crafted in chiffon with a flowing profile and a jewel palette suited for Wedding moments across India. Fits Apple Shape, Pear Shape, Hourglass bodies, complements Light, Medium, Dusky skin tones, and is available in sizes M, L, XL. Age guidance: 13-17 years.	2900	INR	10	f	20	2026-03-10 15:29:59.21	\N	APPROVED	anarkali	f	{"fit": "flowing", "score": "0.3", "style": "Traditional Luxury", "fabric": "chiffon", "cloth_id": "testiing_image_collection/117.png", "occasion": "Wedding", "age_group": "13-17", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Pear Shape, Hourglass", "quality_tag": "", "color_family": "jewel", "clothing_type": "anarkali", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
2baf9ad6-870b-4106-ad2a-aef87816da86	534e065f-1981-493f-952d-b3f8d919df52	Relaxed chiffon sharara set with light zari work and breezy pants made for mehendi comfort. Crafted 	sharara-set-1773156599216-42	Relaxed chiffon sharara set with light zari work and breezy pants made for mehendi comfort. Crafted in chiffon with a relaxed profile and a pastel palette suited for Wedding moments across India. Fits Pear Shape, Apple Shape, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 13-17 years.	2765	INR	10	f	20	2026-03-10 15:29:59.217	\N	APPROVED	sharara_set	f	{"fit": "relaxed", "score": "0.255", "style": "Traditional Luxury", "fabric": "chiffon", "cloth_id": "testiing_image_collection/118.png", "occasion": "Wedding", "age_group": "13-17", "skin_tone": "Medium, Dusky", "body_shape": "Pear Shape, Apple Shape, Rectangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "sharara_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
d942345f-5da4-411d-b7ce-c78d49ad1888	534e065f-1981-493f-952d-b3f8d919df52	Silk palazzo set with a gently flared kurti and airy pants, ideal for Indian formal dinners. Crafted	palazzo-set-1773156599222-43	Silk palazzo set with a gently flared kurti and airy pants, ideal for Indian formal dinners. Crafted in silk with a flowing profile and a jewel palette suited for Formal moments across India. Fits Pear Shape, Hourglass bodies, complements Light, Medium skin tones, and is available in sizes M, L, XL. Age guidance: 36-50 years.	3830	INR	10	f	20	2026-03-10 15:29:59.223	\N	APPROVED	palazzo_set	f	{"fit": "flowing", "score": "0.61", "style": "Elegant", "fabric": "silk", "cloth_id": "testiing_image_collection/119.png", "occasion": "Formal", "age_group": "36-50", "skin_tone": "Light, Medium", "body_shape": "Pear Shape, Hourglass", "quality_tag": "", "color_family": "jewel", "clothing_type": "palazzo_set", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
2ce7697d-5cbc-4b5e-adda-80e57f79f731	534e065f-1981-493f-952d-b3f8d919df52	Structured satin fusion gown with modern drape lines tailored for Indian cocktail nights. Crafted in	fusion-gown-1773156599229-44	Structured satin fusion gown with modern drape lines tailored for Indian cocktail nights. Crafted in satin with a structured profile and a neutral palette suited for Party moments across India. Fits Inverted Triangle, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes S, M, L. Age guidance: 26-35 years.	4331	INR	10	f	20	2026-03-10 15:29:59.23	\N	APPROVED	fusion_gown	f	{"fit": "structured", "score": "0.777", "style": "Couture", "fabric": "satin", "cloth_id": "testiing_image_collection/120.png", "occasion": "Party", "age_group": "26-35", "skin_tone": "Medium, Dusky", "body_shape": "Inverted Triangle, Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "fusion_gown", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
1553c4a6-af2c-461f-a117-4d52416088c3	534e065f-1981-493f-952d-b3f8d919df52	Satin cocktail dress with a sleek cut and side ruching for evening events. Crafted in satin with a s	cocktail-dress-1773156599236-45	Satin cocktail dress with a sleek cut and side ruching for evening events. Crafted in satin with a slim profile and a black palette suited for Party moments across India. Fits Hourglass, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 26-35 years.	3926	INR	10	f	20	2026-03-10 15:29:59.237	\N	APPROVED	cocktail_dress	f	{"fit": "slim", "score": "0.642", "style": "Elegant", "fabric": "satin", "cloth_id": "testiing_image_collection/121.png", "occasion": "Party", "age_group": "26-35", "skin_tone": "Light, Medium", "body_shape": "Hourglass, Rectangle", "quality_tag": "", "color_family": "black", "clothing_type": "cocktail_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
cd9e266c-88d9-41d6-8854-8caa7d89ad1f	534e065f-1981-493f-952d-b3f8d919df52	Pre-stitched silk cape saree that adds drama without heavy draping. Crafted in silk with a structure	cape-saree-1773156599242-46	Pre-stitched silk cape saree that adds drama without heavy draping. Crafted in silk with a structured profile and a metallic palette suited for Party moments across India. Fits Inverted Triangle, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes M, L, XL. Age guidance: 26-35 years.	4544	INR	10	f	20	2026-03-10 15:29:59.244	\N	APPROVED	cape_saree	f	{"fit": "structured", "score": "0.848", "style": "Couture", "fabric": "silk", "cloth_id": "testiing_image_collection/122.png", "occasion": "Party", "age_group": "26-35", "skin_tone": "Medium, Dusky", "body_shape": "Inverted Triangle, Rectangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "cape_saree", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
48fd6342-5ca4-4f65-9641-41465330473b	534e065f-1981-493f-952d-b3f8d919df52	Classic silk saree with hand-detailed borders and fluid pleats tailored for Indian wedding rituals. 	saree-1773156599249-47	Classic silk saree with hand-detailed borders and fluid pleats tailored for Indian wedding rituals. Crafted in silk with a flowing profile and a jewel palette suited for Wedding moments across India. Fits Pear Shape, Hourglass, Rectangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 36-50 years.	4643	INR	10	f	20	2026-03-10 15:29:59.25	\N	APPROVED	saree	f	{"fit": "flowing", "score": "0.881", "style": "Traditional Luxury", "fabric": "silk", "cloth_id": "testiing_image_collection/123.png", "occasion": "Wedding", "age_group": "36-50", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Pear Shape, Hourglass, Rectangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "saree", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
746f4335-f9f8-41ba-ab46-b1640d86ea1a	534e065f-1981-493f-952d-b3f8d919df52	Layered chiffon anarkali with soft ghera and yoke embroidery for festive Indian celebrations. Crafte	anarkali-1773156599254-48	Layered chiffon anarkali with soft ghera and yoke embroidery for festive Indian celebrations. Crafted in chiffon with a flowing profile and a metallic palette suited for Wedding moments across India. Fits Apple Shape, Pear Shape, Hourglass bodies, complements Light, Medium, Dusky skin tones, and is available in sizes M, L, XL. Age guidance: 18-25 years.	3209	INR	10	f	20	2026-03-10 15:29:59.255	\N	APPROVED	anarkali	f	{"fit": "flowing", "score": "0.403", "style": "Traditional Luxury", "fabric": "chiffon", "cloth_id": "testiing_image_collection/124.png", "occasion": "Wedding", "age_group": "18-25", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Pear Shape, Hourglass", "quality_tag": "", "color_family": "metallic", "clothing_type": "anarkali", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
f8292020-81c7-4aea-842b-d167dd04daef	534e065f-1981-493f-952d-b3f8d919df52	Linen tunic set with high-low hem and slim pants for easy daytime polish. Crafted in linen with a re	tunic-set-1773156599260-49	Linen tunic set with high-low hem and slim pants for easy daytime polish. Crafted in linen with a relaxed profile and a neutral palette suited for Casual luxury moments across India. Fits Apple Shape, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L, XL. Age guidance: 26-35 years.	3074	INR	10	f	20	2026-03-10 15:29:59.26	\N	APPROVED	tunic_set	f	{"fit": "relaxed", "score": "0.358", "style": "Elegant", "fabric": "linen", "cloth_id": "testiing_image_collection/125.png", "occasion": "Casual luxury", "age_group": "26-35", "skin_tone": "Light, Medium", "body_shape": "Apple Shape, Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "tunic_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
b01601f7-2dab-4ab9-b81e-46187f2384e2	534e065f-1981-493f-952d-b3f8d919df52	Satin blazer dress with sharp lapels and waist definition for boardroom-to-dinner dressing. Crafted 	blazer-dress-1773156599265-50	Satin blazer dress with sharp lapels and waist definition for boardroom-to-dinner dressing. Crafted in satin with a structured profile and a pastel palette suited for Formal moments across India. Fits Rectangle, Inverted Triangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 13-17 years.	3695	INR	10	f	20	2026-03-10 15:29:59.266	\N	APPROVED	blazer_dress	f	{"fit": "structured", "score": "0.565", "style": "Minimal Luxury", "fabric": "satin", "cloth_id": "train_image/01.png", "occasion": "Formal", "age_group": "13-17", "skin_tone": "Light, Medium", "body_shape": "Rectangle, Inverted Triangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "blazer_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
322ed57e-9223-4455-909f-8a2df6cb864a	534e065f-1981-493f-952d-b3f8d919df52	Satin blazer dress with sharp lapels and waist definition for boardroom-to-dinner dressing. Crafted 	blazer-dress-1773156599270-51	Satin blazer dress with sharp lapels and waist definition for boardroom-to-dinner dressing. Crafted in satin with a structured profile and a neutral palette suited for Formal moments across India. Fits Rectangle, Inverted Triangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 51+ years.	2609	INR	10	f	20	2026-03-10 15:29:59.271	\N	APPROVED	blazer_dress	f	{"fit": "structured", "score": "0.203", "style": "Minimal Luxury", "fabric": "satin", "cloth_id": "train_image/02.png", "occasion": "Formal", "age_group": "51+", "skin_tone": "Light, Medium", "body_shape": "Rectangle, Inverted Triangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "blazer_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
403a90dd-f53a-495c-8150-c9f16c3b478e	534e065f-1981-493f-952d-b3f8d919df52	Pre-stitched silk cape saree that adds drama without heavy draping. Crafted in silk with a structure	cape-saree-1773156599276-52	Pre-stitched silk cape saree that adds drama without heavy draping. Crafted in silk with a structured profile and a neutral palette suited for Party moments across India. Fits Inverted Triangle, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes M, L, XL. Age guidance: 51+ years.	4526	INR	10	f	20	2026-03-10 15:29:59.277	\N	APPROVED	cape_saree	f	{"fit": "structured", "score": "0.842", "style": "Couture", "fabric": "silk", "cloth_id": "train_image/03.png", "occasion": "Party", "age_group": "51+", "skin_tone": "Medium, Dusky", "body_shape": "Inverted Triangle, Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "cape_saree", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
0c4dc35a-7a34-495c-9d20-c89012965e6b	534e065f-1981-493f-952d-b3f8d919df52	Structured silk lehenga set with a supportive blouse and ample flare suited to sangeet and pheras. C	lehenga-set-1773156599281-53	Structured silk lehenga set with a supportive blouse and ample flare suited to sangeet and pheras. Crafted in silk with a structured profile and a metallic palette suited for Wedding moments across India. Fits Hourglass, Pear Shape bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 13-17 years.	4157	INR	10	f	20	2026-03-10 15:29:59.282	\N	APPROVED	lehenga_set	f	{"fit": "structured", "score": "0.719", "style": "Traditional Luxury", "fabric": "silk", "cloth_id": "train_image/04.png", "occasion": "Wedding", "age_group": "13-17", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Hourglass, Pear Shape", "quality_tag": "", "color_family": "metallic", "clothing_type": "lehenga_set", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
ac6ceefa-a62c-42c3-880a-4450d55e2010	534e065f-1981-493f-952d-b3f8d919df52	Chiffon wrap dress with adjustable tie, easy to style for brunches and day dates. Crafted in chiffon	wrap-dress-1773156599292-55	Chiffon wrap dress with adjustable tie, easy to style for brunches and day dates. Crafted in chiffon with a flowing profile and a black palette suited for Casual luxury moments across India. Fits Rectangle, Pear Shape bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 13-17 years.	2978	INR	10	f	20	2026-03-10 15:29:59.293	\N	APPROVED	wrap_dress	f	{"fit": "flowing", "score": "0.326", "style": "Minimal Luxury", "fabric": "chiffon", "cloth_id": "train_image/img006.jpg", "occasion": "Casual luxury", "age_group": "13-17", "skin_tone": "Light, Medium", "body_shape": "Rectangle, Pear Shape", "quality_tag": "", "color_family": "black", "clothing_type": "wrap_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
2b04e8c5-1be7-485c-a6da-0394328af080	534e065f-1981-493f-952d-b3f8d919df52	Classic silk saree with hand-detailed borders and fluid pleats tailored for Indian wedding rituals. 	saree-1773156599297-56	Classic silk saree with hand-detailed borders and fluid pleats tailored for Indian wedding rituals. Crafted in silk with a flowing profile and a neutral palette suited for Wedding moments across India. Fits Pear Shape, Hourglass, Rectangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 18-25 years.	4118	INR	10	f	20	2026-03-10 15:29:59.298	\N	APPROVED	saree	f	{"fit": "flowing", "score": "0.706", "style": "Traditional Luxury", "fabric": "silk", "cloth_id": "train_image/img007.jpg", "occasion": "Wedding", "age_group": "18-25", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Pear Shape, Hourglass, Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "saree", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
faaf248f-a437-410e-b93e-b06ad2e5223f	534e065f-1981-493f-952d-b3f8d919df52	Linen co-ord set with a cropped top and tailored trousers for weekend outings. Crafted in linen with	co-ord-set-1773156599301-57	Linen co-ord set with a cropped top and tailored trousers for weekend outings. Crafted in linen with a structured profile and a black palette suited for Casual luxury moments across India. Fits Rectangle, Pear Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes XS, S, M, L. Age guidance: 51+ years.	2435	INR	10	f	20	2026-03-10 15:29:59.302	\N	APPROVED	co_ord_set	f	{"fit": "structured", "score": "0.145", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img008.jpg", "occasion": "Casual luxury", "age_group": "51+", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Pear Shape", "quality_tag": "", "color_family": "black", "clothing_type": "co_ord_set", "recommended_size": "XS, S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
e284149a-4414-410d-b22b-89061723d7fa	534e065f-1981-493f-952d-b3f8d919df52	Relaxed chiffon sharara set with light zari work and breezy pants made for mehendi comfort. Crafted 	sharara-set-1773156599306-58	Relaxed chiffon sharara set with light zari work and breezy pants made for mehendi comfort. Crafted in chiffon with a relaxed profile and a black palette suited for Wedding moments across India. Fits Pear Shape, Apple Shape, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 36-50 years.	3656	INR	10	f	20	2026-03-10 15:29:59.308	\N	APPROVED	sharara_set	f	{"fit": "relaxed", "score": "0.552", "style": "Traditional Luxury", "fabric": "chiffon", "cloth_id": "train_image/img009.jpg", "occasion": "Wedding", "age_group": "36-50", "skin_tone": "Medium, Dusky", "body_shape": "Pear Shape, Apple Shape, Rectangle", "quality_tag": "", "color_family": "black", "clothing_type": "sharara_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
3137a116-6ad4-491c-b30c-9de84e6800f7	534e065f-1981-493f-952d-b3f8d919df52	Satin peplum set with fitted trousers, flattering the waist for festive dinners. Crafted in satin wi	peplum-set-1773156599313-59	Satin peplum set with fitted trousers, flattering the waist for festive dinners. Crafted in satin with a structured profile and a jewel palette suited for Party moments across India. Fits Pear Shape, Hourglass bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 36-50 years.	4217	INR	10	f	20	2026-03-10 15:29:59.314	\N	APPROVED	peplum_set	f	{"fit": "structured", "score": "0.739", "style": "Elegant", "fabric": "satin", "cloth_id": "train_image/img010.jpg", "occasion": "Party", "age_group": "36-50", "skin_tone": "Light, Medium", "body_shape": "Pear Shape, Hourglass", "quality_tag": "", "color_family": "jewel", "clothing_type": "peplum_set", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
62410a32-d4aa-407f-91ba-9bbf54e3640c	534e065f-1981-493f-952d-b3f8d919df52	Linen co-ord set with a cropped top and tailored trousers for weekend outings. Crafted in linen with	co-ord-set-1773156599319-60	Linen co-ord set with a cropped top and tailored trousers for weekend outings. Crafted in linen with a structured profile and a jewel palette suited for Casual luxury moments across India. Fits Rectangle, Pear Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes XS, S, M, L. Age guidance: 26-35 years.	2783	INR	10	f	20	2026-03-10 15:29:59.32	\N	APPROVED	co_ord_set	f	{"fit": "structured", "score": "0.261", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img011.jpg", "occasion": "Casual luxury", "age_group": "26-35", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Pear Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "co_ord_set", "recommended_size": "XS, S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
5c004a45-3e00-41ef-b220-1a0ca189ea3f	534e065f-1981-493f-952d-b3f8d919df52	Layered chiffon anarkali with soft ghera and yoke embroidery for festive Indian celebrations. Crafte	anarkali-1773156599324-61	Layered chiffon anarkali with soft ghera and yoke embroidery for festive Indian celebrations. Crafted in chiffon with a flowing profile and a black palette suited for Wedding moments across India. Fits Apple Shape, Pear Shape, Hourglass bodies, complements Light, Medium, Dusky skin tones, and is available in sizes M, L, XL. Age guidance: 26-35 years.	3674	INR	10	f	20	2026-03-10 15:29:59.325	\N	APPROVED	anarkali	f	{"fit": "flowing", "score": "0.558", "style": "Traditional Luxury", "fabric": "chiffon", "cloth_id": "train_image/img012.jpg", "occasion": "Wedding", "age_group": "26-35", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Pear Shape, Hourglass", "quality_tag": "", "color_family": "black", "clothing_type": "anarkali", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
8cbc23a9-e043-4f63-a910-7fe4745b549b	534e065f-1981-493f-952d-b3f8d919df52	Tailored linen jumpsuit with a cinched waist built for humid city days. Crafted in linen with a stru	jumpsuit-1773156599329-62	Tailored linen jumpsuit with a cinched waist built for humid city days. Crafted in linen with a structured profile and a black palette suited for Casual luxury moments across India. Fits Rectangle, Apple Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 18-25 years.	3113	INR	10	f	20	2026-03-10 15:29:59.33	\N	APPROVED	jumpsuit	f	{"fit": "structured", "score": "0.371", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img013.jpg", "occasion": "Casual luxury", "age_group": "18-25", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Apple Shape", "quality_tag": "", "color_family": "black", "clothing_type": "jumpsuit", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
121a5926-aebe-40e6-a66b-e9a4529e0542	534e065f-1981-493f-952d-b3f8d919df52	Tailored linen jumpsuit with a cinched waist built for humid city days. Crafted in linen with a stru	jumpsuit-1773156599334-63	Tailored linen jumpsuit with a cinched waist built for humid city days. Crafted in linen with a structured profile and a neutral palette suited for Casual luxury moments across India. Fits Rectangle, Apple Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 26-35 years.	2804	INR	10	f	20	2026-03-10 15:29:59.335	\N	APPROVED	jumpsuit	f	{"fit": "structured", "score": "0.268", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img014.jpg", "occasion": "Casual luxury", "age_group": "26-35", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Apple Shape", "quality_tag": "", "color_family": "neutral", "clothing_type": "jumpsuit", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
29e6714c-cee3-40c0-b8d8-f84109571fff	534e065f-1981-493f-952d-b3f8d919df52	Linen co-ord set with a cropped top and tailored trousers for weekend outings. Crafted in linen with	co-ord-set-1773156599339-64	Linen co-ord set with a cropped top and tailored trousers for weekend outings. Crafted in linen with a structured profile and a pastel palette suited for Casual luxury moments across India. Fits Rectangle, Pear Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes XS, S, M, L. Age guidance: 18-25 years.	3269	INR	10	f	20	2026-03-10 15:29:59.34	\N	APPROVED	co_ord_set	f	{"fit": "structured", "score": "0.423", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img015.jpg", "occasion": "Casual luxury", "age_group": "18-25", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Pear Shape", "quality_tag": "", "color_family": "pastel", "clothing_type": "co_ord_set", "recommended_size": "XS, S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
019de3cf-5093-43f5-8924-fba15cde10b8	534e065f-1981-493f-952d-b3f8d919df52	Breezy chiffon maxi dress with tiered hem, designed for coastal getaways and Indian summers. Crafted	maxi-dress-1773156599344-65	Breezy chiffon maxi dress with tiered hem, designed for coastal getaways and Indian summers. Crafted in chiffon with a flowing profile and a black palette suited for Resort moments across India. Fits Rectangle, Pear Shape, Hourglass bodies, complements Light, Medium, Dusky skin tones, and is available in sizes XS, S, M, L. Age guidance: 51+ years.	2456	INR	10	f	20	2026-03-10 15:29:59.345	\N	APPROVED	maxi_dress	f	{"fit": "flowing", "score": "0.152", "style": "Minimal Luxury", "fabric": "chiffon", "cloth_id": "train_image/img016.jpg", "occasion": "Resort", "age_group": "51+", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Pear Shape, Hourglass", "quality_tag": "", "color_family": "black", "clothing_type": "maxi_dress", "recommended_size": "XS, S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
c7682873-efba-481c-81da-01e25b1e2cbb	534e065f-1981-493f-952d-b3f8d919df52	Breezy chiffon maxi dress with tiered hem, designed for coastal getaways and Indian summers. Crafted	maxi-dress-1773156599349-66	Breezy chiffon maxi dress with tiered hem, designed for coastal getaways and Indian summers. Crafted in chiffon with a flowing profile and a jewel palette suited for Resort moments across India. Fits Rectangle, Pear Shape, Hourglass bodies, complements Light, Medium, Dusky skin tones, and is available in sizes XS, S, M, L. Age guidance: 26-35 years.	2822	INR	10	f	20	2026-03-10 15:29:59.35	\N	APPROVED	maxi_dress	f	{"fit": "flowing", "score": "0.274", "style": "Minimal Luxury", "fabric": "chiffon", "cloth_id": "train_image/img017.jpg", "occasion": "Resort", "age_group": "26-35", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Pear Shape, Hourglass", "quality_tag": "", "color_family": "jewel", "clothing_type": "maxi_dress", "recommended_size": "XS, S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
9c057eb7-9f49-4f6c-8225-6b044af957d6	534e065f-1981-493f-952d-b3f8d919df52	Pre-stitched silk cape saree that adds drama without heavy draping. Crafted in silk with a structure	cape-saree-1773156599354-67	Pre-stitched silk cape saree that adds drama without heavy draping. Crafted in silk with a structured profile and a pastel palette suited for Party moments across India. Fits Inverted Triangle, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes M, L, XL. Age guidance: 13-17 years.	3539	INR	10	f	20	2026-03-10 15:29:59.355	\N	APPROVED	cape_saree	f	{"fit": "structured", "score": "0.513", "style": "Couture", "fabric": "silk", "cloth_id": "train_image/img018.jpg", "occasion": "Party", "age_group": "13-17", "skin_tone": "Medium, Dusky", "body_shape": "Inverted Triangle, Rectangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "cape_saree", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
ac605a72-c5a4-4502-8507-dd64ebfc403c	534e065f-1981-493f-952d-b3f8d919df52	Satin peplum set with fitted trousers, flattering the waist for festive dinners. Crafted in satin wi	peplum-set-1773156599358-68	Satin peplum set with fitted trousers, flattering the waist for festive dinners. Crafted in satin with a structured profile and a neutral palette suited for Party moments across India. Fits Pear Shape, Hourglass bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 18-25 years.	3965	INR	10	f	20	2026-03-10 15:29:59.359	\N	APPROVED	peplum_set	f	{"fit": "structured", "score": "0.655", "style": "Elegant", "fabric": "satin", "cloth_id": "train_image/img019.jpg", "occasion": "Party", "age_group": "18-25", "skin_tone": "Light, Medium", "body_shape": "Pear Shape, Hourglass", "quality_tag": "", "color_family": "neutral", "clothing_type": "peplum_set", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
eba571b0-5d18-4a37-8290-8e8477b3414a	534e065f-1981-493f-952d-b3f8d919df52	Satin cocktail dress with a sleek cut and side ruching for evening events. Crafted in satin with a s	cocktail-dress-1773156599364-69	Satin cocktail dress with a sleek cut and side ruching for evening events. Crafted in satin with a slim profile and a pastel palette suited for Party moments across India. Fits Hourglass, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 51+ years.	3557	INR	10	f	20	2026-03-10 15:29:59.365	\N	APPROVED	cocktail_dress	f	{"fit": "slim", "score": "0.519", "style": "Elegant", "fabric": "satin", "cloth_id": "train_image/img020.jpg", "occasion": "Party", "age_group": "51+", "skin_tone": "Light, Medium", "body_shape": "Hourglass, Rectangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "cocktail_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
700efca8-c38e-4cda-bc57-e6649846c042	534e065f-1981-493f-952d-b3f8d919df52	Structured satin fusion gown with modern drape lines tailored for Indian cocktail nights. Crafted in	fusion-gown-1773156599369-70	Structured satin fusion gown with modern drape lines tailored for Indian cocktail nights. Crafted in satin with a structured profile and a black palette suited for Party moments across India. Fits Inverted Triangle, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes S, M, L. Age guidance: 18-25 years.	3944	INR	10	f	20	2026-03-10 15:29:59.37	\N	APPROVED	fusion_gown	f	{"fit": "structured", "score": "0.648", "style": "Couture", "fabric": "satin", "cloth_id": "train_image/img021.jpg", "occasion": "Party", "age_group": "18-25", "skin_tone": "Medium, Dusky", "body_shape": "Inverted Triangle, Rectangle", "quality_tag": "", "color_family": "black", "clothing_type": "fusion_gown", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
40776d9b-154f-4e30-b2fa-a2f197f709b3	534e065f-1981-493f-952d-b3f8d919df52	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weath	kurta-set-1773156599374-71	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weather. Crafted in linen with a relaxed profile and a neutral palette suited for Formal moments across India. Fits Apple Shape, Rectangle bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 13-17 years.	3230	INR	10	f	20	2026-03-10 15:29:59.375	\N	APPROVED	kurta_set	f	{"fit": "relaxed", "score": "0.41", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img022.jpg", "occasion": "Formal", "age_group": "13-17", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "kurta_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
8286ce19-7df1-4290-8574-bbf619c2ef22	534e065f-1981-493f-952d-b3f8d919df52	Structured satin fusion gown with modern drape lines tailored for Indian cocktail nights. Crafted in	fusion-gown-1773156599379-72	Structured satin fusion gown with modern drape lines tailored for Indian cocktail nights. Crafted in satin with a structured profile and a pastel palette suited for Party moments across India. Fits Inverted Triangle, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes S, M, L. Age guidance: 36-50 years.	4409	INR	10	f	20	2026-03-10 15:29:59.38	\N	APPROVED	fusion_gown	f	{"fit": "structured", "score": "0.803", "style": "Couture", "fabric": "satin", "cloth_id": "train_image/img023.jpg", "occasion": "Party", "age_group": "36-50", "skin_tone": "Medium, Dusky", "body_shape": "Inverted Triangle, Rectangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "fusion_gown", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
85135d13-d80a-4b5d-b9fa-21df46544832	534e065f-1981-493f-952d-b3f8d919df52	Delicate lace dress with slip lining and side slit for evening receptions. Crafted in lace with a sl	lace-dress-1773156599385-73	Delicate lace dress with slip lining and side slit for evening receptions. Crafted in lace with a slim profile and a neutral palette suited for Party moments across India. Fits Hourglass, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 13-17 years.	3635	INR	10	f	20	2026-03-10 15:29:59.386	\N	APPROVED	lace_dress	f	{"fit": "slim", "score": "0.545", "style": "Elegant", "fabric": "lace", "cloth_id": "train_image/img024.jpg", "occasion": "Party", "age_group": "13-17", "skin_tone": "Light, Medium", "body_shape": "Hourglass, Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "lace_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
0c578c16-e476-4419-a190-b393c847e6ec	534e065f-1981-493f-952d-b3f8d919df52	Linen tunic set with high-low hem and slim pants for easy daytime polish. Crafted in linen with a re	tunic-set-1773156599390-74	Linen tunic set with high-low hem and slim pants for easy daytime polish. Crafted in linen with a relaxed profile and a black palette suited for Casual luxury moments across India. Fits Apple Shape, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L, XL. Age guidance: 18-25 years.	2996	INR	10	f	20	2026-03-10 15:29:59.391	\N	APPROVED	tunic_set	f	{"fit": "relaxed", "score": "0.332", "style": "Elegant", "fabric": "linen", "cloth_id": "train_image/img025.jpg", "occasion": "Casual luxury", "age_group": "18-25", "skin_tone": "Light, Medium", "body_shape": "Apple Shape, Rectangle", "quality_tag": "", "color_family": "black", "clothing_type": "tunic_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
abcaf622-e858-4133-a49e-2dfceba50d34	534e065f-1981-493f-952d-b3f8d919df52	Breezy chiffon maxi dress with tiered hem, designed for coastal getaways and Indian summers. Crafted	maxi-dress-1773156599395-75	Breezy chiffon maxi dress with tiered hem, designed for coastal getaways and Indian summers. Crafted in chiffon with a flowing profile and a metallic palette suited for Resort moments across India. Fits Rectangle, Pear Shape, Hourglass bodies, complements Light, Medium, Dusky skin tones, and is available in sizes XS, S, M, L. Age guidance: 36-50 years.	2669	INR	10	f	20	2026-03-10 15:29:59.396	\N	APPROVED	maxi_dress	f	{"fit": "flowing", "score": "0.223", "style": "Minimal Luxury", "fabric": "chiffon", "cloth_id": "train_image/img026.jpg", "occasion": "Resort", "age_group": "36-50", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Pear Shape, Hourglass", "quality_tag": "", "color_family": "metallic", "clothing_type": "maxi_dress", "recommended_size": "XS, S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
1da66a83-c88e-487d-8423-c120e94df16f	534e065f-1981-493f-952d-b3f8d919df52	Linen tunic set with high-low hem and slim pants for easy daytime polish. Crafted in linen with a re	tunic-set-1773156599399-76	Linen tunic set with high-low hem and slim pants for easy daytime polish. Crafted in linen with a relaxed profile and a jewel palette suited for Casual luxury moments across India. Fits Apple Shape, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L, XL. Age guidance: 51+ years.	2939	INR	10	f	20	2026-03-10 15:29:59.4	\N	APPROVED	tunic_set	f	{"fit": "relaxed", "score": "0.313", "style": "Elegant", "fabric": "linen", "cloth_id": "train_image/img027.jpg", "occasion": "Casual luxury", "age_group": "51+", "skin_tone": "Light, Medium", "body_shape": "Apple Shape, Rectangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "tunic_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
5fd88d3d-3346-4a41-b4cb-ff7993d4ace6	534e065f-1981-493f-952d-b3f8d919df52	Silk palazzo set with a gently flared kurti and airy pants, ideal for Indian formal dinners. Crafted	palazzo-set-1773156599404-77	Silk palazzo set with a gently flared kurti and airy pants, ideal for Indian formal dinners. Crafted in silk with a flowing profile and a neutral palette suited for Formal moments across India. Fits Pear Shape, Hourglass bodies, complements Light, Medium skin tones, and is available in sizes M, L, XL. Age guidance: 18-25 years.	4082	INR	10	f	20	2026-03-10 15:29:59.405	\N	APPROVED	palazzo_set	f	{"fit": "flowing", "score": "0.694", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/img028.jpg", "occasion": "Formal", "age_group": "18-25", "skin_tone": "Light, Medium", "body_shape": "Pear Shape, Hourglass", "quality_tag": "", "color_family": "neutral", "clothing_type": "palazzo_set", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
0e6e1b86-5bb9-4d85-a906-be8e6c1e406d	534e065f-1981-493f-952d-b3f8d919df52	Velvet kurta with a longline jacket for winter formals and cultural events. Crafted in velvet with a	kurta-jacket-set-1773156599409-78	Velvet kurta with a longline jacket for winter formals and cultural events. Crafted in velvet with a structured profile and a pastel palette suited for Formal moments across India. Fits Rectangle, Inverted Triangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 51+ years.	4391	INR	10	f	20	2026-03-10 15:29:59.41	\N	APPROVED	kurta_jacket_set	f	{"fit": "structured", "score": "0.797", "style": "Traditional Luxury", "fabric": "velvet", "cloth_id": "train_image/img029.jpg", "occasion": "Formal", "age_group": "51+", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Rectangle, Inverted Triangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "kurta_jacket_set", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
0da605d6-4771-4e62-a01b-fbb1545e39c2	534e065f-1981-493f-952d-b3f8d919df52	Structured satin fusion gown with modern drape lines tailored for Indian cocktail nights. Crafted in	fusion-gown-1773156599413-79	Structured satin fusion gown with modern drape lines tailored for Indian cocktail nights. Crafted in satin with a structured profile and a jewel palette suited for Party moments across India. Fits Inverted Triangle, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes S, M, L. Age guidance: 51+ years.	4622	INR	10	f	20	2026-03-10 15:29:59.414	\N	APPROVED	fusion_gown	f	{"fit": "structured", "score": "0.874", "style": "Couture", "fabric": "satin", "cloth_id": "train_image/img030.jpg", "occasion": "Party", "age_group": "51+", "skin_tone": "Medium, Dusky", "body_shape": "Inverted Triangle, Rectangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "fusion_gown", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
d77d7ca4-2beb-407e-89f9-ab57b0a881c2	534e065f-1981-493f-952d-b3f8d919df52	Good quality party outfit for Indian female in age group 13-17.	cocktail-dress-1773156599657-130	Good quality party outfit for Indian female in age group 13-17.	4700	INR	10	f	20	2026-03-10 15:29:59.658	\N	APPROVED	Cocktail dress	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_006", "occasion": "Party", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
1f3dd385-0829-4fdd-ac72-50e9ea71ec6e	534e065f-1981-493f-952d-b3f8d919df52	Structured silk lehenga set with a supportive blouse and ample flare suited to sangeet and pheras. C	lehenga-set-1773156599418-80	Structured silk lehenga set with a supportive blouse and ample flare suited to sangeet and pheras. Crafted in silk with a structured profile and a jewel palette suited for Wedding moments across India. Fits Hourglass, Pear Shape bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 51+ years.	4682	INR	10	f	20	2026-03-10 15:29:59.419	\N	APPROVED	lehenga_set	f	{"fit": "structured", "score": "0.894", "style": "Traditional Luxury", "fabric": "silk", "cloth_id": "train_image/img031.jpg", "occasion": "Wedding", "age_group": "51+", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Hourglass, Pear Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "lehenga_set", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
42acc2fa-a355-4039-8002-4f937987704f	534e065f-1981-493f-952d-b3f8d919df52	Breezy chiffon maxi dress with tiered hem, designed for coastal getaways and Indian summers. Crafted	maxi-dress-1773156599423-81	Breezy chiffon maxi dress with tiered hem, designed for coastal getaways and Indian summers. Crafted in chiffon with a flowing profile and a pastel palette suited for Resort moments across India. Fits Rectangle, Pear Shape, Hourglass bodies, complements Light, Medium, Dusky skin tones, and is available in sizes XS, S, M, L. Age guidance: 18-25 years.	3713	INR	10	f	20	2026-03-10 15:29:59.424	\N	APPROVED	maxi_dress	f	{"fit": "flowing", "score": "0.571", "style": "Minimal Luxury", "fabric": "chiffon", "cloth_id": "train_image/img032.jpg", "occasion": "Resort", "age_group": "18-25", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Pear Shape, Hourglass", "quality_tag": "", "color_family": "pastel", "clothing_type": "maxi_dress", "recommended_size": "XS, S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
ce0156eb-9144-4eca-9c2f-04b9e48dac58	534e065f-1981-493f-952d-b3f8d919df52	Tailored linen jumpsuit with a cinched waist built for humid city days. Crafted in linen with a stru	jumpsuit-1773156599428-82	Tailored linen jumpsuit with a cinched waist built for humid city days. Crafted in linen with a structured profile and a metallic palette suited for Casual luxury moments across India. Fits Rectangle, Apple Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 13-17 years.	3422	INR	10	f	20	2026-03-10 15:29:59.429	\N	APPROVED	jumpsuit	f	{"fit": "structured", "score": "0.474", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img033.jpg", "occasion": "Casual luxury", "age_group": "13-17", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Apple Shape", "quality_tag": "", "color_family": "metallic", "clothing_type": "jumpsuit", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
1d321f83-5dc4-4f1f-8b9f-a135d196d67e	534e065f-1981-493f-952d-b3f8d919df52	Velvet evening gown with corseted bodice and sweeping skirt suited for receptions. Crafted in velvet	gown-1773156599433-83	Velvet evening gown with corseted bodice and sweeping skirt suited for receptions. Crafted in velvet with a structured profile and a jewel palette suited for Wedding moments across India. Fits Hourglass, Inverted Triangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL. Age guidance: 13-17 years.	4352	INR	10	f	20	2026-03-10 15:29:59.434	\N	APPROVED	gown	f	{"fit": "structured", "score": "0.784", "style": "Couture", "fabric": "velvet", "cloth_id": "train_image/img034.jpg", "occasion": "Wedding", "age_group": "13-17", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Hourglass, Inverted Triangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "gown", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
6c5622f3-b032-4363-a6d0-fe718542dab2	534e065f-1981-493f-952d-b3f8d919df52	Linen co-ord set with a cropped top and tailored trousers for weekend outings. Crafted in linen with	co-ord-set-1773156599438-84	Linen co-ord set with a cropped top and tailored trousers for weekend outings. Crafted in linen with a structured profile and a metallic palette suited for Casual luxury moments across India. Fits Rectangle, Pear Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes XS, S, M, L. Age guidance: 36-50 years.	2648	INR	10	f	20	2026-03-10 15:29:59.439	\N	APPROVED	co_ord_set	f	{"fit": "structured", "score": "0.216", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img035.jpg", "occasion": "Casual luxury", "age_group": "36-50", "skin_tone": "Light, Medium, Dusky", "body_shape": "Rectangle, Pear Shape", "quality_tag": "", "color_family": "metallic", "clothing_type": "co_ord_set", "recommended_size": "XS, S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
6311775b-f2f8-443c-9946-fea4873239aa	534e065f-1981-493f-952d-b3f8d919df52	Satin blazer dress with sharp lapels and waist definition for boardroom-to-dinner dressing. Crafted 	blazer-dress-1773156599444-85	Satin blazer dress with sharp lapels and waist definition for boardroom-to-dinner dressing. Crafted in satin with a structured profile and a metallic palette suited for Formal moments across India. Fits Rectangle, Inverted Triangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 26-35 years.	2861	INR	10	f	20	2026-03-10 15:29:59.445	\N	APPROVED	blazer_dress	f	{"fit": "structured", "score": "0.287", "style": "Minimal Luxury", "fabric": "satin", "cloth_id": "train_image/img036.jpg", "occasion": "Formal", "age_group": "26-35", "skin_tone": "Light, Medium", "body_shape": "Rectangle, Inverted Triangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "blazer_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
01c48cea-3182-4c63-a8ef-7181766c5ff7	534e065f-1981-493f-952d-b3f8d919df52	Delicate lace dress with slip lining and side slit for evening receptions. Crafted in lace with a sl	lace-dress-1773156599448-86	Delicate lace dress with slip lining and side slit for evening receptions. Crafted in lace with a slim profile and a jewel palette suited for Party moments across India. Fits Hourglass, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 26-35 years.	4235	INR	10	f	20	2026-03-10 15:29:59.449	\N	APPROVED	lace_dress	f	{"fit": "slim", "score": "0.745", "style": "Elegant", "fabric": "lace", "cloth_id": "train_image/img037.jpg", "occasion": "Party", "age_group": "26-35", "skin_tone": "Light, Medium", "body_shape": "Hourglass, Rectangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "lace_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
ef72cce1-a3da-44cf-a9d9-9ef2da202ecf	534e065f-1981-493f-952d-b3f8d919df52	Chiffon wrap dress with adjustable tie, easy to style for brunches and day dates. Crafted in chiffon	wrap-dress-1773156599453-87	Chiffon wrap dress with adjustable tie, easy to style for brunches and day dates. Crafted in chiffon with a flowing profile and a pastel palette suited for Casual luxury moments across India. Fits Rectangle, Pear Shape bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 26-35 years.	2687	INR	10	f	20	2026-03-10 15:29:59.455	\N	APPROVED	wrap_dress	f	{"fit": "flowing", "score": "0.229", "style": "Minimal Luxury", "fabric": "chiffon", "cloth_id": "train_image/img038.jpg", "occasion": "Casual luxury", "age_group": "26-35", "skin_tone": "Light, Medium", "body_shape": "Rectangle, Pear Shape", "quality_tag": "", "color_family": "pastel", "clothing_type": "wrap_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
a68907d9-51e1-47a9-a4b8-277386a3409e	534e065f-1981-493f-952d-b3f8d919df52	Velvet kurta with a longline jacket for winter formals and cultural events. Crafted in velvet with a	kurta-jacket-set-1773156599458-88	Velvet kurta with a longline jacket for winter formals and cultural events. Crafted in velvet with a structured profile and a black palette suited for Formal moments across India. Fits Rectangle, Inverted Triangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 26-35 years.	4430	INR	10	f	20	2026-03-10 15:29:59.459	\N	APPROVED	kurta_jacket_set	f	{"fit": "structured", "score": "0.81", "style": "Traditional Luxury", "fabric": "velvet", "cloth_id": "train_image/img039.jpg", "occasion": "Formal", "age_group": "26-35", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Rectangle, Inverted Triangle", "quality_tag": "", "color_family": "black", "clothing_type": "kurta_jacket_set", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
96b9b4c7-c003-416b-88e0-2bb3f28b5692	534e065f-1981-493f-952d-b3f8d919df52	Layered chiffon anarkali with soft ghera and yoke embroidery for festive Indian celebrations. Crafte	anarkali-1773156599462-89	Layered chiffon anarkali with soft ghera and yoke embroidery for festive Indian celebrations. Crafted in chiffon with a flowing profile and a pastel palette suited for Wedding moments across India. Fits Apple Shape, Pear Shape, Hourglass bodies, complements Light, Medium, Dusky skin tones, and is available in sizes M, L, XL. Age guidance: 51+ years.	4196	INR	10	f	20	2026-03-10 15:29:59.463	\N	APPROVED	anarkali	f	{"fit": "flowing", "score": "0.732", "style": "Traditional Luxury", "fabric": "chiffon", "cloth_id": "train_image/img040.jpg", "occasion": "Wedding", "age_group": "51+", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Pear Shape, Hourglass", "quality_tag": "", "color_family": "pastel", "clothing_type": "anarkali", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
027d5df8-6b06-482a-bbcd-4590a85ccd79	534e065f-1981-493f-952d-b3f8d919df52	Satin cocktail dress with a sleek cut and side ruching for evening events. Crafted in satin with a s	cocktail-dress-1773156599467-90	Satin cocktail dress with a sleek cut and side ruching for evening events. Crafted in satin with a slim profile and a neutral palette suited for Party moments across India. Fits Hourglass, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 36-50 years.	3461	INR	10	f	20	2026-03-10 15:29:59.468	\N	APPROVED	cocktail_dress	f	{"fit": "slim", "score": "0.487", "style": "Elegant", "fabric": "satin", "cloth_id": "train_image/img041.jpg", "occasion": "Party", "age_group": "36-50", "skin_tone": "Light, Medium", "body_shape": "Hourglass, Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "cocktail_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
37ffbf4f-f3db-4bfc-a5b7-5f5ce9fb4eff	534e065f-1981-493f-952d-b3f8d919df52	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weath	kurta-set-1773156599471-91	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weather. Crafted in linen with a relaxed profile and a jewel palette suited for Formal moments across India. Fits Apple Shape, Rectangle bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 26-35 years.	2744	INR	10	f	20	2026-03-10 15:29:59.472	\N	APPROVED	kurta_set	f	{"fit": "relaxed", "score": "0.248", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img042.jpg", "occasion": "Formal", "age_group": "26-35", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Rectangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "kurta_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
4289da31-2514-4943-a4b2-8c78d83809b5	534e065f-1981-493f-952d-b3f8d919df52	Satin cocktail dress with a sleek cut and side ruching for evening events. Crafted in satin with a s	cocktail-dress-1773156599476-92	Satin cocktail dress with a sleek cut and side ruching for evening events. Crafted in satin with a slim profile and a metallic palette suited for Party moments across India. Fits Hourglass, Rectangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 18-25 years.	4274	INR	10	f	20	2026-03-10 15:29:59.477	\N	APPROVED	cocktail_dress	f	{"fit": "slim", "score": "0.758", "style": "Elegant", "fabric": "satin", "cloth_id": "train_image/img043.jpg", "occasion": "Party", "age_group": "18-25", "skin_tone": "Light, Medium", "body_shape": "Hourglass, Rectangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "cocktail_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
6abc7099-bae3-4d4b-b7e6-08f3ed8328e7	534e065f-1981-493f-952d-b3f8d919df52	Satin blazer dress with sharp lapels and waist definition for boardroom-to-dinner dressing. Crafted 	blazer-dress-1773156599480-93	Satin blazer dress with sharp lapels and waist definition for boardroom-to-dinner dressing. Crafted in satin with a structured profile and a black palette suited for Formal moments across India. Fits Rectangle, Inverted Triangle bodies, complements Light, Medium skin tones, and is available in sizes S, M, L. Age guidance: 36-50 years.	2843	INR	10	f	20	2026-03-10 15:29:59.481	\N	APPROVED	blazer_dress	f	{"fit": "structured", "score": "0.281", "style": "Minimal Luxury", "fabric": "satin", "cloth_id": "train_image/img044.jpg", "occasion": "Formal", "age_group": "36-50", "skin_tone": "Light, Medium", "body_shape": "Rectangle, Inverted Triangle", "quality_tag": "", "color_family": "black", "clothing_type": "blazer_dress", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
380fc3d3-55a1-44a5-8d24-989745a9f6c5	534e065f-1981-493f-952d-b3f8d919df52	Relaxed chiffon sharara set with light zari work and breezy pants made for mehendi comfort. Crafted 	sharara-set-1773156599484-94	Relaxed chiffon sharara set with light zari work and breezy pants made for mehendi comfort. Crafted in chiffon with a relaxed profile and a jewel palette suited for Wedding moments across India. Fits Pear Shape, Apple Shape, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 18-25 years.	3056	INR	10	f	20	2026-03-10 15:29:59.485	\N	APPROVED	sharara_set	f	{"fit": "relaxed", "score": "0.352", "style": "Traditional Luxury", "fabric": "chiffon", "cloth_id": "train_image/img045.jpg", "occasion": "Wedding", "age_group": "18-25", "skin_tone": "Medium, Dusky", "body_shape": "Pear Shape, Apple Shape, Rectangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "sharara_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
a2f9bbd6-71af-4f0b-8261-399afbc754a7	534e065f-1981-493f-952d-b3f8d919df52	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk wit	kaftan-1773156599489-95	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk with a relaxed profile and a neutral palette suited for Resort moments across India. Fits Apple Shape, Rectangle, Pear Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L. Age guidance: 51+ years.	2417	INR	10	f	20	2026-03-10 15:29:59.49	\N	APPROVED	kaftan	f	{"fit": "relaxed", "score": "0.139", "style": "Minimal Luxury", "fabric": "silk", "cloth_id": "train_image/img046.jpg", "occasion": "Resort", "age_group": "51+", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Rectangle, Pear Shape", "quality_tag": "", "color_family": "neutral", "clothing_type": "kaftan", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
a6cf8d93-1db3-4f37-9e4b-cf7c4c8579e7	534e065f-1981-493f-952d-b3f8d919df52	Velvet evening gown with corseted bodice and sweeping skirt suited for receptions. Crafted in velvet	gown-1773156599494-96	Velvet evening gown with corseted bodice and sweeping skirt suited for receptions. Crafted in velvet with a structured profile and a neutral palette suited for Wedding moments across India. Fits Hourglass, Inverted Triangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL. Age guidance: 36-50 years.	4604	INR	10	f	20	2026-03-10 15:29:59.495	\N	APPROVED	gown	f	{"fit": "structured", "score": "0.868", "style": "Couture", "fabric": "velvet", "cloth_id": "train_image/img047.jpg", "occasion": "Wedding", "age_group": "36-50", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Hourglass, Inverted Triangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "gown", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
d07cdda8-9027-41f0-b3c4-cde9e55418e4	534e065f-1981-493f-952d-b3f8d919df52	Velvet evening gown with corseted bodice and sweeping skirt suited for receptions. Crafted in velvet	gown-1773156599499-97	Velvet evening gown with corseted bodice and sweeping skirt suited for receptions. Crafted in velvet with a structured profile and a black palette suited for Wedding moments across India. Fits Hourglass, Inverted Triangle bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL. Age guidance: 26-35 years.	4583	INR	10	f	20	2026-03-10 15:29:59.5	\N	APPROVED	gown	f	{"fit": "structured", "score": "0.861", "style": "Couture", "fabric": "velvet", "cloth_id": "train_image/img048.jpg", "occasion": "Wedding", "age_group": "26-35", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Hourglass, Inverted Triangle", "quality_tag": "", "color_family": "black", "clothing_type": "gown", "recommended_size": "M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
ff30eebb-1a33-4030-bf13-58f2ca2431b1	534e065f-1981-493f-952d-b3f8d919df52	Structured silk lehenga set with a supportive blouse and ample flare suited to sangeet and pheras. C	lehenga-set-1773156599503-98	Structured silk lehenga set with a supportive blouse and ample flare suited to sangeet and pheras. Crafted in silk with a structured profile and a pastel palette suited for Wedding moments across India. Fits Hourglass, Pear Shape bodies, complements Medium, Dusky, Deep skin tones, and is available in sizes M, L, XL, XXL. Age guidance: 36-50 years.	4565	INR	10	f	20	2026-03-10 15:29:59.504	\N	APPROVED	lehenga_set	f	{"fit": "structured", "score": "0.855", "style": "Traditional Luxury", "fabric": "silk", "cloth_id": "train_image/img049.jpg", "occasion": "Wedding", "age_group": "36-50", "skin_tone": "Medium, Dusky, Deep", "body_shape": "Hourglass, Pear Shape", "quality_tag": "", "color_family": "pastel", "clothing_type": "lehenga_set", "recommended_size": "M, L, XL, XXL"}	{}	{}	{}	{}	{}	\N	\N	10
9f6d74bc-8537-4ce3-b5ff-2dfc9e8b98d0	534e065f-1981-493f-952d-b3f8d919df52	Structured satin fusion gown with modern drape lines tailored for Indian cocktail nights. Crafted in	fusion-gown-1773156599508-99	Structured satin fusion gown with modern drape lines tailored for Indian cocktail nights. Crafted in satin with a structured profile and a metallic palette suited for Party moments across India. Fits Inverted Triangle, Rectangle bodies, complements Medium, Dusky skin tones, and is available in sizes S, M, L. Age guidance: 13-17 years.	4004	INR	10	f	20	2026-03-10 15:29:59.509	\N	APPROVED	fusion_gown	f	{"fit": "structured", "score": "0.668", "style": "Couture", "fabric": "satin", "cloth_id": "train_image/img050.jpg", "occasion": "Party", "age_group": "13-17", "skin_tone": "Medium, Dusky", "body_shape": "Inverted Triangle, Rectangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "fusion_gown", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
e0392e06-cac8-4b2a-ad88-69f34ab6312f	534e065f-1981-493f-952d-b3f8d919df52	A vibrant red satin mini dress with a softly structured bodice and flared hemline that adds volume t	mini-dress-1773156599513-100	A vibrant red satin mini dress with a softly structured bodice and flared hemline that adds volume to a straight silhouette, paired with subtle shimmer heels to create a youthful and energetic party look that feels confident yet playful. Tailored with a flowing fit in satin fabric and a metallic palette for Party occasions. Fits Rectangle shapes, complements Light skin tones, and comes in sizes S. Age guidance: 18-25 years.	3305	INR	10	f	20	2026-03-10 15:29:59.514	\N	APPROVED	mini_dress	f	{"fit": "flowing", "score": "0.435", "style": "Elegant", "fabric": "satin", "cloth_id": "train_image/1.png", "occasion": "Party", "age_group": "18-25", "skin_tone": "Light", "body_shape": "Rectangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "mini_dress", "recommended_size": "S"}	{}	{}	{}	{}	{}	\N	\N	10
775cf689-142d-42cd-b6a7-5c0aceaf8c7f	534e065f-1981-493f-952d-b3f8d919df52	An emerald green evening gown crafted in smooth satin with a fitted upper body and a flowing A-line 	gown-1773156599518-101	An emerald green evening gown crafted in smooth satin with a fitted upper body and a flowing A-line skirt that balances wider hips beautifully, creating a flattering and elegant presence ideal for upscale celebrations. Tailored with a flowing fit in satin fabric and a jewel palette for Party occasions. Fits Pear Shape shapes, complements Medium skin tones, and comes in sizes M. Age guidance: 26-35 years.	3443	INR	10	f	20	2026-03-10 15:29:59.519	\N	APPROVED	gown	f	{"fit": "flowing", "score": "0.481", "style": "Elegant", "fabric": "satin", "cloth_id": "train_image/2.png", "occasion": "Party", "age_group": "26-35", "skin_tone": "Medium", "body_shape": "Pear Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "gown", "recommended_size": "M"}	{}	{}	{}	{}	{}	\N	\N	10
0b876a2d-e30c-445b-b6e9-8ebaf019680f	534e065f-1981-493f-952d-b3f8d919df52	A navy blue tailored blazer dress with clean vertical lines and a softly cinched waist that adds def	blazer-dress-1773156599523-102	A navy blue tailored blazer dress with clean vertical lines and a softly cinched waist that adds definition while maintaining comfort, offering a polished and authoritative style perfect for formal business dinners. Tailored with a structured fit in silk fabric and a jewel palette for Formal occasions. Fits Apple Shape shapes, complements Dusky skin tones, and comes in sizes L. Age guidance: 26-35 years.	3365	INR	10	f	20	2026-03-10 15:29:59.524	\N	APPROVED	blazer_dress	f	{"fit": "structured", "score": "0.455", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/3.png", "occasion": "Formal", "age_group": "26-35", "skin_tone": "Dusky", "body_shape": "Apple Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "blazer_dress", "recommended_size": "L"}	{}	{}	{}	{}	{}	\N	\N	10
3f1dc4de-3f1f-41a0-8eb3-c637d1a4e8f8	534e065f-1981-493f-952d-b3f8d919df52	A classic black bodycon dress featuring a sweetheart neckline and subtle side slit that highlights n	bodycon-dress-1773156599527-103	A classic black bodycon dress featuring a sweetheart neckline and subtle side slit that highlights natural curves gracefully, styled with minimal accessories for a timeless and confident party-ready appearance. Tailored with a slim fit in silk fabric and a black palette for Party occasions. Fits Hourglass shapes, complements Light skin tones, and comes in sizes M. Age guidance: 26-35 years.	3191	INR	10	f	20	2026-03-10 15:29:59.528	\N	APPROVED	bodycon_dress	f	{"fit": "slim", "score": "0.397", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/4.png", "occasion": "Party", "age_group": "26-35", "skin_tone": "Light", "body_shape": "Hourglass", "quality_tag": "", "color_family": "black", "clothing_type": "bodycon_dress", "recommended_size": "M"}	{}	{}	{}	{}	{}	\N	\N	10
c13d4dc1-edf7-4cad-a72c-ccea16013b2a	534e065f-1981-493f-952d-b3f8d919df52	A soft blush wrap dress with delicate pleats around the waist that accentuates the upper body while 	dress-1773156599537-105	A soft blush wrap dress with delicate pleats around the waist that accentuates the upper body while allowing the skirt to flow gently over the hips, creating a feminine and airy brunch-ready look. Tailored with a relaxed fit in silk fabric and a neutral palette for Casual luxury occasions. Fits Pear Shape shapes, complements Light skin tones, and comes in sizes M. Age guidance: 18-25 years.	2630	INR	10	f	20	2026-03-10 15:29:59.538	\N	APPROVED	dress	f	{"fit": "relaxed", "score": "0.21", "style": "Minimal Luxury", "fabric": "silk", "cloth_id": "train_image/6.png", "occasion": "Casual luxury", "age_group": "18-25", "skin_tone": "Light", "body_shape": "Pear Shape", "quality_tag": "", "color_family": "neutral", "clothing_type": "dress", "recommended_size": "M"}	{}	{}	{}	{}	{}	\N	\N	10
c638c368-dcc5-454b-8bdf-4f16be5aa44f	534e065f-1981-493f-952d-b3f8d919df52	A charcoal grey power suit with a longline blazer and straight-leg trousers that elongate the frame 	dress-1773156599542-106	A charcoal grey power suit with a longline blazer and straight-leg trousers that elongate the frame and create a streamlined silhouette, offering both confidence and comfort for professional evening events. Tailored with a structured fit in silk fabric and a neutral palette for Formal occasions. Fits Apple Shape shapes, complements Deep skin tones, and comes in sizes L. Age guidance: 36-50 years.	3152	INR	10	f	20	2026-03-10 15:29:59.543	\N	APPROVED	dress	f	{"fit": "structured", "score": "0.384", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/7.png", "occasion": "Formal", "age_group": "36-50", "skin_tone": "Deep", "body_shape": "Apple Shape", "quality_tag": "", "color_family": "neutral", "clothing_type": "dress", "recommended_size": "L"}	{}	{}	{}	{}	{}	\N	\N	10
5bd196fa-ed0d-4f92-95ca-6c769159e210	534e065f-1981-493f-952d-b3f8d919df52	A shimmering gold sequin mini dress designed with a tailored waist and soft stretch fabric that hugs	mini-dress-1773156599547-107	A shimmering gold sequin mini dress designed with a tailored waist and soft stretch fabric that hugs natural curves effortlessly, making it a bold yet tasteful choice for glamorous night parties. Tailored with a structured fit in silk fabric and a metallic palette for Party occasions. Fits Hourglass shapes, complements Medium skin tones, and comes in sizes M. Age guidance: 26-35 years.	3983	INR	10	f	20	2026-03-10 15:29:59.548	\N	APPROVED	mini_dress	f	{"fit": "structured", "score": "0.661", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/8.png", "occasion": "Party", "age_group": "26-35", "skin_tone": "Medium", "body_shape": "Hourglass", "quality_tag": "", "color_family": "metallic", "clothing_type": "mini_dress", "recommended_size": "M"}	{}	{}	{}	{}	{}	\N	\N	10
342c9cf8-1581-4d92-a8f1-5bbe1ba3bf44	534e065f-1981-493f-952d-b3f8d919df52	An ivory kurta set paired with straight-fit pants and subtle thread embroidery that adds texture wit	kurta-set-1773156599552-108	An ivory kurta set paired with straight-fit pants and subtle thread embroidery that adds texture without bulk, creating a graceful and dignified outfit for formal daytime occasions. Tailored with a structured fit in silk fabric and a jewel palette for Formal occasions. Fits Rectangle shapes, complements Dusky skin tones, and comes in sizes L. Age guidance: 36-50 years.	3131	INR	10	f	20	2026-03-10 15:29:59.553	\N	APPROVED	kurta_set	f	{"fit": "structured", "score": "0.377", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/9.png", "occasion": "Formal", "age_group": "36-50", "skin_tone": "Dusky", "body_shape": "Rectangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "kurta_set", "recommended_size": "L"}	{}	{}	{}	{}	{}	\N	\N	10
e0c9345d-7269-430e-a045-0aa4836f9cf4	534e065f-1981-493f-952d-b3f8d919df52	A sky-blue off-shoulder skater dress with a fitted bodice and flared skirt that highlights the waist	dress-1773156599556-109	A sky-blue off-shoulder skater dress with a fitted bodice and flared skirt that highlights the waist and balances wider hips, giving a fun, youthful, and charming party appearance. Tailored with a flowing fit in silk fabric and a jewel palette for Party occasions. Fits Pear Shape shapes, complements Light skin tones, and comes in sizes S. Age guidance: 18-25 years.	3731	INR	10	f	20	2026-03-10 15:29:59.557	\N	APPROVED	dress	f	{"fit": "flowing", "score": "0.577", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/10.png", "occasion": "Party", "age_group": "18-25", "skin_tone": "Light", "body_shape": "Pear Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "dress", "recommended_size": "S"}	{}	{}	{}	{}	{}	\N	\N	10
52419c5f-8b55-4bf1-92f0-0ae388893aee	534e065f-1981-493f-952d-b3f8d919df52	A maroon sheath dress with a knee-length hem and clean neckline that offers a refined silhouette, pa	shift-dress-1773156599561-110	A maroon sheath dress with a knee-length hem and clean neckline that offers a refined silhouette, paired with classic pumps to deliver an elegant and composed look for formal gatherings. Tailored with a slim fit in silk fabric and a jewel palette for Formal occasions. Fits Hourglass shapes, complements Medium skin tones, and comes in sizes M. Age guidance: 26-35 years.	3248	INR	10	f	20	2026-03-10 15:29:59.562	\N	APPROVED	shift_dress	f	{"fit": "slim", "score": "0.416", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/img_011.jpg", "occasion": "Formal", "age_group": "26-35", "skin_tone": "Medium", "body_shape": "Hourglass", "quality_tag": "", "color_family": "jewel", "clothing_type": "shift_dress", "recommended_size": "M"}	{}	{}	{}	{}	{}	\N	\N	10
4b64ded4-ca55-4293-950f-7ac2d70f6a84	534e065f-1981-493f-952d-b3f8d919df52	A flowy maxi dress featuring an empire waist and soft abstract prints that draw attention upward whi	dress-1773156599566-111	A flowy maxi dress featuring an empire waist and soft abstract prints that draw attention upward while allowing ease around the midsection, creating a relaxed yet stylish weekend outfit. Tailored with a flowing fit in silk fabric and a neutral palette for Casual luxury occasions. Fits Apple Shape shapes, complements Medium skin tones, and comes in sizes L. Age guidance: 26-35 years.	2396	INR	10	f	20	2026-03-10 15:29:59.567	\N	APPROVED	dress	f	{"fit": "flowing", "score": "0.132", "style": "Minimal Luxury", "fabric": "silk", "cloth_id": "train_image/img_012.jpg", "occasion": "Casual luxury", "age_group": "26-35", "skin_tone": "Medium", "body_shape": "Apple Shape", "quality_tag": "", "color_family": "neutral", "clothing_type": "dress", "recommended_size": "L"}	{}	{}	{}	{}	{}	\N	\N	10
0fad2030-5fa4-4579-bf55-68fe5a56b2d6	534e065f-1981-493f-952d-b3f8d919df52	A crisp white linen jumpsuit with a belted waist and wide-leg cut that adds structure and volume to 	jumpsuit-1773156599570-112	A crisp white linen jumpsuit with a belted waist and wide-leg cut that adds structure and volume to a straight body frame, delivering a modern and effortlessly chic daytime style. Tailored with a relaxed fit in linen fabric and a neutral palette for Casual luxury occasions. Fits Rectangle shapes, complements Light skin tones, and comes in sizes S. Age guidance: 18-25 years.	2570	INR	10	f	20	2026-03-10 15:29:59.571	\N	APPROVED	jumpsuit	f	{"fit": "relaxed", "score": "0.19", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img_013.jpg", "occasion": "Casual luxury", "age_group": "18-25", "skin_tone": "Light", "body_shape": "Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "jumpsuit", "recommended_size": "S"}	{}	{}	{}	{}	{}	\N	\N	10
ffa56df7-2122-4daa-a037-08461e10e9f3	534e065f-1981-493f-952d-b3f8d919df52	A deep teal saree paired with a structured blouse that emphasizes the shoulders and neckline, allowi	saree-1773156599575-113	A deep teal saree paired with a structured blouse that emphasizes the shoulders and neckline, allowing the drape to fall gracefully over the hips for a poised and confident formal look. Tailored with a structured fit in silk fabric and a jewel palette for Formal occasions. Fits Pear Shape shapes, complements Dusky skin tones, and comes in sizes M. Age guidance: 26-35 years.	3344	INR	10	f	20	2026-03-10 15:29:59.576	\N	APPROVED	saree	f	{"fit": "structured", "score": "0.448", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/img_014.jpg", "occasion": "Formal", "age_group": "26-35", "skin_tone": "Dusky", "body_shape": "Pear Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "saree", "recommended_size": "M"}	{}	{}	{}	{}	{}	\N	\N	10
08358d11-6602-488d-9aa9-c3adadf36755	534e065f-1981-493f-952d-b3f8d919df52	A rich wine-colored velvet gown with long sleeves and a defined waist that highlights curves beautif	gown-1773156599580-114	A rich wine-colored velvet gown with long sleeves and a defined waist that highlights curves beautifully, offering a luxurious and dramatic appearance for high-profile evening events. Tailored with a slim fit in velvet fabric and a jewel palette for Party occasions. Fits Hourglass shapes, complements Deep skin tones, and comes in sizes L. Age guidance: 36-50 years.	3887	INR	10	f	20	2026-03-10 15:29:59.581	\N	APPROVED	gown	f	{"fit": "slim", "score": "0.629", "style": "Elegant", "fabric": "velvet", "cloth_id": "train_image/img_015.jpg", "occasion": "Party", "age_group": "36-50", "skin_tone": "Deep", "body_shape": "Hourglass", "quality_tag": "", "color_family": "jewel", "clothing_type": "gown", "recommended_size": "L"}	{}	{}	{}	{}	{}	\N	\N	10
b0248722-401d-468e-80fd-e53dcfe62f1b	534e065f-1981-493f-952d-b3f8d919df52	A sunshine-yellow fit-and-flare dress made from soft georgette that adds movement and shape to a str	dress-1773156599585-115	A sunshine-yellow fit-and-flare dress made from soft georgette that adds movement and shape to a straight silhouette, creating a cheerful and vibrant party-ready outfit. Tailored with a flowing fit in chiffon fabric and a neutral palette for Party occasions. Fits Rectangle shapes, complements Medium skin tones, and comes in sizes S. Age guidance: 18-25 years.	2591	INR	10	f	20	2026-03-10 15:29:59.586	\N	APPROVED	dress	f	{"fit": "flowing", "score": "0.197", "style": "Elegant", "fabric": "chiffon", "cloth_id": "train_image/img_016.jpg", "occasion": "Party", "age_group": "18-25", "skin_tone": "Medium", "body_shape": "Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "dress", "recommended_size": "S"}	{}	{}	{}	{}	{}	\N	\N	10
2c56be55-c7c6-4900-856a-5f637653a18e	534e065f-1981-493f-952d-b3f8d919df52	A grey midi dress with a softly cinched waist and gentle pleats that balance proportions and deliver	dress-1773156599590-116	A grey midi dress with a softly cinched waist and gentle pleats that balance proportions and deliver a professional yet approachable look for office formals. Tailored with a structured fit in silk fabric and a neutral palette for Formal occasions. Fits Pear Shape shapes, complements Light skin tones, and comes in sizes M. Age guidance: 26-35 years.	3383	INR	10	f	20	2026-03-10 15:29:59.591	\N	APPROVED	dress	f	{"fit": "structured", "score": "0.461", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/img_017.jpg", "occasion": "Formal", "age_group": "26-35", "skin_tone": "Light", "body_shape": "Pear Shape", "quality_tag": "", "color_family": "neutral", "clothing_type": "dress", "recommended_size": "M"}	{}	{}	{}	{}	{}	\N	\N	10
67c67234-cdaf-402d-91f0-36ad1ff9d121	534e065f-1981-493f-952d-b3f8d919df52	A royal blue off-shoulder gown with a flowing hemline and subtle shimmer that enhances natural curve	gown-1773156599601-118	A royal blue off-shoulder gown with a flowing hemline and subtle shimmer that enhances natural curves and creates a striking, confident presence at evening parties. Tailored with a flowing fit in silk fabric and a metallic palette for Party occasions. Fits Hourglass shapes, complements Medium skin tones, and comes in sizes M. Age guidance: 36-50 years.	3287	INR	10	f	20	2026-03-10 15:29:59.602	\N	APPROVED	gown	f	{"fit": "flowing", "score": "0.429", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/img_019.jpg", "occasion": "Party", "age_group": "36-50", "skin_tone": "Medium", "body_shape": "Hourglass", "quality_tag": "", "color_family": "metallic", "clothing_type": "gown", "recommended_size": "M"}	{}	{}	{}	{}	{}	\N	\N	10
24b531ce-66d5-472f-9a7b-bf06b37b0367	534e065f-1981-493f-952d-b3f8d919df52	A beige blazer dress with sharp tailoring and minimal detailing that adds structure and polish, maki	blazer-dress-1773156599606-119	A beige blazer dress with sharp tailoring and minimal detailing that adds structure and polish, making it ideal for modern professional settings. Tailored with a structured fit in silk fabric and a neutral palette for Formal occasions. Fits Rectangle shapes, complements Light skin tones, and comes in sizes S. Age guidance: 26-35 years.	3404	INR	10	f	20	2026-03-10 15:29:59.607	\N	APPROVED	blazer_dress	f	{"fit": "structured", "score": "0.468", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/img_020.jpg", "occasion": "Formal", "age_group": "26-35", "skin_tone": "Light", "body_shape": "Rectangle", "quality_tag": "", "color_family": "neutral", "clothing_type": "blazer_dress", "recommended_size": "S"}	{}	{}	{}	{}	{}	\N	\N	10
574165f3-f4d4-4572-bc08-9fc4a59d6d85	534e065f-1981-493f-952d-b3f8d919df52	Good quality party outfit for Indian female in age group 18-25.	cocktail-dress-1773156599662-131	Good quality party outfit for Indian female in age group 18-25.	4700	INR	10	f	20	2026-03-10 15:29:59.663	\N	APPROVED	Cocktail dress	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_007", "occasion": "Party", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
ce9647c2-5673-49be-995f-9a5b80e5d751	534e065f-1981-493f-952d-b3f8d919df52	A dark green anarkali suit adorned with subtle gold accents that flows smoothly from the shoulders, 	anarkali-1773156599615-121	A dark green anarkali suit adorned with subtle gold accents that flows smoothly from the shoulders, offering elegance and comfort for formal cultural events. Tailored with a structured fit in silk fabric and a metallic palette for Formal occasions. Fits Apple Shape shapes, complements Deep skin tones, and comes in sizes L. Age guidance: 36-50 years.	3095	INR	10	f	20	2026-03-10 15:29:59.616	\N	APPROVED	anarkali	f	{"fit": "structured", "score": "0.365", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/img_022.jpg", "occasion": "Formal", "age_group": "36-50", "skin_tone": "Deep", "body_shape": "Apple Shape", "quality_tag": "", "color_family": "metallic", "clothing_type": "anarkali", "recommended_size": "L"}	{}	{}	{}	{}	{}	\N	\N	10
90c32a83-cb68-4f71-a36c-28ed6c1d95f6	534e065f-1981-493f-952d-b3f8d919df52	A silver shimmer dress with a sleek fitted cut and delicate straps that enhances curves and brings a	dress-1773156599621-122	A silver shimmer dress with a sleek fitted cut and delicate straps that enhances curves and brings a bold yet elegant statement to youthful party fashion. Tailored with a slim fit in silk fabric and a metallic palette for Party occasions. Fits Hourglass shapes, complements Light skin tones, and comes in sizes S. Age guidance: 18-25 years.	3809	INR	10	f	20	2026-03-10 15:29:59.622	\N	APPROVED	dress	f	{"fit": "slim", "score": "0.603", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/img_023.jpg", "occasion": "Party", "age_group": "18-25", "skin_tone": "Light", "body_shape": "Hourglass", "quality_tag": "", "color_family": "metallic", "clothing_type": "dress", "recommended_size": "S"}	{}	{}	{}	{}	{}	\N	\N	10
34e2cdff-f1ad-4860-a5f8-8978519fb57d	534e065f-1981-493f-952d-b3f8d919df52	A powder-blue straight-fit kurti paired with cigarette pants that introduces gentle structure and cl	dress-1773156599625-123	A powder-blue straight-fit kurti paired with cigarette pants that introduces gentle structure and clean lines, perfect for neat and composed professional wear. Tailored with a structured fit in silk fabric and a jewel palette for Formal occasions. Fits Rectangle shapes, complements Medium skin tones, and comes in sizes M. Age guidance: 26-35 years.	3326	INR	10	f	20	2026-03-10 15:29:59.626	\N	APPROVED	dress	f	{"fit": "structured", "score": "0.442", "style": "Elegant", "fabric": "silk", "cloth_id": "train_image/img_024.jpg", "occasion": "Formal", "age_group": "26-35", "skin_tone": "Medium", "body_shape": "Rectangle", "quality_tag": "", "color_family": "jewel", "clothing_type": "dress", "recommended_size": "M"}	{}	{}	{}	{}	{}	\N	\N	10
683e95cd-b436-4af1-9bd6-e22184495f13	534e065f-1981-493f-952d-b3f8d919df52	A soft cotton saree in pastel shades that drapes effortlessly and highlights natural grace, offering	saree-1773156599630-124	A soft cotton saree in pastel shades that drapes effortlessly and highlights natural grace, offering a calm and elegant daytime style. Tailored with a relaxed fit in linen fabric and a pastel palette for Casual luxury occasions. Fits Pear Shape shapes, complements Dusky skin tones, and comes in sizes L. Age guidance: 36-50 years.	2300	INR	10	f	20	2026-03-10 15:29:59.631	\N	APPROVED	saree	f	{"fit": "relaxed", "score": "0.1", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/img_025.jpg", "occasion": "Casual luxury", "age_group": "36-50", "skin_tone": "Dusky", "body_shape": "Pear Shape", "quality_tag": "", "color_family": "pastel", "clothing_type": "saree", "recommended_size": "L"}	{}	{}	{}	{}	{}	\N	\N	10
00b32d01-913b-41b1-97da-b49fd47e1f16	534e065f-1981-493f-952d-b3f8d919df52	Good quality formal outfit for Indian female in age group 13-17.	blazer-set-1773156599635-125	Good quality formal outfit for Indian female in age group 13-17.	4700	INR	10	f	20	2026-03-10 15:29:59.636	\N	APPROVED	Blazer set	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_001", "occasion": "Formal", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
1a7c0b33-e5b5-4526-bcc0-6c73002d1ca5	534e065f-1981-493f-952d-b3f8d919df52	Good quality formal outfit for Indian female in age group 18-25.	blazer-set-1773156599639-126	Good quality formal outfit for Indian female in age group 18-25.	4700	INR	10	f	20	2026-03-10 15:29:59.64	\N	APPROVED	Blazer set	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_002", "occasion": "Formal", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
b86e3985-b194-467e-ab4f-c7eab436bd4c	534e065f-1981-493f-952d-b3f8d919df52	Good quality formal outfit for Indian female in age group 26-35.	blazer-set-1773156599643-127	Good quality formal outfit for Indian female in age group 26-35.	4700	INR	10	f	20	2026-03-10 15:29:59.644	\N	APPROVED	Blazer set	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_003", "occasion": "Formal", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
e6f79164-278a-434e-9716-8308441f257b	534e065f-1981-493f-952d-b3f8d919df52	Good quality formal outfit for Indian female in age group 36-50.	blazer-set-1773156599648-128	Good quality formal outfit for Indian female in age group 36-50.	4700	INR	10	f	20	2026-03-10 15:29:59.649	\N	APPROVED	Blazer set	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_004", "occasion": "Formal", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
34d4cdd8-1d65-4ac0-8f92-4955eb675ed8	534e065f-1981-493f-952d-b3f8d919df52	Good quality formal outfit for Indian female in age group 51+.	blazer-set-1773156599653-129	Good quality formal outfit for Indian female in age group 51+.	4700	INR	10	f	20	2026-03-10 15:29:59.654	\N	APPROVED	Blazer set	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_005", "occasion": "Formal", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
3234362f-1a88-4a01-920e-3d3bc8b606bd	534e065f-1981-493f-952d-b3f8d919df52	Good quality party outfit for Indian female in age group 26-35.	cocktail-dress-1773156599667-132	Good quality party outfit for Indian female in age group 26-35.	4700	INR	10	f	20	2026-03-10 15:29:59.667	\N	APPROVED	Cocktail dress	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_008", "occasion": "Party", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
50f6c225-6d44-49b2-a48a-8a75ad3d2788	534e065f-1981-493f-952d-b3f8d919df52	Good quality party outfit for Indian female in age group 36-50.	cocktail-dress-1773156599671-133	Good quality party outfit for Indian female in age group 36-50.	4700	INR	10	f	20	2026-03-10 15:29:59.672	\N	APPROVED	Cocktail dress	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_009", "occasion": "Party", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
04d8d4c8-263f-479d-9bf9-cb6747e61fb3	534e065f-1981-493f-952d-b3f8d919df52	Good quality party outfit for Indian female in age group 51+.	cocktail-dress-1773156599676-134	Good quality party outfit for Indian female in age group 51+.	4700	INR	10	f	20	2026-03-10 15:29:59.677	\N	APPROVED	Cocktail dress	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_010", "occasion": "Party", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
21f96412-b647-4c20-84be-770c2a3854d1	534e065f-1981-493f-952d-b3f8d919df52	Good quality wedding outfit for Indian female in age group 13-17.	silk-saree-1773156599680-135	Good quality wedding outfit for Indian female in age group 13-17.	4700	INR	10	f	20	2026-03-10 15:29:59.681	\N	APPROVED	Silk saree	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Silk", "cloth_id": "imgA_011", "occasion": "Wedding", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
8a3b4dab-dcd0-477c-9c24-e5218c548155	534e065f-1981-493f-952d-b3f8d919df52	Good quality wedding outfit for Indian female in age group 18-25.	silk-saree-1773156599685-136	Good quality wedding outfit for Indian female in age group 18-25.	4700	INR	10	f	20	2026-03-10 15:29:59.686	\N	APPROVED	Silk saree	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Silk", "cloth_id": "imgA_012", "occasion": "Wedding", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
768ed5ee-454f-4e4c-9a97-87270baa9c7c	534e065f-1981-493f-952d-b3f8d919df52	Good quality wedding outfit for Indian female in age group 26-35.	silk-saree-1773156599690-137	Good quality wedding outfit for Indian female in age group 26-35.	4700	INR	10	f	20	2026-03-10 15:29:59.691	\N	APPROVED	Silk saree	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Silk", "cloth_id": "imgA_013", "occasion": "Wedding", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
94b3a1ec-dbd3-48d1-a89e-9c3be9afa18e	534e065f-1981-493f-952d-b3f8d919df52	Good quality wedding outfit for Indian female in age group 36-50.	silk-saree-1773156599695-138	Good quality wedding outfit for Indian female in age group 36-50.	4700	INR	10	f	20	2026-03-10 15:29:59.696	\N	APPROVED	Silk saree	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Silk", "cloth_id": "imgA_014", "occasion": "Wedding", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
b3044c9e-d7f9-4600-b431-96b5de1439f7	534e065f-1981-493f-952d-b3f8d919df52	Good quality wedding outfit for Indian female in age group 51+.	silk-saree-1773156599700-139	Good quality wedding outfit for Indian female in age group 51+.	4700	INR	10	f	20	2026-03-10 15:29:59.7	\N	APPROVED	Silk saree	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Silk", "cloth_id": "imgA_015", "occasion": "Wedding", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
f38c0f5b-9736-4661-a28b-ecd7ef43a21a	534e065f-1981-493f-952d-b3f8d919df52	Good quality casual luxury outfit for Indian female in age group 13-17.	co-ord-set-1773156599705-140	Good quality casual luxury outfit for Indian female in age group 13-17.	4700	INR	10	f	20	2026-03-10 15:29:59.706	\N	APPROVED	Co-ord set	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_016", "occasion": "Casual Luxury", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
1794ede0-00ae-4cf1-b132-b23d1a87dc30	534e065f-1981-493f-952d-b3f8d919df52	Good quality casual luxury outfit for Indian female in age group 18-25.	co-ord-set-1773156599709-141	Good quality casual luxury outfit for Indian female in age group 18-25.	4700	INR	10	f	20	2026-03-10 15:29:59.71	\N	APPROVED	Co-ord set	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_017", "occasion": "Casual Luxury", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
e2135a13-1192-49a1-88eb-1d37b5837e77	534e065f-1981-493f-952d-b3f8d919df52	Good quality casual luxury outfit for Indian female in age group 26-35.	co-ord-set-1773156599714-142	Good quality casual luxury outfit for Indian female in age group 26-35.	4700	INR	10	f	20	2026-03-10 15:29:59.715	\N	APPROVED	Co-ord set	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_018", "occasion": "Casual Luxury", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
f6163764-be41-4dd6-b03c-3b1757537fd5	534e065f-1981-493f-952d-b3f8d919df52	Good quality casual luxury outfit for Indian female in age group 36-50.	co-ord-set-1773156599719-143	Good quality casual luxury outfit for Indian female in age group 36-50.	4700	INR	10	f	20	2026-03-10 15:29:59.72	\N	APPROVED	Co-ord set	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_019", "occasion": "Casual Luxury", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
80b91191-1c8f-4636-aff1-abb21d1aa9ed	534e065f-1981-493f-952d-b3f8d919df52	Good quality casual luxury outfit for Indian female in age group 51+.	co-ord-set-1773156599724-144	Good quality casual luxury outfit for Indian female in age group 51+.	4700	INR	10	f	20	2026-03-10 15:29:59.725	\N	APPROVED	Co-ord set	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Cotton blend", "cloth_id": "imgA_020", "occasion": "Casual Luxury", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
688b9eec-aca4-41d2-b851-ac90f3ec10b6	534e065f-1981-493f-952d-b3f8d919df52	Good quality resort outfit for Indian female in age group 13-17.	maxi-dress-1773156599729-145	Good quality resort outfit for Indian female in age group 13-17.	4700	INR	10	f	20	2026-03-10 15:29:59.729	\N	APPROVED	Maxi dress	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Chiffon", "cloth_id": "imgA_021", "occasion": "Resort", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
f6295da0-7bfd-415f-a3b4-80e970e83917	534e065f-1981-493f-952d-b3f8d919df52	Good quality resort outfit for Indian female in age group 18-25.	maxi-dress-1773156599733-146	Good quality resort outfit for Indian female in age group 18-25.	4700	INR	10	f	20	2026-03-10 15:29:59.734	\N	APPROVED	Maxi dress	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Chiffon", "cloth_id": "imgA_022", "occasion": "Resort", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
404fd6f1-0230-4f79-a12e-dc45cae2c345	534e065f-1981-493f-952d-b3f8d919df52	Good quality resort outfit for Indian female in age group 26-35.	maxi-dress-1773156599737-147	Good quality resort outfit for Indian female in age group 26-35.	4700	INR	10	f	20	2026-03-10 15:29:59.738	\N	APPROVED	Maxi dress	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Chiffon", "cloth_id": "imgA_023", "occasion": "Resort", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
9ac7bce6-cefb-415c-83a6-d342b1e15e6f	534e065f-1981-493f-952d-b3f8d919df52	Good quality resort outfit for Indian female in age group 36-50.	maxi-dress-1773156599742-148	Good quality resort outfit for Indian female in age group 36-50.	4700	INR	10	f	20	2026-03-10 15:29:59.743	\N	APPROVED	Maxi dress	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Chiffon", "cloth_id": "imgA_024", "occasion": "Resort", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
4cfd6be6-223c-4cfc-9cb9-672420f91651	534e065f-1981-493f-952d-b3f8d919df52	Good quality resort outfit for Indian female in age group 51+.	maxi-dress-1773156599746-149	Good quality resort outfit for Indian female in age group 51+.	4700	INR	10	f	20	2026-03-10 15:29:59.747	\N	APPROVED	Maxi dress	f	{"fit": "Flattering", "score": "0.9", "style": "Elegant", "fabric": "Chiffon", "cloth_id": "imgA_025", "occasion": "Resort", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "good", "color_family": "Pastel", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
aee8c24b-5c5c-4937-ab0d-2f6ee5fd1a83	534e065f-1981-493f-952d-b3f8d919df52	Okay quality formal outfit for Indian female in age group 13-17.	blazer-set-1773156599750-150	Okay quality formal outfit for Indian female in age group 13-17.	3800	INR	10	f	20	2026-03-10 15:29:59.751	\N	APPROVED	Blazer set	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_026", "occasion": "Formal", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
d9a30be6-508e-42f2-95e9-8dd2da8ff004	534e065f-1981-493f-952d-b3f8d919df52	Okay quality formal outfit for Indian female in age group 18-25.	blazer-set-1773156599755-151	Okay quality formal outfit for Indian female in age group 18-25.	3800	INR	10	f	20	2026-03-10 15:29:59.756	\N	APPROVED	Blazer set	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_027", "occasion": "Formal", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
4f72f54c-43cb-472e-84b1-293bc9e1e926	534e065f-1981-493f-952d-b3f8d919df52	Okay quality formal outfit for Indian female in age group 26-35.	blazer-set-1773156599759-152	Okay quality formal outfit for Indian female in age group 26-35.	3800	INR	10	f	20	2026-03-10 15:29:59.76	\N	APPROVED	Blazer set	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_028", "occasion": "Formal", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
e7528e83-9976-415a-a424-8c0d7f9e0a2a	534e065f-1981-493f-952d-b3f8d919df52	Okay quality formal outfit for Indian female in age group 36-50.	blazer-set-1773156599764-153	Okay quality formal outfit for Indian female in age group 36-50.	3800	INR	10	f	20	2026-03-10 15:29:59.765	\N	APPROVED	Blazer set	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_029", "occasion": "Formal", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
350854e1-38d8-4975-b50c-2162a9f3a1a8	534e065f-1981-493f-952d-b3f8d919df52	Okay quality formal outfit for Indian female in age group 51+.	blazer-set-1773156599768-154	Okay quality formal outfit for Indian female in age group 51+.	3800	INR	10	f	20	2026-03-10 15:29:59.769	\N	APPROVED	Blazer set	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_030", "occasion": "Formal", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
8b8cb0b5-9ceb-4d8e-96de-7ca53f3d3385	534e065f-1981-493f-952d-b3f8d919df52	Okay quality party outfit for Indian female in age group 13-17.	cocktail-dress-1773156599772-155	Okay quality party outfit for Indian female in age group 13-17.	3800	INR	10	f	20	2026-03-10 15:29:59.773	\N	APPROVED	Cocktail dress	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_031", "occasion": "Party", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
7299dbb0-5a23-4c6b-85a1-c4fbb6272394	534e065f-1981-493f-952d-b3f8d919df52	Okay quality party outfit for Indian female in age group 18-25.	cocktail-dress-1773156599776-156	Okay quality party outfit for Indian female in age group 18-25.	3800	INR	10	f	20	2026-03-10 15:29:59.777	\N	APPROVED	Cocktail dress	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_032", "occasion": "Party", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
d35b0ca5-254b-413e-bf71-4e689f8f895b	534e065f-1981-493f-952d-b3f8d919df52	Okay quality party outfit for Indian female in age group 26-35.	cocktail-dress-1773156599781-157	Okay quality party outfit for Indian female in age group 26-35.	3800	INR	10	f	20	2026-03-10 15:29:59.782	\N	APPROVED	Cocktail dress	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_033", "occasion": "Party", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
520f7591-490d-458f-9aa3-77588a70d063	534e065f-1981-493f-952d-b3f8d919df52	Okay quality party outfit for Indian female in age group 36-50.	cocktail-dress-1773156599785-158	Okay quality party outfit for Indian female in age group 36-50.	3800	INR	10	f	20	2026-03-10 15:29:59.786	\N	APPROVED	Cocktail dress	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_034", "occasion": "Party", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
a0da619b-8ba4-4a14-8b67-ed3c58f0bfac	534e065f-1981-493f-952d-b3f8d919df52	Okay quality party outfit for Indian female in age group 51+.	cocktail-dress-1773156599789-159	Okay quality party outfit for Indian female in age group 51+.	3800	INR	10	f	20	2026-03-10 15:29:59.79	\N	APPROVED	Cocktail dress	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_035", "occasion": "Party", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
34e06029-f4e7-40ab-8ec6-288e1068cb51	534e065f-1981-493f-952d-b3f8d919df52	Okay quality wedding outfit for Indian female in age group 13-17.	silk-saree-1773156599794-160	Okay quality wedding outfit for Indian female in age group 13-17.	3800	INR	10	f	20	2026-03-10 15:29:59.795	\N	APPROVED	Silk saree	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Silk", "cloth_id": "imgA_036", "occasion": "Wedding", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
a6148d0c-73da-4222-8057-dbc286698fbf	534e065f-1981-493f-952d-b3f8d919df52	Okay quality wedding outfit for Indian female in age group 18-25.	silk-saree-1773156599798-161	Okay quality wedding outfit for Indian female in age group 18-25.	3800	INR	10	f	20	2026-03-10 15:29:59.799	\N	APPROVED	Silk saree	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Silk", "cloth_id": "imgA_037", "occasion": "Wedding", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
80a8494f-f9b2-4e06-93b2-8ec5c46a735e	534e065f-1981-493f-952d-b3f8d919df52	Okay quality wedding outfit for Indian female in age group 26-35.	silk-saree-1773156599803-162	Okay quality wedding outfit for Indian female in age group 26-35.	3800	INR	10	f	20	2026-03-10 15:29:59.804	\N	APPROVED	Silk saree	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Silk", "cloth_id": "imgA_038", "occasion": "Wedding", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
670830c3-496b-44de-860a-a682db16cd10	534e065f-1981-493f-952d-b3f8d919df52	Okay quality wedding outfit for Indian female in age group 36-50.	silk-saree-1773156599808-163	Okay quality wedding outfit for Indian female in age group 36-50.	3800	INR	10	f	20	2026-03-10 15:29:59.808	\N	APPROVED	Silk saree	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Silk", "cloth_id": "imgA_039", "occasion": "Wedding", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
4a63288f-69cc-49d4-a141-446af66616d9	534e065f-1981-493f-952d-b3f8d919df52	Okay quality wedding outfit for Indian female in age group 51+.	silk-saree-1773156599812-164	Okay quality wedding outfit for Indian female in age group 51+.	3800	INR	10	f	20	2026-03-10 15:29:59.813	\N	APPROVED	Silk saree	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Silk", "cloth_id": "imgA_040", "occasion": "Wedding", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
4189a84e-0868-4320-9b48-1d49bb2f218a	534e065f-1981-493f-952d-b3f8d919df52	Okay quality casual luxury outfit for Indian female in age group 13-17.	co-ord-set-1773156599818-165	Okay quality casual luxury outfit for Indian female in age group 13-17.	3800	INR	10	f	20	2026-03-10 15:29:59.819	\N	APPROVED	Co-ord set	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_041", "occasion": "Casual Luxury", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
f21397f5-55f4-4108-b196-71cea81e7a81	534e065f-1981-493f-952d-b3f8d919df52	Okay quality casual luxury outfit for Indian female in age group 18-25.	co-ord-set-1773156599823-166	Okay quality casual luxury outfit for Indian female in age group 18-25.	3800	INR	10	f	20	2026-03-10 15:29:59.824	\N	APPROVED	Co-ord set	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_042", "occasion": "Casual Luxury", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
62127a9c-691a-4302-88c2-a973a39e9abb	534e065f-1981-493f-952d-b3f8d919df52	Okay quality casual luxury outfit for Indian female in age group 26-35.	co-ord-set-1773156599828-167	Okay quality casual luxury outfit for Indian female in age group 26-35.	3800	INR	10	f	20	2026-03-10 15:29:59.829	\N	APPROVED	Co-ord set	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_043", "occasion": "Casual Luxury", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
f2d852f6-2106-4e1d-b5be-5bafc8094b56	534e065f-1981-493f-952d-b3f8d919df52	Okay quality casual luxury outfit for Indian female in age group 36-50.	co-ord-set-1773156599832-168	Okay quality casual luxury outfit for Indian female in age group 36-50.	3800	INR	10	f	20	2026-03-10 15:29:59.833	\N	APPROVED	Co-ord set	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_044", "occasion": "Casual Luxury", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
21cbb094-2ba0-4080-b245-5a96674d9279	534e065f-1981-493f-952d-b3f8d919df52	Okay quality casual luxury outfit for Indian female in age group 51+.	co-ord-set-1773156599837-169	Okay quality casual luxury outfit for Indian female in age group 51+.	3800	INR	10	f	20	2026-03-10 15:29:59.837	\N	APPROVED	Co-ord set	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Cotton blend", "cloth_id": "imgA_045", "occasion": "Casual Luxury", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
9e9c5730-5b41-43fe-86ee-a25cec797498	534e065f-1981-493f-952d-b3f8d919df52	Okay quality resort outfit for Indian female in age group 13-17.	maxi-dress-1773156599841-170	Okay quality resort outfit for Indian female in age group 13-17.	3800	INR	10	f	20	2026-03-10 15:29:59.842	\N	APPROVED	Maxi dress	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Chiffon", "cloth_id": "imgA_046", "occasion": "Resort", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
16b26acb-acfd-4113-806d-31ef93b6af10	534e065f-1981-493f-952d-b3f8d919df52	Okay quality resort outfit for Indian female in age group 18-25.	maxi-dress-1773156599846-171	Okay quality resort outfit for Indian female in age group 18-25.	3800	INR	10	f	20	2026-03-10 15:29:59.847	\N	APPROVED	Maxi dress	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Chiffon", "cloth_id": "imgA_047", "occasion": "Resort", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
445ea423-7a7d-49ef-b3bd-346ba7f34c44	534e065f-1981-493f-952d-b3f8d919df52	Okay quality resort outfit for Indian female in age group 26-35.	maxi-dress-1773156599851-172	Okay quality resort outfit for Indian female in age group 26-35.	3800	INR	10	f	20	2026-03-10 15:29:59.852	\N	APPROVED	Maxi dress	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Chiffon", "cloth_id": "imgA_048", "occasion": "Resort", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
0ca707b7-f4f8-4038-afdf-5ac00c1aace1	534e065f-1981-493f-952d-b3f8d919df52	Okay quality resort outfit for Indian female in age group 36-50.	maxi-dress-1773156599855-173	Okay quality resort outfit for Indian female in age group 36-50.	3800	INR	10	f	20	2026-03-10 15:29:59.856	\N	APPROVED	Maxi dress	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Chiffon", "cloth_id": "imgA_049", "occasion": "Resort", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
98dca101-2db3-45ec-9828-5b0ae8309426	534e065f-1981-493f-952d-b3f8d919df52	Okay quality resort outfit for Indian female in age group 51+.	maxi-dress-1773156599860-174	Okay quality resort outfit for Indian female in age group 51+.	3800	INR	10	f	20	2026-03-10 15:29:59.861	\N	APPROVED	Maxi dress	f	{"fit": "Average", "score": "0.6", "style": "Basic", "fabric": "Chiffon", "cloth_id": "imgA_050", "occasion": "Resort", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "okay", "color_family": "Neutral", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
e340ed0a-bcf6-43d5-a41f-a71ed76e6a60	534e065f-1981-493f-952d-b3f8d919df52	Bad quality formal outfit for Indian female in age group 13-17.	blazer-set-1773156599864-175	Bad quality formal outfit for Indian female in age group 13-17.	2600	INR	10	f	20	2026-03-10 15:29:59.865	\N	APPROVED	Blazer set	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_051", "occasion": "Formal", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
69e6a501-59e3-4312-bbff-2d76bb399622	534e065f-1981-493f-952d-b3f8d919df52	Bad quality formal outfit for Indian female in age group 36-50.	blazer-set-1773156599877-178	Bad quality formal outfit for Indian female in age group 36-50.	2600	INR	10	f	20	2026-03-10 15:29:59.878	\N	APPROVED	Blazer set	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_054", "occasion": "Formal", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
be12dfad-e927-4179-91ec-fabb4c927c8f	534e065f-1981-493f-952d-b3f8d919df52	Bad quality party outfit for Indian female in age group 13-17.	cocktail-dress-1773156599886-180	Bad quality party outfit for Indian female in age group 13-17.	2600	INR	10	f	20	2026-03-10 15:29:59.887	\N	APPROVED	Cocktail dress	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_056", "occasion": "Party", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
b6b5941f-d58b-46aa-8c43-30ca77c08dfa	534e065f-1981-493f-952d-b3f8d919df52	Bad quality formal outfit for Indian female in age group 51+.	blazer-set-1773156599882-179	Bad quality formal outfit for Indian female in age group 51+.	2600	INR	9	f	20	2026-03-10 15:29:59.883	\N	APPROVED	Blazer set	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_055", "occasion": "Formal", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
2e237b2e-b9ae-4bd8-acb2-a7c57e90caae	534e065f-1981-493f-952d-b3f8d919df52	Bad quality party outfit for Indian female in age group 18-25.	cocktail-dress-1773156599891-181	Bad quality party outfit for Indian female in age group 18-25.	2600	INR	10	f	20	2026-03-10 15:29:59.892	\N	APPROVED	Cocktail dress	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_057", "occasion": "Party", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
a1b38db9-8a66-4ed5-bf0c-2e12d35b9708	534e065f-1981-493f-952d-b3f8d919df52	Bad quality party outfit for Indian female in age group 36-50.	cocktail-dress-1773156599900-183	Bad quality party outfit for Indian female in age group 36-50.	2600	INR	10	f	20	2026-03-10 15:29:59.9	\N	APPROVED	Cocktail dress	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_059", "occasion": "Party", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
7c385a7f-da06-4995-8e00-59737176a0ba	534e065f-1981-493f-952d-b3f8d919df52	Bad quality party outfit for Indian female in age group 51+.	cocktail-dress-1773156599904-184	Bad quality party outfit for Indian female in age group 51+.	2600	INR	10	f	20	2026-03-10 15:29:59.905	\N	APPROVED	Cocktail dress	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_060", "occasion": "Party", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
54a177a5-94aa-4497-b9b6-ee0853f048dc	534e065f-1981-493f-952d-b3f8d919df52	Bad quality wedding outfit for Indian female in age group 13-17.	silk-saree-1773156599909-185	Bad quality wedding outfit for Indian female in age group 13-17.	2600	INR	10	f	20	2026-03-10 15:29:59.91	\N	APPROVED	Silk saree	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Silk", "cloth_id": "imgA_061", "occasion": "Wedding", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
80ed87d2-f3f5-4aa3-9065-19079fe19840	534e065f-1981-493f-952d-b3f8d919df52	Bad quality wedding outfit for Indian female in age group 18-25.	silk-saree-1773156599913-186	Bad quality wedding outfit for Indian female in age group 18-25.	2600	INR	10	f	20	2026-03-10 15:29:59.914	\N	APPROVED	Silk saree	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Silk", "cloth_id": "imgA_062", "occasion": "Wedding", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
f1f0805e-2dee-4f6c-be07-0482f0b9d968	534e065f-1981-493f-952d-b3f8d919df52	Bad quality wedding outfit for Indian female in age group 26-35.	silk-saree-1773156599918-187	Bad quality wedding outfit for Indian female in age group 26-35.	2600	INR	10	f	20	2026-03-10 15:29:59.919	\N	APPROVED	Silk saree	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Silk", "cloth_id": "imgA_063", "occasion": "Wedding", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
ec3ee48f-3c4d-4c66-8aea-e21ca52a61df	534e065f-1981-493f-952d-b3f8d919df52	Bad quality wedding outfit for Indian female in age group 36-50.	silk-saree-1773156599922-188	Bad quality wedding outfit for Indian female in age group 36-50.	2600	INR	10	f	20	2026-03-10 15:29:59.923	\N	APPROVED	Silk saree	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Silk", "cloth_id": "imgA_064", "occasion": "Wedding", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
af0029d2-e461-487a-b51d-478d492b98d2	534e065f-1981-493f-952d-b3f8d919df52	Bad quality wedding outfit for Indian female in age group 51+.	silk-saree-1773156599927-189	Bad quality wedding outfit for Indian female in age group 51+.	2600	INR	10	f	20	2026-03-10 15:29:59.928	\N	APPROVED	Silk saree	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Silk", "cloth_id": "imgA_065", "occasion": "Wedding", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Silk saree", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
d18402ed-70c8-434f-ada4-6de29547b1d3	534e065f-1981-493f-952d-b3f8d919df52	Bad quality casual luxury outfit for Indian female in age group 13-17.	co-ord-set-1773156599932-190	Bad quality casual luxury outfit for Indian female in age group 13-17.	2600	INR	10	f	20	2026-03-10 15:29:59.933	\N	APPROVED	Co-ord set	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_066", "occasion": "Casual Luxury", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
5cde045d-2c27-47d2-8e96-583a3709e40e	534e065f-1981-493f-952d-b3f8d919df52	Bad quality casual luxury outfit for Indian female in age group 18-25.	co-ord-set-1773156599937-191	Bad quality casual luxury outfit for Indian female in age group 18-25.	2600	INR	10	f	20	2026-03-10 15:29:59.938	\N	APPROVED	Co-ord set	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_067", "occasion": "Casual Luxury", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
ffbdba7e-e827-4bb2-a41a-41de8334fa3f	534e065f-1981-493f-952d-b3f8d919df52	Bad quality casual luxury outfit for Indian female in age group 26-35.	co-ord-set-1773156599941-192	Bad quality casual luxury outfit for Indian female in age group 26-35.	2600	INR	10	f	20	2026-03-10 15:29:59.942	\N	APPROVED	Co-ord set	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_068", "occasion": "Casual Luxury", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
a4482be6-5aaa-4881-8000-2d7d5c9a4abc	534e065f-1981-493f-952d-b3f8d919df52	Bad quality casual luxury outfit for Indian female in age group 36-50.	co-ord-set-1773156599946-193	Bad quality casual luxury outfit for Indian female in age group 36-50.	2600	INR	10	f	20	2026-03-10 15:29:59.947	\N	APPROVED	Co-ord set	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_069", "occasion": "Casual Luxury", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
9baba453-2c7b-46d5-b62a-95527141b5d9	534e065f-1981-493f-952d-b3f8d919df52	Bad quality casual luxury outfit for Indian female in age group 51+.	co-ord-set-1773156599951-194	Bad quality casual luxury outfit for Indian female in age group 51+.	2600	INR	10	f	20	2026-03-10 15:29:59.952	\N	APPROVED	Co-ord set	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_070", "occasion": "Casual Luxury", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Co-ord set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
d219d7c1-0983-4169-a37d-2d4a3a0b22aa	534e065f-1981-493f-952d-b3f8d919df52	Bad quality resort outfit for Indian female in age group 13-17.	maxi-dress-1773156599956-195	Bad quality resort outfit for Indian female in age group 13-17.	2600	INR	10	f	20	2026-03-10 15:29:59.957	\N	APPROVED	Maxi dress	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Chiffon", "cloth_id": "imgA_071", "occasion": "Resort", "age_group": "13-17", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
043ad54a-e940-4799-89b8-6498f27ba7c8	534e065f-1981-493f-952d-b3f8d919df52	Bad quality resort outfit for Indian female in age group 18-25.	maxi-dress-1773156599961-196	Bad quality resort outfit for Indian female in age group 18-25.	2600	INR	10	f	20	2026-03-10 15:29:59.962	\N	APPROVED	Maxi dress	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Chiffon", "cloth_id": "imgA_072", "occasion": "Resort", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
4358f3ad-cd8b-4dd7-8c1c-7195b9078c8f	534e065f-1981-493f-952d-b3f8d919df52	Bad quality resort outfit for Indian female in age group 26-35.	maxi-dress-1773156599965-197	Bad quality resort outfit for Indian female in age group 26-35.	2600	INR	10	f	20	2026-03-10 15:29:59.966	\N	APPROVED	Maxi dress	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Chiffon", "cloth_id": "imgA_073", "occasion": "Resort", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
7d2b3aa2-cd8c-45cc-a2da-4e6f481aa525	534e065f-1981-493f-952d-b3f8d919df52	Bad quality resort outfit for Indian female in age group 36-50.	maxi-dress-1773156599969-198	Bad quality resort outfit for Indian female in age group 36-50.	2600	INR	10	f	20	2026-03-10 15:29:59.97	\N	APPROVED	Maxi dress	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Chiffon", "cloth_id": "imgA_074", "occasion": "Resort", "age_group": "36-50", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
b659314c-e987-43c6-a21c-0938ff277115	534e065f-1981-493f-952d-b3f8d919df52	Bad quality resort outfit for Indian female in age group 51+.	maxi-dress-1773156599974-199	Bad quality resort outfit for Indian female in age group 51+.	2600	INR	10	f	20	2026-03-10 15:29:59.975	\N	APPROVED	Maxi dress	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Chiffon", "cloth_id": "imgA_075", "occasion": "Resort", "age_group": "51+", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Maxi dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
35dc3bae-1f49-478b-b03a-67951f970589	a231601f-821b-44fb-9c3d-704820bf5793	midnight3	midnight3-5NAdtH		566600	INR	56	f	20	2026-03-16 15:41:37.874	2026-03-28 17:41:05.874	APPROVED	Lehnga collection 	f	{"sizes": ["S", "L", "M"], "occasions": ["Party"], "age_ranges": ["25-34", "35-44"], "skin_tones": ["Dusky", "Medium"], "body_shapes": ["Inverted Triangle", "Apple Shape"]}	{Party}	{"Inverted Triangle","Apple Shape"}	{Dusky,Medium}	{S,L,M}	{25-34,35-44}	62f04146-d27e-42fa-b214-c63edd60fe9c	\N	10
65c603c6-4880-4b3d-9019-ec1a3ac08d55	534e065f-1981-493f-952d-b3f8d919df52	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	dress-1773156599595-117	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while maintaining a clean and classy aesthetic for sophisticated everyday wear. Tailored with a relaxed fit in silk fabric and a jewel palette for Casual luxury occasions. Fits Apple Shape shapes, complements Dusky skin tones, and comes in sizes L. Age guidance: 36-50 years.	2318	INR	0	f	20	2026-03-10 15:29:59.596	\N	APPROVED	dress	f	{"fit": "relaxed", "score": "0.106", "style": "Minimal Luxury", "fabric": "silk", "cloth_id": "train_image/img_018.jpg", "occasion": "Casual luxury", "age_group": "36-50", "skin_tone": "Dusky", "body_shape": "Apple Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "dress", "recommended_size": "L"}	{}	{}	{}	{}	{}	\N	\N	10
292ba2f8-6980-4244-83d6-f6999c22ba5f	a231601f-821b-44fb-9c3d-704820bf5793	Lehnga mid	lehnga-mid-qmfFzS		50000	INR	5	f	20	2026-03-11 16:31:26.831	2026-03-25 15:52:46.366	APPROVED	\N	f	\N	{}	{}	{}	{}	{}	\N	\N	10
34f3b995-f0eb-4e33-9466-94f3175e5594	a231601f-821b-44fb-9c3d-704820bf5793	Lehnga2	lehnga2-7u9tRP		60000	INR	5	f	20	2026-03-11 16:43:38.686	2026-03-25 15:52:52.808	APPROVED	\N	f	\N	{}	{}	{}	{}	{}	\N	\N	10
5bb799e7-3e68-4a53-821b-6959ba3a3038	a231601f-821b-44fb-9c3d-704820bf5793	Product 2	product-2-fOUtSL	Hello world 	58800	INR	0	f	20	2026-03-12 15:08:23.885	2026-03-25 15:52:55.552	APPROVED	\N	f	{"sizes": ["XL", "M"], "occasions": ["Party"], "age_ranges": ["35-44", "25-34"], "skin_tones": ["Medium", "Dusky"], "body_shapes": ["Pear Shape", "Hourglass"]}	{Party}	{"Pear Shape",Hourglass}	{Medium,Dusky}	{XL,M}	{35-44,25-34}	\N	\N	10
9745e086-a43f-4d80-a278-ff8484c4baa9	d10ddc0e-9d4a-4774-a94e-d3c043a6fab6	Midnight true	midnight-true-fjrs5D		200	INR	20	f	20	2026-03-24 15:09:03.619	2026-03-24 15:11:22.339	APPROVED	Lehnga collection 	f	{"sizes": ["M", "L"], "occasions": ["Casual luxury", "Wedding"], "age_ranges": ["35-44", "25-34"], "skin_tones": ["Dusky", "Medium"], "body_shapes": ["Apple Shape", "Pear Shape"]}	{"Casual luxury",Wedding}	{"Apple Shape","Pear Shape"}	{Dusky,Medium}	{M,L}	{35-44,25-34}	62f04146-d27e-42fa-b214-c63edd60fe9c	\N	10
7f1d4a93-74df-4287-a657-f1e12c5cd404	534e065f-1981-493f-952d-b3f8d919df52	Bad quality party outfit for Indian female in age group 26-35.	cocktail-dress-1773156599895-182	Bad quality party outfit for Indian female in age group 26-35.	2600	INR	6	f	20	2026-03-10 15:29:59.896	\N	APPROVED	Cocktail dress	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_058", "occasion": "Party", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Cocktail dress", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
05dae7e0-de99-4c9a-ba94-f721c94fd342	534e065f-1981-493f-952d-b3f8d919df52	Bad quality formal outfit for Indian female in age group 26-35.	blazer-set-1773156599873-177	Bad quality formal outfit for Indian female in age group 26-35.	2600	INR	7	f	20	2026-03-10 15:29:59.874	\N	APPROVED	Blazer set	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_053", "occasion": "Formal", "age_group": "26-35", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
f5437d24-d4ba-4198-9d01-6f50422d7320	534e065f-1981-493f-952d-b3f8d919df52	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	co-ord-set-1773156599532-104	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and high-waisted skirt that adds shape and softness to a straight body frame for relaxed yet refined daytime outings. Tailored with a relaxed fit in linen fabric and a pastel palette for Casual luxury occasions. Fits Rectangle shapes, complements Medium skin tones, and comes in sizes S. Age guidance: 26-35 years.	2339	INR	0	f	20	2026-03-10 15:29:59.533	\N	APPROVED	co_ord_set	f	{"fit": "relaxed", "score": "0.113", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "train_image/5.png", "occasion": "Casual luxury", "age_group": "26-35", "skin_tone": "Medium", "body_shape": "Rectangle", "quality_tag": "", "color_family": "pastel", "clothing_type": "co_ord_set", "recommended_size": "S"}	{}	{}	{}	{}	{}	\N	\N	10
5e10d861-fa2c-4102-b80d-720315a8da9a	534e065f-1981-493f-952d-b3f8d919df52	Bad quality formal outfit for Indian female in age group 18-25.	blazer-set-1773156599868-176	Bad quality formal outfit for Indian female in age group 18-25.	2600	INR	0	f	20	2026-03-10 15:29:59.869	\N	APPROVED	Blazer set	f	{"fit": "Poor", "score": "0.2", "style": "Unflattering", "fabric": "Cotton blend", "cloth_id": "imgA_052", "occasion": "Formal", "age_group": "18-25", "skin_tone": "light,medium,dusky", "body_shape": "rectangle,pear,hourglass,apple", "quality_tag": "bad", "color_family": "Clashing", "clothing_type": "Blazer set", "recommended_size": "S,M,L"}	{}	{}	{}	{}	{}	\N	\N	10
cb7f9861-d486-4e71-8ce8-4bed8daf278f	d10ddc0e-9d4a-4774-a94e-d3c043a6fab6	Midnight true	midnight-true-TawHZN		200	INR	19	f	20	2026-03-24 15:09:07.743	2026-03-24 15:11:14.742	APPROVED	Lehnga collection 	f	{"sizes": ["M", "L"], "occasions": ["Casual luxury", "Wedding"], "age_ranges": ["35-44", "25-34"], "skin_tones": ["Dusky", "Medium"], "body_shapes": ["Apple Shape", "Pear Shape"]}	{"Casual luxury",Wedding}	{"Apple Shape","Pear Shape"}	{Dusky,Medium}	{M,L}	{35-44,25-34}	62f04146-d27e-42fa-b214-c63edd60fe9c	\N	10
e1ca2303-1441-4355-a42a-d51c347e574a	b317f4ab-75db-4b8f-8807-08dafa4e5246	Midnight se	midnightse	\N	4950	INR	0	f	20	2026-03-24 19:48:05.419	2026-03-28 17:48:55.11	APPROVED	\N	f	{"colors": ["GREY"]}	{}	{ATHLETIC,PEAR}	{MEDIUM,LIGHT,FAIR}	{M}	{26-35}	781fcfba-41e3-4c7c-b274-5b2c83641ad3	\N	10
f30e48e7-c6d3-4b51-b587-520b6b40a8dd	534e065f-1981-493f-952d-b3f8d919df52	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weath	kurta-set-1773156599017-10	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weather. Crafted in linen with a relaxed profile and a metallic palette suited for Formal moments across India. Fits Apple Shape, Rectangle bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 36-50 years.	2552	INR	9	f	20	2026-03-10 15:29:59.019	\N	APPROVED	kurta_set	f	{"fit": "relaxed", "score": "0.184", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "testiing_image_collection/86.png", "occasion": "Formal", "age_group": "36-50", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Rectangle", "quality_tag": "", "color_family": "metallic", "clothing_type": "kurta_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
c3f7e9b9-1faa-4739-a766-d30d09ff1aaa	b317f4ab-75db-4b8f-8807-08dafa4e5246	afsa	afsa	\N	4500	INR	0	t	20	2026-03-24 19:43:58.439	2026-03-24 19:47:07.112	DRAFT	\N	f	{"colors": ["WHITE"]}	{}	{PEAR}	{MEDIUM,LIGHT}	{M}	{18-25}	62f04146-d27e-42fa-b214-c63edd60fe9c	\N	10
a27506e0-8bff-4b84-8411-d5902d85f1b8	3fa5464c-3181-4083-b072-b6205143ca64	hellodebv	hellodebv	\N	5454500	INR	0	f	20	2026-03-25 17:18:27.161	2026-03-28 10:18:15.896	APPROVED	\N	f	{"colors": ["SKY_BLUE", "GREY", "WHITE"]}	{}	{HOURGLASS,PEAR,APPLE,RECTANGLE,INVERTED_TRIANGLE,ATHLETIC,PETITE}	{LIGHT,MEDIUM,OLIVE,TAN,DARK_BROWN}	{S,M}	{18-25,13-17}	62f04146-d27e-42fa-b214-c63edd60fe9c	\N	50
6f738ba8-75aa-481c-83f3-c5a09959a711	534e065f-1981-493f-952d-b3f8d919df52	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weath	kurta-set-1773156599074-19	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weather. Crafted in linen with a relaxed profile and a black palette suited for Formal moments across India. Fits Apple Shape, Rectangle bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L, XL. Age guidance: 51+ years.	2531	INR	9	f	20	2026-03-10 15:29:59.075	\N	APPROVED	kurta_set	f	{"fit": "relaxed", "score": "0.177", "style": "Minimal Luxury", "fabric": "linen", "cloth_id": "testiing_image_collection/95.png", "occasion": "Formal", "age_group": "51+", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Rectangle", "quality_tag": "", "color_family": "black", "clothing_type": "kurta_set", "recommended_size": "S, M, L, XL"}	{}	{}	{}	{}	{}	\N	\N	10
1430d44e-47b6-4e40-9501-f441fb1ffa53	534e065f-1981-493f-952d-b3f8d919df52	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk wit	kaftan-1773156599287-54	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk with a relaxed profile and a black palette suited for Resort moments across India. Fits Apple Shape, Rectangle, Pear Shape bodies, complements Light, Medium, Dusky skin tones, and is available in sizes S, M, L. Age guidance: 36-50 years.	2513	INR	9	f	20	2026-03-10 15:29:59.288	\N	APPROVED	kaftan	f	{"fit": "relaxed", "score": "0.171", "style": "Minimal Luxury", "fabric": "silk", "cloth_id": "train_image/05.png", "occasion": "Resort", "age_group": "36-50", "skin_tone": "Light, Medium, Dusky", "body_shape": "Apple Shape, Rectangle, Pear Shape", "quality_tag": "", "color_family": "black", "clothing_type": "kaftan", "recommended_size": "S, M, L"}	{}	{}	{}	{}	{}	\N	\N	10
f36e9fe2-78df-48da-a3a8-3becfa42f4b9	534e065f-1981-493f-952d-b3f8d919df52	A printed wrap skirt paired with a fitted solid top that draws attention to the waist and upper body	dress-1773156599611-120	A printed wrap skirt paired with a fitted solid top that draws attention to the waist and upper body, creating a balanced and stylish outfit for relaxed social outings. Tailored with a relaxed fit in silk fabric and a jewel palette for Casual luxury occasions. Fits Pear Shape shapes, complements Medium skin tones, and comes in sizes M. Age guidance: 26-35 years.	2357	INR	8	f	20	2026-03-10 15:29:59.612	\N	APPROVED	dress	f	{"fit": "relaxed", "score": "0.119", "style": "Minimal Luxury", "fabric": "silk", "cloth_id": "train_image/img_021.jpg", "occasion": "Casual luxury", "age_group": "26-35", "skin_tone": "Medium", "body_shape": "Pear Shape", "quality_tag": "", "color_family": "jewel", "clothing_type": "dress", "recommended_size": "M"}	{}	{}	{}	{}	{}	\N	\N	10
\.


--
-- Data for Name: ProductApproval; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductApproval" (approval_id, product_id, submitted_by, admin_user_id, comment, created_at, actioned_at, status) FROM stdin;
ec606265-5222-4414-b94b-4ddc7ec8a274	cb7f9861-d486-4e71-8ce8-4bed8daf278f	\N	\N	\N	2026-03-24 15:11:14.746	2026-03-24 15:11:14.745	APPROVED
eb29b62f-523c-485c-b139-9a177cc75d9c	9745e086-a43f-4d80-a278-ff8484c4baa9	\N	\N	\N	2026-03-24 15:11:22.343	2026-03-24 15:11:22.342	APPROVED
d370d77d-b895-46a5-85aa-dff3be96bee5	292ba2f8-6980-4244-83d6-f6999c22ba5f	\N	\N	Approved	2026-03-25 15:52:46.37	2026-03-25 15:52:46.369	APPROVED
2ff5325b-caa0-44c0-aab6-f238f1aca7f6	34f3b995-f0eb-4e33-9466-94f3175e5594	\N	\N	Approved	2026-03-25 15:52:52.81	2026-03-25 15:52:52.809	APPROVED
d51776a1-9bf7-466a-9d34-64f973caf0e4	5bb799e7-3e68-4a53-821b-6959ba3a3038	\N	\N	Approved	2026-03-25 15:52:55.555	2026-03-25 15:52:55.554	APPROVED
d993a0ee-2f23-4983-8ed8-f65a8579de37	e1ca2303-1441-4355-a42a-d51c347e574a	\N	\N	Approved	2026-03-25 15:54:55.979	2026-03-25 15:54:55.978	APPROVED
b44fa025-efb5-4cbf-b972-069aea38bcbd	a27506e0-8bff-4b84-8411-d5902d85f1b8	\N	\N	\N	2026-03-28 10:06:50.745	2026-03-28 10:06:50.743	APPROVED
7c4f3453-56e0-4fe8-97a0-42c2d34ee93d	35dc3bae-1f49-478b-b03a-67951f970589	\N	\N	\N	2026-03-28 17:41:05.89	2026-03-28 17:41:05.888	APPROVED
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductImage" (image_id, product_id, url, order_index, is_primary, uploaded_at) FROM stdin;
95d6d0d6-0120-4fc9-a173-e070d3752d1f	0382f3d3-88eb-43b9-970f-48fb998ff212	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718955/training_image/76.png	0	t	2026-03-10 15:29:58.945
648d6be2-e412-4ea7-91a3-38554b9277d1	ca66e151-f390-41f3-b22e-36a85c93e9f5	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718954/training_image/77.png	0	t	2026-03-10 15:29:58.955
0d6348b3-c0fb-40db-b347-f44a19d366d3	756437d6-0762-4cee-9bc6-5f3c2ebe4cde	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718953/training_image/78.png	0	t	2026-03-10 15:29:58.961
fa468fbb-9540-4d22-9a25-22e14bddf6e1	ed839fa9-bcf5-4e78-b639-690fc5dbf2d9	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718951/training_image/79.png	0	t	2026-03-10 15:29:58.967
5f792e16-1783-4d2a-bb85-d2c8e2e3fbce	6b2baca2-5e43-4459-9bb3-7c60150ad116	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718950/training_image/80.png	0	t	2026-03-10 15:29:58.972
66d5da30-5947-418b-b85f-471cca1035bd	4828ee34-ec9f-4452-b756-8a4ca42c8d82	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718948/training_image/81.png	0	t	2026-03-10 15:29:58.978
771d1cb1-c29b-4158-a668-803ecec0371d	ba9d7a2e-5a75-4487-815a-cf0d242d35da	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718947/training_image/82.png	0	t	2026-03-10 15:29:58.985
2e399493-51db-45cf-9e29-c556aa878d4a	3b0f3c0e-ba43-48ed-a8bf-b5d7abcdd90a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718945/training_image/83.png	0	t	2026-03-10 15:29:58.993
ef9d71e1-2be3-4ddd-8ff2-9830215dce96	381ff9a4-d4a6-49ad-be93-f2b929440115	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718943/training_image/84.png	0	t	2026-03-10 15:29:59.001
7701eb2a-a951-4099-8bfb-614b7727da27	166a4fbf-e51d-40a3-9be0-57ebeddaf8d7	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718942/training_image/85.png	0	t	2026-03-10 15:29:59.011
850fa6b2-1c6d-4165-a0ac-8e05be5f042a	f30e48e7-c6d3-4b51-b587-520b6b40a8dd	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718940/training_image/86.png	0	t	2026-03-10 15:29:59.019
a0c1ee4f-713b-4bdc-80c4-a7d48b4928a8	be826e52-36ca-4b8e-b26d-4b5aa201ebd0	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718939/training_image/87.png	0	t	2026-03-10 15:29:59.026
ca81b787-77fc-42f0-a86b-5bf6869df81c	5f760d29-c17c-447f-bbd5-2de8bbb56a91	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718938/training_image/88.png	0	t	2026-03-10 15:29:59.031
105e4bd6-1b53-4cb0-82b9-314179b74e40	3687396e-b3a7-4fe7-b4af-d70a8af8c34c	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718937/training_image/89.png	0	t	2026-03-10 15:29:59.038
a373247c-0598-4de4-b3f2-597131a7ff5b	7a426f6e-5e54-4df4-acd6-7279c87699df	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718935/training_image/90.png	0	t	2026-03-10 15:29:59.044
5c522d81-9122-4af2-b843-8abe1b870a76	5bf3c70b-94d7-492f-849b-908b8e9ec66f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718934/training_image/91.png	0	t	2026-03-10 15:29:59.049
f64644e5-18ca-4948-85d4-2bdde71cdc44	4559f069-32f5-4381-847d-91cca11ca219	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718933/training_image/92.png	0	t	2026-03-10 15:29:59.055
e1d0e11b-7c15-4aaa-8a9a-b5c137706360	fff6070a-f3d3-46bd-a248-63eceb35ac53	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718932/training_image/93.png	0	t	2026-03-10 15:29:59.061
4bf0e215-58e5-4afe-9e92-4eace6cb37e0	0d496a7d-46e1-49f6-a879-f4acec6aac4a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718931/training_image/94.png	0	t	2026-03-10 15:29:59.068
979d6f0e-1ca8-4b45-bc8f-a47a0ac22976	6f738ba8-75aa-481c-83f3-c5a09959a711	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718930/training_image/95.png	0	t	2026-03-10 15:29:59.075
fdb89f37-27a1-453a-a8da-4a9955d643f6	e6d4f7de-db3d-412a-b92b-bd8bb77bfac3	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718928/training_image/96.png	0	t	2026-03-10 15:29:59.081
00d7a329-fb47-4446-aa11-a494c47fb742	bfce8b21-e6fb-401d-8624-7b95576ebfd5	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718927/training_image/98.png	0	t	2026-03-10 15:29:59.086
2478637b-65f2-4fa3-82cd-18f293ae3331	ed124e93-0719-44f5-83e7-a1cee3d8fb36	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718925/training_image/99.png	0	t	2026-03-10 15:29:59.091
1c9274ba-3619-4040-bdf3-6af2658856dd	ffd5fe38-8e86-4a8c-8f0d-4bb25952a1bb	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718924/training_image/100.png	0	t	2026-03-10 15:29:59.097
79793859-1505-455a-a1a6-a663b98c9b88	b3f1efe1-f2ad-4e91-bb1c-b7cbf23df89d	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718923/training_image/101.png	0	t	2026-03-10 15:29:59.101
c98c3d33-f0f6-4a94-8f96-9ce2bb4ae1bc	0410040e-8422-418a-9129-f8a81d43c26a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718922/training_image/102.png	0	t	2026-03-10 15:29:59.108
09705dee-803b-41b5-806b-db5a3924003b	3a98461a-4ca6-4e7b-8ee7-2346e76be570	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718921/training_image/103.png	0	t	2026-03-10 15:29:59.113
43b72df8-7fb9-4c13-b803-d15b56188b48	00bcd69c-110c-4699-a276-0fdb40013c99	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718920/training_image/104.png	0	t	2026-03-10 15:29:59.118
edb0cc2a-38ad-4af7-a0b0-e119173dbc42	e789a459-2bac-410e-bf56-02eac4740edc	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718918/training_image/105.png	0	t	2026-03-10 15:29:59.124
aa9e0903-ff8d-4cec-af70-37255d41bb02	93912391-bdc9-4bf2-b0ab-e0f42f7325c4	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718917/training_image/106.png	0	t	2026-03-10 15:29:59.13
f9cd1c7b-8233-4c5d-84e2-6114d90105d2	b8a0d437-8a11-4da5-88f4-4465e0742f80	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718916/training_image/107.png	0	t	2026-03-10 15:29:59.136
608e67fb-66f6-4add-a969-bd6b538cf8e4	f19892af-88d8-4c6e-a0d4-48f71f5f0b38	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718915/training_image/108.png	0	t	2026-03-10 15:29:59.142
74ee5e5d-a280-4600-85d4-fdb445b1e4b4	42423884-9d96-4c98-9008-6b70bf8f3ec1	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718914/training_image/109.png	0	t	2026-03-10 15:29:59.147
64adc93f-6697-4044-91a9-9fb993925ca3	f4015110-d7ed-43c7-8c90-35ee2eeb0630	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718913/training_image/110.png	0	t	2026-03-10 15:29:59.152
a1598a2b-c2d5-4307-92c1-6caca266fc88	ed5e8c6d-7d3a-4924-806d-830c4e409cbd	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718912/training_image/111.png	0	t	2026-03-10 15:29:59.158
8d7dc585-a2e4-4683-81b0-6fe354d40f05	cbaac4c8-9a23-4ee1-96ca-8413cfcdad1c	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718911/training_image/112.png	0	t	2026-03-10 15:29:59.164
6e078aae-eb4e-4600-817a-449b67f1eb60	ab3bbb6b-239e-4374-ae0a-cce823911429	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718910/training_image/113.png	0	t	2026-03-10 15:29:59.171
48b9e9c6-c4e5-4b6c-b10a-b3a778feb913	4ce30006-a1aa-4433-ab18-e196a19a8403	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718909/training_image/114.png	0	t	2026-03-10 15:29:59.177
7e18cc16-b49a-4175-94e9-db4096723755	b4d81ea6-c7b5-4847-ada4-940a669352f7	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718896/training_image/115.png	0	t	2026-03-10 15:29:59.183
b645c1ae-4f83-4194-8023-80557ae3f799	b54efab6-1b4f-43d4-a651-20d300862820	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718907/training_image/116.png	0	t	2026-03-10 15:29:59.189
cdbfda9f-d308-40da-bbe8-116b6049b04c	b5fabff3-ae68-4db3-bc31-15f3863bfb80	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718907/training_image/117.png	0	t	2026-03-10 15:29:59.198
5a091f2d-44cd-4407-981f-0e16e4d80b5f	0ccde618-8c26-44a3-bd5b-642b3df9538f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718906/training_image/118.png	0	t	2026-03-10 15:29:59.21
3da911f3-958e-46bd-89bf-475423b0fa5b	2baf9ad6-870b-4106-ad2a-aef87816da86	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718905/training_image/119.png	0	t	2026-03-10 15:29:59.217
387241a0-0468-43aa-9f3b-74aa82cc2b14	d942345f-5da4-411d-b7ce-c78d49ad1888	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718903/training_image/120.png	0	t	2026-03-10 15:29:59.223
fdd9fe95-de28-45e7-b53c-fd59c4abd772	2ce7697d-5cbc-4b5e-adda-80e57f79f731	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718902/training_image/121.png	0	t	2026-03-10 15:29:59.23
b707708d-1904-412d-9096-c75595970f63	1553c4a6-af2c-461f-a117-4d52416088c3	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718900/training_image/122.png	0	t	2026-03-10 15:29:59.237
741aff6e-8271-478a-b4d1-9e8018ff7228	cd9e266c-88d9-41d6-8854-8caa7d89ad1f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718899/training_image/124.png	0	t	2026-03-10 15:29:59.244
3fcce671-10c4-47e5-937e-9cd45435bcbd	48fd6342-5ca4-4f65-9641-41465330473b	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718897/training_image/125.png	0	t	2026-03-10 15:29:59.25
88346adc-3c5d-4e0a-a534-8eff04750a9c	746f4335-f9f8-41ba-ab46-b1640d86ea1a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718906/training_image/118.png	0	t	2026-03-10 15:29:59.255
9a0492ac-0eec-4232-bbdc-73ab09961c29	f8292020-81c7-4aea-842b-d167dd04daef	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718915/training_image/108.png	0	t	2026-03-10 15:29:59.26
52d65044-5fa6-462a-8300-30ab9c27f4f4	b01601f7-2dab-4ab9-b81e-46187f2384e2	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718517/training_image/01.png	0	t	2026-03-10 15:29:59.266
ece70394-9ea5-42be-99c1-fa6cc45f3440	322ed57e-9223-4455-909f-8a2df6cb864a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718516/training_image/02.png	0	t	2026-03-10 15:29:59.271
50971a68-e937-4373-b287-7316e8602379	403a90dd-f53a-495c-8150-c9f16c3b478e	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718515/training_image/03.png	0	t	2026-03-10 15:29:59.277
bcc778ca-6fe4-46ee-b719-fcc5c5573520	0c4dc35a-7a34-495c-9d20-c89012965e6b	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718514/training_image/04.png	0	t	2026-03-10 15:29:59.282
8f45b636-8537-4517-90ce-dda2f6fc513e	1430d44e-47b6-4e40-9501-f441fb1ffa53	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718512/training_image/05.png	0	t	2026-03-10 15:29:59.288
793290ce-f4ad-4c09-81dc-572c51a09f31	ac6ceefa-a62c-42c3-880a-4450d55e2010	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718509/training_image/06.png	0	t	2026-03-10 15:29:59.293
523af165-b89d-4d68-a1e8-6a502d89f67b	2b04e8c5-1be7-485c-a6da-0394328af080	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718509/training_image/07.png	0	t	2026-03-10 15:29:59.298
5888ca6e-cc0a-44b4-b210-7d39d6c799bc	faaf248f-a437-410e-b93e-b06ad2e5223f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718507/training_image/08.png	0	t	2026-03-10 15:29:59.302
6f315ecc-7341-4589-be8e-b3df3a73a007	e284149a-4414-410d-b22b-89061723d7fa	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718506/training_image/09.png	0	t	2026-03-10 15:29:59.308
3641a9fc-0a10-48bd-9e65-3622fe52f8ae	3137a116-6ad4-491c-b30c-9de84e6800f7	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718505/training_image/10.png	0	t	2026-03-10 15:29:59.314
57fd613d-1df6-405b-aa92-6eb56de416eb	62410a32-d4aa-407f-91ba-9bbf54e3640c	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718504/training_image/11.png	0	t	2026-03-10 15:29:59.32
60bd3057-8025-4d6f-ac39-17bf6c9a0f98	5c004a45-3e00-41ef-b220-1a0ca189ea3f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718503/training_image/12.png	0	t	2026-03-10 15:29:59.325
67672594-e59c-4cbc-a4b1-3066b2275e1a	8cbc23a9-e043-4f63-a910-7fe4745b549b	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718502/training_image/13.png	0	t	2026-03-10 15:29:59.33
f689e7ad-4408-40e0-b6b0-a3d3399d3950	121a5926-aebe-40e6-a66b-e9a4529e0542	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718501/training_image/14.png	0	t	2026-03-10 15:29:59.335
8a33c803-3a01-4590-a0b9-fd8fa48abcca	29e6714c-cee3-40c0-b8d8-f84109571fff	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718499/training_image/15.png	0	t	2026-03-10 15:29:59.34
53c01be4-e35a-401e-8ae2-a29620a902d2	019de3cf-5093-43f5-8924-fba15cde10b8	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718497/training_image/16.png	0	t	2026-03-10 15:29:59.345
2c279836-6812-43b8-8080-c0f4165f53ae	c7682873-efba-481c-81da-01e25b1e2cbb	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718496/training_image/17.png	0	t	2026-03-10 15:29:59.35
7684a03a-e194-4bf2-9b9b-ca704e35c9b6	9c057eb7-9f49-4f6c-8225-6b044af957d6	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718495/training_image/18.png	0	t	2026-03-10 15:29:59.355
106ab53b-7909-4808-9998-af178da42be7	ac605a72-c5a4-4502-8507-dd64ebfc403c	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718493/training_image/19.png	0	t	2026-03-10 15:29:59.359
289d643a-28ed-4caa-8a0c-c8b01d47cbbe	eba571b0-5d18-4a37-8290-8e8477b3414a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718492/training_image/20.png	0	t	2026-03-10 15:29:59.365
9f48644c-adef-4f95-aa01-d6126a755915	700efca8-c38e-4cda-bc57-e6649846c042	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718491/training_image/21.png	0	t	2026-03-10 15:29:59.37
72dc154c-0a1a-4b5d-84a0-5dcf38194cc9	40776d9b-154f-4e30-b2fa-a2f197f709b3	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718490/training_image/22.png	0	t	2026-03-10 15:29:59.375
8103e6c4-dc21-4962-84fa-edce26b4c201	8286ce19-7df1-4290-8574-bbf619c2ef22	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718489/training_image/23.png	0	t	2026-03-10 15:29:59.38
6055e0a4-0fca-4896-b77c-38269192b408	85135d13-d80a-4b5d-b9fa-21df46544832	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718487/training_image/24.png	0	t	2026-03-10 15:29:59.386
390eb98d-f8d1-4a8e-a7d2-58fff2f7062a	0c578c16-e476-4419-a190-b393c847e6ec	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718486/training_image/25.png	0	t	2026-03-10 15:29:59.391
dc8062f1-8bdc-4b6d-8eac-7fb3b5c661a2	abcaf622-e858-4133-a49e-2dfceba50d34	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718485/training_image/26.png	0	t	2026-03-10 15:29:59.396
66cffc4c-2aed-4316-9f2b-1920a1652fbd	1da66a83-c88e-487d-8423-c120e94df16f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718484/training_image/27.png	0	t	2026-03-10 15:29:59.4
302db232-051e-4ef7-964b-e889e38cbfea	5fd88d3d-3346-4a41-b4cb-ff7993d4ace6	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718483/training_image/28.png	0	t	2026-03-10 15:29:59.405
3c08b1ef-75e9-466a-b0fc-2b8584a54834	0e6e1b86-5bb9-4d85-a906-be8e6c1e406d	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718482/training_image/29.png	0	t	2026-03-10 15:29:59.41
89984948-00c8-4e8d-b615-34353e0b7c18	0da605d6-4771-4e62-a01b-fbb1545e39c2	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718481/training_image/30.png	0	t	2026-03-10 15:29:59.414
3493cb2d-a9cb-4201-a9f5-daad4ec9b64e	1f3dd385-0829-4fdd-ac72-50e9ea71ec6e	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718480/training_image/31.png	0	t	2026-03-10 15:29:59.419
1bec7f1d-bda5-47f3-8d69-63980285b1f5	42acc2fa-a355-4039-8002-4f937987704f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718479/training_image/32.png	0	t	2026-03-10 15:29:59.424
a104e4b7-46c9-444a-b68b-c7dcbd6e8dcf	ce0156eb-9144-4eca-9c2f-04b9e48dac58	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718477/training_image/33.png	0	t	2026-03-10 15:29:59.429
eef896eb-52e5-4b90-baea-f1a174942fe5	1d321f83-5dc4-4f1f-8b9f-a135d196d67e	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718476/training_image/35.png	0	t	2026-03-10 15:29:59.434
2d0bd7a8-b9af-434d-9abe-002674495bd2	6c5622f3-b032-4363-a6d0-fe718542dab2	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718475/training_image/34.png	0	t	2026-03-10 15:29:59.439
c5e83f6a-7178-4c8b-ab40-39eaafce9275	6311775b-f2f8-443c-9946-fea4873239aa	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718473/training_image/36.png	0	t	2026-03-10 15:29:59.445
3ae7c5dd-cc9c-4489-baea-f44602cff41e	01c48cea-3182-4c63-a8ef-7181766c5ff7	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718473/training_image/37.png	0	t	2026-03-10 15:29:59.449
8399eb91-6e84-4f1c-9672-250cc872ed87	ef72cce1-a3da-44cf-a9d9-9ef2da202ecf	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718471/training_image/38.png	0	t	2026-03-10 15:29:59.455
14934f74-5d46-4670-9aec-e40ad78cc742	a68907d9-51e1-47a9-a4b8-277386a3409e	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718469/training_image/40.png	0	t	2026-03-10 15:29:59.459
72e617c9-c491-488e-aa29-081f1aace89f	96b9b4c7-c003-416b-88e0-2bb3f28b5692	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718468/training_image/45.png	0	t	2026-03-10 15:29:59.463
21182f68-8d8c-429b-84d2-3ff596d0b3ac	027d5df8-6b06-482a-bbcd-4590a85ccd79	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718467/training_image/44.png	0	t	2026-03-10 15:29:59.468
6f7f2610-cd8c-4162-84e8-ff63d38d7a85	37ffbf4f-f3db-4bfc-a5b7-5f5ce9fb4eff	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718466/training_image/43.png	0	t	2026-03-10 15:29:59.472
d59aabba-cbea-4562-bbce-0edc8b949892	4289da31-2514-4943-a4b2-8c78d83809b5	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718465/training_image/41.png	0	t	2026-03-10 15:29:59.477
4cba77d3-a3c0-4b4c-829d-68186a5b0d8d	6abc7099-bae3-4d4b-b7e6-08f3ed8328e7	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718463/training_image/42.png	0	t	2026-03-10 15:29:59.481
7f542a63-0f64-48ab-9811-9e13f729ba45	380fc3d3-55a1-44a5-8d24-989745a9f6c5	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718462/training_image/46.png	0	t	2026-03-10 15:29:59.485
4ac6c3ec-561f-470a-a2fe-cc6e9136bd46	a2f9bbd6-71af-4f0b-8261-399afbc754a7	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718461/training_image/47.png	0	t	2026-03-10 15:29:59.49
4a1ce7d0-09ab-4649-9aca-641e30837430	a6cf8d93-1db3-4f37-9e4b-cf7c4c8579e7	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718460/training_image/48.png	0	t	2026-03-10 15:29:59.495
6e4074ce-a4be-4d82-a0cb-0b2fbfd7692d	d07cdda8-9027-41f0-b3c4-cde9e55418e4	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718458/training_image/49.png	0	t	2026-03-10 15:29:59.5
efa4535d-7170-4939-95a8-f0a6666d4e89	ff30eebb-1a33-4030-bf13-58f2ca2431b1	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718457/training_image/50.png	0	t	2026-03-10 15:29:59.504
756ef79d-bdc4-4b90-bcf8-4d0948d4e2b1	9f6d74bc-8537-4ce3-b5ff-2dfc9e8b98d0	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718456/training_image/51.png	0	t	2026-03-10 15:29:59.509
d6fa04ff-4796-41a8-adb6-12f1523e53f6	e0392e06-cac8-4b2a-ad88-69f34ab6312f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718454/training_image/52.png	0	t	2026-03-10 15:29:59.514
73d5686e-edd8-4486-bce8-cae76d241f59	775cf689-142d-42cd-b6a7-5c0aceaf8c7f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718453/training_image/53.png	0	t	2026-03-10 15:29:59.519
dfd3bbd8-8a0e-48cb-8995-0be5f8bfcb01	0b876a2d-e30c-445b-b6e9-8ebaf019680f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718451/training_image/54.png	0	t	2026-03-10 15:29:59.524
4c4942b9-4c87-49f3-8499-fefe41a3ddad	3f1dc4de-3f1f-41a0-8eb3-c637d1a4e8f8	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718450/training_image/55.png	0	t	2026-03-10 15:29:59.528
68a75dd6-b4d6-4b69-b681-a0c88efcc8d5	f5437d24-d4ba-4198-9d01-6f50422d7320	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	0	t	2026-03-10 15:29:59.533
0136074c-b2b6-4ce9-bb07-876275fa7550	c13d4dc1-edf7-4cad-a72c-ccea16013b2a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718448/training_image/57.png	0	t	2026-03-10 15:29:59.538
193ea697-d71b-4a81-a09d-8ac3d1c55d53	c638c368-dcc5-454b-8bdf-4f16be5aa44f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718446/training_image/58.png	0	t	2026-03-10 15:29:59.543
940a2cc1-0e35-40ff-8d08-340cfac843b9	5bd196fa-ed0d-4f92-95ca-6c769159e210	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718445/training_image/59.png	0	t	2026-03-10 15:29:59.548
f9021411-6ded-44ec-a78a-8a9bca0dc685	342c9cf8-1581-4d92-a8f1-5bbe1ba3bf44	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718443/training_image/60.png	0	t	2026-03-10 15:29:59.553
73191ef7-fdd1-4802-8b29-9944f8a6d637	e0c9345d-7269-430e-a045-0aa4836f9cf4	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718442/training_image/61.png	0	t	2026-03-10 15:29:59.557
21a7e531-548f-4894-aa34-38fed88163e3	52419c5f-8b55-4bf1-92f0-0ae388893aee	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718441/training_image/62.png	0	t	2026-03-10 15:29:59.562
ed3d6465-34cd-4363-b145-d3ce9503542c	4b64ded4-ca55-4293-950f-7ac2d70f6a84	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718440/training_image/63.png	0	t	2026-03-10 15:29:59.567
b705f5da-869c-4172-abc8-211dc155c282	0fad2030-5fa4-4579-bf55-68fe5a56b2d6	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718438/training_image/64.png	0	t	2026-03-10 15:29:59.571
062a9736-d16e-4c48-b518-03d3710e941a	ffa56df7-2122-4daa-a037-08461e10e9f3	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718437/training_image/65.png	0	t	2026-03-10 15:29:59.576
d3deb834-a590-4581-8172-6ce8363ca246	08358d11-6602-488d-9aa9-c3adadf36755	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718436/training_image/66.png	0	t	2026-03-10 15:29:59.581
1464d013-9cee-48f7-b742-415c9cda37de	b0248722-401d-468e-80fd-e53dcfe62f1b	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718435/training_image/67.png	0	t	2026-03-10 15:29:59.586
c2359618-daf4-4757-a267-f568109e5d6b	2c56be55-c7c6-4900-856a-5f637653a18e	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718434/training_image/68.png	0	t	2026-03-10 15:29:59.591
64333000-7001-47d4-8a7d-25edd2a22d5f	65c603c6-4880-4b3d-9019-ec1a3ac08d55	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	0	t	2026-03-10 15:29:59.596
35153f3e-c3fa-4db3-9f8e-593f49f3b0ea	67c67234-cdaf-402d-91f0-36ad1ff9d121	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718431/training_image/70.png	0	t	2026-03-10 15:29:59.602
2eab8367-0706-4e1a-95c6-569e7dd34aba	24b531ce-66d5-472f-9a7b-bf06b37b0367	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718430/training_image/71.png	0	t	2026-03-10 15:29:59.607
db15126a-7872-497b-9c7a-6cd7e25b7997	f36e9fe2-78df-48da-a3a8-3becfa42f4b9	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718429/training_image/72.png	0	t	2026-03-10 15:29:59.612
818540c3-8446-46eb-9a42-7ea0233f43d9	ce9647c2-5673-49be-995f-9a5b80e5d751	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718428/training_image/73.png	0	t	2026-03-10 15:29:59.616
ac365d7c-1780-45cc-ad2c-f6484050cae2	90c32a83-cb68-4f71-a36c-28ed6c1d95f6	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718427/training_image/74.png	0	t	2026-03-10 15:29:59.622
e0c12a29-12d2-4b65-9631-a5dcb4f4de67	34e2cdff-f1ad-4860-a5f8-8978519fb57d	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718425/training_image/75.png	0	t	2026-03-10 15:29:59.626
0dd49048-67b7-4fae-9739-0f91e7977a92	683e95cd-b436-4af1-9bd6-e22184495f13	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718425/training_image/75.png	0	t	2026-03-10 15:29:59.631
10c5f061-ca04-49de-abe6-cb3ff566d31f	00b32d01-913b-41b1-97da-b49fd47e1f16	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719913/training_image/image1.png	0	t	2026-03-10 15:29:59.636
d66fc1e7-af06-4186-bd96-d98f0499c666	1a7c0b33-e5b5-4526-bcc0-6c73002d1ca5	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719910/training_image/image2.png	0	t	2026-03-10 15:29:59.64
0eb24eac-9369-4578-88f4-491a2dfcf6fb	b86e3985-b194-467e-ab4f-c7eab436bd4c	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719908/training_image/image3.png	0	t	2026-03-10 15:29:59.644
b89ebccd-e6ed-428c-97c5-654fd2b7d22f	e6f79164-278a-434e-9716-8308441f257b	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719906/training_image/image4.png	0	t	2026-03-10 15:29:59.649
6901e28c-807c-448e-85d6-1ceb990c67cc	34d4cdd8-1d65-4ac0-8f92-4955eb675ed8	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719901/training_image/image5.png	0	t	2026-03-10 15:29:59.654
5265e07f-d0e3-4ceb-882f-afa7f7b471f1	d77d7ca4-2beb-407e-89f9-ab57b0a881c2	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719898/training_image/image6.png	0	t	2026-03-10 15:29:59.658
9d388c1e-f73e-4bbe-969c-af1ccd30d6d6	574165f3-f4d4-4572-bc08-9fc4a59d6d85	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719889/training_image/image7.png	0	t	2026-03-10 15:29:59.663
453167ba-d870-4a3e-803c-6db504948ca1	3234362f-1a88-4a01-920e-3d3bc8b606bd	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719885/training_image/image8.png	0	t	2026-03-10 15:29:59.667
a2fa15b7-a50c-4713-88ea-3358a221c02e	50f6c225-6d44-49b2-a48a-8a75ad3d2788	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719878/training_image/image9.png	0	t	2026-03-10 15:29:59.672
a18eb131-8772-4f73-8023-1bddacef30e2	04d8d4c8-263f-479d-9bf9-cb6747e61fb3	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719875/training_image/image10.png	0	t	2026-03-10 15:29:59.677
162039de-f322-42d3-9541-ec803e001557	21f96412-b647-4c20-84be-770c2a3854d1	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719872/training_image/image11.png	0	t	2026-03-10 15:29:59.681
c41b9b8b-d416-47d1-b3fd-f396ce2320b4	8a3b4dab-dcd0-477c-9c24-e5218c548155	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719869/training_image/image12.png	0	t	2026-03-10 15:29:59.686
a7e25aa6-b3be-403b-91aa-e102fed13b01	768ed5ee-454f-4e4c-9a97-87270baa9c7c	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719861/training_image/image13.png	0	t	2026-03-10 15:29:59.691
eefc8b7f-c915-4db1-99c6-1eac0bf39521	94b3a1ec-dbd3-48d1-a89e-9c3be9afa18e	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719858/training_image/image14.png	0	t	2026-03-10 15:29:59.696
4f20095d-bee8-4706-8cbc-aad7e922d382	b3044c9e-d7f9-4600-b431-96b5de1439f7	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719852/training_image/image15.png	0	t	2026-03-10 15:29:59.7
84c4a17b-0084-46b7-a493-6f7b01c8753c	f38c0f5b-9736-4661-a28b-ecd7ef43a21a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719849/training_image/image16.png	0	t	2026-03-10 15:29:59.706
de59b51d-3c3a-40d7-b360-c1c4bfad6cae	1794ede0-00ae-4cf1-b132-b23d1a87dc30	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719836/training_image/image17.png	0	t	2026-03-10 15:29:59.71
1bc7af96-99f5-4978-b8db-64cfedb16326	e2135a13-1192-49a1-88eb-1d37b5837e77	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719824/training_image/image18.png	0	t	2026-03-10 15:29:59.715
fe7aa879-588f-4202-9306-ddbc2a953470	f6163764-be41-4dd6-b03c-3b1757537fd5	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719816/training_image/image19.png	0	t	2026-03-10 15:29:59.72
9e6aa37a-8847-457c-b4f2-3edcb545ad11	80b91191-1c8f-4636-aff1-abb21d1aa9ed	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719814/training_image/image20.png	0	t	2026-03-10 15:29:59.725
1c5d9896-eefa-4d73-9f85-e65b4dfc9c8d	688b9eec-aca4-41d2-b851-ac90f3ec10b6	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719811/training_image/image21.png	0	t	2026-03-10 15:29:59.729
bd50a2ac-a3d9-4642-b433-2746ade8b1e1	f6295da0-7bfd-415f-a3b4-80e970e83917	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719809/training_image/image22.png	0	t	2026-03-10 15:29:59.734
63c3e4d8-e4f6-44e4-930f-1a1ad568562b	404fd6f1-0230-4f79-a12e-dc45cae2c345	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719366/training_image/image23.png	0	t	2026-03-10 15:29:59.738
56b6f8be-b03b-4e49-a1c1-5c2d53c4a763	9ac7bce6-cefb-415c-83a6-d342b1e15e6f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719369/training_image/image24.png	0	t	2026-03-10 15:29:59.743
aff6a336-c28d-49bc-b557-40822cd128a5	4cfd6be6-223c-4cfc-9cb9-672420f91651	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719806/training_image/image25.png	0	t	2026-03-10 15:29:59.747
4f02a0f9-1046-4826-910c-5c772fcf29df	aee8c24b-5c5c-4937-ab0d-2f6ee5fd1a83	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719370/training_image/image26.png	0	t	2026-03-10 15:29:59.751
b477dcf9-f50f-4220-aac7-9ed8ce451653	d9a30be6-508e-42f2-95e9-8dd2da8ff004	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719798/training_image/image27.png	0	t	2026-03-10 15:29:59.756
11fce246-4a01-4b48-b6e3-aa418d30fa70	4f72f54c-43cb-472e-84b1-293bc9e1e926	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719372/training_image/image28.png	0	t	2026-03-10 15:29:59.76
9923cf13-ad28-4db1-9b22-46d2f65c7fb5	e7528e83-9976-415a-a424-8c0d7f9e0a2a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719795/training_image/image29.png	0	t	2026-03-10 15:29:59.765
1a0cb40a-6188-4e06-b17c-fe63379538f7	350854e1-38d8-4975-b50c-2162a9f3a1a8	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719788/training_image/image30.png	0	t	2026-03-10 15:29:59.769
a8270293-4116-4dad-bca7-f756223e817a	8b8cb0b5-9ceb-4d8e-96de-7ca53f3d3385	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719778/training_image/image31.png	0	t	2026-03-10 15:29:59.773
fe49c207-79d1-4dd7-a1e2-ff0f3eaf11ba	7299dbb0-5a23-4c6b-85a1-c4fbb6272394	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719774/training_image/image32.png	0	t	2026-03-10 15:29:59.777
f39abc5f-8fb9-44ab-b953-ee0aa1644f2a	d35b0ca5-254b-413e-bf71-4e689f8f895b	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719771/training_image/image33.png	0	t	2026-03-10 15:29:59.782
76bae8c1-5e2e-47f0-9cfa-f82870437c94	520f7591-490d-458f-9aa3-77588a70d063	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719768/training_image/image34.png	0	t	2026-03-10 15:29:59.786
cebb070d-9256-4b76-b210-43d573077bc2	a0da619b-8ba4-4a14-8b67-ed3c58f0bfac	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719765/training_image/image35.png	0	t	2026-03-10 15:29:59.79
249a45d0-c145-4cb9-a47a-9a51b7f73082	34e06029-f4e7-40ab-8ec6-288e1068cb51	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719763/training_image/image36.png	0	t	2026-03-10 15:29:59.795
ae5b689d-87bf-4944-a14b-0b374a577bde	a6148d0c-73da-4222-8057-dbc286698fbf	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719760/training_image/image37.png	0	t	2026-03-10 15:29:59.799
8cfd2ed5-49a0-4c90-b200-188b6f27f871	80a8494f-f9b2-4e06-93b2-8ec5c46a735e	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719757/training_image/image38.png	0	t	2026-03-10 15:29:59.804
70288650-51df-4a38-823c-0a19639cafac	670830c3-496b-44de-860a-a682db16cd10	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719754/training_image/image39.png	0	t	2026-03-10 15:29:59.808
3f6186ea-3a84-4d56-9622-f188fe4cb7fe	4a63288f-69cc-49d4-a141-446af66616d9	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719745/training_image/image40.png	0	t	2026-03-10 15:29:59.813
4b004669-6b4c-430f-b2ec-fb1ac85e4bbb	4189a84e-0868-4320-9b48-1d49bb2f218a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719737/training_image/image41.png	0	t	2026-03-10 15:29:59.819
9f3338e7-6a75-405c-ac3c-1c7c1d2f94b8	f21397f5-55f4-4108-b196-71cea81e7a81	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719733/training_image/image42.png	0	t	2026-03-10 15:29:59.824
dffe3314-ba33-4153-9f5e-5a6721f343b9	62127a9c-691a-4302-88c2-a973a39e9abb	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719730/training_image/image43.png	0	t	2026-03-10 15:29:59.829
6196eb8c-25f9-4ed3-9126-704e2080ea05	f2d852f6-2106-4e1d-b5be-5bafc8094b56	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719728/training_image/image44.png	0	t	2026-03-10 15:29:59.833
2506006c-980f-488c-8c8e-ceafe4a1af4e	21cbb094-2ba0-4080-b245-5a96674d9279	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719725/training_image/image45.png	0	t	2026-03-10 15:29:59.837
5bc3225b-70ec-4540-8cdd-b8bf2a75eaa4	9e9c5730-5b41-43fe-86ee-a25cec797498	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719723/training_image/image46.png	0	t	2026-03-10 15:29:59.842
3efff66c-7ac0-4e6f-b296-d513bf0eced6	16b26acb-acfd-4113-806d-31ef93b6af10	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719720/training_image/image47.png	0	t	2026-03-10 15:29:59.847
5f0d16fa-74d8-46c8-a9fb-6d63ebabbef2	445ea423-7a7d-49ef-b3bd-346ba7f34c44	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719718/training_image/image48.png	0	t	2026-03-10 15:29:59.852
2fbc11b7-1a4c-4ad3-a124-b8f65ac92453	0ca707b7-f4f8-4038-afdf-5ac00c1aace1	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719716/training_image/image49.png	0	t	2026-03-10 15:29:59.856
23da458e-7531-48f2-83fc-38b5cc20fd3d	98dca101-2db3-45ec-9828-5b0ae8309426	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719714/training_image/image50.png	0	t	2026-03-10 15:29:59.861
ac9ade1f-ff68-40a7-ab92-0f1af67a175f	e340ed0a-bcf6-43d5-a41f-a71ed76e6a60	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719712/training_image/image51.png	0	t	2026-03-10 15:29:59.865
0c8e2a6d-5eb1-4fe3-9393-d44fa9e4e7cf	5e10d861-fa2c-4102-b80d-720315a8da9a	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719710/training_image/image52.png	0	t	2026-03-10 15:29:59.869
fcf06378-e369-4252-a76b-87c18129c02d	05dae7e0-de99-4c9a-ba94-f721c94fd342	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719708/training_image/image53.png	0	t	2026-03-10 15:29:59.874
8962a6a0-4768-4cae-aaad-379ecaa9dae9	69e6a501-59e3-4312-bbff-2d76bb399622	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719706/training_image/image54.png	0	t	2026-03-10 15:29:59.878
9b21bf4c-60a5-45e1-af2f-b1c28973efd5	b6b5941f-d58b-46aa-8c43-30ca77c08dfa	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719702/training_image/image55.png	0	t	2026-03-10 15:29:59.883
d526a767-5f7a-49a3-a279-4a921189ec25	be12dfad-e927-4179-91ec-fabb4c927c8f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719699/training_image/image56.png	0	t	2026-03-10 15:29:59.887
e76113bb-cf8f-4166-8e43-d1e4a9c0131d	2e237b2e-b9ae-4bd8-acb2-a7c57e90caae	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719696/training_image/image57.png	0	t	2026-03-10 15:29:59.892
21bd08ff-e1b5-4d10-8dd5-b680c130fce5	7f1d4a93-74df-4287-a657-f1e12c5cd404	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719694/training_image/image58.png	0	t	2026-03-10 15:29:59.896
4a95d293-8a79-4be4-a384-233301abe5ff	a1b38db9-8a66-4ed5-bf0c-2e12d35b9708	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719691/training_image/image59.png	0	t	2026-03-10 15:29:59.9
5efcab9b-dbf6-4a3a-9b83-676522366e00	7c385a7f-da06-4995-8e00-59737176a0ba	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719689/training_image/image60.png	0	t	2026-03-10 15:29:59.905
b7f3f331-b41b-440e-9831-afa55128d3c4	54a177a5-94aa-4497-b9b6-ee0853f048dc	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719415/training_image/image61.png	0	t	2026-03-10 15:29:59.91
c767db88-1eba-4e99-90fc-3e0a595f5e4d	80ed87d2-f3f5-4aa3-9065-19079fe19840	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719413/training_image/image62.png	0	t	2026-03-10 15:29:59.914
d8f8441c-e3bc-41c0-9bb2-da5382ca8fcd	f1f0805e-2dee-4f6c-be07-0482f0b9d968	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719410/training_image/image63.png	0	t	2026-03-10 15:29:59.919
bc9c195e-db82-4ed8-bf05-4659328fd185	ec3ee48f-3c4d-4c66-8aea-e21ca52a61df	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719408/training_image/image64.png	0	t	2026-03-10 15:29:59.923
1c2a5603-3830-460b-a7cc-ccff1d575778	af0029d2-e461-487a-b51d-478d492b98d2	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719405/training_image/image65.png	0	t	2026-03-10 15:29:59.928
911dffcb-3bbf-41d5-9149-b013a222c214	d18402ed-70c8-434f-ada4-6de29547b1d3	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719402/training_image/image66.png	0	t	2026-03-10 15:29:59.933
6399f48b-ebfe-4f8a-9317-7fee78a568de	5cde045d-2c27-47d2-8e96-583a3709e40e	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719399/training_image/image67.png	0	t	2026-03-10 15:29:59.938
4e81370c-9c22-434e-997f-a9fe6716276c	ffbdba7e-e827-4bb2-a41a-41de8334fa3f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719375/training_image/image68.png	0	t	2026-03-10 15:29:59.942
561c2438-fdde-4ed3-a813-58901418dbad	a4482be6-5aaa-4881-8000-2d7d5c9a4abc	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719396/training_image/image69.png	0	t	2026-03-10 15:29:59.947
a6ce7a18-85e9-40ed-8fa1-bedd6420227c	9baba453-2c7b-46d5-b62a-95527141b5d9	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719377/training_image/image70.png	0	t	2026-03-10 15:29:59.952
8b0aea26-4d92-4a0e-8f0f-91ca41337afc	d219d7c1-0983-4169-a37d-2d4a3a0b22aa	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719393/training_image/image71.png	0	t	2026-03-10 15:29:59.957
60b470a5-f361-41ad-a879-029fbf861609	043ad54a-e940-4799-89b8-6498f27ba7c8	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719390/training_image/image72.png	0	t	2026-03-10 15:29:59.962
5444e05c-21e6-49a2-8918-df2fc023e1db	4358f3ad-cd8b-4dd7-8c1c-7195b9078c8f	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719386/training_image/image73.png	0	t	2026-03-10 15:29:59.966
8d4f91ab-373e-4413-9f62-7c2adad75b09	7d2b3aa2-cd8c-45cc-a2da-4e6f481aa525	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719383/training_image/image74.png	0	t	2026-03-10 15:29:59.97
8f4b4de5-0a0e-449c-9fc8-9c823218dfc9	b659314c-e987-43c6-a21c-0938ff277115	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719380/training_image/image75.png	0	t	2026-03-10 15:29:59.975
274daaa1-fce3-4675-8f6a-1227dd2a04d6	292ba2f8-6980-4244-83d6-f6999c22ba5f	https://res.cloudinary.com/dxfxicebq/image/upload/v1773246688/try-ons/mncinwids5tbnubslz9g.jpg	0	f	2026-03-11 16:31:30.605
dcd003af-4f28-44fe-8e6b-8073e3f97633	34f3b995-f0eb-4e33-9466-94f3175e5594	https://res.cloudinary.com/dxfxicebq/image/upload/v1773247420/try-ons/zvx7hfx6opivutupfahd.jpg	0	f	2026-03-11 16:43:41.959
35804e21-41e5-4981-a3d2-30eeeed6f123	5bb799e7-3e68-4a53-821b-6959ba3a3038	https://res.cloudinary.com/dxfxicebq/image/upload/v1773328107/try-ons/k9omzdqqm0go9h9ua4ih.jpg	0	f	2026-03-12 15:08:28.09
2ddcbd6a-ca60-49ff-a079-e62fb90fa319	35dc3bae-1f49-478b-b03a-67951f970589	https://res.cloudinary.com/dxfxicebq/image/upload/v1773675702/try-ons/fiuvgyhtxk53ypaijnlu.jpg	1	f	2026-03-16 15:41:42.868
61d04d78-1c61-4679-8252-d07c2efffe76	35dc3bae-1f49-478b-b03a-67951f970589	https://res.cloudinary.com/dxfxicebq/image/upload/v1773675702/try-ons/xdcp9orcqrwbhokkivwm.jpg	2	f	2026-03-16 15:41:43.368
632d30ef-3ccd-4330-9568-d4f4ca74cede	35dc3bae-1f49-478b-b03a-67951f970589	https://res.cloudinary.com/dxfxicebq/image/upload/v1773675702/try-ons/a0pfs62yjnpjrp4fjwp7.jpg	0	t	2026-03-16 15:41:43.537
8a979c7c-93b5-45c3-83b1-b2b38fd1b3da	9745e086-a43f-4d80-a278-ff8484c4baa9	https://res.cloudinary.com/dxfxicebq/image/upload/v1774364946/try-ons/qnxyr8pimzhywkdn1djy.jpg	0	t	2026-03-24 15:09:07.491
43e66abe-e587-48d8-90be-4fcaaf6e1165	cb7f9861-d486-4e71-8ce8-4bed8daf278f	https://res.cloudinary.com/dxfxicebq/image/upload/v1774364949/try-ons/yjywkpzo9cgba978df0a.jpg	0	t	2026-03-24 15:09:10.555
cd8e5015-9320-4b46-8e5b-c7d04b353907	e1ca2303-1441-4355-a42a-d51c347e574a	https://res.cloudinary.com/dxfxicebq/image/upload/v1774381684/try-ons/o6qbpzfgm5quextonqst.jpg	0	t	2026-03-24 19:48:05.44
4377224c-97eb-429e-93b6-f6370a9078ca	a27506e0-8bff-4b84-8411-d5902d85f1b8	https://res.cloudinary.com/dxfxicebq/image/upload/v1774459105/try-ons/ai5wosqcntovbjunxs7y.jpg	0	t	2026-03-25 17:18:27.223
bb6338b9-80bf-41ec-8312-dcd816ff7bc5	a27506e0-8bff-4b84-8411-d5902d85f1b8	https://res.cloudinary.com/dxfxicebq/image/upload/v1774459105/try-ons/vvfoii9w58l85kug6atl.jpg	1	f	2026-03-25 17:18:27.223
2bd08233-e4c5-4430-abfe-ef9e59dbead7	a27506e0-8bff-4b84-8411-d5902d85f1b8	https://res.cloudinary.com/dxfxicebq/image/upload/v1774459105/try-ons/cbxcxdlsoxk5ehftyq0a.jpg	2	f	2026-03-25 17:18:27.223
\.


--
-- Data for Name: ProductStat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductStat" (product_id, views, likes_count, comments_count, last_updated) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (user_id, email, password_hash, phone, status, created_at, last_login, refresh_token_hash, role, max_try_ons, try_ons_used, date_of_birth, try_on_permission, phone_verified, has_created_aura, max_avatar_regenerations, avatar_regenerations_used) FROM stdin;
4cc9dbd3-8a62-45d2-ac53-2b37d1a65d4b	admin@aivestire.com	$2b$10$AQqlISIcBQcOjrU60YomWei4pwmVyxm.2OJBUCr3/yG6E2pU5giyi	\N	active	2026-03-10 15:20:26.558	\N	\N	ADMIN	3	0	\N	NONE	f	f	2	0
3d4cda33-5e33-45f1-8a79-562aa7f07eb1	atulraina889@gmail.com	\N	\N	active	2026-03-10 15:28:42.613	2026-03-28 18:16:51.128	$2b$10$gN.qWyY/Rv.6RrbYhPQVouSQEoPh8Eq3ZlFKpeXko01bqXRviw/re	ADMIN	3	0	\N	NONE	f	f	2	0
51c7b1ee-5bf4-46c5-b285-bdeefa1c484f	collections@aivestire.com	PLACEHOLDER	\N	active	2026-03-10 15:29:58.924	\N	\N	CREATOR	3	0	\N	NONE	f	f	2	0
be6b282a-4785-433e-8813-5f8ed890ec89	atulrainadec@gmail.com	\N	\N	active	2026-03-10 15:22:06.973	2026-03-10 15:43:32.377	$2b$10$2w50TCgiRxrKlIIb2vDCIeEqitkJAYUP3nuukYj3tBh5Jjdmx7dzW	BUYER	3	0	\N	NONE	f	f	2	0
25ae96d6-4433-43e1-8ca3-57a4721227fd	dev@gmail.com	$2b$10$OClJIO9FRrodUj7saRZ6FuJdih0Y1BnxafhL3sCXUdCe8VGyc.3J2	+919655238596	active	2026-03-17 18:03:01.902	\N	$2b$10$PZFzwIevP4zG6hHguh217.BcG5Q4EqURPalXbvfwvlNrM9KD.2SJW	BUYER	3	3	2002-12-12 00:00:00	NONE	t	f	2	0
866778ad-ccf3-48e3-98b1-b243cb94686d	designer23@gmail.com	$2b$10$K1HqEoBdQ5FdRWZYRGnrGO1wpMCHta/oyQM.ULZnqmXPFZkqbSGv6	+919622387285	active	2026-03-10 18:12:11.022	\N	$2b$10$KxvN1GvnrqrzDaGUI4hZsuS6uMxW5fCZxGw1ficE.q9KaC3mzaaIa	BUYER	3	0	\N	NONE	t	f	2	0
c7941d8f-c16f-4428-bcfd-a7bae381dde9	devds@gmail.com	$2b$10$7j2cQzo.6gNrt13nUPZStOvyxxdpnIt040AxyQTD76W4QufGhkgWC	+91965252585	active	2026-03-23 15:44:54.513	\N	$2b$10$buMaLFyIfGKqIO3tU/lqX.AUOFD9Jfq8XyX8A/24yDM7oS4QPIzFW	BUYER	3	0	\N	NONE	t	f	2	0
23cd1a61-dc15-44f4-a557-cb88230fe838	designer@123gmail.com	$2b$10$o3CRye8HJWvmdGkikgjp/eKOjG0wljTUuQDSCbfjDwommdrSBWpG6	+919622387548	active	2026-03-24 15:07:54.485	\N	$2b$10$x6xcn6WfsXfRnycavMvO..rwgOJF4bAfmR08pWx0/pZ0bPBRrpCeO	CREATOR	3	0	\N	NONE	t	f	2	0
2e357653-09b9-4ffa-b9ad-12d0706f698a	bug@gmail.com	$2b$10$9iA9DG0hV51DU7gtVHD7dOcM/4rxbnxZfxvIDGPov8zCsWXOmXeIy	+919622387286	active	2026-03-24 15:12:24.608	\N	$2b$10$Roi7pQ9qoLpElvAKBwv3YOBQLR3HxfJ4.tYK3Jj9M8S1sHEPNHvKi	BUYER	3	0	\N	NONE	t	f	2	0
61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	designerA@gmail.com	$2b$10$MQldnz4vVo89NTi5GLdIw.osv0aSCqwd0p1PNq1noIoyy01A8tIUO	+914858785755	active	2026-03-22 10:26:56.107	\N	$2b$10$5SFAGmF.mlVMvx25UpcjJu1baob92aAk.g2rqPpGkNh9R.23az9YK	CREATOR	3	0	\N	NONE	t	f	2	0
4f70d293-f018-4009-b68b-8945db2acbcc	user@example.com	$2b$10$58bfEoN2vrSquX9vkbCTPee15j64AKyNPZZG6wAkB25pPM3TufqDO	+919622387287	active	2026-03-14 12:04:35.785	\N	$2b$10$EgF1PkHS7.vpcmozJf7E3e.RiokX25KK80YmbUlv.uws3zPVz4X3i	BUYER	3	1	\N	NONE	t	f	2	0
0269251c-81c1-47e0-b72e-9a6538397cba	designerJaadu@gmail.com	$2b$10$jjGQsHqNCXm1mZI5F/yy2u1N7Pl0DjTXchXA1UOnBtScfHgaS.xPS	+919622387288	active	2026-03-10 18:13:26.585	\N	$2b$10$GqH48ZMnmGW6DClYMOsXnufk5Yu8Z/ioVsccnf/YFbFG5hnO4x906	CREATOR	3	0	\N	NONE	t	f	2	0
a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	atuldonuu@gmail.com	\N	\N	active	2026-03-18 14:38:36.762	2026-03-28 18:32:13.16	$2b$10$7CVsqw.XLBlBJkKnRmi.zOJZsqQYi5vk7MFk5XXX.nNsHbYZmuJUW	BUYER	3	3	\N	NONE	f	f	2	1
8682a537-a9d4-47fc-aa6b-4ca4e635401e	designer@gmail.com	$2b$10$U86hzD8SCZhdPx8.h1IINO6/gtQOBGZhD/jsfXFynB1oRykHlBnTi	+919622387285	active	2026-03-10 16:59:09.801	\N	$2b$10$8lHffWfHEbPuNjyJgJepjuNRqqWgV.q32gJjzdXchvK3wel..7QKO	CREATOR	3	0	\N	NONE	t	f	2	0
1df5c992-5033-4efa-a78f-6f69bc8ec9fd	designerff@gmail.com	$2b$10$tEeniGi2XxbDBjsYeUsG8.hKft1sQ/ofE02s6dREDL3w9KZxzMi7G	+914858785755	active	2026-03-18 18:08:28.847	\N	$2b$10$e4WiOIE27KmOTlgBrcTo9epL2wmLKr3LMfIVcUP2LmvNwmujPDPT2	BUYER	3	2	2002-12-12 00:00:00	NONE	t	f	2	1
23d3d707-c107-40c4-ae87-feb0cc8812a8	atulraina.cse25@jecrc.ac.in	\N	\N	active	2026-03-16 18:06:05.207	2026-03-17 18:01:49.052	$2b$10$9R.NnZ3U2rV.Q3MnsOwD7egYAPB5Y8ft0URqHHcv6LZe9P5mJvARO	BUYER	3	5	\N	NONE	f	f	2	0
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
18a3a692-828c-4b6a-a996-c865f88064ec	f80fdb0b26c58d9e6f88d3af6af3136e07167a9a073e771c2bf11b49525f9fca	2026-03-10 15:16:36.258047+00	20251121195930_init	\N	\N	2026-03-10 15:16:36.21811+00	1
9527fabe-8f9b-4355-924e-8ca15cdc5c38	9ba0f204a7b7221806dc65fac5c829778f63058f81982947304618cbd1c6657d	2026-03-10 15:16:36.354421+00	20260112150000_add_angle_to_tryon	\N	\N	2026-03-10 15:16:36.349136+00	1
9e4cd9ca-6d62-4ed3-831e-c43c4cba7806	9509f1595e4da651dc000dfb035dd9e32b0d14642d1e1c099d0782f1d5121c50	2026-03-10 15:16:36.262344+00	20251122055954_add_role_refresh_token	\N	\N	2026-03-10 15:16:36.259049+00	1
bd92063b-a6d2-4f2a-b5ae-e4381b9c427e	4cabf1b6b5ad8de44d6c268a52c1221e03d4b1e464fae640455ef8c803562e3e	2026-03-10 15:16:36.275794+00	20251122112559_add_order_review_models	\N	\N	2026-03-10 15:16:36.263312+00	1
e9d8b703-1714-4b11-a345-fb4e2c0c4bc5	e1e5b2fc78351ac587082a2163ee78df5ba8238bbedf399a326cd77baa8d769a	2026-03-10 15:16:36.439753+00	20260209000001_add_enterprise_cart_system	\N	\N	2026-03-10 15:16:36.408467+00	1
a0d77029-e114-4c8c-b879-7b989e84597e	a44d5b0aefcd457da5d94ddb199beb6a5b9b1bc1a700ba386895008b14ef6f2b	2026-03-10 15:16:36.283222+00	20251124205459_new	\N	\N	2026-03-10 15:16:36.276917+00	1
74b8a77f-46cb-4b81-8f10-1efb652000dd	9b04d81127f04675ee9860dd25d972dc4599e27715f53ac4b9f0587605dc113b	2026-03-10 15:16:36.360003+00	20260113214504_add_tryon_caching_fields	\N	\N	2026-03-10 15:16:36.355374+00	1
62020416-7dfd-4df5-ad71-f1b2d8c334f7	5c5583df3da1aa51c4a432790f017a7bb439bfb85ba8fd43fead804d2086ee74	2026-03-10 15:16:36.295566+00	20251203201409_add_aura_model_url_and_attributes	\N	\N	2026-03-10 15:16:36.284291+00	1
098c82df-1ba6-4199-9d9b-7f86c3f4e3c0	bf07c53bc81ba919f8a5fab01ae7f805da581f14e398dd632604799ebdfa2ed6	2026-03-10 15:16:36.299767+00	20251206213103_add_featured_and_category	\N	\N	2026-03-10 15:16:36.296544+00	1
fe1d6666-70fd-4f64-aa84-01cb745d1c0d	a622c4d0aff1edef4a38a70c76c885264fd8b8a90eceb753b6a1dac2387bb107	2026-03-10 15:16:36.313194+00	20251208182442_add_likes_comments	\N	\N	2026-03-10 15:16:36.300874+00	1
1fcc6181-cf6f-428a-9c32-d8639655c9e6	98ec757846953502ac3b6be6e577757cf6e43ddb70d50d75ca59f7cd8ca1eaa4	2026-03-10 15:16:36.364204+00	20260117012900_add_product_metadata_for_recommendations	\N	\N	2026-03-10 15:16:36.361035+00	1
6d1f6baf-96b4-486a-9dbb-c51c49f42c35	21b58788856741c17d962908a46bce012b71675b8dce8fa8091740fc6b906f45	2026-03-10 15:16:36.324334+00	20251225124507_add_try_on_tracking	\N	\N	2026-03-10 15:16:36.314245+00	1
0089d8d3-dbb9-4c9d-95ee-c4faa4811705	d31795c0a3dc3bd596e1be973f9b586b0da8e167ea33fa707c93ce9f11174eb6	2026-03-10 15:16:36.328896+00	20251226151831_add_creator_terms_acceptance	\N	\N	2026-03-10 15:16:36.325409+00	1
2f5209fd-8e8d-4aa5-8a3e-e263bfd0a0c6	8993c1d209d893f936a595b8d4ede4348f63cfa79489ffd8d393983dd1953a04	2026-03-10 15:16:36.334009+00	20251226175816_add_creator_terms_fields	\N	\N	2026-03-10 15:16:36.329986+00	1
46a8d63a-e55a-42eb-9288-2a46877d70df	052854747d4f3015e53d716f28715e620e861f52ab6782e4d950e75d0c3d7d3c	2026-03-10 15:16:36.368112+00	20260118041000_add_body_type_to_aura	\N	\N	2026-03-10 15:16:36.365394+00	1
c5f6a382-c638-41b4-b8a2-c546eabfd72b	7226d239068605805a6a2511759fde0cd512ff34cbffa6a3c339f127438352d4	2026-03-10 15:16:36.337969+00	20251228100157_add_optional_dob_to_user	\N	\N	2026-03-10 15:16:36.335009+00	1
d182b2ca-9625-49d4-b99d-e870b18306ca	8061f722de2d5167e6165f05f1f6e1173738b2ee558932055f1ca3a678296a36	2026-03-10 15:16:36.342114+00	20260108000000_add_provider_to_tryon	\N	\N	2026-03-10 15:16:36.338983+00	1
b1fec8e1-2b31-4a03-ac14-36f344e63e3d	1ac00e7f3331ec7c2f0c00dc557486f0ca56bcc4ac5ce18e92050d3de13b5275	2026-03-10 15:16:36.49935+00	20260214000000_create_oms_tables	\N	\N	2026-03-10 15:16:36.440843+00	1
67268b3b-d5f8-4712-9b9c-be2f426359fd	30960412f6004fcf02ff0c189c9186ae9df09fa392cdcb1df601491ecc02cdb7	2026-03-10 15:16:36.348066+00	20260112140000_add_try_on_permission	\N	\N	2026-03-10 15:16:36.343131+00	1
fa3c7793-d739-4e44-8459-1ea3096995af	07ff4501d8b3f5005e796d32413bbbbe932dcfa6c3ee413060cfbcda1507f7e2	2026-03-10 15:16:36.372308+00	20260120144600_add_body_size_to_aura	\N	\N	2026-03-10 15:16:36.369096+00	1
0134b534-3c92-46e9-a18b-1dd348c60966	e65df7e319bce36f049a4bbc91b905a49b72ecfb7dda0538dd63a10cd12443ff	2026-03-10 15:16:36.382241+00	20260131000000_add_phone_verification_and_otp	\N	\N	2026-03-10 15:16:36.373337+00	1
e3cf7b68-875e-43be-9de7-901e22abf381	15d5f4657dbffa338ea40891e08fe9c31dfd1ff1713d31c02967a74de9a394e8	2026-03-10 15:16:36.393799+00	20260208000000_add_user_addresses	\N	\N	2026-03-10 15:16:36.383284+00	1
8d6e48a8-8b5f-48a9-9820-556c918bc3dd	7355dc1c702d2744625d59dad398147ea815c8e565fc9838fba5978ccddfe13c	2026-03-10 15:16:36.407381+00	20260209000000_add_wishlist_tables	\N	\N	2026-03-10 15:16:36.394979+00	1
644e0f12-120d-4b2b-a881-2c4cebedfe37	47e4371249ba7cacc194c8fc0226f7fd5d577385ee4cf532e8b68e7a2cf14a9b	\N	20260215_add_refund_return_replacement	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260215_add_refund_return_replacement\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "RefundStatus" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"RefundStatus\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1167), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260215_add_refund_return_replacement"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260215_add_refund_return_replacement"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:260	2026-03-10 15:17:12.144728+00	2026-03-10 15:16:36.500517+00	0
c70e16e3-5198-4882-b816-cc86de629ad3	47e4371249ba7cacc194c8fc0226f7fd5d577385ee4cf532e8b68e7a2cf14a9b	2026-03-10 15:17:12.152314+00	20260215_add_refund_return_replacement		\N	2026-03-10 15:17:12.152314+00	0
b418b691-4f34-44be-9458-edbd293ab73a	33a52c682533b5c952dc2c0fdceaa105c95abe49a76c14b4594d551ec96c38d8	2026-03-10 15:17:18.482919+00	20260219000000_add_image_urls_to_comments	\N	\N	2026-03-10 15:17:18.47212+00	1
e0e7335c-a174-465e-be03-a43422e9ec92	65b7e772eb671a6629218364732ade29a6ddd24f71725d7ab3664245c062adf3	2026-03-10 15:17:18.501692+00	20260219000000_add_payment_transactions	\N	\N	2026-03-10 15:17:18.483991+00	1
46878c41-1cca-4794-afa4-728a0ce3c520	f5c996b162f96cbf03d25a2a3595333120d0af936f6045c629cc7599476cbb45	2026-03-10 15:17:18.507335+00	20260223153000_enforce_tryon_and_avatar_limits	\N	\N	2026-03-10 15:17:18.502684+00	1
64247bce-5fbd-43de-8c28-eaf0f0d65687	b74f9bda1942f5f2fe609d5274f73561d9227546c4b5f357b7fc30fd28a389c0	\N	20260228000000_add_coupon_scopes	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260228000000_add_coupon_scopes\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "coupons" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"coupons\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(433), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260228000000_add_coupon_scopes"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260228000000_add_coupon_scopes"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:260	2026-03-10 15:17:42.350228+00	2026-03-10 15:17:18.508572+00	0
5545dc5a-dd61-43d1-9e1d-8e5ba2011256	b74f9bda1942f5f2fe609d5274f73561d9227546c4b5f357b7fc30fd28a389c0	2026-03-10 15:17:42.351779+00	20260228000000_add_coupon_scopes		\N	2026-03-10 15:17:42.351779+00	0
493ff4db-ad45-42a5-b8aa-15647224798f	6ed736967228fccba9bde7942b971f1d6be264465b8b4dd29835e3c76e58e3c6	2026-03-10 15:17:49.281518+00	20260301155000_add_applied_coupon_code	\N	\N	2026-03-10 15:17:49.271469+00	1
f6bd8a33-29d4-4f01-b315-dddede9b5aaa	ca772b39992f975d70f2baad27ee16adb94d3c85c7331b716cfb353dd5b3ac72	\N	20260305140000_add_birthday_anniversary_coupons	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260305140000_add_birthday_anniversary_coupons\n\nDatabase error code: 42704\n\nDatabase error:\nERROR: type "CouponScopeType" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42704), message: "type \\"CouponScopeType\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_type.c"), line: Some(270), routine: Some("typenameType") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260305140000_add_birthday_anniversary_coupons"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260305140000_add_birthday_anniversary_coupons"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:260	2026-03-10 15:19:22.10409+00	2026-03-10 15:17:49.282385+00	0
68526502-4698-4692-9946-20b77a5e1bfc	ca772b39992f975d70f2baad27ee16adb94d3c85c7331b716cfb353dd5b3ac72	2026-03-10 15:19:22.111796+00	20260305140000_add_birthday_anniversary_coupons		\N	2026-03-10 15:19:22.111796+00	0
6d2de935-be9b-4c80-88aa-3ced49a0201b	9b3def04b69a6dd378bbd5484081ce32ee03d9f9122e741511c15a0191a67693	\N	20260324000001_creator_upload_hierarchy	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260324000001_creator_upload_hierarchy\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "BodyShape" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"BodyShape\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1167), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260324000001_creator_upload_hierarchy"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260324000001_creator_upload_hierarchy"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:260	2026-03-25 15:44:46.822459+00	2026-03-24 17:58:28.604801+00	0
2d5b48c2-ac4e-4365-866f-7efa60e48143	762457f6ed95c2492a2c9b911101dfa840d9656f20cd9b5f77e25e0981640a83	2026-03-10 15:19:49.59914+00	20260308000000_add_wallet_system	\N	\N	2026-03-10 15:19:49.571518+00	1
eafb2de9-8b91-4ca2-b3a9-1fa0dd9eabdf	64fc6b37bd8788c5ceb72c8789b7783aa0d3b8b1d982b75b2072aa485bcddc86	2026-03-10 15:19:49.603502+00	20260308000001_add_wallet_payment	\N	\N	2026-03-10 15:19:49.600213+00	1
41b584e0-5f18-440d-929b-bb5aae773b77	99786721ff909ec6f6e30876eab8ea47dee8ccb95c4cd9616d996b19876c20b2	2026-03-28 14:00:16.722975+00	20260328000000_add_commission_percentage_to_product		\N	2026-03-28 14:00:16.722975+00	0
226272e6-bac1-40ee-b6bd-ebeb13771d75	2b985292d60a7940504a2af7de53e688e60e94dcaf8eb0364caacafda0d36395	2026-03-12 14:52:59.225706+00	20260312143000_add_product_recommendation_attributes	\N	\N	2026-03-12 14:52:59.216437+00	1
0d81ba01-5d3c-4f03-bea3-6fbdf800a08d	144635b570c760428c9dce3f15b6ebc411e476120393587027f2007c93bfed6d	2026-03-14 10:28:51.509179+00	20260314_add_categories_and_product_groups		\N	2026-03-14 10:28:51.509179+00	0
a0400176-d94e-4285-b33f-43f29566e590	bf41b72c991fbf852f5e3ab6df55088cca5e0928c532cd89ef4c5215caa3483f	2026-03-25 15:44:54.639074+00	20260227000000_create_coupon_tables	\N	\N	2026-03-25 15:44:54.623167+00	1
c75158d9-02c8-497e-9fcf-a2bea632ae02	e7ef44c554c49a40ff313057ed438756ab3b11c308ac7fdb8aa05737062c6e65	2026-03-17 17:40:52.310923+00	20260301000000_add_feedback_model	\N	\N	2026-03-17 17:40:52.285667+00	1
4fb16340-70bd-4c16-a544-3e5ad834cc48	e20bf612f10c2298959ff106683a06afaafbcaf4c92cb9e0c5bd940256fd1c9f	2026-03-17 17:40:52.31575+00	20260310113000_add_aura_tryon_model_url	\N	\N	2026-03-17 17:40:52.31202+00	1
a3e55df7-f072-46a0-a80b-ac7aa1a67704	92ba3dd72ddf2946a52a12c53940f3f45f2c9fa9435034191de3279839eb8e45	2026-03-24 15:27:24.782886+00	20260324000000_switch_razorpay_to_payu		\N	2026-03-24 15:27:24.782886+00	0
deb11c83-d717-463f-af67-f7d552b9427a	9b3def04b69a6dd378bbd5484081ce32ee03d9f9122e741511c15a0191a67693	\N	20260324000001_creator_upload_hierarchy	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260324000001_creator_upload_hierarchy\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "BodyShape" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"BodyShape\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1167), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260324000001_creator_upload_hierarchy"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260324000001_creator_upload_hierarchy"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:260	\N	2026-03-28 13:49:23.061195+00	0
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (cart_item_id, cart_id, product_id, quantity, size, color, price_cents_snapshot, currency_snapshot, added_at, updated_at) FROM stdin;
36a57471-1395-4b34-9de1-11189775922e	712a3b26-b8e4-489b-aed8-a803a80af8a7	f36e9fe2-78df-48da-a3a8-3becfa42f4b9	1	\N	\N	2357	INR	2026-03-25 15:49:12.258	2026-03-25 15:49:12.258
7079505b-4775-495c-a988-a2a9e3d8b8df	f8a50ed6-7246-40eb-bd93-b37df8a5f41f	cb7f9861-d486-4e71-8ce8-4bed8daf278f	1	\N	\N	200	INR	2026-03-29 08:55:46.698	2026-03-29 08:55:46.698
22281cd9-40e7-497b-be12-fcf0cb56384d	f8a50ed6-7246-40eb-bd93-b37df8a5f41f	faaf248f-a437-410e-b93e-b06ad2e5223f	1	\N	\N	2435	INR	2026-03-29 09:35:14.54	2026-03-29 09:35:14.54
96c51811-c0c3-4225-831b-6f763d16b0d9	f8a50ed6-7246-40eb-bd93-b37df8a5f41f	019de3cf-5093-43f5-8924-fba15cde10b8	1	\N	\N	2456	INR	2026-03-29 09:35:14.543	2026-03-29 09:35:14.543
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carts (cart_id, user_id, version, merged_from_guest, region, channel, created_at, updated_at, applied_coupon_code) FROM stdin;
08b05b06-0bf7-4148-a4cd-222eb00448e4	be6b282a-4785-433e-8813-5f8ed890ec89	1	f	IN	WEB	2026-03-10 15:22:07.131	2026-03-10 15:22:07.131	\N
792ab2e5-8085-4db8-8ac8-36fbd4cb92aa	8682a537-a9d4-47fc-aa6b-4ca4e635401e	1	f	IN	WEB	2026-03-10 16:59:09.991	2026-03-10 16:59:09.991	\N
7e1983c4-6875-450f-8d23-ea2b9171fb52	866778ad-ccf3-48e3-98b1-b243cb94686d	1	f	IN	WEB	2026-03-10 18:12:11.157	2026-03-10 18:12:11.157	\N
6db6b5b3-b941-4657-9ec8-3af5cb9c4993	0269251c-81c1-47e0-b72e-9a6538397cba	1	f	IN	WEB	2026-03-10 18:13:26.776	2026-03-10 18:13:26.776	\N
aaa8cf37-0a4a-4583-a9a4-18e77b54b15e	4f70d293-f018-4009-b68b-8945db2acbcc	1	f	IN	WEB	2026-03-14 12:04:36.02	2026-03-14 12:04:36.02	\N
2d9cebb9-19fa-486d-8023-799fcae8a794	23d3d707-c107-40c4-ae87-feb0cc8812a8	1	f	IN	WEB	2026-03-16 18:06:05.319	2026-03-16 18:06:05.319	\N
676fcb17-cfd4-4476-96ef-39b204bac000	25ae96d6-4433-43e1-8ca3-57a4721227fd	1	f	IN	WEB	2026-03-17 18:03:02.16	2026-03-17 18:03:02.16	\N
74f96c6a-7717-46de-a634-605e5964e87c	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	1	f	IN	WEB	2026-03-18 14:38:36.859	2026-03-18 14:38:36.859	\N
c495b94a-70aa-43ff-8b54-005c67bcaa2a	c7941d8f-c16f-4428-bcfd-a7bae381dde9	1	f	IN	WEB	2026-03-23 15:44:54.689	2026-03-23 15:44:54.689	\N
1c5245cd-0c70-4fac-8ec8-f1c82038e996	23cd1a61-dc15-44f4-a557-cb88230fe838	1	f	IN	WEB	2026-03-24 15:07:54.747	2026-03-24 15:07:54.747	\N
dccf54ec-4988-4c57-94fb-a65dd86712bf	2e357653-09b9-4ffa-b9ad-12d0706f698a	1	f	IN	WEB	2026-03-24 15:12:24.794	2026-03-24 15:12:24.794	\N
712a3b26-b8e4-489b-aed8-a803a80af8a7	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	2	t	IN	WEB	2026-03-22 10:26:56.337	2026-03-25 15:49:45.753	VACATION23
f8a50ed6-7246-40eb-bd93-b37df8a5f41f	1df5c992-5033-4efa-a78f-6f69bc8ec9fd	5	t	IN	WEB	2026-03-18 18:08:29.085	2026-03-29 09:35:14.544	\N
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (category_id, name, slug, description, is_active, created_at, updated_at) FROM stdin;
6352583a-6f9e-4b22-948f-baf9fb728adb	defhh	dsd	\N	t	2026-03-14 09:35:34.726	2026-03-14 09:44:17.249
62f04146-d27e-42fa-b214-c63edd60fe9c	Lehnga collection 	Lehnga,behga 	\N	t	2026-03-14 10:32:42.026	2026-03-14 10:32:42.026
781fcfba-41e3-4c7c-b274-5b2c83641ad3	Pents	Summer colection 	\N	t	2026-03-22 17:26:00.063	2026-03-22 17:26:00.063
\.


--
-- Data for Name: coupon_allowed_pincodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupon_allowed_pincodes (id, coupon_id, pincode) FROM stdin;
\.


--
-- Data for Name: coupon_scopes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupon_scopes (scope_id, coupon_id, scope_type, min_price, max_price, festival_key, company_anniversary_date, created_at, updated_at) FROM stdin;
fe007417-2e4b-4094-b1b1-c24922f75cd1	db48d28b-21c9-4ea0-9b64-46e420ecf0a4	PRICE_LEVEL	23.00	1000.00	\N	\N	2026-03-25 15:48:15.881	2026-03-25 15:48:15.881
5610f3cf-efcd-44b9-9b74-9be818aa6ca5	fcea8b14-5ad3-4c1e-a353-b5dbc1ee2ae5	PRICE_LEVEL	24.00	588.00	\N	\N	2026-03-14 09:24:25.072	2026-03-25 15:48:47.188
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupons (coupon_id, title, code, description, discount_type, discount_value, min_order_amount, max_usage, current_usage, status, reason, terms_and_conditions, start_date, end_date, created_at, updated_at, is_location_restricted, is_one_time_per_user, is_stackable, is_deleted) FROM stdin;
fcea8b14-5ad3-4c1e-a353-b5dbc1ee2ae5	pcs dev	SUMMER34		PERCENTAGE	58.00	25.00	1	0	EXPIRED	COLL DEV		2026-03-12 00:00:00	2026-05-19 00:00:00	2026-03-14 09:24:25.061	2026-03-25 15:48:47.18	f	f	f	f
db48d28b-21c9-4ea0-9b64-46e420ecf0a4	Holi Vacation Pack	VACATION23	Hello	PERCENTAGE	59.00	23.00	2	1	ACTIVE	Coll dev	\N	2026-03-25 00:00:00	2026-05-25 00:00:00	2026-03-25 15:48:15.868	2026-03-25 15:50:10.046	f	f	f	f
\.


--
-- Data for Name: creator_coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.creator_coupons (creator_coupon_id, title, code, description, discount_type, discount_value, min_order_amount, max_usage, current_usage, status, approval_status, approval_note, start_date, end_date, created_at, updated_at, is_deleted, creator_id, product_id) FROM stdin;
ff276b41-6859-474a-8bfd-0b7baaa891f4	Summerweh	0JO83V8G		FLAT	20.00	20.00	3	0	ACTIVE	APPROVED	\N	2026-03-25 00:00:00	2026-04-24 00:00:00	2026-03-25 15:55:41.703	2026-03-25 15:56:19.772	f	b317f4ab-75db-4b8f-8807-08dafa4e5246	e1ca2303-1441-4355-a42a-d51c347e574a
\.


--
-- Data for Name: delivery_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_tracking (tracking_id, order_id, location_name, location_type, latitude, longitude, status_description, delivery_partner_agent, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: guest_cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_cart_items (guest_cart_item_id, guest_cart_id, product_id, quantity, size, color, price_cents_snapshot, currency_snapshot, added_at, updated_at) FROM stdin;
\.


--
-- Data for Name: guest_carts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_carts (guest_cart_id, session_id, region, channel, created_at, updated_at, expires_at, applied_coupon_code) FROM stdin;
c97d7ac4-b7bb-40ee-bfcc-0eb9750524b8	dd2ccbfc-a5c7-4340-83e7-26cae1217dd1	IN	WEB	2026-03-29 09:35:21.826	2026-03-29 12:11:20.041	2026-04-28 12:11:20.04	\N
894a42df-1324-4a72-8df4-b2c653bafb6b	e8ac1f99-ad3b-4257-8b1c-9e4f5d57ec28	IN	WEB	2026-03-11 14:25:05.82	2026-03-24 18:11:35.7	2026-04-23 18:11:35.697	\N
d485ee98-1318-4162-a62b-90ca89e515fe	4745cab9-abf1-459a-a72f-2f424b037e88	IN	WEB	2026-03-13 21:00:35.205	2026-03-24 18:47:17.749	2026-04-23 18:47:17.748	\N
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (order_item_id, order_id, product_id, quantity, unit_price, total_price, product_name, product_image, variant_details, size, color, created_at) FROM stdin;
873c5372-2d8b-4e7b-a6de-09b7a26779f8	a6dfd403-0d00-4aff-bf48-3290e9a9b9fe	f5437d24-d4ba-4198-9d01-6f50422d7320	1	23.39	23.39	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	\N	\N	\N	2026-03-10 15:45:12.424
e8d9ae19-4498-4b8e-9a2e-3c61f5cc3129	a6dfd403-0d00-4aff-bf48-3290e9a9b9fe	65c603c6-4880-4b3d-9019-ec1a3ac08d55	1	23.18	23.18	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	\N	\N	\N	2026-03-10 15:45:12.424
51c015db-ecf6-4ea5-845f-ac834fcdf2e9	8dd441d4-953a-4e16-bd6f-b3fb4bd9d9dd	f5437d24-d4ba-4198-9d01-6f50422d7320	1	23.39	23.39	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	\N	\N	\N	2026-03-22 18:51:29.829
b9c33084-dc56-40d6-9412-df80bf279864	99599f5d-b7aa-4927-9cc3-b443424b401a	f5437d24-d4ba-4198-9d01-6f50422d7320	1	23.39	23.39	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	\N	\N	\N	2026-03-22 18:55:06.629
e21fba19-1ac4-4401-86c9-d987a7456940	4e0066b1-2e47-4898-b16c-993749557676	f5437d24-d4ba-4198-9d01-6f50422d7320	1	23.39	23.39	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	\N	\N	\N	2026-03-22 18:56:08.735
4b097d99-3551-4c8d-9e8f-98fa745c7205	3911b418-71a5-4881-80ca-8bfe376fbcf8	f5437d24-d4ba-4198-9d01-6f50422d7320	1	23.39	23.39	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	\N	\N	\N	2026-03-23 14:13:35.733
0ea780c9-22e5-4e8d-835a-a5549b718ab3	0b229d05-5e22-41d6-94d2-915efc62b983	f5437d24-d4ba-4198-9d01-6f50422d7320	1	23.39	23.39	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	\N	\N	\N	2026-03-23 14:14:49.581
efed9256-b8b2-477d-87bc-67a73960229b	7c7caba6-8d0e-4352-afa1-927729104297	f5437d24-d4ba-4198-9d01-6f50422d7320	1	23.39	23.39	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	\N	\N	\N	2026-03-23 15:12:50.091
86296af5-5605-4cf9-afb3-7d4a9cbea1aa	4a80b452-0957-450e-9da1-e59acfd0714e	f5437d24-d4ba-4198-9d01-6f50422d7320	1	23.39	23.39	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	\N	\N	\N	2026-03-23 15:34:52.187
3c3e8c42-8b33-4ff6-8046-388c3f12fddf	4a80b452-0957-450e-9da1-e59acfd0714e	05dae7e0-de99-4c9a-ba94-f721c94fd342	1	26.00	26.00	Bad quality formal outfit for Indian female in age group 26-35.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719708/training_image/image53.png	\N	\N	\N	2026-03-23 15:34:52.187
d6304643-e0a2-42bb-bbbd-8635fd2cfa65	159022e0-c181-4dfd-8d98-9dfd9e5c48e3	f5437d24-d4ba-4198-9d01-6f50422d7320	1	23.39	23.39	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	\N	\N	\N	2026-03-23 15:38:34.755
026ce137-b972-40ea-9b8f-19dcd22a823e	159022e0-c181-4dfd-8d98-9dfd9e5c48e3	05dae7e0-de99-4c9a-ba94-f721c94fd342	1	26.00	26.00	Bad quality formal outfit for Indian female in age group 26-35.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719708/training_image/image53.png	\N	\N	\N	2026-03-23 15:38:34.755
06af6412-4174-46d1-bde4-b6c41257bd7d	4651c63e-7f04-460b-91df-9230a41fd3a9	65c603c6-4880-4b3d-9019-ec1a3ac08d55	1	23.18	23.18	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	\N	\N	\N	2026-03-23 15:46:11.188
9c2a1d34-dea7-463b-8fee-e7f5b9fbdc28	aeca9717-b222-49d2-a781-abb7abd605d8	65c603c6-4880-4b3d-9019-ec1a3ac08d55	1	23.18	23.18	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	\N	\N	\N	2026-03-23 16:32:08.529
8f88c9b4-6b7c-4b93-98fc-bf7a62f20692	6478030e-cb9d-4a2a-8923-df290bc05604	65c603c6-4880-4b3d-9019-ec1a3ac08d55	1	23.18	23.18	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	\N	\N	\N	2026-03-23 16:42:34.715
8aa00694-82cd-48a7-8b5d-8c06c6a290f1	f16aa2d1-0404-4ed6-9f80-6bf4d8e4e3db	65c603c6-4880-4b3d-9019-ec1a3ac08d55	1	23.18	23.18	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	\N	\N	\N	2026-03-23 16:59:14.85
38c153cf-e96e-4629-8faa-769ca38e64af	4678b106-8e91-4d30-8205-2a001e9534d1	f5437d24-d4ba-4198-9d01-6f50422d7320	1	23.39	23.39	A pastel floral co-ord set made from breathable cotton-blend fabric, designed with a cropped top and	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718449/training_image/56.png	\N	\N	\N	2026-03-23 17:03:57.758
a7235ae9-887b-4ac0-8987-592242cdeea1	4678b106-8e91-4d30-8205-2a001e9534d1	05dae7e0-de99-4c9a-ba94-f721c94fd342	1	26.00	26.00	Bad quality formal outfit for Indian female in age group 26-35.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719708/training_image/image53.png	\N	\N	\N	2026-03-23 17:03:57.758
5893bf9f-832a-42e8-b78c-bde397f93f14	2f880071-5b9e-40a6-929d-f2bb5b81d8d1	65c603c6-4880-4b3d-9019-ec1a3ac08d55	1	23.18	23.18	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	\N	\N	\N	2026-03-23 17:09:51.876
44ffcaa8-d0d7-44b8-a64c-3497dd005695	3192e025-474c-42e8-ae18-4dc4f561e86c	65c603c6-4880-4b3d-9019-ec1a3ac08d55	1	23.18	23.18	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	\N	\N	\N	2026-03-23 17:13:00.027
168ba5ab-6b6e-47ec-bdef-52720775c126	44081b66-64aa-4311-bacd-76b9e7e6f653	65c603c6-4880-4b3d-9019-ec1a3ac08d55	1	23.18	23.18	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	\N	\N	\N	2026-03-23 17:19:46.084
13f31137-59c7-4e71-b59c-72eb4eb7391d	b7d5bdf3-f82c-4ab0-b542-be0eaede75f7	65c603c6-4880-4b3d-9019-ec1a3ac08d55	1	23.18	23.18	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	\N	\N	\N	2026-03-23 17:34:56.855
8ec5c06e-1845-4d1e-b7f0-df6b8293ed31	e89a86db-bd2b-42c2-a586-9fc1a0b998f5	65c603c6-4880-4b3d-9019-ec1a3ac08d55	1	23.18	23.18	A relaxed tunic top paired with straight pants in breathable fabric that prioritizes comfort while m	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718432/training_image/69.png	\N	\N	\N	2026-03-23 17:39:59.373
10850529-b532-4cbe-b7f6-ad3b7c710276	662e8130-84db-44ef-8e33-e99bf49299ca	5e10d861-fa2c-4102-b80d-720315a8da9a	1	26.00	26.00	Bad quality formal outfit for Indian female in age group 18-25.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719710/training_image/image52.png	\N	\N	\N	2026-03-23 17:54:10.966
efdf77dd-51be-4270-94d5-aec78368b3d9	7ab127c2-a72b-440d-b350-b84971fb66fd	5e10d861-fa2c-4102-b80d-720315a8da9a	1	26.00	26.00	Bad quality formal outfit for Indian female in age group 18-25.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719710/training_image/image52.png	\N	\N	\N	2026-03-23 17:58:33.6
64fb0b4e-8911-4e3e-8e28-244d1303080e	07232003-8f70-47a9-a9a3-b303def31419	b6b5941f-d58b-46aa-8c43-30ca77c08dfa	1	26.00	26.00	Bad quality formal outfit for Indian female in age group 51+.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719702/training_image/image55.png	\N	\N	\N	2026-03-23 18:05:01.507
3c5777ef-7dc0-415e-974d-ce0cefb7d6e7	8624dea4-be06-462f-9382-6bb1e341a6de	7f1d4a93-74df-4287-a657-f1e12c5cd404	1	26.00	26.00	Bad quality party outfit for Indian female in age group 26-35.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719694/training_image/image58.png	\N	\N	\N	2026-03-23 18:41:45.92
08442b8d-1ff5-4ba8-9a4d-df5ab4e7658a	1915df23-fdb0-492d-b8b1-51aec9e7c60c	7f1d4a93-74df-4287-a657-f1e12c5cd404	1	26.00	26.00	Bad quality party outfit for Indian female in age group 26-35.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719694/training_image/image58.png	\N	\N	\N	2026-03-23 19:40:55.69
6c5af293-1a1d-4cd5-aa3f-a91a647daee9	44d2efae-948a-44ab-a7d2-ae43aad0d6a0	7f1d4a93-74df-4287-a657-f1e12c5cd404	1	26.00	26.00	Bad quality party outfit for Indian female in age group 26-35.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719694/training_image/image58.png	\N	\N	\N	2026-03-23 19:42:17.23
7a2a233b-8ed2-47f3-bdef-0863c5fda3cf	2c84af2e-30dd-431b-b24c-f2b148a07645	7f1d4a93-74df-4287-a657-f1e12c5cd404	1	26.00	26.00	Bad quality party outfit for Indian female in age group 26-35.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719694/training_image/image58.png	\N	\N	\N	2026-03-23 19:44:28.846
990444e5-08fc-4422-bab1-ca5c9895cca0	36601eb8-942f-456c-9a0e-f13ad9c284af	cb7f9861-d486-4e71-8ce8-4bed8daf278f	1	2.00	2.00	Midnight true	https://res.cloudinary.com/dxfxicebq/image/upload/v1774364949/try-ons/yjywkpzo9cgba978df0a.jpg	\N	\N	\N	2026-03-24 15:13:28.664
763a56a8-f033-442d-a31c-f83332609b22	a01844da-4a2b-409c-88e6-875cdd1ef03f	f36e9fe2-78df-48da-a3a8-3becfa42f4b9	1	23.57	23.57	A printed wrap skirt paired with a fitted solid top that draws attention to the waist and upper body	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718429/training_image/72.png	\N	\N	\N	2026-03-25 15:50:10.03
31462381-c33e-4d9b-9f37-24124d6e48fd	6388c0fe-ee5a-4e69-8a91-cd52acd0c013	5e10d861-fa2c-4102-b80d-720315a8da9a	2	26.00	52.00	Bad quality formal outfit for Indian female in age group 18-25.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719710/training_image/image52.png	\N	\N	\N	2026-03-28 18:14:31.264
27eee734-2330-4dd3-b6f2-c48e137a0ec6	d1170234-ee53-4e7d-aae0-d1836da8bd49	5e10d861-fa2c-4102-b80d-720315a8da9a	2	26.00	52.00	Bad quality formal outfit for Indian female in age group 18-25.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719710/training_image/image52.png	\N	\N	\N	2026-03-28 18:23:35.934
e4ed9763-214b-49e1-8141-b87428e74bdb	c1a08e4e-ca21-40ac-adef-1c1cd99114b9	5e10d861-fa2c-4102-b80d-720315a8da9a	2	26.00	52.00	Bad quality formal outfit for Indian female in age group 18-25.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719710/training_image/image52.png	\N	\N	\N	2026-03-28 18:23:48.504
29cd89ba-1356-4c0b-b1ec-5c651c76cc31	ce980917-15bf-40b7-8900-8df4a0d40eda	5e10d861-fa2c-4102-b80d-720315a8da9a	2	26.00	52.00	Bad quality formal outfit for Indian female in age group 18-25.	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768719710/training_image/image52.png	\N	\N	\N	2026-03-28 18:32:24.849
5efbf5cf-64d9-4bd7-bed8-8ab222ffd938	9346cb23-26a2-45aa-a598-ec164c34bdd5	1430d44e-47b6-4e40-9501-f441fb1ffa53	1	25.13	25.13	Silk kaftan with side slits and tassel tie, made for spa days and poolside ease. Crafted in silk wit	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718512/training_image/05.png	\N	\N	\N	2026-03-29 07:54:00
ee49ea8a-ce8d-4fe6-abc7-dd9ebe32b4b8	9346cb23-26a2-45aa-a598-ec164c34bdd5	6f738ba8-75aa-481c-83f3-c5a09959a711	1	25.31	25.31	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weath	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718930/training_image/95.png	\N	\N	\N	2026-03-29 07:54:00
f699aaae-7eb4-4b91-a34a-e055858c2f80	9346cb23-26a2-45aa-a598-ec164c34bdd5	f30e48e7-c6d3-4b51-b587-520b6b40a8dd	1	25.52	25.52	Breathable linen kurta set with straight pants suited for office wear and day events in Indian weath	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718940/training_image/86.png	\N	\N	\N	2026-03-29 07:54:00
471066f3-0df1-499c-a76d-5cfb7a10f35d	4ea67b8b-412a-413b-acb1-a8728cdf4513	f36e9fe2-78df-48da-a3a8-3becfa42f4b9	1	23.57	23.57	A printed wrap skirt paired with a fitted solid top that draws attention to the waist and upper body	https://res.cloudinary.com/dgbmqarp0/image/upload/v1768718429/training_image/72.png	\N	\N	\N	2026-03-29 08:03:26.353
\.


--
-- Data for Name: order_refunds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_refunds (refund_id, order_id, amount, refund_status, refund_reason, approved_by, approved_at, rejection_reason, refund_method, transaction_id, initiated_at, processing_at, completed_at, failed_at, notes, metadata) FROM stdin;
\.


--
-- Data for Name: order_replacements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_replacements (replacement_id, original_order_id, new_order_id, replace_reason, custom_reason, feedback, replacement_status, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, pickup_scheduled, pickup_partner, pickup_tracking, picked_up_at, dispatched_at, delivery_tracking, delivered_at, requested_at, completed_at, notes, metadata) FROM stdin;
\.


--
-- Data for Name: order_returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_returns (return_id, order_id, return_reason, custom_reason, feedback, return_status, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, pickup_scheduled, pickup_partner, pickup_tracking, picked_up_at, qc_passed, qc_notes, qc_completed_at, requested_at, completed_at, notes, metadata, refund_id) FROM stdin;
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_status_history (history_id, order_id, from_status, to_status, changed_by, changed_by_type, notes, metadata, created_at) FROM stdin;
e362e84b-41be-4ba2-91e3-67c19b0c27a2	a6dfd403-0d00-4aff-bf48-3290e9a9b9fe	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-10 15:45:12.424
eeba798e-41d5-46d6-9b8a-c2765004627d	a6dfd403-0d00-4aff-bf48-3290e9a9b9fe	PENDING	BOOKED	\N	SYSTEM	Wallet order auto-confirmed and paid	\N	2026-03-10 15:45:12.424
4a0269ac-fcba-4b40-86ee-801933d0b7f7	8dd441d4-953a-4e16-bd6f-b3fb4bd9d9dd	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-22 18:51:29.829
22c4406b-0012-4bd8-9105-7a6b6dc0f49a	99599f5d-b7aa-4927-9cc3-b443424b401a	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-22 18:55:06.629
e383595e-ec07-479f-b95c-1ad1e195d93d	4e0066b1-2e47-4898-b16c-993749557676	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-22 18:56:08.735
49ffcce9-7804-49ba-b5ac-b5dab096da08	3911b418-71a5-4881-80ca-8bfe376fbcf8	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 14:13:35.733
60d1313c-bef0-4cf3-9c85-0eb03ad84e84	0b229d05-5e22-41d6-94d2-915efc62b983	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 14:14:49.581
ed524562-c8cc-486c-b4f0-6d9e93da52dd	7c7caba6-8d0e-4352-afa1-927729104297	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 15:12:50.091
0d66cad8-9704-49ba-8974-0b8390651cf5	4a80b452-0957-450e-9da1-e59acfd0714e	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 15:34:52.187
8d361346-a908-4757-a273-b33ee6f98922	159022e0-c181-4dfd-8d98-9dfd9e5c48e3	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 15:38:34.755
b9bf7d46-b1dc-455a-8e2d-aa16f30dc2f8	4651c63e-7f04-460b-91df-9230a41fd3a9	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 15:46:11.188
7759e761-7065-45ca-b7f3-860869db5f7e	aeca9717-b222-49d2-a781-abb7abd605d8	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 16:32:08.529
55b878aa-7dc8-4faa-b09e-41593ba2e024	6478030e-cb9d-4a2a-8923-df290bc05604	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 16:42:34.715
16fbbb80-d065-4405-865c-97b31611bb7f	f16aa2d1-0404-4ed6-9f80-6bf4d8e4e3db	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 16:59:14.85
aed761ff-48fb-4113-808f-933fada5fa8c	4678b106-8e91-4d30-8205-2a001e9534d1	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 17:03:57.758
20ac0ded-70db-4f03-bf75-1a1f3ce3b266	2f880071-5b9e-40a6-929d-f2bb5b81d8d1	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 17:09:51.876
2f7db3f0-dcef-4050-8f6d-c7c7d72a2d9e	3192e025-474c-42e8-ae18-4dc4f561e86c	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 17:13:00.027
9661814f-990e-4f92-9e86-765535e14086	44081b66-64aa-4311-bacd-76b9e7e6f653	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 17:19:46.084
55ffc600-a9d4-4037-a224-4f2e780d51bc	b7d5bdf3-f82c-4ab0-b542-be0eaede75f7	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 17:34:56.855
4f0ffda0-4d9b-46aa-beb2-f172b87b2585	e89a86db-bd2b-42c2-a586-9fc1a0b998f5	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 17:39:59.373
7959fdff-03e7-45a2-9647-3d30d1de1dba	662e8130-84db-44ef-8e33-e99bf49299ca	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 17:54:10.966
5a5dcfda-8e46-425d-8a97-699a88fb8498	7ab127c2-a72b-440d-b350-b84971fb66fd	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 17:58:33.6
f3c5f1b5-8832-4c2a-932f-0f4e8297e5d9	7ab127c2-a72b-440d-b350-b84971fb66fd	PENDING	BOOKED	\N	SYSTEM	Payment captured via PayU. mihpayid: 403993715537044117	\N	2026-03-23 18:02:23.166
6894c5f7-e9dd-45ba-987a-437fd7f112dc	07232003-8f70-47a9-a9a3-b303def31419	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 18:05:01.507
895ad6ca-120a-4bb2-ba8f-709097cbdbb2	07232003-8f70-47a9-a9a3-b303def31419	PENDING	BOOKED	\N	SYSTEM	Payment captured via PayU. mihpayid: 403993715537044144	\N	2026-03-23 18:09:02.089
19fdf74c-7062-4bcb-8eeb-b27602cfa2de	8624dea4-be06-462f-9382-6bb1e341a6de	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 18:41:45.92
57ee427d-dc3a-4dd6-9e68-b96e2e8d10ae	1915df23-fdb0-492d-b8b1-51aec9e7c60c	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 19:40:55.69
d225c9e0-6f96-46de-93c0-5a86d0279573	44d2efae-948a-44ab-a7d2-ae43aad0d6a0	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 19:42:17.23
5a1b9d5b-1b15-4ea6-9a8d-00f049ba0252	2c84af2e-30dd-431b-b24c-f2b148a07645	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-23 19:44:28.846
e3fb866f-11ea-4feb-a26b-b9925b8df0e6	2c84af2e-30dd-431b-b24c-f2b148a07645	PENDING	BOOKED	\N	SYSTEM	Payment captured via PayU. mihpayid: 403993715537044290	\N	2026-03-23 19:47:23.902
3bff424d-5bc7-446b-a1f8-7d42a216b5e5	36601eb8-942f-456c-9a0e-f13ad9c284af	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-24 15:13:28.664
a17aaa7a-84c2-4d4c-b6e4-b48ce3c87d38	36601eb8-942f-456c-9a0e-f13ad9c284af	PENDING	BOOKED	\N	SYSTEM	Payment captured via PayU. mihpayid: 27854675406	\N	2026-03-24 15:14:48.647
5f5e106c-5fff-4d43-8106-9921e1a080e8	a01844da-4a2b-409c-88e6-875cdd1ef03f	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-25 15:50:10.03
35b2888b-8985-4e36-86f5-1b275597925c	6388c0fe-ee5a-4e69-8a91-cd52acd0c013	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-28 18:14:31.264
0f82b23c-ead0-4f0e-b312-1ba26297502d	6388c0fe-ee5a-4e69-8a91-cd52acd0c013	PENDING	BOOKED	\N	SYSTEM	COD order auto-confirmed	\N	2026-03-28 18:14:31.264
a9e838ed-f09b-4eb3-89b9-bf941716577a	6388c0fe-ee5a-4e69-8a91-cd52acd0c013	BOOKED	DISPATCHED	\N	ADMIN	Admin updated to DISPATCHED	\N	2026-03-28 18:17:51.435
7f2e6bfb-fa67-4773-b3b9-048ddc957024	d1170234-ee53-4e7d-aae0-d1836da8bd49	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-28 18:23:35.934
e29967d0-0dd5-457d-9d64-d60acef68ddb	d1170234-ee53-4e7d-aae0-d1836da8bd49	PENDING	BOOKED	\N	SYSTEM	COD order auto-confirmed	\N	2026-03-28 18:23:35.934
2d0d6c8e-6938-406e-87b8-b6d83d3140d1	c1a08e4e-ca21-40ac-adef-1c1cd99114b9	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-28 18:23:48.504
5488c3ef-fc10-435d-834f-306885bca0bb	c1a08e4e-ca21-40ac-adef-1c1cd99114b9	PENDING	BOOKED	\N	SYSTEM	COD order auto-confirmed	\N	2026-03-28 18:23:48.504
430f6414-2400-4f23-b715-9b4c1bcca701	ce980917-15bf-40b7-8900-8df4a0d40eda	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-28 18:32:24.849
09c6990b-61b3-4310-a391-1f18e2c6e089	ce980917-15bf-40b7-8900-8df4a0d40eda	PENDING	BOOKED	\N	SYSTEM	COD order auto-confirmed	\N	2026-03-28 18:32:24.849
5f2592d5-d33c-49a4-b9b9-af33683dcd41	9346cb23-26a2-45aa-a598-ec164c34bdd5	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-29 07:54:00
4fe31eb3-30ea-4070-aad4-c39628fbcda7	9346cb23-26a2-45aa-a598-ec164c34bdd5	PENDING	BOOKED	\N	SYSTEM	COD order auto-confirmed	\N	2026-03-29 07:54:00
1a9f3471-970f-4332-8af0-c962a9f113cf	4ea67b8b-412a-413b-acb1-a8728cdf4513	\N	PENDING	\N	SYSTEM	Order created	\N	2026-03-29 08:03:26.353
4961319d-f602-4338-abeb-10c60fe62aa7	4ea67b8b-412a-413b-acb1-a8728cdf4513	PENDING	BOOKED	\N	SYSTEM	Wallet order auto-confirmed and paid	\N	2026-03-29 08:03:26.353
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (order_id, order_number, user_id, total_amount, payment_method, payment_status, current_status, cod_collected, cod_collected_at, cod_collected_by, shipping_address_id, tracking_number, delivery_partner, estimated_delivery_date, cancelled_at, cancelled_by, cancellation_reason, cancel_feedback, refund_status, refund_amount, return_status, return_requested_at, replace_status, replace_requested_at, created_at, updated_at) FROM stdin;
a6dfd403-0d00-4aff-bf48-3290e9a9b9fe	ORD-2026-000001	be6b282a-4785-433e-8813-5f8ed890ec89	46.57	WALLET	COMPLETED	BOOKED	f	\N	\N	941c7b96-54e8-4380-a273-2d3bdfbdbf1e	\N	\N	2026-03-17 15:45:12.421	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 15:45:12.424	2026-03-10 15:45:12.424
8dd441d4-953a-4e16-bd6f-b3fb4bd9d9dd	ORD-2026-000002	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	23.39	PREPAID	PENDING	PENDING	f	\N	\N	4fef0803-6f45-4e78-becf-7535c6b1121c	\N	\N	2026-03-29 18:51:29.827	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-22 18:51:29.829	2026-03-22 18:51:29.829
99599f5d-b7aa-4927-9cc3-b443424b401a	ORD-2026-000003	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	23.39	PAYU	PENDING	PENDING	f	\N	\N	4fef0803-6f45-4e78-becf-7535c6b1121c	\N	\N	2026-03-29 18:55:06.627	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-22 18:55:06.629	2026-03-22 18:55:06.629
4e0066b1-2e47-4898-b16c-993749557676	ORD-2026-000004	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	23.39	PAYU	PENDING	PENDING	f	\N	\N	4fef0803-6f45-4e78-becf-7535c6b1121c	\N	\N	2026-03-29 18:56:08.734	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-22 18:56:08.735	2026-03-22 18:56:08.735
3911b418-71a5-4881-80ca-8bfe376fbcf8	ORD-2026-000005	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	23.39	PAYU	PENDING	PENDING	f	\N	\N	4fef0803-6f45-4e78-becf-7535c6b1121c	\N	\N	2026-03-30 14:13:35.73	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 14:13:35.733	2026-03-23 14:13:35.733
0b229d05-5e22-41d6-94d2-915efc62b983	ORD-2026-000006	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	23.39	PAYU	PENDING	PENDING	f	\N	\N	4fef0803-6f45-4e78-becf-7535c6b1121c	\N	\N	2026-03-30 14:14:49.579	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 14:14:49.581	2026-03-23 14:14:49.581
7c7caba6-8d0e-4352-afa1-927729104297	ORD-2026-000007	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	23.39	PAYU	PENDING	PENDING	f	\N	\N	4fef0803-6f45-4e78-becf-7535c6b1121c	\N	\N	2026-03-30 15:12:50.089	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 15:12:50.091	2026-03-23 15:12:50.091
4a80b452-0957-450e-9da1-e59acfd0714e	ORD-2026-000008	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	49.39	PAYU	PENDING	PENDING	f	\N	\N	4fef0803-6f45-4e78-becf-7535c6b1121c	\N	\N	2026-03-30 15:34:52.183	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 15:34:52.187	2026-03-23 15:34:52.187
159022e0-c181-4dfd-8d98-9dfd9e5c48e3	ORD-2026-000009	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	49.39	PAYU	PENDING	PENDING	f	\N	\N	4fef0803-6f45-4e78-becf-7535c6b1121c	\N	\N	2026-03-30 15:38:34.753	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 15:38:34.755	2026-03-23 15:38:34.755
4651c63e-7f04-460b-91df-9230a41fd3a9	ORD-2026-000010	c7941d8f-c16f-4428-bcfd-a7bae381dde9	23.18	PAYU	PENDING	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 15:46:11.186	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 15:46:11.188	2026-03-23 15:46:11.188
aeca9717-b222-49d2-a781-abb7abd605d8	ORD-2026-000011	c7941d8f-c16f-4428-bcfd-a7bae381dde9	23.18	PAYU	PENDING	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 16:32:08.526	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 16:32:08.529	2026-03-23 16:32:08.529
6478030e-cb9d-4a2a-8923-df290bc05604	ORD-2026-000012	c7941d8f-c16f-4428-bcfd-a7bae381dde9	23.18	PAYU	PENDING	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 16:42:34.71	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 16:42:34.715	2026-03-23 16:42:34.715
f16aa2d1-0404-4ed6-9f80-6bf4d8e4e3db	ORD-2026-000013	c7941d8f-c16f-4428-bcfd-a7bae381dde9	23.18	PAYU	PENDING	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 16:59:14.845	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 16:59:14.85	2026-03-23 16:59:14.85
4678b106-8e91-4d30-8205-2a001e9534d1	ORD-2026-000014	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	49.39	PAYU	PENDING	PENDING	f	\N	\N	4fef0803-6f45-4e78-becf-7535c6b1121c	\N	\N	2026-03-30 17:03:57.756	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 17:03:57.758	2026-03-23 17:03:57.758
2f880071-5b9e-40a6-929d-f2bb5b81d8d1	ORD-2026-000015	c7941d8f-c16f-4428-bcfd-a7bae381dde9	23.18	PAYU	PENDING	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 17:09:51.874	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 17:09:51.876	2026-03-23 17:09:51.876
3192e025-474c-42e8-ae18-4dc4f561e86c	ORD-2026-000016	c7941d8f-c16f-4428-bcfd-a7bae381dde9	23.18	PAYU	FAILED	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 17:13:00.025	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 17:13:00.027	2026-03-23 17:18:15.341
44081b66-64aa-4311-bacd-76b9e7e6f653	ORD-2026-000017	c7941d8f-c16f-4428-bcfd-a7bae381dde9	23.18	PAYU	FAILED	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 17:19:46.082	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 17:19:46.084	2026-03-23 17:34:50.328
b7d5bdf3-f82c-4ab0-b542-be0eaede75f7	ORD-2026-000018	c7941d8f-c16f-4428-bcfd-a7bae381dde9	23.18	PAYU	FAILED	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 17:34:56.854	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 17:34:56.855	2026-03-23 17:35:12.757
e89a86db-bd2b-42c2-a586-9fc1a0b998f5	ORD-2026-000019	c7941d8f-c16f-4428-bcfd-a7bae381dde9	23.18	PAYU	FAILED	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 17:39:59.371	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 17:39:59.373	2026-03-23 17:40:20.459
662e8130-84db-44ef-8e33-e99bf49299ca	ORD-2026-000020	c7941d8f-c16f-4428-bcfd-a7bae381dde9	26.00	PAYU	FAILED	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 17:54:10.963	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 17:54:10.966	2026-03-23 17:58:21.517
7ab127c2-a72b-440d-b350-b84971fb66fd	ORD-2026-000021	c7941d8f-c16f-4428-bcfd-a7bae381dde9	26.00	PAYU	COMPLETED	BOOKED	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 17:58:33.598	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 17:58:33.6	2026-03-23 18:02:23.163
07232003-8f70-47a9-a9a3-b303def31419	ORD-2026-000022	c7941d8f-c16f-4428-bcfd-a7bae381dde9	26.00	PAYU	COMPLETED	BOOKED	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 18:05:01.505	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 18:05:01.507	2026-03-23 18:09:02.083
8624dea4-be06-462f-9382-6bb1e341a6de	ORD-2026-000023	c7941d8f-c16f-4428-bcfd-a7bae381dde9	26.00	PAYU	PENDING	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 18:41:45.918	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 18:41:45.92	2026-03-23 18:41:45.92
1915df23-fdb0-492d-b8b1-51aec9e7c60c	ORD-2026-000024	c7941d8f-c16f-4428-bcfd-a7bae381dde9	26.00	PAYU	PENDING	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 19:40:55.688	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 19:40:55.69	2026-03-23 19:40:55.69
44d2efae-948a-44ab-a7d2-ae43aad0d6a0	ORD-2026-000025	c7941d8f-c16f-4428-bcfd-a7bae381dde9	26.00	PAYU	PENDING	PENDING	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 19:42:17.228	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 19:42:17.23	2026-03-23 19:42:17.23
2c84af2e-30dd-431b-b24c-f2b148a07645	ORD-2026-000026	c7941d8f-c16f-4428-bcfd-a7bae381dde9	26.00	PAYU	COMPLETED	BOOKED	f	\N	\N	5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	\N	\N	2026-03-30 19:44:28.845	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 19:44:28.846	2026-03-23 19:47:23.9
36601eb8-942f-456c-9a0e-f13ad9c284af	ORD-2026-000027	2e357653-09b9-4ffa-b9ad-12d0706f698a	2.00	PAYU	COMPLETED	BOOKED	f	\N	\N	3c5abf99-9dab-45ea-8ccc-54b6748d678c	\N	\N	2026-03-31 15:13:28.663	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-24 15:13:28.664	2026-03-24 15:14:48.645
a01844da-4a2b-409c-88e6-875cdd1ef03f	ORD-2026-000028	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	9.66	PREPAID	PENDING	PENDING	f	\N	\N	4fef0803-6f45-4e78-becf-7535c6b1121c	\N	\N	2026-04-01 15:50:10.028	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-25 15:50:10.03	2026-03-25 15:50:10.03
6388c0fe-ee5a-4e69-8a91-cd52acd0c013	ORD-2026-000029	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	52.00	COD	PENDING	DISPATCHED	f	\N	\N	40822697-a7ee-4670-b4b4-61f959fcc6c4	HHHeyeh123	klklasndk	2026-04-04 18:14:31.263	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-28 18:14:31.264	2026-03-28 18:17:51.432
d1170234-ee53-4e7d-aae0-d1836da8bd49	ORD-2026-000030	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	52.00	COD	PENDING	BOOKED	f	\N	\N	40822697-a7ee-4670-b4b4-61f959fcc6c4	\N	\N	2026-04-04 18:23:35.933	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-28 18:23:35.934	2026-03-28 18:23:35.934
c1a08e4e-ca21-40ac-adef-1c1cd99114b9	ORD-2026-000031	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	52.00	COD	PENDING	BOOKED	f	\N	\N	40822697-a7ee-4670-b4b4-61f959fcc6c4	\N	\N	2026-04-04 18:23:48.504	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-28 18:23:48.504	2026-03-28 18:23:48.504
ce980917-15bf-40b7-8900-8df4a0d40eda	ORD-2026-000032	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	52.00	COD	PENDING	BOOKED	f	\N	\N	40822697-a7ee-4670-b4b4-61f959fcc6c4	\N	\N	2026-04-04 18:32:24.848	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-28 18:32:24.849	2026-03-28 18:32:24.849
9346cb23-26a2-45aa-a598-ec164c34bdd5	ORD-2026-000033	1df5c992-5033-4efa-a78f-6f69bc8ec9fd	75.96	COD	PENDING	BOOKED	f	\N	\N	d923f990-0b69-4847-a8b0-e4586a1ef945	\N	\N	2026-04-05 07:53:59.998	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-29 07:54:00	2026-03-29 07:54:00
4ea67b8b-412a-413b-acb1-a8728cdf4513	ORD-2026-000034	1df5c992-5033-4efa-a78f-6f69bc8ec9fd	23.57	WALLET	COMPLETED	BOOKED	f	\N	\N	d923f990-0b69-4847-a8b0-e4586a1ef945	\N	\N	2026-04-05 08:03:26.351	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-29 08:03:26.353	2026-03-29 08:03:26.353
\.


--
-- Data for Name: otp_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_verifications (otp_id, phone_number, otp_hash, expires_at, verified, attempts, created_at) FROM stdin;
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_transactions (transaction_id, order_id, gateway, gateway_order_id, gateway_payment_id, amount_paise, currency, receipt, status, payment_method, refund_id, refunded_at, created_at, captured_at, updated_at, metadata) FROM stdin;
28792b40-a2ab-4ce9-b946-63bf2b7f4b51	8dd441d4-953a-4e16-bd6f-b3fb4bd9d9dd	PAYU	AIV_8DD441D4_05489858	\N	23	INR	AIV_8DD441D4_05489858	CREATED	\N	\N	\N	2026-03-22 18:51:29.859	\N	2026-03-22 18:51:29.859	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-22T18:51:29.858Z", "order_number": "ORD-2026-000002"}
65e8daed-aea8-4205-bfc2-0b4d15452b97	99599f5d-b7aa-4927-9cc3-b443424b401a	PAYU	AIV_99599F5D_05706659	\N	23	INR	AIV_99599F5D_05706659	CREATED	\N	\N	\N	2026-03-22 18:55:06.66	\N	2026-03-22 18:55:06.66	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-22T18:55:06.659Z", "order_number": "ORD-2026-000003"}
8a578b3d-7f08-4921-be8a-7c37a28cdc9b	4e0066b1-2e47-4898-b16c-993749557676	PAYU	AIV_4E0066B1_05768758	\N	23	INR	AIV_4E0066B1_05768758	CREATED	\N	\N	\N	2026-03-22 18:56:08.759	\N	2026-03-22 18:56:08.759	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-22T18:56:08.758Z", "order_number": "ORD-2026-000004"}
8e7d870c-3c8d-484c-b7a1-bbd2bd986381	4e0066b1-2e47-4898-b16c-993749557676	PAYU	AIV_4E0066B1_05910649	\N	23	INR	AIV_4E0066B1_05910649	CREATED	\N	\N	\N	2026-03-22 18:58:30.65	\N	2026-03-22 18:58:30.65	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-22T18:58:30.649Z", "order_number": "ORD-2026-000004"}
5fb63b67-b57a-4b74-a68a-864ee1bae0e6	4e0066b1-2e47-4898-b16c-993749557676	PAYU	AIV_4E0066B1_06341879	\N	23	INR	AIV_4E0066B1_06341879	CREATED	\N	\N	\N	2026-03-22 19:05:41.881	\N	2026-03-22 19:05:41.881	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-22T19:05:41.879Z", "order_number": "ORD-2026-000004"}
dcf8e303-7012-495a-907b-83278a2f6f64	4e0066b1-2e47-4898-b16c-993749557676	PAYU	AIV_4E0066B1_06593374	\N	23	INR	AIV_4E0066B1_06593374	CREATED	\N	\N	\N	2026-03-22 19:09:53.376	\N	2026-03-22 19:09:53.376	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-22T19:09:53.375Z", "order_number": "ORD-2026-000004"}
2d068a7a-afae-4b32-8f07-99f49110ddf7	4e0066b1-2e47-4898-b16c-993749557676	PAYU	AIV_4E0066B1_06613458	\N	23	INR	AIV_4E0066B1_06613458	CREATED	\N	\N	\N	2026-03-22 19:10:13.459	\N	2026-03-22 19:10:13.459	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-22T19:10:13.458Z", "order_number": "ORD-2026-000004"}
2845a3cf-554d-42cd-b78c-c1710505e2c2	4e0066b1-2e47-4898-b16c-993749557676	PAYU	AIV_4E0066B1_75120012	\N	23	INR	AIV_4E0066B1_75120012	CREATED	\N	\N	\N	2026-03-23 14:12:00.014	\N	2026-03-23 14:12:00.014	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T14:12:00.012Z", "order_number": "ORD-2026-000004"}
c6c9a4bd-e333-4866-bc9e-42fd1608ac57	3911b418-71a5-4881-80ca-8bfe376fbcf8	PAYU	AIV_3911B418_75215777	\N	23	INR	AIV_3911B418_75215777	CREATED	\N	\N	\N	2026-03-23 14:13:35.779	\N	2026-03-23 14:13:35.779	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T14:13:35.777Z", "order_number": "ORD-2026-000005"}
bd993053-33f5-402a-a4dd-aea0d7d5e55d	0b229d05-5e22-41d6-94d2-915efc62b983	PAYU	AIV_0B229D05_75289622	\N	23	INR	AIV_0B229D05_75289622	CREATED	\N	\N	\N	2026-03-23 14:14:49.624	\N	2026-03-23 14:14:49.624	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T14:14:49.622Z", "order_number": "ORD-2026-000006"}
b9ea714b-34ac-4f11-ac49-ee8ebcbe0191	7c7caba6-8d0e-4352-afa1-927729104297	PAYU	AIV_7C7CABA6_78770123	\N	23	INR	AIV_7C7CABA6_78770123	CREATED	\N	\N	\N	2026-03-23 15:12:50.125	\N	2026-03-23 15:12:50.125	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T15:12:50.123Z", "order_number": "ORD-2026-000007"}
dd0f36be-b47d-45f9-a192-768563a1582d	0b229d05-5e22-41d6-94d2-915efc62b983	PAYU	AIV_0B229D05_79982252	\N	23	INR	AIV_0B229D05_79982252	CREATED	\N	\N	\N	2026-03-23 15:33:02.254	\N	2026-03-23 15:33:02.254	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T15:33:02.252Z", "order_number": "ORD-2026-000006"}
fbab915e-d6d3-403e-8a3c-8dcd7da46506	4a80b452-0957-450e-9da1-e59acfd0714e	PAYU	AIV_4A80B452_80092217	\N	49	INR	AIV_4A80B452_80092217	CREATED	\N	\N	\N	2026-03-23 15:34:52.218	\N	2026-03-23 15:34:52.218	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T15:34:52.217Z", "order_number": "ORD-2026-000008"}
f1b96c40-6937-44bc-bdc5-010a6fc1c972	4a80b452-0957-450e-9da1-e59acfd0714e	PAYU	AIV_4A80B452_80215775	\N	49	INR	AIV_4A80B452_80215775	CREATED	\N	\N	\N	2026-03-23 15:36:55.776	\N	2026-03-23 15:36:55.776	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T15:36:55.775Z", "order_number": "ORD-2026-000008"}
1de1d5e5-3eb9-42d0-8e42-8c8e4a0c7067	4a80b452-0957-450e-9da1-e59acfd0714e	PAYU	AIV_4A80B452_80259792	\N	49	INR	AIV_4A80B452_80259792	CREATED	\N	\N	\N	2026-03-23 15:37:39.793	\N	2026-03-23 15:37:39.793	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T15:37:39.792Z", "order_number": "ORD-2026-000008"}
0fb1d634-794e-497d-a2cc-32001222bb12	159022e0-c181-4dfd-8d98-9dfd9e5c48e3	PAYU	AIV_159022E0_80314780	\N	49	INR	AIV_159022E0_80314780	CREATED	\N	\N	\N	2026-03-23 15:38:34.781	\N	2026-03-23 15:38:34.781	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T15:38:34.780Z", "order_number": "ORD-2026-000009"}
c135b78e-73c5-4782-8ca9-b0928990a01c	159022e0-c181-4dfd-8d98-9dfd9e5c48e3	PAYU	AIV_159022E0_80473324	\N	49	INR	AIV_159022E0_80473324	CREATED	\N	\N	\N	2026-03-23 15:41:13.326	\N	2026-03-23 15:41:13.326	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T15:41:13.324Z", "order_number": "ORD-2026-000009"}
d5b8579e-e89c-4d06-b3f6-919662a6c14c	159022e0-c181-4dfd-8d98-9dfd9e5c48e3	PAYU	AIV_159022E0_80526169	\N	49	INR	AIV_159022E0_80526169	CREATED	\N	\N	\N	2026-03-23 15:42:06.171	\N	2026-03-23 15:42:06.171	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T15:42:06.169Z", "order_number": "ORD-2026-000009"}
4845bf92-5b3e-4cee-b197-88000696d654	4651c63e-7f04-460b-91df-9230a41fd3a9	PAYU	AIV_4651C63E_80771210	\N	23	INR	AIV_4651C63E_80771210	CREATED	\N	\N	\N	2026-03-23 15:46:11.211	\N	2026-03-23 15:46:11.211	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T15:46:11.210Z", "order_number": "ORD-2026-000010"}
8c7ae51b-2006-4474-996a-2d946737186c	4651c63e-7f04-460b-91df-9230a41fd3a9	PAYU	AIV_4651C63E_80927759	\N	23	INR	AIV_4651C63E_80927759	CREATED	\N	\N	\N	2026-03-23 15:48:47.761	\N	2026-03-23 15:48:47.761	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T15:48:47.760Z", "order_number": "ORD-2026-000010"}
3e1292c3-64e9-4960-a6af-503dfeb4850b	4651c63e-7f04-460b-91df-9230a41fd3a9	PAYU	AIV_4651C63E_80987801	\N	23	INR	AIV_4651C63E_80987801	CREATED	\N	\N	\N	2026-03-23 15:49:47.802	\N	2026-03-23 15:49:47.802	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T15:49:47.801Z", "order_number": "ORD-2026-000010"}
a3d23139-238d-4f0a-9087-e15987b15405	4651c63e-7f04-460b-91df-9230a41fd3a9	PAYU	AIV_4651C63E_81108602	\N	23	INR	AIV_4651C63E_81108602	CREATED	\N	\N	\N	2026-03-23 15:51:48.603	\N	2026-03-23 15:51:48.603	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T15:51:48.602Z", "order_number": "ORD-2026-000010"}
5c21eb72-e393-4f45-a255-e3326d5f26a8	4651c63e-7f04-460b-91df-9230a41fd3a9	PAYU	AIV_4651C63E_82440361	\N	23	INR	AIV_4651C63E_82440361	CREATED	\N	\N	\N	2026-03-23 16:14:00.364	\N	2026-03-23 16:14:00.364	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T16:14:00.362Z", "order_number": "ORD-2026-000010"}
065fe701-21e6-4fc7-86f5-90eeb8f9a46a	4651c63e-7f04-460b-91df-9230a41fd3a9	PAYU	AIV_4651C63E_82693498	\N	23	INR	AIV_4651C63E_82693498	CREATED	\N	\N	\N	2026-03-23 16:18:13.501	\N	2026-03-23 16:18:13.501	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T16:18:13.499Z", "order_number": "ORD-2026-000010"}
ef79e394-f62d-4619-8189-ec3df063ce51	4651c63e-7f04-460b-91df-9230a41fd3a9	PAYU	AIV_4651C63E_82942917	\N	23	INR	AIV_4651C63E_82942917	CREATED	\N	\N	\N	2026-03-23 16:22:22.92	\N	2026-03-23 16:22:22.92	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T16:22:22.918Z", "order_number": "ORD-2026-000010"}
a5c84a85-a8ef-4098-94b0-d5c1c43e9a20	aeca9717-b222-49d2-a781-abb7abd605d8	PAYU	AIV_AECA9717_83528585	\N	23	INR	AIV_AECA9717_83528585	CREATED	\N	\N	\N	2026-03-23 16:32:08.587	\N	2026-03-23 16:32:08.587	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T16:32:08.585Z", "order_number": "ORD-2026-000011"}
0198cb57-58df-47fd-993c-5e94430859d1	aeca9717-b222-49d2-a781-abb7abd605d8	PAYU	AIV_AECA9717_83556404	\N	23	INR	AIV_AECA9717_83556404	CREATED	\N	\N	\N	2026-03-23 16:32:36.406	\N	2026-03-23 16:32:36.406	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T16:32:36.404Z", "order_number": "ORD-2026-000011"}
a8865a39-0815-4173-bc3f-8fa0bca67382	aeca9717-b222-49d2-a781-abb7abd605d8	PAYU	AIV_AECA9717_84010970	\N	23	INR	AIV_AECA9717_84010970	CREATED	\N	\N	\N	2026-03-23 16:40:10.976	\N	2026-03-23 16:40:10.976	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T16:40:10.971Z", "order_number": "ORD-2026-000011"}
73f0c7e5-6177-4ccd-aa1f-3bd301ac0f8e	6478030e-cb9d-4a2a-8923-df290bc05604	PAYU	AIV_6478030E_84154795	\N	23	INR	AIV_6478030E_84154795	CREATED	\N	\N	\N	2026-03-23 16:42:34.796	\N	2026-03-23 16:42:34.796	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T16:42:34.795Z", "order_number": "ORD-2026-000012"}
e609115b-e390-435f-9ff0-81c3c47d1f03	f16aa2d1-0404-4ed6-9f80-6bf4d8e4e3db	PAYU	AIV_F16AA2D1_85154894	\N	23	INR	AIV_F16AA2D1_85154894	CREATED	\N	\N	\N	2026-03-23 16:59:14.896	\N	2026-03-23 16:59:14.896	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T16:59:14.894Z", "order_number": "ORD-2026-000013"}
acd280b9-4c63-459a-9d01-d78eb1eb530e	4678b106-8e91-4d30-8205-2a001e9534d1	PAYU	AIV_4678B106_85437810	\N	49	INR	AIV_4678B106_85437810	CREATED	\N	\N	\N	2026-03-23 17:03:57.811	\N	2026-03-23 17:03:57.811	{"user_id": "61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2", "initiated_at": "2026-03-23T17:03:57.810Z", "order_number": "ORD-2026-000014"}
5b7ef901-c34c-441a-aa42-7f60a103af5e	f16aa2d1-0404-4ed6-9f80-6bf4d8e4e3db	PAYU	AIV_F16AA2D1_85479034	\N	23	INR	AIV_F16AA2D1_85479034	CREATED	\N	\N	\N	2026-03-23 17:04:39.036	\N	2026-03-23 17:04:39.036	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T17:04:39.035Z", "order_number": "ORD-2026-000013"}
ef41796d-480b-4e93-b8d7-0f31f210f9d7	f16aa2d1-0404-4ed6-9f80-6bf4d8e4e3db	PAYU	AIV_F16AA2D1_85619190	\N	23	INR	AIV_F16AA2D1_85619190	CREATED	\N	\N	\N	2026-03-23 17:06:59.192	\N	2026-03-23 17:06:59.192	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T17:06:59.191Z", "order_number": "ORD-2026-000013"}
425c65b7-1dc4-48fb-912f-ce649da4e040	2f880071-5b9e-40a6-929d-f2bb5b81d8d1	PAYU	AIV_2F880071_85791901	\N	23	INR	AIV_2F880071_85791901	CREATED	\N	\N	\N	2026-03-23 17:09:51.902	\N	2026-03-23 17:09:51.902	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T17:09:51.901Z", "order_number": "ORD-2026-000015"}
dfb50570-1a49-449e-b617-ff60ad5dcc63	07232003-8f70-47a9-a9a3-b303def31419	PAYU	AIV_07232003_89101563	403993715537044144	26	INR	AIV_07232003_89101563	CAPTURED	\N	\N	\N	2026-03-23 18:05:01.565	2026-03-23 18:09:02.067	2026-03-23 18:09:02.063	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "verified_at": "2026-03-23T18:09:02.061Z", "initiated_at": "2026-03-23T18:05:01.564Z", "order_number": "ORD-2026-000022", "payu_response": {"txnid": "AIV_07232003_89101563", "status": "success", "mihpayid": "403993715537044144"}}
962dca63-5212-4357-be18-2e6457da4571	8624dea4-be06-462f-9382-6bb1e341a6de	PAYU	AIV_8624DEA4_91305996	\N	26	INR	AIV_8624DEA4_91305996	CREATED	\N	\N	\N	2026-03-23 18:41:45.999	\N	2026-03-23 18:41:45.999	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T18:41:45.996Z", "order_number": "ORD-2026-000023"}
3b9fe108-4544-4019-a1d7-15b8f965c9b7	3192e025-474c-42e8-ae18-4dc4f561e86c	PAYU	AIV_3192E025_85980054	\N	23	INR	AIV_3192E025_85980054	FAILED	\N	\N	\N	2026-03-23 17:13:00.055	\N	2026-03-23 17:18:15.324	{"failure": {"code": "UNKNOWN", "description": "Bank was unable to authenticate."}, "user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T17:13:00.054Z", "order_number": "ORD-2026-000016"}
a9819db0-a628-40f2-add0-d22f81ebb2a3	44081b66-64aa-4311-bacd-76b9e7e6f653	PAYU	AIV_44081B66_86386136	\N	23	INR	AIV_44081B66_86386136	FAILED	\N	\N	\N	2026-03-23 17:19:46.138	\N	2026-03-23 17:34:50.292	{"failure": {"code": "UNKNOWN", "description": ""}, "user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T17:19:46.137Z", "order_number": "ORD-2026-000017"}
fcb20bd4-f55d-4074-b493-76f6339058cf	b7d5bdf3-f82c-4ab0-b542-be0eaede75f7	PAYU	AIV_B7D5BDF3_87296875	\N	23	INR	AIV_B7D5BDF3_87296875	FAILED	\N	\N	\N	2026-03-23 17:34:56.876	\N	2026-03-23 17:35:12.739	{"failure": {"code": "UNKNOWN", "description": "Bank was unable to authenticate."}, "user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T17:34:56.875Z", "order_number": "ORD-2026-000018"}
7db3ef47-70f6-4762-9369-4517f225bb5a	e89a86db-bd2b-42c2-a586-9fc1a0b998f5	PAYU	AIV_E89A86DB_87599406	\N	23	INR	AIV_E89A86DB_87599406	FAILED	\N	\N	\N	2026-03-23 17:39:59.408	\N	2026-03-23 17:40:20.438	{"failure": {"code": "UNKNOWN", "description": "Bank was unable to authenticate."}, "user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T17:39:59.406Z", "order_number": "ORD-2026-000019"}
1817befa-616c-413a-803c-4e22a98212e2	662e8130-84db-44ef-8e33-e99bf49299ca	PAYU	AIV_662E8130_88451023	\N	26	INR	AIV_662E8130_88451023	FAILED	\N	\N	\N	2026-03-23 17:54:11.025	\N	2026-03-23 17:58:21.47	{"failure": {"code": "UNKNOWN", "description": "Bank was unable to authenticate."}, "user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T17:54:11.023Z", "order_number": "ORD-2026-000020"}
bff928bc-7ad8-4958-8d61-bd1a4edf1e53	7ab127c2-a72b-440d-b350-b84971fb66fd	PAYU	AIV_7AB127C2_88713632	403993715537044117	26	INR	AIV_7AB127C2_88713632	CAPTURED	\N	\N	\N	2026-03-23 17:58:33.634	2026-03-23 18:02:23.149	2026-03-23 18:02:23.147	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "verified_at": "2026-03-23T18:02:23.144Z", "initiated_at": "2026-03-23T17:58:33.633Z", "order_number": "ORD-2026-000021", "payu_response": {"txnid": "AIV_7AB127C2_88713632", "status": "success", "mihpayid": "403993715537044117"}}
a2b59533-614c-41bc-a5a0-2c9e55240787	1915df23-fdb0-492d-b8b1-51aec9e7c60c	PAYU	AIV_1915DF23_94855725	\N	26	INR	AIV_1915DF23_94855725	CREATED	\N	\N	\N	2026-03-23 19:40:55.727	\N	2026-03-23 19:40:55.727	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T19:40:55.725Z", "order_number": "ORD-2026-000024"}
e9367bb2-e59b-4202-a26e-f78947d9e8a2	44d2efae-948a-44ab-a7d2-ae43aad0d6a0	PAYU	AIV_44D2EFAE_94937262	\N	26	INR	AIV_44D2EFAE_94937262	CREATED	\N	\N	\N	2026-03-23 19:42:17.263	\N	2026-03-23 19:42:17.263	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "initiated_at": "2026-03-23T19:42:17.262Z", "order_number": "ORD-2026-000025"}
41616800-91d3-445b-9c44-f6fb767f414f	2c84af2e-30dd-431b-b24c-f2b148a07645	PAYU	AIV_2C84AF2E_95068868	403993715537044290	26	INR	AIV_2C84AF2E_95068868	CAPTURED	\N	\N	\N	2026-03-23 19:44:28.869	2026-03-23 19:47:23.885	2026-03-23 19:47:23.885	{"user_id": "c7941d8f-c16f-4428-bcfd-a7bae381dde9", "verified_at": "2026-03-23T19:47:23.884Z", "initiated_at": "2026-03-23T19:44:28.868Z", "order_number": "ORD-2026-000026", "payu_response": {"txnid": "AIV_2C84AF2E_95068868", "status": "success", "mihpayid": "403993715537044290"}}
d91c4335-fcf3-4323-b56f-30f26371bfd8	36601eb8-942f-456c-9a0e-f13ad9c284af	PAYU	AIV_36601EB8_65208696	27854675406	2	INR	AIV_36601EB8_65208696	CAPTURED	\N	\N	\N	2026-03-24 15:13:28.698	2026-03-24 15:14:48.635	2026-03-24 15:14:48.635	{"user_id": "2e357653-09b9-4ffa-b9ad-12d0706f698a", "verified_at": "2026-03-24T15:14:48.634Z", "initiated_at": "2026-03-24T15:13:28.696Z", "order_number": "ORD-2026-000027", "payu_response": {"txnid": "AIV_36601EB8_65208696", "status": "success", "mihpayid": "27854675406"}}
\.


--
-- Data for Name: product_color_variant_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_color_variant_images (image_id, variant_id, url, order_index, is_primary, uploaded_at) FROM stdin;
663739c7-282a-444b-88c7-ec562dbe9483	24240943-413b-4035-a9cf-2079a40c109c	https://res.cloudinary.com/dxfxicebq/image/upload/v1774381437/try-ons/usypzupgpu714wi9hr9k.jpg	0	t	2026-03-24 19:43:58.454
e2d77117-67f3-4c09-b97b-409a4d26459b	43a09bdb-98c8-453c-bb38-74b6660a7b40	https://res.cloudinary.com/dxfxicebq/image/upload/v1774381684/try-ons/o6qbpzfgm5quextonqst.jpg	0	t	2026-03-24 19:48:05.434
4c1b6bfc-8fe0-4494-8e75-5a29b5694041	2ec72838-e25f-4303-a89b-cf9a76b66c07	https://res.cloudinary.com/dxfxicebq/image/upload/v1774459105/try-ons/ai5wosqcntovbjunxs7y.jpg	0	t	2026-03-25 17:18:27.191
c135743b-eafe-4ca3-900c-6a0c16e53722	cc4222f5-00e6-4970-9e23-370d027e6f3e	https://res.cloudinary.com/dxfxicebq/image/upload/v1774459105/try-ons/vvfoii9w58l85kug6atl.jpg	0	t	2026-03-25 17:18:27.203
49d56c18-6a4a-49cb-bf38-e28f89030abc	0281f9ce-9f72-4249-aca7-1a92aa8bfc12	https://res.cloudinary.com/dxfxicebq/image/upload/v1774459105/try-ons/cbxcxdlsoxk5ehftyq0a.jpg	0	t	2026-03-25 17:18:27.209
\.


--
-- Data for Name: product_color_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_color_variants (variant_id, pattern_id, color, hex_code, stock, skin_tones, display_order, created_at, updated_at) FROM stdin;
24240943-413b-4035-a9cf-2079a40c109c	a482107d-8fc8-42c8-b214-5fc7742dc42d	WHITE	\N	44	{MEDIUM,LIGHT}	0	2026-03-24 19:43:58.453	2026-03-24 19:43:58.453
43a09bdb-98c8-453c-bb38-74b6660a7b40	2c3d8ca2-6932-4ed9-a5cc-98a145192f34	GREY	\N	45	{MEDIUM,LIGHT,FAIR}	0	2026-03-24 19:48:05.433	2026-03-24 19:48:05.433
2ec72838-e25f-4303-a89b-cf9a76b66c07	8cc6756f-1638-4bf0-95c7-d9934bd24132	SKY_BLUE	\N	25	{LIGHT,MEDIUM,OLIVE,TAN,DARK_BROWN}	0	2026-03-25 17:18:27.185	2026-03-25 17:18:27.185
cc4222f5-00e6-4970-9e23-370d027e6f3e	8cc6756f-1638-4bf0-95c7-d9934bd24132	GREY	\N	56	{MEDIUM,LIGHT,OLIVE}	1	2026-03-25 17:18:27.198	2026-03-25 17:18:27.198
0281f9ce-9f72-4249-aca7-1a92aa8bfc12	5128f22d-a2ea-49ab-b813-e0185bde9c7c	WHITE	\N	52	{LIGHT,MEDIUM}	0	2026-03-25 17:18:27.207	2026-03-25 17:18:27.207
\.


--
-- Data for Name: product_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_comments (comment_id, product_id, user_id, comment_text, created_at, updated_at, image_urls) FROM stdin;
\.


--
-- Data for Name: product_group_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_group_assignments (assignment_id, product_id, group_id, assigned_at) FROM stdin;
3ea0fef5-e4d6-46f6-be7f-88d8e0a0153b	34f3b995-f0eb-4e33-9466-94f3175e5594	33ca8901-1d4a-4cc4-80ef-15157401d86c	2026-03-11 16:43:38.691
11e3d33d-6bcd-428f-b75e-cf8b61c58d5b	5bb799e7-3e68-4a53-821b-6959ba3a3038	33ca8901-1d4a-4cc4-80ef-15157401d86c	2026-03-12 15:08:23.894
\.


--
-- Data for Name: product_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_groups (group_id, creator_id, name, slug, description, parent_id, created_at, updated_at) FROM stdin;
222c153a-57f2-4fd5-a39b-54bf7e5f9bf8	3fa5464c-3181-4083-b072-b6205143ca64	Mens Collection	menscollection	\N	\N	2026-03-10 17:20:53.137	2026-03-10 17:20:53.137
c5458eaa-927d-41cf-a72f-e3c5168672eb	3fa5464c-3181-4083-b072-b6205143ca64	Jackets 	jackets	\N	222c153a-57f2-4fd5-a39b-54bf7e5f9bf8	2026-03-10 17:25:26.68	2026-03-10 17:25:26.68
73ea6b9c-79d4-49dc-97ba-f252db090b19	3fa5464c-3181-4083-b072-b6205143ca64	Blue ckiiuki	blueckiiuki	\N	c5458eaa-927d-41cf-a72f-e3c5168672eb	2026-03-10 17:25:41.24	2026-03-10 17:25:41.24
581cae93-a3c2-480d-adf7-80c1ea003449	a231601f-821b-44fb-9c3d-704820bf5793	Summer collcetion 	summercollcetion	\N	\N	2026-03-10 18:13:51.479	2026-03-10 18:13:51.479
33ca8901-1d4a-4cc4-80ef-15157401d86c	a231601f-821b-44fb-9c3d-704820bf5793	Winter collection 	wintercollection	\N	\N	2026-03-11 16:25:13.391	2026-03-11 16:25:13.391
31f42b87-857a-4a00-b502-33e9ed4dc13e	a231601f-821b-44fb-9c3d-704820bf5793	Lehenga Collection	lehengacollection	\N	33ca8901-1d4a-4cc4-80ef-15157401d86c	2026-03-11 16:25:28.861	2026-03-11 16:25:28.861
\.


--
-- Data for Name: product_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_likes (like_id, product_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: product_patterns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_patterns (pattern_id, product_id, name, body_shapes, display_order, created_at, updated_at) FROM stdin;
a482107d-8fc8-42c8-b214-5fc7742dc42d	c3f7e9b9-1faa-4739-a766-d30d09ff1aaa	sd	{PEAR}	0	2026-03-24 19:43:58.449	2026-03-24 19:43:58.449
2c3d8ca2-6932-4ed9-a5cc-98a145192f34	e1ca2303-1441-4355-a42a-d51c347e574a	Relaxed Fit 	{ATHLETIC,PEAR}	0	2026-03-24 19:48:05.431	2026-03-24 19:48:05.431
8cc6756f-1638-4bf0-95c7-d9934bd24132	a27506e0-8bff-4b84-8411-d5902d85f1b8	Relaxed Fit 	{HOURGLASS,PEAR,APPLE,RECTANGLE,INVERTED_TRIANGLE}	0	2026-03-25 17:18:27.179	2026-03-25 17:18:27.179
5128f22d-a2ea-49ab-b813-e0185bde9c7c	a27506e0-8bff-4b84-8411-d5902d85f1b8	Relaex fit 	{ATHLETIC,PETITE}	1	2026-03-25 17:18:27.205	2026-03-25 17:18:27.205
\.


--
-- Data for Name: sub_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sub_categories (sub_category_id, category_id, name, slug, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: try_ons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.try_ons (try_on_id, user_id, product_id, aura_id, result_image_url, created_at, provider, angle, base_tryon_id, angles_generated, cloudinary_public_id, compressed_url, metadata_cache, processing_metrics, thumbnail_url) FROM stdin;
a2b99181-be8f-47a5-97cf-e1db1e90e188	4f70d293-f018-4009-b68b-8945db2acbcc	ca66e151-f390-41f3-b22e-36a85c93e9f5	827ba157-ce66-44cb-ad4c-50d4e33d4dd1	https://res.cloudinary.com/dxfxicebq/image/upload/v1773491332/try-ons/fzfdm95c58kqpkrb6efi.jpg	2026-03-14 12:28:53.762	vertex	\N	\N	{}	try-ons/fzfdm95c58kqpkrb6efi	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/fzfdm95c58kqpkrb6efi?_a=BAMAOGfi0	{"width": 1088, "format": "jpeg", "height": 960, "uploadedAt": "2026-03-14T12:28:53.760Z", "dominantColors": ["#100100100", "#e0e0e0", "#c0c0a0"]}	{"uploadTime": 8081, "originalSize": 263286, "compressedSize": 61239, "compressionRatio": "76.74"}	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/fzfdm95c58kqpkrb6efi?_a=BAMAOGfi0
345031cf-de0b-4064-93af-4ee98ef208f0	4f70d293-f018-4009-b68b-8945db2acbcc	ca66e151-f390-41f3-b22e-36a85c93e9f5	827ba157-ce66-44cb-ad4c-50d4e33d4dd1	https://res.cloudinary.com/dxfxicebq/image/upload/v1773491382/try-ons/tfrkbml1sxxi6lr2g6ei.jpg	2026-03-14 12:29:43.015	gemini	side-left	\N	{}	try-ons/tfrkbml1sxxi6lr2g6ei	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/tfrkbml1sxxi6lr2g6ei?_a=BAMAOGfi0	{"width": 1088, "format": "png", "height": 960, "uploadedAt": "2026-03-14T12:29:43.014Z", "dominantColors": ["#100100100", "#e0e0e0", "#a08080"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/tfrkbml1sxxi6lr2g6ei?_a=BAMAOGfi0
ff8e199b-c33a-48d5-b53e-c8f187f1c252	4f70d293-f018-4009-b68b-8945db2acbcc	ca66e151-f390-41f3-b22e-36a85c93e9f5	827ba157-ce66-44cb-ad4c-50d4e33d4dd1	https://res.cloudinary.com/dxfxicebq/image/upload/v1773491417/try-ons/unwa3hswompmrwmifvde.jpg	2026-03-14 12:30:18.852	gemini	side-right	\N	{}	try-ons/unwa3hswompmrwmifvde	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/unwa3hswompmrwmifvde?_a=BAMAOGfi0	{"width": 1088, "format": "png", "height": 960, "uploadedAt": "2026-03-14T12:30:18.850Z", "dominantColors": ["#100100100", "#e0e0e0", "#c0a080"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/unwa3hswompmrwmifvde?_a=BAMAOGfi0
43f5a4c6-7009-44a8-8f40-c7f1e34a7885	4f70d293-f018-4009-b68b-8945db2acbcc	ca66e151-f390-41f3-b22e-36a85c93e9f5	827ba157-ce66-44cb-ad4c-50d4e33d4dd1	https://res.cloudinary.com/dxfxicebq/image/upload/v1773491458/try-ons/pkgzsii1lhuc4vylybqz.jpg	2026-03-14 12:31:00.836	gemini	side-left	\N	{}	try-ons/pkgzsii1lhuc4vylybqz	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/pkgzsii1lhuc4vylybqz?_a=BAMAOGfi0	{"width": 1088, "format": "png", "height": 960, "uploadedAt": "2026-03-14T12:31:00.835Z", "dominantColors": ["#100100100", "#e0e0e0", "#c0a080"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/pkgzsii1lhuc4vylybqz?_a=BAMAOGfi0
b0a25e51-544a-453c-9c52-d97ccf3ade69	4f70d293-f018-4009-b68b-8945db2acbcc	ca66e151-f390-41f3-b22e-36a85c93e9f5	827ba157-ce66-44cb-ad4c-50d4e33d4dd1	https://res.cloudinary.com/dxfxicebq/image/upload/v1773491500/try-ons/d5cvvo9yhw7loz28e9k4.jpg	2026-03-14 12:31:42.001	gemini	side-right	\N	{}	try-ons/d5cvvo9yhw7loz28e9k4	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/d5cvvo9yhw7loz28e9k4?_a=BAMAOGfi0	{"width": 1088, "format": "png", "height": 960, "uploadedAt": "2026-03-14T12:31:42.000Z", "dominantColors": ["#100100e0", "#100100100", "#100e0e0"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/d5cvvo9yhw7loz28e9k4?_a=BAMAOGfi0
62328c28-c01b-4cb1-89d6-360489fddaa4	23d3d707-c107-40c4-ae87-feb0cc8812a8	ca66e151-f390-41f3-b22e-36a85c93e9f5	c6f05f48-3200-4ce4-b7b0-d0cc4a8ad15f	https://res.cloudinary.com/dxfxicebq/image/upload/v1773684657/try-ons/y2r9frzgi2diqlundvem.jpg	2026-03-16 18:10:58.19	vertex	\N	\N	{}	try-ons/y2r9frzgi2diqlundvem	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/y2r9frzgi2diqlundvem?_a=BAMAOGWQ0	{"width": 1088, "format": "jpeg", "height": 960, "uploadedAt": "2026-03-16T18:10:58.182Z", "dominantColors": ["#c0c0c0", "#e0e0e0", "#c0c0e0"]}	{"uploadTime": 6750, "originalSize": 218508, "compressedSize": 46268, "compressionRatio": "78.83"}	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/y2r9frzgi2diqlundvem?_a=BAMAOGWQ0
3831ca20-ca63-4566-8c30-c7f5c0121028	23d3d707-c107-40c4-ae87-feb0cc8812a8	fff6070a-f3d3-46bd-a248-63eceb35ac53	c6f05f48-3200-4ce4-b7b0-d0cc4a8ad15f	https://res.cloudinary.com/dxfxicebq/image/upload/v1773759301/try-ons/aztitxxho50c07fpetoc.jpg	2026-03-17 14:55:02.444	vertex	\N	\N	{}	try-ons/aztitxxho50c07fpetoc	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/aztitxxho50c07fpetoc?_a=BAMAOGfi0	{"width": 1088, "format": "jpeg", "height": 960, "uploadedAt": "2026-03-17T14:55:02.442Z", "dominantColors": ["#c0c0c0", "#e0e0e0", "#c0c0e0"]}	{"uploadTime": 6130, "originalSize": 195678, "compressedSize": 42560, "compressionRatio": "78.25"}	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/aztitxxho50c07fpetoc?_a=BAMAOGfi0
7de207ab-713d-45d7-b3e3-6b8b47d687fd	23d3d707-c107-40c4-ae87-feb0cc8812a8	f1f0805e-2dee-4f6c-be07-0482f0b9d968	c6f05f48-3200-4ce4-b7b0-d0cc4a8ad15f	https://res.cloudinary.com/dxfxicebq/image/upload/v1773764251/try-ons/m6cuzwsyplszsznmfixj.jpg	2026-03-17 16:17:32.493	vertex	\N	\N	{}	try-ons/m6cuzwsyplszsznmfixj	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/m6cuzwsyplszsznmfixj?_a=BAMAOGfi0	{"width": 1088, "format": "jpeg", "height": 960, "uploadedAt": "2026-03-17T16:17:32.490Z", "dominantColors": ["#c0c0c0", "#e0e0e0", "#c0c0e0"]}	{"uploadTime": 6464, "originalSize": 232814, "compressedSize": 61811, "compressionRatio": "73.45"}	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/m6cuzwsyplszsznmfixj?_a=BAMAOGfi0
80012bcc-240e-483e-b378-2d54fdc2fa92	23d3d707-c107-40c4-ae87-feb0cc8812a8	0382f3d3-88eb-43b9-970f-48fb998ff212	c6f05f48-3200-4ce4-b7b0-d0cc4a8ad15f	https://res.cloudinary.com/dxfxicebq/image/upload/v1773764886/try-ons/nogayjl38x8xv9gcixdh.jpg	2026-03-17 16:28:07.809	vertex	\N	\N	{}	try-ons/nogayjl38x8xv9gcixdh	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/nogayjl38x8xv9gcixdh?_a=BAMAOGfi0	{"width": 1088, "format": "jpeg", "height": 960, "uploadedAt": "2026-03-17T16:28:07.807Z", "dominantColors": ["#c0c0c0", "#e0e0e0", "#c0c0e0"]}	{"uploadTime": 6756, "originalSize": 237947, "compressedSize": 59820, "compressionRatio": "74.86"}	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/nogayjl38x8xv9gcixdh?_a=BAMAOGfi0
a24fdb79-f121-42ed-bfb3-60ead6174c14	23d3d707-c107-40c4-ae87-feb0cc8812a8	ba9d7a2e-5a75-4487-815a-cf0d242d35da	c6f05f48-3200-4ce4-b7b0-d0cc4a8ad15f	https://res.cloudinary.com/dxfxicebq/image/upload/v1773767546/try-ons/nuzer1nfy2s2iw9fq5x9.jpg	2026-03-17 17:12:27.735	gemini	side-left	\N	{}	try-ons/nuzer1nfy2s2iw9fq5x9	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/nuzer1nfy2s2iw9fq5x9?_a=BAMAOGfi0	{"width": 1088, "format": "png", "height": 960, "uploadedAt": "2026-03-17T17:12:27.733Z", "dominantColors": ["#c0c0c0", "#e0e0e0", "#c0c0e0"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/nuzer1nfy2s2iw9fq5x9?_a=BAMAOGfi0
4f2d9c90-ef23-43d6-aa7c-c93c03fb2c5c	23d3d707-c107-40c4-ae87-feb0cc8812a8	ba9d7a2e-5a75-4487-815a-cf0d242d35da	c6f05f48-3200-4ce4-b7b0-d0cc4a8ad15f	https://res.cloudinary.com/dxfxicebq/image/upload/v1773767604/try-ons/u7533hkkqgqgmjc1d9ll.jpg	2026-03-17 17:13:25.294	gemini	side-right	\N	{}	try-ons/u7533hkkqgqgmjc1d9ll	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/u7533hkkqgqgmjc1d9ll?_a=BAMAOGfi0	{"width": 1088, "format": "png", "height": 960, "uploadedAt": "2026-03-17T17:13:25.284Z", "dominantColors": ["#c0c0c0", "#e0c0c0", "#e0e0c0"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/u7533hkkqgqgmjc1d9ll?_a=BAMAOGfi0
c3038cf3-3f87-49a9-98e6-e5f67cbac562	23d3d707-c107-40c4-ae87-feb0cc8812a8	0fad2030-5fa4-4579-bf55-68fe5a56b2d6	c6f05f48-3200-4ce4-b7b0-d0cc4a8ad15f	https://res.cloudinary.com/dxfxicebq/image/upload/v1773767813/try-ons/rxwxr9bq5u9rhl6gaf4u.jpg	2026-03-17 17:16:55.006	vertex	\N	\N	{}	try-ons/rxwxr9bq5u9rhl6gaf4u	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/rxwxr9bq5u9rhl6gaf4u?_a=BAMAOGfi0	{"width": 1088, "format": "jpeg", "height": 960, "uploadedAt": "2026-03-17T17:16:55.001Z", "dominantColors": ["#c0c0c0", "#e0e0e0", "#c0c0e0"]}	{"uploadTime": 4085, "originalSize": 219694, "compressedSize": 53293, "compressionRatio": "75.74"}	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/rxwxr9bq5u9rhl6gaf4u?_a=BAMAOGfi0
a1786c1d-9ec6-42e4-ba2c-6a7c0898b47a	25ae96d6-4433-43e1-8ca3-57a4721227fd	0382f3d3-88eb-43b9-970f-48fb998ff212	61229005-c4b7-46f7-8873-e748710e78b4	https://res.cloudinary.com/dxfxicebq/image/upload/v1773770726/try-ons/u6dhcbklexu21hapxsex.jpg	2026-03-17 18:05:27.46	gemini	side-left	\N	{}	try-ons/u6dhcbklexu21hapxsex	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/u6dhcbklexu21hapxsex?_a=BAMAMiWQ0	{"width": 1088, "format": "png", "height": 960, "uploadedAt": "2026-03-17T18:05:27.458Z", "dominantColors": ["#e0e0e0", "#100100100", "#604040"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/u6dhcbklexu21hapxsex?_a=BAMAMiWQ0
5c1c57dd-4644-47ed-8ec1-e4bfe43bb77f	25ae96d6-4433-43e1-8ca3-57a4721227fd	ba9d7a2e-5a75-4487-815a-cf0d242d35da	61229005-c4b7-46f7-8873-e748710e78b4	https://res.cloudinary.com/dxfxicebq/image/upload/v1773770789/try-ons/ut9xbuggp79k4jwst7lr.jpg	2026-03-17 18:06:30.335	gemini	side-left	\N	{}	try-ons/ut9xbuggp79k4jwst7lr	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/ut9xbuggp79k4jwst7lr?_a=BAMAMiWQ0	{"width": 1088, "format": "png", "height": 960, "uploadedAt": "2026-03-17T18:06:30.332Z", "dominantColors": ["#e0e0e0", "#c0c0c0", "#004080"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/ut9xbuggp79k4jwst7lr?_a=BAMAMiWQ0
a30ec4fe-c36e-44b0-a5ca-2f4a04f662ab	25ae96d6-4433-43e1-8ca3-57a4721227fd	ba9d7a2e-5a75-4487-815a-cf0d242d35da	61229005-c4b7-46f7-8873-e748710e78b4	https://res.cloudinary.com/dxfxicebq/image/upload/v1773770838/try-ons/qlcq0b6xzt9gkhepsrsc.jpg	2026-03-17 18:07:18.77	gemini	side-right	\N	{}	try-ons/qlcq0b6xzt9gkhepsrsc	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/qlcq0b6xzt9gkhepsrsc?_a=BAMAMiWQ0	{"width": 1088, "format": "png", "height": 960, "uploadedAt": "2026-03-17T18:07:18.767Z", "dominantColors": ["#e0e0e0", "#e0c0c0", "#e0e0c0"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/qlcq0b6xzt9gkhepsrsc?_a=BAMAMiWQ0
053a4c1b-7a1b-4a7d-b7ad-7bdf96e7168c	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	0382f3d3-88eb-43b9-970f-48fb998ff212	d91db23b-de73-4649-927e-a0c471919c8d	https://res.cloudinary.com/dxfxicebq/image/upload/v1773845224/try-ons/rk58ohnf3pksmn0umtbp.jpg	2026-03-18 14:47:05.637	vertex	\N	\N	{}	try-ons/rk58ohnf3pksmn0umtbp	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/rk58ohnf3pksmn0umtbp?_a=BAMAMifi0	{"width": 841, "format": "jpeg", "height": 1112, "uploadedAt": "2026-03-18T14:47:05.636Z", "dominantColors": ["#c0a080", "#a0a080", "#a08080"]}	{"uploadTime": 5862, "originalSize": 297238, "compressedSize": 85933, "compressionRatio": "71.09"}	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/rk58ohnf3pksmn0umtbp?_a=BAMAMifi0
3fb3121e-35e0-4d6d-95e4-0f0ac14f4d12	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	342c9cf8-1581-4d92-a8f1-5bbe1ba3bf44	d91db23b-de73-4649-927e-a0c471919c8d	https://res.cloudinary.com/dxfxicebq/image/upload/v1773854683/try-ons/j9ykm4vnpblep02l5xh4.jpg	2026-03-18 17:24:44.431	gemini	side-left	\N	{}	try-ons/j9ykm4vnpblep02l5xh4	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/j9ykm4vnpblep02l5xh4?_a=BAMAMifi0	{"width": 832, "format": "png", "height": 1248, "uploadedAt": "2026-03-18T17:24:44.429Z", "dominantColors": ["#c0c0a0", "#c0a0a0", "#c0a080"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/j9ykm4vnpblep02l5xh4?_a=BAMAMifi0
fcf4737a-4d42-4050-aeb8-8dbac88f3f78	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	f4015110-d7ed-43c7-8c90-35ee2eeb0630	d91db23b-de73-4649-927e-a0c471919c8d	https://res.cloudinary.com/dxfxicebq/image/upload/v1773854871/try-ons/yydlvzok4we1k3n6meno.jpg	2026-03-18 17:27:51.967	gemini	side-left	\N	{}	try-ons/yydlvzok4we1k3n6meno	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/yydlvzok4we1k3n6meno?_a=BAMAMifi0	{"width": 832, "format": "png", "height": 1248, "uploadedAt": "2026-03-18T17:27:51.965Z", "dominantColors": ["#c0c0c0", "#e0e0c0", "#80a0a0"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/yydlvzok4we1k3n6meno?_a=BAMAMifi0
b58f831e-e454-4da6-9842-987642e06507	1df5c992-5033-4efa-a78f-6f69bc8ec9fd	a2f9bbd6-71af-4f0b-8261-399afbc754a7	12caf31d-1aa6-42d4-8254-76607f0b6b4c	https://res.cloudinary.com/dxfxicebq/image/upload/v1773930941/try-ons/eijbkdb0xsfrhhqdh7l6.jpg	2026-03-19 14:35:42.51	gemini	side-left	\N	{}	try-ons/eijbkdb0xsfrhhqdh7l6	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/eijbkdb0xsfrhhqdh7l6?_a=BAMAMiWQ0	{"width": 832, "format": "png", "height": 1248, "uploadedAt": "2026-03-19T14:35:42.508Z", "dominantColors": ["#c0c0c0", "#e0e0e0", "#c0a080"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/eijbkdb0xsfrhhqdh7l6?_a=BAMAMiWQ0
8d87f035-23fd-4be7-8830-f4dd61ebe9a8	1df5c992-5033-4efa-a78f-6f69bc8ec9fd	ca66e151-f390-41f3-b22e-36a85c93e9f5	12caf31d-1aa6-42d4-8254-76607f0b6b4c	https://res.cloudinary.com/dxfxicebq/image/upload/v1773931373/try-ons/r0z3yklpjq3qpavesovs.jpg	2026-03-19 14:42:55.243	gemini	side-left	\N	{}	try-ons/r0z3yklpjq3qpavesovs	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,q_75/v1/try-ons/r0z3yklpjq3qpavesovs?_a=BAMAMiWQ0	{"width": 1407, "format": "jpeg", "height": 768, "uploadedAt": "2026-03-19T14:42:55.242Z", "dominantColors": ["#c0c0c0", "#e0e0e0", "#a0a0a0"]}	\N	https://res.cloudinary.com/dxfxicebq/image/upload/c_limit,f_jpg,h_512,q_auto:low,w_512/v1/try-ons/r0z3yklpjq3qpavesovs?_a=BAMAMiWQ0
\.


--
-- Data for Name: user_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_addresses (address_id, user_id, full_name, phone, pincode, address_line1, address_line2, city, state, landmark, address_type, is_default, created_at, updated_at) FROM stdin;
941c7b96-54e8-4380-a273-2d3bdfbdbf1e	be6b282a-4785-433e-8813-5f8ed890ec89	Gourav Sir 	9622387285	302022	Kota rex oex 	Gyaan vihar 	Kota Dundadi	Rajasthan	Near Jodhupria Sweet house 	HOME	t	2026-03-10 15:35:04.965	2026-03-10 15:35:04.965
4fef0803-6f45-4e78-becf-7535c6b1121c	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	asd	9622382755	302022	asdfs	asd	sdfsdf	Rajasthan	jdsd	HOME	t	2026-03-22 18:50:59.57	2026-03-22 18:50:59.57
5c3ced8d-c829-4c19-ba2c-d739e5a1ca6c	c7941d8f-c16f-4428-bcfd-a7bae381dde9	Jammu 	9622378525	325623	hk h34	hekk  jamu	sdsdsd	Nagaland	jldjsnd	HOME	t	2026-03-23 15:46:00.079	2026-03-23 15:46:00.079
3c5abf99-9dab-45ea-8ccc-54b6748d678c	2e357653-09b9-4ffa-b9ad-12d0706f698a	Gourav Tak	9622387285	302024	!97/23 hsitapura	harpuri	Jaipur	Rajasthan	Near school 	HOME	t	2026-03-24 15:13:23.008	2026-03-24 15:13:23.008
40822697-a7ee-4670-b4b4-61f959fcc6c4	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	Hello d	9622387285	325642	skjdnksad	kiqjandklraj	KJndkjasd	Rajasthan	Nedsswd	HOME	t	2026-03-28 18:14:26.414	2026-03-28 18:14:26.414
d923f990-0b69-4847-a8b0-e4586a1ef945	1df5c992-5033-4efa-a78f-6f69bc8ec9fd	Jamel mamu	9623585433	302022	198/234, pratap nagar jaiipur	Near lalu prasad ka tak	Jaipur	Rajasthan	Near gujjar ki thadi 	HOME	t	2026-03-29 07:53:51.037	2026-03-29 07:53:51.037
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallet_transactions (transaction_id, wallet_id, type, source, amount, reference_id, description, status, created_at) FROM stdin;
b723b474-25f2-40b4-bc26-006632e1bf1c	32062414-3ed5-40cb-8f18-aa6c74af9e62	CREDIT	ADMIN_CREDIT	500.00	ADMIN_CREDIT_1773157374194	Admin added funds	SUCCESS	2026-03-10 15:42:54.195
92393d0d-d9f1-4301-8d81-0bd7002cc757	7628ce13-7230-4a39-8783-659ed79561d6	CREDIT	ADMIN_CREDIT	500.00	ADMIN_CREDIT_1773157473507	Admin added funds	SUCCESS	2026-03-10 15:44:33.508
b80a9e70-7e05-4f9e-a12c-582f1a83fe91	7628ce13-7230-4a39-8783-659ed79561d6	DEBIT	ORDER_PAYMENT	46.57	ORD-2026-000001	Payment for Order #ORD-2026-000001	SUCCESS	2026-03-10 15:45:12.443
f2da0839-da7d-43c8-9a73-0b0f9e754e2f	0699b264-7ddd-4169-8741-afc2523f101a	CREDIT	ADMIN_CREDIT	500.00	ADMIN_CREDIT_1774454360889	Admin added funds	SUCCESS	2026-03-25 15:59:20.89
fee91b01-29c8-41e1-adb5-f90f20154ca2	0699b264-7ddd-4169-8741-afc2523f101a	DEBIT	ORDER_PAYMENT	23.57	ORD-2026-000034	Payment for Order #ORD-2026-000034	SUCCESS	2026-03-29 08:03:26.369
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (wallet_id, user_id, balance, created_at, updated_at) FROM stdin;
32062414-3ed5-40cb-8f18-aa6c74af9e62	3d4cda33-5e33-45f1-8a79-562aa7f07eb1	500.00	2026-03-10 15:42:54.192	2026-03-10 15:42:54.192
7628ce13-7230-4a39-8783-659ed79561d6	be6b282a-4785-433e-8813-5f8ed890ec89	453.43	2026-03-10 15:24:49.512	2026-03-10 15:45:12.441
9f68dfc8-59d4-440c-9537-b371f29762e3	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	0.00	2026-03-22 12:08:01.824	2026-03-22 12:08:01.824
4bcddeea-7b14-47b7-b411-a20419f6ad8f	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	0.00	2026-03-22 18:51:06.491	2026-03-22 18:51:06.491
f96b3ffb-30d1-434f-96ec-e77a0830a729	c7941d8f-c16f-4428-bcfd-a7bae381dde9	0.00	2026-03-23 15:45:08.164	2026-03-23 15:45:08.164
422f3613-0c88-4daf-9b8d-03b293b61408	2e357653-09b9-4ffa-b9ad-12d0706f698a	0.00	2026-03-24 15:12:38.874	2026-03-24 15:12:38.874
0699b264-7ddd-4169-8741-afc2523f101a	1df5c992-5033-4efa-a78f-6f69bc8ec9fd	476.43	2026-03-25 15:59:20.886	2026-03-29 08:03:26.366
\.


--
-- Data for Name: wishlist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlist_items (wishlist_item_id, wishlist_id, product_id, added_at) FROM stdin;
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlists (wishlist_id, user_id, created_at, updated_at) FROM stdin;
7fc07b91-cef5-4d19-8fe9-5f373af9008b	be6b282a-4785-433e-8813-5f8ed890ec89	2026-03-10 15:24:25.911	2026-03-10 15:24:25.911
57b75e41-69d0-4b54-9059-1ba5315eb5e4	8682a537-a9d4-47fc-aa6b-4ca4e635401e	2026-03-10 17:04:38.349	2026-03-10 17:04:38.349
a1e0f319-a14c-47ff-8520-9ad20a9117b0	0269251c-81c1-47e0-b72e-9a6538397cba	2026-03-10 18:43:21.022	2026-03-10 18:43:21.022
4e03ecef-b995-4e03-9353-3aea7f586188	4f70d293-f018-4009-b68b-8945db2acbcc	2026-03-14 12:05:38.806	2026-03-14 12:05:38.806
64cdb569-3197-4ef8-85ac-c3d7226d8b44	23d3d707-c107-40c4-ae87-feb0cc8812a8	2026-03-16 18:06:58.005	2026-03-16 18:06:58.005
a4590b95-3e97-42d4-81c0-cc8094a37441	25ae96d6-4433-43e1-8ca3-57a4721227fd	2026-03-17 18:18:07.863	2026-03-17 18:18:07.863
b12e3758-6c8a-43a9-943f-18c78423ce76	a6f5ab8d-2399-4c18-8287-b9fb9c87cedf	2026-03-18 14:41:06.196	2026-03-18 14:41:06.196
6653ccfa-5986-47cf-94fb-f40782e6923e	1df5c992-5033-4efa-a78f-6f69bc8ec9fd	2026-03-18 18:19:06.47	2026-03-18 18:19:06.47
7037d714-ddb8-4c44-b4d0-97804d14a0fd	61eb2424-a8fb-4ca1-b858-c5fda4cbd3d2	2026-03-22 12:06:15.828	2026-03-22 12:06:15.828
d16278b9-e219-4bd7-bc35-87a511c859dc	c7941d8f-c16f-4428-bcfd-a7bae381dde9	2026-03-23 15:48:37.653	2026-03-23 15:48:37.653
45c7884a-63bc-4949-bac3-544a7debcf81	23cd1a61-dc15-44f4-a557-cb88230fe838	2026-03-24 15:09:28.949	2026-03-24 15:09:28.949
d9d2a781-d6e3-4d4f-a533-d37db09ccaaa	2e357653-09b9-4ffa-b9ad-12d0706f698a	2026-03-24 15:14:49.429	2026-03-24 15:14:49.429
\.


--
-- Name: ApprovalLog ApprovalLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApprovalLog"
    ADD CONSTRAINT "ApprovalLog_pkey" PRIMARY KEY (log_id);


--
-- Name: Aura Aura_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Aura"
    ADD CONSTRAINT "Aura_pkey" PRIMARY KEY (aura_id);


--
-- Name: CreatorLimit CreatorLimit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CreatorLimit"
    ADD CONSTRAINT "CreatorLimit_pkey" PRIMARY KEY (creator_id);


--
-- Name: Creator Creator_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Creator"
    ADD CONSTRAINT "Creator_pkey" PRIMARY KEY (creator_id);


--
-- Name: ProductApproval ProductApproval_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductApproval"
    ADD CONSTRAINT "ProductApproval_pkey" PRIMARY KEY (approval_id);


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (image_id);


--
-- Name: ProductStat ProductStat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductStat"
    ADD CONSTRAINT "ProductStat_pkey" PRIMARY KEY (product_id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (product_id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (user_id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_cart_id_product_id_size_color_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_product_id_size_color_key UNIQUE (cart_id, product_id, size, color);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (cart_item_id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (cart_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: coupon_allowed_pincodes coupon_allowed_pincodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupon_allowed_pincodes
    ADD CONSTRAINT coupon_allowed_pincodes_pkey PRIMARY KEY (id);


--
-- Name: coupon_scopes coupon_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupon_scopes
    ADD CONSTRAINT coupon_scopes_pkey PRIMARY KEY (scope_id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (coupon_id);


--
-- Name: creator_coupons creator_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_coupons
    ADD CONSTRAINT creator_coupons_pkey PRIMARY KEY (creator_coupon_id);


--
-- Name: delivery_tracking delivery_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_tracking
    ADD CONSTRAINT delivery_tracking_pkey PRIMARY KEY (tracking_id);


--
-- Name: guest_cart_items guest_cart_items_guest_cart_id_product_id_size_color_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_cart_items
    ADD CONSTRAINT guest_cart_items_guest_cart_id_product_id_size_color_key UNIQUE (guest_cart_id, product_id, size, color);


--
-- Name: guest_cart_items guest_cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_cart_items
    ADD CONSTRAINT guest_cart_items_pkey PRIMARY KEY (guest_cart_item_id);


--
-- Name: guest_carts guest_carts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_carts
    ADD CONSTRAINT guest_carts_pkey PRIMARY KEY (guest_cart_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);


--
-- Name: order_refunds order_refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_refunds
    ADD CONSTRAINT order_refunds_pkey PRIMARY KEY (refund_id);


--
-- Name: order_replacements order_replacements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_replacements
    ADD CONSTRAINT order_replacements_pkey PRIMARY KEY (replacement_id);


--
-- Name: order_returns order_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_pkey PRIMARY KEY (return_id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (history_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: otp_verifications otp_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verifications
    ADD CONSTRAINT otp_verifications_pkey PRIMARY KEY (otp_id);


--
-- Name: payment_transactions payment_transactions_gateway_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_gateway_order_id_key UNIQUE (gateway_order_id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: product_color_variant_images product_color_variant_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_color_variant_images
    ADD CONSTRAINT product_color_variant_images_pkey PRIMARY KEY (image_id);


--
-- Name: product_color_variants product_color_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_color_variants
    ADD CONSTRAINT product_color_variants_pkey PRIMARY KEY (variant_id);


--
-- Name: product_comments product_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_comments
    ADD CONSTRAINT product_comments_pkey PRIMARY KEY (comment_id);


--
-- Name: product_group_assignments product_group_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_group_assignments
    ADD CONSTRAINT product_group_assignments_pkey PRIMARY KEY (assignment_id);


--
-- Name: product_groups product_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_groups
    ADD CONSTRAINT product_groups_pkey PRIMARY KEY (group_id);


--
-- Name: product_likes product_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_likes
    ADD CONSTRAINT product_likes_pkey PRIMARY KEY (like_id);


--
-- Name: product_patterns product_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_patterns
    ADD CONSTRAINT product_patterns_pkey PRIMARY KEY (pattern_id);


--
-- Name: sub_categories sub_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_categories
    ADD CONSTRAINT sub_categories_pkey PRIMARY KEY (sub_category_id);


--
-- Name: try_ons try_ons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.try_ons
    ADD CONSTRAINT try_ons_pkey PRIMARY KEY (try_on_id);


--
-- Name: user_addresses user_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_pkey PRIMARY KEY (address_id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (wallet_id);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (wishlist_item_id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (wishlist_id);


--
-- Name: Aura_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Aura_status_idx" ON public."Aura" USING btree (status);


--
-- Name: Aura_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Aura_user_id_key" ON public."Aura" USING btree (user_id);


--
-- Name: Creator_store_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Creator_store_slug_key" ON public."Creator" USING btree (store_slug);


--
-- Name: Creator_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Creator_user_id_key" ON public."Creator" USING btree (user_id);


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: cart_items_cart_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cart_items_cart_id_idx ON public.cart_items USING btree (cart_id);


--
-- Name: cart_items_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cart_items_product_id_idx ON public.cart_items USING btree (product_id);


--
-- Name: carts_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX carts_user_id_idx ON public.carts USING btree (user_id);


--
-- Name: carts_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX carts_user_id_key ON public.carts USING btree (user_id);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: coupon_allowed_pincodes_coupon_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coupon_allowed_pincodes_coupon_id_idx ON public.coupon_allowed_pincodes USING btree (coupon_id);


--
-- Name: coupon_allowed_pincodes_coupon_id_pincode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX coupon_allowed_pincodes_coupon_id_pincode_key ON public.coupon_allowed_pincodes USING btree (coupon_id, pincode);


--
-- Name: coupon_allowed_pincodes_pincode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coupon_allowed_pincodes_pincode_idx ON public.coupon_allowed_pincodes USING btree (pincode);


--
-- Name: coupon_scopes_coupon_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coupon_scopes_coupon_id_idx ON public.coupon_scopes USING btree (coupon_id);


--
-- Name: coupon_scopes_coupon_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX coupon_scopes_coupon_id_key ON public.coupon_scopes USING btree (coupon_id);


--
-- Name: coupon_scopes_scope_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coupon_scopes_scope_type_idx ON public.coupon_scopes USING btree (scope_type);


--
-- Name: coupons_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coupons_code_idx ON public.coupons USING btree (code);


--
-- Name: coupons_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);


--
-- Name: coupons_end_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coupons_end_date_idx ON public.coupons USING btree (end_date);


--
-- Name: coupons_is_deleted_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coupons_is_deleted_idx ON public.coupons USING btree (is_deleted);


--
-- Name: coupons_reason_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coupons_reason_idx ON public.coupons USING btree (reason);


--
-- Name: coupons_start_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coupons_start_date_idx ON public.coupons USING btree (start_date);


--
-- Name: coupons_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coupons_status_idx ON public.coupons USING btree (status);


--
-- Name: creator_coupons_approval_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX creator_coupons_approval_status_idx ON public.creator_coupons USING btree (approval_status);


--
-- Name: creator_coupons_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX creator_coupons_code_idx ON public.creator_coupons USING btree (code);


--
-- Name: creator_coupons_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX creator_coupons_code_key ON public.creator_coupons USING btree (code);


--
-- Name: creator_coupons_creator_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX creator_coupons_creator_id_idx ON public.creator_coupons USING btree (creator_id);


--
-- Name: creator_coupons_end_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX creator_coupons_end_date_idx ON public.creator_coupons USING btree (end_date);


--
-- Name: creator_coupons_is_deleted_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX creator_coupons_is_deleted_idx ON public.creator_coupons USING btree (is_deleted);


--
-- Name: creator_coupons_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX creator_coupons_product_id_idx ON public.creator_coupons USING btree (product_id);


--
-- Name: creator_coupons_start_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX creator_coupons_start_date_idx ON public.creator_coupons USING btree (start_date);


--
-- Name: creator_coupons_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX creator_coupons_status_idx ON public.creator_coupons USING btree (status);


--
-- Name: delivery_tracking_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX delivery_tracking_created_at_idx ON public.delivery_tracking USING btree (created_at DESC);


--
-- Name: delivery_tracking_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX delivery_tracking_order_id_idx ON public.delivery_tracking USING btree (order_id);


--
-- Name: guest_cart_items_guest_cart_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_cart_items_guest_cart_id_idx ON public.guest_cart_items USING btree (guest_cart_id);


--
-- Name: guest_cart_items_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_cart_items_product_id_idx ON public.guest_cart_items USING btree (product_id);


--
-- Name: guest_carts_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_carts_expires_at_idx ON public.guest_carts USING btree (expires_at);


--
-- Name: guest_carts_session_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_carts_session_id_idx ON public.guest_carts USING btree (session_id);


--
-- Name: guest_carts_session_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX guest_carts_session_id_key ON public.guest_carts USING btree (session_id);


--
-- Name: order_items_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);


--
-- Name: order_items_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_items_product_id_idx ON public.order_items USING btree (product_id);


--
-- Name: order_refunds_initiated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_refunds_initiated_at_idx ON public.order_refunds USING btree (initiated_at DESC);


--
-- Name: order_refunds_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_refunds_order_id_idx ON public.order_refunds USING btree (order_id);


--
-- Name: order_refunds_refund_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_refunds_refund_status_idx ON public.order_refunds USING btree (refund_status);


--
-- Name: order_replacements_new_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_replacements_new_order_id_idx ON public.order_replacements USING btree (new_order_id);


--
-- Name: order_replacements_original_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_replacements_original_order_id_idx ON public.order_replacements USING btree (original_order_id);


--
-- Name: order_replacements_replacement_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_replacements_replacement_status_idx ON public.order_replacements USING btree (replacement_status);


--
-- Name: order_replacements_requested_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_replacements_requested_at_idx ON public.order_replacements USING btree (requested_at DESC);


--
-- Name: order_returns_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_returns_order_id_idx ON public.order_returns USING btree (order_id);


--
-- Name: order_returns_requested_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_returns_requested_at_idx ON public.order_returns USING btree (requested_at DESC);


--
-- Name: order_returns_return_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_returns_return_status_idx ON public.order_returns USING btree (return_status);


--
-- Name: order_status_history_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_status_history_created_at_idx ON public.order_status_history USING btree (created_at DESC);


--
-- Name: order_status_history_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_status_history_order_id_idx ON public.order_status_history USING btree (order_id);


--
-- Name: orders_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_created_at_idx ON public.orders USING btree (created_at DESC);


--
-- Name: orders_current_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_current_status_idx ON public.orders USING btree (current_status);


--
-- Name: orders_order_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_order_number_idx ON public.orders USING btree (order_number);


--
-- Name: orders_order_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX orders_order_number_key ON public.orders USING btree (order_number);


--
-- Name: orders_tracking_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_tracking_number_idx ON public.orders USING btree (tracking_number);


--
-- Name: orders_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_user_id_idx ON public.orders USING btree (user_id);


--
-- Name: otp_verifications_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX otp_verifications_expires_at_idx ON public.otp_verifications USING btree (expires_at);


--
-- Name: otp_verifications_phone_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX otp_verifications_phone_number_idx ON public.otp_verifications USING btree (phone_number);


--
-- Name: payment_transactions_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_transactions_created_at_idx ON public.payment_transactions USING btree (created_at DESC);


--
-- Name: payment_transactions_gateway_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_transactions_gateway_order_id_idx ON public.payment_transactions USING btree (gateway_order_id);


--
-- Name: payment_transactions_gateway_payment_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_transactions_gateway_payment_id_idx ON public.payment_transactions USING btree (gateway_payment_id);


--
-- Name: payment_transactions_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_transactions_order_id_idx ON public.payment_transactions USING btree (order_id);


--
-- Name: payment_transactions_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_transactions_status_idx ON public.payment_transactions USING btree (status);


--
-- Name: product_color_variant_images_variant_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_color_variant_images_variant_id_idx ON public.product_color_variant_images USING btree (variant_id);


--
-- Name: product_color_variants_pattern_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_color_variants_pattern_id_idx ON public.product_color_variants USING btree (pattern_id);


--
-- Name: product_group_assignments_group_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_group_assignments_group_id_idx ON public.product_group_assignments USING btree (group_id);


--
-- Name: product_group_assignments_product_id_group_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_group_assignments_product_id_group_id_key ON public.product_group_assignments USING btree (product_id, group_id);


--
-- Name: product_group_assignments_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_group_assignments_product_id_idx ON public.product_group_assignments USING btree (product_id);


--
-- Name: product_groups_creator_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_groups_creator_id_idx ON public.product_groups USING btree (creator_id);


--
-- Name: product_groups_creator_id_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_groups_creator_id_slug_key ON public.product_groups USING btree (creator_id, slug);


--
-- Name: product_groups_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_groups_parent_id_idx ON public.product_groups USING btree (parent_id);


--
-- Name: product_likes_product_id_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_likes_product_id_user_id_key ON public.product_likes USING btree (product_id, user_id);


--
-- Name: product_patterns_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_patterns_product_id_idx ON public.product_patterns USING btree (product_id);


--
-- Name: sub_categories_category_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sub_categories_category_id_idx ON public.sub_categories USING btree (category_id);


--
-- Name: sub_categories_category_id_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sub_categories_category_id_name_key ON public.sub_categories USING btree (category_id, name);


--
-- Name: sub_categories_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sub_categories_slug_key ON public.sub_categories USING btree (slug);


--
-- Name: try_ons_aura_id_product_id_angle_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX try_ons_aura_id_product_id_angle_idx ON public.try_ons USING btree (aura_id, product_id, angle);


--
-- Name: try_ons_cloudinary_public_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX try_ons_cloudinary_public_id_idx ON public.try_ons USING btree (cloudinary_public_id);


--
-- Name: try_ons_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX try_ons_user_id_idx ON public.try_ons USING btree (user_id);


--
-- Name: user_addresses_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_addresses_user_id_idx ON public.user_addresses USING btree (user_id);


--
-- Name: wallet_transactions_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wallet_transactions_created_at_idx ON public.wallet_transactions USING btree (created_at DESC);


--
-- Name: wallet_transactions_source_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wallet_transactions_source_idx ON public.wallet_transactions USING btree (source);


--
-- Name: wallet_transactions_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wallet_transactions_type_idx ON public.wallet_transactions USING btree (type);


--
-- Name: wallet_transactions_wallet_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wallet_transactions_wallet_id_idx ON public.wallet_transactions USING btree (wallet_id);


--
-- Name: wallets_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wallets_user_id_idx ON public.wallets USING btree (user_id);


--
-- Name: wallets_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wallets_user_id_key ON public.wallets USING btree (user_id);


--
-- Name: wishlist_items_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wishlist_items_product_id_idx ON public.wishlist_items USING btree (product_id);


--
-- Name: wishlist_items_wishlist_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wishlist_items_wishlist_id_idx ON public.wishlist_items USING btree (wishlist_id);


--
-- Name: wishlist_items_wishlist_id_product_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wishlist_items_wishlist_id_product_id_key ON public.wishlist_items USING btree (wishlist_id, product_id);


--
-- Name: wishlists_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wishlists_user_id_idx ON public.wishlists USING btree (user_id);


--
-- Name: wishlists_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wishlists_user_id_key ON public.wishlists USING btree (user_id);


--
-- Name: payment_transactions payment_transactions_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER payment_transactions_updated_at_trigger BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_payment_transactions_updated_at();


--
-- Name: user_addresses trigger_update_user_addresses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_user_addresses_updated_at BEFORE UPDATE ON public.user_addresses FOR EACH ROW EXECUTE FUNCTION public.update_user_addresses_updated_at();


--
-- Name: wishlists trigger_update_wishlists_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_wishlists_updated_at BEFORE UPDATE ON public.wishlists FOR EACH ROW EXECUTE FUNCTION public.update_wishlists_updated_at();


--
-- Name: ApprovalLog ApprovalLog_approval_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApprovalLog"
    ADD CONSTRAINT "ApprovalLog_approval_id_fkey" FOREIGN KEY (approval_id) REFERENCES public."ProductApproval"(approval_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Aura Aura_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Aura"
    ADD CONSTRAINT "Aura_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CreatorLimit CreatorLimit_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CreatorLimit"
    ADD CONSTRAINT "CreatorLimit_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES public."Creator"(creator_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Creator Creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Creator"
    ADD CONSTRAINT "Creator_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductApproval ProductApproval_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductApproval"
    ADD CONSTRAINT "ProductApproval_admin_user_id_fkey" FOREIGN KEY (admin_user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductApproval ProductApproval_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductApproval"
    ADD CONSTRAINT "ProductApproval_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductApproval ProductApproval_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductApproval"
    ADD CONSTRAINT "ProductApproval_submitted_by_fkey" FOREIGN KEY (submitted_by) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductImage ProductImage_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductStat ProductStat_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductStat"
    ADD CONSTRAINT "ProductStat_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES public."Creator"(creator_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_sub_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_sub_category_id_fkey" FOREIGN KEY (sub_category_id) REFERENCES public.sub_categories(sub_category_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupon_allowed_pincodes coupon_allowed_pincodes_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupon_allowed_pincodes
    ADD CONSTRAINT coupon_allowed_pincodes_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(coupon_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupon_scopes coupon_scopes_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupon_scopes
    ADD CONSTRAINT coupon_scopes_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(coupon_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: creator_coupons creator_coupons_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_coupons
    ADD CONSTRAINT creator_coupons_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public."Creator"(creator_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: creator_coupons creator_coupons_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_coupons
    ADD CONSTRAINT creator_coupons_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: delivery_tracking delivery_tracking_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_tracking
    ADD CONSTRAINT delivery_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: guest_cart_items guest_cart_items_guest_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_cart_items
    ADD CONSTRAINT guest_cart_items_guest_cart_id_fkey FOREIGN KEY (guest_cart_id) REFERENCES public.guest_carts(guest_cart_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: guest_cart_items guest_cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_cart_items
    ADD CONSTRAINT guest_cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_refunds order_refunds_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_refunds
    ADD CONSTRAINT order_refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_replacements order_replacements_original_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_replacements
    ADD CONSTRAINT order_replacements_original_order_id_fkey FOREIGN KEY (original_order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_returns order_returns_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_shipping_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES public.user_addresses(address_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment_transactions payment_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_color_variant_images product_color_variant_images_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_color_variant_images
    ADD CONSTRAINT product_color_variant_images_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_color_variants(variant_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_color_variants product_color_variants_pattern_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_color_variants
    ADD CONSTRAINT product_color_variants_pattern_id_fkey FOREIGN KEY (pattern_id) REFERENCES public.product_patterns(pattern_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_comments product_comments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_comments
    ADD CONSTRAINT product_comments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_comments product_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_comments
    ADD CONSTRAINT product_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_group_assignments product_group_assignments_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_group_assignments
    ADD CONSTRAINT product_group_assignments_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.product_groups(group_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_group_assignments product_group_assignments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_group_assignments
    ADD CONSTRAINT product_group_assignments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_groups product_groups_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_groups
    ADD CONSTRAINT product_groups_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public."Creator"(creator_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_groups product_groups_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_groups
    ADD CONSTRAINT product_groups_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.product_groups(group_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_likes product_likes_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_likes
    ADD CONSTRAINT product_likes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_likes product_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_likes
    ADD CONSTRAINT product_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_patterns product_patterns_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_patterns
    ADD CONSTRAINT product_patterns_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sub_categories sub_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_categories
    ADD CONSTRAINT sub_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: try_ons try_ons_aura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.try_ons
    ADD CONSTRAINT try_ons_aura_id_fkey FOREIGN KEY (aura_id) REFERENCES public."Aura"(aura_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: try_ons try_ons_base_tryon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.try_ons
    ADD CONSTRAINT try_ons_base_tryon_id_fkey FOREIGN KEY (base_tryon_id) REFERENCES public.try_ons(try_on_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: try_ons try_ons_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.try_ons
    ADD CONSTRAINT try_ons_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: try_ons try_ons_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.try_ons
    ADD CONSTRAINT try_ons_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_addresses user_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wallet_transactions wallet_transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(wallet_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_wishlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_wishlist_id_fkey FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(wishlist_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ipbJUd14peKNPJ5OVAT4zWB2wSbCJ1XcecCodn7amcTm5DnCtbUq0QBlBYfRhYo

