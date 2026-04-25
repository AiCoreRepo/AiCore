import { RefObject, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BASE_EASE = "power2.out";
const REVEAL_CLEAR_PROPS = "opacity,transform,visibility,filter";

const getScopedElements = (container: HTMLElement, selector: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(selector));

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
          bgSelector:
            '[data-gsap="pick-image"], [data-gsap="aura-image"], [data-gsap="ecosystem-image"]',
        },
      );

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

      const heroSection = document.querySelector<HTMLElement>("#hero");
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
        if (!cards.length) {
          return;
        }

        gsap.from(cards, {
          duration: 1.1,
          y: 24,
          opacity: 0,
          stagger: 0.16,
          ease: BASE_EASE,
          clearProps: REVEAL_CLEAR_PROPS,
          scrollTrigger: {
            trigger: group,
            start: "top 88%",
            once: true,
          },
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
