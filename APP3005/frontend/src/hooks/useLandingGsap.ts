import { RefObject, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BASE_EASE = "power2.out";
const REVEAL_CLEAR_PROPS = "opacity,transform,visibility,filter";

const getScopedElements = (container: HTMLElement, selector: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(selector));

const getChildElements = (container: HTMLElement) =>
  Array.from(container.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );

export const useLandingGsap = (scope: RefObject<HTMLElement>) => {
  useLayoutEffect(() => {
    if (!scope.current || typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const cleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      const heroVideo = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-video"]');
      const heroGlow = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-glow"]');
      const heroOrb = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-orb"]');
      const heroPanel = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-panel"]');
      const heroKicker = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-kicker"]');
      const heroTitleLines = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-title-line"]');
      const heroBadges = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-badges"] > *');
      const heroCopy = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-copy"]');
      const heroActions = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-actions"] > *');
      const heroStats = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-stats"] > *');
      const heroSideLabel = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-side-label"]');
      const heroScroll = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-scroll"]');
      const heroScrollLine = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-scroll-line"]');
      const heroPanelShimmer = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-panel-shimmer"]');
      const navShell = gsap.utils.toArray<HTMLElement>('[data-gsap="nav-shell"]');
      const navBrand = gsap.utils.toArray<HTMLElement>('[data-gsap="nav-brand"]');
      const navLinks = gsap.utils.toArray<HTMLElement>('[data-gsap="nav-links"]');
      const navItems = navLinks.flatMap((group) =>
        getScopedElements(group, '[data-gsap="nav-link"]'),
      );
      const navActions = gsap.utils.toArray<HTMLElement>('[data-gsap="nav-actions"]');
      const navActionItems = navActions.flatMap((group) => getChildElements(group));
      const ambientOrbs = gsap.utils.toArray<HTMLElement>('[data-gsap="ambient-orb"]');
      const testimonialQuoteMarks = gsap.utils.toArray<HTMLElement>(
        '[data-gsap="testimonial-quote-mark"]',
      );

      const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

      const setupHoverDepth = (
        elements: HTMLElement[],
        options: {
          liftX: number;
          liftY: number;
          rotateX: number;
          rotateY: number;
          bgSelector?: string;
          contentSelector?: string;
        },
      ) => {
        if (!supportsFinePointer) {
          return;
        }

        elements.forEach((element) => {
          const bg = options.bgSelector
            ? element.querySelector<HTMLElement>(options.bgSelector)
            : null;
          const content = options.contentSelector
            ? element.querySelector<HTMLElement>(options.contentSelector)
            : null;

          gsap.set(element, {
            transformPerspective: 1200,
            transformStyle: "preserve-3d",
            willChange: "transform",
          });

          if (bg) {
            gsap.set(bg, { willChange: "transform" });
          }

          if (content) {
            gsap.set(content, { willChange: "transform" });
          }

          const xTo = gsap.quickTo(element, "x", {
            duration: 0.7,
            ease: "power3.out",
          });
          const yTo = gsap.quickTo(element, "y", {
            duration: 0.7,
            ease: "power3.out",
          });
          const rotateXTo = gsap.quickTo(element, "rotationX", {
            duration: 0.8,
            ease: "power3.out",
          });
          const rotateYTo = gsap.quickTo(element, "rotationY", {
            duration: 0.8,
            ease: "power3.out",
          });

          const bgXTo = bg
            ? gsap.quickTo(bg, "x", { duration: 0.8, ease: "power3.out" })
            : null;
          const bgYTo = bg
            ? gsap.quickTo(bg, "y", { duration: 0.8, ease: "power3.out" })
            : null;
          const bgScaleTo = bg
            ? gsap.quickTo(bg, "scale", { duration: 0.8, ease: "power3.out" })
            : null;

          const contentXTo = content
            ? gsap.quickTo(content, "x", { duration: 0.7, ease: "power3.out" })
            : null;
          const contentYTo = content
            ? gsap.quickTo(content, "y", { duration: 0.7, ease: "power3.out" })
            : null;

          const handleMove = (event: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            const px = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            const py = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

            xTo(px * options.liftX);
            yTo(py * options.liftY);
            rotateXTo(-py * options.rotateX);
            rotateYTo(px * options.rotateY);

            bgXTo?.(px * -12);
            bgYTo?.(py * -12);
            bgScaleTo?.(1.06);

            contentXTo?.(px * 4);
            contentYTo?.(py * 4);
          };

          const handleLeave = () => {
            xTo(0);
            yTo(0);
            rotateXTo(0);
            rotateYTo(0);
            bgXTo?.(0);
            bgYTo?.(0);
            bgScaleTo?.(1);
            contentXTo?.(0);
            contentYTo?.(0);
          };

          element.addEventListener("mousemove", handleMove);
          element.addEventListener("mouseleave", handleLeave);

          cleanups.push(() => {
            element.removeEventListener("mousemove", handleMove);
            element.removeEventListener("mouseleave", handleLeave);
          });
        });
      };

      const setupMagnetic = (
        elements: HTMLElement[],
        options: {
          strengthX: number;
          strengthY: number;
          scale: number;
          duration?: number;
        },
      ) => {
        if (!supportsFinePointer) {
          return;
        }

        elements.forEach((element) => {
          gsap.set(element, { willChange: "transform" });

          const xTo = gsap.quickTo(element, "x", {
            duration: options.duration ?? 0.38,
            ease: "power3.out",
          });
          const yTo = gsap.quickTo(element, "y", {
            duration: options.duration ?? 0.38,
            ease: "power3.out",
          });
          const scaleTo = gsap.quickTo(element, "scale", {
            duration: options.duration ?? 0.42,
            ease: "power3.out",
          });

          const handleMove = (event: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            const px = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            const py = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

            xTo(px * options.strengthX);
            yTo(py * options.strengthY);
            scaleTo(options.scale);
          };

          const handleLeave = () => {
            xTo(0);
            yTo(0);
            scaleTo(1);
          };

          element.addEventListener("mousemove", handleMove);
          element.addEventListener("mouseleave", handleLeave);

          cleanups.push(() => {
            element.removeEventListener("mousemove", handleMove);
            element.removeEventListener("mouseleave", handleLeave);
          });
        });
      };

      const setupIdleFloat = (
        elements: HTMLElement[],
        options: {
          y: number;
          rotate?: number;
          duration: number;
          delay?: number;
          scale?: number;
        },
      ) => {
        elements.forEach((element, index) => {
          const direction = index % 2 === 0 ? 1 : -1;
          gsap.set(element, { willChange: "transform" });

          gsap.to(element, {
            y: options.y * direction,
            rotateZ: (options.rotate ?? 0) * direction,
            scale: options.scale ?? 1,
            duration: options.duration + index * 0.18,
            delay: (options.delay ?? 0) + index * 0.08,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            overwrite: "auto",
          });
        });
      };

      const setupScrollDrift = (
        elements: HTMLElement[],
        options: {
          trigger: HTMLElement;
          distance: number;
          rotate?: number;
          scrub?: number;
          start?: string;
          end?: string;
        },
      ) => {
        elements.forEach((element, index) => {
          const direction = index % 2 === 0 ? 1 : -1;

          gsap.to(element, {
            yPercent: options.distance * direction,
            rotateZ: (options.rotate ?? 0) * direction,
            ease: "none",
            scrollTrigger: {
              trigger: options.trigger,
              start: options.start ?? "top bottom",
              end: options.end ?? "bottom top",
              scrub: options.scrub ?? 1.5,
            },
          });
        });
      };

      setupHoverDepth(
        gsap.utils.toArray<HTMLElement>('[data-gsap-hover="tilt-card"]'),
        {
          liftX: 10,
          liftY: 8,
          rotateX: 7,
          rotateY: 9,
          bgSelector: '[data-gsap="story-card-bg"]',
          contentSelector: '[data-gsap="story-card-content"]',
        },
      );

      setupHoverDepth(
        gsap.utils.toArray<HTMLElement>('[data-gsap-hover="lift-card"]'),
        {
          liftX: 6,
          liftY: -8,
          rotateX: 3,
          rotateY: 4,
          contentSelector: '[data-gsap="lift-content"]',
          bgSelector:
            '[data-gsap="pick-image"], [data-gsap="aura-image"], [data-gsap="ecosystem-image"], [data-gsap="testimonial-avatar"]',
        },
      );

      setupMagnetic(
        gsap.utils.toArray<HTMLElement>('[data-gsap-hover="magnetic-soft"]'),
        {
          strengthX: 8,
          strengthY: 8,
          scale: 1.02,
        },
      );

      setupMagnetic(
        gsap.utils.toArray<HTMLElement>('[data-gsap-hover="magnetic-strong"]'),
        {
          strengthX: 14,
          strengthY: 12,
          scale: 1.035,
          duration: 0.42,
        },
      );

      const navTimeline = gsap.timeline({
        defaults: { ease: BASE_EASE },
      });

      if (navShell.length) {
        navTimeline.from(
          navShell,
          {
            duration: 0.95,
            y: -18,
            opacity: 0,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          0,
        );
      }

      if (navBrand.length) {
        navTimeline.from(
          navBrand,
          {
            duration: 0.85,
            x: -16,
            opacity: 0,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          0.12,
        );
      }

      if (navItems.length) {
        navTimeline.from(
          navItems,
          {
            duration: 0.72,
            y: -10,
            opacity: 0,
            stagger: 0.06,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          0.18,
        );
      }

      if (navActionItems.length) {
        navTimeline.from(
          navActionItems,
          {
            duration: 0.72,
            y: -10,
            opacity: 0,
            stagger: 0.06,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          0.24,
        );
      }

      const heroTimeline = gsap.timeline({
        defaults: { ease: BASE_EASE },
      });

      if (heroVideo.length) {
        heroTimeline.from(heroVideo, {
          duration: 2.8,
          scale: 1.08,
          opacity: 0,
        });
      }

      if (heroGlow.length) {
        heroTimeline.from(
          heroGlow,
          {
            duration: 2.1,
            scale: 0.82,
            opacity: 0,
          },
          0.3,
        );
      }

      if (heroOrb.length) {
        heroTimeline.from(
          heroOrb,
          {
            duration: 2,
            scale: 0.72,
            opacity: 0,
          },
          0.44,
        );
      }

      if (heroPanel.length) {
        heroTimeline.from(
          heroPanel,
          {
            duration: 1.8,
            y: 38,
            scale: 0.985,
            opacity: 0,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          0.66,
        );
      }

      if (heroKicker.length) {
        heroTimeline.from(
          heroKicker,
          {
            duration: 1.05,
            y: 18,
            opacity: 0,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          1.12,
        );
      }

      if (heroTitleLines.length) {
        heroTimeline.from(
          heroTitleLines,
          {
            duration: 1.35,
            yPercent: 108,
            opacity: 0,
            stagger: 0.18,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          1.18,
        );
      }

      if (heroBadges.length) {
        heroTimeline.from(
          heroBadges,
          {
            duration: 0.95,
            y: 18,
            opacity: 0,
            stagger: 0.1,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          1.42,
        );
      }

      if (heroCopy.length) {
        heroTimeline.from(
          heroCopy,
          {
            duration: 1.15,
            y: 18,
            opacity: 0,
            filter: "blur(8px)",
            clearProps: REVEAL_CLEAR_PROPS,
          },
          1.6,
        );
      }

      if (heroActions.length) {
        heroTimeline.from(
          heroActions,
          {
            duration: 1.05,
            y: 18,
            opacity: 0,
            stagger: 0.14,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          1.84,
        );
      }

      if (heroStats.length) {
        heroTimeline.from(
          heroStats,
          {
            duration: 1.1,
            y: 20,
            rotateX: -8,
            scale: 0.985,
            opacity: 0,
            stagger: 0.16,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          2.02,
        );
      }

      if (heroSideLabel.length) {
        heroTimeline.from(
          heroSideLabel,
          {
            duration: 1,
            x: 10,
            opacity: 0,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          2.24,
        );
      }

      if (heroScroll.length) {
        heroTimeline.from(
          heroScroll,
          {
            duration: 1,
            y: 12,
            opacity: 0,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          2.34,
        );
      }

      if (heroScrollLine.length) {
        gsap.to(heroScrollLine, {
          duration: 2.4,
          y: 10,
          opacity: 0.42,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (heroGlow.length) {
        gsap.to(heroGlow, {
          duration: 7,
          scale: 1.06,
          opacity: 0.16,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (heroOrb.length) {
        gsap.to(heroOrb, {
          duration: 8,
          y: -12,
          x: 8,
          opacity: 0.28,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (heroPanelShimmer.length) {
        const shimmer = heroPanelShimmer[0];
        const shimmerTimeline = gsap.timeline({
          repeat: -1,
          repeatDelay: 1.8,
          delay: 2.35,
        });

        shimmerTimeline.set(shimmer, { xPercent: -145, opacity: 0 });
        shimmerTimeline.to(shimmer, {
          opacity: 0.72,
          duration: 0.35,
          ease: "sine.out",
        });
        shimmerTimeline.to(
          shimmer,
          {
            xPercent: 185,
            duration: 2.45,
            ease: "power2.inOut",
          },
          0,
        );
        shimmerTimeline.to(
          shimmer,
          {
            opacity: 0,
            duration: 0.5,
            ease: "sine.in",
          },
          1.95,
        );
      }

      if (heroBadges.length) {
        setupIdleFloat(heroBadges, {
          y: 6,
          rotate: 1.5,
          duration: 2.7,
          delay: 2.15,
          scale: 1.015,
        });
      }

      if (heroStats.length) {
        setupIdleFloat(heroStats, {
          y: 7,
          rotate: 0.7,
          duration: 3.3,
          delay: 2.45,
          scale: 1.01,
        });
      }

      const heroSection = document.querySelector<HTMLElement>("#hero");
      if (heroSection && heroPanel.length && supportsFinePointer && window.innerWidth >= 1024) {
        const panel = heroPanel[0];
        const glow = heroGlow[0] ?? null;
        const orb = heroOrb[0] ?? null;

        gsap.set(panel, {
          transformPerspective: 1600,
          transformStyle: "preserve-3d",
          willChange: "transform",
        });

        const panelXTo = gsap.quickTo(panel, "x", {
          duration: 0.95,
          ease: "power3.out",
        });
        const panelYTo = gsap.quickTo(panel, "y", {
          duration: 0.95,
          ease: "power3.out",
        });
        const panelRotateXTo = gsap.quickTo(panel, "rotationX", {
          duration: 1.05,
          ease: "power3.out",
        });
        const panelRotateYTo = gsap.quickTo(panel, "rotationY", {
          duration: 1.05,
          ease: "power3.out",
        });
        const glowXTo = glow
          ? gsap.quickTo(glow, "xPercent", { duration: 1.1, ease: "power3.out" })
          : null;
        const glowYTo = glow
          ? gsap.quickTo(glow, "yPercent", { duration: 1.1, ease: "power3.out" })
          : null;
        const orbXTo = orb
          ? gsap.quickTo(orb, "xPercent", { duration: 1.15, ease: "power3.out" })
          : null;
        const orbYTo = orb
          ? gsap.quickTo(orb, "yPercent", { duration: 1.15, ease: "power3.out" })
          : null;

        const handleHeroMove = (event: MouseEvent) => {
          const rect = heroSection.getBoundingClientRect();
          const px = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          const py = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

          panelXTo(px * 18);
          panelYTo(py * 12);
          panelRotateXTo(-py * 4);
          panelRotateYTo(px * 5);
          glowXTo?.(px * 5);
          glowYTo?.(py * 4);
          orbXTo?.(px * 8);
          orbYTo?.(py * 6);
        };

        const handleHeroLeave = () => {
          panelXTo(0);
          panelYTo(0);
          panelRotateXTo(0);
          panelRotateYTo(0);
          glowXTo?.(0);
          glowYTo?.(0);
          orbXTo?.(0);
          orbYTo?.(0);
        };

        heroSection.addEventListener("mousemove", handleHeroMove);
        heroSection.addEventListener("mouseleave", handleHeroLeave);

        cleanups.push(() => {
          heroSection.removeEventListener("mousemove", handleHeroMove);
          heroSection.removeEventListener("mouseleave", handleHeroLeave);
        });
      }

      if (heroSection && heroVideo.length && window.innerWidth >= 768) {
        gsap.to(heroVideo, {
          yPercent: 6,
          scale: 1.025,
          ease: "none",
          scrollTrigger: {
            trigger: heroSection,
            start: "top top",
            end: "bottom top",
            scrub: 1.8,
          },
        });
      }

      if (heroSection && heroPanel.length && window.innerWidth >= 768) {
        gsap.to(heroPanel, {
          yPercent: -3,
          ease: "none",
          scrollTrigger: {
            trigger: heroSection,
            start: "top top",
            end: "bottom top",
            scrub: 1.9,
          },
        });
      }

      gsap.utils.toArray<HTMLElement>('[data-gsap="count-up"]').forEach((element) => {
        const target = Number(element.dataset.countTo);
        if (!Number.isFinite(target)) {
          return;
        }

        const decimals = Number(element.dataset.countDecimals ?? "0");
        const prefix = element.dataset.countPrefix ?? "";
        const suffix = element.dataset.countSuffix ?? "";

        const formatValue = (value: number) => {
          const roundedValue =
            decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
          return `${prefix}${roundedValue}${suffix}`;
        };

        const originalText = element.textContent ?? "";

        ScrollTrigger.create({
          trigger: element,
          start: "top 92%",
          once: true,
          onEnter: () => {
            const state = { value: 0 };
            element.textContent = formatValue(0);

            gsap.to(state, {
              value: target,
              duration: 1.45,
              ease: "power2.out",
              onUpdate: () => {
                element.textContent = formatValue(state.value);
              },
              onComplete: () => {
                element.textContent = formatValue(target);
              },
            });
          },
          onLeaveBack: () => {
            element.textContent = originalText;
          },
        });
      });

      ambientOrbs.forEach((orb, index) => {
        const drift = Number(orb.dataset.gsapDrift ?? "22");

        gsap.to(orb, {
          y: drift,
          scale: 1.06,
          duration: 7 + index * 0.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        const trigger = orb.closest<HTMLElement>("section, footer");
        if (trigger && window.innerWidth >= 768) {
          gsap.to(orb, {
            yPercent: -6,
            ease: "none",
            scrollTrigger: {
              trigger,
              start: "top bottom",
              end: "bottom top",
              scrub: 2,
            },
          });
        }
      });

      if (testimonialQuoteMarks.length) {
        setupIdleFloat(testimonialQuoteMarks, {
          y: 7,
          rotate: 3,
          duration: 2.8,
          delay: 0.2,
          scale: 1.06,
        });
      }

      gsap.utils.toArray<HTMLElement>('[data-gsap="section-heading"]').forEach((heading) => {
        gsap.from(heading, {
          duration: 1.15,
          y: 28,
          opacity: 0,
          ease: BASE_EASE,
          clearProps: REVEAL_CLEAR_PROPS,
          scrollTrigger: {
            trigger: heading,
            start: "top 88%",
            once: true,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-gsap-group="story-grid"]').forEach((group) => {
        const cards = getScopedElements(group, '[data-gsap="story-card"]');
        const backgrounds = getScopedElements(group, '[data-gsap="story-card-bg"]');
        const contents = getScopedElements(group, '[data-gsap="story-card-content"]');
        if (!cards.length) {
          return;
        }

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: group,
            start: "top 86%",
            once: true,
          },
        });

        timeline.from(cards, {
          duration: 1.28,
          y: 30,
          opacity: 0,
          clipPath: "inset(0 0 100% 0 round 20px)",
          stagger: 0.18,
          ease: BASE_EASE,
          clearProps: "clipPath,opacity,transform",
        });

        if (backgrounds.length) {
          timeline.from(
            backgrounds,
            {
              duration: 1.45,
              scale: 1.12,
              filter: "blur(8px)",
              stagger: 0.18,
              ease: BASE_EASE,
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.08,
          );
        }

        if (contents.length) {
          timeline.from(
            contents,
            {
              duration: 1.05,
              y: 24,
              opacity: 0,
              stagger: 0.18,
              ease: BASE_EASE,
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.26,
          );
        }

        setupScrollDrift(cards, {
          trigger: group,
          distance: 5,
          rotate: 0.85,
          scrub: 1.45,
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-gsap-group="split-section"]').forEach((section) => {
        const timeline = gsap.timeline({
          defaults: {
            duration: 1.15,
            ease: BASE_EASE,
            clearProps: REVEAL_CLEAR_PROPS,
          },
          scrollTrigger: {
            trigger: section,
            start: "top 84%",
            once: true,
          },
        });

        const copyLeft = getScopedElements(section, '[data-gsap="split-copy-left"]');
        const copyRight = getScopedElements(section, '[data-gsap="split-copy-right"]');
        const mediaLeft = getScopedElements(section, '[data-gsap="split-media-left"]');
        const mediaRight = getScopedElements(section, '[data-gsap="split-media-right"]');
        const mediaReveals = getScopedElements(section, '[data-gsap="media-reveal"]');
        const mediaImages = getScopedElements(section, '[data-gsap="media-image"]');
        const steps = getScopedElements(section, '[data-gsap="step-item"]');
        const stepLineFill = getScopedElements(section, '[data-gsap="step-line-fill"]');
        const stepNodes = getScopedElements(section, '[data-gsap="step-node"]');
        const stepBadges = getScopedElements(section, '[data-gsap="step-badge"]');
        const stepCopies = getScopedElements(section, '[data-gsap="step-copy"]');
        const pickCards = getScopedElements(section, '[data-gsap="pick-card"]');
        const pickImages = getScopedElements(section, '[data-gsap="pick-image"]');
        const auraCards = getScopedElements(section, '[data-gsap="aura-card"]');
        const auraImages = getScopedElements(section, '[data-gsap="aura-image"]');

        if (copyLeft.length) {
          timeline.from(copyLeft, { x: -30, opacity: 0 }, 0);
        }

        if (copyRight.length) {
          timeline.from(copyRight, { x: 30, opacity: 0 }, 0);
        }

        if (mediaLeft.length) {
          timeline.from(mediaLeft, { x: -34, scale: 0.985, opacity: 0 }, 0.14);
          mediaLeft.forEach((media) => {
            gsap.to(media, {
              yPercent: -4,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.9,
              },
            });
          });
        }

        if (mediaRight.length) {
          timeline.from(mediaRight, { x: 34, scale: 0.985, opacity: 0 }, 0.14);
          mediaRight.forEach((media) => {
            gsap.to(media, {
              yPercent: -4,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.9,
              },
            });
          });
        }

        if (mediaReveals.length) {
          timeline.from(
            mediaReveals,
            {
              duration: 1.2,
              clipPath: "inset(0 0 100% 0 round 24px)",
              stagger: 0.14,
              ease: BASE_EASE,
              clearProps: "clipPath,opacity,transform",
            },
            0.22,
          );
        }

        if (mediaImages.length) {
          timeline.from(
            mediaImages,
            {
              duration: 1.35,
              scale: 1.12,
              yPercent: 8,
              stagger: 0.14,
              ease: BASE_EASE,
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.24,
          );
        }

        if (steps.length) {
          timeline.from(
            steps,
            {
              y: 18,
              opacity: 0,
              stagger: 0.16,
            },
            0.34,
          );
        }

        if (stepNodes.length) {
          timeline.from(
            stepNodes,
            {
              duration: 0.9,
              scale: 0.64,
              opacity: 0,
              stagger: 0.16,
              ease: "back.out(1.7)",
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.3,
          );
        }

        if (stepCopies.length) {
          timeline.from(
            stepCopies,
            {
              duration: 0.98,
              x: 22,
              opacity: 0,
              stagger: 0.16,
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.34,
          );
        }

        if (stepBadges.length) {
          timeline.from(
            stepBadges,
            {
              duration: 0.82,
              x: -12,
              opacity: 0,
              scale: 0.92,
              stagger: 0.16,
              ease: "power3.out",
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.42,
          );
        }

        if (stepLineFill.length) {
          stepLineFill.forEach((fill) => {
            gsap.fromTo(
              fill,
              { scaleY: 0, transformOrigin: "top center" },
              {
                scaleY: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top 80%",
                  end: "bottom 55%",
                  scrub: 1.15,
                },
              },
            );
          });
        }

        if (pickCards.length) {
          timeline.from(
            pickCards,
            {
              y: 18,
              opacity: 0,
              stagger: 0.12,
            },
            0.38,
          );
        }

        if (pickImages.length) {
          timeline.from(
            pickImages,
            {
              duration: 1.25,
              scale: 1.08,
              stagger: 0.12,
              ease: BASE_EASE,
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.42,
          );
        }

        if (auraCards.length) {
          timeline.from(
            auraCards,
            {
              y: 18,
              opacity: 0,
              stagger: 0.12,
            },
            0.38,
          );
        }

        if (auraImages.length) {
          timeline.from(
            auraImages,
            {
              duration: 1.25,
              scale: 1.08,
              stagger: 0.12,
              ease: BASE_EASE,
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.42,
          );
        }

        if (steps.length) {
          setupScrollDrift(steps, {
            trigger: section,
            distance: 3.2,
            rotate: 0.4,
            scrub: 1.15,
          });
        }

        if (pickCards.length) {
          setupScrollDrift(pickCards, {
            trigger: section,
            distance: 5,
            rotate: 0.7,
            scrub: 1.35,
          });
        }

        if (auraCards.length) {
          setupScrollDrift(auraCards, {
            trigger: section,
            distance: 5,
            rotate: 0.8,
            scrub: 1.35,
          });
        }
      });

      gsap.utils.toArray<HTMLElement>('[data-gsap-group="ecosystem-grid"]').forEach((group) => {
        const cards = getScopedElements(group, '[data-gsap="ecosystem-card"]');
        const images = getScopedElements(group, '[data-gsap="ecosystem-image"]');
        if (!cards.length) {
          return;
        }

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: group,
            start: "top 86%",
            once: true,
          },
        });

        timeline.from(cards, {
          duration: 1.18,
          y: 24,
          opacity: 0,
          rotateX: -6,
          stagger: 0.16,
          ease: BASE_EASE,
          clearProps: REVEAL_CLEAR_PROPS,
        });

        if (images.length) {
          timeline.from(
            images,
            {
              duration: 1.35,
              scale: 1.08,
              stagger: 0.16,
              ease: BASE_EASE,
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.1,
          );
        }

        setupScrollDrift(cards, {
          trigger: group,
          distance: 6,
          rotate: 1,
          scrub: 1.5,
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-gsap="cta-pill"]').forEach((cta) => {
        gsap.from(cta, {
          duration: 1,
          y: 18,
          opacity: 0,
          ease: BASE_EASE,
          clearProps: REVEAL_CLEAR_PROPS,
          scrollTrigger: {
            trigger: cta,
            start: "top 92%",
            once: true,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-gsap-group="testimonial-grid"]').forEach((group) => {
        const cards = getScopedElements(group, '[data-gsap="testimonial-card"]');
        const glows = getScopedElements(group, '[data-gsap="testimonial-card-glow"]');
        const quoteMarks = getScopedElements(group, '[data-gsap="testimonial-quote-mark"]');
        const copies = getScopedElements(group, '[data-gsap="testimonial-copy"]');
        const meta = getScopedElements(group, '[data-gsap="testimonial-meta"]');
        const avatars = getScopedElements(group, '[data-gsap="testimonial-avatar"]');
        if (!cards.length) {
          return;
        }

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: group,
            start: "top 86%",
            once: true,
          },
        });

        timeline.from(cards, {
          duration: 1.05,
          y: 28,
          scale: 0.965,
          opacity: 0,
          clipPath: "inset(0 0 16% 0 round 28px)",
          stagger: 0.16,
          ease: "power3.out",
          clearProps: "clipPath,opacity,transform",
        });

        if (glows.length) {
          timeline.from(
            glows,
            {
              duration: 0.95,
              opacity: 0,
              scale: 0.9,
              stagger: 0.16,
              ease: BASE_EASE,
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.1,
          );
        }

        if (quoteMarks.length) {
          timeline.from(
            quoteMarks,
            {
              duration: 0.78,
              scale: 0.7,
              y: 14,
              opacity: 0,
              stagger: 0.16,
              ease: "power3.out",
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.18,
          );
        }

        if (copies.length) {
          timeline.from(
            copies,
            {
              duration: 0.92,
              y: 16,
              opacity: 0,
              stagger: 0.16,
              ease: BASE_EASE,
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.24,
          );
        }

        if (avatars.length) {
          timeline.from(
            avatars,
            {
              duration: 0.82,
              scale: 0.82,
              opacity: 0,
              stagger: 0.16,
              ease: "power3.out",
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.34,
          );
        }

        if (meta.length) {
          timeline.from(
            meta,
            {
              duration: 0.82,
              y: 12,
              opacity: 0,
              stagger: 0.16,
              ease: BASE_EASE,
              clearProps: REVEAL_CLEAR_PROPS,
            },
            0.38,
          );
        }

        cards.forEach((card, index) => {
          gsap.to(card, {
            yPercent: index % 2 === 0 ? -2.5 : -4,
            ease: "none",
            scrollTrigger: {
              trigger: group,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          });
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-gsap="footer-panel"]').forEach((panel, index) => {
        gsap.from(panel, {
          duration: 1.1,
          y: 22,
          opacity: 0,
          ease: BASE_EASE,
          delay: index * 0.12,
          clearProps: REVEAL_CLEAR_PROPS,
          scrollTrigger: {
            trigger: panel,
            start: "top 92%",
            once: true,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-gsap="footer-bottom"]').forEach((panel) => {
        gsap.from(panel, {
          duration: 1,
          y: 18,
          opacity: 0,
          ease: BASE_EASE,
          clearProps: REVEAL_CLEAR_PROPS,
          scrollTrigger: {
            trigger: panel,
            start: "top 94%",
            once: true,
          },
        });
      });

      ScrollTrigger.refresh();
    }, scope);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      ctx.revert();
    };
  }, [scope]);
};
