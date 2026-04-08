# AI Generation Performance Optimization Tasks

**Project:** AiVestire
**Objective:** Reduce Aura + Try-On generation time to **≤ 60 seconds** and eliminate timeout failures
**Priority:** High / Production Critical
**Owner:** Backend + AI Infra Team

---

## Goal SLA

| Flow            | Current |    Target |
| --------------- | ------: | --------: |
| Aura Generation | 3–4 min | 15–25 sec |
| Try-On          | 3–4 min | 20–30 sec |
| Combined        | timeout |  < 60 sec |

---

# Phase 1 — Critical Immediate Fixes (Do First)

## Task 1 — Reduce AI inference steps

**Priority:** P0
**Impact:** Very High

### Current

```ts
baseSteps: 50
```

### Target

```ts
// Aura
steps: 16

// Try-On
baseSteps: 18
```

### Checklist

* [ ] Update Aura steps to 16
* [ ] Update Try-On steps to 18
* [ ] Keep max steps <= 24
* [ ] Test output quality after optimization

### Expected Improvement

* 40–60% latency reduction

---

## Task 2 — Resize images BEFORE AI call

**Priority:** P0
**Impact:** Very High

### Implementation

```ts
async optimizeForAura(buffer: Buffer) {
  return sharp(buffer)
    .resize(512, 768, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();
}

async optimizeForTryOn(buffer: Buffer) {
  return sharp(buffer)
    .resize(768, 1024)
    .jpeg({ quality: 82 })
    .toBuffer();
}
```

### Checklist

* [ ] Aura image max 512x768
* [ ] Try-on image max 768x1024
* [ ] JPEG quality 80–82
* [ ] Strip metadata
* [ ] Validate max upload size

### Expected Improvement

* 20–40 sec saved

---

## Task 3 — Remove Cloudinary roundtrip before AI

**Priority:** P0
**Impact:** Very High

### Current Flow (bad)

```text
upload -> cloudinary -> download -> vertex
```

### New Flow (required)

```text
multer buffer -> sharp -> vertex -> final upload cloudinary
```

### Checklist

* [ ] Use file.buffer directly
* [ ] Remove pre-AI Cloudinary upload
* [ ] Upload only final generated image
* [ ] Keep source upload optional for history

### Expected Improvement

* 10–20 sec saved

---

# Phase 2 — Worker & Queue Optimization

## Task 4 — Increase Bull concurrency

**Priority:** P0
**Impact:** High

```ts
@Process({
  name: 'GENERATE_AVATARS',
  concurrency: 4
})
```

```ts
@Process({
  name: 'TRY_ON',
  concurrency: 6
})
```

### Checklist

* [ ] Separate aura worker
* [ ] Separate try-on worker
* [ ] Tune concurrency
* [ ] Monitor CPU and memory

---

## Task 5 — Increase job timeout

**Priority:** P0
**Impact:** High

```ts
queue.add('TRY_ON', payload, {
  timeout: 60000,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000
  }
})
```

### Checklist

* [ ] Set hard timeout = 60 sec
* [ ] Add retry attempts = 3
* [ ] Add exponential backoff

---

## Task 6 — Add hard fail-safe timeout

**Priority:** P0
**Impact:** High

```ts
await Promise.race([
  this.vertexService.generate(),
  timeout(55000)
])
```

### Checklist

* [ ] Vertex timeout
* [ ] Gemini timeout
* [ ] Sharp timeout safety
* [ ] DB timeout safety

---

# Phase 3 — Code Path Optimization

## Task 7 — Parallelize independent operations

**Priority:** P1
**Impact:** High

```ts
const [aura, product] = await Promise.all([
  this.auraService.getAura(auraId),
  this.productService.getProduct(productId)
]);
```

```ts
const [avatarBuffer, clothBuffer] = await Promise.all([
  optimizeAvatar(),
  optimizeCloth()
]);
```

### Checklist

* [ ] DB reads parallel
* [ ] Image preprocessing parallel
* [ ] Metadata extraction parallel

---

# Phase 4 — Infra Optimization

## Task 8 — Use nearest Vertex region

**Priority:** P1
**Impact:** Medium to High

Recommended:

```text
asia-south1
```

### Checklist

* [ ] Check current region
* [ ] Migrate from US region if applicable
* [ ] Benchmark latency

---

## Task 9 — Warm worker instances

**Priority:** P1
**Impact:** Medium

```ts
@Cron('*/5 * * * *')
async warmVertex() {
  await this.vertexService.ping();
}
```

### Checklist

* [ ] Warm every 5 min
* [ ] Monitor cold start latency

---

# Phase 5 — Caching & Repeat Optimization

## Task 10 — Cache try-on by aura + product

**Priority:** P1
**Impact:** Very High

```ts
cacheKey = `${auraId}:${productId}`
```

### Checklist

* [ ] DB lookup before generation
* [ ] Redis cache layer
* [ ] TTL strategy
* [ ] Invalidate on aura recreation

---

# Phase 6 — Monitoring (Critical)

## Task 11 — Add step-level timing logs

**Priority:** P0

### Track timings

* [ ] image resize time
* [ ] Vertex response time
* [ ] Gemini response time
* [ ] Cloudinary upload time
* [ ] DB update time
* [ ] total job time

### Example

```text
fetchAura: 120ms
fetchProduct: 90ms
resize: 800ms
vertex: 22000ms
cloudinary: 3000ms
db: 120ms
total: 26000ms
```

---

# Recommended Execution Order

## Week 1

* [ ] Reduce steps
* [ ] Resize images
* [ ] Remove cloudinary roundtrip
* [ ] Increase timeout
* [ ] Add concurrency

## Week 2

* [ ] Parallel calls
* [ ] Add caching
* [ ] Add monitoring logs
* [ ] Optimize region

## Week 3

* [ ] Warm workers
* [ ] Improve polling / websocket
* [ ] Autoscaling

---

# Expected Final Result

```text
Aura: 18–22 sec
Try-On: 20–28 sec
Total: 40–50 sec
```

Stable production SLA under 1 minute.
